# Recommended Email Addresses for craftlyai.app Domain

## System/Automated Emails (Required)

These emails are used by the app for automated system communications:

1. **no-reply@craftlyai.app** ⭐ **REQUIRED**
   - **Purpose**: Automated system emails (invites, notifications, receipts)
   - **Use**: System-generated emails that don't require replies
   - **Currently Used In**: 
     - Invite emails (`functions/index.js` - `sendInviteEmail`)
     - Invoice emails fallback (`functions/index.js` - `sendInvoiceEmail`)
     - System notifications
   - **Priority**: **HIGH** - Set this up first!

2. **system@craftlyai.app**
   - **Purpose**: System alerts, technical notifications
   - **Use**: Backend/system-generated alerts, error notifications
   - **Priority**: Medium

## User-Facing Support Emails (Required)

3. **hello@craftlyai.app** ⭐ **REQUIRED**
   - **Purpose**: User-initiated emails, general inquiries, campaigns
   - **Use**: When users send emails through the app (campaigns, bulk emails, user emails)
   - **Currently Used In**:
     - Bulk email campaigns fallback (`functions/index.js` - `sendBulkEmails`)
     - User email module fallback (`components/EmailModule.tsx`)
   - **Priority**: **HIGH** - Set this up first!

4. **support@craftlyai.app**
   - **Purpose**: Customer support, help desk
   - **Use**: Direct customer support inquiries
   - **Priority**: High

## Business & Marketing Emails

5. **info@craftlyai.app**
   - **Purpose**: General information, business inquiries
   - **Use**: Public-facing business contact
   - **Priority**: High

6. **sales@craftlyai.app**
   - **Purpose**: Sales inquiries, partnerships
   - **Use**: Business development, sales contacts
   - **Priority**: Medium

7. **marketing@craftlyai.app**
   - **Purpose**: Marketing communications
   - **Use**: Marketing campaigns, newsletters, announcements
   - **Priority**: Medium

## Security & Admin Emails

8. **security@craftlyai.app**
   - **Purpose**: Security alerts, account security notifications
   - **Use**: Two-factor authentication, password resets, security incidents
   - **Priority**: High

9. **admin@craftlyai.app**
   - **Purpose**: Administrative communications
   - **Use**: Internal admin communications, system administration
   - **Priority**: Medium

10. **accounts@craftlyai.app**
    - **Purpose**: Account management
    - **Use**: Account-related communications, account changes
    - **Priority**: Medium

## Finance & Billing Emails

11. **billing@craftlyai.app**
    - **Purpose**: Billing inquiries, payment notifications
    - **Use**: Invoice-related questions, payment processing
    - **Priority**: Medium

12. **finance@craftlyai.app**
    - **Purpose**: Financial communications
    - **Use**: Financial reports, accounting matters
    - **Priority**: Low

## Development & Technical

13. **dev@craftlyai.app** or **developers@craftlyai.app**
    - **Purpose**: Development team communications
    - **Use**: Technical discussions, developer communications
    - **Priority**: Low

14. **api@craftlyai.app**
    - **Purpose**: API-related communications
    - **Use**: API documentation, API support
    - **Priority**: Low

## Legal & Compliance

15. **legal@craftlyai.app**
    - **Purpose**: Legal matters, compliance
    - **Use**: Legal inquiries, compliance requests, privacy matters
    - **Priority**: Medium

16. **privacy@craftlyai.app**
    - **Purpose**: Privacy-related inquiries
    - **Use**: GDPR requests, privacy policy questions, data protection
    - **Priority**: Medium (Required for GDPR compliance)

## Priority Setup Order

### Phase 1: Essential (Setup First) ⭐
1. **no-reply@craftlyai.app** - System emails
2. **hello@craftlyai.app** - User emails

### Phase 2: Important (Setup Soon)
3. **support@craftlyai.app** - Customer support
4. **info@craftlyai.app** - General inquiries
5. **security@craftlyai.app** - Security alerts

### Phase 3: Business Operations
6. **sales@craftlyai.app** - Sales inquiries
7. **admin@craftlyai.app** - Administrative
8. **billing@craftlyai.app** - Billing inquiries

