
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider, useBusiness } from './context/BusinessContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import Dashboard from './components/Dashboard.tsx';
import CRM from './components/CRM.tsx';
import ClientDetail from './components/ClientDetail.tsx';
import Finance from './components/Finance.tsx';
import Catalog from './components/Catalog.tsx';
import ChatRoom from './components/ChatRoom.tsx';
import TeamChat from './components/TeamChat.tsx';
import Proposals from './components/Proposals.tsx';
import ProjectDetail from './components/ProjectDetail.tsx';
import Expenses from './components/Expenses.tsx';
import Settings from './components/Settings.tsx';
import Profile from './components/Profile.tsx';
import CalendarView from './components/CalendarView.tsx';
import Reports from './components/Reports.tsx';
import Auth from './components/Auth.tsx';
import Onboarding from './components/Onboarding.tsx';
import UserProvisioning from './components/UserProvisioning.tsx';
import JoinInvite from './components/JoinInvite.tsx';
import { Zap, Loader2, ShieldCheck, Database, Cpu, Sparkles, Fingerprint } from 'lucide-react';

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
    const progress = ((loadingStep + 1) / steps.length) * 100;

    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 gap-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(79,70,229,0.3)] animate-pulse border border-white/10">
            <currentStep.icon size={40} className="text-white transition-all duration-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-2xl">
            <Loader2 size={18} className="text-indigo-400 animate-spin" />
          </div>
        </div>

        <div className="w-full max-w-[320px] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-white animate-enter">
              {currentStep.label}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 animate-enter [animation-delay:0.1s] opacity-60">
              {currentStep.sub}
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between px-1">
               <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-[8px] font-black text-indigo-500/50 uppercase tracking-[0.3em]">System Sync</span>
               </div>
               <span className="text-[8px] font-black text-indigo-500/50 uppercase tracking-widest tabular-nums">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. If not logged in -> Redirect to Auth
  if (!user) {
    return (
      <Routes>
        <Route path="join" element={<JoinInvite />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // 2. If logged in but no profile exists -> Mandatory Onboarding
  if (userProfile === null) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // 3. Evaluate Setup Requirement: Only Owners/Admins need to finish onboarding.
  // Clients and Employees are fast-tracked to the Dashboard.
  const isAuthority = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const requiresSetup = isAuthority && !userProfile?.onboarded;

  if (requiresSetup) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // 4. Main Application Layout
  return (
    <Routes>
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
        <Route path="settings" element={<Settings globalLanguage="EN" onLanguageChange={() => {}} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="provisioning" element={<UserProvisioning />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <HashRouter>
          <RootNavigator />
        </HashRouter>
      </BusinessProvider>
    </ThemeProvider>
  );
};

export default App;
