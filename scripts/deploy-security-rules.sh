#!/bin/bash

# Game Plan Platform - Security Rules Deployment Script
# Deploys production-ready Firestore and Storage security rules

set -e  # Exit on any error

echo "🛡️  Game Plan Platform - Security Rules Deployment"
echo "=================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "   firebase login"
    exit 1
fi

# Set project ID
PROJECT_ID="gameplan-787a2"
echo "📋 Using Firebase project: $PROJECT_ID"

# Backup current rules
echo "📦 Creating backup of current rules..."
if [ -f "firestore.rules" ]; then
    cp firestore.rules firestore.rules.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Firestore rules backed up"
fi

if [ -f "storage.rules" ]; then
    cp storage.rules storage.rules.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Storage rules backed up"
fi

# Deploy Firestore security rules
echo "🔥 Deploying Firestore security rules..."
if [ -f "firestore-production.rules" ]; then
    cp firestore-production.rules firestore.rules
    firebase deploy --only firestore:rules --project $PROJECT_ID
    echo "✅ Firestore security rules deployed successfully"
else
    echo "❌ firestore-production.rules not found"
    exit 1
fi

# Deploy Storage security rules
echo "📁 Deploying Storage security rules..."
if [ -f "storage-production.rules" ]; then
    cp storage-production.rules storage.rules
    firebase deploy --only storage --project $PROJECT_ID
    echo "✅ Storage security rules deployed successfully"
else
    echo "❌ storage-production.rules not found"
    exit 1
fi

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
if [ -f "firestore.indexes.json" ]; then
    firebase deploy --only firestore:indexes --project $PROJECT_ID
    echo "✅ Firestore indexes deployed successfully"
else
    echo "⚠️  firestore.indexes.json not found - skipping indexes deployment"
fi

# Test deployment
echo "🧪 Testing security rules deployment..."
echo "   - Checking Firestore rules..."
firebase firestore:rules:test --project $PROJECT_ID || echo "⚠️  Firestore rules test failed"

echo "   - Checking Storage rules..."
firebase storage:rules:test --project $PROJECT_ID || echo "⚠️  Storage rules test failed"

echo ""
echo "🎉 Security rules deployment completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Test user authentication and authorization"
echo "   2. Verify role-based access control works correctly"
echo "   3. Test file upload permissions and size limits"
echo "   4. Monitor security logs for any issues"
echo "   5. Update your application to handle new security restrictions"
echo ""
echo "⚠️  Important: Your old open security rules have been replaced!"
echo "   Make sure your application works with the new restrictive rules."
echo "   Check the backup files if you need to revert."
echo ""
echo "🔍 To monitor security events:"
echo "   firebase functions:log --project $PROJECT_ID"
echo ""
