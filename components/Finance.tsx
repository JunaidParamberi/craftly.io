import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, X, Trash2, DollarSign, Edit2, ChevronDown, 
  Calculator, UserPlus, FileText, Trash, Zap,
  RefreshCw, CalendarRange, CheckCircle2, ShieldAlert,
  CreditCard, Banknote, Clock, AlertCircle, ArrowUpRight,
  MoreHorizontal,
  Circle,
  ShieldCheck,
  ClipboardCheck,
  Link2,
  Receipt,
  Send
} from 'lucide-react';
import { Invoice, InvoiceItem, Voucher } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { API } from '../services/api';
import ConfirmationModal from './ConfirmationModal.tsx';
import PdfSlideout from './PdfSlideout';
import TemporalPicker from './TemporalPicker.tsx';
import { Badge, Button, Heading, Card, Input, EmptyState, Label, PriceInput, Select } from './ui/Primitives.tsx';

const CustomSelect = ({ label, value, options, onChange, onAction, actionLabel, icon: Icon }: any) => {
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
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] ml-0.5">{label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl flex items-center justify-between text-left hover:border-[var(--accent)] transition-all ${isOpen ? 'border-[var(--accent)] ring-2 ring-indigo-500/10' : ''}`}>
        <div className="flex items-center gap-2 truncate pr-4">
          {Icon && <Icon size={14} className="text-[var(--accent)] shrink-0" />}
          <span className="truncate text-sm font-semibold">{options.find((o: any) => o.id === value)?.label || value || 'Select...'}</span>
        </div>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} text-slate-400`} />
      </button>
      {isOpen && (
        <div className="absolute z-[10001] top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto custom-scroll animate-pop-in">
          {onAction && (
            <button type="button" onClick={() => { onAction(); setIsOpen(false); }}
              className="w-full px-4 py-3 text-left text-xs font-bold text-[var(--accent)] border-b border-[var(--border-ui)] hover:bg-[var(--accent)]/5 flex items-center gap-2">
              <UserPlus size={14} /> {actionLabel || 'Add New'}
            </button>
          )}
          {options.map((opt: any) => (
            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); }}
              className={`w-full px-4 py-3 text-left text-xs font-bold hover:bg-[var(--accent)]/5 transition-all flex items-center justify-between ${value === opt.id ? 'text-[var(--accent)] bg-[var(--accent)]/5' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface FinanceProps { isLpoView?: boolean; }

const Finance: React.FC<FinanceProps> = ({ isLpoView }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    invoices, addInvoice, updateInvoice, deleteInvoice, 
    clients, proposals, userProfile, showToast, convertDocToInvoice
  } = useBusiness();
  
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState<Invoice | null>(null);
  
  // Payment Logging State
  const [paymentLogInvoice, setPaymentLogInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const getInitialForm = (type: Invoice['type'] = isLpoView ? 'LPO' : 'Invoice'): Partial<Invoice> => ({
    clientId: '', clientEmail: '', currency: 'AED', language: 'EN',
    productList: [{ productId: 'GENERIC', name: '', quantity: 1, price: 0 }], 
    taxRate: 0, discountRate: 0, 
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    templateType: 'Swiss_Clean', status: 'Draft',
    type,
    matchStatus: 'NOT_CHECKED',
    isReoccurring: false,
    reoccurrenceFrequency: 'Monthly'
  });

  const [form, setForm] = useState<Partial<Invoice>>(getInitialForm());

  useEffect(() => {
    const projId = searchParams.get('projectId');
    if (projId && !isCreatorOpen) {
      const proj = proposals.find(p => p.id === projId);
      if (proj) {
        const prefilled = getInitialForm('Invoice');
        prefilled.clientId = proj.clientName;
        prefilled.currency = proj.currency;
        prefilled.productList = [{ productId: 'SERVICE', name: `PROJECT: ${proj.title}`, quantity: 1, price: proj.budget }];
        prefilled.linkedProposalId = proj.id;
        setForm(prefilled);
        setIsCreatorOpen(true);
      }
    }
  }, [searchParams, proposals, isCreatorOpen]);

  useEffect(() => {
    if (id) {
      const target = invoices.find(inv => inv.id === id);
      if (target) setActiveInvoiceForPreview(target);
    }
  }, [id, invoices]);

  const openCreator = (type: Invoice['type'] = isLpoView ? 'LPO' : 'Invoice', editId: string | null = null) => {
    setEditingInvoiceId(editId);
    if (editId) {
      const existing = invoices.find(i => i.id === editId);
      if (existing) { setForm(JSON.parse(JSON.stringify(existing))); }
    } else {
      setForm(getInitialForm(type));
    }
    setIsCreatorOpen(true);
  };

  const handleUpdateStatus = async (inv: Invoice, newStatus: Invoice['status']) => {
    const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
    if (!isOwner && newStatus === 'Paid') {
      showToast('Status change requires authority clearance', 'info');
      await updateInvoice({ ...inv, status: 'Pending Approval' });
    } else {
      await updateInvoice({ ...inv, status: newStatus });
      showToast(`Registry node updated to ${newStatus}`);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentLogInvoice || !userProfile) return;
    const isOwner = userProfile.role === 'OWNER' || userProfile.role === 'SUPER_ADMIN';
    
    try {
      const newStatus = paymentAmount >= paymentLogInvoice.amountPaid ? 'Paid' : 'Partial';
      const updatedInvoice = { 
        ...paymentLogInvoice, 
        status: isOwner ? (newStatus as any) : 'Pending Approval'
      };
      
      await updateInvoice(updatedInvoice);

      if (isOwner) {
        const receiptVoucher: Voucher = {
          id: `REC-${Date.now().toString().slice(-4)}`,
          companyId: userProfile.companyId,
          projectId: paymentLogInvoice.id,
          description: `SETTLEMENT: ${paymentLogInvoice.clientId} #${paymentLogInvoice.id}`,
          amount: paymentAmount,
          category: 'Strategy',
          date: new Date().toISOString().split('T')[0],
          status: 'Reimbursed'
        };
        await API.saveItem('vouchers', receiptVoucher);
      }
      
      showToast(isOwner ? 'Payment node & Receipt synchronized' : 'Payment submitted for approval');
      setPaymentLogInvoice(null);
    } catch (e) {
      showToast('Payment sync failed', 'error');
    }
  };

  const calculateSubtotal = () => (form.productList || []).reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);

  const handleSave = () => {
    const total = calculateSubtotal();
    const updatedForm = { ...form, amountPaid: total, amountAED: form.currency === 'AED' ? total : total * 3.67, taxRate: 0 };
    if (editingInvoiceId) {
      updateInvoice({ ...updatedForm, id: editingInvoiceId } as Invoice);
      setIsCreatorOpen(false);
    } else {
      addInvoice(updatedForm);
      setIsCreatorOpen(false);
    }
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      productList: [...(prev.productList || []), { productId: 'GENERIC', name: '', quantity: 1, price: 0 }]
    }));
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    setForm(prev => {
      const newList = [...(prev.productList || [])];
      newList[index] = { ...newList[index], ...updates };
      return { ...prev, productList: newList };
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      productList: (prev.productList || []).filter((_, i) => i !== index)
    }));
  };

  const handleLpoToInvoice = (inv: Invoice) => {
    convertDocToInvoice(inv);
    navigate('/invoices');
  };

  const filteredInvoices = invoices.filter(inv => isLpoView ? inv.type === 'LPO' : inv.type === 'Invoice');
  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  // Aesthetic mapping based on view type
  const accentColor = isLpoView ? 'amber' : 'indigo';

  return (
    <div className="space-y-10 animate-enter pb-24 max-w-[1400px] mx-auto px-4 lg:px-0">
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 p-8 lg:p-12 bg-[#0B1120] border border-white/5 rounded-[3rem] relative overflow-hidden shadow-2xl transition-all duration-500`}>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          {isLpoView ? <ClipboardCheck size={280} /> : <Banknote size={240} />}
        </div>
        
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-5">
             <div className={`w-14 h-14 bg-${accentColor}-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-[0_0_40px_rgba(${isLpoView ? '217,119,6,0.3' : '79,70,229,0.3'})] border border-white/10 transition-all duration-500`}>
               {isLpoView ? <Receipt size={28} /> : <CreditCard size={28} />}
             </div>
             <div>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none text-white">
                  {isLpoView ? 'LPO Registry' : 'Fiscal Core'}
                </h2>
                <p className={`text-[11px] text-${accentColor}-400 font-black uppercase tracking-[0.5em] mt-3 opacity-80 transition-all duration-500`}>
                  {isLpoView ? 'Strategic Procurement Hub' : 'Fiscal Node Administration'}
                </p>
             </div>
           </div>
        </div>

        <Button 
          onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} 
          variant="primary" 
          icon={Plus}
          className={`px-10 h-16 shadow-2xl relative z-10 text-[11px] uppercase font-black tracking-widest bg-${accentColor}-600 border-${accentColor}-600 hover:bg-${accentColor}-500 transition-all active:scale-95`}
        >
          {isLpoView ? 'Initialize P.O' : 'Initialize Invoice'}
        </Button>
      </header>

      <Card padding="p-0" className="overflow-hidden hidden md:block border border-white/5 bg-[#0B1120] rounded-[2.5rem] shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
        
        <div className="w-full overflow-x-auto custom-scroll relative z-10">
          <table className="w-full text-left border-collapse table-auto min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900/60 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                <th className="px-6 py-7 w-[160px]">Node ID</th>
                <th className="px-6 py-7">Partner Designation</th>
                <th className="px-6 py-7 text-center w-[120px]">Protocol</th>
                {isLpoView && <th className="px-6 py-7 text-center">Origin Mission</th>}
                <th className="px-6 py-7 text-center w-[160px]">Registry Status</th>
                <th className="px-6 py-7 text-right w-[160px]">Strategic Worth</th>
                <th className="px-6 py-7 text-right w-[180px]">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const isOverdue = inv.status !== 'Paid' && inv.status !== 'Pending Approval' && new Date(inv.dueDate) < new Date();
                  const linkedProp = proposals.find(p => p.id === inv.linkedProposalId);
                  // Clearance check for employees: 'Pending Approval' means not sendable.
                  const isApproved = inv.status !== 'Pending Approval';
                  const isSendable = isApproved && (inv.status === 'Draft' || inv.status === 'Sent');
                  
                  return (
                    <tr 
                      key={inv.id} 
                      className="group hover:bg-white/[0.01] cursor-pointer transition-all" 
                      onClick={() => setActiveInvoiceForPreview(inv)}
                    >
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[1rem] bg-slate-950 border border-white/5 flex items-center justify-center text-${accentColor}-400 shrink-0 shadow-xl group-hover:border-${accentColor}-500/30 transition-all ${inv.status === 'Paid' ? '!text-emerald-500 !border-emerald-500/20' : ''}`}>
                             {isLpoView ? <ClipboardCheck size={20} /> : <FileText size={20} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none mb-1">
                              {inv.id}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-40">
                               <Clock size={10} className="text-slate-500" />
                               <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">{inv.date}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="min-w-0">
                          <span className="font-black text-[14px] block uppercase truncate max-w-[180px] text-white leading-tight mb-1.5">
                            {inv.clientId}
                          </span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest truncate block">
                            Partner Identifier
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <Badge variant="info" className={`!px-3 !py-1 !rounded-lg !text-[8px] font-black uppercase border-none bg-white/[0.03] shadow-sm tracking-widest ${isLpoView ? '!text-amber-500' : '!text-indigo-400'}`}>
                          {inv.type}
                        </Badge>
                      </td>
                      {isLpoView && (
                        <td className="px-6 py-8 text-center">
                          {linkedProp ? (
                            <div className="flex flex-col items-center">
                               <div className="flex items-center gap-2 text-indigo-400 group/link" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${linkedProp.id}`); }}>
                                  <Link2 size={12} className="opacity-40" />
                                  <span className="text-[10px] font-black uppercase tracking-tight hover:underline cursor-pointer truncate max-w-[120px]">{linkedProp.title}</span>
                               </div>
                               <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Registry Ref</p>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">NO LINK</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-950 transition-all ${inv.status === 'Paid' ? 'border-emerald-500/30 text-emerald-500' : inv.status === 'Pending Approval' ? 'border-amber-500/30 text-amber-500' : isOverdue ? 'border-rose-500/30 text-rose-500' : 'border-white/5 text-slate-400'}`}>
                            <Circle size={6} fill="currentColor" className={inv.status === 'Pending Approval' ? 'animate-pulse' : ''} />
                            <select 
                              value={inv.status} 
                              onChange={(e) => handleUpdateStatus(inv, e.target.value as any)}
                              disabled={!isOwner && inv.status === 'Paid'}
                              className="text-[9px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer text-center outline-none"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Paid">Settled</option>
                              <option value="Partial">Partial</option>
                              <option value="Overdue">Overdue</option>
                              <option value="Pending Approval">Pending Auth</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-right">
                         <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                               <span className={`text-[9px] font-black text-${accentColor}-500/40 uppercase transition-all duration-500`}>{inv.currency}</span>
                               <span className="text-[16px] font-black tabular-nums text-white tracking-tighter">
                                 {inv.amountPaid.toLocaleString()}
                               </span>
                            </div>
                            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-1">AED {(inv.amountAED || 0).toLocaleString()}</p>
                         </div>
                      </td>
                      <td className="px-6 py-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                          {isSendable && (
                            <button 
                              onClick={() => setActiveInvoiceForPreview(inv)}
                              className="w-10 h-10 flex items-center justify-center bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"
                              title="Dispatch Protocol"
                            >
                               <Zap size={16}/>
                            </button>
                          )}
                          {isLpoView && (inv.status === 'Sent' || inv.status === 'Paid') && (
                            <button 
                              onClick={() => handleLpoToInvoice(inv)}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"
                              title="Synthesize Invoice"
                            >
                               <RefreshCw size={16}/>
                            </button>
                          )}
                          {!isLpoView && inv.status !== 'Paid' && inv.status !== 'Pending Approval' && (
                            <button 
                              onClick={() => { setPaymentLogInvoice(inv); setPaymentAmount(inv.amountPaid); }} 
                              className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90" 
                              title="Record Settlement"
                            >
                               <Banknote size={16}/>
                            </button>
                          )}
                          <button 
                            onClick={() => openCreator(inv.type, inv.id)}
                            className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"
                            title="Modify Node"
                          >
                             <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(inv.id)}
                            className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/5 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"
                            title="Purge Node"
                          >
                             <Trash2 size={16}/>
                          </button>
                        </div>
                        <div className="group-hover:hidden flex justify-end text-slate-700">
                           <MoreHorizontal size={18} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isLpoView ? 7 : 6} className="px-6 py-32 text-center">
                    <EmptyState 
                      icon={isLpoView ? ClipboardCheck : Banknote} 
                      title={`${isLpoView ? 'LPO' : 'Fiscal'} Node Vacuum Detected`} 
                      description={`No fiscal nodes identified in the registry ledger. Initialize a ${isLpoView ? 'purchase order' : 'invoice'} to begin tracking missions.`} 
                      action={
                        <Button 
                          onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} 
                          variant="outline" 
                          className={`h-12 border-${accentColor}-500/30 text-${accentColor}-400 mt-6`}
                        >
                          Initialize First Node
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="p-8 bg-slate-900/30 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   Node Count: {filteredInvoices.length}
                 </span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   Subtotal: {filteredInvoices.reduce((a, b) => a + b.amountPaid, 0).toLocaleString()} AED
                 </span>
              </div>
           </div>
           <div className={`flex items-center gap-3 text-${accentColor}-500/40 transition-all duration-500`}>
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Encrypted Fiscal Registry</span>
           </div>
        </footer>
      </Card>

      {/* Mobile view remains card-based for UX */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredInvoices.map((inv) => {
          const isOverdue = inv.status !== 'Paid' && inv.status !== 'Pending Approval' && new Date(inv.dueDate) < new Date();
          const isApproved = inv.status !== 'Pending Approval';
          const isSendable = isApproved && (inv.status === 'Draft' || inv.status === 'Sent');
          
          return (
            <Card key={inv.id} className="p-7 bg-[#0B1120] border-white/5 rounded-[2.5rem] shadow-xl relative overflow-hidden" onClick={() => setActiveInvoiceForPreview(inv)}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${accentColor}-500/[0.02] to-transparent pointer-events-none transition-all duration-500`} />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[1.25rem] bg-${accentColor}-500/10 text-${accentColor}-500 flex items-center justify-center border border-${accentColor}-500/20 shadow-lg transition-all duration-500`}>
                    {isLpoView ? <ClipboardCheck size={22} /> : <FileText size={22} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{inv.id}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{inv.type} Mission</p>
                  </div>
                </div>
                <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Pending Approval' ? 'warning' : isOverdue ? 'danger' : 'default'} className="!text-[8px] font-black !px-3 !py-1">
                  {inv.status.toUpperCase()}
                </Badge>
              </div>
              <h4 className="text-xl font-black uppercase text-white truncate mb-8 relative z-10 leading-tight">{inv.clientId}</h4>
              <div className="pt-8 border-t border-white/[0.05] flex items-end justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Strategic Worth</p>
                  <p className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                    <span className="text-[11px] mr-1.5 opacity-30 font-black">{inv.currency}</span>
                    {inv.amountPaid.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2.5" onClick={e => e.stopPropagation()}>
                  {isSendable && (
                    <button onClick={() => setActiveInvoiceForPreview(inv)} className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-95 border border-indigo-500/30">
                       <Send size={20}/>
                    </button>
                  )}
                  {isLpoView && (inv.status === 'Sent' || inv.status === 'Paid') && (
                    <button onClick={() => handleLpoToInvoice(inv)} className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-xl active:scale-95 border border-emerald-500/30">
                       <RefreshCw size={20}/>
                    </button>
                  )}
                  {!isLpoView && inv.status !== 'Paid' && inv.status !== 'Pending Approval' && (
                    <button onClick={() => { setPaymentLogInvoice(inv); setPaymentAmount(inv.amountPaid); }} className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-xl active:scale-95 border border-emerald-500/30">
                       <Banknote size={20}/>
                    </button>
                  )}
                  <button onClick={() => openCreator(inv.type, inv.id)} className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-white/10 text-slate-400 rounded-2xl shadow-xl active:scale-95">
                     <Edit2 size={20}/>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <PdfSlideout invoice={activeInvoiceForPreview} onClose={() => { setActiveInvoiceForPreview(null); if (id) navigate(isLpoView ? '/lpo' : '/invoices'); }} />
      
      <ConfirmationModal 
        isOpen={!!confirmDeleteId} 
        title="Purge Node" 
        message="This fiscal document will be permanently decommissioned from the ledger. This action is irreversible." 
        onConfirm={() => { if (confirmDeleteId) deleteInvoice(confirmDeleteId); setConfirmDeleteId(null); }} 
        onCancel={() => setConfirmDeleteId(null)} 
      />

      {isCreatorOpen && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container !max-w-5xl animate-pop-in border-none shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <header className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-[#0B1120]">
               <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 bg-${accentColor}-600/10 text-${accentColor}-400 rounded-2xl border border-${accentColor}-500/20 flex items-center justify-center shadow-lg transition-all duration-500`}>
                    {isLpoView ? <ClipboardCheck size={28}/> : <FileText size={28}/>}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      {editingInvoiceId ? 'Sync Node' : `Initialize ${form.type}`}
                    </h3>
                    <p className={`text-[10px] font-black text-${accentColor}-500 uppercase tracking-[0.4em] mt-2 transition-all duration-500`}>
                      Fiscal Document Configurator
                    </p>
                  </div>
               </div>
               <button onClick={() => setIsCreatorOpen(false)} className="p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                 <X size={28} />
               </button>
            </header>

            <div className="p-10 lg:p-14 bg-[#0B1120] custom-scroll max-h-[85vh] overflow-y-auto">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CustomSelect 
                          label="Partner Node" 
                          value={form.clientId} 
                          options={clients.map(c => ({ id: c.name, label: c.name }))} 
                          onChange={(val: any) => setForm({...form, clientId: val})} 
                          icon={UserPlus}
                        />
                        <Input 
                          label="Target Registry Email" 
                          value={form.clientEmail} 
                          onChange={e => setForm({...form, clientEmail: e.target.value})} 
                          placeholder="IDENT@REGION.NET"
                          className="font-black !h-11 uppercase"
                        />
                     </div>

                     <div className="space-y-6">
                        <Label className="uppercase tracking-[0.3em] !text-slate-500 mb-4 block">Deployment Modules</Label>
                        <div className="space-y-4">
                           {(form.productList || []).map((item, i) => (
                             <div key={i} className="flex gap-4 items-end animate-enter">
                                <div className="flex-1">
                                   <Input 
                                    label={i === 0 ? "Module Designation" : undefined}
                                    value={item.name} 
                                    onChange={e => handleUpdateItem(i, { name: e.target.value.toUpperCase() })} 
                                    placeholder="E.G. SR. CONSULTANCY" 
                                    className="font-black uppercase"
                                   />
                                </div>
                                <div className="w-24">
                                   <Input 
                                    label={i === 0 ? "Volume" : undefined}
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={e => handleUpdateItem(i, { quantity: parseInt(e.target.value) || 1 })} 
                                    className="font-black text-center"
                                   />
                                </div>
                                <div className="w-40">
                                   <PriceInput 
                                    label={i === 0 ? "Unit Worth" : undefined}
                                    value={item.price} 
                                    onChange={e => handleUpdateItem(i, { price: parseFloat(e.target.value) || 0 })} 
                                    className="font-black"
                                   />
                                </div>
                                <button 
                                  onClick={() => handleRemoveItem(i)}
                                  className="w-11 h-11 mb-0.5 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  <Trash2 size={16}/>
                                </button>
                             </div>
                           ))}
                           <button 
                            onClick={handleAddItem}
                            className={`w-full py-4 border-2 border-dashed border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-${accentColor}-500/30 hover:text-${accentColor}-400 transition-all flex items-center justify-center gap-3`}
                           >
                             <Plus size={16}/> Register Additional Module
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-4 space-y-10">
                     <Card variant="muted" className="!p-8 !rounded-[2rem] bg-slate-950/40 border-white/5 space-y-8">
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Ledger Summary</p>
                           <div className="flex items-baseline justify-between">
                              <span className={`text-xl font-black text-${accentColor}-500 uppercase transition-all duration-500`}>{form.currency}</span>
                              <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{calculateSubtotal().toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white/5">
                           <TemporalPicker label="Activation Date" value={form.date || ''} onChange={val => setForm({...form, date: val})} />
                           <TemporalPicker label="Settlement Target" value={form.dueDate || ''} onChange={val => setForm({...form, dueDate: val})} />
                           <Select label="Ledger Currency" value={form.currency} onChange={e => setForm({...form, currency: e.target.value as any})}>
                             <option value="AED">AED - Dirham</option>
                             <option value="USD">USD - Dollar</option>
                             <option value="EUR">EUR - Euro</option>
                           </Select>
                        </div>
                     </Card>

                     <Button 
                      onClick={handleSave}
                      className={`w-full h-18 bg-${accentColor}-600 border-${accentColor}-600 text-white font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl active:scale-95 transition-all duration-500`}
                      disabled={!form.clientId || (form.productList || []).length === 0}
                     >
                       {editingInvoiceId ? 'Commit Changes' : `Finalize ${form.type}`}
                     </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {paymentLogInvoice && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-md animate-pop-in border-none shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <header className="p-8 border-b border-white/5 bg-[#0B1120] flex items-center gap-5">
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                 <Banknote size={24}/>
               </div>
               <div>
                  <h3 className="text-lg font-black uppercase text-white">Record Settlement</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{paymentLogInvoice.id}</p>
               </div>
            </header>
            <div className="p-10 space-y-8 bg-[#0B1120]">
               <PriceInput 
                label="Received Value (AED)" 
                value={paymentAmount} 
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                className="!h-16 font-black text-2xl !bg-slate-950 !border-white/5"
               />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed text-center px-4">
                 Synchronizing this settlement will update the fiscal node and generate an automated receipt in the voucher registry.
               </p>
               <div className="flex gap-4">
                  <Button variant="ghost" className="flex-1 h-14" onClick={() => setPaymentLogInvoice(null)}>Abort</Button>
                  <Button variant="success" className="flex-[2] h-14 font-black uppercase tracking-widest text-[10px]" onClick={handleRecordPayment}>Confirm Settlement</Button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Finance;