### Phase 4: Compliance & Advanced
9. **legal@craftlyai.app** - Legal matters
10. **privacy@craftlyai.app** - Privacy/GDPR (Required for EU compliance)

### Phase 5: Optional
11-16. Remaining addresses as needed

## SMTP Configuration

**For the app to work properly, you need to configure SMTP for at least:**

### Minimum Required:
- **no-reply@craftlyai.app** (for automated system emails)
- **hello@craftlyai.app** (for user-initiated emails)

### Important: Sending from User Emails

**The app is configured to send user-initiated emails (invoices, LPOs, campaigns, proposals) FROM the user's email address when available.**

**SMTP Configuration Options:**

1. **If users have @craftlyai.app email addresses:**
   - Configure SMTP to allow sending from any @craftlyai.app address
   - Set `SMTP_USER` in Firebase Functions to a master account (e.g., `no-reply@craftlyai.app`)
   - Google Workspace and other providers allow sending from any address in your domain

2. **If users have personal emails (e.g., @gmail.com):**
   - **Option A**: Configure SMTP to support "send as" feature for each user email
     - In Google Workspace, add user emails as "Send mail as" addresses
     - More complex, requires per-user configuration
   - **Option B**: Use app domain email as "from" and set "replyTo" to user's email
     - Recipients will see the email from app domain but replies go to user
     - Simpler setup, but emails appear to come from app, not user
   - **Option C**: Have users use their own email client (mailto: links)
     - Currently used for campaigns and proposals
     - Opens user's email client, uses their email automatically

### Recommended Setup:
- Use **no-reply@craftlyai.app** as `SMTP_USER` in Firebase Functions
- Configure your email provider (Google Workspace, Zoho, etc.) to allow sending from any `@craftlyai.app` address
- When users send emails through the app, they'll come FROM their @craftlyai.app email address
- System emails will use the `no-reply@craftlyai.app` address

## Email Provider Setup Notes

### Google Workspace (Recommended)
- Allows sending from custom domain emails
- Supports multiple email aliases
- Easy SMTP configuration
- Good deliverability

### Other Providers
- Zoho Mail: Good for small businesses
- Microsoft 365: Enterprise-grade
- SendGrid/Mailgun: Transactional email specialists (for high volume)

## Current Implementation

### Email Sending Behavior:

**User-Initiated Emails** (Invoices, LPOs, Campaigns, Proposals, Bulk Emails):
- **FROM**: User's email (from `userProfile.email`) when available
- **Fallback**: `hello@craftlyai.app` or `SMTP_USER` if user email not available
- **Reply-To**: Set to user's email if different from "from" address
- **Components**: 
  - Invoices/LPOs: `components/PdfSlideout.tsx` → `functions/sendInvoiceEmail`
  - Bulk Emails/Campaigns: `components/EmailModule.tsx` → `functions/sendBulkEmails`
  - CRM Campaigns: `components/CRM.tsx` (uses `mailto:` - opens user's email client)
  - Proposals: `components/ProposalPdfSlideout.tsx` (uses `mailto:` - opens user's email client)

**System/Automated Emails** (Invites, Notifications):
- **FROM**: `no-reply@craftlyai.app` or `SMTP_USER`
- **Name**: "CreaftlyAI Node System"
- **Components**: 
  - Invites: `functions/sendInviteEmail`

### Code Flow:

1. **Frontend** passes `senderEmail` and `senderName` from `userProfile` to Firebase Functions
2. **Functions** fetch user data from Firestore if not provided in request
3. **Functions** use user's email as "from" address for user-initiated emails
4. **SMTP** must be configured to allow sending from user's email address
5. **Fallback** to app domain email if user email unavailable or SMTP fails

### Important Notes:

- **SMTP must support sending from user emails** - configure your email provider accordingly
- If user's email is different domain, SMTP must support "send as" or emails will fail
- System emails always use app domain (`no-reply@craftlyai.app`)
- User-initiated emails prioritize user's email for better personalization
