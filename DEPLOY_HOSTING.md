# Deploy to Firebase Hosting with Custom Domain (app.craftlyai.app)

## Overview

This guide covers deploying your Craftly app to Firebase Hosting and configuring the custom domain `app.craftlyai.app` that you purchased from Google.

## Prerequisites

1. ✅ Firebase project `craftly-76601` is set up
2. ✅ Domain `craftlyai.app` purchased from Google
3. ✅ Subdomain `app.craftlyai.app` added in Firebase Hosting
4. ✅ Firebase CLI installed and authenticated

## Step 1: Build Your App

First, build your React app for production:

```bash
# Install dependencies (if not already done)
npm install

# Build the app (creates a 'dist' folder)
npm run build
```

This will create a `dist` folder with your production-ready files.

## Step 2: Deploy to Firebase Hosting

### Option A: Deploy Everything (Hosting, Functions, Firestore, Storage)

```bash
firebase deploy
```

### Option B: Deploy Only Hosting (Recommended for initial deployment)

```bash
firebase deploy --only hosting
```

### Option C: Deploy Hosting and Skip Firestore Indexes (if index deployment fails)

```bash
firebase deploy --only hosting,functions,storage
```

This skips the Firestore indexes if they're causing issues.

## Step 3: Configure Custom Domain in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/project/craftly-76601/hosting

2. **Add Custom Domain** (if not already added):
   - Click "Add custom domain"
   - Enter: `app.craftlyai.app`
   - Click "Continue"

3. **DNS Configuration**:
   Firebase will show you a modal with DNS records. You need to add a **CNAME record** in your Google Domain settings:

   **Record Type**: CNAME  
   **Name**: `app` (or `app.craftlyai.app` depending on your DNS provider)  
   **Value**: `craftly-76601.web.app`  
   **TTL**: 3600 (or use default)

## Step 4: Configure DNS in Google Domains

1. **Go to Google Domains**: https://domains.google.com

2. **Select your domain**: `craftlyai.app`

3. **Go to DNS Settings**:
   - Click on "DNS" in the left sidebar
   - Scroll down to "Custom resource records"

4. **Add CNAME Record**:
   - Click "Add" or "Manage custom records"
   - **Name**: `app`
   - **Type**: `CNAME`
   - **Data**: `craftly-76601.web.app`
   - **TTL**: `3600` (1 hour)
   - Click "Save"

5. **Wait for DNS Propagation**:
   - DNS changes can take up to 24 hours, but usually propagate within 1-4 hours
   - Firebase will automatically detect when the DNS record is verified
   - You can check the status in the Firebase Console

## Step 5: Verify Domain in Firebase

1. **Go back to Firebase Console** → Hosting → Custom domains
2. **Check Domain Status**:
   - If DNS is configured correctly, Firebase will show "Verified" status
   - SSL certificate will be automatically provisioned (this can take up to 24 hours)

3. **Domain Status States**:
   - 🟡 **Pending**: DNS records not detected yet (wait and check again later)
   - 🟢 **Verified**: DNS records detected, SSL certificate provisioning
   - ✅ **Active**: Domain is live and ready to use

## Step 6: Access Your App

Once the domain is verified and SSL certificate is provisioned:

- **Production URL**: https://app.craftlyai.app
- **Firebase Hosting URL**: https://craftly-76601.web.app (still works)

## Troubleshooting

### Issue 1: Firestore Index Deployment Error

If you see this error:
```
Error: Failed to make request to https://firestore.googleapis.com/v1/projects/craftly-76601/databases/(default)/collectionGroups/invoices/indexes
```

**Solutions**:

