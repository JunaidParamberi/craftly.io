
import { 
  Client, CatalogItem, Proposal, 
  Notification, UserProfile, Invoice, Voucher, ChatMessage, CalendarEvent, AuditEntry 
} from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'craftly_clients',
  CATALOG: 'craftly_catalog',
  PROPOSALS: 'craftly_proposals',
  INVOICES: 'craftly_invoices',
  NOTIFICATIONS: 'craftly_notifications',
  PROFILE: 'craftly_user_profile',
  VOUCHERS: 'craftly_vouchers',
  CHAT_MESSAGES: 'craftly_chat_messages',
  EVENTS: 'craftly_events',
  AUDIT_LOGS: 'craftly_audit_logs',
};

// --- DEMO DATA GENERATION ---
const DEMO_CLIENTS: Client[] = [
  { id: 'cli_01', name: 'EMAAR PROPERTIES', taxId: 'TRN-1002938475', email: 'procurement@emaar.ae', phone: '+971 4 367 3333', countryCode: '+971', address: 'Emaar Square, Downtown Dubai', totalLTV: 45000, currency: 'AED', status: 'Active', happiness: 'HAPPY', contactPerson: 'AHMED AL-SAYED', createdAt: new Date().toISOString() },
  { id: 'cli_02', name: 'NAKHEEL PJSC', taxId: 'TRN-2003847561', email: 'billing@nakheel.com', phone: '+971 4 390 3333', countryCode: '+971', address: 'Nakheel Sales Centre, Al Sufouh', totalLTV: 12000, currency: 'AED', status: 'Active', happiness: 'NEUTRAL', contactPerson: 'SARAH JENKINS', createdAt: new Date().toISOString() },
  { id: 'cli_03', name: 'DIGITAL FIRST AGENCY', taxId: 'VAT-UK-992837', email: 'hello@digitalfirst.io', phone: '+44 20 7946 0001', countryCode: '+44', address: 'Shoreditch High St, London', totalLTV: 0, currency: 'USD', status: 'Lead', happiness: 'HAPPY', contactPerson: 'TOM BAKER', createdAt: new Date().toISOString() },
];

const DEMO_PROPOSALS: Proposal[] = [
  { id: 'PRO-2024-001', title: 'ECOMMERCE ECOSYSTEM', clientName: 'EMAAR PROPERTIES', clientId: 'cli_01', industry: 'Real Estate', scope: 'Complete headless commerce integration for property management.', items: [], startDate: '2024-01-10', timeline: '2024-06-15', budget: 85000, billingType: 'Fixed Price', status: 'Accepted', currency: 'AED' },
  { id: 'PRO-2024-002', title: 'SEO STRATEGY NODES', clientName: 'DIGITAL FIRST AGENCY', clientId: 'cli_03', industry: 'Marketing', scope: 'Technical SEO audit and optimization for Q3 targets.', items: [], startDate: '2024-05-01', timeline: '2024-07-01', budget: 5000, billingType: 'Monthly', status: 'Sent', currency: 'USD' },
];

const DEMO_INVOICES: Invoice[] = [
  { id: 'INV-8821', version: 1, clientId: 'EMAAR PROPERTIES', clientEmail: 'procurement@emaar.ae', language: 'EN', type: 'Invoice', date: '2024-03-15', productList: [{ productId: 'GENERIC', name: 'PHASE 1 DEPLOYMENT', quantity: 1, price: 45000 }], taxRate: 0, discountRate: 0, depositPaid: 0, amountPaid: 45000, amountAED: 45000, exchangeRate: 1, status: 'Paid', currency: 'AED', dueDate: '2024-04-15', matchStatus: 'MATCHED' },
  { id: 'QTE-4402', version: 1, clientId: 'NAKHEEL PJSC', clientEmail: 'billing@nakheel.com', language: 'EN', type: 'Quote', date: '2024-05-20', productList: [{ productId: 'GENERIC', name: 'UI REDESIGN', quantity: 1, price: 12000 }], taxRate: 0, discountRate: 0, depositPaid: 0, amountPaid: 12000, amountAED: 12000, exchangeRate: 1, status: 'Sent', currency: 'AED', dueDate: '2024-06-20', matchStatus: 'NOT_CHECKED' },
];

