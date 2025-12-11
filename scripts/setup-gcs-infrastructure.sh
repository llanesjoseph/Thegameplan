#!/bin/bash

# Google Cloud Storage Infrastructure Setup
# Sets up buckets, CORS, lifecycle rules, IAM, and Cloud CDN

set -e

# Configuration
PROJECT_ID="gameplan-787a2"
UPLOAD_BUCKET="gameplan-uploads"
DELIVERY_BUCKET="gameplan-delivery"
REGION="us-central1"
SERVICE_ACCOUNT="video-service@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Setting up GCS infrastructure for project: $PROJECT_ID"

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable storage.googleapis.com
gcloud services enable transcoder.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create service account if it doesn't exist
echo "👤 Setting up service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=$PROJECT_ID >/dev/null 2>&1; then
    gcloud iam service-accounts create video-service \
        --display-name="Video Processing Service" \
        --description="Service account for video upload and transcoding" \
        --project=$PROJECT_ID
fi

# Create buckets
echo "🪣 Creating storage buckets..."

# Upload bucket (private)
if ! gsutil ls -b gs://$UPLOAD_BUCKET >/dev/null 2>&1; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$UPLOAD_BUCKET
    echo "✅ Created upload bucket: $UPLOAD_BUCKET"
else
    echo "ℹ️ Upload bucket already exists: $UPLOAD_BUCKET"
fi

# Delivery bucket (private, CDN-ready)
if ! gsutil ls -b gs://$DELIVERY_BUCKET >/dev/null 2>&1; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$DELIVERY_BUCKET
    echo "✅ Created delivery bucket: $DELIVERY_BUCKET"
else
    echo "ℹ️ Delivery bucket already exists: $DELIVERY_BUCKET"
fi

# Set uniform bucket-level access
echo "🔒 Setting uniform bucket-level access..."
gsutil uniformbucketlevelaccess set on gs://$UPLOAD_BUCKET
gsutil uniformbucketlevelaccess set on gs://$DELIVERY_BUCKET

# Block public access
echo "🚫 Blocking public access..."
gsutil iam ch -d allUsers:objectViewer gs://$UPLOAD_BUCKET
gsutil iam ch -d allAuthenticatedUsers:objectViewer gs://$UPLOAD_BUCKET
gsutil iam ch -d allUsers:objectViewer gs://$DELIVERY_BUCKET
gsutil iam ch -d allAuthenticatedUsers:objectViewer gs://$DELIVERY_BUCKET

# Set up CORS for upload bucket
echo "🌐 Setting up CORS for upload bucket..."
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["https://yourapp.com", "http://localhost:3000", "https://cruciblegameplan.web.app"],
    "method": ["PUT", "POST", "OPTIONS"],
    "responseHeader": ["Authorization", "Content-Type", "Content-Range", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set /tmp/cors.json gs://$UPLOAD_BUCKET
echo "✅ CORS configured for upload bucket"

# Set up lifecycle rules for cost optimization
echo "💰 Setting up lifecycle rules..."
cat > /tmp/lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 30,
        "matchesPrefix": ["raw/"]
      }
    },
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 90,
        "matchesPrefix": ["transcoder-output/"]
      }
    }
  ]
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://$UPLOAD_BUCKET
echo "✅ Lifecycle rules configured"

# Grant IAM permissions to service account
echo "🔐 Setting up IAM permissions..."

# Storage permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectAdmin"

# Transcoder permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/transcoder.admin"

# Firestore permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/datastore.user"

echo "✅ IAM permissions configured"

# Set up Cloud CDN
echo "🌍 Setting up Cloud CDN..."

# Create backend bucket for delivery
if ! gcloud compute backend-buckets describe delivery-backend --global >/dev/null 2>&1; then
    gcloud compute backend-buckets create delivery-backend \
        --gcs-bucket-name=$DELIVERY_BUCKET \
        --enable-cdn \
        --cache-mode=CACHE_ALL_STATIC \
        --default-ttl=3600 \
        --max-ttl=86400 \
        --client-ttl=3600
    echo "✅ Created CDN backend bucket"
else
    echo "ℹ️ CDN backend bucket already exists"
fi

# Create URL map
if ! gcloud compute url-maps describe delivery-map --global >/dev/null 2>&1; then
    gcloud compute url-maps create delivery-map \
        --default-backend-bucket=delivery-backend
    echo "✅ Created URL map"
else
    echo "ℹ️ URL map already exists"
fi

# Create HTTP proxy
if ! gcloud compute target-http-proxies describe delivery-proxy --global >/dev/null 2>&1; then
    gcloud compute target-http-proxies create delivery-proxy \
        --url-map=delivery-map
    echo "✅ Created HTTP proxy"
else
    echo "ℹ️ HTTP proxy already exists"
fi

# Create forwarding rule
if ! gcloud compute forwarding-rules describe delivery-http --global >/dev/null 2>&1; then
    gcloud compute forwarding-rules create delivery-http \
        --global \
        --target-http-proxy=delivery-proxy \
        --ports=80
    echo "✅ Created HTTP forwarding rule"
else
    echo "ℹ️ HTTP forwarding rule already exists"
fi

# Get the external IP
EXTERNAL_IP=$(gcloud compute forwarding-rules describe delivery-http --global --format="value(IPAddress)")
echo "🌐 CDN External IP: $EXTERNAL_IP"

# Cleanup temp files
rm -f /tmp/cors.json /tmp/lifecycle.json

echo ""
echo "🎉 GCS Infrastructure setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "  Project ID: $PROJECT_ID"
echo "  Upload Bucket: gs://$UPLOAD_BUCKET"
echo "  Delivery Bucket: gs://$DELIVERY_BUCKET"
echo "  Service Account: $SERVICE_ACCOUNT"
echo "  CDN IP: $EXTERNAL_IP"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update your DNS to point delivery.gameplan.app to $EXTERNAL_IP"
echo "  2. Set up SSL certificate for HTTPS"
echo "  3. Deploy your Cloud Run service with proper environment variables"
echo "  4. Test upload and transcoding workflow"
echo ""
echo "💡 Environment Variables to set:"
echo "  NEXT_PUBLIC_GCP_PROJECT_ID=$PROJECT_ID"
echo "  NEXT_PUBLIC_GCS_UPLOAD_BUCKET=$UPLOAD_BUCKET"
echo "  NEXT_PUBLIC_GCS_DELIVERY_BUCKET=$DELIVERY_BUCKET"
echo "  NEXT_PUBLIC_CDN_DOMAIN=delivery.gameplan.app"
echo ""