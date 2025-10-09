# Storage Upload Permission Fix Guide

## Problem
Profile image uploads are failing with the error: **"Upload failed: You do not have permission to upload to this location"**

## Root Cause
Firebase Storage security rules haven't been deployed or need updating to allow authenticated users to upload profile images.

---

## Solution Steps

### Step 1: Deploy Updated Storage Rules ✅

The storage rules have been updated with proper permissions. Deploy them now:

```powershell
# Option A: Use the deployment script
./deploy-storage-rules.ps1

# Option B: Manual deployment
firebase deploy --only storage
```

**What was fixed:**
- ✅ Added proper image validation to `/users/{userId}/profile/` path
- ✅ Added contributor application upload permissions
- ✅ Enhanced creator asset upload rules
- ✅ Added file type, size, and name validation

---

### Step 2: Verify Firebase Authentication

Make sure you're logged into Firebase CLI:

```powershell
# Check login status
firebase projects:list

# If not logged in, login now
firebase login

# Verify correct project is selected
firebase use
```

Expected project: `gameplan-787a2`

---

### Step 3: Test Upload After Deployment

1. **Refresh the page** after deploying storage rules
2. **Clear browser cache** (Ctrl + Shift + Delete)
3. **Try uploading a profile image again**

**Supported formats:**
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

**Maximum size:** 10MB

---

## Updated Storage Rules

### User Profile Images
```javascript
match /users/{userId}/profile/{allPaths=**} {
  allow read: if true; // Anyone can view profile images
  allow write: if isOwner(userId) &&
                  isValidImageType() &&
                  isValidFileSize(10) && // 10MB limit
                  isValidFileName();
  allow delete: if isOwner(userId) || isAdmin();
}
```

**Permissions:**
- ✅ Any authenticated user can upload to their own `/users/{their-uid}/profile/` path
- ✅ Images must be JPEG, PNG, GIF, WebP, or SVG
- ✅ File size limit: 10MB
- ✅ File names must be safe (no executable extensions)

### Creator Assets
```javascript
match /creators/{creatorId}/assets/{allPaths=**} {
  allow read: if true; // Public access
  allow write: if isOwner(creatorId) &&
                  isValidImageType() &&
                  isValidFileSize(10);
}
```

### Contributor Applications
```javascript
match /contributor-applications/{allPaths=**} {
  allow read: if isAdmin();
  allow write: if isAuthenticated() &&
                  (isValidImageType() || isValidDocumentType()) &&
                  isValidFileSize(10);
}
```

---

## Troubleshooting

### Issue: Still getting permission errors after deployment

**Check 1: Verify deployment succeeded**
```powershell
firebase deploy --only storage
```
Look for: ✅ `Deploy complete!`

**Check 2: Check Firebase Console**
1. Go to: https://console.firebase.google.com/project/gameplan-787a2/storage/rules
2. Verify the rules show the updated content
3. Check the "Rules" tab shows no errors

**Check 3: Verify user authentication**
Open browser console (F12) and run:
```javascript
firebase.auth().currentUser
```
Should show your user object with a `uid`.

**Check 4: Check the upload path**
The upload path should match the pattern: `users/{your-uid}/profile/avatar_...`

In browser console:
```javascript
console.log('User ID:', firebase.auth().currentUser?.uid)
```

---

### Issue: File validation errors

**Invalid file type:**
- Ensure image is JPEG, PNG, GIF, WebP, or SVG
- Check file extension matches content type
- Some files with wrong extensions may fail

**File too large:**
- Maximum size: 10MB
- Compress large images before uploading
- Use online tools like TinyPNG or Squoosh

**Invalid file name:**
- Avoid special characters
- Avoid executable extensions (.exe, .bat, .js, etc.)
- Use simple names like `profile.jpg`

---

### Issue: Upload starts but fails mid-way

This usually indicates network issues or quota problems:

**Check 1: Network connection**
- Verify stable internet connection
- Try uploading a smaller file first

**Check 2: Storage quota**
- Go to: https://console.firebase.google.com/project/gameplan-787a2/storage
- Check "Usage" tab
- Free tier: 5GB storage, 1GB/day downloads

**Check 3: Browser console errors**
Open console (F12) and look for:
- `storage/unauthorized` - Permission denied
- `storage/quota-exceeded` - Out of space
- `storage/canceled` - Upload was cancelled
- `storage/unknown` - Network or server error

---

## Emergency Workaround (Development Only)

If you need to test immediately and can't deploy rules, temporarily use the test mode rules:

⚠️ **WARNING: Only use for development! Remove before production!**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null; // Any authenticated user
    }
  }
}
```

**To apply test rules:**
1. Go to Firebase Console → Storage → Rules
2. Replace with above
3. Click "Publish"
4. **REMEMBER TO REVERT** by deploying proper rules afterward!

---

## Verification Checklist

After deploying, verify everything works:

- [ ] Run `firebase deploy --only storage`
- [ ] See "Deploy complete!" message
- [ ] Refresh browser page completely
- [ ] Clear browser cache
- [ ] Verify logged in (check top-right of page)
- [ ] Try uploading a small test image (< 1MB)
- [ ] Check browser console for errors (F12)
- [ ] Verify image appears after upload
- [ ] Try uploading to different upload areas (headshot, action photos)

---

## Common Upload Paths

Different parts of the app use different storage paths:

| Location | Path Pattern | Permission |
|----------|-------------|------------|
| **Profile Image** | `users/{uid}/profile/avatar_*` | Owner only |
| **Creator Assets** | `creators/{uid}/assets/*` | Owner only |
| **Applications** | `contributor-applications/*` | Authenticated |
| **Lesson Content** | `lessons/{lessonId}/*` | Creators/Admins |
| **Gear Images** | `gear/{gearId}/*` | Creators/Admins |

---

## Need Help?

If issues persist after following this guide:

1. **Check Firebase Console Logs**
   - Go to: https://console.firebase.google.com/project/gameplan-787a2/storage
   - Click on "Logs" tab
   - Look for recent upload attempts and error messages

2. **Test with Firebase Emulator**
   ```powershell
   firebase emulators:start --only storage
   ```
   This runs storage locally for testing without affecting production.

3. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages during upload
   - Screenshot errors for troubleshooting

4. **Verify Service Account**
   - Ensure `serviceAccountKey.json` exists
   - Check it has proper storage permissions
   - Verify it matches your Firebase project

---

## Files Modified

1. **storage.rules** - Firebase Storage security rules
   - Added validation to user profile uploads
   - Added contributor application path
   - Enhanced creator asset rules

2. **deploy-storage-rules.ps1** - Deployment script
   - Automates deployment process
   - Includes safety checks
   - Provides helpful feedback

---

**Last Updated:** 2025-10-09
**Status:** Ready to Deploy
**Priority:** HIGH - Blocking user uploads
