# Coach Profile → Browse Coaches Sync System

## Overview
**AIRTIGHT**: All coach profile changes are immediately synced to `creators_index`, which is what Browse Coaches reads from. This ensures any edit a coach makes is instantly visible in Browse Coaches.

## Sync Utility

### `lib/sync-coach-to-browse.ts`
- **Function**: `syncCoachToBrowseCoaches(uid, profileData)`
- **Purpose**: Syncs coach profile data to `creators_index` collection
- **Features**:
  - Reads current profile from `creator_profiles` to get all fields
  - Merges with provided update data
  - Only syncs if profile is active, complete, and approved
  - Removes from `creators_index` if profile is inactive/incomplete
  - Syncs ALL profile fields including images, social links, bio, etc.

## Endpoints That Sync to Browse Coaches

### 1. `POST /api/coach-profile/save`
- **Purpose**: Save/update coach profile information
- **Syncs**: All profile fields (name, bio, location, sport, images, social links, etc.)
- **Method**: Calls `syncCoachToBrowseCoaches()` after saving
- **Atomic**: Uses transaction for profile update

### 2. `POST /api/coach-profile/update-images`
- **Purpose**: Update coach images (headshot, hero, action photos, highlight video)
- **Syncs**: All image fields
- **Method**: Calls `syncCoachToBrowseCoaches()` after updating
- **Atomic**: Uses transaction for image update

### 3. `DELETE /api/coach-profile/delete-gallery-photo`
- **Purpose**: Delete a gallery photo
- **Syncs**: Updated gallery photos array
- **Method**: Calls `syncCoachToBrowseCoaches()` after deletion
- **Atomic**: Uses transaction for deletion

## Data Flow

```
Coach Makes Change
    ↓
API Endpoint (save/update-images/delete-gallery-photo)
    ↓
Update creator_profiles (transaction)
    ↓
Update coach_profiles (transaction)
    ↓
syncCoachToBrowseCoaches()
    ↓
Update creators_index (atomic)
    ↓
Browse Coaches reads from creators_index
    ↓
Change appears immediately!
```

## Fields Synced

All profile fields are synced to `creators_index`:

- **Basic Info**: displayName, name, email, sport, location
- **Bio**: bio, description, tagline, credentials, philosophy
- **Images**: profileImageUrl, headshotUrl, photoURL, heroImageUrl, bannerUrl, coverImageUrl
- **Gallery**: showcasePhoto1, showcasePhoto2, galleryPhotos
- **Social**: instagram, facebook, twitter, linkedin, youtube, socialLinks
- **Metadata**: isActive, profileComplete, status, lastUpdated

## Security

- ✅ Only coach can update their own profile
- ✅ Ownership verification on every update
- ✅ Transaction safety prevents race conditions
- ✅ Email matching for baked profiles

## Error Handling

- Sync failures are logged but don't fail the request
- Profile is saved successfully even if sync fails
- Errors are logged for debugging
- Non-blocking sync (doesn't prevent coach from using app)

## Testing Checklist

- [ ] Coach updates bio → appears in Browse Coaches
- [ ] Coach updates profile image → appears in Browse Coaches
- [ ] Coach adds gallery photo → appears in Browse Coaches
- [ ] Coach deletes gallery photo → removed from Browse Coaches
- [ ] Coach updates social links → appears in Browse Coaches
- [ ] Coach updates location → appears in Browse Coaches
- [ ] Coach updates sport → appears in Browse Coaches
- [ ] Multiple rapid updates → all sync correctly
- [ ] Profile deactivated → removed from Browse Coaches

## Integration Points

1. **Frontend**: Coach profile editor calls `/api/coach-profile/save`
2. **Image Upload**: Calls `/api/coach-profile/update-images`
3. **Photo Deletion**: Calls `/api/coach-profile/delete-gallery-photo`
4. **Browse Coaches**: Reads from `creators_index` collection

## Notes

- Sync happens **immediately** after profile update
- No delay or batch processing
- Changes are **atomic** (all or nothing)
- **Backward compatible** with existing profiles
- Supports both individual fields and nested objects (socialLinks)

