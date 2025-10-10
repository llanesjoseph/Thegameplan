# Video Upload Feature - Complete Testing Guide

## 🚀 Quick Start

### Prerequisites
1. Firebase authentication required
2. Storage rules must be deployed
3. Development server running

### Deploy Storage Rules First
```bash
firebase login --reauth
firebase deploy --only storage
```

---

## 📋 Test Scenarios

### Test 1: URL Upload Method ✅

**Steps:**
1. Navigate to: `http://localhost:3000/dashboard/progress`
2. Click "Request Video Review" card (teal card)
3. Verify modal opens with two tabs: "Share Link" and "Upload File"
4. Ensure "Share Link" is selected by default
5. Fill in form:
   - **Video URL**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - **Title**: `Test Review - URL Method`
   - **Description**: `Testing URL-based video submission`
   - **Specific Questions**: `Does the URL validation work?`
6. Click "Submit for Review"

**Expected Results:**
- ✅ Button changes to "Submitting..." with spinner
- ✅ Success alert appears: "Video review request submitted successfully!"
- ✅ Modal closes automatically
- ✅ Check console for: `✅ Video review request submitted successfully`

**Firestore Verification:**
- Collection: `videoReviewRequests`
- Document should contain:
  ```javascript
  {
    athleteId: "your-uid",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Test Review - URL Method",
    status: "pending",
    createdAt: Timestamp,
    viewedByCoach: false
  }
  ```

---

### Test 2: File Upload Method 📤

**Steps:**
1. Click "Request Video Review" again
2. Click "Upload File" tab
3. Verify upload dropzone appears
4. Click dropzone to select file
5. Choose a video file (MP4, MOV, AVI, or WebM < 500MB)
6. Verify file name and size display correctly
7. Fill in form:
   - **Title**: `Test Review - File Upload`
   - **Description**: `Testing direct file upload to Firebase Storage`
   - **Specific Questions**: `File upload working?`
8. Click "Submit for Review"

**Expected Results:**
- ✅ Button shows "Uploading Video... 0%"
- ✅ Progress bar animates from 0% to 100%
- ✅ Console logs: `📤 Uploading video file to Firebase Storage...`
- ✅ Console logs: `✅ Video uploaded successfully: https://...`
- ✅ Button changes to "Submitting..." after upload
- ✅ Success alert appears
- ✅ Modal closes

**Firebase Storage Verification:**
- Path: `/video-reviews/{your-uid}/{timestamp}_{filename}`
- File should be accessible
- URL should be valid Firebase Storage URL

**Firestore Verification:**
- Collection: `videoReviewRequests`
- Document should contain Firebase Storage URL in `videoUrl` field

---

### Test 3: Validation - File Type ⚠️

**Steps:**
1. Click "Request Video Review"
2. Select "Upload File" tab
3. Try to upload a PDF, image, or text file

**Expected Results:**
- ❌ Error message: "Please select a valid video file (MP4, MOV, AVI, or WebM)"
- ❌ File is rejected
- ❌ Submit button remains disabled

---

### Test 4: Validation - File Size ⚠️

**Steps:**
1. Try to upload a video file larger than 500MB

**Expected Results:**
- ❌ Error message: "Video file must be less than 500MB"
- ❌ File is rejected
- ❌ Submit button remains disabled

---

### Test 5: Validation - Required Fields ⚠️

**Test 5a: Missing Title**
1. Select upload method (URL or File)
2. Fill description but leave title empty
3. Try to submit

**Expected:** Submit button is disabled (grayed out)

**Test 5b: Missing Description**
1. Fill title but leave description empty

**Expected:** Submit button is disabled

**Test 5c: Missing Video**
- URL method: Leave URL field empty
- File method: Don't select a file

**Expected:** Submit button is disabled

---

### Test 6: Security Rules Verification 🔒

**Test 6a: Athlete Can Read Own Videos**
1. Upload a video as athlete
2. Check Firebase Console → Storage
3. Verify you can see file at `/video-reviews/{your-uid}/`

