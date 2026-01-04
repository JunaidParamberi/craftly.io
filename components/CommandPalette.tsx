
import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutDashboard, Users, CreditCard, Package, MessageSquare, FileText, Calendar as CalendarIcon, Clock, Receipt, ArrowRight } from 'lucide-react';
import { View } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (view: View) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  // Fix: Replaced projects with proposals as projects doesn't exist in BusinessContext
  const { clients, proposals, invoices } = useBusiness();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigationCommands = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: View.CRM, label: 'Clients', icon: Users, category: 'Navigation' },
    { id: View.FINANCE, label: 'Invoices', icon: CreditCard, category: 'Navigation' },
    { id: View.PROPOSALS, label: 'Proposals', icon: FileText, category: 'Navigation' },
    { id: View.CATALOG, label: 'Services', icon: Package, category: 'Navigation' },
    { id: View.CALENDAR, label: 'Calendar', icon: CalendarIcon, category: 'Navigation' },
    { id: View.CHAT, label: 'AI Assistant', icon: MessageSquare, category: 'Navigation' },
  ];

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    
    const navs = navigationCommands.filter(cmd => cmd.label.toLowerCase().includes(q));
    
    const clientResults = clients
      .filter(c => c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q))
      .map(c => ({ id: View.CRM, label: `Client: ${c.name}`, sub: c.contactPerson, icon: Users, category: 'Client' }));
      
    // Fix: Using proposals and title instead of non-existent projects and name
    const projectResults = proposals
      .filter(p => p.title.toLowerCase().includes(q))
      .map(p => ({ id: View.PROPOSALS, label: `Project: ${p.title}`, sub: p.status, icon: FileText, category: 'Project' }));

    const invoiceResults = invoices
      .filter(i => i.id.toLowerCase().includes(q) || i.clientId.toLowerCase().includes(q))
      .map(i => ({ id: View.FINANCE, label: `Invoice: ${i.id}`, sub: i.clientId, icon: Receipt, category: 'Invoice' }));

    return [...navs, ...clientResults, ...projectResults, ...invoiceResults];
  }, [query, clients, proposals, invoices]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex].id as View);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      <div 
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2rem] shadow-2xl overflow-hidden animate-pop-in relative"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-ui)] group bg-[var(--bg-canvas)]/50">
          <Search size={20} className="text-[var(--accent)]" />
          <input 
            type="text" 
            placeholder="Search projects, clients, or invoices..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-40 uppercase tracking-widest"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
          />
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-[10px] font-black text-[var(--text-secondary)] opacity-60">
            ESC
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-3 custom-scroll">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => { onSelect(item.id as View); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`
                    w-full flex items-center justify-between px-8 py-4 transition-all
                    ${idx === selectedIndex ? 'bg-[var(--accent)]/10 text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}
                  `}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-2.5 rounded-xl transition-all ${idx === selectedIndex ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)]'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black uppercase tracking-tight block mb-0.5">{item.label}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 block">{(item as any).sub || item.category}</span>
                    </div>
                  </div>
                  {idx === selectedIndex && <div className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">Go to Page <ArrowRight size={12} /></div>}
                </button>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">No matches found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
