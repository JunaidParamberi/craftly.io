import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Mail, Edit2, X, UserCheck, Trash2, Search, 
  Sparkles, Loader2, MessageSquare, CheckSquare, Square, Filter,
  Upload, RefreshCw, Download, Check, Copy, Users, Zap,
  Wand2, ClipboardCheck, History, Archive, RotateCcw,
  Image as ImageIcon, Calendar, Target, Type as FontIcon,
  Layout, MousePointer2, Share2, FileImage, Palette,
  Save, Eye, ArrowRight, Maximize2, Droplets, Sliders,
  Layers, ChevronDown, CheckCircle2, AlertCircle, Globe, CreditCard
} from 'lucide-react';
import { Client, Campaign, Currency } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { GoogleGenAI, Type } from '@google/genai';
import ConfirmationModal from './ConfirmationModal';
import { Input, Button, Heading, Card, Badge, Select, Label, EmptyState, PriceInput } from './ui/Primitives';

const CAMPAIGN_PATTERNS = [
  { id: 'none', label: 'Raw Node', color: 'transparent' },
  { id: 'vibrant', label: 'Indigo Pulse', color: 'rgba(99, 102, 241, 0.2)' },
  { id: 'emerald', label: 'Forest Logic', color: 'rgba(16, 185, 129, 0.2)' },
  { id: 'golden', label: 'Elite Tier', color: 'rgba(245, 158, 11, 0.2)' },
  { id: 'mono', label: 'Onyx Matrix', color: 'rgba(0, 0, 0, 0.4)' },
];

