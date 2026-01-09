import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  DollarSign,
  Package,
  Activity,
  Plus,
  CreditCard,
  Users,
  Briefcase,
  Settings2,
  Eye,
  EyeOff,
  X,
  GripVertical,
  ShieldCheck,
  ArrowUpRight,
  Loader2,
  Radar,
  ShieldAlert,
  ArrowRight,
  Rocket,
  Terminal,
  MousePointer2,
  RefreshCw,
  Sparkles,
  History,
  TrendingUp,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { WidgetId, WidgetConfig } from '../types';
import { useBusiness } from '../context/BusinessContext';
import { DEFAULT_WIDGETS } from '../services/api';
import { Badge, Card, Button, Heading } from './ui/Primitives';
import { createPortal } from 'react-dom';

const generateSparkline = (base: number = 0) => {
  const safeBase = Math.max(0, base);
  return [
    { name: 'P1', value: safeBase * 0.7 },
    { name: 'P2', value: safeBase * 0.85 },
    { name: 'P3', value: safeBase * 0.8 },
    { name: 'P4', value: safeBase * 1.1 },
    { name: 'P5', value: safeBase * 0.95 },
    { name: 'P6', value: safeBase * 1.2 },
    { name: 'Current', value: safeBase },
  ];
};

const StatCard = ({
  label,
  value,
  trend,
  icon: Icon,
  chartData,
  isPositive = true,
  onDragStart,
  onDragOver,
  onDrop,
  draggable,
}: any) => {
  return (
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
            {Icon && (
              <Icon size={14} />
            )}
          </div>
        </div>
        <div className="mb-3">
          <Badge
            variant={isPositive ? 'success' : 'danger'}
            className="inline-flex"
          >
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
              stroke={isPositive ? 'var(--accent)' : '#ef4444'}
              strokeWidth={2}
              fill={isPositive ? 'var(--accent)' : '#ef4444'}
              fillOpacity={0.05}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const AICommandBar = () => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const {
    pushNotification,
    showToast,
    proposals,
    clients,
    telemetry,
    userProfile
  } = useBusiness();

  // SECURITY: Only users with ACCESS_AI permission (or Owners) can use the Command Bar
  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const hasAiAccess = isOwner || userProfile?.permissions?.includes('ACCESS_AI');

  if (!hasAiAccess) return null;

  const handleExecute = async () => {
    if (!query.trim()) {
      return;
    }
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: Projects ${proposals?.length || 0}, Clients ${clients?.length || 0}, Earned AED ${telemetry?.totalEarnings || 0}. Question: ${query}`,
        config: {
          systemInstruction: 'You are Craftly AI, a helpful business assistant for a freelancer. Use simple, everyday English. Be brief and clear.',
        },
      });
      setResponse(res.text || 'Done.');
      showToast('Craftly AI Node Synced');
      pushNotification({
        title: 'Craftly AI',
        description: 'Query answered.',
        type: 'update',
      });
      setQuery('');
    } catch (e) {
      showToast('Request failed', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="w-full relative space-y-4">
      <div className="relative group">
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${
            isThinking ? 'animate-pulse' : ''
          }`}
        ></div>
        <div className="relative bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl flex items-center p-1 shadow-2xl overflow-hidden">
          <div className="pl-5 text-[var(--accent)] shrink-0">
            {isThinking ? (
              <Loader2
                size={20}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={20} />
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="Command Craftly AI..."
            className="flex-1 bg-transparent border-none outline-none px-5 py-4 text-xs font-bold uppercase tracking-widest placeholder:text-slate-500"
          />
          <button
            onClick={handleExecute}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 mr-1"
            disabled={!query.trim() || isThinking}
          >
            Send
          </button>
        </div>
      </div>
      {response && (
        <div className="animate-pop-in relative z-10">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative">
            <div className="flex items-center gap-2 mb-3 text-indigo-500">
              <Sparkles
                size={14}
                className="animate-pulse"
              />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">
                AI Insight
              </span>
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
              {response}
            </p>
            <button
              onClick={() => setResponse(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-rose-500 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<{ theme: string }> = () => {
  const {
    userProfile,
    telemetry,
    updateDashboardConfig,
    proposals,
    clients,
    showToast,
    loading,
    auditLogs,
  } = useBusiness();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [radarScanning, setRadarScanning] = useState(false);
  const [detectedRisks, setDetectedRisks] = useState<any[]>([]);

  const navigate = useNavigate();

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';
  const userPermissions = userProfile?.permissions || [];

  const activeWidgets = useMemo(() => {
    const config = userProfile?.dashboardConfig || DEFAULT_WIDGETS || [];
    if (!Array.isArray(config)) {
      return [];
    }
    return config
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order);
  }, [userProfile?.dashboardConfig]);

  useEffect(() => {
    const fetchInsight = async () => {
      const currentEarnings = telemetry?.totalEarnings || 0;
      const hasAiAccess = isOwner || userPermissions.includes('ACCESS_AI');
      
      if (!hasAiAccess || loading || aiInsight || isInsightLoading || currentEarnings === 0) {
        return;
      }
      setIsInsightLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze: Earned AED ${currentEarnings}, Active Projects ${proposals?.length || 0}. Give one short helpful tip for a UAE freelancer.`,
        });
        setAiInsight(res.text || 'Operational metrics stable.');
      } catch (e) {
        setAiInsight('Strategy node busy.');
      } finally {
        setIsInsightLoading(false);
      }
    };
    fetchInsight();
  }, [telemetry, loading, aiInsight, isInsightLoading, proposals?.length, isOwner, userPermissions]);

  const runRadarScan = async () => {
    setRadarScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentEarnings = telemetry?.totalEarnings || 0;
      const currentMargin = telemetry?.profitMargin || 0;
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze business: Revenue AED ${currentEarnings}, Margin ${currentMargin.toFixed(1)}%. Identify 3 business risks for UAE. JSON Array of {category, severity, warning, action}.`,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const parsed = JSON.parse(res.text || '[]');
      setDetectedRisks(
        parsed.map((r: any, i: number) => ({
          ...r,
          id: `r-${i}`,
        }))
      );
      showToast('Health Scan Complete');
    } catch (e) {
      showToast('Scan failed', 'error');
    } finally {
      setRadarScanning(false);
    }
  };

  const renderWidget = (id: WidgetId) => {
    // SECURITY BLOCK: Filter widgets based on permissions
    const canSeeFinance = isOwner || userPermissions.includes('MANAGE_FINANCE');
    const canSeeProjects = isOwner || userPermissions.includes('MANAGE_PROJECTS');
    const canSeeClients = isOwner || userPermissions.includes('MANAGE_CLIENTS');
    const canSeeAi = isOwner || userPermissions.includes('ACCESS_AI');

    if (['revenue_stat', 'pending_stat', 'revenue_chart', 'business_health'].includes(id) && !canSeeFinance) return null;
    if (['projects_stat', 'active_projects_list', 'deadlines_list'].includes(id) && !canSeeProjects) return null;
    if (id === 'clients_stat' && !canSeeClients) return null;
    if (['ai_strategy', 'ai_alerts'].includes(id) && !canSeeAi) return null;

    const dragProps = {
      draggable: true,
      onDragStart: () => setDraggedWidgetId(id),
      onDragOver: (e: any) => e.preventDefault(),
      onDrop: () => {
        if (draggedWidgetId && draggedWidgetId !== id) {
          const cfg = [...(userProfile?.dashboardConfig || DEFAULT_WIDGETS)];
          const dIdx = cfg.findIndex((w) => w.id === draggedWidgetId);
          const tIdx = cfg.findIndex((w) => w.id === id);
          if (dIdx > -1 && tIdx > -1) {
            const oldOrder = cfg[dIdx].order;
            cfg[dIdx].order = cfg[tIdx].order;
            cfg[tIdx].order = oldOrder;
            updateDashboardConfig(cfg);
            setDraggedWidgetId(null);
          }
        }
      },
    };

    switch (id) {
      case 'revenue_stat':
        return (
          <StatCard
            key={id}
            label="Revenue"
            value={`AED ${(telemetry?.totalEarnings || 0).toLocaleString()}`}
            trend="Settled"
            icon={DollarSign}
            chartData={generateSparkline(telemetry?.totalEarnings)}
            {...dragProps}
          />
        );
      case 'projects_stat':
        return (
          <StatCard
            key={id}
            label="Missions"
            value={telemetry?.activeMissions || 0}
            trend="Active"
            icon={Package}
            chartData={generateSparkline(telemetry?.activeMissions)}
            {...dragProps}
          />
        );
      case 'clients_stat':
        return (
          <StatCard
            key={id}
            label="Partners"
            value={telemetry?.clientCount || 0}
            trend="Total"
            icon={Users}
            chartData={generateSparkline(telemetry?.clientCount)}
            {...dragProps}
          />
        );
      case 'pending_stat':
        return (
          <StatCard
            key={id}
            label="Collection"
            value={`AED ${(telemetry?.pendingRevenue || 0).toLocaleString()}`}
            trend="Unpaid"
            icon={Activity}
            chartData={generateSparkline(telemetry?.pendingRevenue)}
            {...dragProps}
          />
        );

      case 'ai_strategy':
        return (
          <Card
            key={id}
            className="xl:col-span-4 border-2 border-indigo-500/10 bg-indigo-500/[0.03] flex flex-col"
            {...dragProps}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles size={18} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                Craftly Strategy
              </h4>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black tracking-tight leading-snug">
                {(telemetry?.totalEarnings || 0) === 0
                  ? 'Log your first income node to initialize strategy brief.'
                  : isInsightLoading
                  ? 'Synthesizing...'
                  : aiInsight}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-indigo-500/10">
              <button
                onClick={() => navigate('/ai-help')}
                className="w-full flex items-center justify-between text-indigo-500 font-black uppercase text-[9px] hover:bg-indigo-500/5 p-3 rounded-xl transition-all"
              >
                <span>Access AI Core</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </Card>
        );

      case 'ai_alerts':
        return (
          <Card
            key={id}
            className="xl:col-span-4 border-2 border-rose-500/10 group relative flex flex-col"
            {...dragProps}
          >
            <div className="flex items-center gap-3 mb-8">
              <div
                className={`w-10 h-10 ${
                  radarScanning
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-rose-500/10 text-rose-500'
                } rounded-xl flex items-center justify-center`}
              >
                {radarScanning ? (
                  <Radar
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <ShieldAlert size={18} />
                )}
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">
                Risk Mitigation
              </h4>
            </div>
            <div className="flex-1 space-y-4">
              {detectedRisks.length > 0 ? (
                detectedRisks.map((risk) => {
                  return (
                    <div
                      key={risk.id}
                      className="p-4 bg-[var(--bg-canvas)] border border-rose-500/10 rounded-2xl animate-enter"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                          {risk.category}
                        </span>
                        <Badge
                          variant={risk.severity === 'Critical' ? 'danger' : 'warning'}
                          className="!text-[7px]"
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-[10px] font-bold leading-tight mb-3">
                        {risk.warning}
                      </p>
                      <button
                        onClick={() => navigate('/ai-help')}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:underline flex items-center gap-1"
                      >
                        {risk.action}{' '}
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center opacity-20">
                  <ShieldCheck
                    size={40}
                    className="text-emerald-500 mb-4"
                  />
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    No Threats Detected
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-rose-500/10">
              <Button
                variant="danger"
                size="sm"
                className="w-full text-[9px] font-black uppercase h-12"
                onClick={runRadarScan}
                disabled={radarScanning}
              >
                Execute Scan
              </Button>
            </div>
          </Card>
        );

      case 'revenue_chart':
        return (
          <Card
            key={id}
            className="xl:col-span-8 group relative"
            {...dragProps}
          >
            <div className="flex flex-col mb-10">
              <h3 className="text-base lg:text-lg font-black uppercase tracking-tight truncate mb-2">
                Fiscal Pulse
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  Settlement History
                </span>
              </div>
            </div>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateSparkline(telemetry?.totalEarnings || 0)}>
                  <defs>
                    <linearGradient
                      id="fluxG"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--accent)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-ui)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-ui)',
                      borderRadius: '1rem',
                      fontSize: '10px',
                      fontWeight: '900',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#fluxG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );

      case 'recent_updates':
        return (
          <Card
            key={id}
            className="xl:col-span-4 flex flex-col"
            {...dragProps}
          >
            <div className="flex items-center gap-3 mb-8">
              <History
                size={18}
                className="text-slate-400"
              />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                Operational Journal
              </h4>
            </div>
            <div className="flex-1 space-y-4">
              {(auditLogs || []).slice(0, 5).map((log) => {
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-3 bg-[var(--bg-canvas)] rounded-xl border border-[var(--border-ui)]"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      <Activity size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-tight truncate text-[var(--text-primary)]">
                        {log.action}
                      </p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        {log.itemType} Node
                      </p>
                    </div>
                  </div>
                );
              })}
              {(auditLogs || []).length === 0 && (
                <div className="py-10 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    Journal Empty
                  </p>
                </div>
              )}
            </div>
          </Card>
        );

      case 'active_projects_list':
        return (
          <Card
            key={id}
            className="xl:col-span-4 flex flex-col"
            {...dragProps}
          >
            <div className="flex items-center gap-3 mb-8">
              <Briefcase
                size={18}
                className="text-indigo-400"
              />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                Deployments
              </h4>
            </div>
            <div className="flex-1 space-y-4">
              {(proposals || []).slice(0, 4).map((p) => {
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border-b border-[var(--border-ui)] last:border-0"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-[11px] font-black uppercase tracking-tight truncate">
                        {p.title}
                      </p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">
                        {p.clientName}
                      </p>
                    </div>
                    <Badge variant={p.status === 'Accepted' ? 'success' : 'info'}>
                      {p.status}
                    </Badge>
                  </div>
                );
              })}
              {(proposals || []).length === 0 && (
                <div className="py-10 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    No Active Deployments
                  </p>
                </div>
              )}
            </div>
          </Card>
        );

      case 'business_health':
        return (
          <Card
            key={id}
            className="xl:col-span-4 flex flex-col bg-emerald-500/[0.02]"
            {...dragProps}
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp
                size={18}
                className="text-emerald-500"
              />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                Margin Health
              </h4>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Net Profit Margin
              </p>
              <p className="text-5xl font-black text-emerald-500 tracking-tighter">
                {(telemetry?.profitMargin || 0).toFixed(1)}%
              </p>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full mt-6 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, telemetry?.profitMargin || 0)}%` }}
                />
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl animate-pulse">
              <RefreshCw
                size={32}
                className="text-white animate-spin [animation-duration:3s]"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--bg-canvas)] animate-bounce" />
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
              Syncing Workspace
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 leading-relaxed">
              Identity Registry Link in Progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty =
    (telemetry?.totalEarnings === 0 || telemetry?.totalEarnings === undefined) &&
    (proposals || []).length === 0 &&
    (clients || []).length === 0;

  return (
    <div className="space-y-6 lg:space-y-10 animate-enter pb-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading sub={`Session: ${userProfile?.fullName || 'Active Operative'}`}>
            Terminal
          </Heading>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="h-12 lg:h-14 w-12 lg:w-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-slate-500 hover:text-indigo-500 transition-all active:rotate-180"
              title="Resync Nodes"
            >
              <RefreshCw size={18} />
            </button>
            <Button
              variant="outline"
              onClick={() => setIsCustomizeOpen(true)}
              className="h-12 lg:h-14 !px-4"
              icon={Settings2}
            />
            <div className="relative">
              <Button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                variant="primary"
                className="h-12 lg:h-14"
              >
                <Plus size={16} />
                <span className="ml-2 uppercase tracking-widest text-[10px]">Initialize</span>
              </Button>
              {isActionsOpen && (
                <div className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[1.5rem] shadow-2xl p-2 z-header animate-pop-in">
                  {[
                    { label: 'Create Invoice', icon: CreditCard, path: '/invoices', permission: 'MANAGE_FINANCE' },
                    { label: 'Add Partner', icon: Users, path: '/clients', permission: 'MANAGE_CLIENTS' },
                    { label: 'Deploy Project', icon: Briefcase, path: '/projects/new', permission: 'MANAGE_PROJECTS' },
                  ].filter(a => isOwner || userPermissions.includes(a.permission)).map((a, i) => {
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          navigate(a.path);
                          setIsActionsOpen(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-canvas)] group transition-all"
                      >
                        <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                          <a.icon size={16} />
                        </div>
                        <span className="text-xs font-black uppercase text-[var(--text-primary)]">
                          {a.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <AICommandBar />
      </header>

      {isEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-enter">
          <Card className="lg:col-span-8 p-12 lg:p-20 flex flex-col items-center justify-center text-center border-dashed border-2 relative overflow-hidden bg-indigo-500/[0.01]">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl animate-bounce">
              <Rocket size={40} />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Node Ready</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-md leading-relaxed mb-12">
              Initialize your first client or deployment to activate the strategic dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {(isOwner || userPermissions.includes('MANAGE_PROJECTS')) && (
                <Button
                  onClick={() => navigate('/projects/new')}
                  className="h-14 px-10 shadow-xl"
                >
                  New Deployment
                </Button>
              )}
              {(isOwner || userPermissions.includes('MANAGE_CLIENTS')) && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/clients')}
                  className="h-14 px-10"
                >
                  Add Partner
                </Button>
              )}
            </div>
          </Card>
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 border-2 border-indigo-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                  <Terminal size={20} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest">Protocol Tip</h4>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                Complete your <span className="text-white">Profile</span> to ensure fiscal nodes are correctly branded.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
              >
                Sync Profile <MousePointer2 size={12} />
              </button>
            </Card>
            <Card className="p-8 border-2 border-emerald-500/10 bg-emerald-500/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest">Registry Sync</h4>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                Cloud backup active. All local data is strictly scoped to your organization.
              </p>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-6">
          <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {activeWidgets
              .filter((w) => ['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id))
              .map((w) => {
                return renderWidget(w.id);
              })}
          </div>
          {activeWidgets
            .filter((w) => !['revenue_stat', 'projects_stat', 'clients_stat', 'pending_stat'].includes(w.id))
            .map((w) => {
              return renderWidget(w.id);
            })}
        </div>
      )}

      {isCustomizeOpen &&
        createPortal(
          <div className="exec-modal-overlay">
            <div className="exec-modal-container !max-w-xl animate-pop-in">
              <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between">
                <h3>Customize Terminal</h3>
                <button onClick={() => setIsCustomizeOpen(false)}>
                  <X size={24} />
                </button>
              </header>
              <div className="p-8 space-y-2 max-h-[70vh] overflow-y-auto">
                {(userProfile?.dashboardConfig || DEFAULT_WIDGETS || [])
                  .sort((a, b) => a.order - b.order)
                  .map((w) => {
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          const cfg = (userProfile?.dashboardConfig || DEFAULT_WIDGETS).map((x) =>
                            x.id === w.id ? { ...x, visible: !x.visible } : x
                          );
                          updateDashboardConfig(cfg);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          w.visible
                            ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400'
                            : 'opacity-40 grayscale'
                        }`}
                      >
                        {w.visible ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {w.id.replace(/_/g, ' ')}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Dashboard;