
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Primitives.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, 
  title, 
  message, 
  confirmLabel = 'Confirm Action', 
  onConfirm, 
  onCancel, 
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="exec-modal-overlay">
      <div className="w-full max-w-md exec-modal-container overflow-hidden animate-pop-in border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[var(--bg-card)]">
           <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">{title}</h3>
           </div>
           <button 
             onClick={onCancel} 
             className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
           >
             <X size={20} />
           </button>
        </div>
        
        <div className="p-10 bg-[var(--bg-card)]">
          <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10">
            {message}
          </p>
          
          <div className="flex gap-4">
            <Button 
              onClick={onCancel} 
              variant="ghost" 
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10"
            >
              Discard
            </Button>
            <Button 
              onClick={onConfirm} 
              variant={variant === 'danger' ? 'danger' : 'primary'}
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-900/10"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