1. **Deploy indexes separately** (skip during main deployment):
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Check if index already exists**:
   - Go to Firebase Console → Firestore → Indexes
   - Look for the `invoices` collection index
   - If it exists, you can remove it from `firestore.indexes.json` or leave it (it's idempotent)

3. **Create index manually**:
   - Go to Firebase Console → Firestore → Indexes
   - Click "Create Index"
   - Collection: `invoices`
   - Fields:
     - `publicToken` (Ascending)
     - `isPublic` (Ascending)
   - Click "Create"

4. **Deploy without indexes** (temporary workaround):
   ```bash
   # Deploy everything except Firestore indexes
   firebase deploy --except firestore:indexes
   ```

### Issue 2: DNS Records Not Detected

If Firebase shows "Records not yet detected":

1. **Verify DNS configuration**:
   ```bash
   # Check if CNAME record exists
   dig app.craftlyai.app CNAME
   # or
   nslookup app.craftlyai.app
   ```

2. **Check DNS propagation**:
   - Use https://www.whatsmydns.net to check global DNS propagation
   - Enter: `app.craftlyai.app`
   - Look for CNAME record pointing to `craftly-76601.web.app`

3. **Common issues**:
   - **Wrong name**: Make sure you're using `app` (not `app.craftlyai.app`) as the name in Google Domains
   - **Wrong type**: Must be CNAME (not A record)
   - **Wrong value**: Must be exactly `craftly-76601.web.app` (no trailing dot, no http://)

### Issue 3: Build Errors

If `npm run build` fails:

1. **Check TypeScript errors**:
   ```bash
   npm run build
   ```
   Fix any TypeScript errors shown

2. **Clear cache and rebuild**:
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   ```

3. **Check for missing dependencies**:
   ```bash
   npm install
   npm run build
   ```

### Issue 4: App Not Loading After Deployment

1. **Check Firebase Hosting logs**:
   ```bash
   firebase hosting:channel:list
   ```

2. **Verify build output**:
   - Make sure `dist/index.html` exists
   - Check that `dist` folder has all assets (JS, CSS, images)

3. **Clear browser cache** and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

4. **Check Firebase Console** → Hosting → Dashboard for deployment status

### Issue 5: SSL Certificate Not Provisioned

SSL certificates are automatically provisioned by Firebase but can take up to 24 hours:

1. **Check SSL status** in Firebase Console → Hosting → Custom domains
2. **Wait**: Usually takes 1-4 hours, but can take up to 24 hours
3. **If stuck**: Contact Firebase Support or check Firebase Status page

## Workflow for Regular Updates

After initial setup, to update your app:

```bash
# 1. Build the app
npm run build

# 2. Deploy to hosting
firebase deploy --only hosting

# Or deploy everything (if you also changed functions/rules)
firebase deploy
```

## Environment Variables

If you need environment variables in production:

1. **Build-time variables**: Set in `.env.production` file
2. **Runtime variables**: Use Firebase Functions environment config
3. **Secrets**: Use Firebase Functions secrets (for sensitive data)

## Important Notes

- ✅ **Custom domain**: `app.craftlyai.app` will be your production URL
- ✅ **SSL**: Automatically handled by Firebase (free SSL certificates)
- ✅ **CDN**: Firebase Hosting includes global CDN
- ✅ **Rollback**: You can rollback deployments from Firebase Console
- ✅ **Preview channels**: Use `firebase hosting:channel:deploy` for preview deployments

## Next Steps

After successful deployment:

1. ✅ Test your app at https://app.craftlyai.app
2. ✅ Set up monitoring and analytics
3. ✅ Configure backup and disaster recovery
4. ✅ Set up CI/CD for automated deployments

## Quick Reference Commands

```bash
# Build app
npm run build

# Deploy only hosting
firebase deploy --only hosting

# Deploy everything
firebase deploy

# Deploy everything except Firestore indexes
firebase deploy --except firestore:indexes

# Check deployment status
firebase hosting:channel:list

# View hosting logs
firebase hosting:channel:open preview-channel-name
```

## Support

If you encounter issues:
1. Check Firebase Console → Hosting for detailed error messages
2. Check Firebase Status: https://status.firebase.google.com
3. Review Firebase Hosting docs: https://firebase.google.com/docs/hosting
