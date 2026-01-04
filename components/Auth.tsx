
import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, Fingerprint, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate auth check
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      // Fast transition to app view
      setTimeout(onLogin, 800);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm animate-enter relative z-10">
        <div className="bg-[#0F172A] border border-[#1E293B] p-10 text-center rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl mb-8 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
               <Fingerprint size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">Craftly Portal</h1>
            <p className="text-[10px] font-black text-slate-500 mt-4 uppercase tracking-[0.3em]">Identity Verification Required</p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-left space-y-2.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Terminal Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input 
                    type="email" 
                    placeholder="you@company.com"
                    className="w-full bg-[#020617] border border-[#1E293B] rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full bg-indigo-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-3">
                <p className="text-lg font-black text-white uppercase tracking-tight">Access Granted</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Syncing Workspace...</p>
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-800/50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
               <ShieldCheck size={14} className="text-emerald-500" /> AES-256 Protected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
