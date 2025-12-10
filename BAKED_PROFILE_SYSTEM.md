# Baked Profile System

## Overview

The Baked Profile System allows admins to create pre-made, fully-configured coach profiles that automatically transfer ownership to a specific user when they sign in for the first time. This is perfect for creating profiles for featured coaches like Jasmine before they sign up.

## How It Works

1. **Admin creates a baked profile** - An admin creates a complete profile with all content (photos, bio, gear, etc.)
2. **Profile waits for user** - The profile is stored with a `pending` status, linked to the user's email
3. **User signs in** - When the designated user signs in, the system automatically detects the baked profile
4. **Ownership transfers** - The profile is transferred to the user's UID and they take full ownership
5. **User can edit** - The user can now edit their profile normally (name, photos, gear, etc.)

## Creating a Baked Profile

### Option 1: Using the API (Recommended)

```bash
POST /api/admin/create-baked-profile
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "targetEmail": "jasmine.aikey@stanford.edu",
  "displayName": "Jasmine Aikey",
  "firstName": "Jasmine",
  "lastName": "Aikey",
  "sport": "Soccer",
  "tagline": "Elite soccer player at Stanford University.",
  "credentials": "PAC-12 Champion and Midfielder of the Year",
  "bio": "Stanford University soccer player...",
  "philosophy": "I believe in developing the complete player...",
  "specialties": ["Midfield Play", "Ball Control", "Tactical Awareness"],
  "achievements": ["PAC-12 Champion", "Midfielder of the Year"],
  "experience": "4+ years collegiate soccer",
  "headshotUrl": "https://...",
  "heroImageUrl": "https://...",
  "actionPhotos": ["https://...", "https://..."],
  "highlightVideo": "https://...",
  "socialLinks": {
    "instagram": "https://instagram.com/jasmineaikey",
    "facebook": "https://facebook.com/jasmineaikey"
  },
  "profileCompleteness": 100,
  "isVerified": true,
  "isPlatformCoach": true
}
```

### Option 2: Using the Script

```bash
node scripts/create-jasmine-baked-profile.js
```

Edit the script to customize the profile data, then run it.

## Profile Transfer Process

When a user signs in, the system:

1. Checks if there's a baked profile waiting for their email
2. If found, transfers the profile to their UID
3. Updates all collections (`creator_profiles`, `coach_profiles`, `users`)
4. Marks the baked profile as `transferred`
5. User now owns the profile and can edit it

## Managing Baked Profiles

### List All Baked Profiles

```bash
GET /api/admin/list-baked-profiles
Authorization: Bearer <admin_token>
```

### Cancel a Baked Profile

Use the `cancelBakedProfile` function in `lib/baked-profile-manager.ts` or create an API endpoint.

## Profile Fields

All standard coach profile fields are supported:

- **Basic Info**: `displayName`, `firstName`, `lastName`, `email`, `sport`
- **Content**: `bio`, `tagline`, `credentials`, `philosophy`, `experience`
- **Lists**: `specialties[]`, `achievements[]`
- **Media**: `headshotUrl`, `heroImageUrl`, `actionPhotos[]`, `highlightVideo`
- **Social**: `socialLinks{}` (instagram, facebook, twitter, linkedin, youtube)
- **Metadata**: `profileCompleteness`, `isVerified`, `isPlatformCoach`

## Important Notes

1. **Email Matching**: The system matches baked profiles by email (case-insensitive)
2. **One-Time Transfer**: Each baked profile can only be transferred once
3. **User Can Edit**: After transfer, the user has full control and can edit everything
4. **No Duplicates**: If a user already has a profile, the baked profile won't overwrite it unless they don't have `profileProvisioned` set

## Example: Creating Jasmine's Profile

```javascript
// Admin creates profile via API
const response = await fetch('/api/admin/create-baked-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetEmail: 'jasmine.aikey@stanford.edu',
    displayName: 'Jasmine Aikey',
    firstName: 'Jasmine',
    lastName: 'Aikey',
    sport: 'Soccer',
    // ... all other profile data
  })
})

// When Jasmine signs in, the profile automatically transfers to her account
// She can then edit her name, photos, gear, etc. as needed
```

## Troubleshooting

- **Profile not transferring**: Check that the email matches exactly (case-insensitive)
- **User already has profile**: The system won't overwrite existing profiles unless `profileProvisioned` is false
- **Transfer failed**: Check server logs for errors in the transfer process

## Security

- Only admins can create baked profiles
- Profile transfer happens automatically on sign-in (no user action needed)
- Transferred profiles are marked to prevent duplicate transfers

