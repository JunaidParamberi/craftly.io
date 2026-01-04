
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, CheckCircle2, Loader2, Download, FileText, Mail, MessageSquare, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, Currency } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';

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
  const pdfRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const client = useMemo(() => clients.find(c => c.id === proposal?.clientId || c.name === proposal?.clientName), [clients, proposal]);

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

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !proposal) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${proposal.id}_Manifesto.pdf`);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (error) {
      console.error('Proposal PDF Failed', error);
    } finally { setIsExporting(false); }
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
    } catch (err) { console.error('Clipboard sync failed', err); }
    return false;
  };

  const handleSend = async () => {
    if (!proposal) return;
    setIsSending(true);
    
    try {
      const synced = await syncToClipboard();
      if (!synced) showToast('Clipboard sync failed', 'error');

      const subject = `Strategic Manifesto: ${proposal.title} | ${userProfile.companyName}`;
      const body = `Hello ${proposal.clientName},\n\nPlease find attached the strategic manifesto for "${proposal.title}". We look forward to initializing this node.\n\n(Note: The document has been copied to your clipboard. Simply hit Ctrl+V in this message to attach the visual copy.)`;

      if (dispatchMode === 'WHATSAPP' && client?.phone) {
        const url = `https://wa.me/${client.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
      } else {
        const url = `mailto:${client?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
      }

      const updated = { ...proposal, status: 'Sent' as const };
      updateProposal(updated);
      pushNotification({ title: 'Manifesto Dispatched', description: `Syncing ${proposal.id} to terminal.`, type: 'finance' });
      showToast('Payload Ready to Paste (Ctrl+V)', 'info');
    } finally {
      setIsSending(false);
    }
  };

  if (!proposal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0B]/95 flex flex-col animate-enter overflow-hidden">
      <header className="h-16 sm:h-20 bg-[#0A0A0B] border-b border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl text-white/70 hover:text-white transition-all"><X size={22} /></button>
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText size={16} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Project Manifesto</h3>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           <button onClick={handleDownloadPdf} disabled={isExporting} className="h-10 px-5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all flex items-center gap-2 border border-white/5">
             {isExporting ? <Loader2 size={14} className="animate-spin" /> : exportDone ? <CheckCircle2 size={14} className="text-emerald-500" /> : null}
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Export</span>
           </button>
           
           <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
              <button onClick={() => setDispatchMode('EMAIL')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'EMAIL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><Mail size={16}/></button>
              <button onClick={() => setDispatchMode('WHATSAPP')} className={`p-2 rounded-lg transition-all ${dispatchMode === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'}`}><MessageSquare size={16}/></button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleSend}
                disabled={isSending || proposal.status === 'Accepted'}
                className={`h-10 px-8 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${isSending ? 'bg-indigo-500 animate-pulse' : dispatchMode === 'WHATSAPP' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white`}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                <span className="uppercase tracking-[0.2em]">
                   {isSending ? 'Syncing...' : 'Dispatch & Sync'}
                </span>
              </button>
           </div>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#E5E7EB] flex flex-col items-center py-12 px-4 relative">
        {isSending && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center gap-6 animate-pop-in text-white">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-2xl animate-pulse"><Zap size={32} /></div>
                <div className="text-center">
                   <h4 className="text-sm font-black uppercase tracking-widest">Manifesto Terminal Sync</h4>
                   <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">Visual asset copying to clipboard for transmission</p>
                </div>
             </div>
          </div>
        )}

        <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px` }} className="relative shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-500">
          <div ref={pdfRef} style={{ width: '794px', minHeight: '1123px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }} className="bg-white flex flex-col font-sans text-[#1A1A1C] absolute top-0 left-0 p-[80px]">
            <div className="flex justify-between items-start mb-20">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[#1A1A1C] mb-2 leading-none">{userProfile.companyName}</h2>
                <p className="text-[10px] font-black text-[#8A8A8E] uppercase tracking-[0.25em]">Project Proposal • {proposal.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-tight text-[#1A1A1C]">{userProfile.companyName}</p>
                <p className="text-[10px] font-bold text-[#8A8A8E] mt-1.5 lowercase tracking-wider opacity-80">{userProfile.website.replace('https://', '').replace('http://', '')}</p>
              </div>
            </div>

            <div className="mb-24">
              <h1 className="text-[64px] font-black text-[#1A1A1C] uppercase tracking-[-0.03em] leading-[0.9] mb-8">{proposal.title}</h1>
              <div className="h-2 w-36 bg-indigo-500 rounded-sm"></div>
            </div>

            <div className="grid grid-cols-12 gap-10 mb-20 pb-20 border-b border-[#F0F0F2]">
              <div className="col-span-7">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-6 opacity-90">Prepared for:</p>
                <h4 className="text-[32px] font-black text-[#1A1A1C] uppercase leading-tight mb-3 tracking-tight">{proposal.clientName}</h4>
                <p className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-[0.1em]">{proposal.industry} Sector</p>
              </div>
              <div className="col-span-5 flex flex-col justify-center">
                <div className="border-2 border-indigo-400/40 rounded-sm p-10 flex flex-col items-center justify-center text-center space-y-4 bg-indigo-50/20">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] opacity-70">Timeline & Budget:</p>
                  <p className="text-sm font-black text-[#1A1A1C] uppercase tracking-tight tabular-nums">{proposal.startDate} — {proposal.timeline}</p>
                  <p className="text-[28px] font-black text-indigo-600 tracking-[-0.02em] leading-none">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-16">
              <div>
                <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.4em] mb-8">Execution Narrative</h4>
                <div className="text-[15px] text-[#4A4A4E] leading-[1.7] whitespace-pre-wrap font-medium">{proposal.aiDraftContent || 'This document outlines the strategic implementation for the requested project nodes.'}</div>
              </div>

              {proposal.items && proposal.items.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.4em] mb-8">Service Allocation</h4>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-[#1A1A1C]">
                        <th className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-[#8A8A8E]">Description</th>
                        <th className="py-5 text-right font-black uppercase text-[10px] tracking-[0.2em] text-[#8A8A8E]">Node Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F2]">
                      {proposal.items.map((item, i) => (
                        <tr key={i} className="group">
                          <td className="py-6 font-black uppercase text-sm text-[#1A1A1C] tracking-tight">{item.name}</td>
                          <td className="py-6 text-right font-black text-sm text-[#1A1A1C] tabular-nums">{currencySymbols[proposal.currency]}{item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#FAFAFB]">
                        <td className="py-8 px-6 font-black uppercase text-[10px] tracking-[0.3em] text-[#8A8A8E]">Gross Mission Worth</td>
                        <td className="py-8 px-6 text-right font-black text-2xl text-indigo-600 tracking-tighter tabular-nums">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-20 pt-16 border-t border-[#F0F0F2]">
              <div className="flex justify-between items-end">
                <div className="w-[300px]">
                  <p className="text-[9px] font-black text-[#B0B0B4] uppercase tracking-[0.4em] mb-10">Approved for Activation by</p>
                  <div className="h-[1px] w-full bg-[#D1D1D6] mb-4"></div>
                  <p className="text-[10px] font-black text-[#D1D1D6] uppercase tracking-[0.2em]">Client Authority Node</p>
                </div>
                <div className="text-right">
                  {userProfile.branding.signatureUrl ? <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 object-contain grayscale opacity-60 mb-6 ml-auto" /> : <div className="h-12 w-32 border-b border-[#F0F0F2] mb-6 ml-auto opacity-30"></div>}
                  <p className="text-lg font-black text-[#1A1A1C] uppercase tracking-tight">{userProfile.fullName}</p>
                  <p className="text-[10px] font-black text-[#B0B0B4] uppercase tracking-[0.3em] mt-1">Lead Executive Lead</p>
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
