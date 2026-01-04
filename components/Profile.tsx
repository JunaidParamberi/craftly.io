
import React, { useState } from 'react';
import { User, Briefcase, Link, Mail, Camera, Save, Fingerprint, ShieldCheck, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Button } from './ui/Primitives.tsx';

const Profile: React.FC = () => {
  const { userProfile: profile, setUserProfile: onUpdate, showToast } = useBusiness();
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  const handlePreSave = () => {
    setIsConfirmingSave(true);
  };

  const finalizeSave = () => {
    setIsConfirmingSave(false);
    setIsSaving(true);
    setTimeout(() => {
      onUpdate(tempProfile);
      localStorage.setItem('craftly_user_profile', JSON.stringify(tempProfile));
      setIsSaving(false);
      showToast('Profile configuration updated');
    }, 1200);
  };

  return (
    <div className="space-y-10 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-8 exec-card gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">My Business Profile</h2>
          <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.4em] mt-3">Change how you appear to your clients</p>
        </div>
        <Button onClick={handlePreSave} loading={isSaving} variant="primary" icon={Save} className="px-10 h-14 min-w-[220px] shadow-xl">
          SAVE CHANGES
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="exec-card p-10 flex flex-col items-center text-center group">
            <div className="relative mb-8 group">
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-indigo-700 flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden border-2 border-white/10">
                {profile.fullName.charAt(0)}
              </div>
              <button className="absolute -bottom-3 -right-3 p-3 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                <Camera size={16} />
              </button>
            </div>
            
            <h3 className="text-2xl font-black uppercase tracking-tight">{profile.fullName}</h3>
            <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mt-2 mb-8">{profile.title}</p>
            
            <div className="w-full space-y-3 pt-8 border-t border-[var(--border-ui)] text-left">
              <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--text-secondary)] uppercase bg-[var(--bg-canvas)]/50 p-4 rounded-xl border border-[var(--border-ui)]">
                <Mail size={16} className="opacity-40" /> {profile.email}
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--text-secondary)] uppercase bg-[var(--bg-canvas)]/50 p-4 rounded-xl border border-[var(--border-ui)]">
                <Link size={16} className="opacity-40" /> {profile.website.replace('https://', '')}
              </div>
            </div>
          </div>

          <div className="exec-card p-8 space-y-6">
             <div className="flex items-center gap-3 text-emerald-500">
               <Fingerprint size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Verified</span>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between items-center mb-1">
                 <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Profile Score</p>
                 <p className="text-[10px] font-black text-emerald-500 uppercase">Excellent</p>
               </div>
               <div className="h-2 bg-[var(--bg-canvas)] rounded-full overflow-hidden border border-[var(--border-ui)]">
                  <div className="h-full bg-emerald-500 w-[98%] shadow-md" />
               </div>
               <div className="flex items-center gap-3 pt-3 text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                  <Check size={10} className="text-emerald-500" /> Account is fully protected
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="exec-card p-10 space-y-8">
            <div className="flex items-center gap-4 text-[var(--accent)]">
               <User size={24} />
               <h3 className="text-xs font-black uppercase tracking-[0.4em]">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="exec-form-group">
                 <label className="exec-label">Your Full Name</label>
                 <input 
                  type="text" 
                  className="exec-input font-black uppercase" 
                  value={tempProfile.fullName} 
                  placeholder="E.G. JUNAID PARAMBERI"
                  onChange={e => setTempProfile({...tempProfile, fullName: e.target.value})} 
                 />
               </div>
               <div className="exec-form-group">
                 <label className="exec-label">Your Professional Title</label>
                 <input 
                  type="text" 
                  className="exec-input font-black uppercase" 
                  value={tempProfile.title} 
                  placeholder="E.G. CREATIVE STRATEGIST"
                  onChange={e => setTempProfile({...tempProfile, title: e.target.value})} 
                 />
               </div>
            </div>

            <div className="exec-form-group">
               <label className="exec-label">About You (Bio)</label>
               <textarea 
                rows={4} 
                className="exec-textarea font-medium" 
                value={tempProfile.bio} 
                placeholder="DESCRIBE YOUR CORE MISSION..."
                onChange={e => setTempProfile({...tempProfile, bio: e.target.value})} 
               />
            </div>
          </div>

          <div className="exec-card p-10 space-y-8">
            <div className="flex items-center gap-4 text-[var(--accent)]">
               <Briefcase size={24} />
               <h3 className="text-xs font-black uppercase tracking-[0.4em]">Business Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="exec-form-group">
                 <label className="exec-label">Company or Studio Name</label>
                 <input 
                  type="text" 
                  className="exec-input font-black uppercase" 
                  value={tempProfile.companyName} 
                  placeholder="E.G. CRAFTLY STUDIO"
                  onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} 
                 />
               </div>
               <div className="exec-form-group">
                 <label className="exec-label">Website URL</label>
                 <input 
                  type="text" 
                  className="exec-input font-black" 
                  value={tempProfile.website} 
                  placeholder="HTTPS://CRAFTLY.IO"
                  onChange={e => setTempProfile({...tempProfile, website: e.target.value})} 
                 />
               </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmingSave}
        title="Confirm Save"
        message="Do you want to update your public profile with these new details?"
        confirmLabel="Yes, Save Now"
        variant="primary"
        onConfirm={finalizeSave}
        onCancel={() => setIsConfirmingSave(false)}
      />
    </div>
  );
};

export default Profile;
