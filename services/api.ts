
import { 
  getDoc, setDoc, doc, collection, 
  deleteDoc, onSnapshot, query, where
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  Notification, UserProfile, Invoice, AuditEntry, WidgetConfig, View
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
    return JSON.parse(JSON.stringify(data, (_key, value) => {
      return value === undefined ? null : value;
    }));
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        console.error("Invalid UID provided to getProfile");
        return null;
      }
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (!data.dashboardConfig || !Array.isArray(data.dashboardConfig) || data.dashboardConfig.length === 0) {
          data.dashboardConfig = DEFAULT_WIDGETS;
        }
        return data;
      }
      return null;
    } catch (error: any) {
      console.error("Firestore profile fetch failed:", error);
      if (error?.code === 'permission-denied') {
        throw new Error("Permission denied: Unable to access user profile");
      } else if (error?.code === 'unavailable') {
        throw new Error("Service unavailable: Please check your internet connection");
      }
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      if (!profile || !profile.id) {
        throw new Error("Invalid profile data: ID is required");
      }
      const sanitized = this.sanitizeData(profile);
      await setDoc(doc(db, 'users', profile.id), sanitized);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      if (error?.code === 'permission-denied') {
        throw new Error("Permission denied: Unable to save profile");
      } else if (error?.code === 'unavailable') {
        throw new Error("Service unavailable: Please check your internet connection");
      }
      throw new Error(error?.message || "Failed to save profile");
    }
  }

  async saveItem<T extends { id: string, companyId?: string }>(collectionName: string, item: T): Promise<void> {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error("Invalid collection name");
      }
      if (!item || !item.id) {
        throw new Error("Invalid item: ID is required");
      }
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("Authentication required for storage sync. Please log in again.");
      }
      const sanitized = this.sanitizeData(item);
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, sanitized);
    } catch (error: any) {
      console.error(`Failed to save item to ${collectionName}:`, error);
      if (error?.code === 'permission-denied') {
        throw new Error(`Permission denied: Unable to save ${collectionName}`);
      } else if (error?.code === 'unavailable') {
        throw new Error("Service unavailable: Please check your internet connection");
      }
      throw error;
    }
  }

  async deleteItem(collectionName: string, id: string): Promise<void> {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error("Invalid collection name");
      }
      if (!id || typeof id !== 'string') {
        throw new Error("Invalid ID provided");
      }
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("Authentication required for deletion. Please log in again.");
      }
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Failed to delete item from ${collectionName}:`, error);
      if (error?.code === 'permission-denied') {
        throw new Error(`Permission denied: Unable to delete from ${collectionName}`);
      } else if (error?.code === 'unavailable') {
        throw new Error("Service unavailable: Please check your internet connection");
      } else if (error?.code === 'not-found') {
        throw new Error("Item not found: It may have already been deleted");
      }
      throw error;
    }
  }

  subscribeToTenantCollection<T>(collectionName: string, companyId: string, callback: (data: T[]) => void) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error("Invalid collection name");
      }
      if (!companyId || typeof companyId !== 'string') {
        throw new Error("Invalid company ID");
      }
      if (typeof callback !== 'function') {
        throw new Error("Invalid callback function");
      }
      
      const colRef = collection(db, collectionName);
      const q = query(colRef, where('companyId', '==', companyId));
      
      // Explicitly cast snap as any to avoid incorrect DocumentSnapshot inference
      return onSnapshot(q, (snap: any) => {
        try {
          if (!snap || !snap.docs) {
            callback([]);
            return;
          }
          const data = snap.docs.map((d: { data: () => T; id: any; }) => {
            try {
              const docData = d.data();
              return { ...docData, id: d.id } as T;
            } catch (err) {
              console.error("Error parsing document:", err);
              return null;
            }
          }).filter((item: T | null): item is T => item !== null);
          callback(data);
        } catch (err) {
          console.error(`Error processing snapshot for ${collectionName}:`, err);
          callback([]);
        }
      }, (error: any) => {
        console.error(`Subscription error for tenant ${companyId} on ${collectionName}:`, error);
        if (error?.code === 'permission-denied') {
          console.error("Permission denied: Check Firestore security rules");
        } else if (error?.code === 'unavailable') {
          console.error("Service unavailable: Check internet connection");
        }
        // Still call callback with empty array to prevent UI from hanging
        callback([]);
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${collectionName}:`, error);
      // Return a no-op unsubscribe function
      return () => {};
    }
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
    try {
      if (!invoice) {
        return 0;
      }
      const productList = Array.isArray(invoice.productList) ? invoice.productList : [];
      const subtotal = productList.reduce((acc, item) => {
        const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
        const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 0;
        return acc + (price * quantity);
      }, 0);
      
      const discountRate = typeof invoice.discountRate === 'number' && !isNaN(invoice.discountRate) 
        ? Math.max(0, Math.min(1, invoice.discountRate)) 
        : 0;
      const taxRate = typeof invoice.taxRate === 'number' && !isNaN(invoice.taxRate) 
        ? Math.max(0, invoice.taxRate) 
        : 0;
      
      return subtotal * (1 - discountRate) * (1 + taxRate);
    } catch (error) {
      console.error("Error calculating invoice total:", error);
      return 0;
    }
  }

  createInvoice(data: Partial<Invoice>, companyId: string): Invoice {
    try {
      if (!companyId || typeof companyId !== 'string') {
        throw new Error("Invalid company ID");
      }
      if (!data) {
        throw new Error("Invalid invoice data");
      }
      
      const total = this.calculateInvoiceTotal(data);
      const prefix = data.type === 'LPO' ? 'LPO' : (data.type === 'Invoice' ? 'INV' : 'DOC');
      const id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const invoiceDate = data.date || new Date().toISOString().split('T')[0];
      const dueDate = data.dueDate || new Date(Date.now() + 1209600000).toISOString().split('T')[0];
      
      // Generate public token for shareable links (if not provided)
      const publicToken = data.publicToken || `${prefix.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Build invoice object - spread data first, then override with calculated values
      return {
        ...data, // Spread data first
        id,
        date: invoiceDate,
        dueDate: dueDate,
        status: data.status || 'Draft',
        version: typeof data.version === 'number' ? data.version : 1,
        exchangeRate: typeof data.exchangeRate === 'number' && !isNaN(data.exchangeRate) ? data.exchangeRate : 1,
        matchStatus: data.matchStatus || 'NOT_CHECKED',
        currency: data.currency || 'AED',
        taxRate: typeof data.taxRate === 'number' ? Math.max(0, data.taxRate) : 0,
        discountRate: typeof data.discountRate === 'number' ? Math.max(0, Math.min(1, data.discountRate)) : 0,
        companyId,
        productList: Array.isArray(data.productList) ? data.productList : [],
        publicToken: data.publicToken || publicToken, // Use existing or generate new
        isPublic: data.isPublic !== undefined ? data.isPublic : false, // Default to false, set to true when sending
        amountPaid: total,
        amountAED: total,
      } as Invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  generateNotification(title: string, description: string, type: Notification['type'], companyId: string, link?: View, linkId?: string): Notification {
    return { 
      id: `nt-${Date.now()}`, 
      companyId, 
      title, 
      description, 
      timestamp: new Date().toLocaleTimeString(), 
      type, 
      isRead: false,
      link,
      linkId
    };
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
