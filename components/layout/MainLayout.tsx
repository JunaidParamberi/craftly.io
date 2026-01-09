import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, useLocation, Link, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { 
  Bell, Sun, Moon, Monitor, ChevronRight, Activity, 
  LayoutDashboard, Briefcase, CreditCard, 
  Menu, X, Users, Receipt, BarChart3, Box, 
  Calendar as CalendarIcon, Settings as SettingsIcon,
  LogOut, ShieldCheck, UserCircle, Sparkles, MessageCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBusiness } from '../../context/BusinessContext';
import CommandPalette from '../CommandPalette';
import NotificationsOverlay from '../NotificationsOverlay';
import AuditLogs from '../AuditLogs';
import { ToastContainer } from '../ui/Toast';
import { View, Theme, UserRole } from '../../types';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import ConfirmationModal from '../ConfirmationModal';

const THEME_MODES: { id: Theme; icon: any; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'Auto' }
];

const MOBILE_NAV_ITEMS: { path: string; label: string; icon: any; roles?: UserRole[]; permission?: string }[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OWNER', 'EMPLOYEE', 'CLIENT'] },
  { path: '/team-chat', label: 'Team Hub', icon: MessageCircle, roles: ['SUPER_ADMIN', 'OWNER', 'EMPLOYEE'] },
  { path: '/projects', label: 'Projects', icon: Briefcase, permission: 'MANAGE_PROJECTS' },
  { path: '/invoices', label: 'Invoices', icon: CreditCard, permission: 'MANAGE_FINANCE' },
  { path: '/ai-help', label: 'Craftly AI', icon: Sparkles, permission: 'ACCESS_AI' },
];

const MORE_MENU_ACTIONS = [
  { path: '/clients', label: 'Clients', icon: Users, permission: 'MANAGE_CLIENTS' },
  { path: '/lpo', label: 'LPOs', icon: Receipt, permission: 'MANAGE_FINANCE' },
  { path: '/reports', label: 'Reports', icon: BarChart3, permission: 'MANAGE_FINANCE' },
  { path: '/services', label: 'Services', icon: Box, permission: 'MANAGE_CATALOG' },
  { path: '/expenses', label: 'Expenses', icon: Receipt, permission: 'MANAGE_EXPENSES' },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon, permission: 'MANAGE_PROJECTS' },
  { path: '/provisioning', label: 'Provisioning', icon: ShieldCheck, permission: 'MANAGE_PROVISIONING' },
  { path: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['OWNER'] },
  { path: '/profile', label: 'Profile', icon: UserCircle, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
];

