# Firebase Storage CORS Configuration

To fix the CORS error when uploading images, you need to configure CORS on your Firebase Storage bucket.

## Quick Fix (Using Firebase CLI)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Set your project**:
   ```bash
   firebase use --add
   ```
   Select your project when prompted.

4. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://craftly-76601.firebasestorage.app
   ```
   
   Replace `craftly-76601.firebasestorage.app` with your actual storage bucket name if different.

## Alternative: Using gsutil directly

If you have Google Cloud SDK installed:

```bash
gsutil cors set cors.json gs://craftly-76601.firebasestorage.app
```

## Verify CORS Configuration

To check if CORS is configured:

```bash
gsutil cors get gs://craftly-76601.firebasestorage.app
```

## Note

The `cors.json` file in the root directory contains the CORS configuration that allows:
- Local development (localhost:3001, 3000, 5173)
- Firebase hosting domains
- All necessary HTTP methods and headers for file uploads

After applying this configuration, restart your development server and try uploading again.
