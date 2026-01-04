
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  DollarSign, Package, Activity, 
  Plus, CreditCard, Users, Briefcase, 
 ArrowRight, Settings2, Eye, EyeOff, X,GripVertical, 
  BrainCircuit,  Wand2, ShieldCheck, ArrowUpRight,
  Loader2, Radar, ShieldAlert
} from 'lucide-react';
import { GoogleGenAI,  } from '@google/genai';
import {  WidgetId, } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Badge, Card, Button, Heading } from './ui/Primitives.tsx';
import { createPortal } from 'react-dom';

const generateSparkline = (base: number) => {
  const safeBase = Math.max(1, base);
  return [
    { name: 'P1', value: safeBase * 0.7 }, { name: 'P2', value: safeBase * 0.85 }, { name: 'P3', value: safeBase * 0.8 },
    { name: 'P4', value: safeBase * 1.1 }, { name: 'P5', value: safeBase * 0.95 }, { name: 'P6', value: safeBase * 1.2 },
    { name: 'Current', value: safeBase },
  ];
};

const StatCard = ({ label, value, trend, icon: Icon, chartData, isPositive = true, onDragStart, onDragOver, onDrop, draggable }: any) => (
  <Card 
    className="flex flex-col group h-full relative"
    draggable={draggable}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity z-10"><GripVertical size={16} /></div>
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block truncate pr-4">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 text-[var(--accent)] flex items-center justify-center shrink-0"><Icon size={14} /></div>
      </div>
      <div className="mb-3"><Badge variant={isPositive ? 'success' : 'danger'} className="inline-flex">{trend}</Badge></div>
      <h3 className="text-xl lg:text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter truncate leading-none">{value}</h3>
    </div>
    <div className="h-8 lg:h-10 w-full opacity-20 group-hover:opacity-100 transition-opacity mt-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}><Area type="monotone" dataKey="value" stroke={isPositive ? "var(--accent)" : "#ef4444"} strokeWidth={2} fill={isPositive ? "var(--accent)" : "#ef4444"} fillOpacity={0.05} /></AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const AICommandBar = () => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const { pushNotification, showToast, proposals, clients, telemetry } = useBusiness();

  const handleExecute = async () => {
    if (!query.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: Missions ${proposals.length}, Clients ${clients.length}, Earned AED ${telemetry.totalEarnings}. Question: ${query}`,
        config: { systemInstruction: "You are a business consultant. Standard Sentence Case. Succinct." }
      });
      setResponse(res.text || 'Analyzed.');
      showToast('Cognitive Sync Complete');
      pushNotification({ title: 'AI Command', description: 'Query executed.', type: 'update' });
      setQuery('');
    } catch (e) { showToast('Sync Failure', 'error'); } finally { setIsThinking(false); }
  };

  return (
    <div className="w-full relative space-y-4">
      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${isThinking ? 'animate-pulse' : ''}`}></div>
        <div className="relative bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl flex items-center p-1 shadow-2xl overflow-hidden">
          <div className="pl-5 text-[var(--accent)] shrink-0">{isThinking ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}</div>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExecute()} placeholder="Command AI for strategy..." className="flex-1 bg-transparent border-none outline-none px-5 py-4 text-xs font-bold uppercase tracking-widest placeholder:text-slate-500" />
          <button onClick={handleExecute} className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 mr-1" disabled={!query.trim() || isThinking}>Execute</button>
        </div>
      </div>
      {response && (
        <div className="animate-pop-in relative z-10"><div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative"><div className="flex items-center gap-2 mb-3 text-indigo-500"><BrainCircuit size={14} className="animate-pulse" /><span className="text-[8px] font-black uppercase tracking-[0.3em]">Cognitive Node</span></div><p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">{response}</p><button onClick={() => setResponse(null)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={16} /></button></div></div>
      )}
    </div>
  );
};

