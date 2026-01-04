
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit2, X, ChevronLeft, Check, AlertTriangle, Package, ShieldCheck, FileBox, Info, Box } from 'lucide-react';
import { CatalogItem } from '../types.ts';
import ConfirmationModal from './ConfirmationModal.tsx';
import { Button, PriceInput } from './ui/Primitives.tsx';

interface StockProps { catalog: CatalogItem[]; onUpdateCatalog: (newCatalog: CatalogItem[]) => void; }

const Stock: React.FC<StockProps> = ({ catalog, onUpdateCatalog }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CatalogItem>>({
    name: '', category: 'ENGINEERING', unitPrice: 0, stockLevel: 0, isService: true, description: ''
  });

  const handleAddNew = () => { setEditingItem(null); setFormData({ name: '', category: 'ENGINEERING', unitPrice: 0, stockLevel: 0, isService: true, description: '' }); setShowForm(true); };
  const startEdit = (item: CatalogItem) => { setEditingItem(item); setFormData(item); setShowForm(true); };

  const handleDelete = () => {
    if (confirmDeleteId) {
      onUpdateCatalog(catalog.filter(p => p.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) { onUpdateCatalog(catalog.map(p => p.id === editingItem.id ? { ...p, ...formData } as CatalogItem : p)); }
    else {
      const newItem: CatalogItem = { ...formData, id: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}` } as CatalogItem;
      onUpdateCatalog([newItem, ...catalog]);
    }
    setShowForm(false);
  };

  const renderModal = () => {
    if (!showForm) return null;
    return createPortal(
      <div className="exec-modal-overlay">
        <div className="exec-modal-container max-w-2xl animate-pop-in">
          <header className="p-8 border-b border-[var(--border-ui)] flex items-center justify-between bg-[var(--bg-card)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <Package size={20} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">{editingItem ? 'Modify Asset' : 'Initialize Resource'}</h3>
            </div>
            <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" icon={X} className="text-rose-500 rounded-2xl" />
          </header>

          <form onSubmit={handleSubmit} className="exec-modal-content space-y-8 custom-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="exec-form-group">
                  <label className="exec-label">Resource Designation</label>
                  <input type="text" required className="exec-input uppercase font-black" placeholder="MODULE NAME" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="exec-form-group">
                  <label className="exec-label">Asset Modality</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: false, l: 'PHYSICAL' }, { val: true, l: 'DIGITAL' }].map(t => (
                      <button key={String(t.val)} type="button" onClick={() => setFormData({...formData, isService: t.val})} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.isService === t.val ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg' : 'border-[var(--border-ui)] text-[var(--text-secondary)] hover:border-indigo-500/50'}`}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="exec-form-group">
                  <PriceInput label="Unit Worth (AED)" value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} required />
                </div>
                <div className="exec-form-group">
                  <label className="exec-label">Node Count</label>
                  <input type="number" required className="exec-input font-black" placeholder="0" value={formData.stockLevel || ''} onChange={e => setFormData({...formData, stockLevel: parseInt(e.target.value) || 0})} />
                </div>
                <div className="exec-form-group">
                  <label className="exec-label">Cluster Category</label>
                  <select className="exec-select font-black uppercase" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="ENGINEERING">ENGINEERING</option>
                    <option value="CLOUD">CLOUD SERVICES</option>
                    <option value="CORE">CORE INFRA</option>
                    <option value="STRATEGY">STRATEGY</option>
                  </select>
                </div>
              </div>

              <div className="exec-form-group">
                <label className="exec-label">Technical Directives</label>
                <textarea rows={4} className="exec-textarea font-medium" placeholder="DEFINE ASSET PARAMETERS..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="pt-6 border-t border-[var(--border-ui)]">
                <Button type="submit" variant="primary" icon={Check} className="w-full h-16 shadow-2xl">
                  {editingItem ? 'Finalize Asset Index' : 'Commit Resource to Registry'}
                </Button>
              </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-10 animate-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between p-8 exec-card gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-primary)] leading-none">Resource Registry</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-3 font-semibold tracking-tight">Active managed assets: {catalog.length} nodes indexed.</p>
        </div>
        <Button onClick={handleAddNew} variant="primary" icon={Plus} className="px-10 shadow-xl h-14">
          Register Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {catalog.map((item) => (
          <div key={item.id} className="exec-card flex flex-col group overflow-hidden transition-all">
            <div className="h-40 bg-[var(--bg-canvas)]/30 flex items-center justify-center relative border-b border-[var(--border-ui)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-ui)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-all duration-300">
                {item.category === 'ENGINEERING' ? <ShieldCheck size={28} /> : <FileBox size={28} />}
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => startEdit(item)} variant="ghost" size="sm" icon={Edit2} className="shadow-sm border border-[var(--border-ui)]" />
                <Button onClick={() => setConfirmDeleteId(item.id)} variant="ghost" size="sm" icon={Trash2} className="text-rose-500 hover:bg-rose-500/10 shadow-sm border border-[var(--border-ui)]" />
              </div>
            </div>
            
            <div className="p-6 space-y-5 flex-1 flex flex-col">
              <div>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${!item.isService ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'} mb-3 inline-block`}>
                  {item.category}
                </span>
                <h3 className="font-black text-[var(--text-primary)] text-lg tracking-tight uppercase group-hover:text-[var(--accent)] transition-colors leading-tight line-clamp-1">{item.name}</h3>
                <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 tracking-widest uppercase opacity-40">{item.id}</p>
              </div>

              <div className="flex justify-between items-end mt-auto pt-5 border-t border-[var(--border-ui)]">
                <div>
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase mb-1">Unit Worth</p>
                  <p className="text-xl font-black tabular-nums tracking-tighter leading-none">AED {(item.unitPrice ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase mb-1">Volume</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${(item.stockLevel ?? 0) < 5 ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                    {item.stockLevel} UNITS
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {renderModal()}

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        title="Purge Resource"
        message="This managed asset will be removed from the registry. Are you sure you wish to decommission this node?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default Stock;
