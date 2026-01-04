
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Mail, Edit2, X, UserCheck, Trash2, Users, Search, 
  Smile, Meh, Frown, Send, Sparkles, 
  Loader2, CheckCircle2, ShieldCheck, 
  MessageSquare, CheckSquare, Square, Filter,
  Phone, Image as ImageIcon, Download,
  Upload, RefreshCw, Clipboard, ArrowRight, Zap, Copy,
  Check
} from 'lucide-react';
import { Client } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { GoogleGenAI, Type } from '@google/genai';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Input, Button, Heading, Card, Badge, EmptyState, Select, Label } from './ui/Primitives.tsx';

const CRM: React.FC = () => {
  const { clients, setClients, addClient, updateClient, pushNotification, addAuditLog, userProfile, campaignAsset, setCampaignAsset, showToast } = useBusiness();
  const [activeTab, setActiveTab] = useState<'list' | 'campaigns'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingId] = useState<Client | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Campaign Engine State
  const [isCampaigning, setIsCampaigning] = useState(false);
  const [campaignChannel, setCampaignChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [campaignData, setCampaignData] = useState({ subject: '', body: '', targetStatus: 'ALL' });
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Image Generation State
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dispatcher State
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCopying, setIsCopying] = useState(false);

  // Defaults
  const activeEmail = userProfile.branding.campaignEmail || 'junaidparamberi@gmail.com';
  const activePhone = userProfile.branding.campaignPhone || '+971581976818';

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '', email: '', status: 'Lead', currency: 'AED', totalLTV: 0, 
    contactPerson: '', phone: '', countryCode: '+971', address: '', taxId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligibleRecipients = clients.filter(c => 
    campaignData.targetStatus === 'ALL' || c.status === campaignData.targetStatus
  );

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedRecipientIds(eligibleRecipients.map(c => c.id));
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
      setCampaignAsset(null);
    };
    reader.readAsDataURL(file);
  };

  const generateAiCampaign = async () => {
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Task: Write a ${campaignChannel === 'WHATSAPP' ? 'short direct WhatsApp' : 'professional business email'}. Context: "${campaignData.subject || 'Strategy'}". Mixed case only. JSON output keys: subject, body.`;
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(res.text || '{}');
      setCampaignData(prev => ({ ...prev, subject: data.subject || '', body: data.body || '' }));
    } catch (e) {
      showToast('AI node unreachable', 'error');
    } finally { setIsAiGenerating(false); }
  };

  const generateVisualAsset = async () => {
    if (!campaignData.subject) { showToast('Subject required for visual sync', 'error'); return; }
    setIsGeneratingPoster(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: `High-end marketing poster for: ${campaignData.subject}. Aspect ratio: ${aspectRatio}. Professional and sleek.` }];
      if (attachedImage) parts.push({ inlineData: { data: attachedImage.data, mimeType: attachedImage.mimeType } });
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      });
      for (const part of res.candidates[0].content.parts) if (part.inlineData) setCampaignAsset(`data:image/png;base64,${part.inlineData.data}`);
    } finally { setIsGeneratingPoster(false); }
  };

  const useAsReference = () => {
    if (!campaignAsset) return;
    const [header, data] = campaignAsset.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    setAttachedImage({ data, mimeType: mime });
    setCampaignAsset(null);
  };

  const copyAssetToClipboard = async () => {
    if (!campaignAsset) return true;
    setIsCopying(true);
    try {
      const response = await fetch(campaignAsset);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      return true;
    } catch (err) {
      console.error('Clipboard sync failed', err);
      return false;
    } finally { setIsCopying(false); }
  };

  const startDispatchSequence = () => {
    if (selectedRecipientIds.length === 0) { showToast('No recipients targeted', 'error'); return; }
    setCurrentIndex(0);
    setIsDispatching(true);
  };

  const executeCurrentDispatch = async () => {
    const currentId = selectedRecipientIds[currentIndex];
    const client = clients.find(c => c.id === currentId);
    if (!client) return;

    const hasAsset = !!campaignAsset;
    if (hasAsset) await copyAssetToClipboard();

    if (campaignChannel === 'WHATSAPP') {
      const url = `https://wa.me/${client.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(campaignData.body)}`;
      window.open(url, '_blank');
    } else {
      const url = `mailto:${client.email}?subject=${encodeURIComponent(campaignData.subject)}&body=${encodeURIComponent(campaignData.body)}`;
      window.location.href = url;
    }

    if (currentIndex + 1 < selectedRecipientIds.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsDispatching(false);
      showToast('Sequence completed');
      addAuditLog('SENT', `Campaign-${campaignChannel}`, `SEQ-${selectedRecipientIds.length}`);
    }
  };

  return (
    <div className="space-y-8 animate-enter pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <Heading sub="Node Registry & Outreach">Business Clusters</Heading>
          <div className="flex items-center gap-1 mt-6 p-1.5 bg-[var(--bg-card-muted)] rounded-2xl border border-[var(--border-ui)] w-fit shadow-sm">
            <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-[var(--text-primary)]'}`}>Registry</button>
            <button onClick={() => setActiveTab('campaigns')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-[var(--text-primary)]'}`}>Campaign Engine</button>
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search registry..." className="w-full sm:w-56 h-11 pl-10 pr-4 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button onClick={() => setShowForm(true)} variant="primary" icon={Plus} className="h-11 px-6 shadow-indigo-500/10">Add Node</Button>
          </div>
        )}
      </header>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <Card key={client.id} className="p-6 relative group border border-white/5 bg-slate-900/20">
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button onClick={() => { setEditingId(client); setFormData(client); setShowForm(true); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Edit2 size={14}/></button>
                <button onClick={() => setConfirmDeleteId(client.id)} className="p-2 bg-slate-800 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
              </div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg border border-white/10 shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate tracking-tight">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCheck size={12} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{client.contactPerson}</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                 <Badge variant={client.status === 'Active' ? 'success' : 'warning'}>{client.status}</Badge>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">LTV (AED)</p>
                    <p className="text-base font-bold text-white tabular-nums tracking-tighter">{(client.totalLTV || 0).toLocaleString()}</p>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden min-h-0 lg:min-h-[700px] shadow-2xl relative">
          {/* Dispatch Controls */}
          <div className="w-full lg:w-[450px] bg-slate-950/20 lg:border-r border-[var(--border-ui)] p-6 lg:p-10 flex flex-col shrink-0">
            <header className="mb-6 lg:mb-10">
               <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-2xl mb-4 lg:mb-6 ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                 {campaignChannel === 'WHATSAPP' ? <MessageSquare size={20} className="lg:w-6 lg:h-6" /> : <Mail size={20} className="lg:w-6 lg:h-6" />}
               </div>
               <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-white leading-none">Campaign Console</h3>
               <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 lg:mt-4">Transmitting via: {campaignChannel === 'WHATSAPP' ? activePhone : activeEmail}</p>
            </header>

            <div className="space-y-6 lg:space-y-8 flex-1">
              <div className="flex p-1 bg-slate-900/40 rounded-xl border border-white/5 shadow-inner">
                 <button onClick={() => setCampaignChannel('EMAIL')} className={`flex-1 py-2 lg:py-3 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${campaignChannel === 'EMAIL' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Email Protocol</button>
                 <button onClick={() => setCampaignChannel('WHATSAPP')} className={`flex-1 py-2 lg:py-3 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>WhatsApp Node</button>
              </div>

              <Input label="Context Reference" placeholder="Campaign objective..." value={campaignData.subject} onChange={e => setCampaignData({...campaignData, subject: e.target.value})} className="font-bold !h-10 lg:!h-12" />
              
              <div className="space-y-2 lg:space-y-3">
                 <div className="flex justify-between items-center">
                    <Label>Message Payload</Label>
                    <button onClick={generateAiCampaign} disabled={isAiGenerating} className="text-[8px] lg:text-[9px] font-black uppercase text-indigo-400 flex items-center gap-1.5 lg:gap-2 hover:underline">
                      {isAiGenerating ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} AI Draft
                    </button>
                 </div>
                 <textarea className="w-full h-32 lg:h-48 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl lg:rounded-2xl p-4 lg:p-6 text-xs lg:text-sm font-medium outline-none focus:border-indigo-600 transition-all shadow-inner leading-relaxed resize-none" placeholder="Enter campaign copy..." value={campaignData.body} onChange={e => setCampaignData({...campaignData, body: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                 <Select label="Visual Frame" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="!h-10 lg:!h-11">
                    <option value="16:9">16:9 Cin</option>
                    <option value="1:1">1:1 Sq</option>
                    <option value="9:16">9:16 Vert</option>
                 </Select>
                 <div className="space-y-2">
                    <Label>Asset Ref</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button onClick={() => attachedImage ? setAttachedImage(null) : fileInputRef.current?.click()} className={`w-full h-10 lg:h-11 px-3 lg:px-4 rounded-lg lg:rounded-xl border flex items-center justify-center gap-2 transition-all ${attachedImage ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-indigo-500'}`}>
                       {attachedImage ? <Check size={14}/> : <Upload size={14}/>}
                       <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest">{attachedImage ? 'Linked' : 'Attach'}</span>
                    </button>
                 </div>
              </div>
            </div>

            <div className="pt-6 lg:pt-8 mt-6 lg:mt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Targeting</p>
                   <p className="text-xs lg:text-sm font-black text-white">{selectedRecipientIds.length} Nodes</p>
                </div>
                <Button onClick={startDispatchSequence} disabled={selectedRecipientIds.length === 0} className={`h-12 lg:h-14 px-5 lg:px-8 rounded-xl lg:rounded-2xl shadow-2xl uppercase tracking-[0.1em] lg:tracking-[0.2em] font-black text-[10px] lg:text-xs ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600 border-emerald-600' : 'bg-indigo-600 border-indigo-600'}`}>Execute Sequence</Button>
              </div>
            </div>
          </div>

          {/* Asset Preview Surface */}
          <div className="flex-1 bg-slate-900/40 p-6 lg:p-12 overflow-y-auto custom-scroll flex flex-col relative min-h-[400px]">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
             
             <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10 relative z-10">
                <div>
                  <h4 className="text-xs lg:text-sm font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white">Visual Synthesizer</h4>
                  <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 lg:mt-2">NANO BANANA PIXEL ENGINE</p>
                </div>
                <button onClick={generateVisualAsset} disabled={isGeneratingPoster} className="w-full sm:w-auto px-5 lg:px-6 h-10 lg:h-11 bg-indigo-600 text-white rounded-lg lg:rounded-xl font-black uppercase text-[9px] lg:text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2.5 lg:gap-3 hover:scale-105 transition-all">
                  {isGeneratingPoster ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                  {campaignAsset ? 'Re-Synthesize' : 'Generate Asset'}
                </button>
             </header>

             <div className="flex-1 flex flex-col min-h-0 relative z-10">
                <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden group mb-8 lg:mb-10 min-h-[260px]">
                   {isGeneratingPoster ? (
                     <div className="text-center space-y-3 lg:space-y-4 animate-pulse">
                        <Loader2 size={40} className="lg:w-12 lg:h-12 animate-spin text-indigo-500 mx-auto" />
                        <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] lg:tracking-[0.4em] text-indigo-500">Processing Node Pixels...</p>
                     </div>
                   ) : campaignAsset ? (
                     <div className="relative w-full h-full p-4 lg:p-6 flex flex-col items-center justify-center">
                        <img src={campaignAsset} alt="Asset" className="max-w-full max-h-full object-contain rounded-xl lg:rounded-2xl shadow-2xl" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 lg:gap-4 backdrop-blur-sm">
                           <button onClick={useAsReference} className="px-5 lg:px-6 h-10 lg:h-12 bg-white text-indigo-600 rounded-lg lg:rounded-xl font-black uppercase text-[9px] lg:text-[10px] flex items-center gap-2 hover:scale-105 transition-all shadow-2xl"><RefreshCw size={14}/> Use as Ref</button>
                           <button onClick={() => setCampaignAsset(null)} className="p-3 lg:p-4 bg-rose-600 text-white rounded-lg lg:rounded-xl hover:scale-110 active:scale-95 transition-all"><X size={18} className="lg:w-5 lg:h-5"/></button>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center opacity-10 space-y-4 lg:space-y-6">
                        <ImageIcon size={60} className="lg:w-20 lg:h-20" strokeWidth={1} />
                        <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.4em] lg:tracking-[0.6em]">Visual Buffer Idle</p>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                   <div className="w-full">
                      <div className="flex items-center justify-between mb-4 lg:mb-6">
                         <div className="flex items-center gap-3 lg:gap-4 text-indigo-500">
                           <Filter size={16} className="lg:w-[18px] lg:h-[18px]" />
                           <h5 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em]">Recipient Logic</h5>
                         </div>
                         <button onClick={selectAllFiltered} className="text-[8px] lg:text-[9px] font-black uppercase text-indigo-400 hover:underline">Select Cluster</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4 max-h-[240px] lg:max-h-[300px] overflow-y-auto custom-scroll pr-1 lg:pr-2">
                         {eligibleRecipients.map(c => (
                            <button key={c.id} onClick={() => toggleRecipient(c.id)} className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all text-left ${selectedRecipientIds.includes(c.id) ? 'bg-indigo-600/10 border-indigo-600' : 'bg-slate-900/40 border-transparent hover:border-white/10'}`}>
                               <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedRecipientIds.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                  {selectedRecipientIds.includes(c.id) ? <CheckSquare size={14} className="lg:w-4 lg:h-4"/> : <Square size={14} className="lg:w-4 lg:h-4"/>}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-[11px] lg:text-xs font-bold text-white truncate">{c.name}</p>
                                  <p className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase truncate">{campaignChannel === 'WHATSAPP' ? c.phone : c.email}</p>
                               </div>
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Dispatcher Sequence Modal */}
          {isDispatching && createPortal(
            <div className="exec-modal-overlay">
               <div className="exec-modal-container max-w-xl animate-pop-in border-none shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                  <header className="p-6 lg:p-8 border-b border-white/5 flex items-center justify-between bg-slate-900">
                     <div className="flex items-center gap-3 lg:gap-4">
                        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center text-white ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                           <Zap size={18} className="lg:w-5 lg:h-5" />
                        </div>
                        <div>
                           <h3 className="text-xs lg:text-sm font-black uppercase tracking-widest text-white">Sequence Dispatcher</h3>
                           <p className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 lg:mt-1">Transmission Queue: {currentIndex + 1} of {selectedRecipientIds.length}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsDispatching(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X size={20} className="lg:w-6 lg:h-6"/></button>
                  </header>
                  <div className="p-6 lg:p-10 space-y-6 lg:space-y-10 bg-slate-900">
                     <div className="flex items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-slate-950/50 rounded-2xl lg:rounded-[2rem] border border-white/5">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xl lg:text-2xl shrink-0">
                           {clients.find(c => c.id === selectedRecipientIds[currentIndex])?.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 lg:mb-1">Current Node</p>
                           <h4 className="text-lg lg:text-xl font-black text-white truncate uppercase tracking-tight">{clients.find(c => c.id === selectedRecipientIds[currentIndex])?.name}</h4>
                           <p className="text-[9px] lg:text-[10px] font-bold text-indigo-400 mt-0.5 lg:mt-1 uppercase truncate">{campaignChannel === 'WHATSAPP' ? clients.find(c => c.id === selectedRecipientIds[currentIndex])?.phone : clients.find(c => c.id === selectedRecipientIds[currentIndex])?.email}</p>
                        </div>
                     </div>

                     <div className="space-y-4 lg:space-y-6">
                        <div className="flex items-center gap-2.5 lg:gap-3 text-indigo-400">
                           <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-indigo-500 animate-pulse" />
                           <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Protocol Sequence Step</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 lg:gap-4">
                           {campaignAsset && (
                              <div className={`p-4 lg:p-5 rounded-xl lg:rounded-2xl border transition-all flex items-center justify-between ${isCopying ? 'bg-indigo-500 text-white border-indigo-500 animate-pulse' : 'bg-white/5 border-white/5'}`}>
                                 <div className="flex items-center gap-3 lg:gap-4">
                                    <ImageIcon size={16} className="lg:w-[18px] lg:h-[18px]"/>
                                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Visual Asset Sync</span>
                                 </div>
                                 <Badge variant="info" className="!text-[7px]">Ready</Badge>
                              </div>
                           )}
                           <div className="p-4 lg:p-5 rounded-xl lg:rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3 lg:gap-4">
                                 {campaignChannel === 'WHATSAPP' ? <MessageSquare size={16} className="lg:w-[18px] lg:h-[18px]"/> : <Mail size={16} className="lg:w-[18px] lg:h-[18px]"/>}
                                 <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Terminal Dispatch</span>
                              </div>
                              <Badge variant="success" className="!text-[7px]">Active Link</Badge>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 lg:pt-6 border-t border-white/5 flex flex-col gap-3 lg:gap-4">
                        <Button onClick={executeCurrentDispatch} loading={isCopying} className={`h-14 lg:h-16 w-full rounded-xl lg:rounded-2xl shadow-2xl font-black uppercase text-[9px] lg:text-[10px] tracking-[0.2em] lg:tracking-[0.3em] ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600 border-emerald-600' : 'bg-indigo-600 border-indigo-600'}`}>
                           Open Terminal & Sync Asset
                        </Button>
                        <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest opacity-60">System will automatically copy visual node to clipboard</p>
                     </div>
                  </div>
               </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-3xl animate-pop-in border-none shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-slate-900">
            <header className="p-6 border-b border-white/5 flex justify-between items-center">
              <Heading sub={editingClient ? 'Registry Update' : 'Node Initialization'}>{editingClient ? 'Edit Partner' : 'New Partner'}</Heading>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
            </header>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingClient) { updateClient({ ...editingClient, ...formData } as Client); } else { addClient(formData); }
              setShowForm(false);
            }} className="p-8 space-y-8 custom-scroll max-h-[80vh] overflow-y-auto bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Company Name" value={formData.name} placeholder="E.G. EMAAR PROPERTIES" onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                <Input label="Contact Name" value={formData.contactPerson} placeholder="E.G. AHMED AL-SAYED" onChange={e => setFormData({...formData, contactPerson: e.target.value.toUpperCase()})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Business Email" type="email" value={formData.email} placeholder="procurement@company.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input label="Phone Number" value={formData.phone} placeholder="+971 00 000 0000" onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="pt-6 border-t border-white/5 flex justify-end">
                <Button type="submit" variant="primary" className="h-14 px-12 shadow-2xl">Commit Node</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal 
        isOpen={!!confirmDeleteId} 
        title="Purge Node" 
        message="This will permanently decommission this client registry node. Proceed?" 
        onConfirm={() => { setClients(clients.filter(c => c.id !== confirmDeleteId)); setConfirmDeleteId(null); }} 
        onCancel={() => setConfirmDeleteId(null)} 
      />
    </div>
  );
};

export default CRM;
