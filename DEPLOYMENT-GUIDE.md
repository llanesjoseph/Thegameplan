# 🚀 Firebase Storage Rules Deployment Guide

## ⚠️ CRITICAL: Deploy Storage Rules to Fix Upload Errors

Your storage rules have been updated to support 10GB uploads, but they need to be deployed to Firebase.

### 🔧 **Quick Fix Steps:**

#### 1. **Login to Firebase CLI:**
```bash
npx firebase login
```

#### 2. **Deploy Storage Rules:**
```bash
npx firebase deploy --only storage
```

#### 3. **Verify Deployment:**
The console should show:
```
✔ Deploy complete!
Project Console: https://console.firebase.google.com/project/gameplan-787a2/overview
```

### 📋 **What These Rules Fix:**

#### **✅ STORAGE PATH SUPPORT:**
- `content/{userId}/` - Direct uploads (current app code)
- `creators/{creatorId}/content/` - Legacy path support

#### **✅ ENTERPRISE FILE LIMITS:**
- **10GB** max file size (up from 1-2GB)
- Support for 30+ minute videos
- Podcast-length content support

#### **✅ SECURITY MAINTAINED:**
- All authentication checks preserved
- Role-based access (creator, admin, superadmin)
- File type validation (video, image, audio, documents)
- Malicious file name blocking

### 🚨 **If You Can't Deploy:**

#### **Alternative: Manual Update via Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com/project/gameplan-787a2)
2. Navigate to **Storage** → **Rules**
3. Replace the rules with the content from `storage.rules` file
4. Click **Publish**

### 🧪 **Test After Deployment:**

1. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
2. **Upload your 2GB video** - should now work
3. **Check console** for "v4.0" indicator
4. **Verify** no 403 storage/unauthorized errors

### 🎯 **Expected Results:**
- ✅ File size check shows `maxSize: 10737418240` (10GB)
- ✅ No more 403 storage errors
- ✅ 2GB video uploads successfully
- ✅ Enterprise upload features enabled

---

## 🔄 **Current Status:**
- ✅ Client-side code deployed (v4.0)
- ✅ Storage rules ready in codebase
- ⏳ **PENDING: Storage rules deployment**

**Deploy the storage rules and your enterprise upload system will be fully operational!**