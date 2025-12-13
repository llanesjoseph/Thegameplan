# Coach Profile Save Flow - Complete Documentation

## Overview
This document describes the complete save flow for coach profile edits. The save functionality has been completely rewritten to be bulletproof with clear error handling.

## Flow Diagram

```
User clicks "Save Changes"
    ↓
Check if already saving → If yes, ignore
    ↓
Validate user is authenticated
    ↓
Get Firebase authentication token
    ↓
Build request body with all profile fields
    ↓
Send POST request to /api/coach-profile/save
    ↓
Parse response
    ↓
Check for errors
    ↓
Update local state
    ↓
Show success message
    ↓
Reload page to show updated data
```

## Components

### 1. Client-Side (`components/coach/HeroCoachProfile.tsx`)

#### `handleSaveEdits()` Function

**Purpose**: Saves all profile edits to the backend

**Steps**:
1. **Validation**: Checks if save is already in progress, validates user authentication
2. **Token Retrieval**: Gets fresh Firebase ID token
3. **Body Preparation**: Builds request body with all profile fields (name, bio, photos, social links)
4. **API Call**: Sends POST request to `/api/coach-profile/save`
5. **Response Parsing**: Parses JSON response
6. **Error Handling**: Handles all error types with specific messages
7. **Success**: Updates local state, shows success message, reloads page

**Error Handling**:
- Network errors → Clear message about connection
- Authentication errors → Prompt to sign out/in
- Permission errors → Clear denial message
- Validation errors → Specific field errors
- Server errors → Retry suggestion

### 2. Server-Side (`app/api/coach-profile/save/route.ts`)

#### POST Handler

**Purpose**: Validates request and saves profile data to Firestore

**Steps**:
1. **Authentication**: Verifies Firebase ID token
2. **Authorization**: Checks user role (coach/creator/admin)
3. **Validation**: Validates request body structure
4. **Data Processing**: Processes all fields (handles empty strings, arrays, etc.)
5. **Database Write**: Saves to multiple collections:
   - `creator_profiles` (primary)
   - `coach_profiles` (consistency)
   - `users` (backward compatibility)
6. **Sync**: Syncs to `creators_index` for Browse Coaches
7. **Response**: Returns success/error

**Collections Updated**:
- `creator_profiles/{uid}` - Primary profile data
- `coach_profiles/{uid}` - Consistency copy
- `users/{uid}` - Backward compatibility
- `creators_index/{uid}` - Browse Coaches index

### 3. Sync Function (`lib/sync-coach-to-browse.ts`)

**Purpose**: Syncs profile data to Browse Coaches index

**Process**:
1. Reads full profile from `creator_profiles`
2. Merges with provided updates
3. Writes to `creators_index` with all fields
4. Ensures Browse Coaches shows exact same data as coach profile

## Data Flow

### Fields Saved
- `displayName` - Coach's display name
- `bio` - Coach's biography
- `location` - Coach's location
- `sport` - Coach's sport
- `profileImageUrl` - Profile photo URL
- `showcasePhoto1` - First showcase photo
- `showcasePhoto2` - Second showcase photo
- `galleryPhotos` - Array of gallery photo URLs
- `instagram` - Instagram URL
- `facebook` - Facebook URL
- `twitter` - Twitter URL
- `linkedin` - LinkedIn URL
- `youtube` - YouTube URL
- `socialLinks` - Object containing all social links

### Data Consistency
- All fields are saved as strings (empty string if undefined)
- Arrays are validated before saving
- Social links are saved both as individual fields AND in `socialLinks` object
- All collections are updated atomically using Firestore batch writes

## Error Scenarios

### 1. Network Errors
- **Symptom**: Request fails to reach server
- **Message**: "Network error: [details]. Please check your internet connection."
- **Action**: User can retry

### 2. Authentication Errors
- **Symptom**: Token expired or invalid
- **Message**: "Authentication expired. Please sign out and sign back in."
- **Action**: User must re-authenticate

### 3. Permission Errors
- **Symptom**: User doesn't have coach role
- **Message**: "Permission denied. You may not have permission to edit this profile."
- **Action**: Contact admin

### 4. Validation Errors
- **Symptom**: Invalid data format
- **Message**: "Invalid data: [specific error]"
- **Action**: Fix data and retry

### 5. Server Errors
- **Symptom**: Server-side failure
- **Message**: "Server error: [details]. Please try again in a moment."
- **Action**: Wait and retry

## User Experience

### Save Button
- **Location**: Bottom of edit mode in HeroCoachProfile
- **State**: Disabled while saving (shows "Saving..." with spinner)
- **Feedback**: Alert dialogs for success/error
- **Behavior**: Prevents duplicate clicks

### Edit Mode
- **Entry**: Click "Edit Profile" button
- **Exit**: Click "Cancel" or after successful save
- **Persistence**: Edit mode stays open on error (allows retry)

### Visual Feedback
- **Saving**: Button shows spinner and "Saving..." text
- **Success**: Alert dialog "✅ Profile saved successfully!"
- **Error**: Alert dialog "❌ SAVE FAILED" with specific error message

## Testing Checklist

- [ ] Save works with all fields filled
- [ ] Save works with empty fields
- [ ] Save works with only social links
- [ ] Save works with only bio
- [ ] Save works with only name
- [ ] Error handling works for network failures
- [ ] Error handling works for auth failures
- [ ] Error handling works for validation errors
- [ ] Success message appears
- [ ] Page reloads after successful save
- [ ] Changes appear in Browse Coaches
- [ ] Changes persist after page reload

## Debugging

### Client-Side Logs
All logs prefixed with `[SAVE]`:
- `[SAVE] ========== STARTING SAVE ==========`
- `[SAVE] ✅ Got authentication token`
- `[SAVE] ✅ Request body prepared`
- `[SAVE] ✅ Received response, status: 200`
- `[SAVE] ✅ SUCCESS! Saved in [duration]ms`
- `[SAVE] ❌ [Error type]: [Error message]`

### Server-Side Logs
All logs prefixed with `[COACH-PROFILE/SAVE]`:
- `[COACH-PROFILE/SAVE] ========== SAVE REQUEST RECEIVED ==========`
- `[COACH-PROFILE/SAVE] ✅ Authentication successful`
- `[COACH-PROFILE/SAVE] ✅ Batch committed successfully`
- `[COACH-PROFILE/SAVE] ❌ [Error type]: [Error message]`

## Common Issues

### Issue: Save button doesn't work
**Solution**: Check browser console for errors. Ensure user is authenticated.

### Issue: Changes don't appear after save
**Solution**: Page reloads automatically. If not, manually refresh.

### Issue: Error messages not clear
**Solution**: All errors now have specific, actionable messages.

### Issue: Save fails silently
**Solution**: All errors now show alert dialogs with clear messages.

## Future Improvements

1. Replace alert dialogs with toast notifications
2. Add auto-save functionality
3. Add save confirmation for large changes
4. Add undo/redo functionality
5. Add save progress indicator

