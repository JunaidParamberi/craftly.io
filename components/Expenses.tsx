
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Receipt, Tag, X, Trash2, ChevronDown, 
  Edit2, TrendingUp, TrendingDown, Clock, 
  Banknote, ArrowUpRight, ArrowDownLeft, List
} from 'lucide-react';
import { Voucher } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemporalPicker from './TemporalPicker.tsx';
import { Button, PriceInput, Card, EmptyState, Badge, Heading, Label } from './ui/Primitives.tsx';

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
        className={`w-full h-11 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl flex items-center justify-between text-left hover:border-[var(--accent)] transition-all text-[var(--text-primary)] ${isOpen ? 'border-[var(--accent)] ring-4 ring-indigo-500/10' : ''}`}>
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon size={16} className="text-[var(--accent)] shrink-0" />}
          <span className="truncate text-xs font-black uppercase tracking-tight">{options.find((o: any) => o.id === value)?.label || value || 'Select...'}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-[var(--text-secondary)]`} />
      </button>
      {isOpen && (
        <div className="absolute z-[10001] top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scroll animate-pop-in">
          {options.map((opt: any) => (
            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); }}
              className={`w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all flex items-center justify-between group ${value === opt.id ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)]'}`}>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Expenses: React.FC = () => {
  const { vouchers, saveVoucher, deleteVoucher, userProfile, showToast, telemetry } = useBusiness();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPENSE' | 'RECEIPT'>('ALL');
  
  const [formData, setFormData] = useState<Partial<Voucher>>({ 
    description: '', 
    amount: 0, 
    category: 'Infrastructure', 
    status: 'Pending', 
    projectId: 'GENERAL', 
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE'
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!showForm) {
      setEditingId(null);
    }
  }, [showForm]);

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  const filteredVouchers = useMemo(() => {
    let list = vouchers;
    if (activeTab !== 'ALL') {
      list = vouchers.filter(v => v.type === activeTab);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [vouchers, activeTab]);

  const handleOpenForm = (voucher?: Voucher) => {
    if (!userProfile?.companyId) {
      showToast('Please sign in to continue', 'error');
      return;
    }
    if (voucher) {
      setEditingId(voucher.id);
      setFormData({
        ...voucher,
        date: voucher.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingId(null);
      setFormData({ 
        description: '', 
        amount: 0, 
        category: 'Infrastructure', 
        status: 'Pending', 
        projectId: 'GENERAL', 
        date: new Date().toISOString().split('T')[0],
        type: activeTab === 'RECEIPT' ? 'RECEIPT' : 'EXPENSE'
      });
    }
    setShowForm(true);
  };

  const finalizeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.companyId) {
      showToast('Authentication node error', 'error');
      return;
    }

    // Validation
    if (!formData.description || formData.description.trim().length === 0) {
      showToast('Description is required', 'error');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    if (!formData.date) {
      showToast('Date is required', 'error');
      return;
    }

    if (!formData.projectId || formData.projectId.trim().length === 0) {
      showToast('Project reference is required', 'error');
      return;
    }

    setIsSending(true);
    try {
      const voucherData = { 
        ...formData, 
        id: editingId || `VO-${Date.now().toString().slice(-4)}`,
        companyId: userProfile.companyId,
        amount: Math.abs(formData.amount || 0), // Ensure positive amount
        description: formData.description.trim(),
        projectId: formData.projectId.trim(),
        // Ensure type is always set
        type: formData.type || (activeTab === 'RECEIPT' ? 'RECEIPT' : 'EXPENSE')
      } as Voucher;
      
      await saveVoucher(voucherData);
      showToast(editingId ? 'Voucher updated successfully' : `${voucherData.type} created successfully`);
      setShowForm(false);
      setFormData({ 
        description: '', amount: 0, category: 'Infrastructure', status: 'Pending', 
        projectId: 'GENERAL', date: new Date().toISOString().split('T')[0],
        type: activeTab === 'RECEIPT' ? 'RECEIPT' : 'EXPENSE'
      });
      setEditingId(null);
    } catch (err) {
      showToast('Failed to save voucher', 'error');
      console.error('Error saving voucher:', err);
    } finally {
      setIsSending(false);
    }
  };

  const [isSending, setIsSending] = useState(false);

  const handleToggleStatus = async (vo: Voucher) => {
    if (!isOwner) {
       showToast('Only owners can update status', 'info');
       return;
    }
    const nextStatusMap: Record<Voucher['status'], Voucher['status']> = {
      'Pending': 'Paid Back',
      'Paid Back': 'Reimbursed',
      'Reimbursed': 'Pending'
    };
    const nextStatus = nextStatusMap[vo.status] || 'Pending';
    try {
      const updated = { ...vo, status: nextStatus };
      await saveVoucher(updated);
      showToast(`Status updated to ${nextStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-10 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 px-1">
        <div className="space-y-4">
          <Heading sub={`${vouchers.length} total vouchers`}>Expenses & Receipts</Heading>
          <div className="flex items-center gap-6 mt-6">
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-[0.3em] mb-1 opacity-60">Outflow (Total)</span>
                <p className="text-xl font-black text-rose-500 tabular-nums">AED {telemetry.totalExpenses.toLocaleString()}</p>
             </div>
             <div className="w-px h-8 bg-[var(--border-ui)]" />
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-[0.3em] mb-1 opacity-60">Inflow (Receipts)</span>
                <p className="text-xl font-black text-emerald-500 tabular-nums">AED {vouchers.filter(v => v.type === 'RECEIPT').reduce((a,b) => a + (b.amount || 0), 0).toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1.5 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-[1.5rem] shadow-xl">
             {[
               { id: 'ALL', label: 'Registry', icon: List },
               { id: 'EXPENSE', label: 'Expenses', icon: ArrowDownLeft },
               { id: 'RECEIPT', label: 'Receipts', icon: ArrowUpRight },
             ].map(tab => (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
               >
                 <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-[var(--text-secondary)]'} />
                 {tab.label}
               </button>
             ))}
          </div>
          <Button onClick={() => handleOpenForm()} variant="primary" icon={Plus} className="shadow-2xl h-14 px-8 bg-indigo-600 border-indigo-600 !rounded-2xl">
            New Voucher
          </Button>
        </div>
      </div>

      {filteredVouchers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVouchers.map((vo) => {
            const isExpense = vo.type === 'EXPENSE';
            return (
              <Card 
                key={vo.id} 
                className={`p-10 flex flex-col group relative overflow-hidden border-2 transition-all shadow-lg min-h-[360px] rounded-[2.5rem] ${isExpense ? 'hover:border-rose-500/40' : 'hover:border-emerald-500/40'}`}
                hover={false}
                variant="default"
              >
                {/* Background Directional Icon */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.06] transition-opacity text-[var(--text-primary)]">
                  {isExpense ? <ArrowDownLeft size={140} /> : <ArrowUpRight size={140} />}
                </div>

                {/* Card Header: Badges & Logic */}
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center shadow-inner ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isExpense ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                     <div className="flex items-center gap-2">
                        <Badge variant={isExpense ? 'danger' : 'success'} className="!text-[9px] min-w-[60px] text-center">
                          {vo.type || (isExpense ? 'EXPENSE' : 'RECEIPT')}
                        </Badge>
                        <button 
                          onClick={() => handleToggleStatus(vo)}
                          disabled={!isOwner}
                          className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            vo.status === 'Reimbursed' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : vo.status === 'Paid Back'
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                          } ${!isOwner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {vo.status || 'PENDING'}
                        </button>
                     </div>
                  </div>
                </div>
                
                {/* Main Descriptor */}
                <div className="flex-1 relative z-10">
                   <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 ${isExpense ? 'text-rose-500/60' : 'text-emerald-500/60'}`}>Protocol Descriptor</p>
                   <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-[1.1] line-clamp-3 transition-colors">
                     {vo.description}
                   </h3>
                </div>

                {/* Footer Metadata */}
                <div className="mt-10 pt-8 border-t border-[var(--border-ui)] relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                       <Clock size={10} />
                       {new Date(vo.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight truncate max-w-[120px] opacity-80">{vo.projectId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenForm(vo)} className="p-2.5 bg-[var(--bg-card-muted)] hover:bg-[var(--accent)] rounded-xl text-[var(--text-secondary)] hover:text-white transition-all border border-[var(--border-ui)] shadow-sm hover:border-[var(--accent)]"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(vo.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-600 rounded-xl text-rose-500 hover:text-white transition-all border border-rose-500/20 hover:border-rose-600 shadow-sm"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Worth Node */}
                <div className="mt-8 text-right relative z-10">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 opacity-60">{isExpense ? 'Outflow' : 'Inflow'}</p>
                  <p className={`text-4xl font-black tabular-nums tracking-tighter flex items-baseline justify-end gap-1.5 leading-none ${isExpense ? 'text-[var(--text-primary)]' : 'text-emerald-500'}`}>
                    <span className="text-xs opacity-40 font-bold">AED</span>
                    {vo.amount.toLocaleString()}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={Receipt} 
          title="No vouchers yet" 
          description={`You don't have any ${activeTab.toLowerCase()} vouchers yet. Create your first one to get started.`}
          action={<Button onClick={() => handleOpenForm()} icon={Plus} className="h-14 px-10 shadow-2xl !rounded-2xl">Create First Voucher</Button>}
        />
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container !max-w-lg animate-pop-in shadow-2xl border border-[var(--border-ui)] !rounded-[3rem] overflow-hidden bg-[var(--bg-card)]">
            <header className={`p-8 lg:p-10 border-b border-[var(--border-ui)] flex justify-between items-center bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-primary)]`}>
               <div className="flex items-center gap-5">
                  <div className={`p-3.5 rounded-[1.25rem] border shadow-lg ${formData.type === 'RECEIPT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}><Banknote size={26}/></div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest leading-none text-[var(--text-primary)]">{editingId ? 'Edit' : 'Create'} Voucher</h3>
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] mt-2 opacity-60">Expense & Receipt Management</p>
                  </div>
               </div>
               <button onClick={() => setShowForm(false)} className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-2xl transition-all"><X size={28} /></button>
            </header>
            <div className="p-8 lg:p-12 space-y-8 bg-[var(--bg-card)] custom-scroll">
              <form onSubmit={finalizeSave} className="space-y-10">
                <div className="space-y-8">
                   <div className="flex p-1.5 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-[1.5rem] shadow-inner">
                      <button type="button" onClick={() => setFormData({...formData, type: 'EXPENSE'})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'EXPENSE' ? 'bg-rose-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Expense Outflow</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'RECEIPT'})} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'RECEIPT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Receipt Inflow</button>
                   </div>

                   <div className="space-y-3">
                     <Label className="!text-[var(--text-secondary)] !opacity-100 uppercase tracking-[0.4em]">Description</Label>
                     <input 
                       type="text" 
                       className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl px-6 py-5 text-sm font-black uppercase text-[var(--text-primary)] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-[var(--text-secondary)] placeholder:opacity-40 placeholder:normal-case shadow-inner" 
                       value={formData.description} 
                       placeholder="e.g., Cloud Infrastructure Fee" 
                       onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} 
                       required 
                     />
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TemporalPicker label="Activation Date" value={formData.date || ''} onChange={(val) => setFormData({...formData, date: val})} />
                  <div className="space-y-3">
                    <Label className="!text-[var(--text-secondary)] !opacity-100 uppercase tracking-[0.4em]">Project Reference</Label>
                    <input 
                      type="text" 
                      className="w-full h-12 lg:h-14 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl px-6 text-sm font-black uppercase text-[var(--text-primary)] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-[var(--text-secondary)] placeholder:opacity-40 placeholder:normal-case shadow-inner" 
                      value={formData.projectId} 
                      placeholder="General" 
                      onChange={e => setFormData({...formData, projectId: e.target.value.toUpperCase()})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PriceInput label="Worth (AED)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className={`!h-12 lg:!h-14 !rounded-2xl ${formData.type === 'RECEIPT' ? 'focus:!border-emerald-500 focus:!ring-emerald-500/10' : 'focus:!border-rose-500 focus:!ring-rose-500/10'}`} required />
                  <CustomSelect label="Cluster Category" value={formData.category} options={[{ id: 'Infrastructure', label: 'Infrastructure' }, { id: 'Software', label: 'Software' }, { id: 'Strategy', label: 'Strategy' }, { id: 'Legacy', label: 'Legacy Node' }]} onChange={(val: any) => setFormData({...formData, category: val})} icon={Tag} />
                </div>
                
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={isSending} 
                    className={`w-full h-14 lg:h-16 shadow-2xl text-[11px] font-black uppercase tracking-[0.3em] !border-none !rounded-[2rem] ${formData.type === 'RECEIPT' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'}`}
                  >
                    {editingId ? 'Update Voucher' : `Create ${formData.type === 'RECEIPT' ? 'Receipt' : 'Expense'}`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>, document.body
      )}
      
      <ConfirmationModal 
        isOpen={!!confirmDeleteId} 
        title="Delete Voucher" 
        message="This voucher will be permanently deleted. This action cannot be undone. Do you want to continue?" 
        onConfirm={() => { 
          if (confirmDeleteId) {
            deleteVoucher(confirmDeleteId);
            showToast('Voucher deleted successfully');
          }
          setConfirmDeleteId(null); 
        }} 
        onCancel={() => setConfirmDeleteId(null)} 
      />
    </div>
  );
};

export default Expenses;
