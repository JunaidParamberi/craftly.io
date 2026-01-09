import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserPlus, X, Mail, 
  Trash2, ShieldAlert, Edit2,
  Loader2, Cpu, Key, Fingerprint, Activity,
  AlertCircle, CheckCircle2, Send, Copy, Check,
  User as UserIcon, MoreHorizontal, Clock,
  ChevronRight, ArrowUpRight, Circle, Shield,
  Users, Briefcase, CreditCard, Receipt, Box, Sparkles, Megaphone
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { UserProfile, UserRole } from '../types.ts';
import { Button, Input, Select, Card, Badge, Label, EmptyState } from './ui/Primitives.tsx';
import { createPortal } from 'react-dom';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db, functions } from '../services/firebase.ts';
import { httpsCallable } from 'firebase/functions';
import ConfirmationModal from './ConfirmationModal.tsx';

const PERMISSION_NODES = [
  { id: 'MANAGE_CLIENTS', label: 'Partner Registry', icon: Users, description: 'Direct access to CRM and partner nodes.' },
  { id: 'MANAGE_PROJECTS', label: 'Mission Ops', icon: Briefcase, description: 'Deploy and synchronize project missions.' },
  { id: 'MANAGE_FINANCE', label: 'Fiscal Ledger', icon: CreditCard, description: 'Authorized for invoices and LPO nodes.' },
  { id: 'MANAGE_EXPENSES', label: 'Voucher Hub', icon: Receipt, description: 'Audit and record overhead vouchers.' },
  { id: 'MANAGE_CATALOG', label: 'Asset Index', icon: Box, description: 'Configure services and catalog resources.' },
  { id: 'MANAGE_CAMPAIGNS', label: 'Campaign Studio', icon: Megaphone, description: 'Design and broadcast strategic marketing campaigns.' },
  { id: 'MANAGE_PROVISIONING', label: 'Authority Core', icon: Shield, description: 'Provision new operatives to the registry.' },
  { id: 'ACCESS_AI', label: 'Neural Link', icon: Sparkles, description: 'Access AI strategy and insight engines.' },
];

