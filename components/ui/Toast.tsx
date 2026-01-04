
import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../../types';

export const Toast: React.FC<{ toast: ToastType; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-rose-500" size={18} />,
    info: <Info className="text-indigo-500" size={18} />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-rose-500/10 border-rose-500/20',
    info: 'bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${bgColors[toast.type]} backdrop-blur-xl shadow-2xl animate-pop-in pointer-events-auto min-w-[300px] max-w-md`}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">
        {toast.message}
      </p>
      <button 
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:bg-black/5 rounded-lg transition-colors opacity-40 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastType[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-10 right-10 z-[30000] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
