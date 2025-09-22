# 🚀 Google Cloud Storage Video Pipeline Setup

Complete enterprise-grade video upload, transcoding, and delivery system using Google Cloud Platform.

## 📋 Overview

This setup provides:
- **Direct GCS uploads** with resumable, chunked uploads (10GB+ support)
- **Automatic transcoding** to HLS and multiple qualities via Transcoder API
- **Global CDN delivery** for fast playback worldwide
- **Secure access** with signed URLs and proper authentication
- **Cost optimization** with lifecycle rules and efficient storage

## 🏗️ Architecture

```
Browser → GCS Upload Bucket → Transcoder API → GCS Delivery Bucket → Cloud CDN → Users
```

### Components:
1. **Upload Bucket** (`gameplan-uploads`): Private bucket for raw uploads and transcoder outputs
2. **Delivery Bucket** (`gameplan-delivery`): Private bucket for processed content, fronted by CDN
3. **Transcoder API**: Automatic video processing and rendition generation
4. **Cloud CDN**: Global content delivery network for fast playback
5. **Firebase Auth**: User authentication and access control

## 🔧 Setup Instructions

### 1. Prerequisites

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project gameplan-787a2
```

### 2. Run Infrastructure Setup

```bash
# Make script executable
chmod +x scripts/setup-gcs-infrastructure.sh

# Run setup script
./scripts/setup-gcs-infrastructure.sh
```

This script will:
- ✅ Enable required APIs (Storage, Transcoder, Compute)
- ✅ Create service account with proper permissions
- ✅ Create upload and delivery buckets
- ✅ Configure CORS for browser uploads
- ✅ Set up lifecycle rules for cost optimization
- ✅ Configure Cloud CDN with backend bucket
- ✅ Set up IAM permissions

### 3. Install Dependencies

```bash
npm install @google-cloud/storage @google-cloud/video-transcoder google-auth-library
```

### 4. Environment Configuration

Update your `.env.local`:

```env
# Google Cloud Configuration
NEXT_PUBLIC_GCP_PROJECT_ID=gameplan-787a2
NEXT_PUBLIC_GCS_UPLOAD_BUCKET=gameplan-uploads
NEXT_PUBLIC_GCS_DELIVERY_BUCKET=gameplan-delivery
NEXT_PUBLIC_GCS_REGION=us-central1

# Cloud CDN Configuration
NEXT_PUBLIC_CDN_DOMAIN=delivery.gameplan.app

# Transcoder Webhook Secret (generate a secure random string)
TRANSCODER_WEBHOOK_SECRET=your-secure-webhook-secret-here
```

### 5. Deploy API Endpoints

Your Next.js API routes are ready:
- `/api/video/upload/init` - Initialize resumable upload
- `/api/video/upload/complete` - Complete upload and start transcoding
- `/api/video/webhook` - Transcoder webhook handler
- `/api/video/playback` - Generate signed playback URLs

### 6. Set up Webhook

Configure the Transcoder webhook to call your API:

```bash
# Get your deployed app URL
WEBHOOK_URL="https://your-app.vercel.app/api/video/webhook"

# Configure webhook (this would be done in your transcoder job creation)
```

## 🎯 Usage

### Frontend Integration

```tsx
import GcsVideoUploader from '@/components/GcsVideoUploader'

function VideoUploadPage() {
  return (
    <GcsVideoUploader
      onUploadComplete={(result) => {
        console.log('Video uploaded:', result)
        // Handle successful upload
      }}
      onUploadError={(error) => {
        console.error('Upload failed:', error)
        // Handle upload error
      }}
      maxFileSize={10 * 1024 * 1024 * 1024} // 10GB
    />
  )
}
```

### Direct Service Usage

```tsx
import { gcsUploadService } from '@/lib/gcs-upload'