**Test 6b: Coach Can Read All Videos**
1. Sign in as coach account
2. Navigate to Firebase Console → Storage
3. Try accessing `/video-reviews/{athlete-uid}/`
4. Verify coach has read access

**Test 6c: Unauthenticated Users Blocked**
1. Sign out
2. Try to access Storage URL directly
3. Expected: Permission denied

---

## 🔍 Console Monitoring

### Success Messages to Look For:
```
📤 Uploading video file to Firebase Storage...
✅ Video uploaded successfully: https://firebasestorage...
✅ Video review request submitted successfully
```

### Firestore Writes:
```
videoReviewRequests/{docId}
  - athleteId: "abc123"
  - videoUrl: "https://..."
  - status: "pending"
  - createdAt: Timestamp
```

### Audit Logs:
```
audit_logs/{logId}
  - action: "video_review_request_created"
  - athleteId: "abc123"
  - reviewId: "xyz789"
  - timestamp: ISO string
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied" during upload
**Cause:** Storage rules not deployed
**Fix:**
```bash
firebase deploy --only storage
```

### Issue: Upload stuck at 0%
**Possible Causes:**
1. Network connectivity issues
2. File too large (>500MB)
3. Firebase Storage not initialized

**Debug:**
```javascript
// Check in browser console:
console.log(storage)  // Should show Storage instance
```

### Issue: "Invalid video URL format"
**Cause:** URL doesn't start with http:// or https://
**Fix:** Ensure URL is properly formatted

### Issue: Modal doesn't open
**Cause:** User not authenticated
**Fix:** Check auth state in browser DevTools:
```javascript
auth.currentUser  // Should show user object
```

---

## 📊 Performance Benchmarks

### Expected Upload Times:
- 10MB video: ~5-10 seconds
- 50MB video: ~20-40 seconds
- 100MB video: ~40-80 seconds
- 500MB video: ~3-6 minutes

### Expected Response Times:
- API endpoint: <500ms
- Firestore write: <1000ms
- Storage upload: Depends on file size

---

## ✅ Final Verification Checklist

After all tests:

- [ ] URL method creates Firestore document
- [ ] File upload saves to Storage
- [ ] File upload creates Firestore document with Storage URL
- [ ] Progress bar displays during upload
- [ ] Validation prevents invalid files
- [ ] Validation prevents large files
- [ ] Required fields are enforced
- [ ] Success alerts display correctly
- [ ] Modal closes after success
- [ ] Console logs show no errors
- [ ] Firebase Console shows correct data
- [ ] Audit logs created properly
- [ ] Athletes can read own videos
- [ ] Coaches can read all videos
- [ ] Unauthenticated users blocked

---

## 🎯 Test Data Templates

### Test Video URLs:
```
YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Vimeo: https://vimeo.com/148751763
Google Drive: https://drive.google.com/file/d/FILEID/view
```

### Test Titles:
```
"Pitching Mechanics Review - Fastball"
"Batting Stance Analysis"
"Defensive Positioning Feedback"
"Sprint Start Technique"
```

### Test Descriptions:
```
"I'm working on my pitching mechanics and would like feedback on my fastball delivery. Specifically looking at arm angle and follow-through."

"Requesting analysis of my batting stance and swing path. I feel like I'm dropping my shoulder too early."

"Need help with defensive positioning during team drills. Video shows full scrimmage scenario."
```

---

## 🚨 Emergency Rollback

If critical issues found:

1. Revert storage rules:
```bash
git checkout HEAD^ storage.rules
firebase deploy --only storage
```

2. Disable feature in UI:
```typescript
// In app/dashboard/progress/page.tsx
// Comment out video-review card
```

3. Alert users via dashboard banner

---

## 📞 Support

For issues or questions:
- Check browser console for error messages
- Review Firebase Console for data
- Check audit logs for request traces
- Review this guide for common solutions

---

**Last Updated:** 2025-10-09
**Feature Version:** 1.0.0
**Storage Rules Version:** 2.0 (with video-reviews path)
