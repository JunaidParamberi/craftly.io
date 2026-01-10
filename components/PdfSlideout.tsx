import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Loader2, Download, FileText, Edit2, Save, Trash2, Plus,
  MessageSquare, Zap, Mail, Palette
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { httpsCallable } from 'firebase/functions';
import { Invoice, Currency, InvoiceItem, InvoiceTemplate } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Badge } from './ui/Primitives.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemplatePreviewSelector from './ui/TemplatePreviewSelector.tsx';
import EmailModal from './ui/EmailModal.tsx';
import WhatsAppModal from './ui/WhatsAppModal.tsx';
import { renderInvoiceTemplate } from '../utils/pdfTemplates.tsx';
import { functions } from '../services/firebase.ts';

interface PdfSlideoutProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const PdfSlideout: React.FC<PdfSlideoutProps> = ({ invoice, onClose }) => {
  const { userProfile, clients, pushNotification, updateInvoice, showToast } = useBusiness();
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [localInvoice, setLocalInvoice] = useState<Invoice | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoice) {
      setLocalInvoice(JSON.parse(JSON.stringify(invoice)));
      setHasChanges(false);
      // Set template from invoice or user profile default or fallback
      const template = invoice.templateType || userProfile?.branding?.defaultInvoiceTemplate || 'Swiss_Clean';
      setSelectedTemplate(template);
    } else {
      setLocalInvoice(null);
      setHasChanges(false);
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  }, [invoice, userProfile]);

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

  const handleDownloadPdf = async (_autoClose = false): Promise<string | null> => {
    if (!pdfRef.current || !localInvoice) return null;
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
      
      // Get PDF as base64 string for email attachment
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      if (!_autoClose) {
        pdf.save(`${localInvoice.id}.pdf`);
      }
      
      return pdfBase64;
    } catch (e) { 
      console.error(e); 
      return null;
    } finally { 
      setIsExporting(false); 
    }
  };

  const generatePublicToken = () => {
    if (!localInvoice) return '';
    // Generate a unique public token if not exists
    if (!localInvoice.publicToken) {
      const prefix = localInvoice.type === 'LPO' ? 'lpo' : 'inv';
      const token = `${prefix}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      return token;
    }
    return localInvoice.publicToken;
  };

  const getPublicLink = (token?: string) => {
    if (!localInvoice) return '';
    const baseAppUrl = window.location.origin.includes('app.craftlyai.app') 
      ? window.location.origin 
      : (window.location.href.split('#')[0] || 'https://app.craftlyai.app');
    // Use provided token, or get existing one from invoice, or generate one
    const publicToken = token || localInvoice.publicToken || generatePublicToken();
    return `${baseAppUrl}/#/public/invoice/${publicToken}`;
  };

  const getDefaultEmailData = () => {
    if (!localInvoice) return { recipient: '', subject: '', body: '', deepLink: '' };
    
    // Use existing token if available, ensuring consistency with what will be saved
    const publicToken = localInvoice.publicToken || generatePublicToken();
    const publicLink = getPublicLink(publicToken);
    const recipient = localInvoice.clientEmail || client?.email || '';
    const subject = `${localInvoice.type} #${localInvoice.id} from ${userProfile?.companyName || 'CreaftlyAI'}`;
    const body = `Hello ${localInvoice.clientId},\n\nPlease find your ${localInvoice.type} #${localInvoice.id} for the amount of ${localInvoice.currency} ${total.toLocaleString()}.\n\nPUBLIC VIEWING LINK (Anyone with this link can view and download the PDF):\n${publicLink}\n\nBest regards,\n${userProfile?.fullName}\n${userProfile?.companyName}`;
    
    return { recipient, subject, body, deepLink: publicLink };
  };

  const getDefaultWhatsAppData = () => {
    if (!localInvoice) return { phoneNumber: '', message: '' };
    
    const publicLink = getPublicLink();
    const phoneNumber = client?.phone || '';
    const message = `Hello ${localInvoice.clientId},\n\nPlease find your ${localInvoice.type} #${localInvoice.id} for the amount of ${localInvoice.currency} ${total.toLocaleString()}.\n\nPUBLIC VIEWING LINK (Anyone with this link can view and download):\n${publicLink}\n\nBest regards,\n${userProfile?.fullName}\n${userProfile?.companyName}`;
    
    return { phoneNumber, message, deepLink: publicLink };
  };

  const handleTransmit = async () => {
    if (!localInvoice) return;
    
    // Validate recipient
    const recipientEmail = localInvoice.clientEmail || client?.email;
    const recipientPhone = client?.phone;
    
    if (dispatchMode === 'EMAIL') {
      if (!recipientEmail) {
        showToast('No email address found for this client', 'error');
        return;
      }
      // Show email modal instead of sending directly
      setShowEmailModal(true);
      return;
    }
    
    if (dispatchMode === 'WHATSAPP') {
      if (!recipientPhone) {
        showToast('No phone number found for this client', 'error');
        return;
      }
      // Show WhatsApp modal instead of sending directly
      setShowWhatsAppModal(true);
      return;
    }
  };

  const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
    if (!localInvoice) return;
    
    setIsSending(true);
    try {
      // Generate PDF and get base64
      const pdfBase64 = await handleDownloadPdf(true);
      if (!pdfBase64) {
        throw new Error('Failed to generate PDF');
      }

      // Extract token from the invoiceLink in email body if present, or generate/get one
      // This ensures we use the same token that's in the email link the user sees
      let publicToken = localInvoice.publicToken;
      
      // Try to extract token from the email body link if user didn't change it
      const linkMatch = emailData.body.match(/\/public\/invoice\/([a-z0-9-]+)/);
      if (linkMatch && linkMatch[1]) {
        publicToken = linkMatch[1];
      }
      
      // If still no token, generate one
      if (!publicToken) {
        const prefix = localInvoice.type === 'LPO' ? 'lpo' : 'inv';
        publicToken = `${prefix}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      }

      // Build public link using the token we'll save (ensure it matches what's in email)
      const baseAppUrl = window.location.origin.includes('app.craftlyai.app') 
        ? window.location.origin 
        : 'https://app.craftlyai.app';
      const publicLink = `${baseAppUrl}/#/public/invoice/${publicToken}`;

      // CRITICAL: Ensure invoice has public token and is marked as public BEFORE sending email
      // This makes the invoice accessible via public link
      // Update invoice FIRST, wait for it to complete, then send email
      const updatedInvoice = {
        ...localInvoice,
        publicToken,
        isPublic: true,
        status: 'Sent' as const
      };
      
      // Wait for update to complete before proceeding
      await updateInvoice(updatedInvoice);
      // Update local state immediately
      setLocalInvoice(updatedInvoice);
      // Wait a bit more to ensure Firestore write is fully propagated
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send via Email API with PDF attachment
      const sendInvoiceEmail = httpsCallable(functions, 'sendInvoiceEmail');
      const result = await sendInvoiceEmail({
        invoiceId: localInvoice.id,
        recipientEmail: emailData.to,
        pdfBase64,
        pdfFileName: `${localInvoice.id}.pdf`,
        invoiceLink: publicLink,
        subject: emailData.subject,
        body: emailData.body,
        senderEmail: userProfile?.email || '',
        senderName: userProfile?.fullName || userProfile?.companyName || '',
        publicToken // Pass the token so function uses the same one
      });
      
      const data = result.data as any;
      if (data.success) {
        showToast('Invoice email sent with PDF attachment', 'success');
        
        // Ensure invoice status is updated (already done above, but double-check)
        if (localInvoice.status !== 'Sent') {
          await updateInvoice({ ...localInvoice, status: 'Sent' });
        }
        
        pushNotification({ 
          title: 'Invoice Dispatched', 
          description: `${localInvoice.id} sent to ${emailData.to} with PDF attachment.`, 
          type: 'finance' 
        });
        
        // Copy link to clipboard after successful send
        try {
          await navigator.clipboard.writeText(publicLink);
        } catch (clipError) {
          console.warn('Clipboard copy failed:', clipError);
        }
        
        setShowEmailModal(false);
      } else {
        throw new Error(data.message || 'Email sending failed');
      }
    } catch (error: any) {
      console.error('Email error:', error);
      
      // Check for specific error types and show appropriate message
      let errorMessage = error.message || 'Failed to send email';
      
      if (error.code === 'functions/unavailable' || error.code === 'functions/not-found') {
        errorMessage = 'Function not deployed. Please deploy Firebase Functions first.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.code === 'functions/failed-precondition' || error.message?.includes('SMTP') || error.message?.includes('email service not configured')) {
        errorMessage = 'Email service not configured. Please set SMTP credentials in Firebase Functions.';
        // Also show toast for this important message
        showToast('Email service not configured. Using fallback method.', 'warning');
        
        // Fallback to mailto: link
        const url = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        window.location.href = url;
        
        // Also download PDF for manual attachment
        if (pdfRef.current) {
          try {
            const pdf = new jsPDF();
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save(`${localInvoice.id}.pdf`);
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
          }
        }
      } else if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
        errorMessage = 'CORS error: Function may not be deployed. Deploy functions first.';
      }
      
      throw new Error(errorMessage); // Re-throw to show error in modal
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async (whatsappData: { phoneNumber: string; message: string }) => {
    if (!localInvoice) return;
    
    setIsSending(true);
    try {
      const publicToken = generatePublicToken();

      // Ensure invoice has public token and is marked as public before sending
      // This makes the invoice accessible via public link
      if (!localInvoice.publicToken || !localInvoice.isPublic) {
        const updatedInvoice = {
          ...localInvoice,
          publicToken,
          isPublic: true,
          status: 'Sent' as const
        };
        await updateInvoice(updatedInvoice);
        // Update local state
        setLocalInvoice(updatedInvoice);
      }

      // Send via WhatsApp API
      const sendWhatsApp = httpsCallable(functions, 'sendWhatsAppMessage');
      const result = await sendWhatsApp({
        phoneNumber: whatsappData.phoneNumber,
        message: whatsappData.message,
        invoiceId: localInvoice.id
      });
      
      const data = result.data as any;
      
      // WhatsApp function always returns a web link (Twilio is optional)
      if (data.whatsappLink) {
        // Open WhatsApp web
        window.open(data.whatsappLink, '_blank');
        showToast('WhatsApp link opened', 'success');
        
        // Ensure invoice status is updated (already done above, but double-check)
        if (localInvoice.status !== 'Sent') {
          await updateInvoice({ ...localInvoice, status: 'Sent' });
        }
        
        pushNotification({ 
          title: 'Invoice Dispatched', 
          description: `${localInvoice.id} sent via WhatsApp with public link.`, 
          type: 'finance' 
        });
        
        setShowWhatsAppModal(false);
      } else {
        throw new Error('Failed to generate WhatsApp link');
      }
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      
      // Fallback to WhatsApp web on any error
      const cleanPhone = whatsappData.phoneNumber.replace(/[^\d]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappData.message)}`;
      window.open(url, '_blank');
      
      // Ensure invoice has public token and is public (for the link in message)
      const fallbackToken = generatePublicToken();
      if (!localInvoice.publicToken || !localInvoice.isPublic) {
        const updatedInvoice = {
          ...localInvoice,
          publicToken: localInvoice.publicToken || fallbackToken,
          isPublic: true,
          status: 'Sent' as const
        };
        await updateInvoice(updatedInvoice);
        setLocalInvoice(updatedInvoice);
      } else if (localInvoice.status !== 'Sent') {
        await updateInvoice({ ...localInvoice, status: 'Sent' });
      }
      
      pushNotification({ 
        title: 'Invoice Dispatched', 
        description: `${localInvoice.id} sent via WhatsApp with public link.`, 
        type: 'finance' 
      });
      
      showToast('WhatsApp web opened', 'info');
      setShowWhatsAppModal(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveChanges = () => {
    if (localInvoice) {
      updateInvoice({
        ...localInvoice,
        templateType: selectedTemplate || localInvoice.templateType,
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
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0B]/95 flex flex-col overflow-hidden w-full" style={{ alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <header className="h-16 sm:h-20 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 gap-4 w-full">
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
          <button type="button" onClick={handleCloseAttempt} className="p-2 hover:bg-white/10 rounded-lg text-white transition-all cursor-pointer flex-shrink-0">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FileText size={18} className="text-indigo-400 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white truncate">{localInvoice.id}</h3>
            {isEditing && <Badge variant="warning" className="ml-2 flex-shrink-0">Editing</Badge>}
            {hasChanges && <span className="text-[10px] text-amber-500 font-bold ml-2 flex-shrink-0 whitespace-nowrap">• Unsaved</span>}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center flex-shrink-0 ml-auto">
          {isEditing ? (
            <>
              <button type="button" onClick={handleSaveChanges} className="h-10 px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap">
                <Save size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Save</span>
              </button>
              <button type="button" onClick={() => { if(hasChanges) setShowDiscardConfirm(true); else setIsEditing(false); }} className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-widest">Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => handleDownloadPdf()} className="h-10 px-4 sm:px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Download PDF</span>
                <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">PDF</span>
              </button>
              <button type="button" onClick={() => setIsEditing(true)} className="h-10 px-4 sm:px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <Edit2 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
              </button>
              {!isEditing && selectedTemplate && (
                <TemplatePreviewSelector
                  value={selectedTemplate}
                  onChange={(newTemplate) => {
                    setSelectedTemplate(newTemplate);
                    if (localInvoice) {
                      setLocalInvoice({ ...localInvoice, templateType: newTemplate });
                      setHasChanges(true);
                    }
                  }}
                  type="invoice"
                  compact={true}
                  userProfile={userProfile}
                  client={client || undefined}
                  sampleInvoice={localInvoice ? {
                    id: localInvoice.id,
                    type: localInvoice.type,
                    productList: localInvoice.productList,
                    currency: localInvoice.currency,
                    date: localInvoice.date,
                    dueDate: localInvoice.dueDate,
                    clientId: localInvoice.clientId,
                    clientEmail: localInvoice.clientEmail
                  } : undefined}
                />
              )}
            </>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 p-1 rounded-xl border border-white/5 flex-shrink-0">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all flex-shrink-0 ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="Email Dispatch"><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all flex-shrink-0 ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="WhatsApp Dispatch"><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />
              <button 
                onClick={handleTransmit} 
                disabled={isSending}
                className={`h-10 px-4 sm:px-6 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 sm:gap-3 shadow-2xl flex-shrink-0 whitespace-nowrap ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                <span className="hidden sm:inline">{isSending ? 'Transmitting...' : 'Dispatch & Link'}</span>
                <span className="sm:hidden">{isSending ? 'Sending...' : 'Dispatch'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center py-10 relative">
        <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px` }} className={`relative transition-all duration-300 ${isEditing ? 'ring-8 ring-indigo-500/20' : 'shadow-2xl'}`}>
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="absolute top-0 left-0">
            {selectedTemplate && localInvoice ? renderInvoiceTemplate(selectedTemplate, {
              invoice: localInvoice,
              userProfile,
              client,
              total,
              isEditing,
              onItemUpdate: isEditing ? updateLocalItem : undefined
            }) : <div className="w-full h-full bg-white flex items-center justify-center"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>}
          </div>
        </div>
      </div>

      <ConfirmationModal isOpen={showDiscardConfirm} title="Discard Node Updates?" message="Registry sync failed because changes were not committed. Do you wish to synchronize before closing?" confirmLabel="Save and Sync" onConfirm={() => { handleSaveChanges(); onClose(); setShowDiscardConfirm(false); }} onCancel={() => { setShowDiscardConfirm(false); onClose(); }} variant="primary" />
      
      {/* Email Modal */}
      {localInvoice && (() => {
        const { recipient, subject, body, deepLink } = getDefaultEmailData();
        return (
          <EmailModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSend={handleSendEmail}
            recipient={recipient}
            subject={subject}
            body={body}
            invoiceId={localInvoice.id}
            invoiceLink={deepLink}
          />
        );
      })()}
      
      {/* WhatsApp Modal */}
      {localInvoice && (() => {
        const { phoneNumber, message, deepLink } = getDefaultWhatsAppData();
        return (
          <WhatsAppModal
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            onSend={handleSendWhatsApp}
            phoneNumber={phoneNumber}
            message={message}
            invoiceId={localInvoice.id}
            invoiceLink={deepLink}
          />
        );
      })()}
    </div>,
    document.body
  );
};

export default PdfSlideout;