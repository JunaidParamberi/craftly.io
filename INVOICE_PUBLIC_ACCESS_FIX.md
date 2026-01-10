# Invoice Public Access Fix

## Problem
When sending invoices via email, recipients see "Invoice Not Found" error when clicking the public link.

## Root Causes Fixed

### 1. Token Mismatch
**Issue**: Different public tokens were being generated at different stages:
- Client-side generated token A
- Email link used token B (generated separately)
- Function generated token C (if token missing)

**Fix**: 
- Generate token ONCE and reuse it throughout the process
- Pass token from client to function
- Function uses the passed token instead of generating a new one

### 2. Race Condition
**Issue**: Invoice update might not complete before email is sent, causing function to read stale data.

**Fix**:
- Update invoice with `publicToken` and `isPublic` BEFORE calling email function
- Add delay (1000ms) to ensure Firestore write propagates
- Function validates and uses passed token

### 3. Link Generation Inconsistency
**Issue**: Email body link might use different token than what's saved in database.

**Fix**:
- Extract token from email body link if present
- Ensure saved token matches link token
- Use consistent base URL (app.craftlyai.app)

## Changes Made

### components/PdfSlideout.tsx
1. **Updated `handleSendEmail`**:
   - Generate token once and reuse
   - Extract token from email body link (if user didn't modify)
   - Update invoice BEFORE sending email
   - Wait for Firestore write to complete
   - Pass token to function

2. **Updated `getPublicLink`**:
   - Accept optional token parameter
   - Use existing token from invoice if available
   - Consistent base URL generation

3. **Updated `getDefaultEmailData`**:
   - Use existing token if available
   - Ensure consistency with what will be saved

### functions/index.js
1. **Updated `sendInvoiceEmail`**:
   - Accept `publicToken` parameter from client
   - Use passed token instead of generating new one
   - Only generate token as last resort if not provided and doesn't exist
   - Added logging for debugging

## Verification Steps

### 1. Check Firestore Index
Ensure the compound index exists:
```bash
firebase deploy --only firestore:indexes
```

Index should be:
```json
{
  "collectionId": "invoices",
  "fields": [
    { "fieldPath": "publicToken", "order": "ASCENDING" },
    { "fieldPath": "isPublic", "order": "ASCENDING" }
  ]
}
```

### 2. Check Firestore Rules
Verify public access rules allow reading invoices with `isPublic = true`:
```javascript
allow read: if (resource != null && resource.data.isPublic == true) || ...
```

### 3. Test Flow
1. Create/save an invoice
2. Open invoice PDF slideout
3. Click "Send Email"
4. Verify email modal shows public link
5. Send email
6. Check Firestore: Invoice should have `publicToken` and `isPublic: true`
7. Click the link from email
8. Invoice should load in PublicInvoiceViewer

### 4. Debug Queries
If still not working, check:
```javascript
// In browser console (PublicInvoiceViewer)
const q = query(
  collection(db, 'invoices'),
  where('publicToken', '==', 'inv-abc123'),
  where('isPublic', '==', true)
);
const snapshot = await getDocs(q);
console.log('Query result:', snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
```

## Common Issues

### Issue: "Index not found" error
**Solution**: Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

### Issue: Token in email doesn't match database
**Solution**: 
- Clear browser cache
- Check that invoice update completed before email send
- Verify token extraction from email body works

### Issue: Function generates different token
**Solution**: 
- Ensure `publicToken` is passed from client
- Check function logs: `firebase functions:log --only sendInvoiceEmail`

### Issue: Query returns empty
**Solution**:
- Verify `isPublic` is exactly `true` (boolean, not string)
- Verify `publicToken` matches exactly (case-sensitive)
- Check Firestore security rules allow public read

## Testing Checklist

- [ ] Invoice can be created and saved
- [ ] Email modal shows public link with token
- [ ] Invoice is updated with `publicToken` and `isPublic: true` before email send
- [ ] Function receives `publicToken` parameter
- [ ] Function uses passed token (doesn't generate new one)
- [ ] Invoice in Firestore has correct `publicToken` and `isPublic: true`
- [ ] Public link from email works (opens PublicInvoiceViewer)
- [ ] Query in PublicInvoiceViewer finds the invoice
- [ ] Invoice displays correctly in public viewer
- [ ] Firestore index is deployed
- [ ] Firestore rules allow public read

## Deployment

After fixing, deploy:
```bash
# Deploy functions (with updated sendInvoiceEmail)
firebase deploy --only functions:sendInvoiceEmail

# Deploy Firestore indexes (if needed)
firebase deploy --only firestore:indexes

# Deploy hosting (with updated PdfSlideout component)
firebase deploy --only hosting
```

## Monitoring

Check function logs after deployment:
```bash
firebase functions:log --only sendInvoiceEmail --limit 50
```

Look for:
- `Invoice {id} updated with publicToken: {token}, isPublic: true`
- Any errors during invoice update
- Token generation messages

## Additional Notes

- The delay (1000ms) ensures Firestore write propagates, but can be reduced if needed
- Token extraction from email body handles cases where user might edit the email
- Base URL uses `app.craftlyai.app` to match subdomain setup
- Function falls back to generating token if not provided (backward compatibility)
