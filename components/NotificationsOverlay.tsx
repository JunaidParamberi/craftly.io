
import React from 'react';
import { X, Bell, Calendar, CreditCard, Zap, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Notification, View } from '../types';

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onNavigate: (view: View) => void;
}

const NotificationsOverlay: React.FC<NotificationsOverlayProps> = ({ 
  isOpen, onClose, notifications, onMarkRead, onNavigate 
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Mobile Backdrop */}
      <div className="lg:hidden fixed inset-0 z-[4999] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="
        fixed lg:absolute 
        top-[15%] lg:top-full 
        left-4 right-4 lg:left-auto lg:right-0 
        lg:mt-3 
        lg:w-[400px] 
        z-[5000] 
        animate-pop-in
      ">
        <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[70vh] lg:max-h-[calc(100vh-10rem)]">
          <header className="p-6 border-b border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bell size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)] leading-none">Intelligence</h3>
                  <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-1">
                    {unreadCount} UNREAD SIGNALS
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notif.id);
                    if (notif.link) onNavigate(notif.link);
                  }}
                  className={`p-5 rounded-[2rem] border transition-all cursor-pointer group active:scale-[0.98] ${notif.isRead ? 'bg-transparent border-transparent opacity-40' : 'bg-[var(--bg-canvas)] border-[var(--border-ui)] shadow-sm hover:border-[var(--accent)]'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl border shrink-0 flex items-center justify-center ${
                      notif.type === 'deadline' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      notif.type === 'finance' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    }`}>
                      {notif.type === 'deadline' ? <Calendar size={16} /> :
                       notif.type === 'finance' ? <CreditCard size={16} /> :
                       notif.type === 'update' ? <Zap size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                          {notif.title}
                        </h4>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-40 whitespace-nowrap ml-2">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-20">
                 <Bell size={48} className="mx-auto mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">COMMUNICATION BUFFER EMPTY</p>
              </div>
            )}
          </div>

          <footer className="p-4 border-t border-[var(--border-ui)] bg-[var(--bg-canvas)]/30 flex items-center justify-between shrink-0">
             <button 
               onClick={(e) => { e.stopPropagation(); notifications.forEach(n => onMarkRead(n.id)); }}
               className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
             >
               Purge Alerts
             </button>
             <div className="flex items-center gap-2 pr-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-30">ENCRYPTED SYNC</span>
             </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default NotificationsOverlay;
