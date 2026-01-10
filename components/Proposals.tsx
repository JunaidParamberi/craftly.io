
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, X, Eye, Edit2, Sparkles, Building2, ChevronDown, UserPlus,
  Search, Briefcase, Send
} from 'lucide-react';
import { Proposal } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import { GoogleGenAI, Type } from '@google/genai';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemporalPicker from './TemporalPicker.tsx';
import { Button, Card, Heading, Input, Badge, Select, Label, PriceInput, EmptyState } from './ui/Primitives.tsx';
import ProposalPdfSlideout from './ProposalPdfSlideout.tsx';

const CustomSelect = ({ label, value, options, onChange, onAction, actionLabel, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-0.5 opacity-60">{label}</label>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl flex items-center justify-between text-left hover:border-[var(--accent)] transition-all cursor-pointer">
        <div className="flex items-center gap-3 truncate pr-4">
          {Icon && <Icon size={16} className="text-[var(--accent)] shrink-0" />}
          <span className="truncate text-xs font-bold tracking-tight">{options.find((o: any) => o.id === value)?.label || value || 'Select Client...'}</span>
        </div>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400`} />
      </button>
      {isOpen && (
        <div className="absolute z-[10001] top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto custom-scroll animate-pop-in">
          {onAction && <button type="button" onClick={() => { onAction(); setIsOpen(false); }} className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--accent)] border-b border-[var(--border-ui)] hover:bg-[var(--accent)]/5 flex items-center gap-3 cursor-pointer"><UserPlus size={14} /> {actionLabel || 'Add New'}</button>}
          {options.map((opt: any) => (
            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); }} className={`w-full px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--accent)]/5 transition-all flex items-center justify-between cursor-pointer ${value === opt.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
              <span className="truncate pr-4">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Proposals: React.FC<{ forceNew?: boolean }> = ({ forceNew }) => {
  const navigate = useNavigate();
  const { clients, proposals, commitProject, updateProposal, deleteProposal } = useBusiness();
  const [showForm, setShowForm] = useState(forceNew || false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [step, setStep] = useState(0); 
  const [aiPrompt, setAiPrompt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchProposal, setDispatchProposal] = useState<Proposal | null>(null);

  const initialFormData: Partial<Proposal> = {
    title: '', clientName: '', clientId: '', industry: 'General', 
    startDate: new Date().toISOString().split('T')[0],
    timeline: new Date(Date.now() + 2592000000).toISOString().split('T')[0], 
    budget: 0, items: [], billingType: 'Fixed Price', 
    status: 'Draft', vibe: 'Creative', currency: 'AED'
  };

  const [formData, setFormData] = useState<Partial<Proposal>>(initialFormData);
  const currentTotal = (formData.items || []).reduce((acc, it) => acc + it.price, 0);

  useEffect(() => {
    if (forceNew) {
      setEditingId(null);
      setFormData(initialFormData);
      setStep(0);
      setShowForm(true);
    }
  }, [forceNew]);

  const calculateProgress = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const n = new Date().getTime();
    if (n < s) return 0;
    if (n > e) return 100;
    return Math.round(((n - s) / (e - s)) * 100);
  };

  const handleAiSmartSetup = async () => {
    if (!aiPrompt) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Project idea: "${aiPrompt}". Suggest: title, description, days, and budget. Use simple, everyday English.`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              estimatedDays: { type: Type.NUMBER },
              manifesto: { type: Type.STRING },
              brief: { type: Type.STRING },
              suggestedBudget: { type: Type.NUMBER }
            }, 
            required: ["title", "estimatedDays", "manifesto", "brief", "suggestedBudget"] 
          }
        }
      });
      
      const data = JSON.parse(response.text || '{}');
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (data.estimatedDays || 30));
      
      setFormData(prev => ({ 
        ...prev, 
        title: data.title || prev.title, 
        timeline: endDate.toISOString().split('T')[0], 
        scope: data.brief || aiPrompt,
        budget: data.suggestedBudget || prev.budget,
        aiDraftContent: data.manifesto 
      }));
      
      setStep(1);
    } catch (error) {
      setStep(1);
    } finally { 
      setIsAiProcessing(false); 
    }
  };

  const finalizeSave = () => {
    if (editingId) {
      updateProposal({ ...formData, id: editingId, budget: currentTotal || formData.budget } as Proposal);
    } else {
      const newId = `PRO-${Date.now()}`;
      commitProject({ ...formData, id: newId, budget: currentTotal || formData.budget, status: 'Draft' } as Proposal);
    }
    setShowForm(false);
    if (forceNew) navigate('/projects');
  };

  const closeForm = () => {
    setShowForm(false);
    if (forceNew) navigate('/projects');
  };

  return (
    <div className="space-y-8 animate-enter pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Heading sub={`You have ${proposals.length} active projects`}>Projects</Heading>
        <div className="flex gap-3">
          <Input 
            placeholder="Search projects..." 
            className="w-64"
            icon={Search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => navigate('/projects/new')} icon={Plus}>New Project</Button>
        </div>
      </header>

      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(prop => {
            const progress = calculateProgress(prop.startDate, prop.timeline);
            return (
              <Card key={prop.id} className="group flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                   <Badge variant={prop.status === 'Accepted' ? 'success' : prop.status === 'Sent' ? 'warning' : 'info'}>
                     {prop.status === 'Accepted' ? 'Active' : prop.status}
                   </Badge>
                   <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(prop.id); setFormData(prop); setStep(1); setShowForm(true); }} icon={Edit2} className="!w-9 !h-9 !p-0" />
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(prop.id)} icon={Trash2} className="!w-9 !h-9 !p-0 text-rose-500 hover:bg-rose-500/10" />
                   </div>
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight truncate">{prop.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 size={12} className="opacity-40" />
                    <p className="text-[10px] font-bold uppercase tracking-widest truncate">{prop.clientName}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-10">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                     <span>Progress</span>
                     <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden shadow-inner">
                     <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--accent)]'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-[var(--border-ui)] flex justify-between items-end">
                   <div className="flex gap-2">
                      <Button onClick={() => navigate(`/projects/${prop.id}`)} variant="ghost" size="icon" icon={Eye} className="bg-slate-100 dark:bg-slate-850" />
                      {prop.status !== 'Accepted' && (
                        <Button onClick={() => setDispatchProposal(prop)} variant="ghost" size="icon" icon={Send} className="bg-indigo-500/10 text-indigo-500" />
                      )}
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50">Budget</p>
                      <p className="text-2xl font-bold tabular-nums tracking-tighter text-[var(--text-primary)]">AED {prop.budget.toLocaleString()}</p>
                   </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={Briefcase} 
          title="No projects yet" 
          description="Ready to start a new project? Add your first one here."
          action={<Button onClick={() => navigate('/projects/new')} icon={Plus}>Start New Project</Button>}
        />
      )}

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container !max-w-4xl animate-pop-in">
             <header className="p-6 border-b border-[var(--border-ui)] flex justify-between items-center bg-[var(--bg-card)]">
                <Heading sub="Add project details">{editingId ? 'Edit Project' : 'New Project'}</Heading>
                <button onClick={closeForm} className="p-2 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"><X size={24} /></button>
             </header>
             <div className="p-8 custom-scroll max-h-[80vh] overflow-y-auto">
                {step === 0 ? (
                  <div className="space-y-10 py-10 text-center max-w-xl mx-auto">
                     <div className="space-y-4">
                        <div className="w-16 h-16 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20"><Sparkles size={32} /></div>
                        <h4 className="text-2xl font-bold tracking-tight">Simple AI Planner</h4>
                        <p className="text-xs font-medium text-slate-500">Tell us about your project in simple English.</p>
                     </div>
                     <textarea 
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl p-6 text-sm font-semibold outline-none focus:border-[var(--accent)] transition-all min-h-[120px] placeholder:opacity-30 leading-relaxed" 
                      placeholder="e.g. I need to design a logo and website for a coffee shop..." 
                      value={aiPrompt} 
                      onChange={e => setAiPrompt(e.target.value)} 
                     />
                     <div className="space-y-6">
                        <CustomSelect label="Select Client" value={formData.clientId} options={clients.map(c => ({ id: c.id, label: c.name }))} icon={Building2} onChange={(id: string) => { const c = clients.find(cl => cl.id === id); setFormData({...formData, clientId: id, clientName: c?.name || ''}); }} />
                        <div className="flex gap-3">
                           <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Skip AI</Button>
                           <Button onClick={handleAiSmartSetup} disabled={!aiPrompt || isAiProcessing || !formData.clientId} className="flex-[2]" loading={isAiProcessing} icon={Sparkles}>
                             Plan Project
                           </Button>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="Project Title" placeholder="What is the project called?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                          <CustomSelect label="Client" value={formData.clientId} options={clients.map(c => ({ id: c.id, label: c.name }))} icon={Building2} onChange={(id: string) => { const c = clients.find(cl => cl.id === id); setFormData({...formData, clientId: id, clientName: c?.name || ''}); }} />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <TemporalPicker label="Start Date" value={formData.startDate || ''} onChange={(v) => setFormData({...formData, startDate: v})} />
                          <TemporalPicker label="End Date" value={formData.timeline || ''} onChange={(v) => setFormData({...formData, timeline: v})} />
                          <Input label="Category" placeholder="e.g. Design, Web, Admin" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>Description</Label>
                          <textarea className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl p-4 text-sm font-medium outline-none focus:border-[var(--accent)] transition-all min-h-[160px] leading-relaxed" placeholder="What needs to be done?" value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} />
                       </div>
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                       <Card variant="muted" className="space-y-6">
                          <Heading sub="Billing">Project Budget</Heading>
                          <PriceInput value={formData.budget} currency={formData.currency} onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})} />
                          <Select label="Billing Type" value={formData.billingType} onChange={e => setFormData({...formData, billingType: e.target.value as any})}>
                            <option value="Fixed Price">Fixed Price</option>
                            <option value="Hourly">Hourly</option>
                            <option value="Monthly">Monthly</option>
                          </Select>
                       </Card>
                       <div className="pt-4 space-y-3">
                          <Button onClick={finalizeSave} className="w-full h-12" disabled={!formData.clientId || !formData.title}>Save Project</Button>
                          <Button variant="ghost" onClick={() => setStep(0)} className="w-full">Back to Planner</Button>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>,
        document.body
      )}

      <ProposalPdfSlideout 
        proposal={dispatchProposal} 
        onClose={() => setDispatchProposal(null)} 
      />

      <ConfirmationModal isOpen={!!confirmDeleteId} title="Delete Project" message="Are you sure you want to delete this project? This cannot be undone." onConfirm={() => { if (confirmDeleteId) deleteProposal(confirmDeleteId); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default Proposals;