const Dashboard: React.FC<{ theme: string }> = () => {
  const { userProfile, telemetry, updateDashboardConfig,  showToast } = useBusiness();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [radarScanning, setRadarScanning] = useState(false);
  const [detectedRisks, setDetectedRisks] = useState<any[]>([]);

  const navigate = useNavigate();

  const activeWidgets = useMemo(() => {
    return (userProfile.dashboardConfig || []).filter(w => w.visible).sort((a, b) => a.order - b.order);
  }, [userProfile.dashboardConfig]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (aiInsight || isInsightLoading) return;
      setIsInsightLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze: Earned AED ${telemetry.totalEarnings}, Active Projects ${telemetry.activeMissions}. One brief UAE freelancer tip. Mixed case.`,
        });
        setAiInsight(res.text || 'Execution stable.');
      } catch (e) { setAiInsight('Buffer low.'); } finally { setIsInsightLoading(false); }
    };
    fetchInsight();
  }, [telemetry]);

  const runRadarScan = async () => {
    setRadarScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze business: Revenue AED ${telemetry.totalEarnings}, Margin ${telemetry.profitMargin.toFixed(1)}%. Identify 3 risks. JSON Array of {category, severity, warning, action}.`,
        config: { responseMimeType: "application/json" }
      });
      setDetectedRisks(JSON.parse(res.text || '[]').map((r: any, i: number) => ({ ...r, id: `r-${i}` })));
      showToast('Scan complete');
    } catch (e) { showToast('Telemetry fail', 'error'); } finally { setRadarScanning(false); }
  };

  const renderWidget = (id: WidgetId) => {
    const dragProps = { draggable: true, onDragStart: () => setDraggedWidgetId(id), onDragOver: (e: any) => e.preventDefault(), onDrop: () => { if (draggedWidgetId && draggedWidgetId !== id) { const cfg = [...(userProfile.dashboardConfig || [])]; const dIdx = cfg.findIndex(w => w.id === draggedWidgetId); const tIdx = cfg.findIndex(w => w.id === id); const old = cfg[dIdx].order; cfg[dIdx].order = cfg[tIdx].order; cfg[tIdx].order = old; updateDashboardConfig(cfg); setDraggedWidgetId(null); } } };
    switch (id) {
      case 'revenue_stat': return <StatCard key={id} label="Revenue" value={`AED ${telemetry.totalEarnings.toLocaleString()}`} trend="Earned" icon={DollarSign} chartData={generateSparkline(telemetry.totalEarnings)} {...dragProps} />;
      case 'projects_stat': return <StatCard key={id} label="Missions" value={telemetry.activeMissions} trend="Ongoing" icon={Package} chartData={generateSparkline(telemetry.activeMissions)} {...dragProps} />;
      case 'clients_stat': return <StatCard key={id} label="Partners" value={telemetry.clientCount} trend="Active" icon={Users} chartData={generateSparkline(telemetry.clientCount)} {...dragProps} />;
      case 'pending_stat': return <StatCard key={id} label="Pending" value={`AED ${telemetry.pendingRevenue.toLocaleString()}`} trend="Target" icon={Activity} chartData={generateSparkline(telemetry.pendingRevenue)} {...dragProps} />;
      case 'ai_strategy': return (
          <Card key={id} className="xl:col-span-4 border-2 border-indigo-500/10 bg-indigo-500/[0.03] flex flex-col" {...dragProps}>
             <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"><BrainCircuit size={18} /></div><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Strategy</h4></div>
             <div className="flex-1"><p className="text-sm font-black tracking-tight leading-snug">{isInsightLoading ? 'Analyzing...' : aiInsight}</p></div>
             <div className="mt-8 pt-6 border-t border-indigo-500/10"><button onClick={() => navigate('/ai-help')} className="w-full flex items-center justify-between text-indigo-500 font-black uppercase text-[9px] hover:bg-indigo-500/5 p-3 rounded-xl transition-all"><span>Full Strategy Hub</span><ArrowUpRight size={14}/></button></div>
          </Card>
      );
      case 'ai_alerts': return (
          <Card key={id} className="xl:col-span-4 border-2 border-rose-500/10 group relative flex flex-col" {...dragProps}>
             <div className="flex items-center gap-3 mb-8"><div className={`w-10 h-10 ${radarScanning ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/10 text-rose-500'} rounded-xl flex items-center justify-center`}>{radarScanning ? <Radar size={18} className="animate-spin" /> : <ShieldAlert size={18} />}</div><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Risk Radar</h4></div>
             <div className="flex-1 space-y-4">{detectedRisks.length > 0 ? detectedRisks.map((risk) => (<div key={risk.id} className="p-4 bg-[var(--bg-canvas)] border border-rose-500/10 rounded-2xl animate-enter"><div className="flex justify-between items-center mb-2"><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{risk.category}</span><Badge variant={risk.severity === 'Critical' ? 'danger' : 'warning'} className="!text-[7px]">{risk.severity}</Badge></div><p className="text-[10px] font-bold leading-tight mb-3">{risk.warning}</p><button onClick={() => navigate('/ai-help')} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:underline flex items-center gap-1">{risk.action} <ArrowRight size={10} /></button></div>)) : <div className="py-12 flex flex-col items-center opacity-20"><ShieldCheck size={40} className="text-emerald-500 mb-4" /><p className="text-[9px] font-black uppercase tracking-widest">Stability Optimal</p></div>}</div>
             <div className="mt-6 pt-4 border-t border-rose-500/10"><Button variant="danger" size="sm" className="w-full text-[9px] font-black uppercase h-12" onClick={runRadarScan} disabled={radarScanning}>Deep Scan</Button></div>
          </Card>
      );
      case 'revenue_chart': return (
          <Card key={id} className="xl:col-span-8 group relative" {...dragProps}>
            <div className="flex flex-col mb-10"><h3 className="text-base lg:text-lg font-black uppercase tracking-tight truncate mb-2">Earnings Trend</h3><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--accent)]" /><span className="text-[10px] font-black text-slate-500 uppercase">Monthly Performance Registry</span></div></div>
            <div className="h-48 sm:h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={useMemo(() => generateSparkline(telemetry.totalEarnings), [telemetry.totalEarnings])}><defs><linearGradient id="fluxG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-ui)" opacity={0.3} /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '1rem', fontSize: '10px', fontWeight: '900' }} /><Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#fluxG)" /></AreaChart></ResponsiveContainer></div>
          </Card>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 animate-enter pb-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading sub={`Cognitive Workspace Active — ${userProfile.fullName}`}>Executive Overview</Heading>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsCustomizeOpen(true)} className="h-12 lg:h-14 !px-4" icon={Settings2} />
            <div className="relative">
              <Button onClick={() => setIsActionsOpen(!isActionsOpen)} variant="primary" className="h-12 lg:h-14"><Plus size={16} /><span className="ml-2 uppercase tracking-widest text-[10px]">Quick Actions</span></Button>
              {isActionsOpen && (<div className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[1.5rem] shadow-2xl p-2 z-[100] animate-pop-in">{[{ label: 'Create Invoice', icon: CreditCard, path: '/invoices' }, { label: 'Add Client', icon: Users, path: '/clients' }, { label: 'Start Project', icon: Briefcase, path: '/projects' }].map((a, i) => (<button key={i} onClick={() => { navigate(a.path); setIsActionsOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-canvas)] group transition-all"><div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-all"><a.icon size={16} /></div><span className="text-xs font-black uppercase text-[var(--text-primary)]">{a.label}</span></button>))}</div>)}
            </div>
          </div>
        </div>
        <AICommandBar />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-6">
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">{activeWidgets.filter(w => ['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id)).map(w => renderWidget(w.id))}</div>
        {activeWidgets.filter(w => !['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id)).map(w => renderWidget(w.id))}
      </div>
      {isCustomizeOpen && createPortal(<div className="exec-modal-overlay"><div className="exec-modal-container !max-w-xl animate-pop-in"><header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between"><h3>Personalize</h3><button onClick={() => setIsCustomizeOpen(false)}><X size={24}/></button></header><div className="p-8 space-y-2 max-h-[70vh] overflow-y-auto">{(userProfile.dashboardConfig || []).sort((a,b) => a.order - b.order).map((w) => (<button key={w.id} onClick={() => { const cfg = (userProfile.dashboardConfig || []).map(x => x.id === w.id ? { ...x, visible: !x.visible } : x); updateDashboardConfig(cfg); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${w.visible ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'opacity-40 grayscale'}`}>{w.visible ? <Eye size={18} /> : <EyeOff size={18} />}<span className="text-[10px] font-black uppercase">{w.id.replace(/_/g, ' ')}</span></button>))}</div></div></div>, document.body)}
    </div>
  );
};

export default Dashboard;