const UserProvisioning: React.FC = () => {
  const { userProfile, showToast } = useBusiness();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [provisionMode, setProvisionMode] = useState<'DIRECT' | 'INVITE'>('DIRECT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<{ joinLink: string; emailSent: boolean } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as UserRole,
    title: '',
    permissions: [] as string[],
    companyId: userProfile?.companyId || ''
  });

  useEffect(() => {
    if (!userProfile?.companyId) return;
    
    const q = query(
      collection(db, 'users'), 
      where('companyId', '==', userProfile.companyId)
    );

    // Explicitly cast snap as any to avoid DocumentSnapshot inference error
    const unsub = onSnapshot(q, (snap: any) => {
      setUsers(snap.docs.map((d: any) => d.data() as UserProfile));
      setIsLoading(false);
    }, (err) => {
      console.error("Directory sync error:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, [userProfile?.companyId]);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      role: user.role || 'EMPLOYEE',
      title: user.title || '',
      permissions: user.permissions || [],
      companyId: user.companyId || (userProfile?.companyId || '')
    });
    setShowModal(true);
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Owners automatically get all permissions
    const finalPermissions = formData.role === 'OWNER' || formData.role === 'SUPER_ADMIN' 
      ? PERMISSION_NODES.map(p => p.id)
      : formData.permissions;

    try {
      if (editingUser) {
        const updateUser = httpsCallable(functions, 'updateUser');
        await updateUser({
          uid: editingUser.id,
          fullName: (formData.fullName || '').trim(),
          title: (formData.title || '').trim(),
          role: formData.role,
          permissions: finalPermissions,
          password: formData.password || undefined
        });
        showToast(`Operative ${formData.fullName} updated.`, 'success');
        setShowModal(false);
        setEditingUser(null);
      } else if (provisionMode === 'DIRECT') {
        const createUser = httpsCallable(functions, 'createUser');
        await createUser({
          email: (formData.email || '').trim(),
          password: formData.password,
          fullName: (formData.fullName || '').trim(),
          title: (formData.title || '').trim(),
          companyId: formData.companyId,
          role: formData.role,
          permissions: finalPermissions
        });
        showToast(`Operative ${formData.fullName} provisioned.`, 'success');
        setShowModal(false);
      } else {
        const sendInvite = httpsCallable(functions, 'sendInviteEmail');
        const result = await sendInvite({
          email: (formData.email || '').trim(),
          role: formData.role,
          permissions: finalPermissions,
          companyId: formData.companyId,
          companyName: userProfile?.companyName || 'the Organization'
        });
        
        const data = result.data as any;
        if (data.emailSent) {
          showToast(`Invitation sent to ${formData.email}`, 'success');
          setShowModal(false);
        } else {
          setSuccessData({
            joinLink: data.joinLink,
            emailSent: false
          });
        }
      }
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        title: '',
        permissions: [],
        companyId: userProfile?.companyId || ''
      });
    } catch (err: any) {
      setError(err?.message || 'Transmission failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDoc(doc(db, 'users', confirmDeleteId));
      showToast('User node purged from registry', 'info');
      setConfirmDeleteId(null);
    } catch (e) {
      showToast('Purge failed', 'error');
    }
  };

  const isSuper = userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'OWNER';

  const formatLastActive = (lastSeen: any) => {
    if (!lastSeen) return 'Never';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  if (!userProfile || !isSuper) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <ShieldAlert size={64} className="text-rose-500 mb-6 opacity-20" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Access Denied</h2>
        <p className="text-slate-500 mt-4 uppercase text-[10px] font-bold tracking-[0.3em]">Identity clearance insufficient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-enter pb-24 max-w-[1400px] mx-auto px-4 lg:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 p-8 lg:p-12 bg-[#0B1120] border border-white/5 rounded-[3rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Fingerprint size={280} />
        </div>
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-white/10">
               <Cpu size={28} />
             </div>
             <div>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none text-white">Directory</h2>
                <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.5em] mt-3 opacity-80">Operative Node Registry</p>
             </div>
           </div>
        </div>
        <Button 
          onClick={() => {
            setEditingUser(null);
            setSuccessData(null);
            setError(null);
            setFormData({
              fullName: '',
              email: '',
              password: '',
              role: 'EMPLOYEE',
              title: '',
              permissions: [],
              companyId: userProfile?.companyId || ''
            });
            setShowModal(true);
          }}
          variant="primary" 
          icon={UserPlus} 
          className="px-10 h-16 shadow-2xl relative z-10 text-[11px] uppercase font-black tracking-widest bg-indigo-600 border-indigo-600 hover:bg-indigo-500 transition-all active:scale-95"
        >
          Initialize Node
        </Button>
      </header>

      <Card padding="p-0" className="overflow-hidden border border-white/5 bg-[#0B1120] rounded-[2.5rem] shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
        <div className="overflow-x-auto custom-scroll relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                <th className="px-10 py-7">Operative Node</th>
                <th className="px-10 py-7 hidden lg:table-cell">Identity Profile</th>
                <th className="px-10 py-7 text-center">Clearance</th>
                <th className="px-10 py-7 hidden md:table-cell text-center">Modules</th>
                <th className="px-10 py-7 hidden xl:table-cell text-center">Last Active</th>
                <th className="px-10 py-7 text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={6} className="px-10 py-8"><div className="h-14 bg-white/[0.02] rounded-2xl w-full" /></td></tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.01] transition-all cursor-default">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-slate-950 border border-white/5 flex items-center justify-center text-indigo-400 font-black text-lg shrink-0 overflow-hidden shadow-xl group-hover:border-indigo-500/30 transition-colors">
                          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.fullName} /> : <span className="opacity-60">{user.fullName?.charAt(0) || 'U'}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-black text-white uppercase tracking-tight truncate leading-none mb-2">{user.fullName}</p>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">{user.title || 'OPERATIVE'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden lg:table-cell">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2 text-indigo-400/80"><Mail size={12} strokeWidth={2.5} /><span className="text-[11px] font-black lowercase tracking-tight">{user.email}</span></div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-5">Registry ID: {user.id.substring(0, 8)}</p>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <Badge variant={user.role === 'OWNER' || user.role === 'SUPER_ADMIN' ? 'success' : 'info'} className="!px-4 !py-1.5 !rounded-lg !text-[9px] font-black uppercase tracking-[0.15em] border-none shadow-sm">
                        {user.role === 'OWNER' ? 'ADMIN' : user.role}
                      </Badge>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                       <div className="flex justify-center items-center gap-1">
                          {PERMISSION_NODES.map((p) => (
                            <div key={p.id} className={`w-6 h-6 rounded-md flex items-center justify-center transition-opacity ${(user.permissions || []).includes(p.id) ? 'bg-indigo-500/10 text-indigo-400' : 'opacity-10 grayscale'}`} title={p.label}>
                               <p.icon size={12} />
                            </div>
                          ))}
                       </div>
                    </td>
                    <td className="px-10 py-8 hidden xl:table-cell text-center">
                       <div className="flex flex-col items-center gap-1 opacity-60">
                          <div className="flex items-center gap-2 text-[10px] font-black text-white tabular-nums uppercase tracking-widest"><Clock size={12} />{formatLastActive(user.lastSeen)}</div>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button onClick={() => handleEdit(user)} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"><Edit2 size={16}/></button>
                        {user.id !== userProfile.id && (
                          <button onClick={() => setConfirmDeleteId(user.id)} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/5 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"><Trash2 size={16}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-10 py-32 text-center"><EmptyState icon={UserIcon} title="Registry Node Vacuum" description="Provision nodes to begin team collaboration." action={<Button onClick={() => setShowModal(true)} variant="outline" className="h-12 border-indigo-500/30 text-indigo-400 mt-6">Provision Node</Button>} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="p-8 bg-slate-900/30 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{users.filter(u => u.status === 'ONLINE').length} Active</span></div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{users.filter(u => u.status !== 'ONLINE').length} Inactive</span></div>
           </div>
           <div className="flex items-center gap-3 text-indigo-500/40"><ShieldCheck size={14} /><span className="text-[9px] font-black uppercase tracking-[0.3em]">Registry AES-256 Protected</span></div>
        </footer>
      </Card>

      {showModal && createPortal(
        <div className="exec-modal-overlay">
          <div className="w-full max-w-3xl mx-auto bg-[#0F172A] border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] animate-pop-in relative overflow-hidden">
             <header className="p-8 lg:p-10 flex justify-between items-center border-b border-white/5 bg-slate-950/20 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center shadow-lg"><Fingerprint size={24}/></div>
                   <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{editingUser ? 'Sync Updates' : 'Provision Node'}</h3>
                     <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">Identity Configuration</p>
                   </div>
                </div>
                <button onClick={() => { setShowModal(false); setEditingUser(null); }} className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><X size={24} /></button>
             </header>

             <div className="p-10 lg:p-12 space-y-10 custom-scroll max-h-[80vh] overflow-y-auto">
                {successData ? (
                  <div className="space-y-10 animate-enter py-6">
                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl"><CheckCircle2 size={40} /></div>
                        <div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tight">Identity Indexed</h4>
                          <p className="text-sm text-slate-400 font-medium mt-3">Transfer token to operative:</p>
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 text-[11px] font-mono break-all text-indigo-300 shadow-inner relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(successData.joinLink); showToast('Link Buffered'); }}>
                        <div className="absolute top-4 right-4 text-slate-700 group-hover:text-indigo-500 transition-colors"><Copy size={14} /></div>{successData.joinLink}
                      </div>
                      <Button variant="primary" onClick={() => setShowModal(false)} className="w-full h-16 text-xs font-black uppercase tracking-widest shadow-2xl">Deactivate Terminal</Button>
                  </div>
                ) : (
                  <form onSubmit={handleAction} className="space-y-10 relative z-10">
                      {!editingUser && (
                        <div className="flex p-1.5 bg-slate-950 border border-white/5 rounded-2xl mb-2 shadow-inner">
                            <button type="button" onClick={() => setProvisionMode('DIRECT')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provisionMode === 'DIRECT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Internal Node</button>
                            <button type="button" onClick={() => setProvisionMode('INVITE')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provisionMode === 'INVITE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Remote Link</button>
                        </div>
                      )}
                      
                      {error && <div className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-4"><ShieldAlert size={18}/>{error}</div>}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input label="Operative Name" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })} className="!bg-[#020617] !border-white/5 text-white h-14 font-black" />
                        <Input label="Mission Designation" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })} placeholder="E.G. STRATEGIST" className="!bg-[#020617] !border-white/5 text-white h-14 font-black" />
                        <Input label="Registry Email" type="email" required disabled={!!editingUser} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="!bg-[#020617] !border-white/5 text-white h-14 font-black" />
                        <Select label="Security Clearance" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="!bg-[#020617] !border-white/5 text-white h-14 font-black uppercase">
                          <option value="EMPLOYEE">STAFF OPERATIVE</option>
                          <option value="OWNER">ADMIN AUTHORITY (OWNER)</option>
                          <option value="CLIENT">EXTERNAL NODE (CLIENT)</option>
                        </Select>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                           <Label className="!text-slate-400 !opacity-100 uppercase tracking-[0.4em]">Permissions Matrix</Label>
                           {formData.role === 'OWNER' && <Badge variant="success" className="!text-[8px]">Full Access Override</Badge>}
                        </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${formData.role === 'OWNER' ? 'opacity-30 pointer-events-none' : ''}`}>
                          {PERMISSION_NODES.map((p) => (
                            <button 
                              key={p.id}
                              type="button"
                              onClick={() => togglePermission(p.id)}
                              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${formData.permissions.includes(p.id) ? 'bg-indigo-600/10 border-indigo-600 shadow-md' : 'bg-slate-950 border-transparent hover:border-white/10'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${formData.permissions.includes(p.id) ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-600 group-hover:text-slate-400'}`}>
                                <p.icon size={18} />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-black uppercase tracking-tight text-white mb-1 leading-none">{p.label}</p>
                                 <p className="text-[9px] text-slate-500 font-medium leading-tight line-clamp-2">{p.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {(provisionMode === 'DIRECT' || editingUser) && (
                        <div className="space-y-2">
                          <Input label={editingUser ? "Reset Secret Key (Optional)" : "Access Secret Key"} type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="!bg-[#020617] !border-white/5 text-white h-14 font-black" />
                        </div>
                      )}

                      <div className="pt-4"><Button type="submit" loading={isProcessing} className="w-full h-18 !bg-indigo-600 !border-indigo-600 text-white rounded-3xl shadow-2xl uppercase tracking-[0.3em] font-black text-xs">{editingUser ? 'Sync Node Updates' : 'Initialize Node'}</Button></div>
                  </form>
                )}
             </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal isOpen={!!confirmDeleteId} title="Purge Operative" message="Permanently decommission this operative from the registry?" onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default UserProvisioning;