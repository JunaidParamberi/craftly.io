import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Cpu, Download, 
  Trash2, Accessibility, UserCircle, Briefcase,
  Settings as SettingsIcon, Image as ImageIcon, PenTool,
  Monitor, Pipette, Sun, Moon, X, Mail, Phone, LogOut,
  Copy, Check, Share2, Zap, FileCode, FileImage,
  // Fix: Added missing Loader2 import
  Loader2
} from 'lucide-react';
import { Language, UserRole, Theme } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
// Fix: Added missing Badge import from Primitives
import { Input, Button, Select, Card, Label, Badge } from './ui/Primitives.tsx';
import { auth } from '../services/firebase.ts';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const CraftlyLogoSVG = ({ size = 40, showText = true }) => (
  <div className="flex items-center gap-3">
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="12" fill="#6366F1"/>
      <path d="M22.5 5L10 23H20L17.5 35L30 17H20L22.5 5Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
    {showText && <span className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Craftly</span>}
  </div>
);

const Settings: React.FC<{ globalLanguage: Language; onLanguageChange: (lang: Language) => void }> = ({ globalLanguage, onLanguageChange }) => {
  const { t, setLanguage, pushNotification, userProfile, setUserProfile, showToast } = useBusiness();
  const { fontSize, setFontSize, theme, setTheme } = useTheme();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [copiedLogo, setCopiedLogo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleBrandingChange = (key: string, value: string) => {
    setUserProfile({
      ...userProfile!,
      branding: { ...userProfile!.branding, [key]: value }
    });
  };

  const getLogoRawSVG = (size = 512) => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="12" fill="#6366F1"/><path d="M22.5 5L10 23H20L17.5 35L30 17H20L22.5 5Z" fill="white"/></svg>`;
  };

  const downloadSVG = () => {
    const svgData = getLogoRawSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'craftly_logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('SVG Downloaded');
  };

  const downloadPNG = () => {
    setIsExporting(true);
    const size = 1024;
    const svgData = getLogoRawSVG(size);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'craftly_logo_highres.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        showToast('High-Res PNG Ready');
      }
    };
    img.src = url;
  };

  const copyLogoSVG = () => {
    const svg = getLogoRawSVG(40);
    navigator.clipboard.writeText(svg);
    setCopiedLogo(true);
    showToast('SVG Code Buffered');
    setTimeout(() => setCopiedLogo(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      profile: localStorage.getItem('craftly_user_profile'),
      clients: localStorage.getItem('craftly_clients'),
      invoices: localStorage.getItem('craftly_invoices'),
      proposals: localStorage.getItem('craftly_proposals')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_export_${new Date().getTime()}.json`;
    a.click();
    pushNotification({ title: 'Export Finished', description: 'Your data has been downloaded.', type: 'system' });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (e) {
      console.error("Settings Logout Error:", e);
    }
  };

  const themeOptions: { id: Theme; label: string; icon: any }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', icon: Monitor, label: 'Auto' },
  ];

  return (
    <div className="space-y-10 animate-enter pb-24">
      <div className="p-10 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <SettingsIcon size={200} strokeWidth={1} />
        </div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
            <Cpu size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none text-[var(--text-primary)]">Settings</h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-black uppercase tracking-[0.5em] mt-4 opacity-60">Profile: {userProfile?.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <section className="p-12 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] space-y-8 shadow-sm">
            <div className="flex items-center gap-4 text-indigo-500 border-b border-[var(--border-ui)] pb-6">
              <UserCircle size={28} />
              <h3 className="text-sm font-black uppercase tracking-[0.3em]">Account</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Select 
                 label="User Role" 
                 value={userProfile?.role} 
                 onChange={e => setUserProfile({...userProfile!, role: e.target.value as UserRole})}
               >
                 <option value="OWNER">Owner</option>
                 <option value="EMPLOYEE">Employee</option>
                 <option value="CLIENT">Client</option>
               </Select>
               <Input label="Name" value={userProfile?.fullName} onChange={e => setUserProfile({...userProfile!, fullName: e.target.value})} />
            </div>
          </section>

          {/* BRAND ASSETS SECTION */}
          <section className="p-12 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] space-y-10 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-ui)] pb-6">
               <div className="flex items-center gap-4 text-indigo-500">
                  <Zap size={28} />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em]">Brand Identity Assets</h3>
               </div>
               {/* Fix: Added Badge component to imports */}
               <Badge variant="info">Vector Graphics</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="p-8 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2rem] flex flex-col items-center justify-center gap-6 group hover:border-indigo-500/30 transition-all">
                  <div className="p-4 bg-[var(--bg-card)] rounded-2xl shadow-xl">
                    <CraftlyLogoSVG size={64} showText={false} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Official Icon Node</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">Universal Vector Node</p>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <button 
                      onClick={copyLogoSVG}
                      className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      {copiedLogo ? <Check size={14}/> : <Copy size={14}/>}
                      {copiedLogo ? 'Buffered' : 'SVG Code'}
                    </button>
                    <button 
                      onClick={downloadSVG}
                      className="h-12 rounded-xl bg-indigo-600/10 text-indigo-600 font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Download size={14}/> .SVG
                    </button>
                  </div>
               </div>
               <div className="p-8 bg-slate-950 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-6 group hover:border-indigo-500/30 transition-all">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <CraftlyLogoSVG size={48} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">High-Res Master</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mt-1">1024px Transparent PNG</p>
                  </div>
                  <button 
                    onClick={downloadPNG}
                    disabled={isExporting}
                    className="w-full h-12 rounded-xl bg-white/10 text-white font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-50"
                  >
                    {/* Fix: Added Loader2 component to imports */}
                    {isExporting ? <Loader2 size={14} className="animate-spin"/> : <FileImage size={14}/>}
                    {isExporting ? 'Generating...' : 'Download PNG'}
                  </button>
               </div>
            </div>
          </section>

          <section className="p-12 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] space-y-10 shadow-sm">
            <div className="flex items-center gap-4 text-indigo-500 border-b border-[var(--border-ui)] pb-6">
               <Briefcase size={28} />
               <h3 className="text-sm font-black uppercase tracking-[0.3em]">Business Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-4 p-2 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl">
                  <div className="relative shrink-0 group">
                    <button 
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      style={{ backgroundColor: userProfile?.branding.primaryColor || '#6366F1' }}
                      className="w-14 h-14 rounded-xl shadow-lg border-4 border-white dark:border-slate-850 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden"
                    >
                      <Pipette size={18} className="text-white mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <input 
                      ref={colorInputRef}
                      type="color" 
                      value={userProfile?.branding.primaryColor || '#6366F1'}
                      onChange={e => handleBrandingChange('primaryColor', e.target.value.toUpperCase())}
                      className="absolute inset-0 opacity-0 cursor-pointer w-0 h-0"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <Input 
                        value={userProfile?.branding.primaryColor} 
                        placeholder="#HEXCODE"
                        className="!bg-transparent !border-none !h-10 !px-2 font-black uppercase tracking-widest text-lg"
                        onChange={e => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          handleBrandingChange('primaryColor', val.toUpperCase().slice(0, 7));
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 pt-4">
               <div className="flex items-center gap-3 text-indigo-400">
                  <ShieldCheck size={18}/>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Contact Details</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Business Email" icon={Mail} value={userProfile?.branding.campaignEmail} onChange={e => handleBrandingChange('campaignEmail', e.target.value)} placeholder="email@example.com" />
                  <Input label="Business Phone" icon={Phone} value={userProfile?.branding.campaignPhone} onChange={e => handleBrandingChange('campaignPhone', e.target.value)} placeholder="+971..." />
               </div>
            </div>

            <div className="space-y-2">
               <label className="exec-label">Address</label>
               <textarea className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-[1.5rem] p-6 text-sm font-semibold outline-none focus:border-indigo-500 transition-all min-h-[100px]" value={userProfile?.branding.address} onChange={e => handleBrandingChange('address', e.target.value)} />
            </div>
            <div className="space-y-2">
               <label className="exec-label">Bank Details</label>
               <textarea className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-[1.5rem] p-6 text-sm font-semibold outline-none focus:border-indigo-500 transition-all min-h-[100px]" value={userProfile?.branding.bankDetails} onChange={e => handleBrandingChange('bankDetails', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <label className="exec-label flex items-center gap-2"><ImageIcon size={14}/> Logo URL</label>
                  <Input value={userProfile?.branding.logoUrl} placeholder="URL..." onChange={e => handleBrandingChange('logoUrl', e.target.value)} />
               </div>
               <div className="space-y-4">
                  <label className="exec-label flex items-center gap-2"><PenTool size={14}/> Signature URL</label>
                  <Input value={userProfile?.branding.signatureUrl} placeholder="URL..." onChange={e => handleBrandingChange('signatureUrl', e.target.value)} />
               </div>
            </div>
          </section>

          <section className="p-12 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] space-y-12 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-ui)] pb-8">
              <div className="flex items-center gap-5 text-indigo-500">
                <Accessibility size={28} />
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Display</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <label className="exec-label">Text Size</label>
                <div className="flex bg-[var(--bg-canvas)] p-2 rounded-2xl border border-[var(--border-ui)]">
                  {['sm', 'base', 'lg'].map(size => (
                    <button key={size} onClick={() => setFontSize(size as any)} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${fontSize === size ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-500'}`}>{size}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <label className="exec-label">Theme</label>
                <div className="bg-[var(--bg-canvas)] p-2 rounded-2xl border border-[var(--border-ui)] flex items-center relative h-16 w-full shadow-inner overflow-hidden">
                  <div 
                    className="absolute h-[calc(100%-16px)] rounded-xl bg-indigo-500 shadow-xl shadow-indigo-500/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0"
                    style={{ 
                      width: `calc((100% - 16px) / 3)`,
                      left: `calc(8px + (${themeOptions.findIndex(o => o.id === theme)} * (100% - 16px) / 3))`
                    }}
                  />
                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id)}
                      className={`relative z-10 flex-1 flex flex-col items-center justify-center transition-all duration-300 ${theme === option.id ? 'text-white scale-105' : 'text-slate-500 opacity-60 hover:opacity-100'}`}
                    >
                      <option.icon size={16} strokeWidth={2.5} />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <Card className="p-10 bg-emerald-500/[0.03] border-emerald-500/20 text-center border-2">
              <ShieldCheck size={56} className="text-emerald-500 mx-auto mb-8" />
              <h4 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">Data Backup</h4>
              <p className="text-[10px] font-bold mt-6 uppercase tracking-widest leading-loose text-slate-500">Download your records for bookkeeping.</p>
              <div className="h-px bg-[var(--border-ui)] my-10 opacity-50" />
              <Button icon={Download} onClick={handleExportData} className="w-full h-14 shadow-2xl shadow-emerald-500/10">Export CSV</Button>
           </Card>

           <Card className="p-10 bg-indigo-500/[0.03] border-indigo-500/20 text-center border-2">
              <LogOut size={56} className="text-indigo-500 mx-auto mb-8" />
              <h4 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">Log Out</h4>
              <p className="text-[10px] font-bold mt-6 uppercase tracking-widest leading-loose text-slate-500">Log out of your current session.</p>
              <div className="h-px bg-[var(--border-ui)] my-10 opacity-50" />
              <Button variant="outline" icon={LogOut} onClick={() => setIsLogoutModalOpen(true)} className="w-full h-14 !text-indigo-500 border-indigo-500/30 hover:!bg-indigo-500 hover:!text-white">Sign Out</Button>
           </Card>

           <div className="p-10 bg-rose-500/[0.02] border-rose-500/20 border-2 rounded-[2.5rem] space-y-8 shadow-sm">
              <h5 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 flex items-center gap-3"><Trash2 size={14}/> Danger Zone</h5>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">Delete all data from this device.</p>
              <button onClick={() => setIsResetModalOpen(true)} className="w-full h-14 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Reset App</button>
           </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isResetModalOpen} 
        title="Reset App" 
        message="This will delete all local records. This cannot be undone. Are you sure?" 
        confirmLabel="Reset Now" 
        onConfirm={() => { localStorage.clear(); window.location.reload(); }} 
        onCancel={() => setIsResetModalOpen(false)} 
      />

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Settings;