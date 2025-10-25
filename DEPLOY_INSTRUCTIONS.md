# 🚀 Deployment Instructions

## Quick Deployment - Video Upload Feature

### Option 1: Run the Deployment Script (Easiest)

1. **Double-click** the file: `deploy-storage.bat`
2. A browser window will open for Firebase authentication
3. Sign in with your Google account
4. The script will automatically deploy the storage rules
5. Wait for "SUCCESS!" message

---

### Option 2: Manual Deployment

If the script doesn't work, run these commands in your terminal:

```bash
# Step 1: Authenticate with Firebase
firebase login --reauth

# Step 2: Deploy storage rules
firebase deploy --only storage
```

---

## What Gets Deployed

The deployment updates Firebase Storage security rules to enable:

✅ **Video Upload Feature**
- Athletes can upload videos up to 500MB
- Supported formats: MP4, MOV, AVI, WebM
- Files stored at: `/video-reviews/{userId}/`
- Coaches can access all athlete videos
- Athletes can only access their own videos

✅ **Security Features**
- File type validation
- File size limits (500MB for video reviews)
- Filename validation (prevents malicious files)
- Role-based access control

---

## After Deployment

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test the Feature

**Navigate to:** `http://localhost:3000/dashboard/progress`

**Test Video Upload:**
1. Click "Request Video Review" card
2. Try URL method: Paste a YouTube/Vimeo link
3. Try File Upload: Select a video file from your computer
4. Watch the progress bar animate
5. Verify success message appears

**Test Coach Profile:**
1. Look for "Your Coach" section on athlete dashboard
2. Click to view coach profile (read-only)
3. Verify no access to coach tools

**Test Embedded Lessons:**
1. Click "Review Lessons" card
2. Verify no duplicate headers appear

---

## Verification Checklist

After deployment, verify in Firebase Console:

### Storage Rules
- [ ] Navigate to Firebase Console → Storage → Rules
- [ ] Verify rules were updated with deployment timestamp
- [ ] Look for `video-reviews` path in rules

### Test Upload
- [ ] Upload a test video as athlete
- [ ] Check Firebase Console → Storage
- [ ] Verify file appears at `/video-reviews/{userId}/`

### Test Security
- [ ] Try accessing video URL while logged out
- [ ] Should show "Permission denied"
- [ ] Log in as athlete and verify you can access your own videos

---

## Troubleshooting

### "Authentication Error"
**Solution:** Run `firebase login --reauth` and sign in again

### "Permission denied" during upload
**Cause:** Storage rules not deployed
**Solution:** Run deployment script again

### Upload stuck at 0%
**Possible Causes:**
- Check internet connection
- Verify file size < 500MB
- Check browser console for errors

### Can't access Firebase Console
**URL:** https://console.firebase.google.com/project/gameplan-787a2/storage

---

## Firebase Project Info

**Project ID:** `gameplan-787a2`
**Storage Bucket:** `gameplan-787a2.appspot.com`

---

## Support Files

- `VIDEO_UPLOAD_TEST_GUIDE.md` - Comprehensive testing guide
- `storage.rules` - Security rules file
- `deploy-storage.bat` - Automated deployment script

---

**Need Help?**
Check the browser console (F12) for detailed error messages.
