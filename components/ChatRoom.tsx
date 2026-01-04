
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User, FilePlus, Gauge, 
  BrainCircuit, X, Sparkles, CheckCircle2,
  Cpu, Terminal, Loader2,
  TrendingUp, FileText, Bell, Activity, ArrowUpRight,
  ImageIcon, Download, Palette,
  Upload, Trash2, Copy, Volume2, Check, LayoutPanelLeft
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { useBusiness } from '../context/BusinessContext.tsx';
import { ChatMessage } from '../types.ts';
import { marked } from 'marked';
import { Button, Card, Badge, Select, Heading, Label } from './ui/Primitives.tsx';

// Audio decoding utilities
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatRoom: React.FC = () => {
  const { 
    clients, proposals, chatMessages, setChatMessages, 
    telemetry, showToast
  } = useBusiness();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'marketing' | 'writer' | 'capacity'>('chat');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Marketing State
  const [marketingPrompt, setMarketingPrompt] = useState('');
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Writer State
  const [writerForm, setWriterForm] = useState({ clientId: '', goal: '' });
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);

  // Capacity State
  const [isAnalyzingCapacity, setIsAnalyzingCapacity] = useState(false);
  const [capacityAnalysis, setCapacityAnalysis] = useState<string | null>(null);

  const suggestions = [
    { label: 'Fiscal Health', icon: Activity, prompt: 'Run a full fiscal health audit on my UAE agency data.' },
    { label: 'Tax Roadmap', icon: TrendingUp, prompt: 'Outline my 2024 UAE Corporate Tax roadmap based on current earnings.' },
    { label: 'Client Retention', icon: Bell, prompt: 'Identify overdue invoice trends and suggest a retention message for slow-paying nodes.' },
  ];

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, activeTab]);

  const handleChatSend = async (customMessage?: string) => {
    const msg = customMessage || input;
    if (!msg.trim()) return;
    if (!customMessage) setInput('');
    
    const updated = [...chatMessages, { role: 'user', text: msg, timestamp: new Date().toISOString() } as ChatMessage];
    setChatMessages(updated);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `Your name is 'Craftly AI'. You are a Strategic Executive Consultant for a UAE-based consultancy. 
      CURRENT DATA: Revenue AED ${telemetry.totalEarnings}, Active Projects ${proposals.length}.
      TYPOGRAPHY RULES:
      - Use Mixed Case (Standard Sentence Case) for all responses.
      - Never use all-caps for body text.
      - Keep leading generous and paragraphs short.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: msg }] },
        config: { systemInstruction: context }
      });
      
      const result = response.text || "Cognitive node failed to respond.";
      setChatMessages([...updated, { role: 'model', text: result, timestamp: new Date().toISOString() } as ChatMessage]);
    } catch (e) {
      setChatMessages([...updated, { role: 'model', text: "Error syncing with cognitive cluster.", timestamp: new Date().toISOString() } as ChatMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, id: string) => {
    if (isSpeakingId === id) return;
    setIsSpeakingId(id);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.replace(/[#*`]/g, '') }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeakingId(null);
        source.start();
      } else { setIsSpeakingId(null); }
    } catch (e) {
      setIsSpeakingId(null);
      showToast('Audio synth failed', 'error');
    }
  };

  const renderMessageContent = (msg: string) => (
    <div className="markdown-content prose prose-invert prose-sm max-w-none 
      leading-relaxed tracking-normal text-slate-300
      prose-p:mb-4 prose-p:mt-0
      prose-headings:text-indigo-400 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:mt-8 prose-headings:mb-4
      prose-strong:text-indigo-200 prose-strong:font-bold
      prose-table:border prose-table:border-white/5 prose-th:bg-white/5 prose-th:p-4 prose-td:p-4 prose-td:border-t prose-td:border-white/5
      prose-li:marker:text-indigo-500" 
      dangerouslySetInnerHTML={{ __html: marked.parse(msg) }} 
    />
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-8rem)] animate-enter lg:px-4">
      {/* Refined Executive Header - More compact on mobile */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-6 px-1 shrink-0">
        <div className="flex items-center gap-3 lg:gap-5">
           <div className="w-10 h-10 lg:w-14 lg:h-14 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 shrink-0 border border-white/10">
             <BrainCircuit size={20} className={`lg:w-[28px] lg:h-[28px] ${isTyping ? 'animate-pulse' : ''}`} />
           </div>
           <div className="min-w-0">
             <h2 className="text-lg lg:text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">Craftly AI Hub</h2>
             <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Cognitive Engine Active</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-card-muted)] p-1 rounded-xl lg:rounded-2xl border border-[var(--border-ui)] shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: 'chat', label: 'Strategy', icon: Terminal },
            { id: 'marketing', label: 'Studio', icon: Palette },
            { id: 'writer', label: 'Writer', icon: FilePlus },
            { id: 'capacity', label: 'Nodes', icon: Gauge },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3 lg:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-[var(--text-primary)] hover:bg-white/5'}`}
            >
              <t.icon size={12} className="lg:w-[14px] lg:h-[14px]" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Operating Surface */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        
        {activeTab === 'chat' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-12 space-y-6 lg:space-y-12 custom-scroll bg-indigo-500/[0.01]">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10 lg:py-20">
                   <div className="w-16 h-16 lg:w-24 lg:h-24 bg-indigo-500/10 rounded-[1.5rem] lg:rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-4 lg:mb-8"><Terminal size={32} className="lg:w-[48px] lg:h-[48px]" /></div>
                   <h4 className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.5em]">System Ready</h4>
                   <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mt-2 lg:mt-4 text-slate-500 max-w-[240px] lg:max-w-[280px] leading-relaxed">Initialize a strategy command or request business telemetry analysis.</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 lg:gap-8 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-enter`}>
                  <div className={`w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-[var(--accent)] text-white border-white/10 shadow-lg' : 'bg-[var(--bg-canvas)] text-indigo-500 border-[var(--border-ui)]'}`}>
                    {m.role === 'user' ? <User size={14} className="lg:w-[20px] lg:h-[20px]" /> : <Cpu size={14} className="lg:w-[20px] lg:h-[20px]" />}
                  </div>
                  <div className={`max-w-[90%] lg:max-w-[75%] ${m.role === 'user' ? 'text-right' : ''} group relative`}>
                    <div className={`p-4 lg:p-8 rounded-[1.25rem] lg:rounded-[2rem] inline-block text-left shadow-sm ${m.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--text-primary)]'}`}>
                      {m.role === 'model' ? renderMessageContent(m.text) : <div className="text-[13px] lg:text-[15px] font-semibold leading-relaxed">{m.text}</div>}
                      
                      {m.role === 'model' && (
                        <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-white/5 flex items-center gap-2 lg:gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-y-2 lg:group-hover:translate-y-0">
                           <button onClick={() => handleCopy(m.text, `msg-${i}`)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all border border-white/5">
                             {copiedId === `msg-${i}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                             Sync
                           </button>
                           <button onClick={() => handleSpeak(m.text, `msg-${i}`)} disabled={isSpeakingId !== null} className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 ${isSpeakingId === `msg-${i}` ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                             {isSpeakingId === `msg-${i}` ? <Loader2 size={10} className="animate-spin" /> : <Volume2 size={10} />}
                             Narrate
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-3 ml-11 lg:ml-20 animate-enter">
                   <div className="flex gap-1.5 p-3 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl lg:rounded-2xl shadow-inner">
                      <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                      <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                   </div>
                </div>
              )}
            </div>
            
            <footer className="p-4 lg:p-10 border-t border-[var(--border-ui)] shrink-0 bg-[var(--bg-card)]">
               <div className="max-w-5xl mx-auto space-y-4 lg:space-y-6">
                 <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto no-scrollbar pb-1">
                    {suggestions.map((chip, idx) => (
                      <button key={idx} onClick={() => handleChatSend(chip.prompt)} className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shrink-0 shadow-sm"><chip.icon size={11}/><span className="whitespace-nowrap">{chip.label}</span></button>
                    ))}
                 </div>
                 <div className="relative flex items-center gap-2 lg:gap-4">
                   <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} placeholder="INITIALIZE STRATEGIC COMMAND..." className="flex-1 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl lg:rounded-2xl h-12 lg:h-16 px-4 lg:px-8 text-[10px] lg:text-[12px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all shadow-inner" />
                   <Button onClick={() => handleChatSend()} disabled={isTyping || !input.trim()} icon={Send} className="w-12 h-12 lg:w-16 lg:h-16 !rounded-xl lg:!rounded-2xl shadow-xl !bg-indigo-600 border-indigo-600" />
                 </div>
               </div>
            </footer>
          </>
        )}

        {(activeTab === 'marketing' || activeTab === 'writer') && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden custom-scroll">
            {/* Control Sidebar - Optimized Width and Spacing */}
            <div className="w-full lg:w-[400px] bg-slate-950/20 lg:border-r border-[var(--border-ui)] p-5 lg:p-8 lg:overflow-y-auto custom-scroll flex flex-col shrink-0">
              <header className="mb-6 lg:mb-8">
                 <div className="flex items-center gap-2 lg:gap-3 mb-2">
                   <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                     {activeTab === 'marketing' ? <Palette size={14}/> : <FileText size={14}/>}
                   </div>
                   <h3 className="text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-white">
                     {activeTab === 'marketing' ? 'Design Studio' : 'Registry Writer'}
                   </h3>
                 </div>
                 <p className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   {activeTab === 'marketing' ? 'Generate high-fidelity marketing assets.' : 'Synthesize mission proposals and manifestos.'}
                 </p>
              </header>

              <div className="space-y-4 lg:space-y-6 flex-1">
                {activeTab === 'writer' && (
                  <Select label="Node Target" value={writerForm.clientId} onChange={e => setWriterForm({...writerForm, clientId: e.target.value})} className="!h-10 lg:!h-12 font-black">
                    <option value="">Select a registry node...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                )}

                <div className="space-y-2">
                  <Label className="!opacity-100 !text-slate-400">Mission Objectives</Label>
                  <textarea 
                    value={activeTab === 'marketing' ? marketingPrompt : writerForm.goal} 
                    onChange={e => activeTab === 'marketing' ? setMarketingPrompt(e.target.value) : setWriterForm({...writerForm, goal: e.target.value})} 
                    className="w-full h-24 lg:h-44 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl lg:rounded-2xl p-4 lg:p-5 text-[13px] font-semibold outline-none focus:border-indigo-600 transition-all shadow-inner leading-relaxed resize-none" 
                    placeholder={activeTab === 'marketing' ? "Describe the visual intent..." : "Describe the proposal goals..."} 
                  />
                </div>

                {activeTab === 'marketing' && (
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <Select label="Frame" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="!h-10 lg:!h-11 font-black">
                       <option value="1:1">1:1 Sq</option>
                       <option value="16:9">16:9 Cin</option>
                       <option value="9:16">9:16 Vert</option>
                    </Select>
                    <div className="space-y-2">
                       <Label className="!opacity-100 !text-slate-400">Ref Image</Label>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                            reader.readAsDataURL(file);
                          }
                       }} />
                       <button onClick={() => attachedImage ? setAttachedImage(null) : fileInputRef.current?.click()} className={`w-full h-10 lg:h-11 px-3 rounded-lg lg:rounded-xl border flex items-center justify-center gap-2 transition-all ${attachedImage ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-canvas)] border-[var(--border-ui)] text-slate-400 hover:border-indigo-500'}`}>
                          {attachedImage ? <Check size={12}/> : <Upload size={12}/>}
                          <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">{attachedImage ? 'Linked' : 'Attach'}</span>
                       </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 lg:pt-8 mt-4 lg:mt-6 border-t border-[var(--border-ui)]">
                <Button 
                  onClick={activeTab === 'marketing' ? async () => {
                    setIsGeneratingMarketing(true); setGeneratedPoster(null);
                    try {
                      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                      const parts: any[] = [{ text: `A high-end, professional marketing poster for: ${marketingPrompt}. Aspect ratio: ${aspectRatio}. Mixed case typography.` }];
                      if (attachedImage) parts.push({ inlineData: { data: attachedImage.data, mimeType: attachedImage.mimeType } });
                      const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { imageConfig: { aspectRatio: aspectRatio as any } } });
                      for (const part of res.candidates[0].content.parts) if (part.inlineData) setGeneratedPoster(`data:image/png;base64,${part.inlineData.data}`);
                    } finally { setIsGeneratingMarketing(false); }
                  } : async () => {
                    setIsGeneratingProposal(true); setGeneratedProposal(null);
                    try {
                      const client = clients.find(c => c.id === writerForm.clientId);
                      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Write a professional business proposal for "${client?.name || 'Valued Client'}". Goal: "${writerForm.goal}". Use natural sentence case.` });
                      setGeneratedProposal(res.text || '');
                    } finally { setIsGeneratingProposal(false); }
                  }} 
                  loading={isGeneratingMarketing || isGeneratingProposal} 
                  icon={Sparkles} 
                  className="w-full h-12 lg:h-14 !rounded-xl lg:!rounded-2xl shadow-2xl uppercase tracking-[0.15em] font-black text-[10px] !bg-indigo-600 border-indigo-600" 
                  disabled={activeTab === 'marketing' ? !marketingPrompt.trim() : (!writerForm.clientId || !writerForm.goal)}
                >
                  Synthesize content
                </Button>
              </div>
            </div>

            {/* Main Preview Canvas - Reduced Padding to Maximize Space */}
            <div className="flex-1 bg-slate-900/40 p-4 lg:p-6 lg:overflow-y-auto custom-scroll flex items-center justify-center relative min-h-[300px]">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
               
               <div className="w-full max-w-none h-full flex flex-col">
                  {isGeneratingMarketing || isGeneratingProposal ? (
                    <div className="flex-1 flex flex-col items-center justify-center animate-pulse space-y-6 lg:space-y-8">
                       <div className="relative">
                          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-indigo-600/10 rounded-2xl lg:rounded-3xl border border-indigo-500/20 flex items-center justify-center">
                             <Loader2 size={32} className="animate-spin text-indigo-500 lg:w-[48px] lg:h-[48px]" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-bounce" />
                       </div>
                       <div className="text-center space-y-2">
                          <h4 className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500">Processing Registry Data</h4>
                          <p className="text-[8px] lg:text-[9px] font-bold text-slate-600 uppercase tracking-widest">Synthesizing output node...</p>
                       </div>
                    </div>
                  ) : (activeTab === 'marketing' ? generatedPoster : generatedProposal) ? (
                    <div className="flex-1 flex flex-col animate-enter h-full">
                       <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl lg:rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden relative group">
                          {activeTab === 'marketing' ? (
                            <img src={generatedPoster!} alt="Generated" className="w-full h-full object-contain p-2" />
                          ) : (
                            <div className="w-full h-full p-6 lg:p-12 lg:overflow-y-auto custom-scroll text-left">
                               {renderMessageContent(generatedProposal!)}
                            </div>
                          )}
                          
                          {/* Action Overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6 flex justify-center gap-3 lg:gap-4 bg-gradient-to-t from-slate-950/90 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-y-4 lg:group-hover:translate-y-0">
                            <Button onClick={() => activeTab === 'marketing' ? setGeneratedPoster(null) : setGeneratedProposal(null)} variant="ghost" icon={Trash2} className="h-10 lg:h-11 px-4 lg:px-5 bg-white/10 hover:bg-rose-600 backdrop-blur-md rounded-lg lg:rounded-xl text-white">Purge</Button>
                            <Button onClick={() => {
                              if (activeTab === 'marketing') {
                                const a = document.createElement('a'); a.href = generatedPoster!; a.download = 'ai_asset.png'; a.click();
                              } else {
                                navigator.clipboard.writeText(generatedProposal!); showToast('Proposal copied');
                              }
                            }} icon={Download} className="h-10 lg:h-11 px-5 lg:px-7 bg-indigo-600 backdrop-blur-md rounded-lg lg:rounded-xl text-white shadow-2xl">Commit</Button>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                       <div className="w-20 h-20 lg:w-28 lg:h-28 border-2 lg:border-4 border-dashed border-slate-500 rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center mb-4 lg:mb-6">
                          {activeTab === 'marketing' ? <Palette size={40} strokeWidth={1} className="lg:w-[56px] lg:h-[56px]" /> : <LayoutPanelLeft size={40} strokeWidth={1} className="lg:w-[56px] lg:h-[56px]" />}
                       </div>
                       <div className="text-center space-y-1 lg:space-y-2">
                          <h4 className="text-xs lg:text-[14px] font-black uppercase tracking-[0.5em]">Buffer Dormant</h4>
                          <p className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">Awaiting command from panel</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="flex-1 flex flex-col p-5 lg:p-12 overflow-y-auto custom-scroll">
            <div className="max-w-4xl mx-auto w-full space-y-10 lg:space-y-16 py-6 lg:py-10">
               <header className="text-center space-y-4 lg:space-y-6">
                  <div className="w-14 h-14 lg:w-20 lg:h-20 bg-indigo-500/10 text-indigo-500 rounded-xl lg:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-indigo-500/5"><Gauge size={28} className="lg:w-[40px] lg:h-[40px]" /></div>
                  <div>
                    <h3 className="text-2xl lg:text-4xl font-black uppercase tracking-tighter leading-none text-white">Resource Telemetry</h3>
                    <p className="text-[9px] lg:text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 lg:mt-4">OPERATIONAL BANDWIDTH ANALYSIS</p>
                  </div>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                  <Card className="flex flex-col items-center justify-center p-8 lg:p-12 text-center border border-white/5 rounded-[2rem] lg:rounded-[3rem] shadow-2xl bg-indigo-500/[0.02] group hover:border-indigo-500/30 transition-all">
                     <p className="text-[9px] lg:text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] lg:tracking-[0.3em] mb-2 lg:mb-4">Active Missions</p>
                     <p className="text-5xl lg:text-7xl font-black text-white tabular-nums tracking-tighter leading-none group-hover:text-indigo-400 transition-colors">{proposals.filter(p => p.status === 'Accepted').length}</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center p-8 lg:p-12 text-center border border-white/5 rounded-[2rem] lg:rounded-[3rem] shadow-2xl bg-emerald-500/[0.02] group hover:border-emerald-500/30 transition-all">
                     <p className="text-[9px] lg:text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] lg:tracking-[0.3em] mb-2 lg:mb-4">Registry Load</p>
                     <p className="text-5xl lg:text-7xl font-black text-white tabular-nums tracking-tighter leading-none group-hover:text-emerald-400 transition-colors">
                       {Math.min(100, (proposals.filter(p => p.status === 'Accepted').length * 25))}%
                     </p>
                  </Card>
               </div>

               <div className="space-y-6 lg:space-y-10 pt-6 lg:pt-10">
                  <Button onClick={async () => {
                    setIsAnalyzingCapacity(true); setCapacityAnalysis(null);
                    try {
                      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Analyze my business capacity: ${proposals.filter(p => p.status === 'Accepted').length} active projects, Revenue AED ${telemetry.totalEarnings}. Max 150 words, professional mixed case.` });
                      setCapacityAnalysis(res.text || '');
                    } finally { setIsAnalyzingCapacity(false); }
                  }} loading={isAnalyzingCapacity} icon={BrainCircuit} className="w-full h-16 lg:h-20 !rounded-[1.5rem] lg:!rounded-[2.5rem] shadow-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] !bg-indigo-600 border-indigo-600">Audit Node Bandwidth</Button>
                  
                  {capacityAnalysis && (
                    <Card className="p-6 lg:p-16 bg-slate-950/40 border border-indigo-500/20 rounded-[1.5rem] lg:rounded-[3rem] animate-enter shadow-inner">
                       {renderMessageContent(capacityAnalysis)}
                    </Card>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
