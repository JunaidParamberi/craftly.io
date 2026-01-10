
import React, { useState, useEffect } from 'react';
import { 
  Mail, ArrowRight, Loader2, 
  Fingerprint, ShieldCheck, Chrome, 
  Apple, AlertCircle, ChevronLeft,
  Lock, Globe, Zap, Circle
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  sendPasswordResetEmail,
  reload
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../services/firebase.ts';
import { Button, Input, Label } from './ui/Primitives.tsx';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'VERIFY_EMAIL';

const Auth: React.FC = () => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let interval: number | undefined;
    if (view === 'VERIFY_EMAIL' && auth.currentUser && !auth.currentUser.emailVerified) {
      interval = window.setInterval(async () => {
        try {
          if (auth.currentUser) {
            await reload(auth.currentUser);
            if (auth.currentUser.emailVerified) window.location.reload(); 
          }
        } catch (e) { console.error("Auth sync error:", e); }
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (view === 'LOGIN') {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (!userCred.user.emailVerified) setView('VERIFY_EMAIL');
      } else if (view === 'REGISTER') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Set redirect URL to app subdomain for email verification
        const actionCodeSettings = {
          url: `${window.location.origin.includes('app.craftlyai.app') ? window.location.origin : 'https://app.craftlyai.app'}/#/`,
          handleCodeInApp: false
        };
        await sendEmailVerification(userCred.user, actionCodeSettings);
        setView('VERIFY_EMAIL');
      } else if (view === 'FORGOT_PASSWORD') {
        // Set redirect URL to app subdomain for password reset
        const actionCodeSettings = {
          url: `${window.location.origin.includes('app.craftlyai.app') ? window.location.origin : 'https://app.craftlyai.app'}/#/`,
          handleCodeInApp: false
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setSuccessMsg('RECOVERY PACKET DISPATCHED.');
        setTimeout(() => setView('LOGIN'), 3000);
      }
    } catch (err: any) {
      const msg = err.code ? err.code.split('/')[1].replace(/-/g, ' ') : 'AUTH FAILURE';
      setError(msg.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] flex items-center justify-center p-0 lg:p-6 overflow-x-hidden relative font-sans">
      {/* GLOBAL GRAPHICS LAYER: Visible on all devices */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent)]/10 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[var(--accent)]/10 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
         
         {/* Animated Background Circles - Repositioned for Global use */}
         <div className="absolute top-1/2 left-0 lg:left-[-10%] -translate-y-1/2 w-[800px] h-[800px] border-[40px] border-[var(--accent)]/[0.03] rounded-full animate-[spin_60s_linear_infinite] opacity-50 lg:opacity-100" />
         <div className="absolute top-1/2 left-12 lg:left-0 -translate-y-1/2 w-[600px] h-[600px] border-[10px] border-[var(--accent)]/[0.02] rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-30 lg:opacity-100" />
      </div>

      {/* Main Container - Split View */}
      <div className="w-full max-w-7xl min-h-screen lg:min-h-[600px] lg:h-auto lg:max-h-[90vh] bg-transparent lg:bg-[var(--bg-card)] lg:rounded-[3.5rem] lg:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] dark:lg:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col lg:flex-row relative z-10 lg:border border-[var(--border-ui)] mx-auto">
        
        {/* LEFT PANEL: Artwork & Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-[var(--bg-card-muted)]/50 to-transparent">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-2xl">
                 <Zap size={22} className="text-white fill-white" />
               </div>
               <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">CreaftlyAI</span>
            </div>
            
            <div className="space-y-6 max-w-md">
              <h1 className="text-5xl xl:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-[0.9]">
                Login into your <br/> <span className="text-[var(--accent)]">Workspace</span>
              </h1>
              <p className="text-[var(--text-secondary)] font-medium text-lg leading-relaxed">
                Let us synchronize your missions and scale your independent business nodes.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6 opacity-30">
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-[var(--accent)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Global Cloud Node 01</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">AES-256 Distributed</span>
          </div>
        </div>

        {/* RIGHT PANEL: The Formal Node */}
        <div className="flex-1 bg-[var(--bg-canvas)]/40 lg:bg-[var(--bg-card)] relative flex items-center justify-center p-6 lg:p-10 overflow-y-auto scrollbar-hide">
          {/* Top Info for Mobile Only - Styled to match Terminal theme */}
          <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
             <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-xl mb-1">
                <Zap size={22} className="text-white fill-white" />
             </div>
             <span className="font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] text-[10px] opacity-40">CreaftlyAI Node System</span>
          </div>

          <div className="w-full max-w-[400px] space-y-6 lg:space-y-8 animate-pop-in py-24 lg:py-0">
            {view === 'VERIFY_EMAIL' ? (
              <div className="text-center space-y-8">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
                    <Mail size={32} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Sync Pending</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">Packet dispatched to {auth.currentUser?.email}. <br/> Awaiting verification ping...</p>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 py-4 bg-[var(--bg-card-muted)] rounded-2xl border border-[var(--border-ui)]">
                       <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Satellite Scanning...</span>
                    </div>
                    <button onClick={() => auth.signOut()} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline">Abort Connection</button>
                 </div>
              </div>
            ) : view === 'FORGOT_PASSWORD' ? (
              <div className="space-y-8">
                <button onClick={() => setView('LOGIN')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-all group">
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal
                </button>
                <div>
                   <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">Recover Key</h2>
                   <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-3">Access restoration module</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <Input label="Registry Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="IDENT@REGION.NET" className="h-14 font-bold" />
                   <Button type="submit" loading={isLoading} className="w-full h-14 shadow-xl text-[11px] font-black uppercase tracking-widest">Initialize Reset</Button>
                </form>
                {successMsg && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center">{successMsg}</div>}
              </div>
            ) : (
              <div className="space-y-6 lg:space-y-8">
                <div className="space-y-2">
                   <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">
                     {view === 'LOGIN' ? 'Terminal Login' : 'New Registry'}
                   </h2>
                   <p className="text-sm text-[var(--text-secondary)] font-medium">Access your strategic consultancy nodes.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                   <div className="space-y-4">
                      <Input 
                        label="Email Address" 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="name@example.com" 
                        className="h-12 lg:h-14"
                      />
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <Label>Password</Label>
                            {view === 'LOGIN' && (
                              <button type="button" onClick={() => setView('FORGOT_PASSWORD')} className="text-[9px] font-black text-[var(--accent)] hover:underline uppercase tracking-widest">Lost Key?</button>
                            )}
                         </div>
                         <Input 
                          type={showPassword ? 'text' : 'password'} 
                          required 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder="Your access secret"
                          className="h-12 lg:h-14"
                          rightIcon={Zap}
                          onRightIconClick={() => setShowPassword(!showPassword)}
                         />
                      </div>
                   </div>

                   {error && (
                     <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-[10px] font-bold uppercase tracking-widest animate-pop-in">
                       <AlertCircle size={14}/> {error}
                     </div>
                   )}

                   <div className="pt-2">
                      <Button 
                        type="submit" 
                        loading={isLoading} 
                        className="w-full h-14 shadow-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.98]"
                      >
                        {view === 'LOGIN' ? 'Initiate Link' : 'Initialize Node'}
                      </Button>
                   </div>
                </form>

                <div className="relative py-2 flex items-center">
                   <div className="flex-1 h-px bg-[var(--border-ui)]" />
                   <span className="mx-4 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Secure Cloud Auth</span>
                   <div className="flex-1 h-px bg-[var(--border-ui)]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => handleSocialAuth(googleProvider)} className="flex items-center justify-center gap-3 h-12 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl hover:bg-[var(--bg-card)] hover:border-[var(--accent)]/30 transition-all text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                      <Chrome size={16} className="text-[var(--accent)]" /> Google
                   </button>
                   <button onClick={() => handleSocialAuth(appleProvider)} className="flex items-center justify-center gap-3 h-12 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl hover:bg-[var(--bg-card)] hover:border-[var(--accent)]/30 transition-all text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                      <Apple size={16} /> Apple
                   </button>
                </div>

                <div className="text-center pt-2">
                  <button 
                    onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')} 
                    className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  >
                    {view === 'LOGIN' ? (
                      <span className="flex items-center justify-center gap-2">No active node? <span className="text-[var(--accent)]">Join Registry</span></span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">Existing Node? <span className="text-[var(--accent)]">Sync Terminal</span></span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secure Session Footer */}
          <div className="absolute bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[var(--text-secondary)] pointer-events-none w-full justify-center">
             <ShieldCheck size={14} />
             <span className="text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Encrypted Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
