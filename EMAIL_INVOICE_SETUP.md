# Email and Invoice Automation Setup Guide

## Overview
This document outlines the bulk email functionality, dynamic email/WhatsApp sending with PDF attachments, and recurring invoice automation that has been implemented.

## Features Implemented

### 1. Bulk Email Functionality
- **Location**: `components/EmailModule.tsx`
- **Features**:
  - Toggle between single and bulk email modes
  - Select multiple clients from the client list
  - Manually add multiple email addresses
  - Send emails to all selected recipients at once
  - Real-time tracking of sent/failed emails

### 2. Dynamic Email Sending with PDF Attachments
- **Location**: `components/PdfSlideout.tsx`, `functions/index.js`
- **Features**:
  - Generate PDF from invoice template
  - Send email via Firebase Cloud Functions (SMTP)
  - Attach PDF automatically to email
  - Include invoice viewing link in email
  - Fallback to mailto: if email API not configured
  - Update invoice status to 'Sent' automatically

### 3. WhatsApp Integration
- **Location**: `components/PdfSlideout.tsx`, `functions/index.js`
- **Features**:
  - Send WhatsApp messages via Twilio API (if configured)
  - Fallback to WhatsApp web link if Twilio not configured
  - Include invoice details and viewing link
  - Update invoice status automatically

### 4. Recurring Invoice Automation
- **Location**: `components/Finance.tsx`, `functions/index.js`
- **Features**:
  - Enable recurring invoices in invoice form
  - Set frequency (Weekly, Monthly, Quarterly, Yearly)
  - Set next recurring date
  - Auto-send option (sends automatically when recurring)
  - Scheduled Cloud Function runs daily at 9 AM UTC
  - Automatically creates new invoices on recurring date
  - Calculates next recurring date based on frequency

## Configuration Required

### 1. Email (SMTP) Configuration
Set these secrets in Firebase Functions:
```bash
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
```

Or set in Firebase Console:
1. Go to Firebase Console → Functions → Configuration
2. Add secrets:
   - `SMTP_USER`: Your Gmail address (or SMTP server username)
   - `SMTP_PASS`: Your Gmail app password (or SMTP password)

**For Gmail:**
- Enable 2-factor authentication
- Generate an app-specific password at: https://myaccount.google.com/apppasswords
- Use the app password as `SMTP_PASS`

### 2. WhatsApp (Twilio) Configuration (Optional)
For WhatsApp API integration, set these secrets:
```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
```

**To set up Twilio:**
1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Request WhatsApp access or use Twilio Sandbox
4. Get your WhatsApp-enabled phone number from Twilio
5. Install Twilio package in functions:
   ```bash
   cd functions
   npm install twilio
   ```

**Note:** If Twilio is not configured, the system will automatically fallback to WhatsApp web links.

### 3. Deploy Firebase Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

## Usage

### Bulk Email
1. Open Email Module
2. Click "Compose"
3. Toggle "Bulk" mode
4. Select clients from the list or manually add email addresses
5. Enter subject and message
6. Click "Dispatch"

### Send Invoice with PDF
1. Open an invoice in Finance module
2. Click the send button (⚡ icon)
3. Choose Email or WhatsApp mode
4. Click "Dispatch & Link"
5. PDF will be generated and sent automatically

### Create Recurring Invoice
1. Create/Edit an invoice
2. Scroll to "Recurring Invoice" section
3. Enable "Recurring Invoice" toggle
4. Select frequency (Weekly, Monthly, etc.)
5. Set next recurring date
6. (Optional) Enable "Auto-send when recurring"
7. Save invoice

The system will automatically:
- Create a new invoice on the recurring date
- Send it automatically if auto-send is enabled
- Update the next recurring date based on frequency

## Scheduled Function

The `processRecurringInvoices` function runs daily at 9 AM UTC and:
- Finds all recurring invoices due today
- Creates new invoices based on the recurring template
- Calculates next recurring date
- Updates original invoice's next recurring date
- Optionally sends the invoice if auto-send is enabled

## Testing

### Test Email Sending
1. Configure SMTP credentials
2. Deploy functions
3. Try sending an invoice from the Finance module
4. Check email inbox for PDF attachment

### Test Bulk Email
1. Create multiple test clients with email addresses
2. Open Email Module
3. Use bulk mode to select clients
4. Send test email
5. Verify all recipients received the email

### Test Recurring Invoices
1. Create a test invoice with recurring enabled
2. Set reoccurrenceDate to today's date
3. Wait for scheduled function to run (or trigger manually)
4. Verify new invoice was created

## Troubleshooting

### Email not sending
- Check SMTP credentials are set correctly
- Verify Gmail app password if using Gmail
- Check Firebase Functions logs: `firebase functions:log`
- Ensure functions are deployed

### WhatsApp not working
- Verify Twilio credentials are set
- Install Twilio package: `npm install twilio` in functions directory
- Check Twilio account has WhatsApp enabled
- If Twilio not configured, system will use WhatsApp web (opens in browser)

### Recurring invoices not generating
- Check scheduled function is deployed
- Verify function is running: Check Firebase Functions logs
- Ensure invoice has `isReoccurring: true` and valid `reoccurrenceDate`
- Check invoice status (must be Sent, Draft, or Paid)

## Notes

- PDF generation happens client-side using html2canvas and jsPDF
- For server-side PDF generation (recommended for production), consider using Puppeteer
- Recurring invoices maintain reference to parent invoice via `parentInvoiceId`
- Auto-send feature requires email/WhatsApp to be configured
