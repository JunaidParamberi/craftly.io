
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, X, Trash2, DollarSign, Edit2, ChevronDown, 
  Calculator, UserPlus,
  ShieldCheck, 
  Sparkles,  FileText, 
 Trash,  Zap
} from 'lucide-react';
import { Invoice, InvoiceItem } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';

import ConfirmationModal from './ConfirmationModal.tsx';
import PdfSlideout from './PdfSlideout.tsx';
import TemporalPicker from './TemporalPicker.tsx';
import { Badge, Button, Heading, Card, Input,  EmptyState, Label, PriceInput } from './ui/Primitives.tsx';

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
  const navigate = useNavigate();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, clients, convertDocToInvoice } = useBusiness();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorStep, setCreatorStep] = useState<'form' | 'success'>('form');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState<Invoice | null>(null);
  
  const [pendingDocsForClient, setPendingDocsForClient] = useState<Invoice[]>([]);

  const getInitialForm = (type: Invoice['type'] = isLpoView ? 'LPO' : 'Invoice'): Partial<Invoice> => ({
    clientId: '', clientEmail: '', currency: 'AED', language: 'EN',
    productList: [{ productId: 'GENERIC', name: '', quantity: 1, price: 0 }], 
    taxRate: 0, discountRate: 0, 
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    templateType: 'Swiss_Clean', status: 'Draft',
    type,
    matchStatus: 'NOT_CHECKED'
  });

  const [form, setForm] = useState<Partial<Invoice>>(getInitialForm());
  const [dueDateOption, setDueDateOption] = useState<'sending' | '7days' | '14days' | '31days' | 'custom'>('sending');

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
      if (existing) {
        setForm(JSON.parse(JSON.stringify(existing)));
        setDueDateOption('custom');
      }
    } else {
      setForm(getInitialForm(type));
      setDueDateOption('sending');
    }
    setCreatorStep('form');
    setIsCreatorOpen(true);
  };

  useEffect(() => {
    if (dueDateOption !== 'custom') {
      const baseDate = new Date(form.date || new Date());
      const offsetDays = { sending: 0, '7days': 7, '14days': 14, '31days': 31 };
      const daysToAdd = offsetDays[dueDateOption as keyof typeof offsetDays] || 0;
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      setForm(prev => ({ ...prev, dueDate: baseDate.toISOString().split('T')[0] }));
    }
  }, [dueDateOption, form.date]);

  useEffect(() => {
    if (form.clientId && form.type === 'Invoice' && !editingInvoiceId) {
      const matches = invoices.filter(i => 
        i.clientId === form.clientId && 
        (i.type === 'LPO') && 
        i.status !== 'Paid' 
      );
      setPendingDocsForClient(matches);
    } else {
      setPendingDocsForClient([]);
    }
  }, [form.clientId, form.type, invoices, editingInvoiceId]);

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      productList: [...(prev.productList || []), { productId: 'GENERIC', name: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      productList: (prev.productList || []).filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    setForm(prev => {
      const newList = [...(prev.productList || [])];
      newList[index] = { ...newList[index], ...updates };
      return { ...prev, productList: newList };
    });
  };

  const calculateSubtotal = () => {
    return (form.productList || []).reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const handleSave = () => {
    const subtotal = calculateSubtotal();
    const total = subtotal; 
    
    const updatedForm = {
      ...form,
      amountPaid: total,
      amountAED: form.currency === 'AED' ? total : total * 3.67,
      taxRate: 0
    };

    if (editingInvoiceId) {
      updateInvoice({ ...updatedForm, id: editingInvoiceId } as Invoice);
      setIsCreatorOpen(false);
    } else {
      addInvoice(updatedForm);
      setCreatorStep('success');
    }
  };

  const importFromDoc = (doc: Invoice) => {
    setForm(prev => ({
      ...prev,
      currency: doc.currency,
      productList: JSON.parse(JSON.stringify(doc.productList)),
      sourceDocId: doc.id
    }));
    setPendingDocsForClient([]);
  };

  // Separation Logic: Quotes are managed as Proposals/Projects. 
  // Finance strictly handles Invoices and LPOs.
  const filteredInvoices = invoices.filter(inv => isLpoView ? inv.type === 'LPO' : inv.type === 'Invoice');

  return (
    <div className="space-y-6 animate-enter pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Heading sub={isLpoView ? 'Procurement Node' : 'Financial Node'}>{isLpoView ? 'LPO Registry' : 'Invoice Ledger'}</Heading>
        <div className="flex gap-2">
          <Button onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} variant="primary" icon={Plus}>{isLpoView ? 'New P.O' : 'Issue Invoice'}</Button>
        </div>
      </header>
      
      {filteredInvoices.length > 0 ? (
        <div className="space-y-4">
          <Card padding="p-0" className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--bg-canvas)]/50 text-[10px] font-bold uppercase border-b border-[var(--border-ui)]">
                    <th className="px-6 py-4 opacity-50">Node ID</th>
                    <th className="px-6 py-4 opacity-50">Partner</th>
                    <th className="px-6 py-4 text-center opacity-50">Type</th>
                    <th className="px-6 py-4 text-center opacity-50">Status</th>
                    <th className="px-6 py-4 text-right opacity-50">Value</th>
                    <th className="px-6 py-4 text-right opacity-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-ui)]">
                  {filteredInvoices.map((inv) => {
                    const isOverdue = inv.status !== 'Paid' && new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer transition-colors" onClick={() => setActiveInvoiceForPreview(inv)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-[var(--accent)]" />
                            <span className="font-bold text-xs">{inv.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-sm block">{inv.clientId}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{inv.date}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge variant="info">{inv.type}</Badge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge 
                            variant={inv.status === 'Paid' ? 'success' : isOverdue ? 'danger' : 'warning'}
                          >
                            {inv.status === 'Paid' ? 'Settled' : isOverdue ? 'Overdue' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right font-extrabold tabular-nums">
                          {inv.currency} {inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                            {inv.type === 'LPO' && inv.status !== 'Paid' && (
                              <Button variant="ghost" size="sm" onClick={() => convertDocToInvoice(inv)} icon={Zap} className="text-amber-500" title="Bill LPO" />
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openCreator(inv.type, inv.id)} icon={Edit2} />
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(inv.id)} className="text-rose-500 hover:bg-rose-500/10" icon={Trash2} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredInvoices.map((inv) => {
              const isOverdue = inv.status !== 'Paid' && new Date(inv.dueDate) < new Date();
              return (
                <Card key={inv.id} className="p-5 active:scale-[0.98] transition-transform" onClick={() => setActiveInvoiceForPreview(inv)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{inv.id}</p>
                        <p className="text-[8px] font-black uppercase text-indigo-400 opacity-60">{inv.type}</p>
                      </div>
                    </div>
                    <Badge variant={inv.status === 'Paid' ? 'success' : isOverdue ? 'danger' : 'warning'}>
                      {inv.status === 'Paid' ? 'Settled' : isOverdue ? 'Overdue' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="mb-5">
                    <h4 className="text-base font-black uppercase text-[var(--text-primary)] tracking-tight leading-none">{inv.clientId}</h4>
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-[var(--border-ui)]/50">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-50">Value</p>
                      <p className="text-xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter">
                        <span className="text-xs mr-1 opacity-40">{inv.currency}</span>
                        {inv.amountPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                       {inv.type === 'LPO' && inv.status !== 'Paid' && (
                         <Button variant="ghost" size="sm" onClick={() => convertDocToInvoice(inv)} icon={Zap} className="!w-10 !h-10 text-amber-500" />
                       )}
                       <Button variant="ghost" size="sm" onClick={() => openCreator(inv.type, inv.id)} icon={Edit2} className="!w-10 !h-10 rounded-xl" />
                       <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(inv.id)} className="!w-10 !h-10 rounded-xl text-rose-500" icon={Trash2} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={Calculator} 
          title="The ledger is clear" 
          description="Build professional momentum by issuing your first invoice or registering a Purchase Order. Accepted projects from the registry will appear here for billing." 
          action={<Button variant="primary" onClick={() => openCreator()}>Create First Document</Button>}
        />
      )}

      {isCreatorOpen && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container !max-w-4xl animate-pop-in">
            {creatorStep === 'form' ? (
              <>
                <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between">
                  <Heading sub={`${form.type} node initialization`}>Create {form.type}</Heading>
                  <button type="button" onClick={() => setIsCreatorOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all cursor-pointer">
                    <X size={20} />
                  </button>
                </header>

                <div className="p-8 space-y-8 custom-scroll max-h-[80vh] overflow-y-auto">
                  {pendingDocsForClient.length > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-enter">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Link Source Node</p>
                          <p className="text-xs font-bold text-[var(--text-primary)]">Found unbilled orders for this partner.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {pendingDocsForClient.map(doc => (
                          <button 
                            key={doc.id}
                            onClick={() => importFromDoc(doc)}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2"
                          >
                            <Zap size={10} /> {doc.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CustomSelect label="Partner (Client)" value={form.clientId} options={clients.map(c => ({ id: c.name, label: c.name }))} onChange={(val: string) => { const c = clients.find(cl => cl.name === val); setForm({...form, clientId: val, clientEmail: c?.email || ''}); }} />
                    <CustomSelect label="Modality (Currency)" value={form.currency} options={[{id: 'AED', label: 'AED'}, {id: 'USD', label: 'USD'}, {id: 'EUR', label: 'EUR'}]} icon={DollarSign} onChange={(val: any) => setForm({...form, currency: val})} />
                    <TemporalPicker label="Document Date" value={form.date || ''} onChange={(v) => setForm({...form, date: v})} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <Label className="!opacity-100 uppercase tracking-[0.3em] text-[10px]">Registry Items</Label>
                       <Button variant="ghost" size="sm" onClick={handleAddItem} icon={Plus} className="text-[var(--accent)] font-black uppercase tracking-widest h-8 px-3">Add Row</Button>
                    </div>
                    <div className="space-y-3">
                      {(form.productList || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-[var(--bg-canvas)]/30 p-3 rounded-2xl border border-[var(--border-ui)]">
                           <div className="col-span-12 md:col-span-6">
                              <Input 
                                label="Designation" 
                                placeholder="E.G. TECHNICAL CONSULTANCY" 
                                value={item.name} 
                                onChange={e => handleUpdateItem(idx, { name: e.target.value.toUpperCase() })} 
                              />
                           </div>
                           <div className="col-span-4 md:col-span-2">
                              <Input 
                                label="Volume" 
                                type="number"
                                value={item.quantity} 
                                onChange={e => handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })} 
                              />
                           </div>
                           <div className="col-span-6 md:col-span-3">
                              <PriceInput 
                                label="Worth" 
                                currency={form.currency} 
                                value={item.price} 
                                onChange={e => handleUpdateItem(idx, { price: parseFloat(e.target.value) || 0 })} 
                              />
                           </div>
                           <div className="col-span-2 md:col-span-1 flex items-center justify-center pb-2">
                              <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                                <Trash size={16} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-ui)]">
                    <div className="p-6 bg-[var(--bg-canvas)] rounded-2xl space-y-4 mb-6">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span className="uppercase tracking-widest opacity-60">Settlement Worth</span>
                        <span className="text-[var(--accent)] text-2xl font-black tabular-nums tracking-tighter">
                          {form.currency} {calculateSubtotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button onClick={handleSave} disabled={!form.clientId || (form.productList?.length || 0) === 0} className="w-full h-14">
                      {editingInvoiceId ? 'Finalize Changes' : `Initialize ${form.type}`}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-16 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl"><ShieldCheck size={32} /></div>
                <h3 className="text-2xl font-bold tracking-tight uppercase">Registry Updated</h3>
                <Button onClick={() => setIsCreatorOpen(false)} variant="primary" className="px-10">Back to Ledger</Button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <PdfSlideout invoice={activeInvoiceForPreview} onClose={() => { setActiveInvoiceForPreview(null); navigate(isLpoView ? '/lpo' : '/invoices'); }} />
      <ConfirmationModal isOpen={!!confirmDeleteId} title="Decommission Node" message="Remove this document node from the ledger permanently?" onConfirm={() => { deleteInvoice(confirmDeleteId!); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default Finance;
