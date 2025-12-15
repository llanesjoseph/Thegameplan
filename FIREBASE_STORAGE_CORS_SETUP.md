# Firebase Storage CORS Configuration

## Problem
Images from Firebase Storage are being blocked by CORS policy when loaded from `athleap.ai` domain.

Error message:
```
Access to image at 'https://firebasestorage.googleapis.com/...' from origin 'https://athleap.ai' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

### Option 1: Configure CORS using gsutil (Recommended)

1. Install Google Cloud SDK if not already installed:
   ```bash
   # Download from https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project gameplan-787a2
   ```

3. Apply CORS configuration:
   ```bash
   gsutil cors set firebase-storage-cors.json gs://gameplan-787a2.firebasestorage.app
   ```

4. Verify CORS configuration:
   ```bash
   gsutil cors get gs://gameplan-787a2.firebasestorage.app
   ```

### Option 2: Configure via Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `gameplan-787a2`
3. Go to Storage section
4. Click on Settings/Configuration
5. Look for CORS settings (may require using gcloud CLI)

### Option 3: Use Firebase Storage Rules (Already configured)

The storage rules already allow public read access. The CORS issue is separate from security rules.

## Current CORS Configuration File

The file `firebase-storage-cors.json` contains:
```json
[
  {
    "origin": ["https://athleap.ai", "https://www.athleap.ai", "http://localhost:3000"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

## After Applying CORS

1. Clear browser cache
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Images should now load without CORS errors

## Temporary Workaround

The code now includes error handling that will:
- Log CORS errors to console
- Show "Image unavailable" placeholder for failed images
- Continue displaying other images that load successfully

This allows the page to function even if some images fail to load due to CORS.

