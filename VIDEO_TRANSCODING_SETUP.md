# Video Transcoding Setup Guide

## Overview

Video transcoding converts uploaded videos into optimized formats for web delivery. This dramatically reduces storage costs, bandwidth usage, and improves user experience.

## Benefits

- **10x smaller file sizes** - 500MB → 50MB
- **Faster loading** - Optimized codecs stream better
- **Adaptive quality** - Multiple resolutions for different devices
- **Auto thumbnails** - Better than client-side generation
- **Privacy** - Strip metadata (location, camera model)

## Implementation: Firebase Cloud Functions + FFmpeg

### Architecture

```
1. Athlete uploads video → Firebase Storage (videos/submissions/...)
2. Cloud Function triggered on finalize
3. Function downloads video
4. FFmpeg transcodes to optimized MP4
5. Upload transcoded version
6. Update Firestore with new URL
7. Delete original (optional)
```

### Step 1: Initialize Cloud Functions (if not already done)

```bash
# In your project root
firebase init functions

# Select:
# - TypeScript (recommended) or JavaScript
# - ESLint (yes)
# - Install dependencies (yes)
```

### Step 2: Install Dependencies

```bash
cd functions
npm install --save @google-cloud/storage fluent-ffmpeg @ffmpeg-installer/ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

### Step 3: Create Video Transcoding Function

Create `functions/src/transcodeVideo.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Configure FFmpeg
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const storage = new Storage();
const db = admin.firestore();

export const transcodeSubmissionVideo = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for Cloud Functions)
    memory: '2GB', // Need more memory for video processing
  })
  .storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process videos in submissions folder
    if (!filePath || !filePath.startsWith('videos/submissions/')) {
      console.log('Not a submission video, skipping');
      return null;
    }

    // Only process video files
    if (!contentType || !contentType.startsWith('video/')) {
      console.log('Not a video file, skipping');
      return null;
    }

    // Don't process already transcoded videos
    if (filePath.includes('_transcoded')) {
      console.log('Already transcoded, skipping');
      return null;
    }

    const bucket = storage.bucket(object.bucket);
    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const transcodedFileName = fileName.replace(/\.[^/.]+$/, '_transcoded.mp4');
    const transcodedFilePath = path.join(os.tmpdir(), transcodedFileName);
    const transcodedStoragePath = filePath.replace(fileName, transcodedFileName);

    try {
      // Download original video
      console.log('Downloading video:', filePath);
      await bucket.file(filePath).download({ destination: tempFilePath });

      // Transcode video
      console.log('Starting transcoding...');
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          // Video codec: H.264 (most compatible)
          .videoCodec('libx264')
          // Audio codec: AAC
          .audioCodec('aac')
          // Preset: faster encoding, good quality
          .outputOptions([
            '-preset fast',
            '-crf 23', // Quality (18-28, lower = better quality)
            '-movflags +faststart', // Enable streaming
            '-vf scale=-2:720', // Scale to 720p height, maintain aspect ratio
            '-r 30', // 30 fps
            '-b:a 128k', // Audio bitrate
          ])
          .output(transcodedFilePath)
          .on('start', (cmd) => {
            console.log('FFmpeg command:', cmd);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Transcoding completed');
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Transcoding error:', err);
            reject(err);
          })
          .run();
      });

      // Upload transcoded video
      console.log('Uploading transcoded video to:', transcodedStoragePath);
      await bucket.upload(transcodedFilePath, {
        destination: transcodedStoragePath,
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            transcoded: 'true',
            originalFile: filePath,
            transcodedAt: new Date().toISOString(),
          },
        },
      });

      // Get download URL
      const [url] = await bucket.file(transcodedStoragePath).getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future expiration
      });

      console.log('Transcoded video uploaded:', url);

      // Update Firestore submission with transcoded URL
      // Extract submission ID from path (videos/submissions/{userId}/{submissionId}/{fileName})
      const pathParts = filePath.split('/');
      if (pathParts.length >= 4) {
        const submissionId = pathParts[3];

        await db.collection('submissions').doc(submissionId).update({
          videoTranscodedUrl: url,
          transcodedAt: admin.firestore.FieldValue.serverTimestamp(),
          transcoded: true,
        });

        console.log('Updated submission:', submissionId);
      }

      // Clean up temp files
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(transcodedFilePath);

      // OPTIONAL: Delete original video to save storage costs
      // Uncomment if you want to keep only transcoded version
      // await bucket.file(filePath).delete();
      // console.log('Deleted original video:', filePath);

      return null;
    } catch (error) {
      console.error('Transcoding failed:', error);

      // Clean up temp files on error
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(transcodedFilePath)) fs.unlinkSync(transcodedFilePath);

      throw error;
    }
  });

