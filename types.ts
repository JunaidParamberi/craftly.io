

export enum View {
  DASHBOARD = 'DASHBOARD',
  CRM = 'CRM',
  PROPOSALS = 'PROPOSALS',
  PROJECTS = 'PROJECTS',
  FINANCE = 'FINANCE',
  LPO = 'LPO',
  STOCK = 'STOCK',
  /* Fixed: CATALOG value should be 'CATALOG', not 'CALENDAR' to avoid collisions in object keys like in MainLayout.tsx */
  CATALOG = 'CATALOG',
  CALENDAR = 'CALENDAR',
  CHAT = 'CHAT',
  EXPENSES = 'EXPENSES',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  AUDIT_LOGS = 'AUDIT_LOGS',
  REPORTS = 'REPORTS'
}

export type UserRole = 'OWNER' | 'EMPLOYEE' | 'CLIENT';
export type HappinessLevel = 'HAPPY' | 'NEUTRAL' | 'SAD';

export type Currency = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' 
  | 'BRL' | 'SGD' | 'AED' | 'SAR' | 'QAR' | 'MXN' | 'HKD' | 'NZD' | 'ZAR' 
  | 'TRY' | 'KRW' | 'IDR' | 'MYR' | 'PHP' | 'THB' | 'VND';

export type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'ZH' | 'JA' | 'AR' | 'HI' | 'PT' | 'ML';
export type Theme = 'dark' | 'light' | 'system';

export type WidgetId = 
  | 'revenue_stat' 
  | 'projects_stat' 
  | 'clients_stat' 
  | 'pending_stat' 
  | 'revenue_chart' 
  | 'recent_updates' 
  | 'business_health' 
  | 'active_projects_list'
  | 'deadlines_list'
  | 'top_services'
  | 'ai_strategy'
  | 'ai_alerts';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
}

export interface UserBranding {
  logoUrl?: string;
  signatureUrl?: string;
  address: string;
  trn: string;
  bankDetails: string;
  primaryColor: string;
  campaignEmail?: string;
  campaignPhone?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  title: string;
  bio: string;
  companyName: string;
  website: string;
  avatarUrl?: string;
  role: UserRole;
  branding: UserBranding;
  assignedProjectIds?: string[];
  clientId?: string;
  dashboardConfig?: WidgetConfig[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'CREATED' | 'DELETED' | 'VIEWED' | 'SENT' | 'UPDATED' | 'OPENED' | 'EXPORTED';
  itemType: string;
  targetId: string;
  actor: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'update' | 'deadline' | 'finance' | 'system';
  isRead: boolean;
  link?: View;
}

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: 'Milestone' | 'Reminder' | 'Meeting' | 'Payment' | 'Finance';
  priority: 'Low' | 'Medium' | 'High';
}

export type OnboardingStatus = 'Lead' | 'Invited' | 'Active' | 'Archived';

export interface Client {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  totalLTV: number;
  currency: Currency;
  status: OnboardingStatus;
  happiness?: HappinessLevel;
  contactPerson: string;
  createdAt?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  estimatedCost?: number;
  stockLevel?: number;
  isService: boolean;
  description?: string;
}

export type BillingType = 'Fixed Price' | 'Hourly' | 'Monthly';

export interface ScopeItem {
  id: string;
  name: string;
  price: number;
  tax: number;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  industry: string;
  scope: string;
  items: ScopeItem[];
  startDate: string;
  timeline: string;
  budget: number;
  billingType: BillingType;
  status: 'Draft' | 'Sent' | 'Accepted';
  aiDraftContent?: string;
  vibe?: 'Corporate' | 'Creative';
  currency: Currency;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  isService?: boolean;
}

export type InvoiceTemplate = 'Minimalist_Dark' | 'Swiss_Clean' | 'Corporate_Elite' | 'Cyber_Obsidian' | 'Modern_Soft';
export type MatchStatus = 'NOT_CHECKED' | 'MATCHED' | 'DISCREPANCY';

export interface Invoice {
  id: string;
  version: number;
  clientId: string;
  clientEmail: string;
  language: Language;
  type: 'Invoice' | 'Quote' | 'Estimate' | 'LPO';
  date: string;
  productList: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  depositPaid: number;
  amountPaid: number;
  amountAED: number;
  exchangeRate: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue';
  currency: Currency;
  dueDate: string;
  templateType?: InvoiceTemplate;
  matchStatus: MatchStatus;
  lpoId?: string;
  deliveryNoteId?: string;
  linkedProposalId?: string;
  sourceDocId?: string;
}

export interface Voucher {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'Pending' | 'Paid Back' | 'Reimbursed';
}
