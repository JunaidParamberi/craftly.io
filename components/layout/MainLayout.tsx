
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, Link, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import { 
  Bell, Sun, Moon, Monitor, ChevronRight, Activity, 
  LayoutDashboard, Briefcase, CreditCard, MessageSquare, 
  Menu, X, Users, Receipt, BarChart3, Box, 
  Calendar as CalendarIcon, Settings as SettingsIcon,
  LogOut, ShieldCheck, UserCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useBusiness } from '../../context/BusinessContext.tsx';
import CommandPalette from '../CommandPalette.tsx';
import NotificationsOverlay from '../NotificationsOverlay.tsx';
import AuditLogs from '../AuditLogs.tsx';
import { ToastContainer } from '../ui/Toast.tsx';
import { View, Theme } from '../../types.ts';

const ThemeSwitcher: React.FC<{ variant?: 'header' | 'drawer' }> = ({ variant = 'header' }) => {
  const { theme, setTheme } = useTheme();
  
  const modes: { id: Theme; icon: any; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'Auto' }
  ];

  const activeIndex = modes.findIndex(m => m.id === theme);
  const CurrentIcon = modes[activeIndex].icon;

  const handleCycle = () => {
    const nextIndex = (activeIndex + 1) % modes.length;
    setTheme(modes[nextIndex].id);
  };

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
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTheme(mode.id as any)}
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
    <div className="relative flex items-center justify-center">
      <button 
        onClick={handleCycle}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--accent)] hover:border-[var(--accent)] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm"
        title={`Theme: ${theme}. Click to cycle.`}
      >
        <CurrentIcon size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('craftly_sidebar_collapsed') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('craftly_sidebar_width');
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);

  const { direction } = useTheme();
  const { userProfile, notifications, markNotifRead, toasts, removeToast } = useBusiness();
  const location = useLocation();
  const navigate = useNavigate();

  // Resize Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

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
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleToggleSidebar = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('craftly_sidebar_collapsed', nextValue.toString());
  };

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(Boolean)[0] || 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isNotificationsOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (isAuditLogsOpen && auditRef.current && !auditRef.current.contains(e.target as Node)) {
        setIsAuditLogsOpen(false);
      }
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
      [View.DASHBOARD]: '/dashboard',
      [View.CRM]: '/clients',
      [View.PROPOSALS]: '/projects',
      [View.PROJECTS]: '/projects',
      [View.FINANCE]: '/invoices',
      [View.LPO]: '/lpo',
      [View.CATALOG]: '/services',
      [View.CALENDAR]: '/calendar',
      [View.CHAT]: '/ai-help',
      [View.SETTINGS]: '/settings',
      [View.PROFILE]: '/profile',
      [View.REPORTS]: '/reports',
    };
    if (paths[view]) {
      navigate(paths[view]);
      setIsMoreMenuOpen(false);
      setIsNotificationsOpen(false);
      setIsAuditLogsOpen(false);
    }
  };

  const mobileNavItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: Briefcase },
    { path: '/invoices', label: 'Invoice', icon: CreditCard },
    { path: '/ai-help', label: 'AI', icon: MessageSquare },
  ];

  const moreMenuActions = [
    { path: '/clients', label: 'Clients', icon: Users, role: ['OWNER'] },
    { path: '/lpo', label: 'P.O Registry', icon: Receipt, role: ['OWNER', 'CLIENT'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, role: ['OWNER'] },
    { path: '/services', label: 'Services', icon: Box, role: ['OWNER', 'EMPLOYEE'] },
    { path: '/expenses', label: 'Expenses', icon: Receipt, role: ['OWNER'] },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon, role: ['OWNER', 'EMPLOYEE'] },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, role: ['OWNER'] },
    { path: '/profile', label: 'Profile', icon: UserCircle, role: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
  ];

  return (
    <div className={`
      flex h-screen w-full bg-[var(--bg-canvas)] transition-colors duration-500 overflow-hidden 
      ${direction === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row'}
      ${isResizing ? 'cursor-col-resize select-none' : ''}
    `}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={handleToggleSidebar} 
        width={sidebarWidth}
        onResizeStart={startResizing}
        isResizing={isResizing}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-canvas)]">
        {/* Superior Responsive Header */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-3 lg:px-10 bg-[var(--bg-card)] border-b border-[var(--border-ui)] shrink-0 relative z-header shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="lg:hidden w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
              <div className="w-3 h-3 bg-white rounded-sm rotate-12" />
            </div>
            <div className={`flex items-center gap-1.5 lg:gap-3 text-[8px] lg:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <span className="opacity-40 hidden sm:inline">Portal</span>
              <ChevronRight size={10} className={`opacity-40 hidden sm:inline ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              <span className="text-[var(--text-primary)] uppercase truncate max-w-[80px] lg:max-w-none">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 lg:gap-5 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-1 lg:gap-3">
              <div className="relative" ref={auditRef}>
                <button 
                  onClick={() => { setIsAuditLogsOpen(!isAuditLogsOpen); setIsNotificationsOpen(false); }} 
                  className={`p-2 transition-all rounded-xl ${isAuditLogsOpen ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-muted)]'}`}
                  title="Audit Log"
                >
                  <Activity size={18} />
                </button>
                <AuditLogs 
                  isOpen={isAuditLogsOpen}
                  onClose={() => setIsAuditLogsOpen(false)}
                  onNavigate={handleViewSelect}
                />
              </div>
              
              <ThemeSwitcher variant="header" />

              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsAuditLogsOpen(false); }}
                  className={`relative p-2 transition-all rounded-xl ${isNotificationsOpen ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-muted)]'}`}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[7px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsOverlay 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)} 
                  notifications={notifications}
                  onMarkRead={markNotifRead}
                  onNavigate={handleViewSelect}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-[var(--border-ui)] hidden md:block" />

            <Link to="/profile" className={`flex items-center gap-2 lg:gap-3 group cursor-pointer shrink-0 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className={`text-right hidden lg:block ${direction === 'rtl' ? 'text-left' : 'text-right'}`}>
                <p className="text-[10px] font-black uppercase text-[var(--text-primary)] leading-tight">{userProfile.fullName.split(' ')[0]}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{userProfile.role}</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center group-hover:border-[var(--accent)] transition-all overflow-hidden shadow-sm">
                {userProfile.avatarUrl ? (
                   <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <UserCircle size={20} className="text-[var(--text-secondary)]" />
                )}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scroll relative z-0 pb-24 lg:pb-10">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden px-4 pb-6 pt-2 z-[2000] pointer-events-none">
          <div className="bg-[var(--bg-card)]/90 border border-[var(--border-ui)] rounded-[2.5rem] px-2 h-16 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl pointer-events-auto">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={(navProps) => `
                  flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all relative
                  ${navProps.isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}
                `}
              >
                {(navProps) => (
                  <>
                    <item.icon size={20} strokeWidth={navProps.isActive ? 2.5 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                    {navProps.isActive && <div className="absolute -bottom-1 w-1 h-1 bg-[var(--accent)] rounded-full" />}
                  </>
                )}
              </NavLink>
            ))}
            <button 
              onClick={() => setIsMoreMenuOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all ${isMoreMenuOpen ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
            >
              <Menu size={20} strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">Menu</span>
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md animate-enter" onClick={() => setIsMoreMenuOpen(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-ui)] rounded-t-[3.5rem] p-8 pb-12 animate-pop-in max-h-[90vh] overflow-y-auto custom-scroll shadow-[0_-25px_80px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-1.5 bg-[var(--border-ui)]/50 rounded-full mx-auto -mt-4 mb-10" />
              
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Control Panel</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Active Session: {userProfile.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-4 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl text-[var(--text-secondary)] hover:text-rose-500 transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-12">
                {moreMenuActions.filter(item => item.role.includes(userProfile.role)).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={(navProps) => `
                      flex flex-col items-center justify-center p-4 rounded-[2rem] border transition-all aspect-square gap-3
                      ${navProps.isActive 
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xl shadow-indigo-500/20' 
                        : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-[var(--text-secondary)] hover:border-[var(--accent)]'}
                    `}
                  >
                    {(navProps) => (
                      <>
                        <item.icon size={26} strokeWidth={navProps.isActive ? 2.5 : 2} />
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-center leading-none">
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Preferences in Drawer */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] ml-2 block">Environment Theme</span>
                  <ThemeSwitcher variant="drawer" />
                </div>

                <button 
                  onClick={() => { setIsMoreMenuOpen(false); setIsAuditLogsOpen(true); }}
                  className="w-full flex items-center justify-between p-6 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2rem] text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Activity size={20}/>
                    </div>
                    <span className="uppercase tracking-[0.2em] text-[10px] font-black">Audit History</span>
                  </div>
                </button>

                <div className="pt-6">
                  <button className="w-full p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] flex items-center justify-center gap-3 text-rose-500 active:scale-95 transition-all group font-black uppercase tracking-[0.3em] text-[10px]">
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    Decommission Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelect={handleViewSelect}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default MainLayout;
