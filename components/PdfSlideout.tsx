import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Loader2, CheckCircle2, Download, FileText, Edit2, Save, Trash2, Plus,
  MessageSquare, Zap, Mail, Link as LinkIcon
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

  const handleDownloadPdf = async (autoClose = false): Promise<boolean> => {
    if (!pdfRef.current || !localInvoice) return false;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`${localInvoice.id}.pdf`);
      if (!autoClose) {
        setExportDone(true);
        setTimeout(() => setExportDone(false), 3000);
      }
      return true;
    } catch (e) { 
      console.error(e); 
      return false;
    } finally { 
      setIsExporting(false); 
    }
  };

  const handleTransmit = async () => {
    if (!localInvoice) return;
    setIsSending(true);
    try {
      const baseAppUrl = window.location.href.split('#')[0];
      const docPath = localInvoice.type === 'LPO' ? 'lpo' : 'invoices';
      const deepLink = `${baseAppUrl}#/${docPath}/${localInvoice.id}`;
      await navigator.clipboard.writeText(deepLink);
      await handleDownloadPdf(true);

      const subject = `${localInvoice.type} #${localInvoice.id} from ${userProfile?.companyName || 'Craftly'}`;
      const body = `Hello ${localInvoice.clientId},\n\nPlease find your ${localInvoice.type} #${localInvoice.id} for the amount of ${localInvoice.currency} ${total.toLocaleString()}.\n\nDIGITAL VIEWING LINK:\n${deepLink}\n\n(Note: I have attached the PDF version of this document for your records. Please check the email attachments.)\n\nBest regards,\n${userProfile?.fullName}\n${userProfile?.companyName}`;

      if (dispatchMode === 'WHATSAPP' && client?.phone) {
        const url = `https://wa.me/${client.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
      } else {
        const mailtoRecipient = localInvoice.clientEmail || client?.email || '';
        const url = `mailto:${mailtoRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
      }

      updateInvoice({ ...localInvoice, status: 'Sent' });
      pushNotification({ title: 'Terminal Dispatched', description: `Syncing ${localInvoice.id} via link & PDF.`, type: 'finance' });
      showToast('PDF Downloaded & Link Synced', 'success');
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
            <>
              <button type="button" onClick={() => handleDownloadPdf()} className="h-10 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                <span className="text-[10px] font-bold uppercase tracking-widest">Download PDF</span>
              </button>
              <button type="button" onClick={() => setIsEditing(true)} className="h-10 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer">
                <Edit2 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
              </button>
            </>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="Email Dispatch"><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="WhatsApp Dispatch"><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleTransmit} 
                disabled={isSending}
                className={`h-10 px-6 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-3 shadow-2xl ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {isSending ? 'Transmitting...' : 'Dispatch & Link'}
              </button>
            </div>
          )}
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center py-10 relative">
        <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px` }} className={`relative transition-all duration-300 ${isEditing ? 'ring-8 ring-indigo-500/20' : 'shadow-2xl'}`}>
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="bg-white flex flex-col font-sans text-slate-800 absolute top-0 left-0 p-[80px]">
            
            {/* BRANDING HEADER - CONSOLIDATED LOGIC (NO LOGO = SHOW DETAILS, ELSE LOGO ONLY) */}
            <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-12">
              <div className="w-2/3">
                {userProfile?.branding?.logoUrl ? (
                  <div className="h-24 flex items-center justify-start overflow-hidden">
                    <img src={userProfile.branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain block" crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{userProfile?.companyName}</h2>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight max-w-[320px]">{userProfile?.branding?.address}</p>
                      {userProfile?.branding?.trn && (
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">TRN: {userProfile.branding.trn}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Serial Node</div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                  {isEditing ? (
                    <input className="bg-slate-50 border border-slate-200 p-1 text-right w-32 focus:outline-indigo-500" value={localInvoice.id} onChange={e => { setLocalInvoice({...localInvoice, id: e.target.value.toUpperCase()}); setHasChanges(true); }} />
                  ) : `#${localInvoice.id}`}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-16">
              <div>
                <h1 className="text-7xl font-black uppercase tracking-tighter text-slate-900 leading-none">{localInvoice.type}</h1>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Timestamp</div>
                {isEditing ? (
                  <input type="date" className="bg-slate-50 border border-slate-200 p-1 text-lg font-bold text-slate-900" value={localInvoice.date} onChange={e => { setLocalInvoice({...localInvoice, date: e.target.value}); setHasChanges(true); }} />
                ) : (
                  <span className="text-lg font-black text-slate-900 uppercase">{new Date(localInvoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mb-20">
              <div>
                <h4 className="font-black text-slate-900 mb-6 uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-2">Target Registry (To)</h4>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{client?.name || localInvoice.clientId}</p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest whitespace-pre-wrap leading-relaxed max-w-sm">{client?.address || 'No registered address.'}</p>
                  <p className="text-[11px] text-slate-400 font-bold lowercase tracking-wider mt-2">{client?.email || localInvoice.clientEmail}</p>
                </div>
              </div>
              <div>
                <h4 className="font-black text-slate-900 mb-6 uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-2">Origin Registry (From)</h4>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{userProfile?.fullName}</p>
                  <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest mb-1">{userProfile?.title || 'OPERATIVE'}</p>
                  <p className="text-[11px] text-slate-400 font-bold lowercase tracking-wider mt-2">{userProfile?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="w-full border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-1/2">Service Allocation</span>
                <div className="flex w-1/2 justify-end gap-10">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-16 text-center">Volume</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-24 text-right">Unit Value</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-24 text-right">Node Worth</span>
                   {isEditing && <span className="w-8"></span>}
                </div>
              </div>
              
              <div className="space-y-2">
                {(localInvoice.productList || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 group">
                    <div className="flex-1 pr-10">
                      {isEditing ? (
                        <input className="w-full bg-slate-50 border border-slate-100 p-2 text-lg font-black text-slate-900 uppercase tracking-tight focus:bg-white" value={item.name} onChange={e => updateLocalItem(i, { name: e.target.value.toUpperCase() })} />
                      ) : (
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-10 items-center">
                       <div className="w-16 text-center">{isEditing ? <input type="number" className="w-full bg-slate-50 border border-slate-100 p-2 text-center text-sm font-bold text-slate-900" value={item.quantity} onChange={e => updateLocalItem(i, { quantity: parseInt(e.target.value) || 1 })} /> : <p className="text-sm font-black text-slate-900 tabular-nums">{item.quantity}</p>}</div>
                       <div className="w-24 text-right">{isEditing ? <input type="number" className="w-full bg-slate-50 border border-slate-100 p-2 text-right text-sm font-bold text-slate-900" value={item.price} onChange={e => updateLocalItem(i, { price: parseFloat(e.target.value) || 0 })} /> : <p className="text-sm font-black text-slate-900 tabular-nums">{item.price.toLocaleString()}</p>}</div>
                       <div className="w-24 text-right"><p className="text-lg font-black text-slate-900 tabular-nums">{(item.price * item.quantity).toLocaleString()}</p></div>
                       {isEditing && <button type="button" onClick={() => removeLocalItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                ))}
                {isEditing && <button type="button" onClick={addLocalItem} className="w-full py-4 mt-4 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500/30 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer"><Plus size={14} /> Add Line Item</button>}
              </div>

              <div className="mt-20 border-t-2 border-slate-100 pt-10">
                <div className="flex justify-between items-center pt-8 border-t-4 border-slate-900">
                   <span className="text-xl font-black uppercase tracking-[0.3em]">Gross Worth</span>
                   <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{currencySymbols[localInvoice.currency]}{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-10">
               <div>
                  <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Payment Node Parameters</h5>
                  <div className="space-y-1 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                     <p>Settlement to: {userProfile?.branding?.bankDetails || 'Manual wire.'}</p>
                     <p className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-[0.4em]">Target Date: {new Date(localInvoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end justify-end">
                  {userProfile?.branding?.signatureUrl ? <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 object-contain grayscale opacity-80 mb-4" /> : <div className="h-12 w-48 border-b-2 border-slate-900 mb-4"></div>}
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none">{userProfile?.fullName}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1.5">{userProfile?.title || 'OPERATIVE'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal isOpen={showDiscardConfirm} title="Discard Node Updates?" message="Registry sync failed because changes were not committed. Do you wish to synchronize before closing?" confirmLabel="Save and Sync" onConfirm={() => { handleSaveChanges(); onClose(); setShowDiscardConfirm(false); }} onCancel={() => { setShowDiscardConfirm(false); onClose(); }} variant="primary" />
    </div>,
    document.body
  );
};

export default PdfSlideout;