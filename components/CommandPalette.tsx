
import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutDashboard, Users, CreditCard, Package, MessageSquare, FileText, Calendar as CalendarIcon, Receipt, ArrowRight, Briefcase, Settings as SettingsIcon, BarChart3, UserCircle, Sparkles, DollarSign } from 'lucide-react';
import { View } from '../types.ts';
import { useBusiness } from '../context/BusinessContext.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (view: View, linkId?: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  // Get all searchable data from context
  const { clients, proposals, invoices, catalog, events, vouchers, chatThreads } = useBusiness();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigationCommands = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, category: 'Navigation', keywords: ['dashboard', 'home', 'main'] },
    { id: View.CRM, label: 'Clients', icon: Users, category: 'Navigation', keywords: ['clients', 'customers', 'crm', 'contacts'] },
    { id: View.FINANCE, label: 'Invoices', icon: CreditCard, category: 'Navigation', keywords: ['invoices', 'invoice', 'billing', 'finance', 'payments'] },
    { id: View.PROPOSALS, label: 'Projects', icon: Briefcase, category: 'Navigation', keywords: ['projects', 'proposals', 'project', 'proposal'] },
    { id: View.LPO, label: 'LPOs', icon: Receipt, category: 'Navigation', keywords: ['lpo', 'lpos', 'purchase order', 'orders'] },
    { id: View.CATALOG, label: 'Services', icon: Package, category: 'Navigation', keywords: ['services', 'catalog', 'products', 'items'] },
    { id: View.CALENDAR, label: 'Calendar', icon: CalendarIcon, category: 'Navigation', keywords: ['calendar', 'schedule', 'events', 'meetings'] },
    { id: View.CHAT, label: 'AI Assistant', icon: Sparkles, category: 'Navigation', keywords: ['ai', 'assistant', 'chat', 'help', 'creaftlyai'] },
    { id: View.TEAM_CHAT, label: 'Team Chat', icon: MessageSquare, category: 'Navigation', keywords: ['team', 'chat', 'messages', 'communication'] },
    { id: View.EXPENSES, label: 'Expenses', icon: Receipt, category: 'Navigation', keywords: ['expenses', 'costs', 'vouchers', 'receipts'] },
    { id: View.REPORTS, label: 'Reports', icon: BarChart3, category: 'Navigation', keywords: ['reports', 'analytics', 'stats', 'statistics'] },
    { id: View.SETTINGS, label: 'Settings', icon: SettingsIcon, category: 'Navigation', keywords: ['settings', 'config', 'preferences', 'options'] },
    { id: View.PROFILE, label: 'Profile', icon: UserCircle, category: 'Navigation', keywords: ['profile', 'account', 'user', 'me'] },
  ];

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return navigationCommands.slice(0, 8); // Show top 8 commands when no query
    }
    
    const q = query.toLowerCase().trim();
    
    // Search navigation commands by label and keywords
    const navs = navigationCommands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(q);
      const keywordMatch = (cmd.keywords || []).some(kw => kw.toLowerCase().includes(q));
      return labelMatch || keywordMatch;
    }).map(cmd => ({ 
      id: cmd.id, 
      label: cmd.label, 
      sub: cmd.category, 
      icon: cmd.icon, 
      category: cmd.category,
      linkId: undefined
    }));
    
    // Search clients
    const clientResults = (clients || [])
      .filter(c => 
        (c?.name?.toLowerCase() || '').includes(q) || 
        (c?.contactPerson?.toLowerCase() || '').includes(q) ||
        (c?.email?.toLowerCase() || '').includes(q)
      )
      .map(c => ({ 
        id: View.CRM, 
        label: `Client: ${c.name || 'Unknown'}`, 
        sub: c.contactPerson || c.email || '', 
        icon: Users, 
        category: 'Client',
        linkId: c.id
      }));
      
    // Search projects/proposals
    const projectResults = (proposals || [])
      .filter(p => 
        (p?.title?.toLowerCase() || '').includes(q) || 
        (p?.clientName?.toLowerCase() || '').includes(q) ||
        (p?.status?.toLowerCase() || '').includes(q)
      )
      .map(p => ({ 
        id: View.PROPOSALS, 
        label: `Project: ${p.title || 'Unknown'}`, 
        sub: `${p.clientName || 'Unknown'} • ${p.status || 'Unknown'}`, 
        icon: FileText, 
        category: 'Project',
        linkId: p.id
      }));

    // Search invoices
    const invoiceResults = (invoices || [])
      .filter(i => 
        (i?.id?.toLowerCase() || '').includes(q) || 
        (i?.clientId?.toLowerCase() || '').includes(q) ||
        (i?.type?.toLowerCase() || '').includes(q) ||
        (i?.status?.toLowerCase() || '').includes(q)
      )
      .map(i => ({ 
        id: i.type === 'LPO' ? View.LPO : View.FINANCE, 
        label: `${i.type || 'Invoice'}: ${i.id || 'Unknown'}`, 
        sub: `${i.clientId || 'Unknown'} • ${i.status || 'Unknown'}`, 
        icon: Receipt, 
        category: i.type || 'Invoice',
        linkId: i.id
      }));

    // Search catalog items (services/products)
    const catalogResults = (catalog || [])
      .filter(item => 
        (item?.name?.toLowerCase() || '').includes(q) || 
        (item?.category?.toLowerCase() || '').includes(q) ||
        (item?.description?.toLowerCase() || '').includes(q)
      )
      .map(item => ({ 
        id: View.CATALOG, 
        label: `${item.isService ? 'Service' : 'Product'}: ${item.name || 'Unknown'}`, 
        sub: `${item.category || 'Uncategorized'} • ${item.unitPrice ? `${item.unitPrice}` : 'N/A'}`, 
        icon: Package, 
        category: 'Catalog',
        linkId: undefined
      }));

    // Search calendar events
    const eventResults = (events || [])
      .filter(event => 
        (event?.title?.toLowerCase() || '').includes(q) || 
        (event?.description?.toLowerCase() || '').includes(q) ||
        (event?.type?.toLowerCase() || '').includes(q)
      )
      .map(event => ({ 
        id: View.CALENDAR, 
        label: `Event: ${event.title || 'Unknown'}`, 
        sub: `${event.type || 'Event'} • ${event.date || 'No date'}`, 
        icon: CalendarIcon, 
        category: 'Event',
        linkId: event.id
      }));

    // Search vouchers/expenses
    const voucherResults = (vouchers || [])
      .filter(v => 
        (v?.description?.toLowerCase() || '').includes(q) || 
        (v?.category?.toLowerCase() || '').includes(q) ||
        (v?.type?.toLowerCase() || '').includes(q) ||
        (v?.status?.toLowerCase() || '').includes(q)
      )
      .map(v => ({ 
        id: View.EXPENSES, 
        label: `${v.type || 'Voucher'}: ${v.description || 'Unknown'}`, 
        sub: `${v.category || 'Uncategorized'} • ${v.amount || 0} • ${v.status || 'Unknown'}`, 
        icon: DollarSign, 
        category: 'Voucher',
        linkId: undefined
      }));

    // Search chat threads
    const chatResults = (chatThreads || [])
      .filter(thread => 
        (thread?.title?.toLowerCase() || '').includes(q)
      )
      .map(thread => ({ 
        id: View.CHAT, 
        label: `Chat: ${thread.title || 'Untitled'}`, 
        sub: `${thread.messages?.length || 0} messages`, 
        icon: MessageSquare, 
        category: 'Chat',
        linkId: thread.id
      }));

    // Combine and sort by relevance (exact matches first, then partial)
    const allResults = [
      ...navs, 
      ...clientResults, 
      ...projectResults, 
      ...invoiceResults,
      ...catalogResults,
      ...eventResults,
      ...voucherResults,
      ...chatResults
    ];
    
    return allResults.sort((a, b) => {
      const aExact = a.label.toLowerCase() === q || a.label.toLowerCase().startsWith(q);
      const bExact = b.label.toLowerCase() === q || b.label.toLowerCase().startsWith(q);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
  }, [query, clients, proposals, invoices, catalog, events, vouchers, chatThreads]);

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
        const item = filteredItems[selectedIndex];
        onSelect(item.id as View, (item as any).linkId);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="exec-modal-overlay" style={{ zIndex: 20000, alignItems: 'flex-start', paddingTop: '15vh', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="fixed inset-0" onClick={onClose} />
      <div 
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2rem] shadow-2xl overflow-hidden animate-pop-in relative"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-4 px-8 py-6 border-b border-[var(--border-ui)] group bg-[var(--bg-canvas)]/50">
          <Search size={20} className="text-[var(--accent)]" />
          <input 
            type="text" 
            placeholder="Search anything... (clients, projects, invoices, services, events, expenses)"
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-40 uppercase tracking-widest"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-[10px] font-black text-[var(--text-secondary)] opacity-60">
              ESC
            </div>
            {query && (
              <div className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl text-[10px] font-black text-[var(--text-secondary)] opacity-60">
                {filteredItems.length} results
              </div>
            )}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-3 custom-scroll">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => { 
                    onSelect(item.id as View, (item as any).linkId); 
                    onClose(); 
                  }}
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
                  {idx === selectedIndex && (
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                      Go to Page <ArrowRight size={12} />
                    </div>
                  )}
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
