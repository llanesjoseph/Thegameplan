# Firebase Service Account Setup Guide

## Required Roles for the Service Account

Add these roles to your service account in Google Cloud Console:

### Firebase Roles:
- **Firebase Admin** - Full access to Firebase services
- **Firebase Hosting Admin** - Deploy to Firebase Hosting

### Cloud Functions Roles:
- **Cloud Functions Admin** - Deploy and manage Cloud Functions
- **Cloud Functions Developer** - Create and update functions

### Storage and Firestore Roles:
- **Cloud Datastore User** - Access Firestore
- **Storage Admin** - Manage Cloud Storage

### Additional Required Roles:
- **Service Account User** - Use service accounts
- **Project Editor** - General project permissions

## Steps to Complete Setup:

1. **Add Roles**: In Google Cloud Console, go to IAM & Admin > Service Accounts
2. **Click on your service account** (gameplan-deploy-sa or similar)
3. **Click "Add Role"** and add each role listed above
4. **Generate JSON Key**: Click "Keys" tab > "Add Key" > "Create new key" > JSON
5. **Add to GitHub**: Copy the entire JSON content to GitHub Secrets as `GOOGLE_APPLICATION_CREDENTIALS_JSON`

## Verify Setup:
After adding the JSON to GitHub Secrets, the deployment will use permanent authentication that never expires.