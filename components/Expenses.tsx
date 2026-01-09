
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Receipt, Tag, X, Trash2, Check, ChevronDown, Edit2, TrendingUp, TrendingDown, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { Voucher } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemporalPicker from './TemporalPicker.tsx';
// Fix: Added missing Label import from Primitives
import { Button, PriceInput, Card, EmptyState, Badge, Heading, Input, Label } from './ui/Primitives.tsx';

const CustomSelect = ({ label, value, options, onChange, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-0.5 opacity-60">{label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl flex items-center justify-between text-left hover:border-[var(--accent)] transition-all ${isOpen ? 'border-[var(--accent)] ring-4 ring-indigo-500/10' : ''}`}>
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon size={16} className="text-[var(--accent)] shrink-0" />}
          <span className="truncate text-xs font-black uppercase tracking-tight">{options.find((o: any) => o.id === value)?.label || value || 'Select...'}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400`} />
      </button>
      {isOpen && (
        <div className="absolute z-[10001] top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scroll animate-pop-in">
          {options.map((opt: any) => (
            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); }}
              className={`w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all flex items-center justify-between group ${value === opt.id ? 'text-[var(--accent)] bg-[var(--accent)]/5' : 'text-[var(--text-secondary)]'}`}>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Expenses: React.FC = () => {
  const { vouchers, setVouchers, deleteVoucher, userProfile, showToast } = useBusiness();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Voucher>>({ 
    description: '', amount: 0, category: 'Infrastructure', status: 'Pending', projectId: 'PR-X1', date: new Date().toISOString().split('T')[0] 
  });

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  const handleOpenForm = (voucher?: Voucher) => {
    if (voucher) {
      setEditingId(voucher.id);
      setFormData(voucher);
    } else {
      setEditingId(null);
      setFormData({ description: '', amount: 0, category: 'Infrastructure', status: 'Pending', projectId: 'PR-X1', date: new Date().toISOString().split('T')[0] });
    }
    setShowForm(true);
  };

  const finalizeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setVouchers(prev => prev.map(v => v.id === editingId ? { ...v, ...formData } as Voucher : v));
      showToast('Registry node updated');
    } else {
      const newVo = { ...formData, id: `VO-${Math.floor(1000 + Math.random() * 9000)}` } as Voucher;
      setVouchers([newVo, ...vouchers]);
      showToast('New voucher node indexed');
    }
    setShowForm(false);
  };

  const handleToggleStatus = (vo: Voucher) => {
    if (!isOwner) {
       showToast('Clearance required for status updates', 'info');
       return;
    }
    const nextStatusMap: Record<Voucher['status'], Voucher['status']> = {
      'Pending': 'Paid Back',
      'Paid Back': 'Reimbursed',
      'Reimbursed': 'Pending'
    };
    const updated = { ...vo, status: nextStatusMap[vo.status] };
    setVouchers(vouchers.map(v => v.id === vo.id ? updated : v));
    showToast(`Voucher ${vo.id} transitioned to ${updated.status}`);
  };

  return (
    <div className="space-y-10 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <Heading sub={`Registry Telemetry: ${vouchers.length} Nodes Indexed`}>Vouchers Hub</Heading>
          <div className="flex items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
             <div className="flex items-center gap-1.5"><TrendingDown size={14} className="text-rose-500" /> Expenses</div>
             <div className="w-1 h-1 rounded-full bg-slate-800" />
             <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500" /> Receipts</div>
          </div>
        </div>
        <Button onClick={() => handleOpenForm()} variant="primary" icon={Plus} className="shadow-2xl h-14 px-8 bg-indigo-600 border-indigo-600">
          Initialize Voucher
        </Button>
      </div>

      {vouchers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vouchers.map((vo) => (
            <Card 
              key={vo.id} 
              className="p-10 flex flex-col group relative overflow-hidden border-2 border-white/5 bg-[#0B1120] hover:border-indigo-500/40 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.4)] min-h-[360px]"
              hover={false}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <Receipt size={140} />
              </div>

              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-indigo-400 shadow-inner">
                  {vo.amount > 0 ? <TrendingDown size={24} className="text-rose-500" /> : <TrendingUp size={24} className="text-emerald-500" />}
                </div>
                <div className="flex flex-col items-end gap-3">
                   <button 
                     onClick={() => handleToggleStatus(vo)}
                     className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${vo.status === 'Reimbursed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                   >
                     {vo.status}
                   </button>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenForm(vo)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDeleteId(vo.id)} className="p-2.5 bg-rose-500/5 hover:bg-rose-600 rounded-xl text-rose-500 hover:text-white transition-all border border-rose-500/10"><Trash2 size={14} /></button>
                   </div>
                </div>
              </div>
              
              <div className="flex-1 relative z-10">
                 <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em] mb-3">Protocol Descriptor</p>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-[1.1] line-clamp-3 group-hover:text-indigo-400 transition-colors">
                   {vo.description}
                 </h3>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       <Clock size={10} />
                       {new Date(vo.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-tight">{vo.projectId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-50">Node Value</p>
                    <p className="text-4xl font-black text-white tabular-nums tracking-tighter flex items-baseline justify-end gap-1.5 leading-none">
                      <span className="text-xs opacity-20 font-bold">AED</span>
                      {vo.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Receipt} 
          title="Registry Vacuum Detected" 
          description="Your voucher hub has no active transaction nodes. Log your first operational expense or receipt node to start tracking fiscal gravity."
          action={<Button onClick={() => handleOpenForm()} icon={Plus} className="h-14 px-10 shadow-2xl">Record First Node</Button>}
        />
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-lg animate-pop-in shadow-[0_0_100px_rgba(0,0,0,0.8)] border-none">
            <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0B1120] text-white">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20"><Banknote size={24}/></div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{editingId ? 'Modify' : 'Initialize'} Voucher</h3>
               </div>
               <button onClick={() => setShowForm(false)} className="p-2 text-slate-500 hover:text-rose-500 transition-all"><X size={24} /></button>
            </header>
            <div className="p-8 space-y-8 bg-[#0B1120] custom-scroll">
              <form onSubmit={finalizeSave} className="space-y-8">
                <div className="space-y-2">
                  <Label className="!text-slate-500 !opacity-100 uppercase tracking-[0.4em]">Node Description</Label>
                  <input type="text" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800" value={formData.description} placeholder="E.G. CLOUD SCALABILITY FEE" onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TemporalPicker label="Activation Date" value={formData.date || ''} onChange={(val) => setFormData({...formData, date: val})} />
                  <div className="space-y-2">
                    <Label className="!text-slate-500 !opacity-100 uppercase tracking-[0.4em]">Project ID</Label>
                    <input type="text" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase text-white outline-none focus:border-indigo-500 transition-all" value={formData.projectId} placeholder="PR-X1" onChange={e => setFormData({...formData, projectId: e.target.value.toUpperCase()})} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PriceInput label="Worth (AED)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="!bg-[#020617] !border-white/10 text-white !h-16" required />
                  <CustomSelect label="Cluster Category" value={formData.category} options={[{ id: 'Infrastructure', label: 'Infrastructure' }, { id: 'Software', label: 'Software' }, { id: 'Strategy', label: 'Strategy' }, { id: 'Legacy', label: 'Legacy Node' }]} onChange={(val: any) => setFormData({...formData, category: val})} icon={Tag} />
                </div>
                
                <div className="pt-6">
                  <Button type="submit" variant="primary" className="w-full h-18 shadow-2xl text-[11px] font-black uppercase tracking-[0.3em] !bg-indigo-600 !border-indigo-600">
                    {editingId ? 'Update Registry' : 'Commit Voucher Node'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>, document.body
      )}
      
      <ConfirmationModal isOpen={!!confirmDeleteId} title="Purge Voucher Node" message="This operational voucher node will be permanently decommissioned from the ledger. Proceed with purge?" onConfirm={() => { if (confirmDeleteId) deleteVoucher(confirmDeleteId); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default Expenses;
