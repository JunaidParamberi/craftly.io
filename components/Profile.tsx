import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Save, ShieldCheck, Loader2, Building2, Image as ImageIcon, Landmark, BadgePercent, MapPin } from 'lucide-react';
import { UserProfile, Currency } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Button, Input, Label, Card, Badge, Select } from './ui/Primitives.tsx';

const CURRENCIES: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'INR', 'JPY', 'CAD'];

const Profile: React.FC = () => {
  const { userProfile: profile, setUserProfile: onUpdate, showToast } = useBusiness();
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isUploading, setIsUploading] = useState<'avatar' | 'logo' | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync tempProfile with global profile whenever global profile updates (Live Sync)
  useEffect(() => {
    if (profile) {
      // Create a safe copy with guaranteed branding object to prevent property access crashes
      const defaultBranding = {
        address: '',
        trn: '',
        bankDetails: '',
        country: 'UAE',
        isTaxRegistered: false,
        primaryColor: '#6366F1'
      };

      const safeProfile = {
        ...profile,
        branding: {
          ...defaultBranding,
          ...profile.branding
        }
      };

      setTempProfile(JSON.parse(JSON.stringify(safeProfile)));
    }
  }, [profile]);

  const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
    if (!tempProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      const compressedBase64 = await compressImage(rawBase64, type === 'logo' ? 400 : 250);
      
      if (type === 'avatar') {
        setTempProfile(prev => prev ? ({ ...prev, avatarUrl: compressedBase64 }) : null);
      } else {
        setTempProfile(prev => prev ? ({
          ...prev,
          branding: { ...(prev.branding || {}), logoUrl: compressedBase64 }
        } as UserProfile) : null);
      }
      setIsUploading(null);
      showToast('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const updateBranding = (key: string, value: any) => {
    if (!tempProfile) return;
    setTempProfile(prev => prev ? ({
      ...prev,
      branding: { ...(prev.branding || {}), [key]: value }
    } as UserProfile) : null);
  };

  const handlePreSave = () => {
    if (tempProfile) setIsConfirmingSave(true);
  };

  const finalizeSave = async () => {
    if (!tempProfile) return;
    setIsConfirmingSave(false);
    setIsSaving(true);
    try {
      await onUpdate(tempProfile);
      showToast('Profile updated');
    } catch (e: any) {
      showToast('Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!tempProfile) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Loading Node...</p>
      </div>
    );
  }

  const isOwner = tempProfile.role === 'OWNER' || tempProfile.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-10 animate-enter pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
           <User size={200} />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Profile</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">{tempProfile.fullName}</p>
        </div>
        <Button onClick={handlePreSave} loading={isSaving} variant="primary" className="px-10 h-14 min-w-[220px] shadow-2xl relative z-10">
          Save Profile
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-10 flex flex-col items-center text-center group bg-indigo-500/[0.02]">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-2 border-white/5 flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden group-hover:border-indigo-500/50 transition-all duration-500">
                {tempProfile.avatarUrl ? (
                  <img src={tempProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="opacity-40">{tempProfile.fullName?.charAt(0)}</span>
                )}
                {isUploading === 'avatar' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                  </div>
                )}
              </div>
              <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3.5 bg-indigo-600 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-[var(--bg-card)]"
              >
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">{tempProfile.fullName}</h3>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 mb-8">{tempProfile.title || 'OPERATIVE'}</p>
            <Badge variant={tempProfile.role === 'OWNER' ? 'success' : 'info'}>{tempProfile.role}</Badge>
          </Card>

          {isOwner && (
            <Card className="p-10 space-y-6">
              <header className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3 text-indigo-400">
                    <Building2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Logo</span>
                 </div>
                 <button onClick={() => logoInputRef.current?.click()} className="text-[9px] font-black uppercase text-indigo-500 hover:underline">Change</button>
              </header>
              <div className="relative aspect-video bg-slate-950 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden group">
                 {tempProfile.branding?.logoUrl ? (
                   <img src={tempProfile.branding.logoUrl} alt="Logo" className="max-h-full max-w-full p-6 object-contain" />
                 ) : (
                   <div className="text-center space-y-3 opacity-20 group-hover:opacity-40 transition-opacity">
                      <ImageIcon size={40} className="mx-auto" strokeWidth={1} />
                      <p className="text-[8px] font-black uppercase tracking-widest">No Logo</p>
                   </div>
                 )}
                 {isUploading === 'logo' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 size={32} className="animate-spin text-indigo-400" />
                    </div>
                  )}
                 <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} />
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-8">
          <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[3rem] space-y-10 shadow-sm">
            <div className="flex items-center gap-4 text-indigo-500 border-b border-white/5 pb-6">
              <ShieldCheck size={28} />
              <h3 className="text-sm font-black uppercase tracking-[0.4em]">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Input label="Full Name" value={tempProfile.fullName || ''} onChange={e => setTempProfile({...tempProfile, fullName: e.target.value.toUpperCase()})} />
               <Input label="Title" value={tempProfile.title || ''} onChange={e => setTempProfile({...tempProfile, title: e.target.value.toUpperCase()})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Input label="Company Name" value={tempProfile.companyName || ''} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value.toUpperCase()})} />
               <Input label="Website" value={tempProfile.website || ''} onChange={e => setTempProfile({...tempProfile, website: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <Select label="Currency" value={tempProfile.currency || 'AED'} onChange={e => setTempProfile({...tempProfile, currency: e.target.value as Currency})}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              {isOwner && (
                <Input label="TRN / Tax ID" value={tempProfile.branding?.trn || ''} onChange={e => updateBranding('trn', e.target.value)} placeholder="Enter TRN..." />
              )}
            </div>

            {isOwner && (
              <div className="space-y-4">
                 <Label className="flex items-center gap-2"><MapPin size={12}/> Address</Label>
                 <textarea 
                  rows={3} 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all leading-relaxed" 
                  value={tempProfile.branding?.address || ''} 
                  onChange={e => updateBranding('address', e.target.value)} 
                 />
              </div>
            )}
          </section>

          {isOwner && (
            <section className="p-10 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[3rem] space-y-10 shadow-sm">
               <div className="flex items-center gap-4 text-emerald-500 border-b border-white/5 pb-6">
                  <Landmark size={28} />
                  <h3 className="text-sm font-black uppercase tracking-[0.4em]">Payment Details</h3>
               </div>
               <div className="space-y-4">
                  <Label>Bank Details</Label>
                  <textarea 
                   rows={4} 
                   placeholder="Enter IBAN, Swift, and Bank info..."
                   className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all min-h-[140px] leading-relaxed" 
                   value={tempProfile.branding?.bankDetails || ''} 
                   onChange={e => updateBranding('bankDetails', e.target.value)} 
                  />
               </div>
               
               <div className="flex items-center justify-between p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${tempProfile.branding?.isTaxRegistered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <BadgePercent size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Tax Registered</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">Toggle VAT status.</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={tempProfile.branding?.isTaxRegistered || false} 
                    onChange={e => updateBranding('isTaxRegistered', e.target.checked)} 
                    className="w-6 h-6 rounded-lg bg-slate-900 border-white/20 text-indigo-500 focus:ring-indigo-500" 
                  />
               </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmingSave}
        title="Save Profile"
        message="Save your profile changes?"
        confirmLabel="Save"
        variant="primary"
        onConfirm={finalizeSave}
        onCancel={() => setIsConfirmingSave(false)}
      />
    </div>
  );
};

export default Profile;