const CRM: React.FC = () => {
  const { 
    clients, addClient, updateClient, deleteClient, 
    userProfile, campaignAsset, setCampaignAsset, 
    campaigns, saveCampaign, showToast, addAuditLog, loading,
    invoices
  } = useBusiness();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'list' | 'campaigns'>('list');
  const [campaignViewMode, setCampaignViewMode] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingId] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'Lead',
    country: 'United Arab Emirates',
    currency: 'AED',
    taxId: '',
    paymentPortal: ''
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Clearance Checks
  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const hasCampaignPermission = isOwner || (userProfile?.permissions || []).includes('MANAGE_CAMPAIGNS');

  // Campaign Core State
  const [campaignChannel, setCampaignChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [campaignData, setCampaignData] = useState({ subject: '', body: '', targetStatus: 'ALL' });
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Visual Compositor State
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [visualPrompt, setVisualPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [brandedAsset, setBrandedAsset] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  const [designSettings, setDesignSettings] = useState({
    showLogo: true,
    logoPosition: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    overlayText: '',
    fontFamily: 'Plus Jakarta Sans',
    textColor: '#ffffff',
    pattern: 'none',
    opacity: 100
  });

  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const compositorCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dispatcher State
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCopying, setIsCopying] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  // Derived LTV calculation from real-time invoice data
  const getClientLTV = (clientName: string) => {
    return invoices
      .filter(inv => inv.clientId === clientName && inv.status === 'Paid')
      .reduce((acc, curr) => acc + (curr.amountAED || 0), 0);
  };

  const getEffectiveStatus = (client: Client) => {
    if (client.status === 'Archived') return 'Archived';
    // Automated: If client has any invoices (Paid, Partial, or Sent), they are Active.
    const hasBusinessActivity = invoices.some(inv => inv.clientId === client.name);
    return hasBusinessActivity ? 'Active' : client.status;
  };

  const eligibleRecipients = clients.filter(c => 
    campaignData.targetStatus === 'ALL' || c.status === campaignData.targetStatus
  );

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  // --- COMPOSITOR ENGINE ---
  useEffect(() => {
    if (campaignAsset) {
      renderCompositedImage();
    } else {
      setBrandedAsset(null);
    }
  }, [campaignAsset, designSettings, userProfile?.branding?.logoUrl, customLogo]);

  const renderCompositedImage = async () => {
    if (!campaignAsset || !compositorCanvasRef.current) return;
    
    const canvas = compositorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = campaignAsset;

    baseImg.onload = async () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      ctx.drawImage(baseImg, 0, 0);

      const selectedPattern = CAMPAIGN_PATTERNS.find(p => p.id === designSettings.pattern);
      if (selectedPattern && selectedPattern.id !== 'none') {
        ctx.fillStyle = selectedPattern.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawOverlayText(ctx, canvas);

      const logoToUse = customLogo || userProfile?.branding?.logoUrl;
      if (designSettings.showLogo && logoToUse) {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = logoToUse;
        logo.onload = () => {
          const logoWidth = canvas.width * 0.12;
          const logoHeight = (logo.height / logo.width) * logoWidth;
          const margin = canvas.width * 0.04;
          
          let lx = margin, ly = margin;
          if (designSettings.logoPosition === 'top-right') lx = canvas.width - logoWidth - margin;
          if (designSettings.logoPosition === 'bottom-left') ly = canvas.height - logoHeight - margin;
          if (designSettings.logoPosition === 'bottom-right') {
            lx = canvas.width - logoWidth - margin;
            ly = canvas.height - logoHeight - margin;
          }

          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.beginPath();
          ctx.roundRect(lx - 15, ly - 15, logoWidth + 30, logoHeight + 30, 20);
          ctx.fill();

          ctx.drawImage(logo, lx, ly, logoWidth, logoHeight);
          setBrandedAsset(canvas.toDataURL('image/jpeg', designSettings.opacity / 100));
        };
      } else {
        setBrandedAsset(canvas.toDataURL('image/jpeg', designSettings.opacity / 100));
      }
    };
  };

  const drawOverlayText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (designSettings.overlayText) {
      ctx.fillStyle = designSettings.textColor;
      const fontSize = Math.floor(canvas.width * 0.06);
      ctx.font = `900 ${fontSize}px "${designSettings.fontFamily}"`;
      ctx.textAlign = 'center';
      
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 10;
      
      const words = designSettings.overlayText.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < canvas.width * 0.85) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      const lineHeight = fontSize * 1.1;
      const totalHeight = lines.length * lineHeight;
      const startY = (canvas.height / 2) - (totalHeight / 2) + fontSize;
      
      lines.forEach((line, i) => {
        ctx.fillText(line.toUpperCase(), canvas.width / 2, startY + (i * lineHeight));
      });

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  };

  const handleDownload = () => {
    if (!brandedAsset) return;
    const link = document.createElement('a');
    link.download = `CRAFTLY_CREATIVE_${Date.now()}.jpg`;
    link.href = brandedAsset;
    link.click();
    showToast('Asset exported to local drive');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCustomLogo(reader.result as string);
      reader.readAsDataURL(file);
      showToast('Custom logo uploaded');
    }
  };

  const generateAiCampaign = async () => {
    if (!campaignData.subject) { showToast('Provide objective node first', 'error'); return; }
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are Craftly AI. UAE freelancer marketing expert. Goal: "${campaignData.subject}". Generate punchy, premium copy. Return JSON {subject, body}.`;
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: campaignData.subject,
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } },
            required: ["subject", "body"]
          }
        }
      });
      const data = JSON.parse(res.text || '{}');
      setCampaignData(prev => ({ ...prev, subject: campaignChannel === 'EMAIL' ? (data.subject || prev.subject) : prev.subject, body: data.body || '' }));
      setDesignSettings(prev => ({ ...prev, overlayText: campaignData.subject }));
      showToast(`AI Copy Synthesized`);
    } catch (e) {
      showToast('Neural link failed', 'error');
    } finally { setIsAiGenerating(false); }
  };

  const generateVisualAsset = async () => {
    const finalPrompt = visualPrompt || campaignData.subject;
    if (!finalPrompt) { showToast('Directives required', 'error'); return; }
    setIsGeneratingPoster(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: `${finalPrompt}. Cinematic product photography, luxury aesthetic, high detail.` }];
      if (attachedImage) parts.push({ inlineData: { data: attachedImage.data, mimeType: attachedImage.mimeType } });
      
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      });
      
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setCampaignAsset(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
      showToast('Visual asset synthesized');
    } catch (e) {
      showToast('Graphics engine failure', 'error');
    } finally { setIsGeneratingPoster(false); }
  };

  const copyAssetToClipboard = async () => {
    if (!brandedAsset) return true;
    setIsCopying(true);
    try {
      const response = await fetch(brandedAsset);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      return true;
    } catch (err) {
      return false;
    } finally { setIsCopying(false); }
  };

  const executeCurrentDispatch = async () => {
    const currentId = selectedRecipientIds[currentIndex];
    const client = clients.find(c => c.id === currentId);
    if (!client) return;

    if (brandedAsset) {
      await copyAssetToClipboard();
      showToast('Visual asset buffered', 'info');
    }

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
      showToast('Sequence complete');
      addAuditLog('SENT', `Campaign-${campaignChannel}`, `SEQ-${selectedRecipientIds.length}`);
      saveCampaign({
        id: `CAMP-${Date.now()}`,
        companyId: userProfile?.companyId || 'global',
        subject: campaignData.subject,
        body: campaignData.body,
        channel: campaignChannel,
        assetUrl: brandedAsset || campaignAsset,
        recipientCount: selectedRecipientIds.length,
        timestamp: new Date().toISOString(),
        targetStatus: campaignData.targetStatus
      });
    }
  };

  const recallCampaign = (camp: Campaign) => {
    setCampaignChannel(camp.channel);
    setCampaignData({ subject: camp.subject, body: camp.body, targetStatus: camp.targetStatus });
    if (camp.assetUrl) setCampaignAsset(camp.assetUrl);
    setCampaignViewMode('NEW');
    showToast('Historical node restored');
  };

  if (loading) return null;

  return (
    <div className="space-y-4 lg:space-y-6 animate-enter pb-12 h-full overflow-y-auto no-scrollbar">
      <canvas ref={compositorCanvasRef} className="hidden" />

      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-1 shrink-0">
        <div>
          <Heading sub="Strategic design and communication studio" className="!space-y-2">Campaign Hub</Heading>
          <div className="flex items-center p-1 bg-slate-900 border border-white/5 rounded-2xl w-fit mt-8 shadow-2xl">
            <button 
              onClick={() => setActiveTab('list')} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              Registry
            </button>
            {hasCampaignPermission && (
              <button 
                onClick={() => setActiveTab('campaigns')} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
              >
                Campaign Engine
              </button>
            )}
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="flex flex-wrap items-center gap-4 mt-12 md:mt-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search targets..." 
                className="w-full sm:w-72 h-12 pl-12 pr-4 bg-slate-900/60 border border-white/5 rounded-[1.25rem] text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <Button 
              onClick={() => { setEditingId(null); setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Lead', country: 'United Arab Emirates', currency: 'AED' }); setShowForm(true); }} 
              variant="primary" 
              icon={Plus} 
              className="h-12 px-8 bg-indigo-600 border-indigo-600 text-[10px] uppercase font-black tracking-widest shadow-xl shadow-indigo-500/10"
            >
              Add Operative
            </Button>
          </div>
        )}
      </header>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 max-w-6xl">
          {filteredClients.map(client => {
            const status = getEffectiveStatus(client);
            const ltvValue = getClientLTV(client.name);
            
            return (
              <Card 
                key={client.id} 
                className="p-8 relative group border-white/5 bg-[#0B1120] hover:border-indigo-500/40 transition-all rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[180px] cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                 <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(client); setFormData(client); setShowForm(true); }} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl"><Edit2 size={14}/></button>
                  <button onClick={() => setConfirmDeleteId(client.id)} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl"><Trash2 size={14}/></button>
                </div>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shrink-0 uppercase border border-white/10">{client.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-white truncate uppercase tracking-tight leading-none mb-3">{client.name}</h3>
                    <div className="flex items-center gap-2 opacity-60">
                      <UserCheck size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{client.contactPerson}</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-px bg-white/5 w-full mb-8" />
                
                <div className="flex justify-between items-end relative">
                   <Badge variant={status === 'Active' ? 'success' : status === 'Lead' ? 'warning' : 'info'} className="!px-4 !py-1.5 !rounded-lg !text-[9px] font-black tracking-widest">{status.toUpperCase()}</Badge>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Worth</p>
                      <div className="flex items-baseline justify-end gap-1.5">
                         <span className="text-[10px] font-black text-slate-600 uppercase">AED</span>
                         <p className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">{ltvValue.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
              </Card>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="col-span-full">
              <EmptyState 
                icon={Users} 
                title="Target Vacuum Detected" 
                description="Initialize your strategic registry by adding client nodes." 
                action={<Button onClick={() => { setEditingId(null); setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', status: 'Lead', country: 'United Arab Emirates', currency: 'AED' }); setShowForm(true); }} variant="primary" icon={Plus} className="h-12 px-8">Add First Operative</Button>} 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row bg-[#020617] border border-white/5 rounded-[2.5rem] overflow-hidden min-h-[700px] lg:min-h-[750px] shadow-2xl relative">
          <aside className="w-full lg:w-[380px] bg-[#0B1120] lg:border-r border-white/5 p-6 lg:p-8 flex flex-col shrink-0 overflow-y-auto custom-scroll">
            <header className="mb-8 flex justify-between items-start shrink-0">
               <div className="space-y-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    {campaignChannel === 'WHATSAPP' ? <MessageSquare size={24} /> : <Mail size={24} />}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-none">Studio</h3>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => { setCampaignAsset(null); setBrandedAsset(null); setCampaignData({subject:'', body:'', targetStatus:'ALL'}); setVisualPrompt(''); }} className="p-2.5 bg-white/5 hover:bg-indigo-500/10 text-indigo-400 border border-white/5 rounded-xl transition-all group" title="Reset Node"><RotateCcw size={18} className="group-hover:-rotate-90 transition-transform" /></button>
                  <button onClick={() => setCampaignViewMode(campaignViewMode === 'NEW' ? 'ARCHIVE' : 'NEW')} className={`p-2.5 border rounded-xl transition-all ${campaignViewMode === 'ARCHIVE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'}`} title="Historical Archive"><History size={18}/></button>
               </div>
            </header>

            {campaignViewMode === 'ARCHIVE' ? (
              <div className="flex-1 space-y-3 animate-enter pb-6">
                 {campaigns.length > 0 ? campaigns.map(camp => (
                   <button key={camp.id} onClick={() => recallCampaign(camp)} className="w-full p-4 bg-slate-900/40 border border-white/5 rounded-2xl text-left group hover:border-indigo-500 transition-all active:scale-[0.98] overflow-hidden relative shadow-md">
                      {camp.assetUrl && <div className="absolute right-0 top-0 bottom-0 w-20 opacity-10 group-hover:opacity-30 transition-opacity"><img src={camp.assetUrl} className="w-full h-full object-cover" /></div>}
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                           <div className={`p-1 rounded-md ${camp.channel === 'WHATSAPP' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{camp.channel === 'WHATSAPP' ? <MessageSquare size={12}/> : <Mail size={12}/>}</div>
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest tabular-nums">{new Date(camp.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-white truncate mb-1 pr-12">{camp.subject || '(NO SUBJECT)'}</h4>
                        <p className="text-[9px] text-slate-500 line-clamp-2 italic pr-8 leading-relaxed">"{camp.body}"</p>
                      </div>
                   </button>
                 )) : <div className="py-16 text-center opacity-10"><Archive size={48} className="mb-4 mx-auto" /><p className="text-[8px] font-black uppercase tracking-[0.5em]">Archive Empty</p></div>}
              </div>
            ) : (
              <div className="space-y-6 flex-1 animate-enter pb-6">
                <div className="flex p-1 bg-slate-950 border border-white/5 rounded-xl shadow-inner">
                   <button onClick={() => setCampaignChannel('EMAIL')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${campaignChannel === 'EMAIL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Email</button>
                   <button onClick={() => setCampaignChannel('WHATSAPP')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>WhatsApp</button>
                </div>

                <Input label="Objective" placeholder="What is the goal?" value={campaignData.subject} onChange={e => setCampaignData({...campaignData, subject: e.target.value})} className="font-black !h-12 !bg-slate-950 !border-white/5 text-white placeholder:text-slate-800" />
                
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <Label className="!text-slate-500 !opacity-100 uppercase tracking-widest">Draft Manifesto</Label>
                      <button onClick={generateAiCampaign} disabled={isAiGenerating} className="text-[8px] font-black uppercase text-indigo-400 flex items-center gap-1.5 hover:underline disabled:opacity-20">{isAiGenerating ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} AI Copy</button>
                   </div>
                   <textarea className="w-full h-24 lg:h-32 bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-indigo-600 transition-all shadow-inner leading-relaxed resize-none text-white placeholder:text-slate-800" placeholder="Draft copy..." value={campaignData.body} onChange={e => setCampaignData({...campaignData, body: e.target.value})} />
                </div>

                <div className="pt-4 space-y-6 border-t border-white/5">
                   <div className="flex justify-between items-center px-1">
                      <Label className="uppercase !text-slate-500 tracking-widest">Visual Style</Label>
                      <button onClick={generateVisualAsset} disabled={isGeneratingPoster || !campaignData.subject} className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1.5 hover:underline disabled:opacity-30">{isGeneratingPoster ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10}/>} Synthesize Image</button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <Select label="Ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="!h-10 !bg-slate-950 !border-white/5 !text-[10px]">
                          <option value="16:9">Wide (16:9)</option><option value="1:1">Square (1:1)</option><option value="9:16">Tall (9:16)</option>
                      </Select>
                      <div className="space-y-1.5">
                        <Label className="uppercase tracking-widest !text-[9px]">Ref Node</Label>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setAttachedImage({data:(r.result as string).split(',')[1], mimeType:f.type}); r.readAsDataURL(f); }}} />
                        <button onClick={() => attachedImage ? setAttachedImage(null) : fileInputRef.current?.click()} className={`w-full h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${attachedImage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-950 border-white/10 text-slate-500 hover:border-indigo-500'}`}>
                           {attachedImage ? <Check size={14}/> : <Upload size={14}/>}
                           <span className="text-[9px] font-black uppercase tracking-widest">{attachedImage ? 'Linked' : 'Attach'}</span>
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Target Cluster</p>
                    <p className="text-2xl font-black text-white tabular-nums">{selectedRecipientIds.length}</p>
                  </div>
                  <button onClick={() => { if(selectedRecipientIds.length) { setCurrentIndex(0); setIsDispatching(true); } }} disabled={selectedRecipientIds.length === 0} className={`h-12 px-6 rounded-xl shadow-lg uppercase tracking-[0.2em] font-black text-[10px] ${campaignChannel === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white active:scale-95 transition-all disabled:opacity-20`}>Execute Protocol</button>
               </div>
            </div>
          </aside>

          <main className="flex-1 bg-[#020617] p-6 lg:p-8 overflow-y-auto custom-scroll flex flex-col relative">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
             
             <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                <div>
                   <h4 className="text-base lg:text-lg font-black uppercase tracking-[0.4em] text-white">Visual Compositor</h4>
                   <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-80">Synthesis Hub</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={generateVisualAsset} disabled={isGeneratingPoster} className="px-5 h-11 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                     {isGeneratingPoster ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} 
                     {campaignAsset ? 'Re-Synthesize' : 'Initialize'}
                   </button>
                   {brandedAsset && (
                     <button onClick={handleDownload} className="px-5 h-11 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                        <Download size={16}/> Export
                     </button>
                   )}
                </div>
             </header>

             <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 min-h-0 mb-8">
                {/* PREVIEW AREA (Optimized height) */}
                <div className="flex-1 flex flex-col min-h-0 relative group">
                  <div className="flex-1 bg-[#0B1120]/40 border border-white/5 rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden relative group backdrop-blur-3xl min-h-[400px]">
                     {isGeneratingPoster ? (
                       <div className="text-center space-y-6 animate-pulse">
                          <Loader2 size={60} className="animate-spin text-indigo-500 mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Synthesizing node...</p>
                       </div>
                     ) : brandedAsset ? (
                       <div className="relative w-full h-full flex items-center justify-center p-6 group/img">
                          <img src={brandedAsset} alt="Node Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-xl transition-all group-hover/img:scale-[1.01]" />
                          <button onClick={() => setIsFullScreen(true)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-indigo-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-md shadow-2xl scale-75 group-hover/img:scale-100">
                             <Maximize2 size={32}/>
                          </button>
                       </div>
                     ) : (
                       <div className="text-center opacity-5 space-y-8">
                          <FileImage size={100} className="mx-auto" strokeWidth={1} />
                          <p className="text-[10px] font-black uppercase tracking-[0.8em]">Awaiting directives</p>
                       </div>
                     )}
                  </div>
                </div>

                {/* CONTROLS (More compact design) */}
                {campaignAsset && (
                  <div className="w-full lg:w-[320px] space-y-6 bg-[#0B1120] p-6 rounded-[2.5rem] border border-white/5 animate-enter shrink-0 backdrop-blur-3xl shadow-xl h-fit">
                    <header className="flex items-center gap-3 text-indigo-400 border-b border-white/5 pb-4">
                       <Palette size={18} />
                       <p className="text-[9px] font-black uppercase tracking-[0.4em]">Design Module</p>
                    </header>
                    
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Branding</span>
                             <input type="checkbox" checked={designSettings.showLogo} onChange={e => setDesignSettings({...designSettings, showLogo: e.target.checked})} className="w-5 h-5 rounded-md bg-slate-900 border-white/10 text-indigo-500" />
                          </div>
                          <div className="relative">
                             <input ref={logoUploadRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                             <button onClick={() => logoUploadRef.current?.click()} className="w-full h-11 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-600/20 transition-all">
                                {customLogo ? <CheckCircle2 size={16}/> : <Plus size={16}/>} 
                                {customLogo ? 'Logo Locked' : 'Upload Creative Logo'}
                             </button>
                             {customLogo && <button onClick={() => setCustomLogo(null)} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"><X size={12}/></button>}
                          </div>
                          <Select label="Anchor" value={designSettings.logoPosition} onChange={e => setDesignSettings({...designSettings, logoPosition: e.target.value as any})} disabled={!designSettings.showLogo} className="!bg-slate-950 !border-white/10 !h-10 !text-[10px] font-bold">
                             <option value="top-left">Top Left</option><option value="top-right">Top Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option>
                          </Select>
                       </div>

                       <div className="h-px bg-white/5" />

                       <div className="space-y-4">
                          <textarea className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-tight text-white outline-none focus:border-indigo-500 h-20 shadow-inner resize-none" value={designSettings.overlayText} onChange={e => setDesignSettings({...designSettings, overlayText: e.target.value})} placeholder="OVERLAY TEXT..." />
                          <div className="space-y-3">
                             <Label className="!text-[8px] !text-slate-600 uppercase tracking-widest">Filter Synthesis</Label>
                             <div className="grid grid-cols-5 gap-2">
                                {CAMPAIGN_PATTERNS.map(p => (
                                  <button key={p.id} onClick={() => setDesignSettings({...designSettings, pattern: p.id})} className={`h-8 rounded-lg border-2 transition-all relative ${designSettings.pattern === p.id ? 'border-indigo-500 scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`} style={{ backgroundColor: p.color === 'transparent' ? '#111' : p.color }}>
                                    {designSettings.pattern === p.id && <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20"><Check size={12} className="text-white"/></div>}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                             <Sliders size={14} className="text-slate-500 shrink-0" />
                             <div className="flex-1 space-y-1">
                               <input type="range" min="10" max="100" value={designSettings.opacity} onChange={e => setDesignSettings({...designSettings, opacity: parseInt(e.target.value) || 100})} className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-full" />
                               <div className="flex justify-between text-[7px] font-black text-slate-600 uppercase tracking-widest"><span>Opacity</span><span className="text-indigo-400">{designSettings.opacity}%</span></div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="mt-auto bg-[#0B1120] p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shrink-0 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none"><Target size={120}/></div>
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg"><Target size={18}/></div>
                      <div>
                         <h5 className="text-sm font-black uppercase tracking-[0.4em] text-white leading-none">Target Registry</h5>
                         <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Map recipient nodes</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedRecipientIds(eligibleRecipients.map(c => c.id))} className="px-4 py-2 bg-white/5 hover:bg-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all border border-white/5">Map All Filtered</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[220px] overflow-y-auto no-scrollbar pr-2 relative z-10">
                   {eligibleRecipients.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => toggleRecipient(c.id)} 
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group shrink-0 ${selectedRecipientIds.includes(c.id) ? 'bg-indigo-600/10 border-indigo-600 shadow-md' : 'bg-slate-900/60 border-transparent hover:border-white/10 shadow-sm'}`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-active:scale-90 ${selectedRecipientIds.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                            {selectedRecipientIds.includes(c.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight leading-none mb-1.5">{c.name}</p>
                            <div className="flex items-center gap-1.5 text-slate-500">
                               <Mail size={10} className="opacity-40 shrink-0" />
                               <p className="text-[8px] font-bold lowercase truncate opacity-60">{c.email}</p>
                            </div>
                         </div>
                      </button>
                   ))}
                </div>
             </div>
          </main>
        </div>
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-4xl animate-pop-in border-none shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[var(--bg-card)]">
            <header className="p-8 border-b border-[var(--border-ui)] flex justify-between items-center bg-[var(--bg-card)]">
              <Heading sub={editingClient ? 'Synchronize existing registry data' : 'Initialize new partner node'}>{editingClient ? 'Modify Node' : 'New Identity'}</Heading>
              <button onClick={() => setShowForm(false)} className="p-3 text-slate-500 hover:text-rose-500 transition-all hover:bg-white/5 rounded-2xl"><X size={28} /></button>
            </header>
            <form onSubmit={(e) => { e.preventDefault(); if (editingClient) { updateClient({ ...editingClient, ...formData } as Client); } else { addClient(formData); } setShowForm(false); }} className="p-10 space-y-10 custom-scroll max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="Enterprise Name" value={formData.name} placeholder="E.G. AL MADINA HYPERMARKET" onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} required />
                <Input label="Operative Name" value={formData.contactPerson} placeholder="E.G. ABDULLA USMAN" onChange={e => setFormData({...formData, contactPerson: e.target.value.toUpperCase()})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="Registry Email" type="email" value={formData.email} placeholder="ident@node.com" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input label="Terminal Phone" value={formData.phone} placeholder="+971..." onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <Select label="Preferred Currency" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                   <option value="AED">AED - Emirati Dirham</option>
                   <option value="USD">USD - US Dollar</option>
                   <option value="EUR">EUR - Euro</option>
                   <option value="GBP">GBP - British Pound</option>
                </Select>
                <Input label="Regional Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                <Input label="Tax ID / TRN" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="Payment Portal Link" value={formData.paymentPortal} onChange={e => setFormData({...formData, paymentPortal: e.target.value})} icon={Globe} placeholder="https://portal.link" />
                <Select label="Manual Status Override" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Lead">Lead Node</option>
                  <option value="Active">Active Partner</option>
                  <option value="Archived">Archived Legacy</option>
                </Select>
              </div>

              <div className="space-y-4">
                 <Label>Physical Coordinates (Address)</Label>
                 <textarea className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-[1.5rem] p-6 text-sm font-semibold outline-none focus:border-indigo-500 transition-all min-h-[120px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="pt-8 border-t border-[var(--border-ui)] flex justify-end">
                <Button type="submit" variant="primary" className="h-16 px-16 shadow-2xl uppercase tracking-[0.3em] font-black text-[11px]">Commit Node to Registry</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal isOpen={!!confirmDeleteId} title="Purge Node" message="This partner node will be permanently decommissioned from the organization. Proceed with purge?" onConfirm={() => { if (confirmDeleteId) deleteClient(confirmDeleteId); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default CRM;