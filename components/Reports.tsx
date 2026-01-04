
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Target, AlertCircle,
  Activity, Wallet, Zap, FileSpreadsheet,
  Filter, CalendarDays, Download
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { GoogleGenAI } from '@google/genai';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import TemporalPicker from './TemporalPicker.tsx';
import { Button, Card, Badge, Heading } from './ui/Primitives.tsx';

const Reports: React.FC = () => {
  const { invoices, pushNotification, telemetry, showToast } = useBusiness();
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stats = useMemo(() => {
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    periodEnd.setHours(23, 59, 59);

    const periodInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= periodStart && invDate <= periodEnd;
    });

    const periodActualRevenue = periodInvoices.filter(i => i.status === 'Paid').reduce((a, b) => a + (b.amountPaid || 0), 0);
    const periodProjectedRevenue = periodInvoices.filter(i => i.status !== 'Paid').reduce((a, b) => a + (b.amountPaid || 0), 0);

    const diffDays = Math.ceil(Math.abs(periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const dailyData = [];
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(periodStart); d.setDate(d.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const val = periodInvoices.filter(inv => inv.date === ds && inv.status === 'Paid').reduce((a, b) => a + (b.amountPaid || 0), 0);
      dailyData.push({ name: ds, value: val });
    }

    return { periodActualRevenue, periodProjectedRevenue, periodInvoices, dailyData, isEmpty: periodInvoices.length === 0, rangeLabel: `${startDate} to ${endDate}` };
  }, [invoices, startDate, endDate]);

  const generateAiBrief = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a short summary of these numbers: Paid AED ${stats.periodActualRevenue}, Waiting AED ${stats.periodProjectedRevenue}. Total Ever AED ${telemetry.totalEarnings}. Max 2 sentences. Be simple and professional. Use mixed case.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiSummary(response.text || "Report processed.");
      pushNotification({ title: 'Intelligence Node', description: 'Business summary synthesized.', type: 'system' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const exportToCSV = () => {
    if (stats.periodInvoices.length === 0) {
      showToast('No registry data for this period', 'error');
      return;
    }

    const headers = ['ID', 'Date', 'Due Date', 'Client', 'Type', 'Status', 'Amount', 'Currency', 'Amount AED'];
    const rows = stats.periodInvoices.map(inv => [
      inv.id,
      inv.date,
      inv.dueDate,
      `"${inv.clientId}"`,
      inv.type,
      inv.status,
      inv.amountPaid,
      inv.currency,
      inv.amountAED
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Craftly_Report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Registry node exported to CSV');
    pushNotification({ title: 'Export Node', description: `Financial data exported for period ${startDate} to ${endDate}`, type: 'system' });
  };

  return (
    <div className="space-y-6 lg:space-y-10 animate-enter pb-32">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 px-1">
        <div className="space-y-4">
          <div className="flex items-center gap-3 lg:gap-4">
             <div className="w-10 h-10 lg:w-14 lg:h-14 bg-indigo-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 shrink-0">
               <BarChart3 size={20} className="lg:w-7 lg:h-7" />
             </div>
             <div>
                <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500">Reports Hub</span>
                <h2 className="text-xl lg:text-3xl font-black uppercase tracking-tight leading-none mt-1">My Reports</h2>
             </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 lg:gap-4 bg-[var(--bg-card)] p-2 lg:p-3 rounded-2xl lg:rounded-[2rem] border border-[var(--border-ui)] shadow-sm shrink-0">
          <div className="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-2 bg-[var(--bg-canvas)] rounded-xl lg:rounded-2xl border border-[var(--border-ui)]">
            <TemporalPicker label="Start" value={startDate} onChange={setStartDate} variant="inline" />
            <div className="w-px h-6 bg-[var(--border-ui)]/50" />
            <TemporalPicker label="End" value={endDate} onChange={setEndDate} align="right" variant="inline" />
            
            <div className="w-px h-6 bg-[var(--border-ui)]/50 mx-1 lg:mx-2" />
            <button 
              onClick={exportToCSV} 
              className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-[var(--bg-canvas)] rounded-lg lg:rounded-xl border border-[var(--border-ui)] text-slate-500 hover:text-indigo-500 hover:border-indigo-500 transition-all active:scale-95 shrink-0"
              title="Export CSV"
            >
              <FileSpreadsheet size={18} className="lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Paid Money', val: stats.periodActualRevenue, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Expected Money', val: stats.periodProjectedRevenue, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Risk / Unpaid', val: telemetry.pendingRevenue, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Total Ever', val: telemetry.totalEarnings, icon: Wallet, color: 'text-indigo-400', bg: 'bg-slate-950 text-white', isSpecial: true },
        ].map((s, i) => (
          <Card key={i} className={`group ${s.isSpecial ? s.bg : ''} border-2 !p-5 lg:!p-8`}>
             <div className="flex justify-between items-start mb-4 lg:mb-6">
                <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${s.isSpecial ? 'bg-white/10' : s.bg} ${s.color}`}><s.icon size={18} className="lg:w-5 lg:h-5" /></div>
                <Badge variant={s.color.includes('emerald') ? 'success' : s.color.includes('rose') ? 'danger' : 'info'} className="!text-[7px]">
                  {s.label.split(' ')[s.label.split(' ').length - 1]}
                </Badge>
             </div>
             <p className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest ${s.isSpecial ? 'opacity-60' : 'text-slate-500'} mb-1 lg:mb-2`}>{s.label}</p>
             <h3 className="text-lg lg:text-2xl font-black tabular-nums tracking-tighter leading-none">AED {s.val.toLocaleString()}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="lg:col-span-8 space-y-6 lg:space-y-10">
          <Card className="border-2 !p-5 lg:!p-8">
            <div className="flex items-center justify-between mb-6 lg:mb-10">
               <div>
                 <h4 className="text-sm lg:text-lg font-black uppercase tracking-tight">Money Chart</h4>
                 <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Earnings Registry Timeline</p>
               </div>
               <Badge variant="info" className="hidden sm:inline-flex">Operational Pulse</Badge>
            </div>
            <div className="h-[280px] lg:h-[400px]">
              {stats.isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                   <Activity size={48} strokeWidth={1} />
                   <p className="uppercase tracking-[0.4em] font-black text-[9px] lg:text-xs">No Node Activity</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyData}>
                    <defs><linearGradient id="fluxG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-ui)" opacity={0.3} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(1).join('/')} hide={window.innerWidth < 640} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '1rem', fontSize: '9px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textTransform: 'uppercase' }} />
                    <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#fluxG)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:space-y-10">
          <Card className="border-2 border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden !p-6 lg:!p-10">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <Zap size={100} />
            </div>
            <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
               <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center shrink-0">
                 <Zap size={20} className="lg:w-6 lg:h-6" />
               </div>
               <div>
                  <h4 className="text-xs lg:text-sm font-black uppercase tracking-tight">Intelligence Node</h4>
                  <p className="text-[7px] lg:text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 lg:mt-1">Operational Synthesis</p>
               </div>
            </div>
            {aiSummary ? (
              <div className="space-y-4 lg:space-y-6 animate-enter">
                 <p className="text-[13px] font-bold leading-relaxed italic text-[var(--text-primary)] opacity-90 border-l-4 border-indigo-500 pl-4 lg:pl-6">"{aiSummary}"</p>
                 <button onClick={() => setAiSummary(null)} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Re-Synthesize</button>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Synthesize a strategic summary of current registry telemetry.</p>
                 <Button onClick={generateAiBrief} loading={isAiLoading} className="w-full h-12 lg:h-14 shadow-xl !bg-indigo-600 border-indigo-600" icon={Zap}>Initialize Brief</Button>
              </div>
            )}
          </Card>
          
          <Card className="border-2 !p-6 lg:!p-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500"><Download size={16}/></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest">Registry Export</h4>
             </div>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">Extract period transaction nodes to CSV for fiscal verification.</p>
             <button 
              onClick={exportToCSV}
              className="w-full py-4 border border-[var(--border-ui)] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 transition-all bg-[var(--bg-canvas)]/30"
             >
               <FileSpreadsheet size={14}/>
               Commit CSV
             </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
