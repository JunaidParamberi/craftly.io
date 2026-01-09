
import { 
  getDoc, getDocs, setDoc, doc, collection, 
  deleteDoc, onSnapshot, query, where, orderBy
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  Client, CatalogItem, Proposal, 
  Notification, UserProfile, Invoice, Voucher, AuditEntry, WidgetConfig
} from '../types';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
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

class DataAPI {
  private sanitizeData(data: any): any {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      return value === undefined ? null : value;
    }));
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (!data.dashboardConfig || data.dashboardConfig.length === 0) {
          data.dashboardConfig = DEFAULT_WIDGETS;
        }
        return data;
      }
      return null;
    } catch (error) {
      console.warn("Firestore profile fetch failed:", error);
      return null;
    }
  }

  async saveProfile(profile: UserProfile) {
    try {
      const sanitized = this.sanitizeData(profile);
      await setDoc(doc(db, 'users', profile.id), sanitized);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }

  async saveItem<T extends { id: string, companyId?: string }>(collectionName: string, item: T) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Authentication required for storage sync");
    const sanitized = this.sanitizeData(item);
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, sanitized);
  }

  async deleteItem(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  subscribeToTenantCollection<T>(collectionName: string, companyId: string, callback: (data: T[]) => void) {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where('companyId', '==', companyId));
    
    // Explicitly cast snap as any to avoid incorrect DocumentSnapshot inference
    return onSnapshot(q, (snap: any) => {
      const data = snap.docs.map((d: { data: () => T; id: any; }) => ({ ...d.data(), id: d.id }) as T);
      callback(data);
    }, (error) => {
      console.error(`Subscription error for tenant ${companyId} on ${collectionName}:`, error);
    });
  }

  // Provisioning Logic - Note: In a real app, this calls a Cloud Function
  async provisionUser(userData: Partial<UserProfile>) {
    const id = `user-${Math.random().toString(36).substr(2, 9)}`;
    const profile: UserProfile = {
      ...userData,
      id,
      onboarded: true,
      bio: '',
      dashboardConfig: DEFAULT_WIDGETS,
      status: 'OFFLINE',
      branding: {
        address: '',
        trn: '',
        bankDetails: '',
        primaryColor: '#6366F1',
        country: 'UAE',
        isTaxRegistered: false
      }
    } as UserProfile;

    await setDoc(doc(db, 'users', id), profile);
    return profile;
  }

  calculateInvoiceTotal(invoice: Partial<Invoice>): number {
    const subtotal = (invoice.productList || []).reduce((acc, item) => acc + ((item.price ?? 0) * (item.quantity ?? 0)), 0);
    return subtotal * (1 - (invoice.discountRate || 0)) * (1 + (invoice.taxRate || 0));
  }

  createInvoice(data: Partial<Invoice>, companyId: string): Invoice {
    const total = this.calculateInvoiceTotal(data);
    const prefix = data.type === 'LPO' ? 'LPO' : (data.type === 'Invoice' ? 'INV' : 'DOC');
    const id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    return {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
      status: 'Draft',
      version: 1,
      exchangeRate: 1,
      matchStatus: 'NOT_CHECKED',
      currency: 'AED',
      taxRate: 0,
      discountRate: 0,
      companyId,
      ...data,
      id,
      amountPaid: total,
      amountAED: total,
    } as Invoice;
  }

  generateNotification(title: string, description: string, type: Notification['type'], companyId: string): Notification {
    return { id: `nt-${Date.now()}`, companyId, title, description, timestamp: new Date().toLocaleTimeString(), type, isRead: false };
  }

  generateAuditEntry(action: AuditEntry['action'], itemType: string, targetId: string, companyId: string): AuditEntry {
    return {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      companyId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      action,
      itemType,
      targetId,
      actor: 'You',
      status: 'SUCCESS'
    };
  }
}

export const API = new DataAPI();
