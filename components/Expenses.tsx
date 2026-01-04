
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Receipt, Tag, X, Trash2, Check, ChevronDown, Edit2 } from 'lucide-react';
import { Voucher } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemporalPicker from './TemporalPicker.tsx';
import { Button, PriceInput, Card, EmptyState } from './ui/Primitives.tsx';

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
  const { vouchers, setVouchers } = useBusiness();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Voucher>>({ 
    description: '', amount: 0, category: 'Infrastructure', status: 'Pending', projectId: 'PR-X1', date: new Date().toISOString().split('T')[0] 
  });

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
    } else {
      const newVo = { ...formData, id: `VO-${Math.floor(1000 + Math.random() * 9000)}` } as Voucher;
      setVouchers([newVo, ...vouchers]);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-10 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Overhead Registry</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-3">Active operational expense nodes.</p>
        </div>
        <Button onClick={() => handleOpenForm()} variant="primary" icon={Plus} className="shadow-2xl h-14 px-8">
          Record Voucher
        </Button>
      </div>

      {vouchers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vouchers.map((vo) => (
            <Card 
              key={vo.id} 
              className="p-10 flex flex-col group relative overflow-hidden border-2 border-transparent hover:border-indigo-500/50 bg-[#0B1120] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-h-[340px]"
              hover={false}
            >
              <div className="flex justify-between items-start mb-10">
                <div className="w-12 h-12 rounded-xl bg-[#020617] border border-white/5 flex items-center justify-center text-[var(--accent)] shadow-inner">
                  <Receipt size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleOpenForm(vo)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(vo.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 rounded-xl text-rose-500 hover:text-white transition-all border border-rose-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-[26px] font-black text-white mb-auto uppercase tracking-tighter leading-[1.1] line-clamp-2">
                {vo.description}
              </h3>

              <div className="mt-8 space-y-6">
                <div className="h-px bg-white/5 w-full" />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-1.5">Node</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{vo.projectId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-1.5">Value</p>
                    <p className="text-[32px] font-black text-white tracking-tighter tabular-nums flex items-baseline justify-end gap-1 leading-none">
                      <span className="text-[12px] opacity-30 font-bold">AED</span>
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
          title="Profitability starts with lean operations." 
          description="Your overhead registry is perfectly clear. No operational friction detected. Log your first expense to ensure total strategic accuracy in your margins."
          action={<Button onClick={() => handleOpenForm()} icon={Plus}>Record First Voucher</Button>}
        />
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-lg animate-pop-in shadow-[0_0_100px_rgba(0,0,0,0.5)] border-none">
            <header className="p-8 border-b border-[var(--border-ui)] flex justify-between items-center bg-[var(--bg-card)]">
               <h3 className="text-lg font-black uppercase tracking-widest">{editingId ? 'Modify' : 'Record'} Voucher</h3>
               <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
            </header>
            <div className="p-8 space-y-8 custom-scroll">
              <form onSubmit={finalizeSave} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-0.5 opacity-60">Description</label>
                  <input type="text" className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl px-5 py-4 text-sm font-black uppercase outline-none focus:border-[var(--accent)] transition-all" value={formData.description} placeholder="E.G. SERVER SCALABILITY FEE" onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TemporalPicker label="Transaction Date" value={formData.date || ''} onChange={(val) => setFormData({...formData, date: val})} />
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-0.5 opacity-60">Project Node</label>
                    <input type="text" className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl px-5 py-4 text-sm font-black uppercase outline-none focus:border-[var(--accent)] transition-all" value={formData.projectId} placeholder="PR-X1" onChange={e => setFormData({...formData, projectId: e.target.value.toUpperCase()})} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PriceInput label="Worth (AED)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required />
                  <CustomSelect label="Category" value={formData.category} options={[{ id: 'Infrastructure', label: 'Infrastructure' }, { id: 'Software', label: 'Software' }, { id: 'Strategy', label: 'Strategy' }]} onChange={(val: any) => setFormData({...formData, category: val})} icon={Tag} />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" variant="primary" className="w-full h-16 shadow-2xl text-xs uppercase tracking-widest">{editingId ? 'Update' : 'Register'} Voucher Node</Button>
                </div>
              </form>
            </div>
          </div>
        </div>, document.body
      )}
      
      <ConfirmationModal isOpen={!!confirmDeleteId} title="Purge Voucher" message="This operational voucher node will be permanently removed. Proceed?" onConfirm={() => { setVouchers(vouchers.filter(v => v.id !== confirmDeleteId)); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default Expenses;
