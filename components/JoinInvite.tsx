
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Loader2, AlertCircle, 
  User, Key, ArrowRight, Zap, Fingerprint 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../services/firebase.ts';
import { Input, Button, Label } from './ui/Primitives.tsx';

const JoinInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  
  const [formData, setFormData] = useState({ fullName: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Missing invitation token.');
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'pending_invites', token));
        if (!snap.exists()) {
          setError('Invalid or expired invitation.');
        } else {
          // Explicitly cast snap.data() to any to avoid Property 'expiresAt' does not exist on type 'unknown'
          const data = snap.data() as any;
          const expiresAt = data.expiresAt?.toDate();
          if (expiresAt && expiresAt < new Date()) {
            setError('This invitation link has expired.');
          } else {
            setInviteData(data);
          }
        }
      } catch (err) {
        setError('Network error verifying invite.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;

    setIsSubmitting(true);
    try {
      // 1. Create Auth User
      const userCred = await createUserWithEmailAndPassword(auth, inviteData.email, formData.password);
      
      // 2. Initial Name Update
      await updateProfile(userCred.user, { displayName: formData.fullName });

      // 3. Call Cloud Function to link profile and cleanup
      const completeSignup = httpsCallable(functions, 'completeSignup');
      await completeSignup({ 
        token, 
        fullName: formData.fullName.toUpperCase() 
      });

      // 4. Force Reload/Redirect to Dashboard
      window.location.href = '/#/dashboard';
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to complete node setup.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse mb-6">
          <Fingerprint size={32} className="text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Verifying Access Token...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0B1120] border border-white/5 rounded-[2.5rem] p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-8 border border-rose-500/20">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Denied</h2>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-10 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline"
          >
            Back to Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-8 animate-pop-in">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 rotate-3">
             <Zap size={32} className="text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Initialize Node</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Invited to {inviteData.companyName}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Label className="!text-slate-400">Registry Email</Label>
              <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 flex items-center text-slate-400 font-bold text-sm">
                {inviteData.email}
              </div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-1">Fixed Identity Node</p>
            </div>

            <Input 
              label="Full Name"
              required
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})}
              placeholder="OPERATIVE NAME"
              className="!bg-slate-50 !border-slate-200 !text-slate-900 !h-14 font-bold"
              icon={User}
            />

            <div className="space-y-2">
              <Label className="!text-slate-400">Access Secret (Password)</Label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 pl-14 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all"
                />
                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit"
                loading={isSubmitting}
                className="w-full h-16 !bg-indigo-600 hover:!bg-indigo-700 !text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl"
              >
                {isSubmitting ? 'Encrypting Node...' : 'Sync with Registry'} <ArrowRight className="ml-2" size={18} />
              </Button>
            </div>
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-2 opacity-30 grayscale pointer-events-none">
             <ShieldCheck size={14} className="text-indigo-600" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900">AES-256 Scoped Handshake</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinInvite;
