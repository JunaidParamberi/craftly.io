
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Target, 
  Cpu, CreditCard, 
  User, Mail, Phone, Globe, MapPin, BadgePercent,
  History, TrendingUp, Zap, Briefcase
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Card, Badge, Button, Heading } from './ui/Primitives.tsx';

const ClientDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, proposals, invoices } = useBusiness();

  const client = useMemo(() => clients.find(c => c.id === id), [id, clients]);
  const clientProposals = useMemo(() => proposals.filter(p => p.clientName === client?.name || p.clientId === id), [client, proposals, id]);
  
  // Logic Fix: Only count 'Invoice' type for financial volume to avoid doubling with LPOs
  const clientInvoices = useMemo(() => 
    invoices.filter(i => i.clientId === client?.name && i.type === 'Invoice'), 
  [client, invoices]);

  if (!client) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Cpu size={64} className="text-rose-500 mb-6 opacity-20" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">Node Not Found</h3>
        <p className="text-[var(--text-secondary)] mt-4 uppercase text-[10px] tracking-widest">The client registry does not contain this identifier.</p>
        <Button onClick={() => navigate('/clients')} className="mt-10" icon={ChevronLeft}>Return to Registry</Button>
      </div>
    );
  }

  const totalBilled = clientInvoices.reduce((acc, curr) => acc + (curr.amountAED || 0), 0);
  const paidBilled = clientInvoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + (curr.amountAED || 0), 0);

  return (
    <div className="space-y-10 animate-enter pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <ChevronLeft size={14} /> Registry Directory
          </button>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[var(--accent)] text-white flex items-center justify-center font-black text-3xl shadow-2xl uppercase border border-white/10">{client.name.charAt(0)}</div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={client.status === 'Active' ? 'success' : 'warning'}>{client.status.toUpperCase()}</Badge>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Partner Node: {client.id}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">{client.name}</h2>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-14" onClick={() => navigate(`/projects/new?clientId=${client.id}`)} icon={Zap}>New Deployment</Button>
           <Button className="h-14 shadow-2xl" icon={CreditCard} onClick={() => navigate(`/invoices?clientName=${client.name}`)}>Create Invoice</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 bg-[var(--bg-card-muted)] border-[var(--border-ui)]">
                 <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-3">Total Volume</p>
                 <p className="text-3xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter">AED {totalBilled.toLocaleString()}</p>
                 <div className="flex items-center gap-2 mt-4">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Lifetime Pulse</span>
                 </div>
              </Card>
              <Card className="p-8 bg-[var(--bg-card-muted)] border-[var(--border-ui)]">
                 <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-3">Settled Nodes</p>
                 <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">AED {paidBilled.toLocaleString()}</p>
                 <div className="w-full h-1 bg-[var(--border-ui)] rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${totalBilled > 0 ? (paidBilled/totalBilled)*100 : 0}%` }} />
                 </div>
              </Card>
              <Card className="p-8 bg-[var(--accent)]/10 border-[var(--accent)]/20">
                 <p className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mb-3">Active Missions</p>
                 <p className="text-3xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter">{clientProposals.length}</p>
                 <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase mt-4 tracking-widest">Current Commitments</p>
              </Card>
           </div>

           <Card className="p-10 space-y-10">
              <div className="flex items-center gap-4 text-[var(--accent)] border-b border-[var(--border-ui)] pb-6">
                 <User size={24} />
                 <h4 className="text-xs font-black uppercase tracking-[0.4em]">Node Identity & Logistics</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><User size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Operative Lead</p>
                          <p className="text-base font-black text-[var(--text-primary)] uppercase">{client.contactPerson}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><Mail size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Registry Email</p>
                          <p className="text-base font-bold text-[var(--accent)] lowercase">{client.email}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><Phone size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Terminal Phone</p>
                          <p className="text-base font-black text-[var(--text-primary)] tabular-nums">{client.phone}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><Globe size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Regional Matrix</p>
                          <p className="text-base font-black text-[var(--text-primary)] uppercase">{client.country}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><BadgePercent size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">TRN / Tax Identifier</p>
                          <p className="text-base font-black text-[var(--text-primary)] uppercase">{client.taxId || 'UNREGISTERED'}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl text-[var(--text-secondary)] border border-[var(--border-ui)]"><MapPin size={18}/></div>
                       <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Coordinate address</p>
                          <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed uppercase">{client.address || 'NO FIXED ADDRESS'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>

           <div className="space-y-6">
              <Heading sub="Historical Node Logs">Commitment Thread</Heading>
              <div className="grid grid-cols-1 gap-4">
                 {clientProposals.length > 0 ? clientProposals.map(p => (
                   <Card key={p.id} className="p-6 bg-[var(--bg-card-muted)] border-[var(--border-ui)] hover:border-[var(--accent)]/30 flex items-center justify-between cursor-pointer group" onClick={() => navigate(`/projects/${p.id}`)}>
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-[var(--bg-card-muted)] rounded-xl border border-[var(--border-ui)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all"><Briefcase size={20}/></div>
                         <div>
                            <h5 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{p.title}</h5>
                            <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1">Start: {p.startDate} • Worth: AED {p.budget.toLocaleString()}</p>
                         </div>
                      </div>
                      <Badge variant={p.status === 'Accepted' ? 'success' : 'info'}>{p.status.toUpperCase()}</Badge>
                   </Card>
                 )) : (
                   <div className="py-20 text-center opacity-10 bg-[var(--bg-card-muted)] rounded-[2.5rem] border border-dashed border-[var(--border-ui)]">
                      <Target size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Missions Found</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform"><Zap size={120} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-indigo-200">Payment Protocol</p>
              <h3 className="text-xl font-black uppercase mb-10 leading-tight">Digital Sync Link</h3>
              {client.paymentPortal ? (
                <button 
                  onClick={() => window.open(client.paymentPortal, '_blank')}
                  className="w-full h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  <Globe size={18}/> Launch Payment Portal
                </button>
              ) : (
                <div className="p-6 bg-indigo-700/50 rounded-2xl border border-indigo-500/50 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 leading-relaxed">No digital settlement portal registered for this node.</p>
                </div>
              )}
           </Card>

           <Card className="p-10 space-y-8">
              <h5 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-secondary)] flex items-center gap-3">
                <History size={16} /> Data Telemetry
              </h5>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-[var(--bg-card-muted)] rounded-2xl border border-[var(--border-ui)]">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Registry ID</span>
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase">{client.id}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-[var(--bg-card-muted)] rounded-2xl border border-[var(--border-ui)]">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Pref Currency</span>
                    <span className="text-xs font-black text-[var(--accent)] uppercase">{client.currency}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-[var(--bg-card-muted)] rounded-2xl border border-[var(--border-ui)]">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Onboarded</span>
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase tabular-nums">{new Date(client.createdAt || '').toLocaleDateString('en-GB')}</span>
                 </div>
              </div>
           </Card>

           <div className="p-8 bg-rose-500/[0.02] border border-rose-500/10 rounded-[2rem] text-center space-y-4">
              <p className="text-[9px] font-black uppercase text-rose-500/60 tracking-widest">Protocol Override</p>
              <button className="w-full py-4 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all shadow-sm">Purge Partner Node</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