// Generate thumbnail from video
export const generateVideoThumbnail = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '1GB',
  })
  .storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process transcoded videos
    if (!filePath || !filePath.includes('_transcoded.mp4')) {
      return null;
    }

    const bucket = storage.bucket(object.bucket);
    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const thumbnailFileName = fileName.replace('.mp4', '_thumb.jpg');
    const thumbnailPath = path.join(os.tmpdir(), thumbnailFileName);
    const thumbnStorailStoragePath = filePath.replace(fileName, thumbnailFileName);

    try {
      // Download video
      await bucket.file(filePath).download({ destination: tempFilePath });

      // Generate thumbnail at 2 seconds
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          .screenshots({
            timestamps: ['2'],
            filename: thumbnailFileName,
            folder: os.tmpdir(),
            size: '640x360',
          })
          .on('end', () => resolve(true))
          .on('error', (err) => reject(err));
      });

      // Upload thumbnail
      await bucket.upload(thumbnailPath, {
        destination: thumbnailStoragePath,
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      // Get thumbnail URL
      const [thumbnailUrl] = await bucket.file(thumbnailStoragePath).getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      // Update Firestore
      const pathParts = filePath.split('/');
      if (pathParts.length >= 4) {
        const submissionId = pathParts[3];
        await db.collection('submissions').doc(submissionId).update({
          thumbnailUrl: thumbnailUrl,
        });
      }

      // Clean up
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(thumbnailPath);

      return null;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw error;
    }
  });
```

### Step 4: Update Submission Type

Add transcoded fields to `types/video-critique.ts`:

```typescript
export interface Submission {
  // ... existing fields

  // Transcoded video
  videoTranscodedUrl?: string;
  transcoded?: boolean;
  transcodedAt?: Date | Timestamp;
}
```

### Step 5: Update Video Player to Use Transcoded Version

Modify `components/video-critique/VideoPlayer.tsx`:

```typescript
export default function VideoPlayer({
  videoUrl,
  videoTranscodedUrl, // Add this prop
  thumbnailUrl,
  // ... other props
}: VideoPlayerProps) {
  // Use transcoded version if available, fallback to original
  const playbackUrl = videoTranscodedUrl || videoUrl;

  return (
    <video src={playbackUrl} poster={thumbnailUrl}>
      {/* ... */}
    </video>
  );
}
```

### Step 6: Deploy Cloud Functions

```bash
# Build TypeScript
cd functions
npm run build

# Deploy functions
firebase deploy --only functions
```

## Cost Estimation

**Before Transcoding:**
- Storage: 500MB video × $0.026/GB/month = $0.013/month per video
- Egress: 500MB × $0.12/GB × 10 views = $0.60
- **Total per video**: ~$0.61/month

**After Transcoding:**
- Storage: 50MB transcoded × $0.026/GB/month = $0.0013/month
- Transcoding: ~$0.015 per minute (one-time)
- Egress: 50MB × $0.12/GB × 10 views = $0.06
- **Total per video**: ~$0.076/month + $0.09 one-time

**Savings: 87% reduction in ongoing costs**

## Alternative: Third-Party Services (Even Easier)

### Option A: Mux (Recommended for Production)

Mux handles transcoding, adaptive streaming, and analytics automatically.

```bash
npm install @mux/mux-node
```

**Pros:**
- Automatic adaptive bitrate streaming
- Built-in video analytics
- Thumbnails, GIFs, clips
- Global CDN
- No Cloud Functions needed

**Cons:**
- $0.0075 per minute of video transcoded
- $0.01 per GB delivered

### Option B: Cloudinary

```bash
npm install cloudinary
```

**Pros:**
- Video + image processing
- Automatic format optimization
- Built-in CDN
- Simple API

**Cons:**
- Free tier limited to 25GB storage

## Recommendation

**For MVP/Testing:** Start without transcoding, add later
**For Production with <1000 videos/month:** Firebase Cloud Functions (above guide)
**For Production with >1000 videos/month:** Use Mux or AWS MediaConvert

## Monitoring

Add to Cloud Functions for monitoring:

```typescript
// Track transcoding metrics
await db.collection('metrics').add({
  type: 'video_transcoding',
  submissionId: submissionId,
  originalSize: object.size,
  transcodedSize: transcodedFileSize,
  processingTime: processingTimeMs,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
});
```

## Next Steps

1. Deploy transcoding function
2. Test with one video upload
3. Monitor Cloud Function logs: `firebase functions:log`
4. Verify transcoded video plays correctly
5. Update UI to show transcoding status
6. Add "Processing..." indicator while transcoding

## Troubleshooting

**Function timeout:** Increase to 540s (9 min max)
**Out of memory:** Increase to 2GB memory
**FFmpeg not found:** Ensure @ffmpeg-installer/ffmpeg installed
**Permission denied:** Verify Cloud Functions service account has Storage Admin role
