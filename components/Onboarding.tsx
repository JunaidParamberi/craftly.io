
import React, { useState } from 'react';
import { 
  Zap, Building2, Globe, 
  CheckCircle2, ArrowRight, ShieldCheck, 
  Landmark, BadgePercent, Loader2
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { UserProfile, Currency } from '../types.ts';
import { Button, Input, Select, Label, Card } from './ui/Primitives.tsx';
import { functions } from '../services/firebase.ts';
import { httpsCallable } from 'firebase/functions';

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'EU', name: 'European Union', currency: 'EUR' }
];

const CURRENCIES: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'INR', 'JPY', 'CAD'];

const Onboarding: React.FC = () => {
  const { user, refreshUser } = useBusiness();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: user?.displayName || '',
    companyName: '',
    title: '',
    website: '',
    currency: 'AED',
    branding: {
      address: '',
      trn: '',
      bankDetails: '',
      primaryColor: '#6366F1',
      country: 'United Arab Emirates',
      isTaxRegistered: false
    }
  });

  const updateBranding = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      branding: { ...prev.branding!, [key]: value }
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    const companyId = `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    try {
      const initializeTenant = httpsCallable(functions, 'initializeTenant');
      
      // 1. Call Cloud Function to set Custom Claims and Profile
      await initializeTenant({
        fullName: formData.fullName,
        title: formData.title,
        companyName: formData.companyName,
        companyId: companyId,
        currency: formData.currency,
        branding: formData.branding
      });

      // 2. CRITICAL: Force refresh user to get new claims and await it
      await refreshUser();
      
      // 3. Add a slight artificial delay to allow Auth backend state sync if needed
      await new Promise(r => setTimeout(r, 500));
      
      // 4. Manual window reload or direct navigate to dash
      window.location.href = '/#/dashboard';
      window.location.reload();
    } catch (error: any) {
      console.error("Onboarding Sync Error:", error);
      alert("Failed to initialize node: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="w-full max-w-2xl animate-enter relative z-10">
        <div className="mb-10 text-center">
           <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
              ))}
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Node Sync Protocol</p>
        </div>

        <Card className="bg-[#0F172A]/80 backdrop-blur-2xl border-[#1E293B] !p-10 lg:!p-16 rounded-[3rem] shadow-2xl">
          {step === 1 && (
            <div className="space-y-10 animate-pop-in">
               <header>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6"><Building2 size={28}/></div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Identity Check</h2>
                  <p className="text-sm text-slate-400 font-bold mt-4 tracking-tight">How should the terminal address you?</p>
               </header>
               <div className="space-y-6">
                  <Input label="Your Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} placeholder="E.G. ALEX DRIVER" />
                  <Input label="Professional Designation" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} placeholder="E.G. TECHNICAL CONSULTANT" />
               </div>
               <Button onClick={next} disabled={!formData.fullName || !formData.title} className="w-full h-16 shadow-xl">Forward <ArrowRight size={18} className="ml-3"/></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-pop-in">
               <header>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6"><Zap size={28}/></div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Enterprise Node</h2>
                  <p className="text-sm text-slate-400 font-bold mt-4 tracking-tight">Specify your studio or consultancy parameters.</p>
               </header>
               <div className="space-y-6">
                  <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value.toUpperCase()})} placeholder="E.G. CYBER SYSTEMS" />
                  <Input label="Business Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://studio.com" />
               </div>
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={prev} className="h-16 px-8">Back</Button>
                  <Button onClick={next} disabled={!formData.companyName} className="flex-1 h-16 shadow-xl">Initialize Enterprise</Button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-pop-in">
               <header>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6"><Globe size={28}/></div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Regional Matrix</h2>
                  <p className="text-sm text-slate-400 font-bold mt-4 tracking-tight">Define your operational coordinates and ledger currency.</p>
               </header>
               <div className="space-y-8">
                  <Select label="Operation Hub (Country)" value={formData.branding?.country} onChange={e => {
                    const c = COUNTRIES.find(cn => cn.name === e.target.value);
                    updateBranding('country', e.target.value);
                    if (c) setFormData(prev => ({...prev, currency: c.currency as Currency}));
                  }}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </Select>
                  <Select label="Ledger Currency" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
               </div>
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={prev} className="h-16 px-8">Back</Button>
                  <Button onClick={next} className="flex-1 h-16 shadow-xl">Lock Coordinates</Button>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-pop-in">
               <header>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6"><BadgePercent size={28}/></div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Fiscal Configuration</h2>
                  <p className="text-sm text-slate-400 font-bold mt-4 tracking-tight">Configure tax compliance parameters for the ledger.</p>
               </header>
               <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl group transition-all hover:border-indigo-500/50">
                    <input type="checkbox" id="taxReg" checked={formData.branding?.isTaxRegistered} onChange={e => updateBranding('isTaxRegistered', e.target.checked)} className="w-6 h-6 rounded-lg bg-slate-900 border-white/20 text-indigo-500 focus:ring-indigo-500" />
                    <label htmlFor="taxReg" className="flex-1 cursor-pointer">
                       <p className="text-xs font-black uppercase tracking-widest text-white">VAT / Tax Registered</p>
                       <p className="text-[10px] text-slate-500 font-bold mt-1">Enable this if you are a registered tax entity.</p>
                    </label>
                  </div>
                  {formData.branding?.isTaxRegistered && (
                    <Input label="Tax ID / TRN" value={formData.branding.trn} onChange={e => updateBranding('trn', e.target.value)} placeholder="ENTER YOUR NUMERIC ID" />
                  )}
                  <div className="space-y-2">
                    <Label>Business Address</Label>
                    <textarea value={formData.branding?.address} onChange={e => updateBranding('address', e.target.value)} className="w-full bg-[#020617] border border-[#1E293B] rounded-2xl p-5 text-sm font-semibold text-white outline-none focus:border-indigo-500 min-h-[100px]" placeholder="STREET, BUILDING, OFFICE..." />
                  </div>
               </div>
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={prev} className="h-16 px-8">Back</Button>
                  <Button onClick={next} className="flex-1 h-16 shadow-xl">Verify Fiscal Node</Button>
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 animate-pop-in">
               <header>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6"><Landmark size={28}/></div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Settlement Node</h2>
                  <p className="text-sm text-slate-400 font-bold mt-4 tracking-tight">Define where project worth should be deposited.</p>
               </header>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Bank Details (Manual Transfer)</Label>
                    <textarea value={formData.branding?.bankDetails} onChange={e => updateBranding('bankDetails', e.target.value)} className="w-full bg-[#020617] border border-[#1E293B] rounded-2xl p-6 text-sm font-semibold text-white outline-none focus:border-indigo-500 min-h-[120px]" placeholder="BANK NAME, SWIFT, ACCOUNT NO, IBAN..." />
                  </div>
               </div>
               <div className="pt-6">
                  <Button onClick={handleComplete} loading={isSubmitting} className="w-full h-18 text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] bg-indigo-600 border-indigo-600">
                    {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Node Syncing...</span> : 'Complete Initialization'} 
                    {!isSubmitting && <ShieldCheck className="ml-3" size={24}/>}
                  </Button>
               </div>
            </div>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-center gap-3 text-emerald-500 opacity-40">
           <CheckCircle2 size={16}/>
           <span className="text-[9px] font-black uppercase tracking-[0.3em]">Encrypted Handshake Active</span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
