
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  DollarSign, Package, Activity, 
  Plus, CreditCard, Users, Briefcase, Zap, HelpCircle, ChevronDown,
  TrendingUp, ArrowRight, Settings2, Eye, EyeOff, X, Check, GripVertical, Calendar, BarChart3,
  BrainCircuit, Sparkles, Wand2, Terminal, AlertTriangle, ShieldCheck, ArrowUpRight, Search,
  Loader2, Radar, Target, ShieldAlert
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { View, WidgetId, WidgetConfig } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Badge, Card, Button, Heading, Input } from './ui/Primitives.tsx';
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
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity z-10">
       <GripVertical size={16} />
    </div>

    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block truncate pr-4">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 text-[var(--accent)] flex items-center justify-center shrink-0">
          <Icon size={14} />
        </div>
      </div>

      <div className="mb-3">
        <Badge variant={isPositive ? 'success' : 'danger'} className="inline-flex">
          {trend}
        </Badge>
      </div>

      <h3 className="text-xl lg:text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter truncate leading-none">
        {value}
      </h3>
    </div>

    <div className="h-8 lg:h-10 w-full opacity-20 group-hover:opacity-100 transition-opacity mt-5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={isPositive ? "var(--accent)" : "#ef4444"} 
            strokeWidth={2} 
            fill={isPositive ? "var(--accent)" : "#ef4444"}
            fillOpacity={0.05}
          />
        </AreaChart>
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
    setResponse(null);
    try {
      const businessContext = `
        CURRENT BUSINESS DATA:
        - Projects Count: ${proposals.length}
        - Client Count: ${clients.length}
        - Total Earnings: AED ${telemetry.totalEarnings}
        - Pending Revenue: AED ${telemetry.pendingRevenue}
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: ${businessContext}\n\nUser Question: ${query}`,
        config: { systemInstruction: "You are a business command processor. Use context to be accurate. Keep it professional and succinct." }
      });
      
      const aiText = res.text || 'Command interpreted successfully.';
      setResponse(aiText);
      showToast('AI analysis completed successfully', 'success');
      
      pushNotification({ 
        title: 'Cognitive Response', 
        description: aiText, 
        type: 'update' 
      });
      setQuery('');
    } catch (error) {
      showToast('AI Terminal error. Check connection.', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="w-full relative space-y-4">
      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${isThinking ? 'animate-pulse' : ''}`}></div>
        <div className="relative bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl flex items-center p-1 shadow-2xl overflow-hidden">
          <div className="pl-5 text-[var(--accent)] shrink-0">
            {isThinking ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
          </div>
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExecute()}
            placeholder="Ask AI for strategy, data, or actions..." 
            className="flex-1 bg-transparent border-none outline-none px-5 py-4 text-xs font-bold uppercase tracking-widest placeholder:text-slate-500 placeholder:opacity-50" 
          />
          <button 
            onClick={handleExecute}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 mr-1"
            disabled={!query.trim() || isThinking}
          >
            Execute
          </button>
        </div>
      </div>

      {response && (
        <div className="animate-pop-in relative z-10">
           <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 lg:p-7 pr-12 shadow-2xl backdrop-blur-md">
             <div className="flex items-center gap-2 mb-3 text-indigo-500">
               <BrainCircuit size={14} className="animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em]">Cognitive Intelligence Node</span>
             </div>
             <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
               {response}
             </p>
             <button 
               onClick={() => setResponse(null)}
               className="absolute top-5 right-5 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
               title="Clear"
             >
               <X size={16} />
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

interface RiskItem {
  id: string;
  category: 'Fiscal' | 'Temporal' | 'Operational';
  severity: 'Critical' | 'Elevated' | 'Nominal';
  warning: string;
  action: string;
}

const Dashboard: React.FC<{ theme: string }> = () => {
  const { notifications, userProfile, telemetry, updateDashboardConfig, proposals, invoices, catalog, showToast } = useBusiness();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  
  // Cognitive Radar State
  const [radarScanning, setRadarScanning] = useState(false);
  const [detectedRisks, setDetectedRisks] = useState<RiskItem[]>([]);

  const actionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeWidgets = useMemo(() => {
    return (userProfile.dashboardConfig || [])
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order);
  }, [userProfile.dashboardConfig]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (aiInsight || isInsightLoading) return;
      setIsInsightLoading(true);
      try {
        if (telemetry.totalEarnings === 0 && telemetry.activeMissions === 0) {
          setAiInsight("Welcome Commander. Your workspace is a blank slate of infinite potential. Initialize your first project to unlock professional momentum.");
          setIsInsightLoading(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analyze: Revenue AED ${telemetry.totalEarnings}, Expenses AED ${telemetry.totalExpenses}, Profit Margin ${telemetry.profitMargin.toFixed(1)}%, Overdue Invoices: ${telemetry.overdueCount}. Provide one sharp, strategic recommendation in 12 words or less for a UAE freelancer.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiInsight(response.text || 'Data stable. Continue execution.');
      } catch (e) {
        setAiInsight('Intelligence buffer low.');
      } finally {
        setIsInsightLoading(false);
      }
    };
    fetchInsight();
  }, [telemetry]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) setIsActionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runRadarScan = async () => {
    setRadarScanning(true);
    setDetectedRisks([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze current business telemetry:
      - Revenue: AED ${telemetry.totalEarnings}
      - Expenses: AED ${telemetry.totalExpenses}
      - Overdue Count: ${telemetry.overdueCount}
      - Margin: ${telemetry.profitMargin.toFixed(1)}%
      - Active Projects: ${telemetry.activeMissions}
      
      Identify 3 distinct risks (Fiscal, Temporal, or Operational). 
      If data is zero, focus on the 'Risk of Stagnation' and encourage starting.
      For each, provide a warning and a 3-word action.
      Return valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                warning: { type: Type.STRING },
                action: { type: Type.STRING }
              },
              required: ["category", "severity", "warning", "action"]
            }
          }
        }
      });

      const risks = JSON.parse(response.text || '[]');
      setDetectedRisks(risks.map((r: any, i: number) => ({ ...r, id: `risk-${i}` })));
      showToast('Registry scan complete. Potential frictions identified.', 'info');
    } catch (e) {
      showToast('Radar telemetry failure.', 'error');
    } finally {
      setRadarScanning(false);
    }
  };

  const handleNavigate = (view: View) => {
    const paths: Record<string, string> = {
      [View.DASHBOARD]: '/dashboard', [View.CRM]: '/clients', [View.PROPOSALS]: '/projects',
      [View.FINANCE]: '/invoices', [View.CHAT]: '/ai-help',
    };
    if (paths[view]) navigate(paths[view]);
    setIsActionsOpen(false);
  };

  const toggleWidget = (id: WidgetId) => {
    const newConfig = (userProfile.dashboardConfig || []).map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateDashboardConfig(newConfig);
    showToast('Dashboard layout updated');
  };

  const handleDragStart = (id: WidgetId) => setDraggedWidgetId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: WidgetId) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    const currentConfig = [...(userProfile.dashboardConfig || [])];
    const draggedIdx = currentConfig.findIndex(w => w.id === draggedWidgetId);
    const targetIdx = currentConfig.findIndex(w => w.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const draggedItem = { ...currentConfig[draggedIdx] };
    const targetItem = { ...currentConfig[targetIdx] };
    const oldOrder = draggedItem.order;
    draggedItem.order = targetItem.order;
    targetItem.order = oldOrder;
    currentConfig[draggedIdx] = targetItem;
    currentConfig[targetIdx] = draggedItem;
    updateDashboardConfig(currentConfig);
    setDraggedWidgetId(null);
  };

  const trajectoryData = useMemo(() => generateSparkline(telemetry.totalEarnings), [telemetry.totalEarnings]);

  const renderWidget = (id: WidgetId) => {
    const dragProps = {
      draggable: true,
      onDragStart: () => handleDragStart(id),
      onDragOver: handleDragOver,
      onDrop: () => handleDrop(id)
    };

    switch (id) {
      case 'revenue_stat':
        return <StatCard key={id} label="Total Revenue" value={`AED ${telemetry.totalEarnings.toLocaleString()}`} trend="Earned" icon={DollarSign} chartData={generateSparkline(telemetry.totalEarnings)} {...dragProps} />;
      case 'projects_stat':
        return <StatCard key={id} label="Active Projects" value={telemetry.activeMissions} trend="Ongoing" icon={Package} chartData={generateSparkline(telemetry.activeMissions)} {...dragProps} />;
      case 'clients_stat':
        return <StatCard key={id} label="Total Clients" value={telemetry.clientCount} trend="Partners" icon={Users} chartData={generateSparkline(telemetry.clientCount)} {...dragProps} />;
      case 'pending_stat':
        return <StatCard key={id} label="Waiting Payments" value={`AED ${telemetry.pendingRevenue.toLocaleString()}`} trend="Pending" icon={Activity} chartData={generateSparkline(telemetry.pendingRevenue)} isPositive={telemetry.pendingRevenue < 150000} {...dragProps} />;
      case 'ai_strategy':
        return (
          <Card key={id} className="xl:col-span-4 group relative border-2 border-indigo-500/10 bg-gradient-to-br from-indigo-500/[0.03] to-emerald-500/[0.03] flex flex-col" {...dragProps}>
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing z-10"><GripVertical size={16} /></div>
             <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                      <BrainCircuit size={18} className={isInsightLoading ? 'animate-pulse' : ''} />
                   </div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 leading-none">Strategic AI Insight</h4>
                </div>
                
                <div className="flex-1">
                   <p className="text-sm font-black tracking-tight text-[var(--text-primary)] leading-snug">
                     {isInsightLoading ? 'Analyzing telemetry...' : aiInsight}
                   </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-indigo-500/10">
                   <button 
                    onClick={() => navigate('/ai-help')} 
                    className="w-full flex items-center justify-between text-indigo-500 font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500/5 p-3 rounded-xl transition-all"
                   >
                     <span>Full Strategy Hub</span>
                     <ArrowUpRight size={14}/>
                   </button>
                </div>
             </div>
          </Card>
        );
      case 'ai_alerts':
        return (
          <Card key={id} className="xl:col-span-4 bg-[var(--bg-card)] border-2 border-rose-500/10 group relative flex flex-col overflow-hidden" {...dragProps}>
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing z-20"><GripVertical size={16} /></div>
             
             <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${radarScanning ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-500/10 text-rose-500'} rounded-xl flex items-center justify-center transition-all`}>
                    {radarScanning ? <Radar size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Cognitive Risk Radar</h4>
                </div>
                <div className="flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /></div>
             </div>

             <div className="flex-1 space-y-4">
                {radarScanning ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                     <div className="relative">
                        <Radar size={48} className="text-rose-500 animate-spin opacity-20" />
                        <Activity size={24} className="absolute inset-0 m-auto text-rose-500 animate-pulse" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning Registry Nodes...</p>
                  </div>
                ) : detectedRisks.length > 0 ? (
                  detectedRisks.map((risk) => (
                    <div key={risk.id} className="p-4 bg-[var(--bg-canvas)] border border-rose-500/10 rounded-2xl animate-enter">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{risk.category} Detected</span>
                         <Badge variant={risk.severity === 'Critical' ? 'danger' : 'warning'} className="!text-[7px]">{risk.severity}</Badge>
                      </div>
                      <p className="text-[10px] font-bold text-[var(--text-primary)] leading-tight mb-3">{risk.warning}</p>
                      <button onClick={() => navigate('/ai-help')} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:underline flex items-center gap-1">
                        {risk.action} <ArrowRight size={10} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <ShieldCheck size={40} className="mb-4 text-emerald-500 opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stability Optimal. No Frictions.</p>
                  </div>
                )}
             </div>

             <div className="mt-6 pt-4 border-t border-rose-500/10">
               <Button 
                variant="danger" 
                size="sm" 
                className="w-full text-[9px] font-black uppercase tracking-widest h-12"
                onClick={runRadarScan}
                disabled={radarScanning}
               >
                 {radarScanning ? 'Analyzing Telemetry...' : 'Initialize Deep Scan'}
               </Button>
             </div>
          </Card>
        );
      case 'revenue_chart':
        return (
          <Card key={id} className="xl:col-span-8 group relative" {...dragProps}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
            <div className="flex flex-col mb-10">
              <h3 className="text-base lg:text-lg font-black uppercase tracking-tight truncate mb-2">Earnings Trend</h3>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--accent)]" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Performance Registry</span></div>
            </div>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData}>
                  <defs><linearGradient id="fluxG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-ui)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '1rem', fontSize: '10px', fontVariantCaps: 'all-small-caps', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#fluxG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      case 'recent_updates':
        return (
          <Card key={id} className="bg-[var(--accent)]/[0.01] xl:col-span-4 group relative" {...dragProps}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
            <div className="flex flex-col mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-4">Recent Updates</h4>
              <button onClick={() => navigate('/ai-help')} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg border border-[var(--border-ui)] text-slate-500 hover:text-[var(--accent)] transition-all flex items-center justify-center"><HelpCircle size={16} /></button>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map(n => (
                <div key={n.id} className="p-4 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl flex items-center gap-4 hover:border-[var(--accent)] transition-all cursor-pointer shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'finance' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-emerald-500'}`}><Zap size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-[var(--text-primary)] truncate uppercase leading-none">{n.title}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase opacity-40 truncate">{n.description}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-[10px] font-bold text-slate-500 uppercase py-10 text-center opacity-30">No notifications</p>}
            </div>
          </Card>
        );
      case 'business_health':
        return (
          <Card key={id} className="flex flex-col items-center justify-center text-center p-8 lg:p-12 xl:col-span-4 group relative" {...dragProps}>
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
             <TrendingUp size={48} className="text-emerald-500/20 mb-6" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">Business Stats</h4>
             <div className="grid grid-cols-2 gap-10 w-full">
                <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Projects</p><p className="text-2xl font-black tracking-tighter">{telemetry.activeMissions}</p></div>
                <div><p className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-1">Unpaid</p><p className="text-2xl font-black tracking-tighter text-rose-500">{telemetry.unpaidCount}</p></div>
             </div>
          </Card>
        );
      case 'active_projects_list':
        return (
          <Card key={id} className="xl:col-span-12 group relative" {...dragProps}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
            <div className="flex flex-col mb-8">
               <h3 className="text-base lg:text-lg font-black uppercase tracking-tight truncate mb-4">Active Projects</h3>
               <Button size="sm" variant="ghost" icon={ArrowRight} onClick={() => navigate('/projects')} className="self-start">Review All Nodes</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.slice(0, 3).map(p => (
                <div key={p.id} className="p-5 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl flex flex-col justify-between hover:border-[var(--accent)] transition-colors">
                   <h4 className="text-sm font-black uppercase truncate mb-2">{p.title}</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">{p.clientName}</p>
                </div>
              ))}
              {proposals.length === 0 && (
                <div className="col-span-full py-10 border-2 border-dashed border-[var(--border-ui)] rounded-2xl text-center opacity-30">
                   <p className="text-[10px] font-black uppercase tracking-widest">No active mission nodes. Start your first mission to initialize trajectory.</p>
                </div>
              )}
            </div>
          </Card>
        );
      case 'deadlines_list':
        const nextDeadlines = [...invoices.filter(i => i.status !== 'Paid'), ...proposals.filter(p => p.status !== 'Accepted')]
          .map(item => ({
            id: item.id,
            title: (item as any).title || `${(item as any).type}: ${(item as any).id}`,
            date: (item as any).dueDate || (item as any).timeline,
            type: (item as any).type ? 'Invoice' : 'Project'
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);

        return (
          <Card key={id} className="xl:col-span-4 group relative" {...dragProps}>
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
             <div className="flex flex-col mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-4">Temporal Alerts</h4>
                <div className="w-10 h-10 bg-rose-500/5 rounded-lg flex items-center justify-center text-rose-500/50"><Calendar size={18} /></div>
             </div>
             <div className="space-y-4">
                {nextDeadlines.length > 0 ? nextDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                     <div className={`w-2 h-10 rounded-full shrink-0 ${d.type === 'Invoice' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                     <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase truncate leading-none mb-1.5">{d.title}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{d.date}</p>
                     </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">Timeline clear. No critical deadlines.</p>
                  </div>
                )}
             </div>
          </Card>
        );
      case 'top_services':
        return (
          <Card key={id} className="xl:col-span-4 group relative" {...dragProps}>
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing"><GripVertical size={16} /></div>
             <div className="flex flex-col mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4">Resource Mix</h4>
                <div className="w-10 h-10 bg-emerald-500/5 rounded-lg flex items-center justify-center text-emerald-500/50"><BarChart3 size={18} /></div>
             </div>
             <div className="space-y-6">
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Catalog Items</p>
                        <p className="text-2xl font-black">{catalog.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Avg Margin</p>
                        <p className="text-2xl font-black text-emerald-500">{telemetry.profitMargin.toFixed(0)}%</p>
                      </div>
                   </div>
                   <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[70%]" />
                   </div>
                </div>
             </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 animate-enter pb-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
             <Heading sub={`Cognitive Workspace Active — Welcome, ${userProfile.fullName}`}>Executive Overview</Heading>
             {telemetry.totalEarnings === 0 && (
               <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] animate-pulse">Account Status: Foundation Stage — Build Your Legacy</p>
             )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsCustomizeOpen(true)} className="h-12 lg:h-14 !px-4" icon={Settings2} />
            <div className="relative" ref={actionsRef}>
              <Button onClick={() => setIsActionsOpen(!isActionsOpen)} variant="primary" className="shadow-md flex-1 sm:flex-none h-12 lg:h-14">
                <Plus size={16} className={`transition-transform duration-300 ${isActionsOpen ? 'rotate-180' : ''}`} /> 
                <span className="ml-2 uppercase tracking-widest text-[10px]">Quick Actions</span>
                <ChevronDown size={14} className="ml-2 opacity-50" />
              </Button>
              {isActionsOpen && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[1.5rem] shadow-2xl p-2 z-[100] animate-pop-in">
                  {[
                    { label: 'Create Invoice', icon: CreditCard, view: View.FINANCE },
                    { label: 'Add Client', icon: Users, view: View.CRM },
                    { label: 'Start Project', icon: Briefcase, view: View.PROPOSALS },
                  ].map((action, i) => (
                    <button key={i} onClick={() => handleNavigate(action.view)} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-canvas)] text-left group transition-all">
                      <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-all"><action.icon size={16} /></div>
                      <span className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)]">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <AICommandBar />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-6">
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {activeWidgets.filter(w => ['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id)).map(w => renderWidget(w.id))}
        </div>
        {activeWidgets.filter(w => !['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id)).map(w => renderWidget(w.id))}
      </div>

      {isCustomizeOpen && createPortal(
        <div className="exec-modal-overlay">
           <div className="exec-modal-container !max-w-xl animate-pop-in">
              <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between bg-[var(--bg-card)] rounded-t-[1.25rem]">
                 <div className="flex items-center gap-4 text-indigo-50">
                    <Settings2 size={24} />
                    <h3 className="text-lg font-black uppercase tracking-tight">Personalize Dashboard</h3>
                 </div>
                 <button onClick={() => setIsCustomizeOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </header>
              <div className="p-8 space-y-6 custom-scroll max-h-[70vh] overflow-y-auto">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-60">Toggle widgets and drag handles to adjust your view</p>
                 <div className="space-y-2">
                    {(userProfile.dashboardConfig || []).sort((a,b) => a.order - b.order).map((widget) => (
                      <div 
                        key={widget.id}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${widget.visible ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] opacity-50 grayscale'}`}
                      >
                         <button 
                           onClick={() => toggleWidget(widget.id)}
                           className={`flex-1 flex items-center gap-4 text-left transition-all ${widget.visible ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                         >
                            {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{widget.id.replace(/_/g, ' ')}</span>
                         </button>
                         {widget.visible && <Check size={16} className="text-indigo-500" />}
                      </div>
                    ))}
                 </div>
                 <div className="pt-6 border-t border-[var(--border-ui)]">
                    <Button onClick={() => setIsCustomizeOpen(false)} className="w-full h-14">Finish Adjusting</Button>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
