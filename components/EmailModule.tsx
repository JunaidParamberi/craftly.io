
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Inbox, Send, Trash2, Archive, 
  Search, Plus, Reply, 
  ChevronLeft, X,
  Mail, Loader2, Minimize2, Maximize2,
  Users, CheckSquare, Square
} from 'lucide-react';
import { Email } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Button, Badge } from './ui/Primitives.tsx';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  doc,
  query,
  where,
  or,
  updateDoc
} from 'firebase/firestore';
import { db, auth, functions } from '../services/firebase.ts';

// --- LIVE DATA HOOK: useEmails ---
const useEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useBusiness();

  useEffect(() => {
    if (!auth.currentUser || !userProfile?.email) return;

    // Listen for emails where I am the recipient OR the sender
    const q = query(
      collection(db, 'mail'),
      or(
        where('to', '==', userProfile.email),
        where('metadata.senderId', '==', auth.currentUser.uid)
      )
    );

    // Explicitly cast snapshot as any to avoid DocumentSnapshot typing error
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const emailList = snapshot.docs.map((d: { data: () => any; id: any; }) => {
        const data = d.data();
        // Determine folder based on user perspective if not explicitly set
        let folder = data.folder || 'inbox';
        if (data.metadata?.senderId === auth.currentUser?.uid && folder !== 'trash' && folder !== 'archive') {
          folder = 'sent';
        }

        return {
          id: d.id,
          fromName: data.fromName || (data.metadata?.senderName || 'Unknown'),
          fromEmail: data.fromEmail || 'no-reply@craftlyai.app',
          subject: data.message?.subject || 'No Subject',
          body: data.message?.text || '',
          snippet: (data.message?.text || '').substring(0, 80) + '...',
          timestamp: data.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Syncing...',
          isUnread: data.isUnread ?? true,
          folder: folder,
          labels: data.labels || []
        } as Email;
      });

      setEmails(emailList);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.email]);

  return { emails, loading };
};

type FolderType = Email['folder'];
type ViewMode = 'LIST' | 'DETAILS';

