# Deploy Firebase Functions to Fix CORS Error

## The CORS Error Explained

The error you're seeing:
```
Access to fetch at 'https://us-central1-craftly-76601.cloudfunctions.net/sendInvoiceEmail' 
from origin 'http://localhost:3001' has been blocked by CORS policy
```

This happens because:
1. **The function isn't deployed yet** - The function needs to be deployed to Firebase before it can be called
2. **Firebase Functions v2 `onCall` functions automatically handle CORS** - But only after deployment

## Quick Fix: Deploy the Functions

### Step 1: Set Required Secrets (REQUIRED - Do this first!)
```bash
# Set SMTP credentials (required for email functions to work)
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS

# Follow prompts to enter:
# - SMTP_USER: Your email address (recommended: no-reply@craftlyai.app for automated emails, or hello@craftlyai.app for user emails)
# - SMTP_PASS: Your email app password or SMTP password (see instructions below)
```

### Step 2: Navigate to functions directory
```bash
cd functions
```

### Step 3: Install dependencies (if not already done)
```bash
npm install
```

### Step 4: Deploy all functions
```bash
firebase deploy --only functions
```

### Step 5: Deploy specific function (if you only want to deploy one)
```bash
firebase deploy --only functions:sendInvoiceEmail
firebase deploy --only functions:sendBulkEmails
firebase deploy --only functions:sendWhatsAppMessage
firebase deploy --only functions:processRecurringInvoices
```

**Note:** Twilio secrets are OPTIONAL - only needed if you want WhatsApp API integration. The function will work with WhatsApp web links without Twilio.

## Configure Email (SMTP) Credentials - REQUIRED

**Before deploying, you MUST set up SMTP credentials or deployment will fail:**

### Option 1: Using Firebase CLI (Recommended)
```bash
# Set SMTP credentials as secrets
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
```

You'll be prompted to enter the values:
- `SMTP_USER`: Your email address (recommended: `no-reply@craftlyai.app` for automated/system emails, or `hello@craftlyai.app` for user-initiated emails)
- `SMTP_PASS`: Your email app password or SMTP password (see instructions below)

**Note:** The app will automatically use:
- `no-reply@craftlyai.app` as fallback for automated emails (invites, invoices)
- `hello@craftlyai.app` as fallback for user-initiated bulk emails

### Option 2: Using gcloud CLI
```bash
# Set SMTP_USER (use your craftlyai.app domain email)
echo -n "no-reply@craftlyai.app" | gcloud secrets create SMTP_USER --data-file=-
echo -n "no-reply@craftlyai.app" | gcloud secrets add-version SMTP_USER --data-file=-

# Set SMTP_PASS
echo -n "your-smtp-password" | gcloud secrets create SMTP_PASS --data-file=-
echo -n "your-smtp-password" | gcloud secrets add-version SMTP_PASS --data-file=-
```

### Option 3: Using Firebase Console
1. Go to Firebase Console → Functions → Configuration
2. Click "Secrets" tab
3. Click "Add secret"
4. Add secrets:
   - Name: `SMTP_USER`, Value: Your email address (e.g., `no-reply@craftlyai.app`)
   - Name: `SMTP_PASS`, Value: Your email SMTP password (see instructions below)

### For Email Setup (craftlyai.app domain):
1. **Configure SMTP settings** with your email provider (Google Workspace, Zoho, etc.)
2. **For automated emails** (invites, invoices): Use `no-reply@craftlyai.app` as `SMTP_USER`
3. **For user-initiated emails** (campaigns, bulk emails): Use `hello@craftlyai.app` as `SMTP_USER`
4. **Get SMTP credentials** from your email provider:
   - SMTP Server: Usually `smtp.gmail.com` (Gmail) or your provider's SMTP server
   - SMTP Port: Usually `587` (TLS) or `465` (SSL)
   - SMTP Username: Your email address (e.g., `no-reply@craftlyai.app`)
   - SMTP Password: Your app password or account password (depending on provider)

**Note:** The code uses Gmail's SMTP service by default. If using a different provider, you may need to update the `getTransporter()` function in `functions/index.js` to use your provider's SMTP settings.

## After Deployment

After deploying, the functions will automatically handle CORS for:
- `http://localhost:3001`
- `http://localhost:3000`
- `http://localhost:5173`
- Your Firebase hosting domains

## Test the Deployment

1. After deploying, wait 1-2 minutes for the function to propagate
2. Try sending an invoice again from your app
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

## Troubleshooting

### If you still get CORS errors after deployment:

1. **Clear browser cache** and reload
2. **Check function is deployed**:
   ```bash
   firebase functions:list
   ```
3. **Check function logs**:
   ```bash
   firebase functions:log --only sendInvoiceEmail
   ```
4. **Verify function URL** in Firebase Console → Functions

### If email still doesn't send:

1. **Check SMTP credentials are set**:
   ```bash
   firebase functions:secrets:access SMTP_USER
   ```
2. **Check function logs** for specific errors
3. **Verify Gmail app password** is correct
4. **Check Gmail security** - Less secure app access might be needed

### For Local Development (Emulator):

If you want to test locally without deploying:

1. **Install Firebase emulator**:
   ```bash
   npm install -g firebase-tools
   firebase init emulators
   ```

2. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

3. **Configure your app** to use emulator (already done in `services/firebase.ts`)

4. **Set environment variable** (create `.env.local`):
   ```
   VITE_FUNCTIONS_EMULATOR_URL=localhost:5001
   ```

## Next Steps

After deploying:
- ✅ Functions will handle CORS automatically
- ✅ Email sending will work with PDF attachments
- ✅ Bulk email functionality will be available
- ✅ WhatsApp integration will work (with Twilio setup)
- ✅ Recurring invoices will be processed daily at 9 AM UTC

## Important Notes

- **Firebase Functions v2 `onCall` functions automatically handle CORS** - No manual CORS configuration needed
- **Functions must be deployed** before they can be called from your app
- **SMTP credentials must be set** as secrets before email sending will work
- **The function will fallback to mailto:** link if email service is not configured
