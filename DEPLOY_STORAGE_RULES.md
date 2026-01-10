# Deploy Firebase Storage Rules

The storage rules have been updated but need to be deployed to Firebase.

## Quick Deploy

Run this command in your terminal:

```bash
firebase deploy --only storage
```

## Full Deploy (if you want to deploy everything)

```bash
firebase deploy
```

## Verify Deployment

After deploying, you can verify the rules are active by checking the Firebase Console:
1. Go to Firebase Console → Storage → Rules
2. You should see the updated rules

## Troubleshooting

If you get permission errors:
1. Make sure you're logged in: `firebase login`
2. Make sure you're using the correct project: `firebase use --add`
3. Check that `storage.rules` file exists in the project root

## Current Rules Summary

- ✅ Authenticated users can upload to `chat/{companyId}/` folders
- ✅ Authenticated users can upload to `campaigns/{companyId}/` folders  
- ✅ Authenticated users can upload to `users/{userId}/` folders (their own)
- ✅ File size limits: 10MB for chat/campaigns, 5MB for user files
- ✅ All uploads require authentication
