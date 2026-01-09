
export enum View {
  DASHBOARD = 'DASHBOARD',
  CRM = 'CRM',
  PROPOSALS = 'PROPOSALS',
  PROJECTS = 'PROJECTS',
  FINANCE = 'FINANCE',
  LPO = 'LPO',
  STOCK = 'STOCK',
  CATALOG = 'CATALOG',
  CALENDAR = 'CALENDAR',
  CHAT = 'CHAT',
  TEAM_CHAT = 'TEAM_CHAT',
  EXPENSES = 'EXPENSES',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  AUDIT_LOGS = 'AUDIT_LOGS',
  REPORTS = 'REPORTS',
  PROVISIONING = 'PROVISIONING'
}

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CLIENT';
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
  country: string;
  isTaxRegistered: boolean;
}

export interface UserProfile {
  id: string;
  companyId: string; 
  fullName: string;
  email: string;
  title: string;
  bio: string;
  companyName: string;
  website: string;
  avatarUrl?: string;
  role: UserRole;
  permissions?: string[];
  branding: UserBranding;
  assignedProjectIds?: string[];
  clientId?: string;
  dashboardConfig?: WidgetConfig[];
  onboarded: boolean;
  currency: Currency;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen?: any;
}

export interface TeamChannel {
  id: string;
  companyId: string;
  name: string;
  description: string;
  icon: string;
}

export interface TeamMessage {
  id: string;
  companyId: string;
  channelId: string; // Used for channels or 'dm_thread_id' for DMs
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  text: string;
  timestamp: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface AuditEntry {
  id: string;
  companyId: string;
  timestamp: string;
  action: 'CREATED' | 'DELETED' | 'VIEWED' | 'SENT' | 'UPDATED' | 'OPENED' | 'EXPORTED';
  itemType: string;
  targetId: string;
  actor: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

export interface Notification {
  id: string;
  companyId: string;
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

export interface ChatThread {
  id: string;
  companyId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  companyId: string;
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
  companyId: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  totalLTV: number;
  currency: Currency;
  status: OnboardingStatus;
  happiness?: HappinessLevel;
  contactPerson: string;
  paymentPortal?: string;
  createdAt?: string;
}

export interface CatalogItem {
  id: string;
  companyId: string;
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
  companyId: string;
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
  status: 'Draft' | 'Sent' | 'Accepted' | 'Pending Approval';
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
export type ReoccurrenceFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface Invoice {
  id: string;
  companyId: string;
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
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue' | 'Pending Approval';
  currency: Currency;
  dueDate: string;
  templateType?: InvoiceTemplate;
  matchStatus: MatchStatus;
  lpoId?: string;
  deliveryNoteId?: string;
  linkedProposalId?: string;
  sourceDocId?: string;
  isReoccurring: boolean;
  reoccurrenceFrequency?: ReoccurrenceFrequency;
  reoccurrenceDate?: string;
}

export interface Voucher {
  id: string;
  companyId: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'Pending' | 'Paid Back' | 'Reimbursed';
}

export interface Email {
  id: string;
  companyId: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  snippet: string;
  timestamp: string;
  isUnread: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
  labels: string[];
}

export interface Campaign {
  id: string;
  companyId: string;
  subject: string;
  body: string;
  channel: 'EMAIL' | 'WHATSAPP';
  assetUrl?: string | null;
  recipientCount: number;
  timestamp: string;
  targetStatus: string;
}
