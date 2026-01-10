
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, User, FilePlus, Gauge, 
  Sparkles,
  Cpu, Loader2,
  TrendingUp, Bell, Activity,
  ImageIcon, Download, Palette,
  Upload, Trash2, Copy, Volume2, Check, LayoutPanelLeft,
  History, RotateCcw, Plus, MessageSquare, Menu, X
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { useBusiness } from '../context/BusinessContext.tsx';
import { ChatMessage, ChatThread } from '../types.ts';
import { marked } from 'marked';
import { Button, Card, Badge, Select, Label } from './ui/Primitives.tsx';

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
  // Added userProfile to the destructuring from useBusiness()
  const { 
    clients, proposals, chatThreads, saveChatThread, deleteChatThread, 
    telemetry, showToast, loading, userProfile 
  } = useBusiness();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'marketing' | 'writer' | 'capacity'>('chat');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Marketing State
  const [marketingPrompt, setMarketingPrompt] = useState('');
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [marketingHistory, setMarketingHistory] = useState<{url: string, prompt: string, timestamp: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Writer State
  const [writerForm, setWriterForm] = useState({ clientId: '', goal: '' });
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);

  // Capacity State
  const [isAnalyzingCapacity, setIsAnalyzingCapacity] = useState(false);
  const [capacityAnalysis, setCapacityAnalysis] = useState<string | null>(null);

  const activeThread = useMemo(() => 
    chatThreads.find(t => t.id === activeThreadId) || null, 
  [chatThreads, activeThreadId]);

  const handleMarketingGenerate = async () => {
    if (!marketingPrompt.trim()) return;
    setIsGeneratingMarketing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: marketingPrompt }];
      
      if (attachedImage) {
        parts.push({
          inlineData: {
            data: attachedImage.data,
            mimeType: attachedImage.mimeType,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setGeneratedPoster(imageUrl);
          setMarketingHistory(prev => [
            { url: imageUrl, prompt: marketingPrompt, timestamp: new Date().toLocaleTimeString() },
            ...prev
          ].slice(0, 10));
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        showToast('No image returned', 'error');
      } else {
        showToast('Asset Created');
      }
    } catch (e) {
      console.error(e);
      showToast('Generation failed', 'error');
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  const useFromHistory = (item: { url: string; prompt: string }) => {
    setGeneratedPoster(item.url);
    setMarketingPrompt(item.prompt);
    showToast('Restored');
  };

  const useAsReference = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage({
          data: (reader.result as string).split(',')[1],
          mimeType: blob.type,
        });
        showToast('Using as reference');
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      showToast('Error using reference', 'error');
    }
  };

  useEffect(() => {
    if (chatThreads.length > 0 && !activeThreadId && activeTab === 'chat') {
      setActiveThreadId(chatThreads[0].id);
    }
  }, [chatThreads, activeThreadId, activeTab]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeThread, isTyping, activeTab]);

  const createNewThread = async () => {
    const newId = `thread_${Date.now()}`;
    // Added missing companyId to newThread object
    const newThread: ChatThread = {
      id: newId,
      companyId: userProfile?.companyId || 'global',
      title: 'New Chat',
      messages: [],
      updatedAt: new Date().toISOString()
    };
    await saveChatThread(newThread);
    setActiveThreadId(newId);
    if (window.innerWidth < 1024) setShowHistory(false);
  };

  const handleChatSend = async (customMessage?: string) => {
    const msg = customMessage || input;
    if (!msg.trim()) return;
    if (!customMessage) setInput('');

    let currentThread = activeThread;
    if (!currentThread) {
      const newId = `thread_${Date.now()}`;
      // Added missing companyId to currentThread initialization
      currentThread = {
        id: newId,
        companyId: userProfile?.companyId || 'global',
        title: msg.length > 30 ? msg.substring(0, 30) + '...' : msg,
        messages: [],
        updatedAt: new Date().toISOString()
      };
      setActiveThreadId(newId);
    }
    
    const userMsg: ChatMessage = { role: 'user', text: msg, timestamp: new Date().toISOString() };
    const updatedMessages = [...currentThread.messages, userMsg];
    
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `Your name is 'CreaftlyAI'. You help freelancers in the UAE. 
      CURRENT DATA: Revenue AED ${telemetry.totalEarnings}, Active Projects ${proposals.length}.
      RULES:
      - Use simple, everyday English.
      - Don't use big corporate words.
      - Be friendly and helpful.
      - Keep paragraphs short.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: msg }] },
        config: { systemInstruction: context }
      });
      
      const result = response.text || "Sorry, I couldn't process that.";
      const modelMsg: ChatMessage = { role: 'model', text: result, timestamp: new Date().toISOString() };
      
      const finalThread: ChatThread = {
        ...currentThread,
        title: currentThread.messages.length === 0 ? (msg.length > 30 ? msg.substring(0, 30) + '...' : msg) : currentThread.title,
        messages: [...updatedMessages, modelMsg],
        updatedAt: new Date().toISOString()
      };
      
      await saveChatThread(finalThread);
    } catch (e) {
      showToast('AI Link Failure', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied', 'info');
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
      showToast('Audio failure', 'error');
    }
  };

  const renderMessageContent = (msg: string) => (
    <div className="markdown-content prose prose-invert prose-sm sm:prose-sm lg:prose-base max-w-none 
      leading-relaxed tracking-normal text-[var(--text-primary)] text-xs sm:text-sm lg:text-base
      prose-p:mb-3 sm:prose-p:mb-4 prose-p:mt-0 prose-p:break-words
      prose-headings:text-[var(--accent)] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:mt-4 sm:prose-headings:mt-6 lg:prose-headings:mt-8 prose-headings:mb-2 sm:prose-headings:mb-3 lg:prose-headings:mb-4 prose-headings:text-sm sm:prose-headings:text-base lg:prose-headings:text-lg
      prose-strong:text-[var(--accent)] prose-strong:font-bold
      prose-table:border prose-table:border-[var(--border-ui)] prose-table:text-xs sm:prose-table:text-sm prose-th:bg-[var(--bg-card-muted)] prose-th:p-2 sm:prose-th:p-3 lg:prose-th:p-4 prose-td:p-2 sm:prose-td:p-3 lg:prose-td:p-4 prose-td:border-t prose-td:border-[var(--border-ui)]
      prose-li:marker:text-[var(--accent)] prose-li:text-xs sm:prose-li:text-sm lg:prose-li:text-base
      prose-code:text-xs sm:prose-code:text-sm prose-pre:text-xs sm:prose-pre:text-sm" 
      dangerouslySetInnerHTML={{ __html: marked.parse(msg) }} 
    />
  );

  const suggestions = [
    { label: 'Business Health', icon: Activity, prompt: 'How is my business doing financially?' },
    { label: 'Tax Help', icon: TrendingUp, prompt: 'What do I need to know about UAE taxes this year?' },
    { label: 'Follow up', icon: Bell, prompt: 'Write a friendly follow-up message for a client who hasn\'t paid yet.' },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <div className="w-16 h-1 bg-[var(--bg-card-muted)] rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[var(--accent)] animate-[loading_2s_infinite_linear]" style={{ width: '60%' }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] animate-pulse">Syncing AI...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-8rem)] animate-enter px-2 sm:px-3 lg:px-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2 sm:gap-3 lg:gap-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 shrink-0">
           <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-[var(--accent)] rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-[var(--accent)]/20 shrink-0 border border-white/10">
             <Sparkles size={18} className={`sm:w-5 sm:h-5 lg:w-[28px] lg:h-[28px] ${isTyping ? 'animate-pulse' : ''}`} />
           </div>
           <div className="min-w-0">
             <h2 className="text-base sm:text-lg lg:text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] truncate">CreaftlyAI</h2>
             <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
               <span className="text-[9px] sm:text-[8px] lg:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] whitespace-nowrap">Active</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-card-muted)] p-0.5 sm:p-1 rounded-lg sm:rounded-xl lg:rounded-2xl border border-[var(--border-ui)] shadow-sm overflow-x-auto no-scrollbar w-full sm:w-auto min-w-0">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare, shortLabel: 'Chat' },
            { id: 'marketing', label: 'Campaign Engine', icon: Palette, shortLabel: 'Campaign' },
            { id: 'writer', label: 'Write', icon: FilePlus, shortLabel: 'Write' },
            { id: 'capacity', label: 'Usage', icon: Gauge, shortLabel: 'Usage' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-6 py-2 sm:py-2 lg:py-2.5 rounded-md sm:rounded-lg lg:rounded-xl text-[9px] sm:text-[8px] lg:text-[10px] font-black uppercase tracking-wide sm:tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTab === t.id ? 'bg-[var(--accent)] text-white shadow-xl' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]'}`}
            >
              <t.icon size={11} className="sm:w-3 sm:h-3 lg:w-[14px] lg:h-[14px] shrink-0" />
              <span className="hidden min-[375px]:inline">{t.label}</span>
              <span className="min-[375px]:hidden">{t.shortLabel}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl sm:rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden flex shadow-2xl relative min-h-0">
        
        {activeTab === 'chat' && (
          <>
            {/* History Sidebar */}
            <div className={`
              ${showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              fixed lg:relative inset-y-0 left-0 w-[85vw] sm:w-80 max-w-[320px] lg:w-72 lg:max-w-none bg-[var(--bg-card)] border-r border-[var(--border-ui)] z-[100] lg:z-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
            `}>
              <div className="p-4 sm:p-6 border-b border-[var(--border-ui)] shrink-0 flex items-center justify-between gap-3">
                <button 
                  onClick={createNewThread}
                  className="flex-1 h-11 sm:h-12 lg:h-14 bg-[var(--accent)] text-white rounded-lg sm:rounded-xl lg:rounded-2xl font-black uppercase text-[10px] sm:text-[10px] flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scroll p-3 sm:p-4 space-y-2">
                <p className="text-[9px] sm:text-[8px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] mb-3 sm:mb-4 ml-1 sm:ml-2">History</p>
                {chatThreads.map(thread => (
                  <div key={thread.id} className="group relative">
                    <button 
                      onClick={() => { setActiveThreadId(thread.id); if (window.innerWidth < 1024) setShowHistory(false); }}
                      className={`
                        w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left transition-all border
                        ${activeThreadId === thread.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]' : 'hover:bg-[var(--bg-card-muted)] border-transparent text-[var(--text-secondary)]'}
                      `}
                    >
                      <MessageSquare size={14} className="sm:w-4 sm:h-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight truncate text-[var(--text-primary)]">{thread.title}</p>
                        <p className="text-[8px] sm:text-[7px] font-bold text-[var(--text-secondary)] mt-0.5">{new Date(thread.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteChatThread(thread.id); if (activeThreadId === thread.id) setActiveThreadId(null); }}
                      className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-[var(--text-secondary)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Backdrop for mobile history */}
            {showHistory && (
              <div 
                className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm transition-opacity" 
                onClick={() => setShowHistory(false)}
              />
            )}

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              {/* History Toggle (Mobile) */}
              <button 
                onClick={() => setShowHistory(true)}
                className="lg:hidden absolute top-3 sm:top-4 left-3 sm:left-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl flex items-center justify-center text-[var(--text-secondary)] shadow-2xl hover:bg-[var(--bg-card)] transition-colors"
              >
                <Menu size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-12 space-y-4 sm:space-y-6 lg:space-y-12 custom-scroll bg-[var(--bg-canvas)]/30 pt-12 sm:pt-14 lg:pt-4">
                {!activeThread || activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-8 sm:py-10 lg:py-20 px-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-indigo-500/10 rounded-xl sm:rounded-[1.5rem] lg:rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-3 sm:mb-4 lg:mb-8">
                      <Sparkles size={28} className="sm:w-8 sm:h-8 lg:w-[48px] lg:h-[48px]" />
                    </div>
                    <h4 className="text-[10px] sm:text-[9px] lg:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em]">Ask CreaftlyAI</h4>
                    <p className="text-[9px] sm:text-[8px] lg:text-[10px] font-bold uppercase tracking-wide sm:tracking-widest mt-2 sm:mt-2 lg:mt-4 text-[var(--text-secondary)] max-w-[200px] sm:max-w-[240px] lg:max-w-[280px] leading-relaxed">
                      Ask about your business, taxes, or projects.
                    </p>
                  </div>
                ) : (
                  activeThread.messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 sm:gap-3 lg:gap-8 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-enter`}>
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-[var(--accent)] text-white border-white/10 shadow-lg' : 'bg-[var(--bg-card-muted)] text-[var(--accent)] border-[var(--border-ui)]'}`}>
                        {m.role === 'user' ? <User size={12} className="sm:w-[14px] sm:h-[14px] lg:w-[20px] lg:h-[20px]" /> : <Cpu size={12} className="sm:w-[14px] sm:h-[14px] lg:w-[20px] lg:h-[20px]" />}
                      </div>
                      <div className={`max-w-[calc(100%-3.5rem)] sm:max-w-[85%] lg:max-w-[75%] min-w-0 ${m.role === 'user' ? 'text-right' : ''} group relative`}>
                        <div className={`p-3 sm:p-4 lg:p-8 rounded-lg sm:rounded-[1.25rem] lg:rounded-[2rem] inline-block text-left shadow-sm ${m.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--text-primary)]'}`}>
                          {m.role === 'model' ? renderMessageContent(m.text) : <div className="text-[12px] sm:text-[13px] lg:text-[15px] font-semibold leading-relaxed break-words">{m.text}</div>}
                          
                          {m.role === 'model' && (
                            <div className="mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-4 lg:pt-6 border-t border-[var(--border-ui)] flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-wrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                               <button onClick={() => handleCopy(m.text, `msg-${i}`)} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-card-muted)] rounded-md sm:rounded-lg text-[9px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-wide sm:tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-ui)]">
                                 {copiedId === `msg-${i}` ? <Check size={9} className="sm:w-[10px] sm:h-[10px] text-emerald-500" /> : <Copy size={9} className="sm:w-[10px] sm:h-[10px]" />}
                                 <span className="hidden min-[375px]:inline">Copy</span>
                               </button>
                               <button onClick={() => handleSpeak(m.text, `msg-${i}`)} disabled={isSpeakingId !== null} className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[var(--bg-card)] rounded-md sm:rounded-lg text-[9px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-wide sm:tracking-widest transition-all border border-[var(--border-ui)] ${isSpeakingId === `msg-${i}` ? 'text-[var(--accent)] animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]'}`}>
                                 {isSpeakingId === `msg-${i}` ? <Loader2 size={9} className="sm:w-[10px] sm:h-[10px] animate-spin" /> : <Volume2 size={9} className="sm:w-[10px] sm:h-[10px]" />}
                                 <span className="hidden min-[375px]:inline">Listen</span>
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex items-center gap-2 sm:gap-3 ml-9 sm:ml-11 lg:ml-20 animate-enter">
                     <div className="flex gap-1.5 p-2.5 sm:p-3 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl lg:rounded-2xl shadow-inner">
                        <span className="w-1 h-1 sm:w-1 sm:h-1 lg:w-1.5 lg:h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 sm:w-1 sm:h-1 lg:w-1.5 lg:h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1 h-1 sm:w-1 sm:h-1 lg:w-1.5 lg:h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                     </div>
                  </div>
                )}
              </div>
              
              <footer className="p-3 sm:p-4 lg:p-10 border-t border-[var(--border-ui)] shrink-0 bg-[var(--bg-card)]">
                 <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
                   <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                      {suggestions.map((chip, idx) => (
                        <button key={idx} onClick={() => handleChatSend(chip.prompt)} className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2.5 sm:px-3 lg:px-5 py-1.5 sm:py-2 lg:py-3 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-md sm:rounded-lg lg:rounded-xl text-[9px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-wide sm:tracking-widest text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all shrink-0 shadow-sm">
                          <chip.icon size={10} className="sm:w-[11px] sm:h-[11px] shrink-0"/>
                          <span className="whitespace-nowrap">{chip.label}</span>
                        </button>
                      ))}
                   </div>
                   <div className="relative flex items-center gap-2 sm:gap-3 lg:gap-4">
                     <input 
                       value={input} 
                       onChange={e => setInput(e.target.value)} 
                       onKeyDown={e => e.key === 'Enter' && handleChatSend()} 
                       placeholder="Ask CreaftlyAI..." 
                       className="flex-1 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl lg:rounded-2xl h-11 sm:h-12 lg:h-16 px-3 sm:px-4 lg:px-8 text-[11px] sm:text-[10px] lg:text-[12px] font-black uppercase tracking-wide sm:tracking-widest outline-none focus:border-indigo-600 transition-all shadow-inner min-w-0" 
                     />
                     <Button 
                       onClick={() => handleChatSend()} 
                       disabled={isTyping || !input.trim()} 
                       icon={Send} 
                       className="w-11 h-11 sm:w-12 sm:h-12 lg:w-16 lg:h-16 !rounded-lg sm:!rounded-xl lg:!rounded-2xl shadow-xl !bg-[var(--accent)] border-[var(--accent)] shrink-0" 
                     />
                   </div>
                 </div>
              </footer>
            </div>
          </>
        )}

        {(activeTab === 'marketing' || activeTab === 'writer') && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden custom-scroll w-full">
            {/* Control Sidebar */}
            <div className="w-full lg:w-[400px] bg-[var(--bg-card-muted)] lg:border-r border-[var(--border-ui)] p-4 sm:p-5 lg:p-8 lg:overflow-y-auto custom-scroll flex flex-col shrink-0">
              <header className="mb-4 sm:mb-6 lg:mb-8">
                 <div className="flex items-center gap-2 lg:gap-3 mb-2">
                   <div className="w-7 h-7 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                     {activeTab === 'marketing' ? <Palette size={13} className="sm:w-[14px] sm:h-[14px]"/> : <FilePlus size={13} className="sm:w-[14px] sm:h-[14px]"/>}
                   </div>
                   <h3 className="text-[11px] sm:text-xs lg:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--text-primary)] truncate">
                     {activeTab === 'marketing' ? 'Campaign Engine' : 'Write'}
                   </h3>
                 </div>
                 <p className="text-[9px] sm:text-[8px] lg:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide sm:tracking-widest leading-relaxed">
                   {activeTab === 'marketing' ? 'Generate campaign assets.' : 'Write project documents.'}
                 </p>
              </header>

              <div className="space-y-3 sm:space-y-4 lg:space-y-6 flex-1 min-w-0">
                {activeTab === 'writer' && (
                  <Select label="Select Client" value={writerForm.clientId} onChange={e => setWriterForm({...writerForm, clientId: e.target.value})} className="!h-10 sm:!h-10 lg:!h-12 font-black text-xs sm:text-sm">
                    <option value="">Select Client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                )}

                <div className="space-y-2">
                  <Label className="!opacity-100 text-[10px] sm:text-xs">Instructions</Label>
                  <textarea 
                    value={activeTab === 'marketing' ? marketingPrompt : writerForm.goal} 
                    onChange={e => activeTab === 'marketing' ? setMarketingPrompt(e.target.value) : setWriterForm({...writerForm, goal: e.target.value})} 
                    className="w-full h-28 sm:h-24 lg:h-44 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 text-xs sm:text-[13px] font-semibold outline-none focus:border-indigo-600 transition-all shadow-inner leading-relaxed resize-none" 
                    placeholder={activeTab === 'marketing' ? "Describe the visual..." : "Describe the goal..."} 
                  />
                </div>

                {activeTab === 'marketing' && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    <Select label="Size" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="!h-10 sm:!h-10 lg:!h-11 font-black text-xs sm:text-sm">
                       <option value="1:1">1:1 Square</option>
                       <option value="16:9">16:9 Wide</option>
                       <option value="9:16">9:16 Tall</option>
                    </Select>
                    <div className="space-y-2">
                       <Label className="!opacity-100 !text-[var(--text-secondary)] text-[10px] sm:text-xs">Photo</Label>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setAttachedImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                            reader.readAsDataURL(file);
                          }
                       }} />
                       <button onClick={() => attachedImage ? setAttachedImage(null) : fileInputRef.current?.click()} className={`w-full h-10 sm:h-10 lg:h-11 px-2 sm:px-3 rounded-md sm:rounded-lg lg:rounded-xl border flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${attachedImage ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--input-bg)] border border-[var(--border-ui)] text-[var(--text-secondary)] hover:border-[var(--accent)]'}`}>
                          {attachedImage ? <Check size={11} className="sm:w-3 sm:h-3 shrink-0"/> : <Upload size={11} className="sm:w-3 sm:h-3 shrink-0"/>}
                          <span className="text-[9px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-wide sm:tracking-widest truncate">{attachedImage ? 'Linked' : 'Add Photo'}</span>
                       </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 sm:pt-6 lg:pt-8 mt-3 sm:mt-4 lg:mt-6 border-t border-[var(--border-ui)]">
                <Button 
                  onClick={activeTab === 'marketing' ? handleMarketingGenerate : async () => {
                    setIsGeneratingProposal(true); setGeneratedProposal(null);
                    try {
                      const client = clients.find(c => c.id === writerForm.clientId);
                      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Write a simple, clear project document for "${client?.name || 'the client'}". Goal: "${writerForm.goal}". Use plain English.` });
                      setGeneratedProposal(res.text || '');
                    } finally { setIsGeneratingProposal(false); }
                  }} 
                  loading={isGeneratingMarketing || isGeneratingProposal} 
                  icon={Sparkles} 
                  className="w-full h-11 sm:h-12 lg:h-14 !rounded-lg sm:!rounded-xl lg:!rounded-2xl shadow-2xl uppercase tracking-[0.1em] sm:tracking-[0.15em] font-black text-[10px] sm:text-[10px] !bg-[var(--accent)] border-[var(--accent)]" 
                  disabled={activeTab === 'marketing' ? !marketingPrompt.trim() : (!writerForm.clientId || !writerForm.goal)}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Main Preview Canvas */}
            <div className="flex-1 bg-[var(--bg-card)] overflow-y-auto custom-scroll flex flex-col relative min-h-[250px] sm:min-h-[300px]">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)', backgroundSize: '40px 40px' }} />
               
               <div className="p-3 sm:p-4 lg:p-6 flex-1 flex items-center justify-center min-h-0">
                  <div className="w-full h-full flex flex-col min-h-0">
                      {isGeneratingMarketing || isGeneratingProposal ? (
                        <div className="flex-1 flex flex-col items-center justify-center animate-pulse space-y-4 sm:space-y-6 lg:space-y-8 py-8 sm:py-12">
                          <div className="relative">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-indigo-600/10 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-indigo-500/20 flex items-center justify-center">
                                <Loader2 size={28} className="sm:w-8 sm:h-8 lg:w-[48px] lg:h-[48px] animate-spin text-indigo-500" />
                              </div>
                          </div>
                          <div className="text-center space-y-2">
                              <h4 className="text-[10px] sm:text-[9px] lg:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-500">Generating...</h4>
                          </div>
                        </div>
                      ) : (activeTab === 'marketing' ? generatedPoster : generatedProposal) ? (
                        <div className="flex-1 flex flex-col animate-enter h-full min-h-0">
                          <div className="flex-1 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl lg:rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden relative group min-h-0">
                              {activeTab === 'marketing' ? (
                                <img src={generatedPoster!} alt="Generated" className="w-full h-full object-contain p-2 sm:p-3" />
                              ) : (
                                <div className="w-full h-full p-4 sm:p-6 lg:p-12 overflow-y-auto custom-scroll text-left min-h-0">
                                  {renderMessageContent(generatedProposal!)}
                                </div>
                              )}
                              
                              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 lg:p-6 flex justify-center gap-2 sm:gap-3 lg:gap-4 bg-gradient-to-t from-[var(--bg-card)]/95 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 flex-wrap">
                                <button onClick={() => activeTab === 'marketing' ? setGeneratedPoster(null) : setGeneratedProposal(null)} className="h-9 sm:h-10 lg:h-11 px-3 sm:px-4 lg:px-5 bg-[var(--bg-card-muted)] hover:bg-rose-600 border border-[var(--border-ui)] rounded-md sm:rounded-lg lg:rounded-xl text-[var(--text-primary)] hover:text-white font-black uppercase text-[9px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all shrink-0">
                                  <Trash2 size={12} className="sm:w-4 sm:h-4"/>
                                  <span>Clear</span>
                                </button>
                                <button onClick={() => {
                                  if (activeTab === 'marketing') {
                                    const a = document.createElement('a'); a.href = generatedPoster!; a.download = 'campaign_asset.png'; a.click();
                                  } else {
                                    navigator.clipboard.writeText(generatedProposal!); showToast('Copied');
                                  }
                                }} className="h-9 sm:h-10 lg:h-11 px-4 sm:px-5 lg:px-7 bg-[var(--accent)] rounded-md sm:rounded-lg lg:rounded-xl text-white shadow-2xl font-black uppercase text-[9px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all shrink-0">
                                  <Download size={12} className="sm:w-4 sm:h-4"/>
                                  <span>{activeTab === 'marketing' ? 'Download' : 'Copy'}</span>
                                </button>
                              </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-8 sm:py-12">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 border-2 lg:border-4 border-dashed border-[var(--border-ui)] rounded-xl sm:rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center mb-3 sm:mb-4 lg:mb-6">
                              {activeTab === 'marketing' ? <Palette size={32} strokeWidth={1} className="sm:w-10 sm:h-10 lg:w-[56px] lg:h-[56px]" /> : <LayoutPanelLeft size={32} strokeWidth={1} className="sm:w-10 sm:h-10 lg:w-[56px] lg:h-[56px]" />}
                          </div>
                          <div className="text-center space-y-1 sm:space-y-1 lg:space-y-2 px-4">
                              <h4 className="text-[11px] sm:text-xs lg:text-[14px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em]">Empty</h4>
                              <p className="text-[9px] sm:text-[8px] lg:text-[10px] font-bold uppercase tracking-wide sm:tracking-widest">Start on the left</p>
                          </div>
                        </div>
                      )}
                  </div>
               </div>

               {/* Asset Registry / History */}
               {activeTab === 'marketing' && marketingHistory.length > 0 && (
                  <div className="p-3 sm:p-4 lg:p-8 border-t border-[var(--border-ui)] bg-[var(--bg-card-muted)]">
                     <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                           <History size={14} className="sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                           <h4 className="text-[10px] sm:text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-[var(--text-primary)] truncate">Recent Assets</h4>
                        </div>
                        <Badge variant="info" className="!text-[9px] sm:!text-[8px] shrink-0">{marketingHistory.length} Saved</Badge>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
                        {marketingHistory.map((item, idx) => (
                           <div key={idx} className="group relative aspect-square bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer hover:border-[var(--accent)] transition-all animate-enter shadow-lg">
                              <img src={item.url} alt="History asset" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 bg-[var(--bg-card)]/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 text-center">
                                 <p className="text-[8px] sm:text-[8px] text-[var(--text-primary)] font-bold line-clamp-2 mb-1 px-1">{item.prompt}</p>
                                 <div className="flex gap-1.5 sm:gap-2">
                                    <button onClick={() => useFromHistory(item)} title="Restore" className="p-1.5 sm:p-2 bg-[var(--accent)] text-white rounded-md sm:rounded-lg hover:scale-110 transition-transform">
                                      <RotateCcw size={10} className="sm:w-3 sm:h-3"/>
                                    </button>
                                    <button onClick={() => useAsReference(item.url)} title="Use as Photo" className="p-1.5 sm:p-2 bg-[var(--bg-card-muted)] text-[var(--accent)] border border-[var(--border-ui)] rounded-md sm:rounded-lg hover:scale-110 transition-transform">
                                      <ImageIcon size={10} className="sm:w-3 sm:h-3"/>
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-12 overflow-y-auto custom-scroll w-full">
            <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-10 lg:space-y-16 py-4 sm:py-6 lg:py-10">
               <header className="text-center space-y-3 sm:space-y-4 lg:space-y-6 px-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-indigo-500/10 text-indigo-500 rounded-lg sm:rounded-xl lg:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-indigo-500/5">
                    <Gauge size={24} className="sm:w-7 sm:h-7 lg:w-[40px] lg:h-[40px]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-4xl font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">Workload</h3>
                    <p className="text-[10px] sm:text-[9px] lg:text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-2 lg:mt-4">Status</p>
                  </div>
               </header>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-8 px-2">
                  <Card className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 text-center border border-[var(--border-ui)] rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] shadow-2xl bg-[var(--accent)]/[0.02] group hover:border-[var(--accent)]/30 transition-all">
                     <p className="text-[10px] sm:text-[9px] lg:text-[11px] font-black uppercase text-[var(--text-secondary)] tracking-[0.15em] sm:tracking-[0.2em] lg:tracking-[0.3em] mb-2 sm:mb-2 lg:mb-4">Active Projects</p>
                     <p className="text-4xl sm:text-5xl lg:text-7xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter leading-none group-hover:text-[var(--accent)] transition-colors">{proposals.filter(p => p.status === 'Accepted').length}</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 text-center border border-[var(--border-ui)] rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] shadow-2xl bg-emerald-500/[0.02] group hover:border-emerald-500/30 transition-all">
                     <p className="text-[10px] sm:text-[9px] lg:text-[11px] font-black uppercase text-[var(--text-secondary)] tracking-[0.15em] sm:tracking-[0.2em] lg:tracking-[0.3em] mb-2 sm:mb-2 lg:mb-4">Capacity</p>
                     <p className="text-4xl sm:text-5xl lg:text-7xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter leading-none group-hover:text-emerald-400 transition-colors">
                       {Math.min(100, (proposals.filter(p => p.status === 'Accepted').length * 25))}%
                     </p>
                  </Card>
               </div>

               <div className="space-y-4 sm:space-y-6 lg:space-y-10 pt-4 sm:pt-6 lg:pt-10 px-2">
                  <Button onClick={async () => {
                    setIsAnalyzingCapacity(true); setCapacityAnalysis(null);
                    try {
                      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Analyze my workload: ${proposals.filter(p => p.status === 'Accepted').length} projects, Revenue AED ${telemetry.totalEarnings}. Give me short simple advice from CreaftlyAI.` });
                      setCapacityAnalysis(res.text || '');
                    } finally { setIsAnalyzingCapacity(false); }
                  }} loading={isAnalyzingCapacity} icon={Sparkles} className="w-full h-14 sm:h-16 lg:h-20 !rounded-lg sm:!rounded-[1.5rem] lg:!rounded-[2.5rem] shadow-2xl font-black text-[10px] sm:text-[10px] lg:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] !bg-[var(--accent)] border-[var(--accent)]">Analyze Workload</Button>
                  
                  {capacityAnalysis && (
                    <Card className="p-4 sm:p-6 lg:p-16 bg-[var(--bg-card-muted)] border border-[var(--accent)]/20 rounded-xl sm:rounded-[1.5rem] lg:rounded-[3rem] animate-enter shadow-inner">
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
