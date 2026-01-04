
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Loader2, CheckCircle2, Download, Send, FileText, Edit2, Save, Trash2, Plus,
  MessageSquare, ClipboardCheck, Zap, Mail, ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, Currency, InvoiceItem } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Badge, Button } from './ui/Primitives.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';

interface PdfSlideoutProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const PdfSlideout: React.FC<PdfSlideoutProps> = ({ invoice, onClose }) => {
  const { userProfile, clients, pushNotification, updateInvoice, showToast } = useBusiness();
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [localInvoice, setLocalInvoice] = useState<Invoice | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');

  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoice) {
      setLocalInvoice(JSON.parse(JSON.stringify(invoice)));
      setHasChanges(false);
    } else {
      setLocalInvoice(null);
      setHasChanges(false);
      setIsEditing(false);
    }
  }, [invoice]);

  const client = useMemo(() => clients.find(c => c.name === localInvoice?.clientId), [clients, localInvoice]);
  
  const total = useMemo(() => 
    (localInvoice?.productList ?? []).reduce((a, b) => a + ((b.price ?? 0) * (b.quantity ?? 1)), 0), 
  [localInvoice]);

  const currencySymbols: Record<Currency, string> = { 
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'Fr', 
    CNY: '¥', INR: '₹', BRL: 'R$', SGD: 'S$', AED: 'AED ', SAR: 'ر.س', QAR: 'ر.ق',
    MXN: '$', HKD: 'HK$', NZD: 'NZ$', ZAR: 'R', TRY: '₺', KRW: '₩',
    IDR: 'Rp', MYR: 'RM', PHP: '₱', THB: '฿', VND: '₫'
  };

  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth;
      const isMobile = availableWidth < 768;
      const docWidthPx = 794; 
      
      if (isMobile) {
        setPreviewScale(availableWidth / docWidthPx);
      } else if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 80;
        setPreviewScale(Math.min(1, containerWidth / docWidthPx));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [invoice, isEditing]);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !localInvoice) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${localInvoice.id}_v${localInvoice.version}.pdf`);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const syncToClipboard = async () => {
    if (!pdfRef.current) return false;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        return true;
      }
    } catch (err) {
      console.error('Clipboard sync failed', err);
    }
    return false;
  };

  const handleTransmit = async () => {
    if (!localInvoice) return;
    setIsSending(true);
    
    try {
      // 1. Snapshot & Sync
      const synced = await syncToClipboard();
      if (!synced) showToast('Clipboard sync failed', 'error');

      // 2. Open Terminal
      const subject = `${localInvoice.type} #${localInvoice.id} from ${userProfile.companyName}`;
      const body = `Hello ${localInvoice.clientId},\n\nPlease find attached ${localInvoice.type} #${localInvoice.id} for the amount of ${localInvoice.currency} ${total.toLocaleString()}.\n\n(Note: The document has been copied to your clipboard. Simply hit Ctrl+V in this message to attach the visual copy.)`;

      if (dispatchMode === 'WHATSAPP' && client?.phone) {
        const url = `https://wa.me/${client.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
      } else {
        const url = `mailto:${localInvoice.clientEmail || client?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
      }

      // 3. Finalize
      updateInvoice({ ...localInvoice, status: 'Sent' });
      pushNotification({ title: 'Terminal Dispatched', description: `Syncing ${localInvoice.id} payload.`, type: 'finance' });
      showToast('Payload Ready to Paste (Ctrl+V)', 'info');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveChanges = () => {
    if (localInvoice) {
      updateInvoice({
        ...localInvoice,
        amountPaid: total,
        amountAED: localInvoice.currency === 'AED' ? total : total * 3.67,
        taxRate: 0
      });
      setIsEditing(false);
      setHasChanges(false);
      pushNotification({ title: 'Saved', description: `Updated ${localInvoice.id} successfully.`, type: 'update' });
    }
  };

  const updateLocalItem = (index: number, updates: Partial<InvoiceItem>) => {
    if (!localInvoice) return;
    const newList = [...localInvoice.productList];
    newList[index] = { ...newList[index], ...updates };
    setLocalInvoice({ ...localInvoice, productList: newList });
    setHasChanges(true);
  };

  const addLocalItem = () => {
    if (!localInvoice) return;
    setLocalInvoice({ ...localInvoice, productList: [...localInvoice.productList, { productId: 'GENERIC', name: '', quantity: 1, price: 0 }] });
    setHasChanges(true);
  };

  const removeLocalItem = (index: number) => {
    if (!localInvoice) return;
    setLocalInvoice({ ...localInvoice, productList: localInvoice.productList.filter((_, i) => i !== index) });
    setHasChanges(true);
  };

  const handleCloseAttempt = () => {
    if (isEditing && hasChanges) setShowDiscardConfirm(true);
    else { setIsEditing(false); setHasChanges(false); onClose(); }
  };

  if (!localInvoice) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col animate-enter overflow-hidden">
      <header className="h-16 sm:h-20 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 sm:px-10 shrink-0">
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleCloseAttempt} className="p-2 hover:bg-white/10 rounded-lg text-white transition-all cursor-pointer">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">{localInvoice.id}</h3>
            {isEditing && <Badge variant="warning" className="ml-2">Editing</Badge>}
            {hasChanges && <span className="text-[10px] text-amber-500 font-bold ml-2">• Unsaved</span>}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {isEditing ? (
            <>
              <button type="button" onClick={handleSaveChanges} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer">
                <Save size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Save</span>
              </button>
              <button type="button" onClick={() => { if(hasChanges) setShowDiscardConfirm(true); else setIsEditing(false); }} className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] font-bold uppercase tracking-widest">Cancel</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="h-10 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer">
              <Edit2 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
            </button>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'}`}><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleTransmit} 
                disabled={isSending}
                className={`h-10 px-6 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-3 shadow-2xl ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {isSending ? 'Syncing...' : 'Dispatch & Sync'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center py-10 relative">
        {isSending && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center gap-6 animate-pop-in">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-2xl animate-pulse">
                   <Zap size={32} />
                </div>
                <div className="text-center">
                   <h4 className="text-sm font-black uppercase tracking-widest">Terminal Sync in Progress</h4>
                   <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">Document payload syncing to system clipboard</p>
                </div>
             </div>
          </div>
        )}

        <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px` }} className={`relative transition-all duration-300 ${isEditing ? 'ring-8 ring-indigo-500/20' : 'shadow-2xl'}`}>
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="bg-white flex flex-col font-sans text-slate-800 absolute top-0 left-0 p-[80px]">
            <div className="flex justify-between items-start mb-16">
              <div className="w-1/2">
                <div className="w-48 h-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                   {userProfile.branding.logoUrl ? <img src={userProfile.branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Logo</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Number</div>
                <div className="text-2xl font-mono text-slate-900">{isEditing ? <input className="bg-slate-50 border border-slate-200 p-1 text-right w-32 focus:outline-indigo-500" value={localInvoice.id} onChange={e => { setLocalInvoice({...localInvoice, id: e.target.value.toUpperCase()}); setHasChanges(true); }} /> : `#${localInvoice.id}`}</div>
              </div>
            </div>

            <h1 className="text-7xl font-extrabold uppercase tracking-tighter mb-4 text-slate-900">{localInvoice.type}</h1>
            <div className="mb-20 flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase text-[11px] tracking-widest">Date:</span>
              {isEditing ? <input type="date" className="bg-slate-50 border border-slate-200 p-1 text-lg font-bold text-slate-900" value={localInvoice.date} onChange={e => { setLocalInvoice({...localInvoice, date: e.target.value}); setHasChanges(true); }} /> : <span className="text-lg font-bold text-slate-900">{new Date(localInvoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>}
            </div>

            <div className="grid grid-cols-2 gap-20 mb-20">
              <div>
                <h4 className="font-bold text-slate-400 mb-6 uppercase text-[10px] tracking-[0.2em]">To:</h4>
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{client?.name || localInvoice.clientId}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">{client?.address}</p>
                  <p className="text-sm text-slate-500">{client?.email || localInvoice.clientEmail}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-400 mb-6 uppercase text-[10px] tracking-[0.2em]">From:</h4>
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{userProfile.fullName}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">{userProfile.branding.address}</p>
                  <p className="text-sm text-slate-500">{userProfile.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="w-full border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-1/2">Item</span>
                <div className="flex w-1/2 justify-end gap-10">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-16 text-center">Qty</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-24 text-right">Price</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-24 text-right">Total</span>
                   {isEditing && <span className="w-8"></span>}
                </div>
              </div>
              
              <div className="space-y-2">
                {(localInvoice.productList || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 group">
                    <div className="flex-1 pr-10">{isEditing ? <input className="w-full bg-slate-50 border border-slate-100 p-2 text-lg font-bold text-slate-900 uppercase tracking-tight focus:bg-white" value={item.name} onChange={e => updateLocalItem(i, { name: e.target.value.toUpperCase() })} /> : <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">{item.name}</p>}</div>
                    <div className="flex justify-end gap-10 items-center">
                       <div className="w-16 text-center">{isEditing ? <input type="number" className="w-full bg-slate-50 border border-slate-100 p-2 text-center text-sm font-bold text-slate-900" value={item.quantity} onChange={e => updateLocalItem(i, { quantity: parseInt(e.target.value) || 1 })} /> : <p className="text-sm font-bold text-slate-900 tabular-nums">{item.quantity}</p>}</div>
                       <div className="w-24 text-right">{isEditing ? <input type="number" className="w-full bg-slate-50 border border-slate-100 p-2 text-right text-sm font-bold text-slate-900" value={item.price} onChange={e => updateLocalItem(i, { price: parseFloat(e.target.value) || 0 })} /> : <p className="text-sm font-bold text-slate-900 tabular-nums">{item.price.toLocaleString()}</p>}</div>
                       <div className="w-24 text-right"><p className="text-lg font-bold text-slate-900 tabular-nums">{(item.price * item.quantity).toLocaleString()}</p></div>
                       {isEditing && <button type="button" onClick={() => removeLocalItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                ))}
                {isEditing && <button type="button" onClick={addLocalItem} className="w-full py-4 mt-4 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500/30 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer"><Plus size={14} /> Add Line Item</button>}
              </div>

              <div className="mt-20 border-t-2 border-slate-100 pt-10">
                <div className="flex justify-between items-center pt-8 border-t-4 border-slate-900">
                   <span className="text-xl font-black uppercase tracking-widest">Grand Total</span>
                   <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{currencySymbols[localInvoice.currency]}{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-10">
               <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Payment Details</h5>
                  <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                     <p>Transfer to: {userProfile.branding.bankDetails}</p>
                     <p className="mt-4 text-[9px] uppercase tracking-widest opacity-50">Due date: {new Date(localInvoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end justify-end">
                  {userProfile.branding.signatureUrl ? <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 object-contain grayscale opacity-60 mb-4" /> : <div className="h-12 w-32 border-b border-slate-200 mb-4"></div>}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{userProfile.fullName}</p>
                  <p className="text-[9px] text-slate-300 uppercase font-medium mt-1">{userProfile.companyName}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal isOpen={showDiscardConfirm} title="Discard changes?" message="You have unsaved changes. Do you want to save them before closing?" confirmLabel="Save and Close" onConfirm={() => { handleSaveChanges(); onClose(); setShowDiscardConfirm(false); }} onCancel={() => { setShowDiscardConfirm(false); onClose(); }} variant="primary" />
    </div>,
    document.body
  );
};

export default PdfSlideout;
