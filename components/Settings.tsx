import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, Download, 
  Trash2, Accessibility, UserCircle,
  Image as ImageIcon, PenTool,
  Monitor, Sun, Moon, Mail, Phone, LogOut,
  Landmark, BadgePercent, Globe, 
  Command, Languages, Contrast, Type,
  Building2, ChevronDown, FileText, Palette
} from 'lucide-react';
import { Language, Theme, UserProfile, InvoiceTemplate } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Input, Button, Card, Label, Badge, Heading } from './ui/Primitives.tsx';
import TemplatePreviewSelector from './ui/TemplatePreviewSelector.tsx';
import { auth } from '../services/firebase.ts';
import { signOut } from 'firebase/auth';
// Fix: Importing useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { 
    language, setLanguage, userProfile, setUserProfile, showToast, pushNotification 
  } = useBusiness();
  const { fontSize, setFontSize, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'ORGANIZATION' | 'PREFERENCES' | 'SECURITY'>('IDENTITY');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  // Initialize local state for form editing
  useEffect(() => {
    if (userProfile) {
      setLocalProfile(JSON.parse(JSON.stringify(userProfile)));
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!localProfile) return;
    setIsSaving(true);
    try {
      await setUserProfile(localProfile);
      showToast('Registry node synchronized', 'success');
      pushNotification({
        title: 'Settings Synced',
        description: 'Identity and configuration nodes updated.',
        type: 'system'
      });
    } catch (e) {
      showToast('Sync failure', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandingChange = (key: string, value: any) => {
    if (!localProfile) return;
    setLocalProfile({
      ...localProfile,
      branding: { ...localProfile.branding, [key]: value }
    });
  };

  const downloadData = () => {
    const data = JSON.stringify(localProfile, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creaftlyai_node_export_${Date.now()}.json`;
    a.click();
    showToast('Registry node exported');
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

  const languages: { id: Language; label: string }[] = [
    { id: 'EN', label: 'English (US)' },
    { id: 'AR', label: 'العربية (UAE)' },
    { id: 'FR', label: 'Français' },
    { id: 'DE', label: 'Deutsch' },
    { id: 'ES', label: 'Español' },
  ];

  if (!localProfile) return null;

  return (
    <div className="space-y-8 lg:space-y-12 animate-enter pb-32 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-3">
          <Heading sub={`Access level: ${localProfile.role} Node`}>Registry Configuration</Heading>
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-2xl w-fit shadow-2xl">
            {[
              { id: 'IDENTITY', label: 'Identity', icon: UserCircle },
              ...(isOwner ? [{ id: 'ORGANIZATION', label: 'Enterprise', icon: Building2 }] : []),
              { id: 'PREFERENCES', label: 'Preferences', icon: Command },
              { id: 'SECURITY', label: 'Security', icon: ShieldCheck },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
           <Button variant="ghost" onClick={() => setLocalProfile(JSON.parse(JSON.stringify(userProfile)))} className="h-12 px-6">Discard</Button>
           <Button onClick={handleSave} loading={isSaving} className="h-12 px-10 shadow-2xl bg-[var(--accent)] border-[var(--accent)]">Sync Updates</Button>
        </div>
      </header>

      {activeTab === 'IDENTITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 animate-enter">
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-10 flex flex-col items-center text-center bg-[var(--bg-card-muted)] border-[var(--border-ui)] shadow-2xl">
              <div className="relative group mb-8">
                <div className="w-40 h-40 rounded-[3rem] bg-[var(--bg-card)] border-4 border-[var(--border-ui)] flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[var(--accent)]/30 transition-all duration-500">
                  {localProfile.avatarUrl ? (
                    <img src={localProfile.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={80} className="text-[var(--text-secondary)]" strokeWidth={1} />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white">Update Node</p>
                  </div>
                </div>
                <button className="absolute -bottom-2 -right-2 p-4 bg-[var(--accent)] text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all">
                  <ImageIcon size={20} />
                </button>
              </div>
              <h3 className="text-xl font-black uppercase text-[var(--text-primary)] tracking-tight">{localProfile.fullName}</h3>
              <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mt-2 mb-8">{localProfile.title || 'OPERATIVE'}</p>
              <Badge variant="info" className="!px-5 !py-1.5 !rounded-lg text-[9px]">{localProfile.role}</Badge>
            </Card>

            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-[var(--text-secondary)] mb-2">
                <Globe size={16}/>
                <span className="text-[10px] font-black uppercase tracking-widest">Public Presence</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-ui)]">
                  <span className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-[var(--text-primary)] uppercase">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-ui)]">
                  <span className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Region</span>
                  <span className="text-[9px] font-black text-[var(--text-primary)] uppercase">{localProfile.branding.country}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="p-10 lg:p-14 space-y-12">
              <div className="flex items-center gap-4 text-[var(--accent)] border-b border-[var(--border-ui)] pb-8">
                <UserCircle size={28} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Personal Node Profile</h3>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Configure your identity registry</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input 
                  label="Registry Name" 
                  value={localProfile.fullName} 
                  onChange={e => setLocalProfile({...localProfile, fullName: e.target.value.toUpperCase()})}
                  className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                />
                <Input 
                  label="Designation" 
                  value={localProfile.title} 
                  onChange={e => setLocalProfile({...localProfile, title: e.target.value.toUpperCase()})}
                  placeholder="E.G. CEO / FOUNDER"
                  className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                />
                <Input 
                  label="Registry Email" 
                  value={localProfile.email} 
                  disabled 
                  className="font-black h-12 !bg-[var(--bg-card-muted)] !border-[var(--border-ui)] !text-[var(--text-secondary)]"
                />
                <Input 
                  label="Digital Portfolio" 
                  value={localProfile.website} 
                  onChange={e => setLocalProfile({...localProfile, website: e.target.value})}
                  placeholder="https://studio.com"
                  className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                />
              </div>

              <div className="space-y-4">
                <Label>Strategic Biography</Label>
                <textarea 
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-3xl p-6 text-sm font-medium outline-none focus:border-[var(--accent)] transition-all min-h-[140px] leading-relaxed text-[var(--text-primary)]"
                  value={localProfile.bio}
                  onChange={e => setLocalProfile({...localProfile, bio: e.target.value})}
                  placeholder="Define your operational focus..."
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'ORGANIZATION' && isOwner && (
        <div className="space-y-10 animate-enter">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8 space-y-10">
              <Card className="p-10 lg:p-14 space-y-12">
                <div className="flex items-center gap-4 text-[var(--accent)] border-b border-[var(--border-ui)] pb-8">
                  <Building2 size={28} />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Enterprise Identity</h3>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">SaaS Organization parameters</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Input 
                    label="Entity Name" 
                    value={localProfile.companyName} 
                    onChange={e => setLocalProfile({...localProfile, companyName: e.target.value.toUpperCase()})}
                    className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                  />
                  <Input 
                    label="VAT / Tax Registry ID" 
                    value={localProfile.branding.trn} 
                    onChange={e => handleBrandingChange('trn', e.target.value)}
                    placeholder="ENTER NUMERIC IDENTIFIER"
                    className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <Input 
                    label="Operations Phone" 
                    icon={Phone} 
                    value={localProfile.branding.campaignPhone} 
                    onChange={e => handleBrandingChange('campaignPhone', e.target.value)}
                    className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                  />
                  <Input 
                    label="Support Node Email" 
                    icon={Mail} 
                    value={localProfile.branding.campaignEmail} 
                    onChange={e => handleBrandingChange('campaignEmail', e.target.value)}
                    className="font-black h-12 !bg-[var(--input-bg)] !border-[var(--border-ui)]"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Registry HQ Address</Label>
                  <textarea 
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-3xl p-6 text-sm font-medium outline-none focus:border-[var(--accent)] transition-all min-h-[100px] leading-relaxed text-[var(--text-primary)]"
                    value={localProfile.branding.address}
                    onChange={e => handleBrandingChange('address', e.target.value)}
                  />
                </div>
              </Card>

              <Card className="p-10 lg:p-14 space-y-10">
                <div className="flex items-center gap-4 text-emerald-500 border-b border-[var(--border-ui)] pb-8">
                  <Landmark size={28} />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Fiscal Settlement Hub</h3>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Define project payment nodes</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Payment Instructions (Bank/Wire)</Label>
                  <textarea 
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-3xl p-8 text-sm font-mono text-emerald-500 outline-none focus:border-emerald-500/50 transition-all min-h-[160px] leading-relaxed shadow-inner"
                    value={localProfile.branding.bankDetails}
                    onChange={e => handleBrandingChange('bankDetails', e.target.value)}
                    placeholder="ENTER IBAN, SWIFT, BRANCH..."
                  />
                </div>
                <div className="p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${localProfile.branding.isTaxRegistered ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card-muted)] text-[var(--text-secondary)]'}`}>
                         <BadgePercent size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">VAT Compliance Mode</p>
                         <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1">Automatic 5% FTA logic for UAE nodes.</p>
                      </div>
                   </div>
                   <input 
                    type="checkbox" 
                    checked={localProfile.branding.isTaxRegistered} 
                    onChange={e => handleBrandingChange('isTaxRegistered', e.target.checked)}
                    className="w-6 h-6 rounded-lg bg-[var(--bg-card-muted)] border-[var(--border-ui)] text-[var(--accent)] focus:ring-[var(--accent)]" 
                  />
                </div>
              </Card>

              <Card className="p-10 lg:p-14 space-y-10">
                <div className="flex items-center gap-4 text-purple-500 border-b border-[var(--border-ui)] pb-8">
                  <Palette size={28} />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">PDF Template Configuration</h3>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Select default templates for documents</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="tracking-[0.3em] mb-4">Default Invoice Template</Label>
                    <TemplatePreviewSelector
                      value={(localProfile.branding.defaultInvoiceTemplate || 'Swiss_Clean') as InvoiceTemplate}
                      onChange={(template) => handleBrandingChange('defaultInvoiceTemplate', template)}
                      type="invoice"
                      userProfile={localProfile}
                      client={null}
                    />
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest leading-relaxed mt-4 px-2">
                      This template will be used for all new invoices and LPOs by default. Click the eye icon on any template to preview it. You can change templates for individual documents from the PDF view.
                    </p>
                  </div>
                  
                  <div className="h-px bg-[var(--border-ui)] my-4"></div>
                  
                  <div className="space-y-4">
                    <Label className="tracking-[0.3em] mb-4">Default Proposal Template</Label>
                    <TemplatePreviewSelector
                      value={(localProfile.branding.defaultProposalTemplate || 'Swiss_Clean') as InvoiceTemplate}
                      onChange={(template) => handleBrandingChange('defaultProposalTemplate', template)}
                      type="proposal"
                      userProfile={localProfile}
                      client={null}
                    />
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest leading-relaxed mt-4 px-2">
                      This template will be used for all new proposals by default. Click the eye icon on any template to preview it. You can change templates for individual documents from the PDF view.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-purple-500/[0.03] border border-purple-500/10 rounded-3xl mt-6">
                    <div className="flex items-start gap-4">
                      <FileText size={20} className="text-purple-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-2">Template Management</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold leading-relaxed">
                          Templates control the visual appearance of your PDF documents. Select a template above to set it as default. 
                          You can always change templates for individual documents when viewing or editing them.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <Card className="p-10 text-center space-y-8 bg-[var(--bg-card-muted)] border-[var(--border-ui)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.3em]">Visual Hub</span>
                    <button onClick={() => logoInputRef.current?.click()} className="text-[9px] font-black uppercase text-[var(--accent)] hover:underline">Change</button>
                  </div>
                  <div className="w-full aspect-video bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-ui)] rounded-[2.5rem] flex items-center justify-center overflow-hidden group">
                     {localProfile.branding.logoUrl ? (
                       <img src={localProfile.branding.logoUrl} className="max-h-[80%] max-w-[80%] object-contain block" />
                     ) : (
                       <div className="text-center opacity-10 group-hover:opacity-20 transition-opacity">
                         <ImageIcon size={48} className="mx-auto mb-4" />
                         <p className="text-[8px] font-black uppercase tracking-[0.4em]">Awaiting Asset</p>
                       </div>
                     )}
                  </div>
                  <input ref={logoInputRef} type="file" className="hidden" accept="image/*" />
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] leading-relaxed px-4">Organization logos are automatically synchronized with fiscal documents (PDF/LPO).</p>
               </Card>

               <Card className="p-10 space-y-8">
                  <div className="flex items-center gap-3 text-[var(--accent)]">
                    <PenTool size={18}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Digital Auth</span>
                  </div>
                  <div className="w-full h-32 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-3xl flex items-center justify-center overflow-hidden opacity-50 italic text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                     Authorized Signature Node
                  </div>
                  <Button variant="outline" className="w-full h-11 text-[9px] uppercase tracking-widest font-black">Link Signature</Button>
               </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PREFERENCES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 animate-enter">
          <Card className="p-10 lg:p-14 space-y-12">
            <div className="flex items-center gap-4 text-[var(--accent)] border-b border-[var(--border-ui)] pb-8">
              <Monitor size={28} />
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Display Engine</h3>
                <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Customize your terminal UI</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-6">
                <Label className="tracking-[0.4em]">Visual Modality</Label>
                <div className="bg-[var(--bg-card-muted)] p-1.5 rounded-2xl border border-[var(--border-ui)] flex items-center relative h-14 w-full shadow-inner overflow-hidden">
                  <div 
                    className="absolute h-[calc(100%-12px)] rounded-xl bg-[var(--accent)] shadow-xl shadow-[var(--accent)]/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0"
                    style={{ 
                      width: `calc((100% - 12px) / 3)`,
                      left: `calc(6px + (${themeOptions.findIndex(o => o.id === theme)} * (100% - 12px) / 3))`
                    }}
                  />
                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id)}
                      className={`relative z-10 flex-1 flex flex-col items-center justify-center transition-all duration-300 ${theme === option.id ? 'text-white scale-105 font-black' : 'text-[var(--text-secondary)] opacity-60 hover:opacity-100 font-bold'}`}
                    >
                      <option.icon size={16} strokeWidth={2.5} />
                      <span className="text-[7px] uppercase tracking-[0.2em] mt-1">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Label className="tracking-[0.4em]">Scale Factor</Label>
                <div className="flex bg-[var(--bg-card-muted)] p-1.5 rounded-2xl border border-[var(--border-ui)] shadow-inner">
                  {['sm', 'base', 'lg'].map(size => (
                    <button 
                      key={size} 
                      onClick={() => setFontSize(size as any)} 
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${fontSize === size ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-10 lg:p-14 space-y-12">
            <div className="flex items-center gap-4 text-[var(--accent)] border-b border-[var(--border-ui)] pb-8">
              <Accessibility size={28} />
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Accessibility Node</h3>
                <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Configure interface logic</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-3xl flex items-center justify-between group transition-all hover:border-[var(--accent)]/40">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-card)] rounded-2xl text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                    <Contrast size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">High Contrast</p>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1">Enhanced visibility for registry nodes.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-[var(--bg-card)] rounded-full border border-[var(--border-ui)] p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-[var(--text-secondary)]/40 rounded-full" />
                </div>
              </div>

              <div className="p-6 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-3xl flex items-center justify-between group transition-all hover:border-[var(--accent)]/40">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-card)] rounded-2xl text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                    <Languages size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Localization</p>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1">Registry interface language.</p>
                  </div>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase text-[var(--accent)] outline-none cursor-pointer"
                >
                  {languages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>

              <div className="p-6 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-3xl flex items-center justify-between group transition-all hover:border-[var(--accent)]/40">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-card)] rounded-2xl text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                    <Type size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Dyslexic Font</p>
                    <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1">OpenDyslexic node integration.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-[var(--bg-card)] rounded-full border border-[var(--border-ui)] p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-[var(--text-secondary)]/40 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 animate-enter">
          <div className="lg:col-span-8 space-y-10">
            <Card className="p-10 lg:p-14 space-y-12">
              <div className="flex items-center gap-4 text-rose-500 border-b border-[var(--border-ui)] pb-8">
                <ShieldCheck size={28} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Security Protocols</h3>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Authentication and Access Control</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-[2.5rem] flex items-center justify-between">
                   <div className="space-y-2">
                      <p className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest">Multi-Factor Sync</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Require node verification for every login.</p>
                   </div>
                   <Badge variant="warning" className="!text-[8px]">Inert Node</Badge>
                </div>
                <div className="p-8 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-[var(--accent)]/50 transition-all">
                   <div className="space-y-2">
                      <p className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest">Session Persistence</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Purge local registry after inactivity.</p>
                   </div>
                   <ChevronDown size={18} className="-rotate-90 text-[var(--text-secondary)] group-hover:text-[var(--accent)]" />
                </div>
              </div>
            </Card>

            <Card className="p-10 lg:p-14 border-rose-500/10 bg-rose-500/[0.01]">
              <div className="flex items-center gap-4 text-rose-500 mb-8">
                <Trash2 size={24} />
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-primary)]">Protocol Decommission</h3>
              </div>
              <div className="p-8 bg-[var(--bg-card-muted)]/50 border border-rose-500/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="text-center md:text-left">
                    <p className="text-[11px] font-black uppercase text-[var(--text-primary)] tracking-widest mb-1">Purge Organization Node</p>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed">Permanently decommission organization and all linked registry entries.</p>
                 </div>
                 <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="h-12 px-8 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-900/5 shrink-0"
                 >
                   Initialize Purge
                 </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="p-10 bg-emerald-500/[0.02] border-emerald-500/20 text-center border-2">
              <ShieldCheck size={56} className="text-emerald-500 mx-auto mb-8" strokeWidth={1.5} />
              <h4 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">Registry Export</h4>
              <p className="text-[10px] font-bold mt-6 uppercase tracking-widest leading-loose text-[var(--text-secondary)]">Download organizational node data for offline verification.</p>
              <div className="h-px bg-[var(--border-ui)] my-10" />
              <Button icon={Download} onClick={downloadData} className="w-full h-14 shadow-2xl bg-[var(--bg-card-muted)] border-[var(--border-ui)] hover:bg-[var(--accent)] transition-all uppercase tracking-widest text-[10px]">Export Ledger</Button>
            </Card>

            <Card className="p-10 bg-indigo-500/[0.02] border-indigo-500/20 text-center border-2">
              <LogOut size={56} className="text-indigo-500 mx-auto mb-8" strokeWidth={1.5} />
              <h4 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">Terminal Disconnect</h4>
              <p className="text-[10px] font-bold mt-6 uppercase tracking-widest leading-loose text-[var(--text-secondary)]">Deactivate current strategic session across all devices.</p>
              <div className="h-px bg-[var(--border-ui)] my-10" />
              <Button variant="outline" icon={LogOut} onClick={() => setIsLogoutModalOpen(true)} className="w-full h-14 !text-[var(--accent)] border-[var(--accent)]/30 hover:!bg-[var(--accent)] hover:!text-white uppercase tracking-widest text-[10px]">Close Node</Button>
            </Card>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isResetModalOpen} 
        title="Node Purge Sequence" 
        message="This will permanently decommission your organizational registry. All transaction nodes, mission data, and identity records will be purged from the cloud. This action is terminal and irreversible. Proceed?" 
        confirmLabel="Execute Purge" 
        onConfirm={() => { localStorage.clear(); window.location.reload(); }} 
        onCancel={() => setIsResetModalOpen(false)} 
      />

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Close Session"
        message="Terminate your connection to the strategic terminal?"
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Settings;