const ThemeSwitcher: React.FC<{ variant?: 'header' | 'drawer' }> = ({ variant = 'header' }) => {
  const { theme, setTheme } = useTheme();
  const activeIndex = THEME_MODES.findIndex((m) => m.id === theme);
  const CurrentIcon = THEME_MODES[activeIndex].icon;

  if (variant === 'drawer') {
    return (
      <div className="bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2rem] p-1.5 flex items-center relative h-16 w-full shadow-inner">
        <div 
          className="absolute h-[calc(100%-12px)] rounded-2xl bg-[var(--accent)] shadow-xl shadow-indigo-500/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0"
          style={{ 
            width: `calc((100% - 12px) / 3)`, 
            left: `calc(6px + (${activeIndex} * (100% - 12px) / 3))` 
          }}
        />
        {THEME_MODES.map((mode) => (
          <button 
            key={mode.id} 
            onClick={() => setTheme(mode.id)} 
            className={`relative z-10 flex-1 flex flex-col items-center justify-center transition-all duration-300 ${theme === mode.id ? 'text-white scale-110' : 'text-[var(--text-secondary)] opacity-50 hover:opacity-100'}`}
          >
            <mode.icon size={18} strokeWidth={2.5} />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">{mode.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <button onClick={() => setTheme(THEME_MODES[(activeIndex + 1) % THEME_MODES.length].id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--accent)] hover:scale-105 active:scale-95 transition-all shadow-sm">
      <CurrentIcon size={18} strokeWidth={2.5} />
    </button>
  );
};

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('craftly_sidebar_collapsed') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('craftly_sidebar_width') || '256', 10));
  const [isResizing, setIsResizing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const { direction } = useTheme();
  const { userProfile, notifications, markNotifRead, toasts, removeToast, showToast } = useBusiness();
  const location = useLocation();
  const navigate = useNavigate();

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const permissionsStr = JSON.stringify(userProfile?.permissions || []);

  // REAL-TIME CLEARANCE MONITOR: Detect changes to permissions registry
  const lastPermsRef = useRef<string>(permissionsStr);
  useEffect(() => {
    if (userProfile && lastPermsRef.current !== permissionsStr) {
      showToast('Identity Clearance Updated. Synchronizing Registry...', 'info');
      lastPermsRef.current = permissionsStr;
    }
  }, [permissionsStr, userProfile, showToast]);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = direction === 'rtl' ? window.innerWidth - e.clientX : e.clientX;
      if (newWidth >= 200 && newWidth <= 480) {
        setSidebarWidth(newWidth);
        localStorage.setItem('craftly_sidebar_width', newWidth.toString());
      }
    }
  }, [isResizing, direction]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', () => setIsResizing(false));
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', () => setIsResizing(false));
    };
  }, [resize]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const filteredMobileNav = useMemo(() => {
    const userPermissions = userProfile?.permissions || [];
    return MOBILE_NAV_ITEMS.filter(item => {
      if (isOwner) return true;
      if (item.permission) return userPermissions.includes(item.permission);
      if (item.roles) {
        const uRole = (userProfile?.role || 'EMPLOYEE').toUpperCase();
        return item.roles.some(r => r.toUpperCase() === uRole);
      }
      return false;
    });
  }, [userProfile?.role, permissionsStr, isOwner]);

  const filteredMoreMenu = useMemo(() => {
    const userPermissions = userProfile?.permissions || [];
    return MORE_MENU_ACTIONS.filter(item => {
      if (isOwner) return true;
      if (item.permission) return userPermissions.includes(item.permission);
      if (item.roles) {
        const uRole = (userProfile?.role || 'EMPLOYEE').toUpperCase();
        return item.roles.some(r => r.toUpperCase() === uRole);
      }
      return false;
    });
  }, [userProfile?.role, permissionsStr, isOwner]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandPaletteOpen(true); }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (isNotificationsOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotificationsOpen(false);
      if (isAuditLogsOpen && auditRef.current && !auditRef.current.contains(e.target as Node)) setIsAuditLogsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen, isAuditLogsOpen]);

  const handleViewSelect = (view: View) => {
    const paths: Record<string, string> = { 
      [View.DASHBOARD]: '/dashboard', [View.CRM]: '/clients', 
      [View.PROJECTS]: '/projects', [View.PROPOSALS]: '/projects', 
      [View.FINANCE]: '/invoices', [View.LPO]: '/lpo', 
      [View.CATALOG]: '/services', [View.CALENDAR]: '/calendar', 
      [View.CHAT]: '/ai-help', [View.SETTINGS]: '/settings', 
      [View.PROFILE]: '/profile', [View.REPORTS]: '/reports', 
      [View.TEAM_CHAT]: '/team-chat', [View.PROVISIONING]: '/provisioning' 
    };
    if (paths[view]) {
      navigate(paths[view]);
      setIsMoreMenuOpen(false);
      setIsNotificationsOpen(false);
      setIsAuditLogsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className={`flex h-screen w-full bg-[var(--bg-canvas)] transition-colors duration-500 overflow-hidden ${direction === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row'} ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={() => { const v = !isCollapsed; setIsCollapsed(v); localStorage.setItem('craftly_sidebar_collapsed', v.toString()); }} width={sidebarWidth} onResizeStart={(e) => { e.preventDefault(); setIsResizing(true); }} isResizing={isResizing} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-canvas)]">
        <header className="h-16 lg:h-20 flex items-center justify-between px-3 lg:px-10 bg-[var(--bg-card)] border-b border-[var(--border-ui)] shrink-0 relative z-header shadow-sm">
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="lg:hidden w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
              <div className="w-3 h-3 bg-white rounded-sm rotate-12" />
            </div>
            <div className={`flex items-center gap-1.5 lg:gap-3 text-[8px] lg:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <span className="opacity-40 hidden sm:inline">Portal</span>
              <ChevronRight size={10} className="opacity-40 hidden sm:inline" />
              <span className="text-[var(--text-primary)] uppercase truncate max-w-[80px] lg:max-w-none">{location.pathname.split('/').filter(Boolean)[0] || 'App'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-5">
            <div className="flex items-center gap-1 lg:gap-3">
              <div className="relative" ref={auditRef}>
                <button onClick={() => { setIsAuditLogsOpen(!isAuditLogsOpen); setIsNotificationsOpen(false); }} className={`p-2 rounded-xl transition-all ${isAuditLogsOpen ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-muted)]'}`}>
                  <Activity size={18} />
                </button>
                <AuditLogs isOpen={isAuditLogsOpen} onClose={() => setIsAuditLogsOpen(false)} onNavigate={handleViewSelect} />
              </div>
              <ThemeSwitcher variant="header" />
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsAuditLogsOpen(false); }} className={`relative p-2 rounded-xl transition-all ${isNotificationsOpen ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-muted)]'}`}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[7px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsOverlay isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkRead={markNotifRead} onNavigate={handleViewSelect} />
              </div>
            </div>
            <Link to="/profile" className="flex items-center gap-2 lg:gap-3 group shrink-0">
              <div className="text-right hidden lg:block">
                <p className="text-[10px] font-black uppercase text-[var(--text-primary)] leading-tight">{userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'User'}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{userProfile?.role || 'Member'}</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center group-hover:border-[var(--accent)] overflow-hidden shadow-sm">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={20} className="text-[var(--text-secondary)]" />
                )}
              </div>
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scroll relative z-0 pb-32 lg:pb-10">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden px-4 pb-8 pt-2 z-[2000] pointer-events-none">
          <div className="bg-[var(--bg-card)]/90 border border-[var(--border-ui)] rounded-[2.5rem] px-2 h-18 flex items-center justify-between shadow-2xl backdrop-blur-xl pointer-events-auto relative">
            {filteredMobileNav.map((item) => (
              <NavLink key={item.path} to={item.path} className="flex-1">
                {({ isActive }) => (
                  <div className={`flex flex-col items-center justify-center gap-1 p-2 transition-all relative ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[7px] font-black uppercase tracking-[0.1em] text-center">{item.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-2 w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]" />
                    )}
                  </div>
                )}
              </NavLink>
            ))}
            <button onClick={() => setIsMoreMenuOpen(true)} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 transition-all ${isMoreMenuOpen ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
              <Menu size={20} strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
              <span className="text-[7px] font-black uppercase tracking-[0.1em] text-center">More</span>
            </button>
          </div>
        </nav>
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md animate-enter" onClick={() => setIsMoreMenuOpen(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-ui)] rounded-t-[3.5rem] p-8 pb-12 animate-pop-in max-h-[90vh] overflow-y-auto custom-scroll shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-1.5 bg-[var(--border-ui)]/50 rounded-full mx-auto -mt-4 mb-10" />
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Menu</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{userProfile?.role || 'OWNER'} Node</p>
                  </div>
                </div>
                <button onClick={() => setIsMoreMenuOpen(false)} className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl text-[var(--text-secondary)]">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-12">
                {filteredMoreMenu.map(item => (
                  <NavLink key={item.path} to={item.path} onClick={() => setIsMoreMenuOpen(false)} className="aspect-square">
                    {({ isActive }) => (
                      <div className={`flex flex-col items-center justify-center h-full p-4 rounded-[2rem] border transition-all gap-3 ${isActive ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xl' : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-[var(--text-secondary)]'}`}>
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-center leading-none">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] ml-2 block">Settings</span>
                  <ThemeSwitcher variant="drawer" />
                </div>
                <button onClick={() => { setIsMoreMenuOpen(false); setIsAuditLogsOpen(true); }} className="w-full flex items-center justify-between p-6 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2rem] shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Activity size={20}/>
                    </div>
                    <span className="uppercase tracking-[0.2em] text-[10px] font-black">History</span>
                  </div>
                </button>
                <div className="pt-6">
                  <button onClick={() => { setIsMoreMenuOpen(false); setIsLogoutConfirmOpen(true); }} className="w-full p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-rose-500 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-rose-500/10 transition-all">
                    <LogOut size={20} />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onSelect={handleViewSelect} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmationModal isOpen={isLogoutConfirmOpen} title="Log Out" message="Are you sure you want to log out?" confirmLabel="Log Out" variant="danger" onConfirm={handleLogout} onCancel={() => setIsLogoutConfirmOpen(false)} />
    </div>
  );
};

export default MainLayout;