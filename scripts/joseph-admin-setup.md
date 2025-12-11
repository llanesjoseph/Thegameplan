# Joseph Admin Setup Instructions

## Method 1: Using Firebase Console (Recommended)

### Step 1: Set Joseph's Role to Superadmin

1. Go to [Firebase Console](https://console.firebase.google.com/project/gameplan-787a2/firestore)
2. Navigate to Firestore Database
3. Go to the `users` collection
4. Find Joseph's document (by his UID - he needs to sign in first to create this)
5. Add/Update these fields:

```json
{
  "role": "superadmin",
  "email": "joseph@crucibleanalytics.dev",
  "lastUpdatedAt": "2024-01-01T00:00:00Z",
  "creatorStatus": "approved",
  "permissions": {
    "canCreateContent": true,
    "canManageContent": true,
    "canAccessAnalytics": true,
    "canReceivePayments": true
  }
}
```

### Step 2: Create Joseph's Profile

1. In Firestore, go to the `profiles` collection
2. Create a new document with Joseph's UID as the document ID
3. Add these fields:

```json
{
  "firstName": "Joseph",
  "lastName": "Admin",
  "email": "joseph@crucibleanalytics.dev",
  "bio": "Platform Administrator and Content Creator",
  "expertise": ["platform-management", "content-strategy", "user-experience"],
  "sports": ["general-athletics"],
  "role": "superadmin",
  "isPublic": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Step 3: Create Joseph's Contributor Application (Pre-approved)

1. In Firestore, go to the `contributorApplications` collection
2. Add a new document with these fields:

```json
{
  "firstName": "Joseph",
  "lastName": "Admin",
  "email": "joseph@crucibleanalytics.dev",
  "primarySport": "other",
  "experience": "admin",
  "experienceDetails": "Platform administrator with comprehensive knowledge of all sports and content creation processes.",
  "specialties": ["platform-management", "content-strategy", "user-experience", "analytics", "system-administration"],
  "contentTypes": ["platform-tutorials", "best-practices", "system-guides", "analytics-insights"],
  "targetAudience": ["creators", "coaches", "administrators", "all-users"],
  "contentDescription": "Educational content focused on platform usage, content creation best practices, and system optimization.",
  "achievements": ["Platform Development", "Content Strategy", "User Experience Design"],
  "certifications": ["Firebase Certified", "Web Development"],
  "status": "approved",
  "userId": "JOSEPH_UID_HERE",
  "userEmail": "joseph@crucibleanalytics.dev",
  "submittedAt": "2024-01-01T00:00:00Z",
  "reviewedAt": "2024-01-01T00:00:00Z",
  "reviewerNotes": "Auto-approved as platform administrator",
  "reviewerId": "JOSEPH_UID_HERE"
}
```

## Method 2: Using Firebase Functions (Alternative)

If you have the admin secret for the Firebase Functions:

1. Make a POST request to your Firebase Function endpoint:

```javascript
fetch('https://us-central1-gameplan-787a2.cloudfunctions.net/setUserRole', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': 'YOUR_ADMIN_SECRET'
  },
  body: JSON.stringify({
    email: 'joseph@crucibleanalytics.dev',
    role: 'superadmin'
  })
})
```

## What This Gives Joseph:

✅ **Superadmin Role**: Full access to all platform features
✅ **Creator Access**: Can create and manage content
✅ **Admin Panel Access**: Can review applications, manage users
✅ **Analytics Access**: Can view all platform analytics
✅ **Pre-approved Profile**: Ready to create content immediately

## Next Steps:

1. Joseph needs to sign in at least once to create his Firebase Auth record
2. Get his UID from the Authentication tab in Firebase Console
3. Replace "JOSEPH_UID_HERE" with his actual UID in the above documents
4. Joseph will have full superadmin access to everything!

## Testing:

After setup, Joseph should be able to:
- Access `/dashboard/admin/creator-applications` 
- Access `/dashboard/creator` (creator dashboard)
- Access all admin features
- Create content without restrictions