class DataAPI {
  private save<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      if (key === STORAGE_KEYS.PROFILE) {
        return {
          ...defaultValue,
          ...parsed,
          branding: { ...(defaultValue as any).branding, ...parsed.branding }
        };
      }
      return parsed;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return defaultValue;
    }
  }

  getClients(): Client[] { 
    const data = this.load(STORAGE_KEYS.CLIENTS, []); 
    return data.length === 0 ? DEMO_CLIENTS : data;
  }
  
  getCatalog(): CatalogItem[] { return this.load(STORAGE_KEYS.CATALOG, []); }
  
  getProposals(): Proposal[] { 
    const data = this.load(STORAGE_KEYS.PROPOSALS, []);
    return data.length === 0 ? DEMO_PROPOSALS : data;
  }

  getInvoices(): Invoice[] { 
    const data = this.load(STORAGE_KEYS.INVOICES, []);
    return data.length === 0 ? DEMO_INVOICES : data;
  }

  getNotifications(): Notification[] { return this.load(STORAGE_KEYS.NOTIFICATIONS, []); }
  getChatMessages(): ChatMessage[] { return this.load(STORAGE_KEYS.CHAT_MESSAGES, []); }
  getEvents(): CalendarEvent[] { return this.load(STORAGE_KEYS.EVENTS, []); }
  getAuditLogs(): AuditEntry[] { return this.load(STORAGE_KEYS.AUDIT_LOGS, []); }

  getProfile(): UserProfile {
    return this.load(STORAGE_KEYS.PROFILE, {
      id: 'usr_01',
      fullName: 'JUNAID PARAMBERI',
      email: 'junaid@craftly.ae',
      role: 'OWNER',
      title: 'Lead Executive Consultant',
      bio: 'Transforming digital architecture for UAE enterprises.',
      companyName: 'CRAFTLY DIGITAL SYSTEMS',
      website: 'https://craftly.ae',
      branding: {
        trn: '100293847500003',
        address: 'Dubai Knowledge Park, Block 2B, UAE',
        bankDetails: 'Emirates NBD - Main Branch - ACCT: 009823741',
        primaryColor: '#6366F1',
        logoUrl: '',
        signatureUrl: '',
        campaignEmail: 'junaidparamberi@gmail.com',
        campaignPhone: '+971581976818'
      }
    });
  }

  calculateInvoiceTotal(invoice: Partial<Invoice>): number {
    const subtotal = (invoice.productList || []).reduce((acc, item) => acc + ((item.price ?? 0) * (item.quantity ?? 0)), 0);
    return subtotal * (1 - (invoice.discountRate || 0)) * (1 + (invoice.taxRate || 0));
  }

  saveClients(clients: Client[]) { this.save(STORAGE_KEYS.CLIENTS, clients); }
  saveInvoices(invoices: Invoice[]) { this.save(STORAGE_KEYS.INVOICES, invoices); }
  saveChatMessages(messages: ChatMessage[]) { this.save(STORAGE_KEYS.CHAT_MESSAGES, messages); }
  saveNotifications(notifications: Notification[]) { this.save(STORAGE_KEYS.NOTIFICATIONS, notifications); }
  saveEvents(events: CalendarEvent[]) { this.save(STORAGE_KEYS.EVENTS, events); }
  saveAuditLogs(logs: AuditEntry[]) { this.save(STORAGE_KEYS.AUDIT_LOGS, logs); }
  
  createInvoice(data: Partial<Invoice>): Invoice {
    const total = this.calculateInvoiceTotal(data);
    const prefix = data.type === 'LPO' ? 'LPO' : (data.type === 'Invoice' ? 'INV' : 'DOC');
    return {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
      status: 'Draft',
      version: 1,
      exchangeRate: 1,
      matchStatus: 'NOT_CHECKED',
      currency: 'AED',
      ...data,
      id: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      amountPaid: total,
      amountAED: total,
    } as Invoice;
  }

  generateNotification(title: string, description: string, type: Notification['type']): Notification {
    return { id: `nt-${Date.now()}`, title, description, timestamp: 'Just now', type, isRead: false };
  }

  generateAuditEntry(action: AuditEntry['action'], itemType: string, targetId: string): AuditEntry {
    return {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      action,
      itemType,
      targetId,
      actor: 'You',
      status: 'SUCCESS'
    };
  }

  saveProfile(profile: UserProfile) { this.save(STORAGE_KEYS.PROFILE, profile); }
}

export const API = new DataAPI();
