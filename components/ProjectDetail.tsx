
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Building2, Calendar, Target, 
  Cpu, Layout, Layers, CreditCard, Sparkles, Clock, ArrowRight,
  FileText, Send
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Card, Badge, Button } from './ui/Primitives.tsx';
import ProposalPdfSlideout from './ProposalPdfSlideout.tsx';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proposals, convertProposalToLPO, invoices } = useBusiness();
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const proposal = useMemo(() => proposals.find(p => p.id === id), [id, proposals]);
  const linkedLPO = useMemo(() => invoices.find(i => i.linkedProposalId === id && i.type === 'LPO'), [id, invoices]);

  if (!proposal) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Cpu size={64} className="text-rose-500 mb-6 opacity-20" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">Project Not Found</h3>
        <p className="text-slate-500 mt-4 uppercase text-[10px] tracking-widest">The project you are looking for does not exist.</p>
        <Button onClick={() => navigate('/projects')} className="mt-10" icon={ChevronLeft}>Back to Projects</Button>
      </div>
    );
  }

  const duration = useMemo(() => {
    const start = new Date(proposal.startDate);
    const end = new Date(proposal.timeline);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [proposal]);

  const handleReceiveLPO = () => {
    convertProposalToLPO(proposal);
    navigate('/lpo');
  };

  return (
    <div className="space-y-10 animate-enter pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--accent)] transition-colors">
            <ChevronLeft size={14} /> Back to List
          </button>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={proposal.status === 'Accepted' ? 'success' : proposal.status === 'Sent' ? 'warning' : 'info'}>
                {proposal.status === 'Accepted' ? 'Active' : proposal.status}
              </Badge>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project ID: {proposal.id}</span>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{proposal.title}</h2>
            <div className="flex items-center gap-4 mt-6">
               <Building2 size={18} className="text-[var(--accent)]" />
               <span className="text-lg font-black uppercase tracking-tight">{proposal.clientName}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           {proposal.status !== 'Accepted' && (
             <Button variant="outline" className="h-14" onClick={() => setIsPdfOpen(true)} icon={Send}>Send Proposal</Button>
           )}
           
           {!linkedLPO ? (
             <Button className="h-14 shadow-xl bg-amber-600 hover:bg-amber-500 border-none" onClick={handleReceiveLPO} icon={FileText}>Create PO</Button>
           ) : (
             <Button variant="ghost" className="h-14 bg-emerald-500/10 text-emerald-500" onClick={() => navigate(`/lpo/${linkedLPO.id}`)} icon={FileText}>View Linked PO</Button>
           )}
           
           <Button variant="outline" className="h-14" icon={Layout} onClick={() => setIsPdfOpen(true)}>View PDF</Button>
           <Button className="h-14 shadow-2xl" icon={CreditCard} onClick={() => navigate('/invoices')}>Create Invoice</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {linkedLPO && (
             <Card className="p-8 bg-emerald-500/[0.03] border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><FileText size={20}/></div>
                   <div>
                      <h4 className="text-xs font-black uppercase">Purchase Order Linked</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ref No: {linkedLPO.id}</p>
                   </div>
                </div>
                <Button size="sm" variant="ghost" icon={ArrowRight} onClick={() => navigate(`/lpo/${linkedLPO.id}`)}>Open PO</Button>
             </Card>
           )}

           <Card className="p-10 space-y-8">
              <div className="flex items-center gap-4 text-indigo-500 border-b border-[var(--border-ui)] pb-6">
                 <Target size={24} />
                 <h4 className="text-xs font-black uppercase tracking-[0.4em]">Project Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-10">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Industry / Sector</p>
                       <p className="text-sm font-black uppercase">{proposal.industry}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Project Description</p>
                       <p className="text-sm font-medium leading-relaxed opacity-80">{proposal.scope || 'No description provided.'}</p>
                    </div>
                 </div>
                 <div className="space-y-10">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Timeline</p>
                       <div className="flex items-center gap-4">
                          <Calendar size={16} className="text-indigo-400" />
                          <span className="text-sm font-black tabular-nums">{proposal.startDate} — {proposal.timeline}</span>
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Services</p>
                       <div className="flex items-center gap-4">
                          <Layers size={16} className="text-indigo-400" />
                          <span className="text-sm font-black uppercase">{proposal.items.length} Items Listed</span>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-10 bg-indigo-500/[0.02] border-indigo-500/10">
              <div className="flex items-center gap-4 text-indigo-500 mb-8">
                 <Sparkles size={24} />
                 <h4 className="text-xs font-black uppercase tracking-[0.4em]">Project Brief</h4>
              </div>
              <p className="text-sm font-medium leading-loose text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {proposal.aiDraftContent || 'Brief details will appear here once generated.'}
              </p>
              {!proposal.aiDraftContent && (
                <Button variant="ghost" className="mt-10 border-indigo-500/20" icon={Cpu}>Create AI Brief</Button>
              )}
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="p-10 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <CreditCard size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-4">Project Budget</p>
              <p className="text-5xl font-black tabular-nums tracking-tighter mb-8">AED {proposal.budget.toLocaleString()}</p>
              <div className="h-px bg-white/10 my-8" />
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                 <span className="opacity-40">Billing Type</span>
                 <span className="text-indigo-400">{proposal.billingType}</span>
              </div>
           </Card>

           <Card className="p-10 space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                <Clock size={14} /> Time Remaining
              </h5>
              <div className="space-y-4">
                 <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span>Days Left</span>
                    <span className="text-indigo-500">{duration} Days</span>
                 </div>
                 <div className="h-2 bg-[var(--bg-canvas)] rounded-full overflow-hidden border border-[var(--border-ui)]">
                    <div className="h-full bg-indigo-500 w-[100%]" />
                 </div>
              </div>
           </Card>

           <div className="p-10 exec-card border-dashed border-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[var(--accent)] transition-all">
              <Cpu size={32} className="text-slate-400 mb-4 group-hover:text-[var(--accent)] transition-all" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[var(--accent)]">Sync Changes</p>
           </div>
        </div>
      </div>

      <ProposalPdfSlideout 
        proposal={isPdfOpen ? proposal : null} 
        onClose={() => setIsPdfOpen(false)} 
      />
    </div>
  );
};

export default ProjectDetail;
