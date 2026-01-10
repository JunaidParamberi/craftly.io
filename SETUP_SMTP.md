# Setting Up SMTP for Firebase Functions with craftlyai.app Domain

## Why You Need This

Firebase Functions require SMTP credentials to send emails with PDF attachments. Without these secrets, deployment will fail.

## Email Addresses Used

The app uses the following email addresses from your `craftlyai.app` domain:
- **Automated emails** (invites, invoices): `no-reply@craftlyai.app` (fallback)
- **User-initiated emails** (campaigns, bulk emails): `hello@craftlyai.app` (fallback)

**Important:** You need to configure your SMTP credentials with one of these email addresses as `SMTP_USER`. The code will use this as the "From" address for all outgoing emails.

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication on Your Google Account

1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the setup instructions
4. **Important:** This is required to generate app passwords

### 2. Generate an App-Specific Password

1. Go to https://myaccount.google.com/apppasswords
2. You may be prompted to sign in again
3. Under "Select app", choose "Mail"
4. Under "Select device", choose "Other (Custom name)"
5. Enter "Firebase Functions" or any name you prefer
6. Click "Generate"
7. **Copy the 16-character password** (you won't see it again!)

### 3. Set Firebase Secrets

Run these commands in your terminal:

```bash
# Set SMTP_USER (your craftlyai.app email address)
firebase functions:secrets:set SMTP_USER
# When prompted, enter: no-reply@craftlyai.app (recommended for automated emails)
# OR enter: hello@craftlyai.app (for user-initiated emails)

# Set SMTP_PASS (the app password you just generated)
firebase functions:secrets:set SMTP_PASS
# When prompted, enter: the 16-character app password (no spaces)
```

### 4. Verify Secrets Are Set

```bash
# List all secrets
firebase functions:secrets:access SMTP_USER
firebase functions:secrets:access SMTP_PASS
```

You should see the values you entered (they'll be masked for security).

### 5. Deploy Functions

Now you can deploy:

```bash
cd functions
npm install
firebase deploy --only functions
```

## Troubleshooting

### "Secret not found" Error
- Make sure you've created the secrets using `firebase functions:secrets:set`
- Verify the secret names are exactly: `SMTP_USER` and `SMTP_PASS` (case-sensitive)

### "Authentication failed" Error
- Verify your email app password is correct (16 characters, no spaces for Gmail)
- Make sure 2-factor authentication is enabled (if using Gmail/Google Workspace)
- Try generating a new app password
- Verify your email address is correct (e.g., `no-reply@craftlyai.app`)

### "Less secure app access" Error
- This shouldn't happen with app passwords
- Make sure you're using an app password, not your regular email password
- App passwords work even when "Less secure app access" is disabled (Gmail)
- For Google Workspace with custom domain: Ensure SMTP is enabled for your domain

## Using Google Workspace with craftlyai.app Domain

If you're using Google Workspace with your `craftlyai.app` domain:
1. The SMTP setup is the same as Gmail
2. Use your `@craftlyai.app` email address (e.g., `no-reply@craftlyai.app`)
3. Generate an app password from your Google Workspace admin panel
4. The code will automatically work with your custom domain

## Alternative: Use Other SMTP Providers

If you're using a different email provider (not Gmail/Google Workspace), you can use other SMTP providers:

### SendGrid
```bash
firebase functions:secrets:set SMTP_USER
# Enter: apikey
firebase functions:secrets:set SMTP_PASS
# Enter: your-sendgrid-api-key
```

Then update `functions/index.js` to use SendGrid SMTP settings.

### Mailgun
```bash
firebase functions:secrets:set SMTP_USER
# Enter: postmaster@your-domain.mailgun.org
firebase functions:secrets:set SMTP_PASS
# Enter: your-mailgun-password
```

## Important Notes

- **App passwords are single-use**: If you regenerate, you'll need to update the secret
- **Keep your app password secure**: Don't commit it to version control
- **Test after deployment**: Send a test email to verify everything works
