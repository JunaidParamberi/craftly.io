
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, X, Trash2, Edit2, ChevronDown, 
  UserPlus, FileText, Zap,
  RefreshCw,
  CreditCard, Banknote, Clock,
  MoreHorizontal,
  Circle,
  ShieldCheck,
  ClipboardCheck,
  Link2,
  Receipt,
  Send,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { Invoice, InvoiceItem, Voucher } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { API } from '../services/api';
import ConfirmationModal from './ConfirmationModal.tsx';
import PdfSlideout from './PdfSlideout';
import TemporalPicker from './TemporalPicker.tsx';
import { Badge, Button, Card, Input, EmptyState, Label, PriceInput, Select } from './ui/Primitives.tsx';

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
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} text-[var(--text-secondary)]`} />
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

// Status Select Component for Table Rows
const StatusSelect: React.FC<{ 
  value: Invoice['status']; 
  onChange: (value: Invoice['status']) => void; 
  disabled?: boolean;
  isOverdue?: boolean;
  allowPaid?: boolean;
}> = ({ value, onChange, disabled = false, isOverdue = false, allowPaid = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Check if clicking inside the button or container
      if (buttonRef.current?.contains(target)) return;
      if (containerRef.current?.contains(target)) return;
      
      // Check if clicking inside the dropdown portal (by checking if it's a button inside our dropdown)
      const dropdownElement = document.querySelector('[data-status-dropdown]') as HTMLElement;
      if (dropdownElement?.contains(target)) {
        // Check if clicking on an option button
        const optionButton = target.closest('button[data-status-option]');
        if (optionButton) {
          // Let the button's onClick handle it, but don't close immediately
          return;
        }
      }
      
      // Close if clicking outside
      setIsOpen(false);
    };
    
    // Use a small delay to ensure portal is rendered
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick, true);
    }, 10);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const minSpace = 150; // Minimum space needed for dropdown
        
        // Position upward if not enough space below, but enough space above
        if (spaceBelow < minSpace && spaceAbove > spaceBelow) {
          setPosition('top');
        } else {
          setPosition('bottom');
        }
      };
      
      updatePosition();
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const getStatusColor = (status: Invoice['status']) => {
    if (status === 'Paid') return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5';
    if (status === 'Pending Approval') return 'border-amber-500/30 text-amber-500 bg-amber-500/5';
    if (status === 'Overdue' || isOverdue) return 'border-rose-500/30 text-rose-500 bg-rose-500/5';
    return 'border-[var(--border-ui)] text-[var(--text-secondary)] bg-[var(--bg-card-muted)]';
  };

  const allStatusOptions: Array<{ value: Invoice['status']; label: string }> = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Pending Approval', label: 'Pending Approval' },
  ];

  // Filter out "Paid" option if not allowed (for non-owners)
  const statusOptions = allowPaid 
    ? allStatusOptions 
    : allStatusOptions.filter(opt => opt.value !== 'Paid');

  const selectedLabel = statusOptions.find(opt => opt.value === value)?.label || value;

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0, width: 160 };
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 280; // Approximate height
    const spacing = 8;
    
    return {
      top: position === 'top' ? rect.top - dropdownHeight - spacing : rect.bottom + spacing,
      left: rect.left,
      width: Math.max(rect.width, 160),
    };
  };

  const dropdownPosition = isOpen && buttonRef.current ? getDropdownPosition() : { top: 0, left: 0, width: 160 };

  return (
    <>
      <div className="relative" ref={containerRef} onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(!isOpen);
            }
          }}
          disabled={disabled}
          className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 rounded-xl border transition-all min-w-[120px] lg:min-w-[140px] justify-center ${getStatusColor(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'} ${isOpen ? 'ring-2 ring-[var(--accent)]/20' : ''}`}
        >
          <Circle size={5} className={`lg:w-[6px] lg:h-[6px] fill-current ${value === 'Pending Approval' ? 'animate-pulse' : ''}`} />
          <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-wider truncate">{selectedLabel}</span>
          <ChevronDown size={11} className={`lg:w-3 lg:h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-60`} />
        </button>
      </div>
      {isOpen && !disabled && buttonRef.current && createPortal(
        <div
          ref={dropdownRef}
          data-status-dropdown
          className="fixed z-[10003] bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-pop-in"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              data-status-option
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all flex items-center gap-2 cursor-pointer ${
                value === opt.value 
                  ? 'text-[var(--accent)] bg-[var(--accent)]/5' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Circle size={6} fill="currentColor" className="opacity-60" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
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
  
  // Table filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Multiple selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<Invoice['status'] | null>(null);

  const getInitialForm = (type: Invoice['type'] = isLpoView ? 'LPO' : 'Invoice'): Partial<Invoice> => ({
    clientId: '', clientEmail: '', currency: 'AED', language: 'EN',
    productList: [{ productId: 'GENERIC', name: '', quantity: 1, price: 0 }], 
    taxRate: 0, discountRate: 0, 
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    templateType: userProfile?.branding?.defaultInvoiceTemplate || 'Swiss_Clean', 
    status: 'Draft',
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
    try {
      const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
      if (!isOwner && newStatus === 'Paid') {
        showToast('Status change requires authority clearance', 'info');
        await updateInvoice({ ...inv, status: 'Pending Approval' });
      } else {
        await updateInvoice({ ...inv, status: newStatus });
        showToast(`Invoice updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
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
        {/* Fix: Added the missing 'type' property to the receiptVoucher object to fix the type error. */}
        const receiptVoucher: Voucher = {
          id: `REC-${Date.now().toString().slice(-4)}`,
          companyId: userProfile.companyId,
          projectId: paymentLogInvoice.id,
            description: `PAYMENT: ${paymentLogInvoice.clientId} #${paymentLogInvoice.id}`,
          amount: paymentAmount,
          category: 'Strategy',
          date: new Date().toISOString().split('T')[0],
          status: 'Reimbursed',
          type: 'RECEIPT'
        };
        await API.saveItem('vouchers', receiptVoucher);
      }
      
        showToast(isOwner ? 'Payment & Receipt recorded' : 'Payment submitted for approval');
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

  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => isLpoView ? inv.type === 'LPO' : inv.type === 'Invoice');
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inv => 
        inv.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = (a.amountAED || 0) - (b.amountAED || 0);
      } else if (sortBy === 'client') {
        comparison = a.clientId.localeCompare(b.clientId);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [invoices, isLpoView, searchQuery, statusFilter, sortBy, sortOrder]);
  
  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  // Selection handlers
  const toggleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === filteredInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  const clearSelection = () => {
    setSelectedInvoiceIds(new Set());
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.size === 0) return;
    const confirm = window.confirm(`Are you sure you want to delete ${selectedInvoiceIds.size} invoice(s)?`);
    if (confirm) {
      selectedInvoiceIds.forEach(id => deleteInvoice(id));
      clearSelection();
      showToast(`Deleted ${selectedInvoiceIds.size} invoice(s)`);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkActionStatus || selectedInvoiceIds.size === 0) return;
    const updates = Array.from(selectedInvoiceIds).map(id => {
      const inv = invoices.find(i => i.id === id);
      return inv ? handleUpdateStatus(inv, bulkActionStatus) : Promise.resolve();
    });
    await Promise.all(updates);
    clearSelection();
    setBulkActionStatus(null);
    showToast(`Updated ${selectedInvoiceIds.size} invoice(s) to ${bulkActionStatus}`);
  };

  return (
    <div className="space-y-10 animate-enter pb-24 max-w-[1400px] mx-auto px-4 lg:px-0">
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 p-8 lg:p-12 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[3rem] relative overflow-hidden shadow-2xl transition-all duration-500`}>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          {isLpoView ? <ClipboardCheck size={280} /> : <Banknote size={240} />}
        </div>
        
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-5">
             <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white border border-white/10 transition-all duration-500 ${
               isLpoView 
                 ? 'bg-amber-600 shadow-[0_0_40px_rgba(217,119,6,0.3)]' 
                 : 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.3)]'
             }`}>
               {isLpoView ? <Receipt size={28} /> : <CreditCard size={28} />}
             </div>
             <div>
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">
                  {isLpoView ? 'Purchase Orders' : 'Invoices'}
                </h2>
                <p className={`text-[11px] font-black uppercase tracking-[0.5em] mt-3 opacity-80 transition-all duration-500 ${
                  isLpoView ? 'text-amber-400' : 'text-indigo-400'
                }`}>
                  {isLpoView ? 'Purchase Order Management' : 'Invoice Management'}
                </p>
             </div>
           </div>
        </div>

        <Button 
          onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} 
          variant="primary" 
          icon={Plus}
          className={`px-10 h-16 shadow-2xl relative z-10 text-[11px] uppercase font-black tracking-widest transition-all active:scale-95 ${
            isLpoView 
              ? 'bg-amber-600 border-amber-600 hover:bg-amber-500' 
              : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {isLpoView ? 'New Purchase Order' : 'New Invoice'}
        </Button>
      </header>

      {/* Table Filters */}
      <Card className="p-5 sm:p-6 border border-[var(--border-ui)] bg-[var(--bg-card)] rounded-2xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <label className="block text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1 mb-2 opacity-60">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
              />
            </div>
          </div>
          <div className="sm:col-span-1">
            <Select
              label="Status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="!h-11"
            >
              <option value="ALL">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending Approval">Pending Approval</option>
            </Select>
          </div>
          <div className="sm:col-span-1">
            <Select
              label="Sort By"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="!h-11"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="client">Client</option>
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex-1 sm:flex-none h-11 px-4 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ChevronDown size={14} className="rotate-180" />
                  <span>Asc</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  <span>Desc</span>
                </>
              )}
            </button>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                className="flex-1 sm:flex-none h-11 px-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedInvoiceIds.size > 0 && (
        <Card className="p-4 border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded-2xl shadow-lg animate-enter">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                <CheckSquare size={20} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                  {selectedInvoiceIds.size} {selectedInvoiceIds.size === 1 ? 'Invoice' : 'Invoices'} Selected
                </p>
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-70">
                  Bulk Actions Available
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select
                label="Bulk Status"
                value={bulkActionStatus || ''}
                onChange={e => setBulkActionStatus(e.target.value as Invoice['status'] || null)}
                className="!h-10 min-w-[140px]"
              >
                <option value="">Change Status...</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
                <option value="Pending Approval">Pending Approval</option>
              </Select>
              {bulkActionStatus && (
                <Button
                  onClick={handleBulkStatusUpdate}
                  variant="primary"
                  size="sm"
                  className="h-10"
                >
                  Apply Status
                </Button>
              )}
              <Button
                onClick={handleBulkDelete}
                variant="danger"
                size="sm"
                className="h-10"
                icon={Trash2}
              >
                Delete ({selectedInvoiceIds.size})
              </Button>
              <Button
                onClick={clearSelection}
                variant="ghost"
                size="sm"
                className="h-10"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="p-0" className="overflow-hidden hidden md:block border border-[var(--border-ui)] bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
        
        <div className="w-full relative z-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-card-muted)] border-b border-[var(--border-ui)]">
                <th className="px-3 lg:px-4 py-4 text-center w-[40px]">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="w-5 h-5 flex items-center justify-center rounded border border-[var(--border-ui)] hover:border-[var(--accent)] transition-all"
                    title={selectedInvoiceIds.size === filteredInvoices.length ? 'Deselect All' : 'Select All'}
                  >
                    {selectedInvoiceIds.size === filteredInvoices.length && filteredInvoices.length > 0 ? (
                      <CheckSquare size={16} className="text-[var(--accent)]" />
                    ) : (
                      <Square size={16} className="text-[var(--text-secondary)]" />
                    )}
                  </button>
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[14%]">
                   Invoice ID
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] min-w-[0] hidden md:table-cell">
                   Client
                </th>
                <th className="px-4 lg:px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[10%] hidden xl:table-cell">
                   Type
                </th>
                {isLpoView && (
                  <th className="px-4 lg:px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[12%] hidden xl:table-cell">
                     Related Project
                  </th>
                )}
                <th className="px-4 lg:px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[16%]">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[16%]">
                  Amount
                </th>
                <th className="px-4 lg:px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] w-[16%]">
                  Directives
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const isOverdue = inv.status !== 'Paid' && inv.status !== 'Pending Approval' && new Date(inv.dueDate) < new Date();
                  const linkedProp = proposals.find(p => p.id === inv.linkedProposalId);
                  const isApproved = inv.status !== 'Pending Approval';
                  const isSendable = isApproved && (inv.status === 'Draft' || inv.status === 'Sent');
                  
                  const isSelected = selectedInvoiceIds.has(inv.id);
                  
                  return (
                    <tr 
                      key={inv.id} 
                      className={`group hover:bg-white/[0.01] transition-all duration-150 ${
                        isSelected ? 'bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]' : ''
                      }`}
                    >
                      <td className="px-3 lg:px-4 py-5 align-middle" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectInvoice(inv.id)}
                          className="w-5 h-5 flex items-center justify-center rounded border border-[var(--border-ui)] hover:border-[var(--accent)] transition-all"
                          title={isSelected ? 'Deselect' : 'Select'}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[var(--accent)]" />
                          ) : (
                            <Square size={16} className="text-[var(--text-secondary)]" />
                          )}
                        </button>
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-5 align-middle cursor-pointer"
                        onClick={() => setActiveInvoiceForPreview(inv)}
                      >
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[var(--accent)]/30 transition-all ${
                            inv.status === 'Paid' 
                              ? 'text-emerald-500 border-emerald-500/20' 
                              : isLpoView 
                                ? 'text-amber-500' 
                                : 'text-[var(--accent)]'
                          }`}>
                            {isLpoView ? <ClipboardCheck size={16} className="lg:w-[18px] lg:h-[18px]" /> : <FileText size={16} className="lg:w-[18px] lg:h-[18px]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider leading-tight mb-0.5 truncate">
                              {inv.id}
                            </p>
                            <p className="text-[9px] font-bold text-[var(--text-primary)] uppercase truncate mb-0.5 md:hidden">
                              {inv.clientId}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-50">
                              <Clock size={8} className="text-[var(--text-secondary)] shrink-0 lg:w-[9px] lg:h-[9px]" />
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-wider tabular-nums hidden sm:inline">
                                {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-wider tabular-nums sm:hidden">
                                {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-5 align-middle hidden md:table-cell cursor-pointer"
                        onClick={() => setActiveInvoiceForPreview(inv)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase truncate text-[var(--text-primary)] leading-tight mb-1">
                            {inv.clientId}
                          </p>
                          <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-60">
                            Client Name
                          </p>
                        </div>
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-5 text-center align-middle hidden xl:table-cell cursor-pointer"
                        onClick={() => setActiveInvoiceForPreview(inv)}
                      >
                        <div className="flex justify-center">
                          <Badge 
                            variant="info" 
                            className={`!px-2.5 !py-1 !rounded-lg !text-[8px] font-black uppercase border-none bg-[var(--bg-card-muted)] shadow-sm tracking-wider ${
                              isLpoView ? '!text-amber-500' : '!text-[var(--accent)]'
                            }`}
                          >
                            {inv.type}
                          </Badge>
                        </div>
                      </td>
                      {isLpoView && (
                        <td 
                          className="px-4 lg:px-6 py-5 text-center align-middle hidden xl:table-cell cursor-pointer"
                          onClick={() => setActiveInvoiceForPreview(inv)}
                        >
                          {linkedProp ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/projects/${linkedProp.id}`); 
                                }}
                                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                              >
                                <Link2 size={11} className="opacity-60 group-hover/link:opacity-100" />
                                <span className="text-[10px] font-black uppercase tracking-tight hover:underline truncate max-w-[150px]">
                                  {linkedProp.title}
                                </span>
                              </button>
                              <p className="text-[7px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-50">
                                Project Reference
                              </p>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-50">
                              NO LINK
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-4 lg:px-6 py-5 text-center align-middle">
                        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                          <StatusSelect
                            value={inv.status}
                            onChange={(newStatus) => handleUpdateStatus(inv, newStatus)}
                            disabled={false}
                            isOverdue={isOverdue}
                            allowPaid={isOwner}
                          />
                        </div>
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-5 text-right align-middle cursor-pointer"
                        onClick={() => setActiveInvoiceForPreview(inv)}
                      >
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1.5 mb-0.5">
                            <span className={`text-[9px] font-black uppercase opacity-60 hidden sm:inline ${
                              isLpoView ? 'text-amber-500' : 'text-[var(--accent)]'
                            }`}>
                              {inv.currency}
                            </span>
                            <span className="text-sm lg:text-base font-black tabular-nums text-[var(--text-primary)] tracking-tight leading-none">
                              {inv.amountPaid.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-50 tabular-nums hidden lg:block">
                            AED {(inv.amountAED || 0).toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-5 text-right align-middle">
                        <div className="flex justify-end items-center gap-1.5 lg:gap-2 min-h-[40px]">
                          <div className="flex gap-1.5 lg:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                            {isSendable && (
                              <button 
                                onClick={() => setActiveInvoiceForPreview(inv)}
                                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                                title="Dispatch Protocol"
                              >
                                <Zap size={12} className="lg:w-[14px] lg:h-[14px]" />
                              </button>
                            )}
                            {isLpoView && (inv.status === 'Sent' || inv.status === 'Paid') && (
                              <button 
                                onClick={() => handleLpoToInvoice(inv)}
                                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                                title="Synthesize Invoice"
                              >
                                <RefreshCw size={12} className="lg:w-[14px] lg:h-[14px]" />
                              </button>
                            )}
                            {!isLpoView && inv.status !== 'Paid' && inv.status !== 'Pending Approval' && (
                              <button 
                                onClick={() => { setPaymentLogInvoice(inv); setPaymentAmount(inv.amountPaid); }} 
                                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-95" 
                                title="Record Settlement"
                              >
                                <Banknote size={12} className="lg:w-[14px] lg:h-[14px]" />
                              </button>
                            )}
                            <button 
                              onClick={() => openCreator(inv.type, inv.id)}
                              className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--text-secondary)] hover:bg-[var(--accent)] hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                              title="Modify Node"
                            >
                              <Edit2 size={12} className="lg:w-[14px] lg:h-[14px]" />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(inv.id)}
                              className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                              title="Purge Node"
                            >
                              <Trash2 size={12} className="lg:w-[14px] lg:h-[14px]" />
                            </button>
                          </div>
                          <div className="group-hover:hidden flex justify-end text-[var(--text-secondary)] opacity-30">
                            <MoreHorizontal size={14} className="lg:w-4 lg:h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isLpoView ? 8 : 7} className="px-6 py-32 text-center">
                    <EmptyState 
                      icon={isLpoView ? ClipboardCheck : Banknote} 
                      title={`No ${isLpoView ? 'Purchase Orders' : 'Invoices'} Found`} 
                      description={`No ${isLpoView ? 'purchase orders' : 'invoices'} found yet. Create a new ${isLpoView ? 'purchase order' : 'invoice'} to get started.`} 
                      action={
                        <Button 
                          onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} 
                          variant="outline" 
                          className={`h-12 mt-6 ${
                            isLpoView 
                              ? 'border-amber-500/30 text-amber-400' 
                              : 'border-indigo-500/30 text-indigo-400'
                          }`}
                        >
                          Create First Invoice
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="p-6 lg:p-8 bg-[var(--bg-card-muted)]/50 border-t border-[var(--border-ui)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-70">
                Total:
              </span>
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider tabular-nums">
                {filteredInvoices.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-70">
                Subtotal:
              </span>
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider tabular-nums">
                {filteredInvoices.reduce((a, b) => a + (b.amountAED || 0), 0).toLocaleString()} AED
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-70">
                Total:
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider tabular-nums ${
                isLpoView ? 'text-amber-500' : 'text-[var(--accent)]'
              }`}>
                {filteredInvoices.reduce((a, b) => a + b.amountPaid, 0).toLocaleString()} {filteredInvoices[0]?.currency || 'AED'}
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-2 opacity-60 ${
            isLpoView ? 'text-amber-500/60' : 'text-[var(--accent)]/60'
          } transition-all duration-500`}>
            <ShieldCheck size={12} />
            <span className="text-[9px] font-black uppercase tracking-wider">Encrypted Fiscal Registry</span>
          </div>
        </footer>
      </Card>

      {/* Mobile view remains card-based for UX */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((inv) => {
            const isOverdue = inv.status !== 'Paid' && inv.status !== 'Pending Approval' && new Date(inv.dueDate) < new Date();
            const isApproved = inv.status !== 'Pending Approval';
            const isSendable = isApproved && (inv.status === 'Draft' || inv.status === 'Sent');
            const linkedProp = proposals.find(p => p.id === inv.linkedProposalId);
            const isSelected = selectedInvoiceIds.has(inv.id);
            
            return (
              <Card 
                key={inv.id} 
                className={`p-6 bg-[var(--bg-card)] border-[var(--border-ui)] rounded-2xl shadow-lg relative overflow-hidden ${
                  isSelected ? 'border-[var(--accent)] border-2 bg-[var(--accent)]/5' : ''
                }`}
                onClick={() => setActiveInvoiceForPreview(inv)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none transition-all duration-500 ${
                  isLpoView ? 'from-amber-500/[0.02]' : 'from-indigo-500/[0.02]'
                }`} />
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectInvoice(inv.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded border border-[var(--border-ui)] hover:border-[var(--accent)] transition-all shrink-0"
                        title={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[var(--accent)]" />
                        ) : (
                          <Square size={16} className="text-[var(--text-secondary)]" />
                        )}
                      </button>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-500 shrink-0 ${
                        isLpoView 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      }`}>
                        {isLpoView ? <ClipboardCheck size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase text-[var(--text-primary)] tracking-wider leading-tight truncate">
                          {inv.id}
                        </p>
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase mt-0.5 tracking-wider opacity-70">
                          {inv.type}
                        </p>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <StatusSelect
                        value={inv.status}
                        onChange={(newStatus) => handleUpdateStatus(inv, newStatus)}
                        disabled={false}
                        isOverdue={isOverdue}
                        allowPaid={isOwner}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase text-[var(--text-primary)] truncate leading-tight">
                      {inv.clientId}
                    </h4>
                    {linkedProp && isLpoView && (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/projects/${linkedProp.id}`); 
                        }}
                        className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-[9px] font-bold uppercase tracking-wider"
                      >
                        <Link2 size={10} />
                        <span className="truncate max-w-[200px]">{linkedProp.title}</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-[var(--border-ui)]">
                    <div className="flex items-end justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-60">
                          Amount
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-[9px] font-black uppercase opacity-50 ${
                            isLpoView ? 'text-amber-500' : 'text-[var(--accent)]'
                          }`}>
                            {inv.currency}
                          </span>
                          <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tight leading-none">
                            {inv.amountPaid.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-50 tabular-nums mt-0.5">
                          AED {(inv.amountAED || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {isSendable && (
                          <button 
                            onClick={() => setActiveInvoiceForPreview(inv)} 
                            className="w-10 h-10 flex items-center justify-center bg-[var(--accent)] text-white rounded-xl shadow-sm active:scale-95 border border-[var(--accent)]/30 transition-all"
                            title="Dispatch Protocol"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {isLpoView && (inv.status === 'Sent' || inv.status === 'Paid') && (
                          <button 
                            onClick={() => handleLpoToInvoice(inv)} 
                            className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-sm active:scale-95 border border-emerald-500/30 transition-all"
                            title="Synthesize Invoice"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {!isLpoView && inv.status !== 'Paid' && inv.status !== 'Pending Approval' && (
                          <button 
                            onClick={() => { setPaymentLogInvoice(inv); setPaymentAmount(inv.amountPaid); }} 
                            className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-sm active:scale-95 border border-emerald-500/30 transition-all"
                            title="Record Settlement"
                          >
                            <Banknote size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => openCreator(inv.type, inv.id)} 
                          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--text-secondary)] rounded-xl shadow-sm active:scale-95 transition-all"
                          title="Modify Node"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(inv.id)} 
                          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm active:scale-95 transition-all"
                          title="Purge Node"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState 
            icon={isLpoView ? ClipboardCheck : Banknote} 
            title={`No ${isLpoView ? 'Purchase Orders' : 'Invoices'} Found`} 
            description={`No ${isLpoView ? 'purchase orders' : 'invoices'} found yet. Create a new ${isLpoView ? 'purchase order' : 'invoice'} to get started.`} 
            action={
              <Button 
                onClick={() => openCreator(isLpoView ? 'LPO' : 'Invoice')} 
                variant="outline" 
                className={`h-12 mt-6 ${
                  isLpoView 
                    ? 'border-amber-500/30 text-amber-400' 
                    : 'border-indigo-500/30 text-indigo-400'
                }`}
              >
                Create First Invoice
              </Button>
            }
          />
        )}
      </div>

      <PdfSlideout invoice={activeInvoiceForPreview} onClose={() => { setActiveInvoiceForPreview(null); if (id) navigate(isLpoView ? '/lpo' : '/invoices'); }} />
      
      <ConfirmationModal 
        isOpen={!!confirmDeleteId} 
        title="Delete Invoice" 
        message="This invoice will be permanently deleted. This action cannot be undone." 
        onConfirm={() => { if (confirmDeleteId) deleteInvoice(confirmDeleteId); setConfirmDeleteId(null); }} 
        onCancel={() => setConfirmDeleteId(null)} 
      />

      {isCreatorOpen && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container !max-w-5xl animate-pop-in border-none shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <header className="p-8 lg:p-10 border-b border-[var(--border-ui)] flex justify-between items-center bg-[var(--bg-card)]">
               <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-all duration-500 ${
                    isLpoView 
                      ? 'bg-amber-600/10 text-amber-400 border-amber-500/20' 
                      : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {isLpoView ? <ClipboardCheck size={28}/> : <FileText size={28}/>}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      {editingInvoiceId ? 'Sync Node' : `Initialize ${form.type}`}
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-2 transition-all duration-500 ${
                      isLpoView ? 'text-amber-500' : 'text-indigo-500'
                    }`}>
                      Fiscal Document Configurator
                    </p>
                  </div>
               </div>
               <button onClick={() => setIsCreatorOpen(false)} className="p-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-2xl transition-all">
                 <X size={28} />
               </button>
            </header>

            <div className="p-10 lg:p-14 bg-[#0B1120] custom-scroll max-h-[85vh] overflow-y-auto">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CustomSelect 
                          label="Client" 
                          value={form.clientId} 
                          options={clients.map(c => ({ id: c.name, label: c.name }))} 
                          onChange={(val: any) => setForm({...form, clientId: val})} 
                          icon={UserPlus}
                        />
                        <Input 
                          label="Client Email" 
                          value={form.clientEmail} 
                          onChange={e => setForm({...form, clientEmail: e.target.value})} 
                          placeholder="IDENT@REGION.NET"
                          className="font-black !h-11 uppercase"
                        />
                     </div>

                     <div className="space-y-6">
                        <Label className="uppercase tracking-[0.3em] mb-4 block">Items</Label>
                        <div className="space-y-4">
                           {(form.productList || []).map((item, i) => (
                             <div key={i} className="flex gap-4 items-end animate-enter">
                                <div className="flex-1">
                                   <Input 
                                    label={i === 0 ? "Item Name" : undefined}
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
                                    label={i === 0 ? "Unit Price" : undefined}
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
                            className={`w-full py-4 border-2 border-dashed border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all flex items-center justify-center gap-3 ${
                              isLpoView 
                                ? 'hover:border-amber-500/30 hover:text-amber-400' 
                                : 'hover:border-indigo-500/30 hover:text-indigo-400'
                            }`}
                           >
                             <Plus size={16}/> Register Additional Module
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-4 space-y-10">
                     <Card variant="muted" className="!p-8 !rounded-[2rem] bg-[var(--bg-card-muted)] border-[var(--border-ui)] space-y-8">
                        <div>
                           <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] mb-4">Ledger Summary</p>
                           <div className="flex items-baseline justify-between">
                              <span className={`text-xl font-black uppercase transition-all duration-500 ${
                                isLpoView ? 'text-amber-500' : 'text-indigo-500'
                              }`}>{form.currency}</span>
                              <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{calculateSubtotal().toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-[var(--border-ui)]">
                           <TemporalPicker label="Activation Date" value={form.date || ''} onChange={val => setForm({...form, date: val})} />
                           <TemporalPicker label="Due Date" value={form.dueDate || ''} onChange={val => setForm({...form, dueDate: val})} />
                           <Select label="Currency" value={form.currency} onChange={e => setForm({...form, currency: e.target.value as any})}>
                             <option value="AED">AED - Dirham</option>
                             <option value="USD">USD - Dollar</option>
                             <option value="EUR">EUR - Euro</option>
                           </Select>
                        </div>
                     </Card>

                     <Card variant="muted" className="!p-8 !rounded-[2rem] bg-[var(--bg-card-muted)] border-[var(--border-ui)] space-y-6">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em]">Recurring Invoice</p>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={form.isReoccurring || false}
                                 onChange={e => setForm({...form, isReoccurring: e.target.checked, reoccurrenceDate: e.target.checked ? form.reoccurrenceDate || form.date : undefined})}
                                 className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                           </label>
                        </div>
                        {form.isReoccurring && (
                           <>
                              <Select 
                                 label="Frequency" 
                                 value={form.reoccurrenceFrequency || 'Monthly'} 
                                 onChange={e => setForm({...form, reoccurrenceFrequency: e.target.value as any})}
                              >
                                 <option value="Weekly">Weekly</option>
                                 <option value="Monthly">Monthly</option>
                                 <option value="Quarterly">Quarterly</option>
                                 <option value="Yearly">Yearly</option>
                              </Select>
                              <TemporalPicker 
                                 label="Next Recurring Date" 
                                 value={form.reoccurrenceDate || form.date || ''} 
                                 onChange={val => setForm({...form, reoccurrenceDate: val})} 
                              />
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={form.autoSend === true}
                                    onChange={e => setForm({...form, autoSend: e.target.checked})}
                                    className="w-4 h-4 rounded border-[var(--border-ui)] bg-[var(--input-bg)] text-indigo-600 focus:ring-indigo-500"
                                 />
                                 <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Auto-send when recurring
                                 </span>
                              </label>
                              <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-60 leading-relaxed">
                                 The system will automatically create and send a new invoice on the recurring date set above.
                              </p>
                           </>
                        )}
                     </Card>

                     <Button 
                      onClick={handleSave}
                      className={`w-full h-18 text-white font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl active:scale-95 transition-all duration-500 ${
                        isLpoView 
                          ? 'bg-amber-600 border-amber-600 hover:bg-amber-500' 
                          : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-500'
                      }`}
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
            <header className="p-8 border-b border-[var(--border-ui)] bg-[var(--bg-card)] flex items-center gap-5">
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                 <Banknote size={24}/>
               </div>
               <div>
                  <h3 className="text-lg font-black uppercase text-white">Record Settlement</h3>
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">{paymentLogInvoice.id}</p>
               </div>
            </header>
            <div className="p-10 space-y-8 bg-[#0B1120]">
               <PriceInput 
                label="Received Value (AED)" 
                value={paymentAmount} 
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                className="!h-16 font-black text-2xl"
               />
               <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed text-center px-4">
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
