import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Loader2, Download, 
  FileText, Mail, MessageSquare, Zap, Link as LinkIcon, Check, AlertCircle, Palette } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, Currency, InvoiceTemplate } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Badge } from './ui/Primitives.tsx';
import TemplatePreviewSelector from './ui/TemplatePreviewSelector.tsx';
import { renderProposalTemplate } from '../utils/pdfTemplates.tsx';

interface ProposalPdfSlideoutProps {
  proposal: Proposal | null;
  onClose: () => void;
}

const ProposalPdfSlideout: React.FC<ProposalPdfSlideoutProps> = ({ proposal, onClose }) => {
  const { updateProposal, pushNotification, clients, userProfile, showToast } = useBusiness();
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [dispatchMode, setDispatchMode] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const client = useMemo(() => {
    if (!proposal) return null;
    return clients.find(c => c.id === proposal.clientId) || 
           clients.find(c => c.name === proposal.clientName);
  }, [clients, proposal]);

  useEffect(() => {
    if (proposal) {
      const template = proposal.templateType || userProfile?.branding?.defaultProposalTemplate || 'Swiss_Clean';
      setSelectedTemplate(template);
    } else {
      setSelectedTemplate(null);
    }
  }, [proposal, userProfile]);

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
  }, [proposal]);

  const handleDownloadPdf = async (silent = false): Promise<boolean> => {
    if (!pdfRef.current || !proposal) return false;
    if (!silent) setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`${proposal.id}_Manifesto.pdf`);
      if (!silent) {
        setExportDone(true);
        setTimeout(() => setExportDone(false), 3000);
      }
      return true;
    } catch (error) {
      console.error('Proposal PDF Failed', error);
      if (!silent) showToast('PDF Synthesis Failed', 'error');
      return false;
    } finally { 
      if (!silent) setIsExporting(false); 
    }
  };

  const copyOnlyLink = async () => {
    if (!proposal) return;
    const baseAppUrl = window.location.href.split('#')[0];
    const deepLink = `${baseAppUrl}#/projects/${proposal.id}`;
    await navigator.clipboard.writeText(deepLink);
    setCopiedLink(true);
    showToast('Digital Link Copied');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSend = async () => {
    if (!proposal) return;
    if (dispatchMode === 'EMAIL' && !client?.email) {
      showToast('No email registered for this node', 'error');
      return;
    }
    if (dispatchMode === 'WHATSAPP' && !client?.phone) {
      showToast('No phone registered for this node', 'error');
      return;
    }

    setIsSending(true);
    try {
      const baseAppUrl = window.location.href.split('#')[0];
      const deepLink = `${baseAppUrl}#/projects/${proposal.id}`;
      await navigator.clipboard.writeText(deepLink);

      const subject = `Strategic Manifesto: ${proposal.title} | ${userProfile?.companyName || 'Proposal'}`;
      const body = `Hello ${proposal.clientName},\n\nPlease find the strategic manifesto for "${proposal.title}" attached for your review.\n\nDIGITAL PORTAL LINK:\n${deepLink}\n\n(Note: I am sending the PDF version as well. You can also access the full scope via the link above.)\n\nBest regards,\n${userProfile?.fullName}\n${userProfile?.companyName}`;

      if (dispatchMode === 'WHATSAPP') {
        const waUrl = `https://wa.me/${(client?.phone || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
        window.open(waUrl, '_blank');
      } else {
        const mailtoUrl = `mailto:${client?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      }

      if (proposal.status === 'Draft') {
        updateProposal({ ...proposal, status: 'Sent' as const });
      }
      
      pushNotification({ title: 'Manifesto Dispatched', description: `Syncing ${proposal.id} via link & PDF.`, type: 'finance' });
      showToast('Dispatch Handshake Initiated', 'success');
      handleDownloadPdf(true).catch(err => console.warn("Silent PDF download failed", err));
    } catch (err) {
      console.error("Dispatch Error", err);
      showToast('Dispatch Sequence Error', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!proposal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0B]/95 flex flex-col animate-enter overflow-hidden w-full">
      <header className="h-16 sm:h-20 bg-[#0A0A0B] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 gap-4 w-full">
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 min-w-0">
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer flex-shrink-0"><X size={22} /></button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0"><FileText size={16} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 whitespace-nowrap">Project Manifesto</h3>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center flex-shrink-0 ml-auto">
           {!client?.email && !client?.phone && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 flex-shrink-0 whitespace-nowrap">
               <AlertCircle size={14} />
               <span className="text-[8px] font-black uppercase">Missing Registry Data</span>
             </div>
           )}

           <button onClick={() => handleDownloadPdf()} disabled={isExporting} className="h-10 px-4 sm:px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all flex items-center gap-2 border border-white/5 cursor-pointer whitespace-nowrap flex-shrink-0">
             {isExporting ? <Loader2 size={14} className="animate-spin" /> : exportDone ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Download size={14} />}
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">PDF</span>
           </button>

           <button onClick={copyOnlyLink} className="h-10 px-4 sm:px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all flex items-center gap-2 border border-white/5 cursor-pointer whitespace-nowrap flex-shrink-0">
             {copiedLink ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} />}
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Link</span>
           </button>
           
           {selectedTemplate && proposal && (
             <TemplatePreviewSelector
               value={selectedTemplate}
               onChange={(newTemplate) => {
                 setSelectedTemplate(newTemplate);
                 if (proposal) {
                   updateProposal({ ...proposal, templateType: newTemplate });
                 }
               }}
               type="proposal"
               compact={true}
               userProfile={userProfile}
               client={client || undefined}
               sampleProposal={{
                 title: proposal.title,
                 clientName: proposal.clientName,
                 industry: proposal.industry,
                 scope: proposal.scope,
                 items: proposal.items,
                 startDate: proposal.startDate,
                 timeline: proposal.timeline,
                 budget: proposal.budget,
                 currency: proposal.currency,
                 aiDraftContent: proposal.aiDraftContent
               }}
             />
           )}
           
           <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 p-1 rounded-xl border border-white/5 flex-shrink-0">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all cursor-pointer flex-shrink-0 ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="Email Dispatch"><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all cursor-pointer flex-shrink-0 ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="WhatsApp Dispatch"><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />
              <button 
                onClick={handleSend}
                disabled={isSending || proposal.status === 'Accepted'}
                className={`h-10 px-4 sm:px-8 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-2xl cursor-pointer flex-shrink-0 whitespace-nowrap ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                <span className="uppercase tracking-[0.2em]">
                   {isSending ? 'Sending...' : 'Dispatch'}
                </span>
              </button>
           </div>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#E5E7EB] flex flex-col items-center py-12 px-4 relative">
        <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px` }} className="relative shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-500">
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="absolute top-0 left-0">
            {selectedTemplate && proposal ? renderProposalTemplate(selectedTemplate, {
              proposal,
              userProfile,
              client,
              total: proposal.budget
            }) : <div className="w-full h-full bg-white flex items-center justify-center"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProposalPdfSlideout;