import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Client, CatalogItem, Proposal, Notification, UserProfile, 
  Language, ChatThread, CalendarEvent, AuditEntry, Voucher, 
  WidgetConfig, Toast, ToastType, Invoice, Campaign 
} from '../types';
import { API, DEFAULT_WIDGETS } from '../services/api';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { translations } from '../services/translations';
import { notificationService } from '../services/notificationService';

interface BusinessContextType {
  user: User | null;
  userProfile: UserProfile | null | undefined;
  loading: boolean;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (client: Partial<Client>) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  catalog: CatalogItem[];
  addCatalogItem: (item: Partial<CatalogItem>) => Promise<CatalogItem>;
  updateCatalogItem: (item: CatalogItem) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  notifications: Notification[];
  pushNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'companyId'>) => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  commitProject: (proposal: Partial<Proposal>) => Promise<void>;
  updateProposal: (proposal: Proposal) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (invoice: Partial<Invoice>) => Promise<Invoice>;
  updateInvoice: (updated: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  convertProposalToLPO: (proposal: Proposal) => Promise<void>;
  convertDocToInvoice: (doc: Invoice) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => void;
  chatThreads: ChatThread[];
  saveChatThread: (thread: ChatThread) => Promise<void>;
  deleteChatThread: (id: string) => Promise<void>;
  t: (key: string) => string;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  deleteEvent: (id: string) => Promise<void>;
  auditLogs: AuditEntry[];
  addAuditLog: (action: AuditEntry['action'], itemType: string, targetId: string) => Promise<void>;
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  saveVoucher: (voucher: Voucher) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  updateDashboardConfig: (config: WidgetConfig[]) => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  campaignAsset: string | null;
  setCampaignAsset: (asset: string | null) => void;
  provisionUser: (data: Partial<UserProfile>) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
  campaigns: Campaign[];
  saveCampaign: (campaign: Campaign) => Promise<void>;
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

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [clientsRaw, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [proposalsRaw, setProposalsRaw] = useState<Proposal[]>([]);
  const [invoicesRaw, setInvoicesRaw] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignAsset, setCampaignAsset] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('craftly_language') as Language) || 'EN');

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setLoading(true); 
        
        unsubProfile = onSnapshot(
          doc(db, 'users', fbUser.uid), 
          (docSnap) => {
            try {
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                data.permissions = Array.isArray(data.permissions) ? data.permissions : [];
                if (!data.dashboardConfig || !Array.isArray(data.dashboardConfig) || data.dashboardConfig.length === 0) {
                  data.dashboardConfig = DEFAULT_WIDGETS;
                }
                setUserProfileState({ ...data });
              } else {
                setUserProfileState(null);
              }
            } catch (error) {
              console.error("Error processing user profile:", error);
              setUserProfileState(null);
            } finally {
              setLoading(false);
            }
          }, 
          (err: any) => {
            console.error("Identity sync failure:", err);
            if (err?.code === 'permission-denied') {
              console.error("Permission denied: Check Firestore security rules");
            } else if (err?.code === 'unavailable') {
              console.error("Service unavailable: Check internet connection");
            }
            setUserProfileState(null);
            setLoading(false);
          }
        );
      } else {
        if (unsubProfile) unsubProfile();
        setUser(null);
        setUserProfileState(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const previousNotificationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user || !userProfile?.companyId) return;
    const cid = userProfile.companyId;
    let unsubscribes: (() => void)[] = [];
    
    try {
      unsubscribes.push(API.subscribeToTenantCollection<Client>('clients', cid, setClients));
      unsubscribes.push(API.subscribeToTenantCollection<CatalogItem>('catalog', cid, setCatalog));
      unsubscribes.push(API.subscribeToTenantCollection<Proposal>('proposals', cid, setProposalsRaw));
      unsubscribes.push(API.subscribeToTenantCollection<Invoice>('invoices', cid, setInvoicesRaw));
      unsubscribes.push(API.subscribeToTenantCollection<Notification>('notifications', cid, (newNotifications) => {
        // Store previous notification IDs
        const previousIds = previousNotificationsRef.current;
        const currentIds = newNotifications.map(n => n.id);
        
        // Find new notifications (not in previous list)
        const newNotifs = newNotifications.filter(n => !previousIds.includes(n.id));
        
        // Show browser notifications for new unread notifications
        newNotifs.forEach(notif => {
          if (!notif.isRead) {
            notificationService.showBrowserNotification(notif);
            notificationService.addToHistory(notif);
          }
        });
        
        // Update previous notifications
        previousNotificationsRef.current = currentIds;
        setNotifications(newNotifications);
      }));
      unsubscribes.push(API.subscribeToTenantCollection<ChatThread>('chat_threads', cid, (data) => {
        setChatThreads(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      }));
      unsubscribes.push(API.subscribeToTenantCollection<CalendarEvent>('events', cid, setEvents));
      unsubscribes.push(API.subscribeToTenantCollection<AuditEntry>('audit_logs', cid, setAuditLogs));
      unsubscribes.push(API.subscribeToTenantCollection<Voucher>('vouchers', cid, setVouchers));
      unsubscribes.push(API.subscribeToTenantCollection<Campaign>('campaigns', cid, (data) => {
        setCampaigns(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }));
    } catch (e) {
      console.error("Subsystem linkage error:", e);
    }
    return () => unsubscribes.forEach(u => u());
  }, [user, userProfile?.companyId]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const t = useCallback((key: string) => translations[language]?.[key] || translations['EN']?.[key] || key, [language]);
  const setLanguage = (lang: Language) => { setLanguageState(lang); localStorage.setItem('craftly_language', lang); };

  const setUserProfile = async (profile: UserProfile) => { await API.saveProfile(profile); };

  const telemetry = useMemo(() => {
    const settledInvoices = invoicesRaw.filter(i => i.type === 'Invoice' && i.status === 'Paid');
    const pendingInvoices = invoicesRaw.filter(i => i.type === 'Invoice' && i.status !== 'Paid');
    const today = new Date();
    
    const totalEarningsFromInvoices = settledInvoices.reduce((acc, curr) => acc + (curr.amountAED || 0), 0);
    const totalRevenueFromVouchers = vouchers.filter(v => v.type === 'RECEIPT').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalRevenue = totalEarningsFromInvoices + totalRevenueFromVouchers;
    const totalExpenses = vouchers.filter(v => v.type === 'EXPENSE').reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
    return {
      totalEarnings: totalRevenue, 
      totalExpenses, 
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      pendingRevenue: pendingInvoices.reduce((acc, curr) => acc + (curr.amountAED || 0), 0),
      activeMissions: proposalsRaw.length, 
      clientCount: clientsRaw.length, 
      unpaidCount: pendingInvoices.length, 
      overdueCount: pendingInvoices.filter(i => new Date(i.dueDate) < today).length,
      corporateTaxProgress: Math.min(100, (totalRevenue / 375000) * 100), 
      estimatedTaxLiability: totalRevenue > 375000 ? (totalRevenue - 375000) * 0.09 : 0
    };
  }, [invoicesRaw, proposalsRaw, clientsRaw, vouchers]);

  const addClient = async (data: Partial<Client>) => {
    try {
      if (!userProfile?.companyId) {
        throw new Error("Company ID not found. Please complete onboarding.");
      }
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        throw new Error("Client name is required");
      }
      const newC = { 
        id: `CLI-${Date.now()}`, 
        companyId: userProfile.companyId, 
        totalLTV: 0, 
        createdAt: new Date().toISOString(), 
        currency: userProfile?.currency || 'AED', 
        status: 'Lead', 
        ...data 
      } as Client;
      await API.saveItem('clients', newC);
      showToast(`Partner node indexed`);
      return newC;
    } catch (error: any) {
      console.error("Error adding client:", error);
      showToast(error?.message || 'Failed to add client', 'error');
      throw error;
    }
  };

  const updateClient = async (updated: Client) => {
    try {
      if (!updated || !updated.id) {
        throw new Error("Invalid client data");
      }
      await API.saveItem('clients', updated);
      showToast(`Partner node updated`);
    } catch (error: any) {
      console.error("Error updating client:", error);
      showToast(error?.message || 'Failed to update client', 'error');
      throw error;
    }
  };
  
  const deleteClient = async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error("Invalid client ID");
      }
      await API.deleteItem('clients', id);
      showToast(`Partner node decommissioned`, 'info');
    } catch (error: any) {
      console.error("Error deleting client:", error);
      showToast(error?.message || 'Failed to delete client', 'error');
      throw error;
    }
  };
  
  const commitProject = async (p: Partial<Proposal>) => {
    try {
      if (!userProfile?.companyId) {
        throw new Error("Company ID not found. Please complete onboarding.");
      }
      if (!p.title || typeof p.title !== 'string' || p.title.trim() === '') {
        throw new Error("Project title is required");
      }
      const finalStatus = userProfile?.role === 'EMPLOYEE' ? 'Pending Approval' : (p.status || 'Draft');
      const finalP = { 
        ...p, 
        id: p.id || `PRO-${Date.now()}`, 
        companyId: userProfile.companyId, 
        status: finalStatus 
      } as Proposal;
      await API.saveItem('proposals', finalP);
      showToast(finalStatus === 'Pending Approval' ? 'Awaiting authority clearance' : `Mission ${finalP.title} registered`);
    } catch (error: any) {
      console.error("Error committing project:", error);
      showToast(error?.message || 'Failed to save project', 'error');
      throw error;
    }
  };

  const updateProposal = async (p: Proposal) => {
    try {
      if (!p || !p.id) {
        throw new Error("Invalid proposal data");
      }
      await API.saveItem('proposals', p);
      showToast(`Mission updated`);
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      showToast(error?.message || 'Failed to update proposal', 'error');
      throw error;
    }
  };
  
  const deleteProposal = async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error("Invalid proposal ID");
      }
      await API.deleteItem('proposals', id);
      showToast(`Mission purged`, 'info');
    } catch (error: any) {
      console.error("Error deleting proposal:", error);
      showToast(error?.message || 'Failed to delete proposal', 'error');
      throw error;
    }
  };
  
  const addInvoice = async (data: Partial<Invoice>) => {
    try {
      if (!userProfile?.companyId) {
        throw new Error("Company ID not found. Please complete onboarding.");
      }
      if (!data.clientId || typeof data.clientId !== 'string') {
        throw new Error("Client is required");
      }
      if (!data.productList || !Array.isArray(data.productList) || data.productList.length === 0) {
        throw new Error("At least one product/service is required");
      }
      const isEmployee = userProfile.role === 'EMPLOYEE';
      const newInv = API.createInvoice(
        { ...data, status: isEmployee ? 'Pending Approval' : (data.status || 'Draft') }, 
        userProfile.companyId
      );
      await API.saveItem('invoices', newInv);
      showToast(isEmployee ? 'Awaiting authority clearance' : `${newInv.type} registered`);
      return newInv;
    } catch (error: any) {
      console.error("Error adding invoice:", error);
      showToast(error?.message || 'Failed to create invoice', 'error');
      throw error;
    }
  };

  const updateInvoice = async (updated: Invoice) => {
    try {
      if (!updated || !updated.id) {
        throw new Error("Invalid invoice data");
      }
      await API.saveItem('invoices', updated);
      showToast(`Document node synced`);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      showToast(error?.message || 'Failed to update invoice', 'error');
      throw error;
    }
  };
  
  const deleteInvoice = async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error("Invalid invoice ID");
      }
      await API.deleteItem('invoices', id);
      showToast(`Document purged`, 'info');
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      showToast(error?.message || 'Failed to delete invoice', 'error');
      throw error;
    }
  };
  
  const addCatalogItem = async (data: Partial<CatalogItem>) => { 
    const newItem = { ...data, id: `CI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, companyId: userProfile?.companyId } as CatalogItem; 
    await API.saveItem('catalog', newItem); 
    showToast(`Asset registered`); 
    return newItem; 
  };

  const updateCatalogItem = async (item: CatalogItem) => { await API.saveItem('catalog', item); showToast(`Asset synced`); };
  const deleteCatalogItem = async (id: string) => { await API.deleteItem('catalog', id); showToast(`Service node purged`, 'info'); };
  const deleteEvent = async (id: string) => { await API.deleteItem('events', id); showToast(`Schedule node cleared`, 'info'); };
  
  const saveVoucher = async (v: Voucher) => { await API.saveItem('vouchers', v); };
  const deleteVoucher = async (id: string) => { await API.deleteItem('vouchers', id); showToast(`Overhead node purged`, 'info'); };
  
  const updateDashboardConfig = async (config: WidgetConfig[]) => { if(!userProfile) return; const newProfile = { ...userProfile, dashboardConfig: config }; await API.saveProfile(newProfile); };
  const pushNotification = async (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'companyId'>) => { 
    const newNotif = API.generateNotification(notif.title, notif.description, notif.type, userProfile?.companyId || 'global', notif.link, notif.linkId); 
    await API.saveItem('notifications', newNotif); 
  };
  const markNotifRead = async (id: string) => { const notif = notifications.find(n => n.id === id); if (notif) await API.saveItem('notifications', { ...notif, isRead: true }); };
  const addAuditLog = async (action: AuditEntry['action'], itemType: string, targetId: string) => { const log = API.generateAuditEntry(action, itemType, targetId, userProfile?.companyId || 'global'); await API.saveItem('audit_logs', log); };
  const saveChatThread = async (thread: ChatThread) => { const t = { ...thread, companyId: userProfile?.companyId }; await API.saveItem('chat_threads', t); };
  const deleteChatThread = async (id: string) => { await API.deleteItem('chat_threads', id); showToast('Conversation purged', 'info'); };
  const provisionUser = async (data: Partial<UserProfile>) => { const profile = await API.provisionUser({ ...data, companyId: userProfile?.companyId }); showToast(`Operative ${profile.fullName} added`); return profile; };
  const saveCampaign = async (campaign: Campaign) => { await API.saveItem('campaigns', { ...campaign, companyId: userProfile?.companyId }); };

  const convertProposalToLPO = async (proposal: Proposal) => {
    // Prevent creating multiple documents (LPO or Invoice) for the same accepted proposal
    const existingDoc = invoicesRaw.find(i => i.linkedProposalId === proposal.id);
    if (existingDoc) {
      showToast(`Fiscal node already exists: ${existingDoc.id}`, 'info');
      return;
    }

    const total = proposal.budget;
    const isEmployee = userProfile?.role === 'EMPLOYEE';
    const newLPO = API.createInvoice({ clientId: proposal.clientName, type: 'LPO', linkedProposalId: proposal.id, currency: proposal.currency, status: isEmployee ? 'Pending Approval' : 'Sent', productList: [{ productId: 'SERVICE', name: `PROJECT: ${proposal.title}`, quantity: 1, price: proposal.budget }], amountPaid: total, amountAED: proposal.currency === 'AED' ? total : total * 3.67, taxRate: 0, date: new Date().toISOString().split('T')[0], dueDate: proposal.timeline }, userProfile?.companyId || 'global');
    await API.saveItem('invoices', newLPO);
    await API.saveItem('proposals', { ...proposal, status: 'Accepted' });
    showToast(isEmployee ? 'LPO creation awaiting clearance' : `Purchase Order generated`);
  };

  const convertDocToInvoice = async (doc: Invoice) => {
    // Robust check for existing synthesized invoices to prevent duplicates
    // Check by sourceDocId (LPO -> Invoice link) or by linkedProposalId (Project -> Document link)
    const alreadySynthesized = invoicesRaw.find(i => 
      (i.sourceDocId === doc.id && i.type === 'Invoice') || 
      (doc.linkedProposalId && i.linkedProposalId === doc.linkedProposalId && i.type === 'Invoice' && i.id !== doc.id)
    );
    
    if (alreadySynthesized) {
      showToast(`Invoice already synthesized: ${alreadySynthesized.id}`, 'info');
      return;
    }

    const isEmployee = userProfile?.role === 'EMPLOYEE';
    const invoiceData: Partial<Invoice> = { type: 'Invoice', clientId: doc.clientId, clientEmail: doc.clientEmail, currency: doc.currency, productList: JSON.parse(JSON.stringify(doc.productList)), taxRate: doc.taxRate, discountRate: doc.discountRate, sourceDocId: doc.id, linkedProposalId: doc.linkedProposalId, status: isEmployee ? 'Pending Approval' : 'Draft', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
    await addInvoice(invoiceData);
    await API.saveItem('invoices', { ...doc, status: 'Paid' });
    showToast(isEmployee ? 'Authority clearance requested' : `Document node transitioned`);
  };

  return (
    <BusinessContext.Provider value={{
      user, userProfile, loading, clients: clientsRaw, setClients, addClient, updateClient, deleteClient, catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, proposals: proposalsRaw, setProposals: setProposalsRaw, notifications, pushNotification, markNotifRead, setUserProfile, commitProject, updateProposal, deleteProposal, invoices: invoicesRaw, addInvoice, updateInvoice, deleteInvoice, convertProposalToLPO, convertDocToInvoice, language, setLanguage, t, chatThreads, saveChatThread, deleteChatThread, telemetry, events, setEvents, deleteEvent, auditLogs, addAuditLog, vouchers, setVouchers, saveVoucher, deleteVoucher, updateDashboardConfig, toasts, showToast, removeToast, campaignAsset, setCampaignAsset, provisionUser, refreshUser, campaigns, saveCampaign
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