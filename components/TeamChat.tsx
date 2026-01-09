
import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Send, Users, Shield, 
  MessageSquare, Loader2, ArrowDown,
  Terminal, Search, MoreVertical,
  Activity, Briefcase, CreditCard,
  Paperclip, Image as ImageIcon, Video, FileText,
  User, X, Smile, Download, ExternalLink,
  ChevronDown, Paperclip as AttachmentIcon,
  Circle, Clock, Trash2
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { TeamMessage, TeamChannel, UserRole, UserProfile } from '../types.ts';
import { db, auth, storage } from '../services/firebase.ts';
import { 
  collection, addDoc, query, where, 
  onSnapshot, serverTimestamp, getDocs, doc, updateDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { Badge, Button } from './ui/Primitives.tsx';

const CHANNELS = [
  { id: 'General', name: 'General', description: 'Organization-wide broadcast channel', icon: Hash },
  { id: 'Operations', name: 'Operations', description: 'Execution and mission updates', icon: Briefcase },
  { id: 'Finance', name: 'Finance', description: 'Ledger and fiscal discussions', icon: CreditCard },
];

const EMOJIS = ['👍', '🤝', '✅', '🚀', '🔥', '👏', '🙌', '🎉', '💡', '⚠️', '📎', '💬'];

const TeamChat: React.FC = () => {
  const { userProfile, showToast } = useBusiness();
  const [activeChannelId, setActiveChannelId] = useState('General');
  const [activeDmUser, setActiveDmUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [optimisticMedia, setOptimisticMedia] = useState<{id: string, url: string, type: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const currentThreadId = activeDmUser 
    ? [userProfile?.id, activeDmUser.id].sort().join('_') 
    : activeChannelId;

  // Handle outside clicks for emoji picker
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Presence & Heartbeat
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const presenceRef = doc(db, 'users', userProfile.id);
    updateDoc(presenceRef, { status: 'ONLINE', lastSeen: serverTimestamp() }).catch(() => {
      // Fallback for first-time status setting if document doesn't exist yet for some reason
      setDoc(presenceRef, { status: 'ONLINE', lastSeen: serverTimestamp() }, { merge: true });
    });

    const interval = setInterval(() => {
      updateDoc(presenceRef, { lastSeen: serverTimestamp() }).catch(() => {});
    }, 60000);

    const handleOffline = () => updateDoc(presenceRef, { status: 'OFFLINE', lastSeen: serverTimestamp() }).catch(() => {});
    window.addEventListener('beforeunload', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleOffline);
      handleOffline();
    };
  }, [userProfile?.id]);

  // Fetch Users & Messages
  useEffect(() => {
    if (!userProfile?.companyId) return;

    const qUsers = query(collection(db, 'users'), where('companyId', '==', userProfile.companyId));
    // Explicitly cast snap as any to avoid inference error on .docs
    const unsubUsers = onSnapshot(qUsers, (snap: any) => {
      setAllUsers(snap.docs.map(d => d.data() as UserProfile).filter(u => u.id !== userProfile.id));
    });

    setLoading(true);
    const qMsgs = query(
      collection(db, 'team_messages'),
      where('companyId', '==', userProfile.companyId),
      where('channelId', '==', currentThreadId)
    );

    // Explicitly cast snapshot as any to avoid inference error on .docs
    const unsubMsgs = onSnapshot(qMsgs, (snapshot: any) => {
      const rawMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamMessage[];
      setMessages(rawMsgs.sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0)));
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });

    const qTyping = query(
      collection(db, 'typing_indicators'),
      where('channelId', '==', currentThreadId)
    );
    // Explicitly cast snap as any to avoid inference error on .docs
    const unsubTyping = onSnapshot(qTyping, (snap: any) => {
      const typers = snap.docs
        .map(d => d.data())
        .filter(d => d.userId !== userProfile.id && (Date.now() - d.timestamp < 5000))
        .map(d => d.userName);
      setTypingUsers(typers);
    });

    return () => {
      unsubUsers();
      unsubMsgs();
      unsubTyping();
    };
  }, [userProfile?.companyId, currentThreadId, userProfile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!userProfile) return;

    const typingRef = doc(db, 'typing_indicators', `${currentThreadId}_${userProfile.id}`);
    setDoc(typingRef, {
      channelId: currentThreadId,
      userId: userProfile.id,
      userName: userProfile.fullName,
      timestamp: Date.now()
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      deleteDoc(typingRef).catch(() => {});
    }, 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    // Fast preview
    const previewUrl = URL.createObjectURL(file);
    const optimisticId = `opt-${Date.now()}`;
    if (file.type.startsWith('image/')) {
        setOptimisticMedia({ id: optimisticId, url: previewUrl, type: file.type });
    }

    const storageRef = ref(storage, `chat/${userProfile.companyId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTaskRef.current = uploadTask;

    setUploadProgress(0.1); 

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.max(0.1, progress));
      },
      // Explicitly cast error as any to access StorageError properties
      (error: any) => { 
        console.error("Upload Error:", error);
        if (error.code === 'storage/canceled') {
          showToast('Transmission Aborted', 'info');
        } else {
          showToast('Transmission Failure: ' + error.message, 'error'); 
        }
        setUploadProgress(null); 
        uploadTaskRef.current = null;
        setOptimisticMedia(null);
        URL.revokeObjectURL(previewUrl);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage('', { url, name: file.name, type: file.type, size: file.size });
          setUploadProgress(null);
          uploadTaskRef.current = null;
          setOptimisticMedia(null);
          URL.revokeObjectURL(previewUrl);
          showToast('Asset transmitted');
        } catch (e) {
          showToast('Error finalizing upload', 'error');
        }
      }
    );
  };

  const cancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'team_messages', msgId));
      showToast('Signal deleted', 'info');
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  const sendMessage = async (text: string, file?: { url: string, name: string, type: string, size: number }) => {
    if (!userProfile || (!text.trim() && !file)) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'team_messages'), {
        companyId: userProfile.companyId,
        channelId: currentThreadId,
        senderId: userProfile.id,
        senderName: userProfile.fullName,
        senderRole: userProfile.role,
        senderAvatar: userProfile.avatarUrl || null,
        text: text.trim(),
        fileUrl: file?.url || null,
        fileName: file?.name || null,
        fileType: file?.type || null,
        fileSize: file?.size || null,
        timestamp: serverTimestamp(),
      });
      setInput('');
      const typingRef = doc(db, 'typing_indicators', `${currentThreadId}_${userProfile.id}`);
      deleteDoc(typingRef).catch(() => {});
    } catch (err) {
      showToast('Node unreachable', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const formatLastSeen = (lastSeen: any) => {
    if (!lastSeen) return 'OFFLINE';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'ONLINE';
    if (diff < 3600) return `LAST SEEN ${Math.floor(diff/60)}M AGO`;
    return `LAST SEEN ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderFileContent = (msg: TeamMessage) => {
    if (!msg.fileUrl) return null;
    const isImg = msg.fileType?.startsWith('image/');
    const isVideo = msg.fileType?.startsWith('video/');

    if (isImg) {
      return (
        <div className="mt-3 relative group rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl max-w-sm">
           <img 
            src={msg.fileUrl} 
            className="w-full h-auto object-cover max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => window.open(msg.fileUrl, '_blank')} 
            alt="Asset"
            loading="lazy"
           />
           <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => window.open(msg.fileUrl, '_blank')} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors">
                <ExternalLink size={14} />
              </button>
           </div>
        </div>
      );
    }
    
    if (isVideo) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl max-w-sm">
           <video controls src={msg.fileUrl} className="w-full max-h-[300px]" />
        </div>
      );
    }
    
    return (
      <div className="mt-3 flex items-center gap-4 p-4 bg-slate-950/80 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all group shadow-xl max-w-sm">
        <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 group-hover:bg-indigo-500/20 transition-colors">
           <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-white truncate uppercase tracking-tight">{msg.fileName}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            {(msg.fileSize ? msg.fileSize / 1024 / 1024 : 0).toFixed(2)} MB • Document Node
          </p>
        </div>
        <button 
          onClick={() => window.open(msg.fileUrl, '_blank')}
          className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all"
        >
          <Download size={18} />
        </button>
      </div>
    );
  };

  if (!userProfile?.companyId) return <div className="h-full flex items-center justify-center p-12 text-slate-500 uppercase tracking-[0.5em] text-[10px] animate-pulse">Initialising Secure Subspace...</div>;

  return (
    <div className="h-[calc(100vh-10rem)] flex overflow-hidden bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[3rem] shadow-2xl animate-enter">
      {/* Sidebar */}
      <aside className="w-72 lg:w-80 border-r border-[var(--border-ui)] bg-slate-950/30 flex flex-col shrink-0 hidden md:flex">
        <header className="p-8 border-b border-[var(--border-ui)] flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0"><Users size={24}/></div>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase text-white tracking-tight truncate">Team Hub</h3>
            <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.4em] mt-1 truncate">{userProfile.companyName}</p>
          </div>
        </header>

        <nav className="flex-1 p-6 space-y-10 overflow-y-auto custom-scroll">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Channels</p>
            </div>
            <div className="space-y-1">
              {CHANNELS.map(ch => (
                <button 
                  key={ch.id} 
                  onClick={() => { setActiveChannelId(ch.id); setActiveDmUser(null); }} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${!activeDmUser && activeChannelId === ch.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <ch.icon size={18} className={!activeDmUser && activeChannelId === ch.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                  <span className="text-xs font-black uppercase tracking-tight">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-2">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Operatives</p>
            </div>
            <div className="space-y-1">
              {allUsers.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => setActiveDmUser(u)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${activeDmUser?.id === u.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-black uppercase overflow-hidden">
                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover"/> : u.fullName.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${u.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-black uppercase truncate leading-none">{u.fullName}</p>
                    <p className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${activeDmUser?.id === u.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {u.status === 'ONLINE' ? 'READY' : formatLastSeen(u.lastSeen)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-slate-950/20 overflow-hidden">
        <header className="h-20 lg:h-24 border-b border-[var(--border-ui)] flex items-center justify-between px-6 lg:px-10 bg-[var(--bg-card)]/40 backdrop-blur-3xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-5 min-w-0">
             <div className="relative shrink-0">
               <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-900 border border-white/5 rounded-2xl text-indigo-400 flex items-center justify-center shadow-inner">
                  {activeDmUser ? <User size={20}/> : <Hash size={20}/>}
               </div>
               {activeDmUser?.status === 'ONLINE' && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-[0_0_100px_rgba(16,185,129,0.5)] animate-pulse" />}
             </div>
             <div className="min-w-0">
                <div className="flex items-center gap-3">
                   <h2 className="text-base lg:text-lg font-black uppercase text-white tracking-tight truncate">{activeDmUser ? activeDmUser.fullName : activeChannelId}</h2>
                </div>
                <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 truncate">
                  {activeDmUser ? (activeDmUser.status === 'ONLINE' ? 'OPERATIVE ONLINE' : formatLastSeen(activeDmUser.lastSeen)) : (CHANNELS.find(c => c.id === activeChannelId)?.description)}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
             <button className="p-2.5 text-slate-500 hover:text-white transition-colors"><Search size={16}/></button>
             <button className="p-2.5 text-slate-500 hover:text-white transition-colors"><MoreVertical size={16}/></button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 lg:space-y-8 custom-scroll bg-indigo-500/[0.01]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <Loader2 className="animate-spin text-indigo-500" size={40}/>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Hydrating Thread...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === userProfile.id;
                const showHead = i === 0 || messages[i-1].senderId !== msg.senderId || (messages[i-1].timestamp?.toMillis() && msg.timestamp?.toMillis() && msg.timestamp.toMillis() - messages[i-1].timestamp.toMillis() > 300000);
                
                return (
                  <div key={msg.id} className={`flex gap-3 lg:gap-5 ${isMe ? 'flex-row-reverse' : ''} animate-enter ${showHead ? 'mt-4' : 'mt-1'} group/msg`}>
                    <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border border-white/5 shadow-xl shrink-0 transition-all ${!showHead ? 'opacity-0 scale-75 pointer-events-none' : ''}`}>
                      {msg.senderAvatar ? <img src={msg.senderAvatar} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-indigo-400">{msg.senderName.charAt(0)}</span>}
                    </div>
                    
                    <div className={`max-w-[85%] lg:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHead && (
                        <div className={`flex items-center gap-3 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] lg:text-[10px] font-black uppercase text-white tracking-tight truncate">{msg.senderName}</span>
                          <span className="text-[8px] lg:text-[9px] font-bold text-slate-500 tabular-nums opacity-60">
                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                      )}
                      
                      <div className="relative group/msg-bubble">
                        <div className={`
                          p-3.5 lg:p-5 rounded-[1.5rem] lg:rounded-[1.75rem] text-[13px] lg:text-[13.5px] font-medium leading-relaxed shadow-sm transition-all
                          ${isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-[#0B1120] text-slate-200 rounded-tl-none border border-white/5'}
                        `}>
                          {msg.text && <div className="break-words">{msg.text}</div>}
                          {renderFileContent(msg)}
                        </div>
                        {isMe && (
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className={`absolute ${isMe ? '-left-10' : '-right-10'} top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover/msg-bubble:opacity-100 transition-opacity z-10`}
                            title="Delete for everyone"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Optimistic Media Preview */}
              {optimisticMedia && (
                <div className="flex gap-3 lg:gap-5 flex-row-reverse animate-enter mt-1 opacity-60 grayscale scale-95 origin-right">
                  <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-slate-900 border border-white/5 shadow-xl shrink-0 opacity-0" />
                  <div className="max-w-[85%] lg:max-w-[65%] flex flex-col items-end">
                    <div className="p-3.5 lg:p-5 rounded-[1.5rem] bg-indigo-600 text-white rounded-tr-none shadow-sm">
                      {optimisticMedia.type.startsWith('image/') ? (
                        <img src={optimisticMedia.url} className="max-w-full rounded-lg blur-[2px]" />
                      ) : (
                        <div className="flex items-center gap-3">
                           <Loader2 className="animate-spin" size={14}/>
                           <span className="text-[9px] font-black uppercase">Syncing Node...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 lg:gap-4 animate-enter ml-1">
              <div className="flex gap-1 p-2 lg:p-3 bg-slate-900/50 rounded-xl lg:rounded-2xl border border-white/5">
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {typingUsers.length === 1 ? `${typingUsers[0].toUpperCase()} IS TYPING...` : 'MULTIPLE OPERATIVES TYPING...'}
              </span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <footer className="p-4 lg:p-8 bg-[var(--bg-card)] border-t border-[var(--border-ui)] relative z-20 shrink-0">
          <div className="max-w-5xl mx-auto space-y-4">
            {uploadProgress !== null && (
              <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-4 animate-enter shadow-2xl">
                 <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <AttachmentIcon size={18} className="animate-pulse"/>
                 </div>
                 <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 truncate">Broadcasting Data Stream...</span>
                       <span className="text-[9px] lg:text-[10px] font-black text-indigo-400 ml-2">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.max(1, uploadProgress)}%` }} />
                    </div>
                 </div>
                 <button onClick={cancelUpload} className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shrink-0" title="Abort Transmission">
                    <Trash2 size={16}/>
                 </button>
              </div>
            )}
            
            <div className="relative bg-slate-950 border border-[var(--border-ui)] rounded-[1.5rem] lg:rounded-[2rem] flex items-center p-2 shadow-2xl group focus-within:border-indigo-500/50 transition-all min-w-0">
               <div className="flex items-center shrink-0">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 lg:p-3 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-2xl transition-all" title="Attach Node">
                    <Paperclip size={20}/>
                  </button>
                  <div className="relative" ref={emojiRef}>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2.5 lg:p-3 transition-all rounded-2xl ${showEmojiPicker ? 'text-indigo-400 bg-white/5' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}>
                      <Smile size={20}/>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-4 bg-slate-900 border border-white/10 p-3 rounded-2xl shadow-2xl grid grid-cols-4 gap-2 animate-pop-in z-[50]">
                        {EMOJIS.map(e => (
                          <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmojiPicker(false); }} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-xl">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
               </div>

               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
               
               <form 
                 onSubmit={e => { e.preventDefault(); sendMessage(input); }} 
                 className="flex-1 flex items-center min-w-0"
               >
                 <input 
                   value={input} 
                   onChange={handleInputChange} 
                   placeholder={`Message ${activeDmUser ? activeDmUser.fullName.split(' ')[0] : activeChannelId}...`} 
                   className="flex-1 bg-transparent border-none outline-none px-3 lg:px-5 text-sm lg:text-[14px] font-semibold text-white placeholder:text-slate-600 min-w-0" 
                 />
                 <button 
                  type="submit" 
                  disabled={!input.trim() && !uploadProgress} 
                  className={`
                    h-10 lg:h-12 px-4 lg:px-8 bg-indigo-600 text-white rounded-xl lg:rounded-[1.25rem] flex items-center justify-center gap-2 lg:gap-3 shrink-0
                    hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]
                    disabled:opacity-20 disabled:grayscale transition-all active:scale-95 ml-1 lg:ml-2
                  `}
                 >
                   <Send size={16} className="shrink-0" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xs:inline">Dispatch</span>
                 </button>
               </form>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-slate-600 pointer-events-none opacity-30 grayscale hidden sm:flex">
               <Shield size={10}/>
               <span className="text-[7px] font-black uppercase tracking-[0.4em]">AES-256 Scoped Link Active</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default TeamChat;
