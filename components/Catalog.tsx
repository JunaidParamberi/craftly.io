
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit2, X, Check, Briefcase, Zap, Sparkles, Loader2, Package, AlertTriangle } from 'lucide-react';
import { CatalogItem } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';
import { GoogleGenAI, Type } from '@google/genai';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Button, Input, Select, Card, Heading, Label, EmptyState, PriceInput } from './ui/Primitives.tsx';

const Catalog: React.FC = () => {
  const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, pushNotification } = useBusiness();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<CatalogItem>>({
    name: '', category: 'SERVICES', unitPrice: 0, estimatedCost: 0, isService: true, description: ''
  });

  const handleAiSuggest = async () => {
    if (!formData.name) return;
    setIsAiSuggesting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Service: "${formData.name}". Suggest: unitPrice (Selling Price in AED), estimatedCost (Internal Cost in AED), and a brief professional description. LOGIC RULE: The unitPrice MUST be significantly higher than the estimatedCost to ensure a healthy profit margin (at least 20-50% markup). Return valid JSON.`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              unitPrice: { type: Type.NUMBER, description: "Final selling price in AED" },
              estimatedCost: { type: Type.NUMBER, description: "Internal cost to provide service/item in AED" },
              description: { type: Type.STRING }
            },
            required: ["unitPrice", "estimatedCost", "description"]
          }
        }
      });
      
      const data = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        unitPrice: data.unitPrice || prev.unitPrice,
        estimatedCost: data.estimatedCost || prev.estimatedCost,
        description: data.description || prev.description
      }));
      pushNotification({ title: 'AI Recommendation', description: 'Profitable pricing model generated.', type: 'update' });
    } catch (e) {
      console.error("AI suggestion failed", e);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCatalogItem({ ...editingItem, ...formData } as CatalogItem);
    } else {
      addCatalogItem(formData);
    }
    setShowForm(false);
  };

  const isMarginNegative = formData.unitPrice !== undefined && formData.estimatedCost !== undefined && (formData.unitPrice < formData.estimatedCost) && formData.unitPrice !== 0;

  const renderModal = () => {
    if (!showForm) return null;
    return createPortal(
      <div className="exec-modal-overlay">
        <div className="exec-modal-container !max-w-xl animate-pop-in border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Package size={20}/>
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">New Service/Item</h3>
             </div>
             <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-all">
               <X size={24} />
             </button>
          </header>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 custom-scroll max-h-[85vh] overflow-y-auto">
            <div className="space-y-2">
              <Input 
                label="Name" 
                placeholder="E.G. WEB DESIGN" 
                value={formData.name} 
                className="font-black uppercase"
                rightIcon={isAiSuggesting ? Loader2 : Sparkles}
                onRightIconClick={handleAiSuggest}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6 relative">
              <PriceInput 
                label="Selling Price (AED)" 
                value={formData.unitPrice || ''} 
                className={isMarginNegative ? 'border-rose-500/50 ring-4 ring-rose-500/5' : ''}
                onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} 
              />
              <PriceInput 
                label="Internal Cost (AED)" 
                value={formData.estimatedCost || ''} 
                className={isMarginNegative ? 'border-rose-500/50 ring-4 ring-rose-500/5' : ''}
                onChange={e => setFormData({...formData, estimatedCost: parseFloat(e.target.value) || 0})} 
              />
              {isMarginNegative && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                  <AlertTriangle size={10} />
                  Critical Error: Selling price is lower than internal cost.
                </div>
              )}
            </div>

            <div className="pt-2">
              <Select 
                label="Category" 
                value={formData.category} 
                className="font-black uppercase"
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="SERVICES">SERVICES</option>
                <option value="ASSETS">ASSETS</option>
                <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea 
                rows={4} 
                className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl p-4 text-sm font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all min-h-[100px] placeholder:opacity-30" 
                placeholder="SPECIFICATIONS AND PARAMETERS..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full h-14 !rounded-2xl shadow-xl shadow-indigo-500/20" icon={Check}>
                Save Item
              </Button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-10 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <Heading sub={`List of what you sell — ${catalog.length} Items`}>Services & Items</Heading>
        <Button icon={Plus} onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'SERVICES', unitPrice: 0, estimatedCost: 0, isService: true, description: '' }); setShowForm(true); }}>
          New Item
        </Button>
      </div>

      {catalog.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {catalog.map((item) => (
            <Card key={item.id} className="group flex flex-col h-full relative p-0 overflow-hidden">
              <div className="h-32 bg-[var(--bg-card-muted)]/50 flex items-center justify-center relative border-b border-[var(--border-ui)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-all">
                    {item.isService ? <Briefcase size={24} /> : <Zap size={24} />}
                </div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingItem(item); setFormData(item); setShowForm(true); }} className="p-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-lg text-slate-400 hover:text-[var(--accent)] transition-all">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-[var(--text-primary)] text-sm uppercase leading-tight group-hover:text-[var(--accent)] transition-colors truncate">{item.name}</h3>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-40">{item.id}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--border-ui)] flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-50">Price</p>
                    <p className="text-xl font-black tabular-nums tracking-tighter leading-none">AED {(item.unitPrice ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Package} 
          title="No items detected" 
          description="Register your first service or asset to begin mission planning."
          action={<Button icon={Plus} onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'SERVICES', unitPrice: 0, estimatedCost: 0, isService: true, description: '' }); setShowForm(true); }}>Create Item</Button>}
        />
      )}

      {renderModal()}
      <ConfirmationModal isOpen={!!confirmDeleteId} title="Delete Item" message="Remove this from your list? This action is permanent." onConfirm={() => { deleteCatalogItem(confirmDeleteId!); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};

export default Catalog;
