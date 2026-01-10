
import { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider, useBusiness } from './context/BusinessContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { Zap, ShieldCheck, Database, Cpu, Sparkles, Fingerprint } from 'lucide-react';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const CRM = lazy(() => import('./components/CRM.tsx'));
const ClientDetail = lazy(() => import('./components/ClientDetail.tsx'));
const Finance = lazy(() => import('./components/Finance.tsx'));
const Catalog = lazy(() => import('./components/Catalog.tsx'));
const ChatRoom = lazy(() => import('./components/ChatRoom.tsx'));
const TeamChat = lazy(() => import('./components/TeamChat.tsx'));
const Proposals = lazy(() => import('./components/Proposals.tsx'));
const ProjectDetail = lazy(() => import('./components/ProjectDetail.tsx'));
const Expenses = lazy(() => import('./components/Expenses.tsx'));
const Settings = lazy(() => import('./components/Settings.tsx'));
const Profile = lazy(() => import('./components/Profile.tsx'));
const CalendarView = lazy(() => import('./components/CalendarView.tsx'));
const Reports = lazy(() => import('./components/Reports.tsx'));
const Auth = lazy(() => import('./components/Auth.tsx'));
const Onboarding = lazy(() => import('./components/Onboarding.tsx'));
const UserProvisioning = lazy(() => import('./components/UserProvisioning.tsx'));
const JoinInvite = lazy(() => import('./components/JoinInvite.tsx'));
const PublicInvoiceViewer = lazy(() => import('./components/PublicInvoiceViewer.tsx'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-6 gap-8">
    <div className="relative mb-4">
      <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(99,102,241,0.3)] animate-pulse border border-[var(--border-ui)]">
        <Loader2 size={40} className="text-white animate-spin" />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)]">
        Loading Module
      </h2>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-60">
        Initializing component...
      </p>
    </div>
  </div>
);

const RootNavigator = () => {
  const { user, userProfile, loading } = useBusiness();
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    { label: 'Establishing Connection', sub: 'Starting secure handshake', icon: Zap },
    { label: 'Verifying Credentials', sub: 'Authenticating your session', icon: ShieldCheck },
    { label: 'Syncing Profile Data', sub: 'Loading your identity registry', icon: Database },
    { label: 'Checking Permissions', sub: 'Validating security clearance', icon: Fingerprint },
    { label: 'Preparing Workspace', sub: 'Synthesizing dashboard nodes', icon: Sparkles },
    { label: 'Launching Terminal', sub: 'System ready for operation', icon: Cpu }
  ];

  useEffect(() => {
    // Hold loading screen if profile is unknown (undefined)
    if (loading || userProfile === undefined) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 450);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(steps.length - 1);
    }
  }, [loading, userProfile, steps.length]);

  // ABSOLUTE SYNC LOCK:
  // We stay on the loading screen until the user profile is either a valid object or explicitly null.
  const isSyncing = loading || (user && userProfile === undefined);

  if (isSyncing) {
    const currentStep = steps[loadingStep];
    const CurrentStepIcon = currentStep.icon;
    const progress = ((loadingStep + 1) / steps.length) * 100;

    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-6 gap-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(99,102,241,0.3)] animate-pulse border border-[var(--border-ui)]">
            <CurrentStepIcon size={40} className="text-white transition-all duration-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--bg-card-muted)] rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-2xl">
            <Loader2 size={18} className="text-indigo-400 animate-spin" />
          </div>
        </div>

        <div className="w-full max-w-[320px] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)] animate-enter">
              {currentStep.label}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] animate-enter [animation-delay:0.1s] opacity-60">
              {currentStep.sub}
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-1.5 w-full bg-[var(--bg-card-muted)] rounded-full overflow-hidden border border-[var(--border-ui)] shadow-inner">
              <div 
                className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between px-1">
               <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-[0.3em]">System Sync</span>
               </div>
               <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-widest tabular-nums">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. If not logged in -> Allow public routes (like public invoice viewer) or redirect to Auth
  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="public/invoice/:publicToken" element={<PublicInvoiceViewer />} />
          <Route path="join" element={<JoinInvite />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </Suspense>
    );
  }

  // 2. If logged in but no profile exists -> Mandatory Onboarding
  if (userProfile === null) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </Suspense>
    );
  }

  // 3. Evaluate Setup Requirement: Only Owners/Admins need to finish onboarding.
  // Clients and Employees are fast-tracked to the Dashboard.
  const isAuthority = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const requiresSetup = isAuthority && !userProfile?.onboarded;

  if (requiresSetup) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </Suspense>
    );
  }

  // 4. Main Application Layout
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes (accessible without auth) */}
        <Route path="public/invoice/:publicToken" element={<PublicInvoiceViewer />} />
        
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard theme="dark" />} />
          <Route path="clients" element={<CRM />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="projects" element={<Proposals />} />
          <Route path="projects/new" element={<Proposals forceNew />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="invoices" element={<Finance />} />
          <Route path="invoices/:id" element={<Finance />} />
          <Route path="lpo" element={<Finance isLpoView />} />
          <Route path="lpo/:id" element={<Finance isLpoView />} />
          <Route path="services" element={<Catalog />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="ai-help" element={<ChatRoom />} />
          <Route path="team-chat" element={<TeamChat />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="provisioning" element={<UserProvisioning />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BusinessProvider>
          <HashRouter>
            <RootNavigator />
          </HashRouter>
        </BusinessProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