const uploadVideo = async (file: File) => {
  const videoId = `video_${Date.now()}`

  try {
    await gcsUploadService.startUpload({
      file,
      videoId,
      onProgress: (progress) => console.log(`Upload: ${progress}%`),
      onStateChange: (state) => console.log(`State: ${state}`),
      onSuccess: (result) => console.log('Upload complete:', result)
    })
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### Playback URL Generation

```tsx
const getPlaybackUrls = async (videoId: string) => {
  const response = await fetch(`/api/video/playback?videoId=${videoId}&format=all`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  })

  const { urls } = await response.json()

  // Use HLS for adaptive streaming
  return urls.hls.master
}
```

## 🔄 Workflow

### Upload Process
1. **Initialize**: Frontend calls `/api/video/upload/init` to get resumable upload URL
2. **Upload**: Browser uploads directly to GCS with chunked, resumable uploads
3. **Complete**: Frontend calls `/api/video/upload/complete` to verify and start transcoding
4. **Transcode**: Transcoder API processes video into multiple formats and qualities
5. **Publish**: Webhook copies transcoded files to delivery bucket
6. **Ready**: Video is available for playback via signed URLs

### Playback Process
1. **Request**: Frontend requests playback URLs via `/api/video/playback`
2. **Generate**: Backend creates signed URLs with 15-minute expiration
3. **Deliver**: Content served via Cloud CDN for optimal performance
4. **Stream**: HLS adaptive streaming provides best quality for user's connection

## 💰 Cost Optimization

### Lifecycle Rules
- Raw uploads deleted after 30 days
- Transcoder outputs deleted after 90 days
- Only final delivery files kept long-term

### Storage Classes
- **Standard**: For frequently accessed content
- **Nearline**: For monthly access patterns
- **Coldline**: For archival content

### CDN Benefits
- Reduced egress costs from GCS
- Faster global delivery
- Cache efficiency for popular content

## 🔐 Security Features

### Access Control
- **Private buckets**: No public access
- **Signed URLs**: Time-limited access (15 minutes)
- **Firebase Auth**: User authentication required
- **CORS restrictions**: Limited to your app domains

### Data Protection
- **Uniform bucket-level access**: Consistent permissions
- **IAM roles**: Least privilege access
- **Webhook authentication**: Secure webhook secret
- **Input validation**: File type and size restrictions

## 📊 Monitoring & Analytics

### GCS Metrics
- Upload success/failure rates
- Storage usage and costs
- Transfer volumes

### Transcoder Metrics
- Job success/failure rates
- Processing times
- Output quality metrics

### CDN Metrics
- Cache hit rates
- Global latency
- Bandwidth usage

## 🚨 Troubleshooting

### Common Issues

**Upload fails with CORS error:**
```bash
# Verify CORS configuration
gsutil cors get gs://gameplan-uploads
```

**Transcoding job fails:**
```bash
# Check Transcoder API status
gcloud transcoder jobs list --location=us-central1
```

**Playback URLs not working:**
- Verify signed URL expiration
- Check bucket permissions
- Ensure CDN configuration

### Debug Commands

```bash
# List bucket contents
gsutil ls -r gs://gameplan-uploads/

# Check IAM permissions
gcloud projects get-iam-policy gameplan-787a2

# View Transcoder jobs
gcloud transcoder jobs list --location=us-central1

# Test CDN endpoint
curl -I https://your-cdn-ip/hls/video123/master.m3u8
```

## 🔄 Migration from Firebase Storage

1. **Keep Firebase Auth**: User authentication remains the same
2. **Parallel testing**: Test GCS uploads alongside existing Firebase Storage
3. **Gradual rollout**: Migrate users in batches
4. **Data migration**: Copy existing videos to GCS if needed
5. **Cleanup**: Remove Firebase Storage rules and dependencies

## 🎯 Next Steps

1. **SSL Certificate**: Set up managed SSL for CDN domain
2. **Custom domain**: Configure `delivery.gameplan.app` with proper DNS
3. **DRM (optional)**: Add content protection for premium content
4. **Analytics**: Implement detailed usage tracking
5. **Optimization**: Fine-tune transcoding settings based on usage patterns

---

## 📞 Support

For issues with this setup:
1. Check the troubleshooting section above
2. Review Google Cloud documentation
3. Check application logs for detailed error messages
4. Verify all environment variables are set correctly

**This setup provides enterprise-grade video infrastructure that scales to millions of users with optimal cost and performance.**