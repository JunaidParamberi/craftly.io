
import React from 'react';
import { X, Clock, Shield, Activity, ArrowRight } from 'lucide-react';
import { AuditEntry, View } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';

interface AuditLogsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ isOpen, onClose, onNavigate }) => {
  const { auditLogs, pushNotification } = useBusiness();

  if (!isOpen) return null;

  const handleLogClick = (log: AuditEntry) => {
    let targetView: View = View.DASHBOARD;
    
    switch (log.itemType.toUpperCase()) {
      case 'INVOICE':
        targetView = View.FINANCE;
        break;
      case 'CLIENT':
        targetView = View.CRM;
        break;
      case 'SERVICE':
        targetView = View.CATALOG;
        break;
      case 'PROJECT':
        targetView = View.PROPOSALS;
        break;
      case 'LPO':
        targetView = View.LPO;
        break;
      default:
        targetView = View.DASHBOARD;
    }

    pushNotification({
      title: 'Node Trace',
      description: `Accessing ${log.itemType} registry for ID: ${log.targetId}.`,
      type: 'update'
    });
    
    onNavigate(targetView);
    onClose();
  };

  const handleFullAudit = () => {
    onNavigate(View.REPORTS);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div className="lg:hidden fixed inset-0 z-[4999] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="
        fixed lg:absolute 
        top-[15%] lg:top-full 
        left-4 right-4 lg:left-auto lg:right-0 
        lg:mt-3 
        lg:w-[380px] 
        z-[5000] 
        animate-pop-in
      ">
        <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[70vh] lg:max-h-[calc(100vh-10rem)]">
          <header className="p-6 border-b border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                   <Activity size={18} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)] leading-none">Registry</h3>
                   <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-1">OPERATIONAL JOURNAL</p>
                 </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-all"><X size={20} /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
            {auditLogs.length > 0 ? auditLogs.map((log) => (
              <div 
                key={log.id} 
                onClick={() => handleLogClick(log)}
                className="p-5 rounded-[1.75rem] border border-[var(--border-ui)] bg-[var(--bg-canvas)]/30 hover:bg-[var(--bg-card-muted)]/50 hover:border-[var(--accent)] transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`} />
                     <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">{log.action}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 opacity-50 uppercase tracking-tighter tabular-nums">{log.timestamp}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-40">OBJECT TYPE</p>
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">{log.itemType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-40">NODE TRACE</p>
                    <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-tight truncate">{log.targetId}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-[var(--border-ui)]/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Direct Entry Access</span>
                   <ArrowRight size={12} className="text-[var(--accent)]" />
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-20">
                <Clock size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Journal Empty</p>
              </div>
            )}
          </div>

          <footer className="p-5 border-t border-[var(--border-ui)] bg-[var(--bg-canvas)]/30 shrink-0">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Shield size={14} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">AES-256 LOGGING</span>
                </div>
                <button 
                  onClick={handleFullAudit}
                  className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline active:scale-95 transition-transform"
                >
                  Reports Hub
                </button>
             </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AuditLogs;