const EmailApp: React.FC = () => {
  const { userProfile, showToast, clients } = useBusiness();
  const { emails, loading: emailsLoading } = useEmails();
  
  const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewMode>('LIST');
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const selectedEmail = useMemo(() => 
    emails.find(m => m.id === selectedEmailId), 
  [emails, selectedEmailId]);

  const filteredMessages = useMemo(() => {
    return emails.filter(m => {
      const matchesFolder = m.folder === currentFolder;
      const matchesSearch = 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.fromName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [emails, currentFolder, searchQuery]);

  const handleMoveFolder = async (id: string, folder: FolderType) => {
    try {
      const docRef = doc(db, 'mail', id);
      await updateDoc(docRef, { folder });
      showToast(`Moved to ${folder}`, 'info');
      if (selectedEmailId === id) setView('LIST');
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleCompose = () => {
    setComposeData({ to: '', subject: '', body: '' });
    setIsComposeOpen(true);
    setIsComposeMinimized(false);
  };

  const handleSend = async () => {
    if (!composeData.subject || !auth.currentUser) {
      showToast('Subject is required', 'error');
      return;
    }

    if (isBulkMode) {
      // Bulk email sending
      if (bulkRecipients.length === 0 && selectedClients.size === 0) {
        showToast('Please select at least one recipient', 'error');
        return;
      }

      setIsSendingBulk(true);
      try {
        // Get email addresses from selected clients or use bulk recipients
        const emailList: string[] = [];
        
        if (selectedClients.size > 0) {
          clients.forEach(client => {
            if (selectedClients.has(client.id) && client.email) {
              emailList.push(client.email);
            }
          });
        }
        
        // Add manually entered bulk recipients
        bulkRecipients.forEach(email => {
          if (email.trim() && !emailList.includes(email.trim())) {
            emailList.push(email.trim());
          }
        });

        if (emailList.length === 0) {
          showToast('No valid email addresses found', 'error');
          setIsSendingBulk(false);
          return;
        }

        const sendBulkEmails = httpsCallable(functions, 'sendBulkEmails');
        const result = await sendBulkEmails({
          recipients: emailList.map(email => ({ email })),
          subject: composeData.subject,
          body: composeData.body,
          htmlBody: `<div style="font-family:sans-serif;">${composeData.body.replace(/\n/g, '<br/>')}</div>`,
          senderEmail: userProfile?.email || '',
          senderName: userProfile?.fullName || userProfile?.companyName || ''
        });

        const data = result.data as any;
        
        // Save to Firestore for tracking
        for (const recipient of emailList) {
          await addDoc(collection(db, 'mail'), {
            to: recipient,
            fromName: userProfile?.fullName || 'CreaftlyAI User',
            fromEmail: userProfile?.email || 'hello@craftlyai.app',
            message: {
              subject: composeData.subject,
              text: composeData.body,
              html: `<div style="font-family:sans-serif;">${composeData.body.replace(/\n/g, '<br/>')}</div>`
            },
            metadata: {
              senderId: auth.currentUser.uid,
              senderName: userProfile?.fullName || 'CreaftlyAI User'
            },
            folder: 'sent',
            isUnread: false,
            createdAt: serverTimestamp()
          });
        }

        showToast(`Bulk email sent to ${data.sent} recipients`, data.failed > 0 ? 'warning' : 'success');
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '' });
        setBulkRecipients([]);
        setSelectedClients(new Set());
        setIsBulkMode(false);
      } catch (error: any) {
        console.error('Bulk email error:', error);
        showToast(error.message || 'Bulk email transmission failed', 'error');
      } finally {
        setIsSendingBulk(false);
      }
      return;
    }

    // Single email sending
    if (!composeData.to) {
      showToast('Recipient email is required', 'error');
      return;
    }
    
    setIsTransmitting(true);
    try {
      // Try to send via email API first
      try {
        const sendBulkEmails = httpsCallable(functions, 'sendBulkEmails');
        await sendBulkEmails({
          recipients: [{ email: composeData.to }],
          subject: composeData.subject,
          body: composeData.body,
          htmlBody: `<div style="font-family:sans-serif;">${composeData.body.replace(/\n/g, '<br/>')}</div>`,
          senderEmail: userProfile?.email || '',
          senderName: userProfile?.fullName || userProfile?.companyName || ''
        });
        showToast('Email sent successfully', 'success');
      } catch (emailError: any) {
        console.warn('Email API failed, saving to Firestore:', emailError);
        // Fallback to Firestore only
      }

      // Save to Firestore for tracking
      await addDoc(collection(db, 'mail'), {
        to: composeData.to,
        fromName: userProfile?.fullName || 'CreaftlyAI User',
        fromEmail: userProfile?.email || 'hello@craftlyai.app',
        message: {
          subject: composeData.subject,
          text: composeData.body,
          html: `<div style="font-family:sans-serif;">${composeData.body.replace(/\n/g, '<br/>')}</div>`
        },
        metadata: {
          senderId: auth.currentUser.uid,
          senderName: userProfile?.fullName || 'CreaftlyAI User'
        },
        folder: 'sent',
        isUnread: false,
        createdAt: serverTimestamp()
      });

      showToast('Manifesto Dispatched', 'success');
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
    } catch (error) {
      showToast('Transmission Error', 'error');
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleToggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    if (!isBulkMode) {
      setComposeData({ ...composeData, to: '' });
    }
  };

  const handleToggleClient = (clientId: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleAddBulkRecipient = () => {
    const email = composeData.to.trim();
    if (email && !bulkRecipients.includes(email)) {
      setBulkRecipients([...bulkRecipients, email]);
      setComposeData({ ...composeData, to: '' });
    }
  };

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(m => m.folder === 'inbox' && m.isUnread).length },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  if (emailsLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-canvas)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Syncing Comms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] w-full flex overflow-hidden bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-2xl relative">
      
      {/* PANE 1: NAVIGATION */}
      <aside className="w-20 lg:w-64 border-r border-[var(--border-ui)] bg-[var(--bg-card)] flex flex-col shrink-0">
        <div className="p-4 lg:p-6 space-y-3">
          <Button 
            onClick={handleCompose}
            className="w-full h-11 !bg-indigo-600 border-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
            icon={Plus}
          >
            <span className="hidden lg:inline">Compose</span>
          </Button>
          <Button 
            onClick={handleToggleBulkMode}
            className={`w-full h-10 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              isBulkMode 
                ? '!bg-indigo-500 border-indigo-500 text-white' 
                : 'border-[var(--border-ui)] text-slate-500 hover:border-indigo-500'
            }`}
            icon={Users}
          >
            <span className="hidden lg:inline">{isBulkMode ? 'Single' : 'Bulk'}</span>
          </Button>
        </div>
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scroll">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentFolder(item.id as FolderType); setView('LIST'); }}
              className={`w-full flex items-center justify-center lg:justify-between px-3 lg:px-4 py-3 rounded-xl transition-all ${currentFolder === item.id ? 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-50/50'}`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} strokeWidth={currentFolder === item.id ? 2.5 : 2} />
                <span className={`hidden lg:inline text-sm font-black uppercase tracking-tight ${currentFolder === item.id ? 'text-[var(--text-primary)]' : 'text-slate-500'}`}>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className="hidden lg:inline px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-md">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* PANE 2: LIST */}
      <section className={`w-full md:w-80 lg:w-96 border-r border-[var(--border-ui)] flex flex-col bg-[var(--bg-card-muted)] shrink-0 ${view === 'DETAILS' ? 'hidden md:flex' : 'flex'}`}>
        <header className="h-16 flex items-center px-4 border-b border-[var(--border-ui)] shrink-0">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search registry..."
              className="w-full h-10 pl-9 pr-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll">
          {filteredMessages.map(msg => (
            <button
              key={msg.id}
              onClick={() => { setSelectedEmailId(msg.id); setView('DETAILS'); }}
              className={`w-full text-left p-5 lg:p-6 border-b border-[var(--border-ui)] transition-all flex flex-col gap-1 relative ${selectedEmailId === msg.id ? 'bg-[var(--bg-card)] border-l-4 border-l-indigo-500' : 'bg-transparent hover:bg-[var(--bg-canvas)]'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] uppercase tracking-widest truncate pr-4 ${msg.isUnread ? 'font-black text-indigo-500' : 'font-bold text-slate-500'}`}>
                  {msg.fromName}
                </span>
                <span className="text-[9px] font-black text-slate-400 opacity-50 tabular-nums uppercase">{msg.timestamp}</span>
              </div>
              <div className="flex items-center gap-2">
                {msg.isUnread && msg.folder === 'inbox' && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />}
                <h4 className={`text-xs truncate uppercase tracking-tight ${msg.isUnread ? 'font-black text-[var(--text-primary)]' : 'font-bold text-slate-500'}`}>
                  {msg.subject}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed font-medium mt-1 italic opacity-70">{msg.snippet}</p>
            </button>
          ))}
          {filteredMessages.length === 0 && (
            <div className="py-20 text-center opacity-20">
               <Mail size={40} className="mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Node Empty</p>
            </div>
          )}
        </div>
      </section>

      {/* PANE 3: READER */}
      <main className={`flex-1 bg-[var(--bg-card)] flex flex-col overflow-hidden ${view === 'DETAILS' ? 'flex' : 'hidden md:flex'}`}>
        {selectedEmail ? (
          <>
            <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-ui)] shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setView('LIST')} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button>
                <div className="flex items-center gap-1.5">
                   <button onClick={() => { setComposeData({ to: selectedEmail.fromEmail, subject: `Re: ${selectedEmail.subject}`, body: `\n\n--- On ${selectedEmail.timestamp}, ${selectedEmail.fromName} wrote: ---\n${selectedEmail.body}` }); setIsComposeOpen(true); }} className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-slate-500 hover:text-indigo-500 rounded-xl transition-all" title="Reply"><Reply size={18}/></button>
                   <div className="w-px h-6 bg-[var(--border-ui)] mx-2" />
                   <button onClick={() => handleMoveFolder(selectedEmail.id, 'trash')} className="p-2.5 bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                   <button onClick={() => handleMoveFolder(selectedEmail.id, 'archive')} className="p-2.5 bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-slate-500 hover:text-indigo-500 rounded-xl transition-all" title="Archive"><Archive size={18}/></button>
                </div>
              </div>
              <Badge variant="info" className="!text-[8px] uppercase tracking-[0.2em]">{selectedEmail.folder} Node</Badge>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll p-8 lg:p-14 animate-enter bg-[var(--bg-card)]">
               <div className="max-w-4xl mx-auto space-y-12">
                  <header className="space-y-8">
                    <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-[0.9] uppercase">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center justify-between py-8 border-y border-[var(--border-ui)]">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-2xl">
                          {selectedEmail.fromName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)] leading-none uppercase tracking-tight">{selectedEmail.fromName}</p>
                          <p className="text-[11px] font-bold text-slate-500 mt-2 lowercase opacity-60">ID: {selectedEmail.fromEmail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] tabular-nums opacity-60">{selectedEmail.timestamp}</span>
                    </div>
                  </header>
                  <div className="text-base text-[var(--text-primary)] leading-relaxed font-semibold whitespace-pre-wrap opacity-90">{selectedEmail.body}</div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-indigo-500/[0.02]">
            <div className="w-20 h-20 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[2rem] flex items-center justify-center text-indigo-500/20 mb-8 animate-pulse">
               <Mail size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.4em]">Satellite Registry Active</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-4 opacity-40">Select a data node to begin transmission.</p>
          </div>
        )}
      </main>

      {/* FLOATING COMPOSE WINDOW */}
      {isComposeOpen && (
        <div className={`fixed bottom-0 right-4 lg:right-10 w-full max-w-[calc(100%-2rem)] sm:w-[580px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] rounded-t-[2.5rem] border border-[var(--border-ui)] bg-[var(--bg-card)] z-[20000] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isComposeMinimized ? 'h-14 overflow-hidden' : 'h-[640px] max-h-[90vh]'}`}>
          <header 
            className="bg-slate-900 dark:bg-black text-white p-4.5 flex justify-between items-center rounded-t-[2.5rem] cursor-pointer shadow-lg" 
            onClick={() => setIsComposeMinimized(!isComposeMinimized)}
          >
            <div className="flex items-center gap-4 pl-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">{isComposeMinimized ? `Draft: ${composeData.subject || 'Empty'}` : 'New Mission Manifesto'}</h3>
            </div>
            <div className="flex items-center gap-1.5 pr-2">
              <button onClick={(e) => { e.stopPropagation(); setIsComposeMinimized(!isComposeMinimized); }} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                {isComposeMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsComposeOpen(false); }} className="p-2 hover:bg-rose-500 text-white rounded-xl transition-all">
                <X size={16} />
              </button>
            </div>
          </header>
          
          {!isComposeMinimized && (
            <div className="flex flex-col h-[calc(100%-56px)] bg-[var(--bg-card)]">
              <div className="px-8 border-b border-[var(--border-ui)] bg-[var(--bg-canvas)]/30">
                {isBulkMode ? (
                  <>
                    <div className="flex items-center py-5 border-b border-[var(--border-ui)]/50 gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase w-12 tracking-widest opacity-60 shrink-0">TO</span>
                      <div className="flex-1 flex items-center gap-2">
                        <input 
                          type="email" 
                          placeholder="Enter email and press Enter"
                          className="flex-1 text-sm font-black uppercase outline-none bg-transparent text-[var(--text-primary)] placeholder:text-slate-500/30"
                          value={composeData.to}
                          onChange={e => setComposeData({...composeData, to: e.target.value})}
                          onKeyPress={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBulkRecipient();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddBulkRecipient}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-500 transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    {(bulkRecipients.length > 0 || selectedClients.size > 0) && (
                      <div className="py-4 max-h-32 overflow-y-auto custom-scroll space-y-2">
                        {bulkRecipients.map((email, idx) => (
                          <div key={`bulk-${idx}`} className="flex items-center justify-between bg-[var(--bg-card-muted)] px-3 py-2 rounded-lg">
                            <span className="text-xs font-bold text-[var(--text-primary)]">{email}</span>
                            <button
                              onClick={() => setBulkRecipients(bulkRecipients.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {clients.filter(c => selectedClients.has(c.id) && c.email).map(client => (
                          <div key={client.id} className="flex items-center justify-between bg-indigo-500/10 px-3 py-2 rounded-lg">
                            <span className="text-xs font-bold text-[var(--text-primary)]">{client.email}</span>
                            <button
                              onClick={() => handleToggleClient(client.id)}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {clients.length > 0 && (
                      <div className="py-4 border-t border-[var(--border-ui)]/50 max-h-40 overflow-y-auto custom-scroll">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Clients:</p>
                        <div className="space-y-1">
                          {clients.filter(c => c.email).map(client => (
                            <button
                              key={client.id}
                              onClick={() => handleToggleClient(client.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-canvas)] transition-all text-left"
                            >
                              {selectedClients.has(client.id) ? (
                                <CheckSquare size={14} className="text-indigo-500" />
                              ) : (
                                <Square size={14} className="text-slate-400" />
                              )}
                              <span className="text-xs font-bold text-[var(--text-primary)]">{client.name}</span>
                              <span className="text-[10px] text-slate-500 ml-auto">{client.email}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center py-5 border-b border-[var(--border-ui)]/50">
                    <span className="text-[10px] font-black text-slate-500 uppercase w-12 tracking-widest opacity-60">TO</span>
                    <input 
                      type="email" 
                      className="flex-1 text-sm font-black uppercase outline-none bg-transparent text-[var(--text-primary)]"
                      value={composeData.to}
                      onChange={e => setComposeData({...composeData, to: e.target.value})}
                    />
                  </div>
                )}
                <div className="flex items-center py-5">
                  <span className="text-[10px] font-black text-slate-500 uppercase w-12 tracking-widest opacity-60">SUB</span>
                  <input 
                    type="text" 
                    placeholder="ENTER MISSION SUBJECT"
                    className="flex-1 text-sm font-black uppercase outline-none bg-transparent text-[var(--text-primary)] placeholder:text-slate-500/30"
                    value={composeData.subject}
                    onChange={e => setComposeData({...composeData, subject: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex-1 relative p-8 flex flex-col bg-[var(--input-bg)]">
                <textarea 
                  className="flex-1 w-full text-sm font-bold outline-none resize-none leading-relaxed text-[var(--text-primary)] custom-scroll bg-transparent"
                  placeholder="Draft your strategic implementation manifesto here..."
                  value={composeData.body}
                  onChange={e => setComposeData({...composeData, body: e.target.value})}
                />
              </div>

              <footer className="p-6 border-t border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSend}
                    disabled={isTransmitting || isSendingBulk}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl active:scale-95 border border-indigo-500/20 disabled:opacity-50"
                  >
                    {(isTransmitting || isSendingBulk) ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isSendingBulk 
                      ? `Sending to ${bulkRecipients.length + selectedClients.size}...` 
                      : isTransmitting 
                        ? 'Transmitting...' 
                        : isBulkMode 
                          ? `Dispatch to ${bulkRecipients.length + selectedClients.size}` 
                          : 'Dispatch Manifesto'}
                  </button>
                </div>
                <button 
                  onClick={() => { if(confirm('Purge this draft node?')) setIsComposeOpen(false); }}
                  className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Purge Draft"
                >
                  <Trash2 size={20} />
                </button>
              </footer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailApp;
