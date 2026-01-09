import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, CheckCircle2, Loader2, Download, 
  FileText, Mail, MessageSquare, Zap, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, Currency } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Button, Badge } from './ui/Primitives.tsx';

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
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const client = useMemo(() => {
    if (!proposal) return null;
    return clients.find(c => c.id === proposal.clientId) || 
           clients.find(c => c.name === proposal.clientName);
  }, [clients, proposal]);

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
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0B]/95 flex flex-col animate-enter overflow-hidden">
      <header className="h-16 sm:h-20 bg-[#0A0A0B] border-b border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"><X size={22} /></button>
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText size={16} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Project Manifesto</h3>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           {!client?.email && !client?.phone && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
               <AlertCircle size={14} />
               <span className="text-[8px] font-black uppercase">Missing Registry Data</span>
             </div>
           )}

           <button onClick={() => handleDownloadPdf()} disabled={isExporting} className="h-10 px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all flex items-center gap-2 border border-white/5 cursor-pointer">
             {isExporting ? <Loader2 size={14} className="animate-spin" /> : exportDone ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Download size={14} />}
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">PDF</span>
           </button>

           <button onClick={copyOnlyLink} className="h-10 px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all flex items-center gap-2 border border-white/5 cursor-pointer">
             {copiedLink ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} />}
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Link</span>
           </button>
           
           <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all cursor-pointer ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="Email Dispatch"><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all cursor-pointer ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} title="WhatsApp Dispatch"><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleSend}
                disabled={isSending || proposal.status === 'Accepted'}
                className={`h-10 px-8 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl cursor-pointer ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
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
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="bg-white flex flex-col font-sans text-[#1A1A1C] absolute top-0 left-0 p-[80px]">
            
            {/* CONSOLIDATED PROPOSAL HEADER (LOGO OR TEXT DETAILS XOR) */}
            <div className="flex justify-between items-start mb-20 border-b-2 border-slate-100 pb-12">
              <div className="flex-1 min-w-0">
                {userProfile?.branding?.logoUrl ? (
                  <div className="h-24 flex items-center justify-start overflow-hidden">
                    <img 
                      src={userProfile.branding.logoUrl} 
                      alt="Logo" 
                      className="max-h-full max-w-full object-contain block" 
                      crossOrigin="anonymous" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A1C] leading-none mb-4">{userProfile?.companyName}</h2>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-[#8A8A8E] font-bold uppercase tracking-widest leading-tight max-w-[320px]">{userProfile?.branding?.address}</p>
                      {userProfile?.branding?.trn && (
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">TRN: {userProfile.branding.trn}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-black text-[#8A8A8E] uppercase tracking-[0.3em] mb-2">Registry Trace</div>
                <p className="text-xl font-black text-[#1A1A1C] uppercase tracking-tight">{proposal.id}</p>
                <p className="text-[9px] font-bold text-[#8A8A8E] mt-2 lowercase tracking-wider opacity-80">{userProfile?.website?.replace('https://', '').replace('http://', '')}</p>
              </div>
            </div>

            <div className="mb-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em]">Project Manifesto</h4>
              </div>
              <h1 className="text-[64px] font-black text-[#1A1A1C] uppercase tracking-[-0.04em] leading-[0.9] mb-8">{proposal.title}</h1>
            </div>

            <div className="grid grid-cols-12 gap-10 mb-20 pb-20 border-b border-[#F0F0F2]">
              <div className="col-span-7">
                <p className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.3em] mb-6">Client Objective Node:</p>
                <h4 className="text-[36px] font-black text-[#1A1A1C] uppercase leading-tight mb-4 tracking-tight">{proposal.clientName}</h4>
                <div className="flex items-center gap-4">
                  <Badge variant="info" className="!bg-slate-100 !text-slate-600 !border-none !text-[9px]">{proposal.industry}</Badge>
                  <span className="text-[10px] font-bold text-[#8A8A8E] uppercase tracking-widest">Sector Deployment</span>
                </div>
              </div>
              <div className="col-span-5">
                <div className="bg-slate-50 rounded-[2rem] p-10 flex flex-col space-y-6 border border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 opacity-70">Mission Timeline</p>
                    <p className="text-sm font-black text-[#1A1A1C] uppercase tracking-tight tabular-nums">{proposal.startDate} — {proposal.timeline}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 opacity-70">Strategic Worth</p>
                    <p className="text-3xl font-black text-indigo-600 tracking-[-0.03em] leading-none tabular-nums">
                      {currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-20">
              <div>
                <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.5em] mb-8 border-b border-slate-50 pb-4">Execution Logic</h4>
                <div className="text-[16px] text-[#4A4A4E] leading-[1.8] whitespace-pre-wrap font-medium">{proposal.aiDraftContent || 'This document outlines the strategic implementation for the requested project nodes.'}</div>
              </div>

              {proposal.items && proposal.items.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.5em] mb-8 border-b border-slate-50 pb-4">Resource Allocation</h4>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-[#1A1A1C]">
                        <th className="py-5 font-black uppercase text-[10px] tracking-[0.3em] text-[#8A8A8E]">Deployment Module</th>
                        <th className="py-5 text-right font-black uppercase text-[10px] tracking-[0.3em] text-[#8A8A8E]">Node Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F2]">
                      {proposal.items.map((item, i) => (
                        <tr key={i} className="group">
                          <td className="py-6 font-black uppercase text-base text-[#1A1A1C] tracking-tight">{item.name}</td>
                          <td className="py-6 text-right font-black text-base text-[#1A1A1C] tabular-nums">
                            {currencySymbols[proposal.currency]}{item.price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-900 text-white">
                        <td className="py-10 px-8 font-black uppercase text-[12px] tracking-[0.4em]">Gross Mission Worth</td>
                        <td className="py-10 px-8 text-right font-black text-3xl tracking-tighter tabular-nums">
                          {currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-24 pt-16 border-t-2 border-slate-100">
              <div className="flex justify-between items-end">
                <div className="w-[320px]">
                  <p className="text-[10px] font-black text-[#B0B0B4] uppercase tracking-[0.4em] mb-12">Authorized for Activation by</p>
                  <div className="h-[2px] w-full bg-[#1A1A1C] mb-4"></div>
                  <p className="text-[11px] font-black text-[#1A1A1C] uppercase tracking-[0.3em]">Client Strategic Node</p>
                </div>
                <div className="text-right">
                  {userProfile?.branding?.signatureUrl ? (
                    <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-14 object-contain grayscale opacity-80 mb-6 ml-auto" crossOrigin="anonymous" />
                  ) : (
                    <div className="h-14 w-40 border-b-2 border-slate-200 mb-6 ml-auto opacity-30"></div>
                  )}
                  <p className="text-xl font-black text-[#1A1A1C] uppercase tracking-tight leading-none">{userProfile?.fullName}</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-2">{userProfile?.title || 'STRATEGIC OPERATIVE'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProposalPdfSlideout;