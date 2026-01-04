
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Client, CatalogItem, Proposal, Notification, UserProfile, Invoice, Language, ChatMessage, CalendarEvent, AuditEntry, HappinessLevel, Voucher, WidgetConfig,  Toast, ToastType } from '../types';
import { API } from '../services/api.ts';
import { translations } from '../services/translations.ts';

interface BusinessContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (client: Partial<Client>) => Client;
  updateClient: (client: Client) => void;
  catalog: CatalogItem[];
  addCatalogItem: (item: Partial<CatalogItem>) => CatalogItem;
  updateCatalogItem: (item: CatalogItem) => void;
  deleteCatalogItem: (id: string) => void;
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  addProposal: (proposal: Partial<Proposal>) => Proposal;
  notifications: Notification[];
  pushNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotifRead: (id: string) => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  commitProject: (proposal: Proposal) => void;
  updateProposal: (proposal: Proposal) => void;
  deleteProposal: (id: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Partial<Invoice>) => Invoice;
  updateInvoice: (updated: Invoice) => void;
  deleteInvoice: (id: string) => void;
  convertProposalToLPO: (proposal: Proposal) => void;
  convertDocToInvoice: (doc: Invoice) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  t: (key: string) => string;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  auditLogs: AuditEntry[];
  addAuditLog: (action: AuditEntry['action'], itemType: string, targetId: string) => void;
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  updateDashboardConfig: (config: WidgetConfig[]) => void;
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  campaignAsset: string | null;
  setCampaignAsset: (asset: string | null) => void;
  telemetry: {
    totalEarnings: number;
    totalExpenses: number;
    profitMargin: number;
    pendingRevenue: number;
    activeMissions: number;
    clientCount: number;
    unpaidCount: number;
    overdueCount: number;
    corporateTaxProgress: number;
    estimatedTaxLiability: number;
  };
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'revenue_stat', visible: true, order: 0 },
  { id: 'projects_stat', visible: true, order: 1 },
  { id: 'clients_stat', visible: true, order: 2 },
  { id: 'pending_stat', visible: true, order: 3 },
  { id: 'ai_strategy', visible: true, order: 4 },
  { id: 'revenue_chart', visible: true, order: 5 },
  { id: 'recent_updates', visible: true, order: 6 },
  { id: 'ai_alerts', visible: true, order: 7 },
  { id: 'business_health', visible: true, order: 8 },
  { id: 'active_projects_list', visible: true, order: 9 },
  { id: 'deadlines_list', visible: true, order: 10 },
  { id: 'top_services', visible: false, order: 11 },
];

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const profile = API.getProfile();
    if (!profile.dashboardConfig) {
      profile.dashboardConfig = DEFAULT_WIDGETS;
    } else {
      const missing = DEFAULT_WIDGETS.filter(dw => !profile.dashboardConfig?.some(pw => pw.id === dw.id));
      if (missing.length > 0) {
        profile.dashboardConfig = [...profile.dashboardConfig, ...missing];
      }
    }
    return profile;
  });
  const [clientsRaw, setClients] = useState<Client[]>(() => API.getClients());
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => API.getCatalog());
  const [proposalsRaw, setProposalsRaw] = useState<Proposal[]>(() => API.getProposals());
  const [invoicesRaw, setInvoicesRaw] = useState<Invoice[]>(() => API.getInvoices());
  const [notifications, setNotifications] = useState<Notification[]>(() => API.getNotifications());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => API.getChatMessages());
  const [events, setEvents] = useState<CalendarEvent[]>(() => API.getEvents());
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => API.getAuditLogs());
  const [campaignAsset, setCampaignAsset] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('craftly_vouchers');
    return saved ? JSON.parse(saved) : [];
  });
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('craftly_language') as Language) || 'EN');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clients = useMemo(() => {
    const today = new Date();
    const processed = clientsRaw.map(client => {
      const clientInvoices = invoicesRaw.filter(i => i.clientId === client.name);
      const paidRevenue = clientInvoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amountAED, 0);
      const clientProposals = proposalsRaw.filter(p => p.clientId === client.id || p.clientName === client.name);
      const hasAcceptedProjects = clientProposals.some(p => p.status === 'Accepted');
      
      let finalStatus = client.status;
      if (client.status !== 'Archived') {
        if (hasAcceptedProjects || paidRevenue > 0) finalStatus = 'Active';
        else finalStatus = 'Lead';
      }

      let happiness: HappinessLevel = 'HAPPY';
      const hasOverdue = clientInvoices.some(inv => inv.status !== 'Paid' && new Date(inv.dueDate) < today);
      const hasPending = clientInvoices.some(inv => inv.status !== 'Paid' && new Date(inv.dueDate) >= today);

      if (hasOverdue) happiness = 'SAD';
      else if (hasPending) happiness = 'NEUTRAL';

      return { ...client, status: finalStatus, totalLTV: paidRevenue, happiness };
    });
    if (userProfile.role === 'CLIENT') return processed.filter(c => c.id === userProfile.clientId);
    return processed;
  }, [clientsRaw, invoicesRaw, proposalsRaw, userProfile]);

  const proposals = useMemo(() => {
    if (userProfile.role === 'CLIENT') return proposalsRaw.filter(p => p.clientId === userProfile.clientId);
    if (userProfile.role === 'EMPLOYEE') return proposalsRaw.filter(p => userProfile.assignedProjectIds?.includes(p.id));
    return proposalsRaw;
  }, [proposalsRaw, userProfile]);

  const invoices = useMemo(() => {
    if (userProfile.role === 'CLIENT') {
      const myClient = clientsRaw.find(c => c.id === userProfile.clientId);
      return invoicesRaw.filter(i => i.clientId === myClient?.name);
    }
    return invoicesRaw;
  }, [invoicesRaw, userProfile, clientsRaw]);

  useEffect(() => API.saveClients(clientsRaw), [clientsRaw]);
  useEffect(() => API.saveInvoices(invoicesRaw), [invoicesRaw]);
  useEffect(() => API.saveNotifications(notifications), [notifications]);
  useEffect(() => API.saveEvents(events), [events]);
  useEffect(() => API.saveAuditLogs(auditLogs), [auditLogs]);
  useEffect(() => localStorage.setItem('craftly_catalog', JSON.stringify(catalog)), [catalog]);
  useEffect(() => localStorage.setItem('craftly_proposals', JSON.stringify(proposalsRaw)), [proposalsRaw]);
  useEffect(() => localStorage.setItem('craftly_vouchers', JSON.stringify(vouchers)), [vouchers]);
  useEffect(() => API.saveProfile(userProfile), [userProfile]);
  useEffect(() => API.saveChatMessages(chatMessages), [chatMessages]);

  const t = useCallback((key: string) => translations[language]?.[key] || translations['EN']?.[key] || key, [language]);
  const setLanguage = useCallback((lang: Language) => { setLanguageState(lang); localStorage.setItem('craftly_language', lang); }, []);

  const addAuditLog = useCallback((action: AuditEntry['action'], itemType: string, targetId: string) => {
    setAuditLogs(prev => [API.generateAuditEntry(action, itemType, targetId), ...prev].slice(0, 50));
  }, []);

  const pushNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    setNotifications(prev => [API.generateNotification(notif.title, notif.description, notif.type), ...prev]);
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const addClient = useCallback((data: Partial<Client>) => {
    const newC = { id: `CLI-${Date.now()}`, totalLTV: 0, createdAt: new Date().toISOString(), currency: 'AED', status: 'Lead', ...data } as Client;
    setClients(p => [newC, ...p]);
    addAuditLog('CREATED', 'Client', newC.id);
    showToast(`Client ${newC.name} added successfully`);
    return newC;
  }, [addAuditLog, showToast]);

  const updateClient = useCallback((updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    addAuditLog('UPDATED', 'Client', updated.id);
    showToast(`Updated client ${updated.name}`);
  }, [addAuditLog, showToast]);

  const addProposal = useCallback((data: Partial<Proposal>) => {
    const newP = { 
      id: `PRO-${Date.now()}`, 
      status: 'Draft',
      currency: 'AED',
      items: [],
      startDate: new Date().toISOString().split('T')[0],
      timeline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...data 
    } as Proposal;
    setProposalsRaw(prev => [newP, ...prev]);
    addAuditLog('CREATED', 'Project', newP.id);
    showToast(`Project ${newP.title} initialized`);
    return newP;
  }, [addAuditLog, showToast]);

  const commitProject = useCallback((p: Proposal) => { 
    setProposalsRaw(prev => [p, ...prev]); 
    addAuditLog('CREATED', 'Project', p.id);
    if (p.clientId) {
      setClients(prev => prev.map(c => (c.id === p.clientId && c.status === 'Lead') ? { ...c, status: 'Active' } : c));
    }
    showToast(`Mission ${p.title} registered`);
  }, [addAuditLog, showToast]);

  const updateProposal = useCallback((p: Proposal) => { 
    setProposalsRaw(prev => prev.map(old => old.id === p.id ? p : old)); 
    addAuditLog('UPDATED', 'Project', p.id); 
    showToast(`Changes saved for ${p.title}`);
  }, [addAuditLog, showToast]);

  const deleteProposal = useCallback((id: string) => { 
    setProposalsRaw(prev => prev.filter(p => p.id !== id)); 
    addAuditLog('DELETED', 'Project', id); 
    showToast(`Project removed from registry`, 'info');
  }, [addAuditLog, showToast]);
  
  const addInvoice = useCallback((data: Partial<Invoice>) => {
    const newInv = API.createInvoice(data);
    setInvoicesRaw(prev => [newInv, ...prev]);
    addAuditLog('CREATED', newInv.type, newInv.id);
    showToast(`${newInv.type} ${newInv.id} created successfully`);
    return newInv;
  }, [addAuditLog, showToast]);

  const updateInvoice = useCallback((updated: Invoice) => {
    setInvoicesRaw(prev => prev.map(inv => {
      if (inv.id === updated.id) {
        const amountAED = updated.currency === 'AED' ? updated.amountPaid : updated.amountPaid * 3.67;
        const result = { ...updated, amountAED, version: updated.status === 'Draft' ? updated.version : updated.version + 1 };
        addAuditLog('UPDATED', updated.type, updated.id);
        return result;
      }
      return inv;
    }));
    showToast(`${updated.type} ${updated.id} updated`);
  }, [addAuditLog, showToast]);

  const deleteInvoice = useCallback((id: string) => {
    const inv = invoicesRaw.find(i => i.id === id);
    setInvoicesRaw(prev => prev.filter(i => i.id !== id));
    if (inv) {
      addAuditLog('DELETED', inv.type, id);
      showToast(`${inv.type} deleted`, 'info');
    }
  }, [invoicesRaw, addAuditLog, showToast]);

  const addCatalogItem = useCallback((data: Partial<CatalogItem>) => {
    const newItem = { ...data, id: `CI-${Math.random().toString(36).substr(2, 6).toUpperCase()}` } as CatalogItem;
    setCatalog(prev => [newItem, ...prev]);
    addAuditLog('CREATED', 'Service', newItem.id);
    showToast(`Asset ${newItem.name} registered`);
    return newItem;
  }, [addAuditLog, showToast]);

  const updateCatalogItem = useCallback((item: CatalogItem) => {
    setCatalog(prev => prev.map(old => old.id === item.id ? item : old));
    addAuditLog('UPDATED', 'Service', item.id);
    showToast(`Service node ${item.name} updated`);
  }, [addAuditLog, showToast]);

  const deleteCatalogItem = useCallback((id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));
    addAuditLog('DELETED', 'Service', id);
    showToast(`Asset decommissioned`, 'info');
  }, [addAuditLog, showToast]);

  const convertProposalToLPO = useCallback((proposal: Proposal) => {
    const clientRef = clientsRaw.find(c => c.id === proposal.clientId || c.name === proposal.clientName);
    const productList = [{ productId: 'SERVICE', name: `PROJECT: ${proposal.title}`, quantity: 1, price: proposal.budget }];
    const total = proposal.budget;
    const amountAED = proposal.currency === 'AED' ? total : total * 3.67;
    const newLPO = API.createInvoice({ clientId: proposal.clientName, clientEmail: clientRef?.email || '', type: 'LPO', linkedProposalId: proposal.id, currency: proposal.currency, status: 'Sent', productList, amountPaid: total, amountAED, taxRate: 0, date: new Date().toISOString().split('T')[0], dueDate: proposal.timeline });
    setInvoicesRaw(prev => [newLPO, ...prev]);
    setProposalsRaw(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'Accepted' } : p));
    addAuditLog('CREATED', 'LPO', newLPO.id);
    showToast(`P.O generated for ${proposal.title}`);
    pushNotification({ title: 'Order Created', description: `Purchase order saved for ${proposal.title}. Project marked as Accepted.`, type: 'finance' });
  }, [clientsRaw, pushNotification, addAuditLog, showToast]);

  const convertDocToInvoice = useCallback((doc: Invoice) => {
    const invoiceData: Partial<Invoice> = {
      type: 'Invoice',
      clientId: doc.clientId,
      clientEmail: doc.clientEmail,
      currency: doc.currency,
      productList: JSON.parse(JSON.stringify(doc.productList)),
      taxRate: doc.taxRate,
      discountRate: doc.discountRate,
      sourceDocId: doc.id,
      status: 'Draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const newInv = addInvoice(invoiceData);
    setInvoicesRaw(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'Paid' } : d)); // Mark original as processed/paid
    showToast(`Generated Invoice ${newInv.id} from ${doc.type} ${doc.id}`);
    pushNotification({ title: 'Transition Complete', description: `Invoice created from ${doc.type} workflow.`, type: 'finance' });
  }, [addInvoice, pushNotification, showToast]);

  const updateDashboardConfig = useCallback((config: WidgetConfig[]) => {
    setUserProfile(prev => ({ ...prev, dashboardConfig: config }));
  }, []);

  const telemetry = useMemo(() => {
    const settledInvoices = invoices.filter(i => i.type === 'Invoice' && i.status === 'Paid');
    const pendingInvoices = invoices.filter(i => i.type === 'Invoice' && i.status !== 'Paid');
    const today = new Date();
    
    const totalEarnings = settledInvoices.reduce((acc, curr) => acc + (curr.amountAED || 0), 0);
    const totalExpenses = vouchers.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const profitMargin = totalEarnings > 0 ? ((totalEarnings - totalExpenses) / totalEarnings) * 100 : 0;
    const pendingRevenue = pendingInvoices.reduce((acc, curr) => acc + (curr.amountAED || 0), 0);
    const unpaidCount = pendingInvoices.length;
    const overdueCount = pendingInvoices.filter(i => new Date(i.dueDate) < today).length;
    const CT_THRESHOLD = 375000;
    
    return {
      totalEarnings,
      totalExpenses,
      profitMargin,
      pendingRevenue,
      activeMissions: proposals.length,
      clientCount: clients.length,
      unpaidCount,
      overdueCount,
      corporateTaxProgress: Math.min(100, (totalEarnings / CT_THRESHOLD) * 100),
      estimatedTaxLiability: totalEarnings > CT_THRESHOLD ? (totalEarnings - CT_THRESHOLD) * 0.09 : 0
    };
  }, [invoices, proposals, clients, vouchers]);

  return (
    <BusinessContext.Provider value={{
      clients, setClients, addClient, updateClient, catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, proposals, setProposals: setProposalsRaw, addProposal,
      notifications, pushNotification, markNotifRead, userProfile, setUserProfile,
      commitProject, updateProposal, deleteProposal, invoices, addInvoice, updateInvoice, deleteInvoice,
      convertProposalToLPO, convertDocToInvoice, language, setLanguage, t, chatMessages, setChatMessages, telemetry,
      events, setEvents, auditLogs, addAuditLog, vouchers, setVouchers, updateDashboardConfig,
      toasts, showToast, removeToast, campaignAsset, setCampaignAsset
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};
