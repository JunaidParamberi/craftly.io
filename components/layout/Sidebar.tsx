import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, CreditCard, 
  Settings as SettingsIcon, Box, Receipt,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  BarChart3, UserCircle, Zap, LogOut, Sparkles, ShieldCheck,
  MessageCircle
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import ConfirmationModal from '../ConfirmationModal';

const allNavItems = [
  { path: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OWNER', 'EMPLOYEE', 'CLIENT'] },
  { path: '/clients', labelKey: 'clients', icon: Users, permissions: ['MANAGE_CLIENTS', 'MANAGE_CAMPAIGNS'] },
  { path: '/projects', labelKey: 'projects', icon: Briefcase, permission: 'MANAGE_PROJECTS' },
  { path: '/invoices', labelKey: 'invoices', icon: CreditCard, permission: 'MANAGE_FINANCE' },
  { path: '/lpo', labelKey: 'lpo_registry', icon: Receipt, permission: 'MANAGE_FINANCE' },
  { path: '/team-chat', labelKey: 'team_hub', icon: MessageCircle, roles: ['SUPER_ADMIN', 'OWNER', 'EMPLOYEE'] },
  { path: '/reports', labelKey: 'reports', icon: BarChart3, permission: 'MANAGE_FINANCE' },
  { path: '/services', labelKey: 'services', icon: Box, permission: 'MANAGE_CATALOG' },
  { path: '/expenses', labelKey: 'expenses', icon: Receipt, permission: 'MANAGE_EXPENSES' },
  { path: '/calendar', labelKey: 'calendar', icon: CalendarIcon, permission: 'MANAGE_PROJECTS' },
  { path: '/provisioning', labelKey: 'provisioning', icon: ShieldCheck, permission: 'MANAGE_PROVISIONING' },
  { path: '/ai-help', labelKey: 'ai_assistant', icon: Sparkles, permission: 'ACCESS_AI' },
  { path: '/settings', labelKey: 'settings', icon: SettingsIcon, roles: ['SUPER_ADMIN', 'OWNER'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, width, onResizeStart, isResizing }) => {
  const { t, userProfile } = useBusiness();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  const currentRole = userProfile?.role || 'EMPLOYEE';
  const isOwner = currentRole === 'OWNER' || currentRole === 'SUPER_ADMIN';
  
  // Robust re-calculation when permissions change
  const filteredNavItems = useMemo(() => {
    const userPermissions = userProfile?.permissions || [];
    return allNavItems.filter(item => {
      // 1. Owners/Admins see everything
      if (isOwner) return true;
      
      // 2. Check multi-permission requirement (ANY of)
      if ((item as any).permissions) {
        return (item as any).permissions.some((p: string) => userPermissions.includes(p));
      }

      // 3. Check explicit single permission requirement
      if ((item as any).permission) {
        return userPermissions.includes((item as any).permission);
      }
      
      // 4. Check role fallback
      if (item.roles) {
        return item.roles.includes(currentRole);
      }
      
      return false;
    });
  }, [userProfile?.role, JSON.stringify(userProfile?.permissions), isOwner, currentRole]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (e) {
      console.error("Sidebar Logout Error:", e);
    }
  };

  return (
    <aside 
      style={{ width: isCollapsed ? '80px' : `${width}px` }}
      className={`
        relative h-screen bg-[var(--bg-card)] border-r border-[var(--border-ui)] 
        flex flex-col z-sidebar shrink-0 overflow-hidden
        ${!isResizing ? 'transition-[width] duration-300 ease-in-out' : ''}
        hidden lg:flex
      `}
    >
      <div className="h-20 flex items-center px-5 shrink-0 border-b border-[var(--border-ui)]/50 bg-[var(--bg-card)] z-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
           <Zap size={20} className="text-white fill-white" />
        </div>
        {!isCollapsed && (
          <div className="mx-4 animate-enter overflow-hidden flex-1">
            <span className="font-black text-lg tracking-tighter uppercase block leading-none truncate">Craftly</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 block truncate">App</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scroll">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => {
              return `
                flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative
                ${isActive 
                  ? 'bg-[var(--accent)] text-white shadow-xl shadow-indigo-500/15' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--text-primary)]'}
              `;
            }}
          >
            <item.icon size={20} strokeWidth={2.2} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {t(item.labelKey) || item.labelKey.replace('_', ' ')}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-ui)]/50 space-y-3 bg-[var(--bg-canvas)]/30 shrink-0">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => setIsLogoutConfirmOpen(true)}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-rose-500 hover:bg-rose-500/10 group relative`}
            title="Log Out"
          >
            <LogOut size={20} strokeWidth={2.2} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-tight uppercase tracking-widest text-[10px]">Log Out</span>
            )}
          </button>
        </div>

        <div className="px-2 py-4 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-[var(--border-ui)]">
             {userProfile?.avatarUrl ? (
               <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="User" />
             ) : (
               <UserCircle size={20} className="m-auto mt-1 text-slate-400" />
             )}
           </div>
           {!isCollapsed && (
             <div className="min-w-0 flex-1">
               <p className="text-[10px] font-black uppercase truncate">{userProfile?.fullName || 'User'}</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase">{userProfile?.role || 'Member'}</p>
             </div>
           )}
        </div>
        <button 
          onClick={onToggle}
          className="w-full h-14 border border-[var(--border-ui)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] transition-all bg-[var(--bg-card)] shadow-sm active:scale-95"
        >
          {isCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="Log Out"
        message="Are you sure you want to log out? You will need to sign in again to access your data."
        confirmLabel="Log Out"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;