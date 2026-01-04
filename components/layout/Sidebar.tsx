
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, CreditCard, 
  Settings as SettingsIcon, Box, MessageSquare, Receipt,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  BarChart3, UserCircle
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext.tsx';

const allNavItems = [
  { path: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
  { path: '/clients', labelKey: 'clients', icon: Users, roles: ['OWNER'] },
  { path: '/projects', labelKey: 'projects', icon: Briefcase, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
  { path: '/invoices', labelKey: 'invoices', icon: CreditCard, roles: ['OWNER', 'CLIENT'] },
  { path: '/lpo', labelKey: 'lpo_registry', icon: Receipt, roles: ['OWNER', 'CLIENT'] },
  { path: '/reports', labelKey: 'reports', icon: BarChart3, roles: ['OWNER'] },
  { path: '/services', labelKey: 'services', icon: Box, roles: ['OWNER', 'EMPLOYEE'] },
  { path: '/expenses', labelKey: 'expenses', icon: Receipt, roles: ['OWNER'] },
  { path: '/calendar', labelKey: 'calendar', icon: CalendarIcon, roles: ['OWNER', 'EMPLOYEE'] },
  { path: '/ai-help', labelKey: 'ai_assistant', icon: MessageSquare, roles: ['OWNER'] },
  { path: '/settings', labelKey: 'settings', icon: SettingsIcon, roles: ['OWNER'] },
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
  
  const currentRole = userProfile?.role || 'OWNER';
  const filteredNavItems = allNavItems.filter(item => item.roles.includes(currentRole));

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
      {/* Header */}
      <div className="h-20 flex items-center px-5 shrink-0 border-b border-[var(--border-ui)]/50 bg-[var(--bg-card)] z-10">
        <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
           {userProfile.branding?.logoUrl ? (
             <img src={userProfile.branding.logoUrl} className="w-full h-full object-contain rounded-xl" />
           ) : (
             <div className="w-4 h-4 bg-white rounded-sm rotate-12" />
           )}
        </div>
        {!isCollapsed && (
          <div className="mx-4 animate-enter overflow-hidden flex-1">
            <span className="font-black text-lg tracking-tighter uppercase block leading-none truncate">{userProfile.companyName || 'Craftly'}</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 block truncate">Management</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scroll">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative
              ${isActive 
                ? 'bg-[var(--accent)] text-white shadow-xl shadow-indigo-500/15' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--text-primary)]'}
            `}
          >
            <item.icon size={20} strokeWidth={2.2} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{t(item.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile & Toggle */}
      <div className="p-4 border-t border-[var(--border-ui)]/50 space-y-3 bg-[var(--bg-canvas)]/30 shrink-0">
        <div className="px-2 py-4 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-[var(--border-ui)]">
             {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle size={20} className="m-auto mt-1 text-slate-400" />}
           </div>
           {!isCollapsed && (
             <div className="min-w-0 flex-1">
               <p className="text-[10px] font-black uppercase truncate">{userProfile.fullName}</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase">{userProfile.role}</p>
             </div>
           )}
        </div>
        <button 
          onClick={onToggle}
          className="w-full h-14 border border-[var(--border-ui)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] transition-all bg-[var(--bg-card)] shadow-sm active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div 
          onMouseDown={onResizeStart}
          className={`
            absolute top-0 right-0 w-1 h-full cursor-col-resize group z-[100]
            hover:bg-indigo-500/50 transition-colors
            ${isResizing ? 'bg-indigo-500' : ''}
          `}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
