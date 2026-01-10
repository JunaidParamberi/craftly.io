# Craftly App - Comprehensive Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Data Structures & Types](#data-structures--types)
6. [Frontend Components](#frontend-components)
7. [Backend Services](#backend-services)
8. [Context Providers](#context-providers)
9. [Utilities & Helpers](#utilities--helpers)
10. [Authentication & Authorization](#authentication--authorization)
11. [Firebase Integration](#firebase-integration)
12. [Key Features & Use Cases](#key-features--use-cases)
13. [Configuration](#configuration)
14. [Deployment](#deployment)
15. [Development Guide](#development-guide)

---

## Application Overview

**Craftly** is a comprehensive CRM (Customer Relationship Management) and business management application designed for freelancers, consultants, and small businesses. It provides end-to-end functionality for managing clients, projects, proposals, invoices, finances, team collaboration, and AI-powered business assistance.

### Core Features
- **Multi-tenant Architecture**: Isolated data per company/organization
- **Client Management**: Full lifecycle from leads to active clients
- **Project & Proposal Management**: Create, track, and manage projects/proposals
- **Financial Management**: Invoices, LPOs (Local Purchase Orders), expenses, and financial reporting
- **AI Integration**: Google Gemini AI for automated proposal generation and business insights
- **Team Collaboration**: Team chat, notifications, and user provisioning
- **Document Generation**: PDF invoices and proposals with multiple templates
- **Campaign Management**: Email/WhatsApp campaigns for client outreach
- **Real-time Updates**: Live data synchronization using Firestore

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Components  │  │   Context    │  │   Services   │      │
│  │              │  │   Providers  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                  Firebase Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Firestore  │  │    Auth     │  │   Storage   │          │
│  │  (Database) │  │ (AuthN/AuthZ│  │   (Files)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  Functions  │  │  DataConnect│                           │
│  │  (Backend)  │  │   (Schema)  │                           │
│  └─────────────┘  └─────────────┘                           │
└───────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **Component-Based**: Modular React components with lazy loading
- **Context-Driven State**: Global state management via React Context API
- **Real-time Synchronization**: Firestore real-time listeners
- **Multi-tenancy**: Data isolation using `companyId` field
- **Role-Based Access Control**: Permission-based feature access

---

## Technology Stack

### Frontend
- **React 19.3**: UI library
- **TypeScript 5.7**: Type safety
- **React Router DOM 6.22**: Client-side routing
- **Vite 6.0**: Build tool and dev server
- **Lucide React**: Icon library
- **Recharts 3.0**: Data visualization
- **html2canvas + jsPDF**: PDF generation
- **Marked**: Markdown parsing

### Backend
- **Firebase 11.4**: Backend-as-a-Service
  - Firestore: NoSQL database
  - Authentication: User auth
  - Storage: File storage
  - Functions: Cloud functions (Node.js 24)
- **Google GenAI SDK**: AI integration (Gemini models)

### Development Tools
- **TypeScript**: Type checking
- **ESLint/Prettier**: Code formatting (implicit)

---

## Project Structure

```
Craftly_App/
├── App.tsx                      # Root application component with routing
├── index.tsx                    # Entry point (React DOM render)
├── types.ts                     # TypeScript type definitions
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── firebase.json                # Firebase project configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore index definitions
├── storage.rules                # Storage security rules
│
├── components/                  # React components
│   ├── layout/
│   │   ├── MainLayout.tsx       # Main app layout (sidebar, header, nav)
│   │   └── Sidebar.tsx          # Sidebar navigation component
│   ├── ui/                      # Reusable UI primitives
│   │   ├── Primitives.tsx       # Button, Input, Card, Badge, etc.
│   │   ├── Toast.tsx            # Toast notification system
│   │   ├── Skeleton.tsx         # Loading skeletons
│   │   ├── LoadingProgress.tsx  # Progress indicators
│   │   ├── TemplatePreviewModal.tsx
│   │   └── TemplatePreviewSelector.tsx
│   ├── Dashboard.tsx            # Dashboard with widgets & charts
│   ├── CRM.tsx                  # Client relationship management
│   ├── ClientDetail.tsx         # Individual client detail view
│   ├── Proposals.tsx            # Project/proposal management
│   ├── ProjectDetail.tsx        # Detailed project view
│   ├── Finance.tsx              # Invoice & LPO management
│   ├── Catalog.tsx              # Service/product catalog
│   ├── Expenses.tsx             # Expense tracking
│   ├── CalendarView.tsx         # Calendar/event management
│   ├── ChatRoom.tsx             # AI assistant chat
│   ├── TeamChat.tsx             # Team collaboration chat
│   ├── Reports.tsx              # Business reports & analytics
│   ├── Settings.tsx             # Application settings
│   ├── Profile.tsx              # User profile management
│   ├── Auth.tsx                 # Authentication (login/register)
│   ├── Onboarding.tsx           # First-time user onboarding
│   ├── UserProvisioning.tsx     # User management (admin)
│   ├── JoinInvite.tsx           # Invite acceptance flow
│   ├── CommandPalette.tsx       # Global command palette (Cmd+K)
│   ├── NotificationsOverlay.tsx # Notification center
│   ├── AuditLogs.tsx            # Activity audit logs
│   ├── ConfirmationModal.tsx    # Confirmation dialogs
│   ├── ErrorBoundary.tsx        # Error boundary component
│   ├── PdfSlideout.tsx          # Invoice PDF viewer
│   ├── ProposalPdfSlideout.tsx  # Proposal PDF viewer
│   ├── TemporalPicker.tsx       # Date/time picker
│   └── EmailModule.tsx          # Email management (placeholder)
│
├── context/                     # React Context providers
│   ├── BusinessContext.tsx      # Global business state management
│   └── ThemeContext.tsx         # Theme & UI preferences
│
├── services/                    # Service layer
│   ├── firebase.ts              # Firebase initialization & exports
│   ├── api.ts                   # Data API (Firestore operations)
│   ├── notificationService.ts   # Browser notification service
│   └── translations.ts          # i18n translation dictionary
│
├── utils/                       # Utility functions
│   ├── validation.ts            # Form validation utilities
│   ├── debounce.ts              # Debounce function
│   ├── pdfTemplates.tsx         # PDF template renderers
│   └── compliance.ts            # Compliance utilities (if exists)
│
├── backend/                     # Standalone backend server (if used)
│   ├── index.js                 # Express/Node server
│   └── package.json
│
├── functions/                   # Firebase Cloud Functions
│   ├── index.js                 # Cloud functions definitions
│   └── package.json
│
├── dataconnect/                 # Firebase Data Connect
│   ├── dataconnect.yaml         # Data Connect configuration
│   ├── schema/
│   │   └── schema.gql           # GraphQL schema
│   └── example/
│       ├── connector.yaml
│       ├── mutations.gql
│       └── queries.gql
│
└── public/                      # Static assets
    ├── craftly_logo.svg
    ├── craftly_logo_highres.png
    └── favicon.ico
```

---

## Data Structures & Types

### Core Type Definitions (`types.ts`)

#### User & Authentication
```typescript
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CLIENT';

interface UserProfile {
  id: string;                    // Firebase Auth UID
  companyId: string;             // Multi-tenant identifier
  fullName: string;
  email: string;
  title: string;                 // Job title/designation
  bio: string;
  companyName: string;
  website: string;
  avatarUrl?: string;
  role: UserRole;
  permissions?: string[];        // Granular permissions
  branding: UserBranding;
  assignedProjectIds?: string[]; // For employees/clients
  clientId?: string;             // If role is CLIENT
  dashboardConfig?: WidgetConfig[];
  onboarded: boolean;
  currency: Currency;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen?: any;                // Firestore Timestamp
}

interface UserBranding {
  logoUrl?: string;
  signatureUrl?: string;
  address: string;
  trn: string;                   // Tax Registration Number
  bankDetails: string;
  primaryColor: string;
  campaignEmail?: string;
  campaignPhone?: string;
  country: string;
  isTaxRegistered: boolean;
  defaultInvoiceTemplate?: InvoiceTemplate;
  defaultProposalTemplate?: InvoiceTemplate;
}
```

#### Client Management
```typescript
type OnboardingStatus = 'Lead' | 'Invited' | 'Active' | 'Archived';
type HappinessLevel = 'HAPPY' | 'NEUTRAL' | 'SAD';

interface Client {
  id: string;
  companyId: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  totalLTV: number;              // Lifetime Value (calculated)
  currency: Currency;
  status: OnboardingStatus;
  happiness?: HappinessLevel;
  contactPerson: string;
  paymentPortal?: string;
  createdAt?: string;
}
```

#### Project & Proposal
```typescript
type BillingType = 'Fixed Price' | 'Hourly' | 'Monthly';

interface ScopeItem {
  id: string;
  name: string;
  price: number;
  tax: number;
}

interface Proposal {
  id: string;
  companyId: string;
  title: string;
  clientName: string;
  clientId: string;
  industry: string;
  scope: string;                 // Project description
  items: ScopeItem[];            // Line items
  startDate: string;
  timeline: string;              // End date (ISO string)
  budget: number;
  billingType: BillingType;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Pending Approval';
  aiDraftContent?: string;       // AI-generated content
  vibe?: 'Corporate' | 'Creative';
  currency: Currency;
  templateType?: InvoiceTemplate;
}
```

#### Financial Documents
```typescript
type InvoiceTemplate = 
  | 'Minimalist_Dark' | 'Swiss_Clean' | 'Corporate_Elite' 
  | 'Cyber_Obsidian' | 'Modern_Soft' | 'Classic_Blue' 
  | 'Elegant_Gold' | 'Tech_Modern';

type MatchStatus = 'NOT_CHECKED' | 'MATCHED' | 'DISCREPANCY';
type ReoccurrenceFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  isService?: boolean;
}

interface Invoice {
  id: string;                    // Format: INV-XXXX or LPO-XXXX
  companyId: string;
  version: number;
  clientId: string;
  clientEmail: string;
  language: Language;
  type: 'Invoice' | 'Quote' | 'Estimate' | 'LPO';
  date: string;                  // ISO date string
  productList: InvoiceItem[];
  taxRate: number;               // Decimal (0.05 = 5%)
  discountRate: number;          // Decimal (0.1 = 10%)
  depositPaid: number;
  amountPaid: number;
  amountAED: number;             // Converted to AED
  exchangeRate: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue' | 'Pending Approval';
  currency: Currency;
  dueDate: string;
  templateType?: InvoiceTemplate;
  matchStatus: MatchStatus;
  lpoId?: string;                // Linked LPO (for invoices)
  deliveryNoteId?: string;
  linkedProposalId?: string;     // Linked project/proposal
  sourceDocId?: string;          // Source document (for conversions)
  isReoccurring: boolean;
  reoccurrenceFrequency?: ReoccurrenceFrequency;
  reoccurrenceDate?: string;
}
```

#### Catalog & Services
```typescript
interface CatalogItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  unitPrice: number;
  estimatedCost?: number;
  stockLevel?: number;
  isService: boolean;            // Service vs product
  description?: string;
}
```

#### Expenses & Vouchers
```typescript
interface Voucher {
  id: string;
  companyId: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'Pending' | 'Paid Back' | 'Reimbursed';
  type: 'EXPENSE' | 'RECEIPT';
}
```

#### Team Collaboration
```typescript
interface TeamChannel {
  id: string;
  companyId: string;
  name: string;
  description: string;
  icon: string;
}

interface TeamMessage {
  id: string;
  companyId: string;
  channelId: string;             // Channel ID or DM thread ID
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  text: string;
  timestamp: any;                // Firestore Timestamp
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  deletedFor?: string[];         // Soft delete per user
  isEdited?: boolean;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
}
```

#### Notifications & Audit
```typescript
interface Notification {
  id: string;
  companyId: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'update' | 'deadline' | 'finance' | 'system';
  isRead: boolean;
  link?: View;                   // Navigation target
  linkId?: string;               // Specific item ID
}

interface AuditEntry {
  id: string;
  companyId: string;
  timestamp: string;
  action: 'CREATED' | 'DELETED' | 'VIEWED' | 'SENT' | 'UPDATED' | 'OPENED' | 'EXPORTED';
  itemType: string;              // 'Client', 'Invoice', etc.
  targetId: string;
  actor: string;                 // User name/ID
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
}
```

#### Calendar & Events
```typescript
interface CalendarEvent {
  id: string;
  companyId: string;
  title: string;
  description: string;
  date: string;                  // ISO date
  time?: string;                 // Optional time
  type: 'Milestone' | 'Reminder' | 'Meeting' | 'Payment' | 'Finance';
  priority: 'Low' | 'Medium' | 'High';
}
```

#### Campaigns
```typescript
interface Campaign {
  id: string;
  companyId: string;
  subject: string;
  body: string;
  channel: 'EMAIL' | 'WHATSAPP';
  assetUrl?: string | null;      // Image/video asset
  recipientCount: number;
  timestamp: string;
  targetStatus: string;          // Client status filter
}
```

#### AI Chat
```typescript
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

interface ChatThread {
  id: string;
  companyId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
```

#### Dashboard Configuration
```typescript
type WidgetId = 
  | 'revenue_stat' | 'projects_stat' | 'clients_stat' 
  | 'pending_stat' | 'revenue_chart' | 'recent_updates' 
  | 'business_health' | 'active_projects_list' 
  | 'deadlines_list' | 'top_services' | 'ai_strategy' | 'ai_alerts';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
}
```

---

## Frontend Components

### Core Application Component (`App.tsx`)

**Purpose**: Root application component that handles routing, authentication state, and lazy loading.

**Key Features**:
- Lazy-loaded components for performance
- Authentication flow routing
- Onboarding flow for new users
- Loading states with animated progress

**Routing Logic**:
```typescript
// 1. Not authenticated → Auth component
// 2. Authenticated but no profile → Onboarding
// 3. Authenticated, profile exists but not onboarded (Owner/Admin) → Onboarding
// 4. Authenticated, onboarded → Main Layout with routes
```

**Routes**:
- `/dashboard` - Dashboard with widgets
- `/clients` - CRM client list
- `/clients/:id` - Client detail
- `/projects` - Projects/proposals list
- `/projects/new` - New project creation
- `/projects/:id` - Project detail
- `/invoices` - Invoice management
- `/lpo` - LPO (Purchase Order) management
- `/services` - Catalog management
- `/expenses` - Expense tracking
- `/calendar` - Calendar view
- `/ai-help` - AI assistant chat
- `/team-chat` - Team collaboration
- `/reports` - Business reports
- `/settings` - App settings (Owner only)
- `/profile` - User profile
- `/provisioning` - User management (Admin)

### Main Layout (`components/layout/MainLayout.tsx`)

**Purpose**: Main application shell with sidebar, header, navigation, and notification systems.

**Features**:
- Collapsible/resizable sidebar
- Header with search, notifications, audit logs, theme switcher
- Mobile-responsive navigation
- Command palette (Cmd+K / Ctrl+K)
- Toast notifications
- Permission-based menu filtering

**State Management**:
- Sidebar collapse state (localStorage)
- Sidebar width (localStorage)
- Command palette open state
- Notifications overlay state
- Audit logs overlay state
- More menu (mobile) state

**Permissions**:
- Filters navigation items based on user role and permissions
- Owners/Admins see all features
- Employees/Clients see limited features based on permissions

### Sidebar (`components/layout/Sidebar.tsx`)

**Purpose**: Primary navigation sidebar with role-based menu items.

**Features**:
- Role-based menu filtering
- Permission-based access control
- Collapsible state
- User profile display
- Logout functionality
- Resizable width (200-480px)

### Dashboard (`components/Dashboard.tsx`)

**Purpose**: Central dashboard with customizable widgets showing business metrics.

**Widgets**:
1. **Revenue Stat**: Total earnings with trend
2. **Projects Stat**: Active projects count
3. **Clients Stat**: Total clients count
4. **Pending Stat**: Unpaid invoices count
5. **Revenue Chart**: Time-series revenue visualization
6. **Recent Updates**: Activity feed
7. **Business Health**: Profit margin, tax progress
8. **Active Projects List**: Current projects
9. **Deadlines List**: Upcoming deadlines
10. **Top Services**: Most used catalog items
11. **AI Strategy**: AI-generated business insights
12. **AI Alerts**: AI-powered notifications

**Features**:
- Drag-and-drop widget reordering
- Show/hide widgets
- AI command bar (permission-based)
- Real-time data updates
- Responsive grid layout

**Telemetry Calculation**:
```typescript
telemetry = {
  totalEarnings: sum(paid invoices) + sum(receipts),
  totalExpenses: sum(expense vouchers),
  profitMargin: ((revenue - expenses) / revenue) * 100,
  pendingRevenue: sum(unpaid invoices),
  activeMissions: proposals.length,
  clientCount: clients.length,
  unpaidCount: unpaid invoices.length,
  overdueCount: overdue invoices.length,
  corporateTaxProgress: min(100, (revenue / 375000) * 100),
  estimatedTaxLiability: revenue > 375000 ? (revenue - 375000) * 0.09 : 0
}
```

### CRM (`components/CRM.tsx`)

**Purpose**: Client relationship management with campaign engine.

**Features**:
- Client list with search/filter
- Add/Edit/Delete clients
- Client status management (Lead → Active)
- LTV (Lifetime Value) calculation from invoices
- **Campaign Engine**:
  - Email/WhatsApp campaigns
  - Visual compositor for campaign assets
  - AI-powered campaign content generation
  - Branded asset generation with logo overlay
  - Status-based recipient filtering

**Client Status Logic**:
- Automatically set to "Active" if client has any invoices
- Manual status override available

**Campaign Flow**:
1. Select recipients (by status or manually)
2. Choose channel (Email/WhatsApp)
3. Generate/upload visual asset (optional)
4. Compose message (AI-assisted)
5. Preview branded asset
6. Dispatch campaign

### Proposals (`components/Proposals.tsx`)

**Purpose**: Project and proposal management with AI assistance.

**Features**:
- Create/edit/delete proposals
- AI-powered project generation from natural language
- Multi-step form wizard
- Status tracking (Draft → Sent → Accepted)
- Progress calculation based on timeline
- PDF preview and export
- Convert to LPO functionality

**AI Integration**:
- Takes project idea as input
- Generates: title, description, timeline, budget estimate
- Uses Google Gemini 3 Flash model
- Structured JSON response

**Workflow**:
1. Enter project idea → AI generates proposal draft
2. Review and edit details
3. Add line items and scope
4. Select template
5. Save as draft or send to client

### Finance (`components/Finance.tsx`)

**Purpose**: Invoice and LPO management with PDF generation.

**Features**:
- Invoice/LPO list with filters
- Create/edit/delete invoices
- Status management (with permission checks)
- PDF preview with 8 template options
- Email sending (integrated)
- Currency conversion to AED
- Reoccurring invoice setup
- Link to proposals/LPOs
- Match status tracking (LPO ↔ Invoice matching)

**Invoice Types**:
- Invoice: Bill to client
- Quote: Price quotation
- Estimate: Cost estimate
- LPO: Local Purchase Order

**Status Flow**:
- Employees: Draft → Pending Approval → Sent/Paid
- Owners: Direct to any status

**PDF Templates**:
1. Minimalist Dark
2. Swiss Clean (default)
3. Corporate Elite
4. Cyber Obsidian
5. Modern Soft
6. Classic Blue
7. Elegant Gold
8. Tech Modern

### Catalog (`components/Catalog.tsx`)

**Purpose**: Service and product catalog management.

**Features**:
- Add/edit/delete catalog items
- Service vs Product distinction
- Price and cost tracking
- Stock level management (for products)
- Category organization
- Quick add to invoices/proposals

### Expenses (`components/Expenses.tsx`)

**Purpose**: Expense and receipt tracking.

**Features**:
- Create expense/receipt vouchers
- Link to projects
- Category management
- Status tracking (Pending → Paid Back/Reimbursed)
- Receipt upload
- Financial reporting integration

### Calendar (`components/CalendarView.tsx`)

**Purpose**: Calendar view for events, milestones, deadlines.

**Features**:
- Month/week/day views
- Create/edit/delete events
- Event types: Milestone, Reminder, Meeting, Payment, Finance
- Priority levels
- Integration with invoices (due dates)
- Integration with projects (milestones)

### Chat Room (`components/ChatRoom.tsx`)

**Purpose**: AI assistant chat interface.

**Features**:
- Multi-thread chat conversations
- Google Gemini integration
- Context-aware responses
- Chat history
- Thread management
- Permission-based access (ACCESS_AI permission)

### Team Chat (`components/TeamChat.tsx`)

**Purpose**: Team collaboration chat.

**Features**:
- Channel-based or DM conversations
- File attachments
- Link previews
- Message editing
- Soft delete (per-user)
- Real-time updates
- User presence indicators

### Reports (`components/Reports.tsx`)

**Purpose**: Business analytics and reporting.

**Features**:
- Revenue reports
- Client reports
- Project reports
- Financial summaries
- Export capabilities
- Date range filters

### Settings (`components/Settings.tsx`)

**Purpose**: Application and company settings (Owner only).

**Features**:
- Company branding
- Invoice templates
- Default currency
- Tax settings
- Bank details
- User permissions management

### Profile (`components/Profile.tsx`)

**Purpose**: User profile management.

**Features**:
- Personal information
- Avatar upload
- Password change
- Notification preferences
- Dashboard widget configuration
- Language selection

### Auth (`components/Auth.tsx`)

**Purpose**: Authentication (login/register/password reset).

**Features**:
- Email/password authentication
- Google OAuth
- Apple OAuth
- Email verification flow
- Password reset
- Social auth providers

**Flow**:
1. Login/Register form
2. Email verification (if needed)
3. Redirect to onboarding or dashboard

### Onboarding (`components/Onboarding.tsx`)

**Purpose**: First-time user setup wizard.

**Steps**:
1. **Identity Check**: Full name, title
2. **Enterprise Node**: Company name, website
3. **Regional Matrix**: Country, currency, address
4. **Fiscal Details**: Tax registration, bank details
5. **Branding**: Logo, colors, templates

**Completion**:
- Calls Firebase Cloud Function `initializeTenant`
- Creates user profile with company ID
- Sets role to OWNER
- Marks as onboarded

### User Provisioning (`components/UserProvisioning.tsx`)

**Purpose**: User management for admins.

**Features**:
- Add new users (Employees/Clients)
- Assign roles and permissions
- Generate invite links
- Manage user access
- Permission: MANAGE_PROVISIONING

### UI Primitives (`components/ui/Primitives.tsx`)

**Reusable Components**:
- `Button`: Various variants (primary, ghost, danger)
- `Input`: Text input with label
- `Select`: Dropdown selector
- `Card`: Container card
- `Badge`: Status badges
- `Heading`: Section headings
- `Label`: Form labels
- `PriceInput`: Currency-formatted input
- `EmptyState`: Empty state placeholder
- `Skeleton`: Loading skeleton
- `SkeletonList`: List skeleton
- `LoadingProgress`: Progress indicator

---

## Backend Services

### Firebase Service (`services/firebase.ts`)

**Purpose**: Firebase SDK initialization and configuration.

**Exports**:
- `db`: Firestore database instance
- `auth`: Firebase Authentication instance
- `storage`: Firebase Storage instance
- `functions`: Cloud Functions instance
- `googleProvider`: Google OAuth provider
- `appleProvider`: Apple OAuth provider

**Configuration**:
- Loads from environment variables (`VITE_FIREBASE_*`)
- Analytics initialization (conditional)
- Storage bucket explicit configuration

### Data API (`services/api.ts`)

**Purpose**: Abstraction layer for Firestore operations.

**Class: DataAPI**

#### Methods

**`getProfile(uid: string): Promise<UserProfile | null>`**
- Fetches user profile by UID
- Adds default widget config if missing
- Error handling for permission/unavailable

**`saveProfile(profile: UserProfile): Promise<void>`**
- Saves/updates user profile
- Data sanitization (undefined → null)

**`saveItem<T>(collectionName: string, item: T): Promise<void>`**
- Generic save operation
- Validates authentication
- Sanitizes data

**`deleteItem(collectionName: string, id: string): Promise<void>`**
- Generic delete operation
- Validates authentication

**`subscribeToTenantCollection<T>(collectionName: string, companyId: string, callback: (data: T[]) => void): () => void`**
- Real-time subscription to company-scoped collection
- Returns unsubscribe function
- Filters by `companyId`
- Error handling with empty array fallback

**`provisionUser(userData: Partial<UserProfile>): Promise<UserProfile>`**
- Creates new user profile
- Sets default values (dashboard config, branding)
- Generates unique ID

**`calculateInvoiceTotal(invoice: Partial<Invoice>): number`**
- Calculates invoice total from line items
- Applies discount and tax rates
- Handles edge cases (NaN, negatives)

**`createInvoice(data: Partial<Invoice>, companyId: string): Invoice`**
- Creates new invoice object
- Generates ID based on type (INV-/LPO-/DOC-)
- Sets default dates
- Calculates totals

**`generateNotification(...): Notification`**
- Creates notification object
- Generates unique ID
- Sets timestamp

**`generateAuditEntry(...): AuditEntry`**
- Creates audit log entry
- Generates unique ID
- Formats timestamp

### Notification Service (`services/notificationService.ts`)

**Purpose**: Browser notification management.

**Class: NotificationService**

**Methods**:
- `requestPermission()`: Request browser notification permission
- `showBrowserNotification()`: Display browser notification
- `addToHistory()`: Store notification in history
- `getHistory()`: Retrieve notification history
- `clearHistory()`: Clear notification history

**Features**:
- Permission state management
- LocalStorage persistence
- Auto-close after 5 seconds
- Click to focus window

### Translation Service (`services/translations.ts`)

**Purpose**: Internationalization (i18n) support.

**Structure**:
```typescript
translations = {
  EN: {
    dashboard: "Dashboard",
    clients: "Clients",
    // ... more keys
  }
}
```

**Usage**: Accessed via `BusinessContext.t(key)`

---

## Context Providers

### Business Context (`context/BusinessContext.tsx`)

**Purpose**: Global state management for business data and operations.

**State**:
- `user`: Firebase Auth user object
- `userProfile`: UserProfile | null | undefined
- `loading`: Authentication/profile loading state
- `clients`: Client[] (real-time)
- `catalog`: CatalogItem[] (real-time)
- `proposals`: Proposal[] (real-time)
- `invoices`: Invoice[] (real-time)
- `notifications`: Notification[] (real-time)
- `chatThreads`: ChatThread[] (real-time)
- `events`: CalendarEvent[] (real-time)
- `auditLogs`: AuditEntry[] (real-time)
- `vouchers`: Voucher[] (real-time)
- `campaigns`: Campaign[] (real-time)
- `toasts`: Toast[] (local state)
- `language`: Language (localStorage)
- `telemetry`: Computed business metrics

**Methods**:

**Client Operations**:
- `addClient(data)`: Create new client
- `updateClient(client)`: Update existing client
- `deleteClient(id)`: Delete client

**Catalog Operations**:
- `addCatalogItem(data)`: Create catalog item
- `updateCatalogItem(item)`: Update catalog item
- `deleteCatalogItem(id)`: Delete catalog item

**Project Operations**:
- `commitProject(proposal)`: Create/update project
- `updateProposal(proposal)`: Update proposal
- `deleteProposal(id)`: Delete proposal

**Invoice Operations**:
- `addInvoice(data)`: Create invoice
- `updateInvoice(invoice)`: Update invoice
- `deleteInvoice(id)`: Delete invoice
- `convertProposalToLPO(proposal)`: Convert proposal to LPO
- `convertDocToInvoice(doc)`: Convert LPO/Quote to Invoice

**Other Operations**:
- `setUserProfile(profile)`: Update user profile
- `pushNotification(notif)`: Create notification
- `markNotifRead(id)`: Mark notification as read
- `saveChatThread(thread)`: Save chat thread
- `deleteChatThread(id)`: Delete chat thread
- `addAuditLog(...)`: Create audit entry
- `saveVoucher(voucher)`: Save expense/receipt
- `deleteVoucher(id)`: Delete voucher
- `updateDashboardConfig(config)`: Update widget config
- `saveCampaign(campaign)`: Save campaign
- `provisionUser(data)`: Create new user (admin)
- `refreshUser()`: Refresh auth token

**Toast System**:
- `showToast(message, type)`: Show toast notification
- `removeToast(id)`: Remove toast

**Telemetry**:
Computed values recalculated on data changes:
- Total earnings, expenses, profit margin
- Pending revenue, overdue count
- Active projects, client count
- Tax progress and liability

**Real-time Subscriptions**:
- Sets up Firestore listeners on mount (when user/profile available)
- Unsubscribes on unmount
- Filters by `companyId` for multi-tenancy

**Profile Synchronization**:
- Watches Firebase Auth state changes
- Subscribes to user profile document
- Handles three states: `undefined` (loading), `null` (no profile), `UserProfile` (loaded)

### Theme Context (`context/ThemeContext.tsx`)

**Purpose**: Theme and UI preference management.

**State**:
- `theme`: 'dark' | 'light' | 'system'
- `direction`: 'ltr' | 'rtl'
- `fontSize`: 'sm' | 'base' | 'lg'

**Methods**:
- `toggleTheme()`: Cycle through themes
- `setTheme(theme)`: Set specific theme
- `setDirection(dir)`: Set text direction
- `setFontSize(size)`: Set font size

**Persistence**:
- Saves to localStorage
- Applies to document root on change
- System theme detection (prefers-color-scheme)

---

## Utilities & Helpers

### Validation (`utils/validation.ts`)

**Purpose**: Form and data validation utilities.

**Validators**:
- `email(value)`: Email format validation
- `phone(value)`: Phone number validation (international format)
- `required(value)`: Required field check
- `minLength(value, min)`: Minimum length
- `maxLength(value, max)`: Maximum length
- `number(value)`: Numeric validation
- `positiveNumber(value)`: Positive number check
- `url(value)`: URL format validation
- `date(value)`: Date validation
- `currency(value)`: Currency code validation

**Usage**:
```typescript
const error = validateField(value, [
  { validator: 'required', message: 'Field is required' },
  { validator: 'email', message: 'Invalid email' }
]);
```

### Debounce (`utils/debounce.ts`)

**Purpose**: Debounce function for search inputs and API calls.

**Usage**: Prevents excessive function calls on rapid input changes.

### PDF Templates (`utils/pdfTemplates.tsx`)

**Purpose**: PDF template renderers for invoices and proposals.

**Templates**:
- 8 invoice templates (same as Finance component)
- 8 proposal templates (matching invoice styles)

**Functions**:
- `renderInvoiceTemplate(template, props)`: Renders invoice PDF
- `renderProposalTemplate(template, props)`: Renders proposal PDF

**Template Props**:
```typescript
{
  invoice?: Invoice;
  proposal?: Proposal;
  userProfile: UserProfile;
  client: Client;
  total: number;
  isEditing?: boolean;
  onItemUpdate?: (index, updates) => void;
}
```

---

## Authentication & Authorization

### Authentication Flow

1. **Initial Load** (`App.tsx`):
   - Checks Firebase Auth state
   - Shows loading screen until profile loaded
   - Routes based on auth state

2. **Login** (`components/Auth.tsx`):
   - Email/password or social auth
   - Email verification check
   - Redirect to onboarding or dashboard

3. **Profile Check** (`BusinessContext`):
   - Subscribes to `/users/{uid}` document
   - Three states: `undefined` (loading), `null` (no profile), `UserProfile` (exists)

4. **Onboarding** (`components/Onboarding.tsx`):
   - Required for Owners/Admins if `onboarded: false`
   - Calls Cloud Function `initializeTenant`
   - Creates profile with `companyId`

### Authorization Model

**Roles**:
- `SUPER_ADMIN`: Full system access
- `OWNER`: Full company access, can manage users
- `EMPLOYEE`: Limited access based on permissions
- `CLIENT`: Read-only access to assigned projects

**Permissions**:
- `MANAGE_CLIENTS`: Client management
- `MANAGE_CAMPAIGNS`: Campaign creation
- `MANAGE_PROJECTS`: Project management
- `MANAGE_FINANCE`: Invoice/LPO management
- `MANAGE_CATALOG`: Catalog management
- `MANAGE_EXPENSES`: Expense management
- `MANAGE_PROVISIONING`: User management
- `ACCESS_AI`: AI features access

**Access Control**:
- Sidebar/Menu: Filtered by role and permissions
- API Operations: Checked in Firestore rules
- Component Features: Conditional rendering based on permissions
- Status Changes: Employees require approval (Pending Approval status)

### Firestore Security Rules (`firestore.rules`)

**Structure**:
```javascript
// Users collection
match /users/{userId} {
  allow get: if authenticated && (own profile || super admin);
  allow list: if authenticated && (same company || super admin);
  allow create, update: if authenticated && (own profile || super admin);
  allow delete: if super admin;
}

// Multi-tenant collections (clients, invoices, etc.)
match /{collectionName}/{docId} {
  allow read, update, delete: if super admin || (authenticated && same company);
  allow create: if super admin || (authenticated && sets own companyId);
}
```

**Helper Functions**:
- `isAuthenticated()`: Checks auth state
- `isSuperAdmin()`: Checks super admin role
- `belongsToCompany(companyId)`: Validates company membership

---

## Firebase Integration

### Firestore Collections

**Structure**:
```
firestore/
├── users/{uid}
│   └── UserProfile document
├── clients/{clientId}
│   └── Client document (companyId scoped)
├── proposals/{proposalId}
│   └── Proposal document (companyId scoped)
├── invoices/{invoiceId}
│   └── Invoice document (companyId scoped)
├── catalog/{itemId}
│   └── CatalogItem document (companyId scoped)
├── vouchers/{voucherId}
│   └── Voucher document (companyId scoped)
├── notifications/{notificationId}
│   └── Notification document (companyId scoped)
├── chat_threads/{threadId}
│   └── ChatThread document (companyId scoped)
├── events/{eventId}
│   └── CalendarEvent document (companyId scoped)
├── audit_logs/{logId}
│   └── AuditEntry document (companyId scoped)
├── campaigns/{campaignId}
│   └── Campaign document (companyId scoped)
└── pending_invites/{token}
    └── Invite document
```

**Indexes** (`firestore.indexes.json`):
- Composite indexes for filtered queries (companyId + status, etc.)

### Cloud Functions (`functions/index.js`)

**Current Status**: Basic setup with global options.

**Planned Functions**:
- `initializeTenant`: Called during onboarding to set up company
- `sendInvoiceEmail`: Send invoice PDF via email
- `processPayment`: Payment processing integration
- `generateInvoicePDF`: Server-side PDF generation

### Storage (`storage.rules`)

**Purpose**: File upload security (logos, signatures, campaign assets, receipts).

**Rules**: Company-scoped access similar to Firestore.

---

## Key Features & Use Cases

### 1. Client Lifecycle Management

**Flow**:
1. **Lead Creation**: Add client as "Lead"
2. **Contact**: Send proposals/quotes
3. **Conversion**: Client accepts proposal → becomes "Active"
4. **Engagement**: Create invoices, track payments
5. **LTV Tracking**: Automatically calculated from paid invoices

**Use Case**: Freelancer receives inquiry → Creates lead → Sends proposal → Client accepts → Active client → Invoicing begins

### 2. Proposal to Invoice Workflow

**Flow**:
1. Create proposal with AI assistance
2. Send proposal to client
3. Client accepts → Convert to LPO
4. LPO can be converted to Invoice
5. Invoice sent → Payment tracked → Status updated

**Use Case**: Project proposal → Accepted → Purchase Order (LPO) → Invoice → Payment → Completed

### 3. Financial Management

**Flow**:
1. Create invoice from catalog items or proposal
2. Select template and customize
3. Generate PDF preview
4. Send to client (email integration)
5. Track payment status
6. Calculate totals, taxes, discounts
7. Generate financial reports

**Use Case**: Service delivered → Create invoice → Send PDF → Track payment → Mark paid → Revenue recorded

### 4. Campaign Management

**Flow**:
1. Select target clients (by status or manual)
2. Choose channel (Email/WhatsApp)
3. Generate or upload visual asset
4. AI-assisted message composition
5. Apply branding (logo, colors)
6. Preview and dispatch

**Use Case**: New service launched → Create campaign → Target "Lead" clients → Generate branded email → Send campaign → Track engagement

### 5. Expense Tracking

**Flow**:
1. Create expense voucher (linked to project)
2. Upload receipt
3. Categorize expense
4. Track reimbursement status
5. Integrated into financial reports

**Use Case**: Project expense incurred → Create expense voucher → Upload receipt → Link to project → Reimbursed → Expense recorded

### 6. AI-Powered Features

**Features**:
- Proposal generation from natural language
- Business insights and recommendations
- Chat assistant for business questions
- Campaign content generation

**Use Case**: "I need a website for a restaurant" → AI generates proposal with timeline, budget, scope → User reviews and edits → Ready to send

### 7. Team Collaboration

**Flow**:
1. Admin provisions team members
2. Assign roles and permissions
3. Team members collaborate via chat
4. Share project updates
5. Real-time notifications

**Use Case**: Agency hires freelancer → Provision user → Assign to project → Team chat collaboration → Project updates shared

---

## Configuration

### Environment Variables

**Required** (`.env.local` or `.env`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Configuration (`firebase.json`)

```json
{
  "functions": [{
    "codebase": "default",
    "source": "functions"
  }],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### Vite Configuration (`vite.config.ts`)

- React plugin
- Port: 3001
- Auto-open browser
- CORS headers for popups
- Environment variable handling

### TypeScript Configuration (`tsconfig.json`)

- React 19 types
- Strict mode
- Module resolution: bundler
- Target: ES2020

---

## Deployment

### Firebase Hosting

1. **Build**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   ```bash
   firebase deploy
   ```

3. **Deploy Specific Services**:
   ```bash
   firebase deploy --only hosting
   firebase deploy --only functions
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

### Environment Setup

1. Create Firebase project
2. Enable Authentication (Email/Password, Google, Apple)
3. Create Firestore database
4. Set up Storage bucket
5. Deploy Cloud Functions
6. Configure environment variables in hosting
7. Set up custom domain (optional)

### Firestore Indexes

After deploying rules, Firebase will prompt for required indexes. Create them via Firebase Console or deploy `firestore.indexes.json`.

---

## Development Guide

### Getting Started

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd Craftly_App
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:
   Create `.env.local` with Firebase and Gemini API keys

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

### Development Workflow

1. **Create Feature Branch**
2. **Make Changes**
3. **Test Locally**:
   - Use Firebase Emulators (optional)
   - Test authentication flow
   - Verify Firestore rules
4. **Run TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```
5. **Commit and Push**
6. **Deploy** (after review)

### Code Style

- **Components**: PascalCase, functional components with TypeScript
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

### Best Practices

1. **Error Handling**: Always use try-catch for async operations
2. **Loading States**: Show loading indicators for async operations
3. **Validation**: Validate inputs before API calls
4. **Permissions**: Check permissions before rendering features
5. **Real-time Updates**: Use Firestore listeners for live data
6. **Type Safety**: Use TypeScript types strictly
7. **Performance**: Lazy load large components
8. **Accessibility**: Use semantic HTML and ARIA labels

### Testing Considerations

- **Unit Tests**: Test utility functions (validation, debounce)
- **Integration Tests**: Test API operations with Firestore
- **E2E Tests**: Test complete user flows (login → create invoice → send)

### Troubleshooting

**Common Issues**:

1. **Permission Denied Errors**:
   - Check Firestore security rules
   - Verify user has correct `companyId`
   - Check role and permissions

2. **Real-time Updates Not Working**:
   - Verify Firestore listeners are set up
   - Check `companyId` matches
   - Ensure user is authenticated

3. **PDF Generation Issues**:
   - Check html2canvas/jsPDF dependencies
   - Verify image CORS settings
   - Check template rendering

4. **AI Features Not Working**:
   - Verify `GEMINI_API_KEY` is set
   - Check API quota/limits
   - Review error logs

---

## Additional Resources

### Firebase Documentation
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Authentication Docs](https://firebase.google.com/docs/auth)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Storage Docs](https://firebase.google.com/docs/storage)

### React Documentation
- [React Docs](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app)

### Third-party Libraries
- [Lucide Icons](https://lucide.dev)
- [Recharts](https://recharts.org)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Google GenAI SDK](https://ai.google.dev)

---

## Support & Maintenance

### Logging
- Console logs for debugging
- Error boundaries for React errors
- Firebase Functions logs (Cloud Logging)

### Monitoring
- Firebase Analytics (if enabled)
- Error tracking (consider Sentry integration)
- Performance monitoring

### Updates
- Regularly update dependencies
- Monitor Firebase service status
- Review and update security rules

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team
