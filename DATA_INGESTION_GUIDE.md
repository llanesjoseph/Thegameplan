# Game Plan Platform - Data Ingestion and Storage Management Guide

## Overview

This guide provides clear lines of data ingestion and storage management for the Game Plan platform. All data flows have been standardized to ensure consistency, security, and scalability.

## Table of Contents

1. [Data Architecture](#data-architecture)
2. [Storage Paths](#storage-paths)
3. [User Data Management](#user-data-management)
4. [Content Upload Flows](#content-upload-flows)
5. [API Validation](#api-validation)
6. [Security Rules](#security-rules)
7. [Best Practices](#best-practices)

## Data Architecture

### Database Collections

All data is organized in Firestore collections with clear separation of concerns:

```typescript
// Primary Collections (lib/data-consistency.ts)
export const COLLECTIONS = {
  USERS: 'users',                    // Primary user profiles
  PROFILES: 'profiles',              // Extended user data
  CREATOR_PROFILES: 'creator_profiles', // Creator-specific data
  CREATOR_PUBLIC: 'creatorPublic',   // Public creator discovery
  AI_SESSIONS: 'ai_sessions',        // AI coaching sessions
  COACHING_REQUESTS: 'coaching_requests', // Coaching requests
  CONTENT: 'content',                // Content metadata
  ANALYTICS: 'analytics'             // Usage analytics
}
```

### User Data Structure

Users have a three-tier data structure for optimal performance and security:

1. **Primary User Profile** (`users/{uid}`)
   - Essential user data, authentication info, role
   - Always required, minimal data for fast access

2. **Extended Profile** (`profiles/{uid}`)
   - Detailed preferences, metrics, achievements
   - Optional data, loaded on demand

3. **Creator Profile** (`creator_profiles/{uid}`)
   - Creator-specific data (only for creators/coaches)
   - Private creator information

4. **Public Creator Profile** (`creatorPublic/{uid}`)
   - Public-facing creator information for discovery
   - Only exists for approved, active creators

## Storage Paths

### Standardized Storage Structure

All file uploads follow standardized paths to ensure clear organization:

```
Firebase Storage Root:
├── users/{uid}/
│   ├── profile/          # Profile images (public read)
│   └── temp/             # Temporary uploads (owner only)
├── creators/{uid}/
│   ├── content/          # Video content, thumbnails
│   └── assets/           # Profile assets, hero images
├── lessons/{lessonId}/   # Educational content
├── gear/{gearId}/        # Equipment photos
├── sessions/{sessionId}/ # Session recordings
└── public/               # Public assets (admin only)
```

### Legacy Path Migration

**IMPORTANT**: The legacy `content/{uid}/` path has been deprecated:

```typescript
// ❌ DEPRECATED - Do not use
const oldPath = `content/${userId}/video.mp4`

// ✅ CURRENT - Use this pattern
const newPath = `creators/${userId}/content/video.mp4`
```

All new uploads automatically use the standardized paths. Legacy files remain accessible but no new uploads are allowed to legacy paths.

## User Data Management

### Creating Users

Use the `UserDataService` for consistent user creation:

```typescript
import { UserDataService } from '@/lib/data-consistency'

await UserDataService.createUser({
  uid: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe',
  role: 'user'
})
```

This creates:
- Primary user document in `users/{uid}`
- Extended profile in `profiles/{uid}`
- Proper timestamps and defaults

### Role Management

Role updates ensure data consistency across collections:

```typescript
// Promotes user to creator and creates creator profile if needed
await UserDataService.updateUserRole(uid, 'creator')
```

### Data Validation

All user data is validated before ingestion:

```typescript
import { DataIngestionValidator } from '@/lib/data-consistency'

const validation = DataIngestionValidator.validateUserInput(userData)
if (!validation.isValid) {
  throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
}

const sanitizedData = DataIngestionValidator.sanitizeUserData(userData)
```

## Content Upload Flows

### Video Upload Process

1. **Initialize Upload** (`/api/video/upload/init`)
   - Validates user permissions (creator+ required)
   - Creates standardized storage path: `creators/{uid}/content/{videoId}/{filename}`
   - Returns signed upload URL

2. **Upload Progress** (Client-side)
   - Direct upload to Google Cloud Storage
   - Real-time progress tracking
   - Automatic retry on failure

3. **Complete Upload** (`/api/video/upload/complete`)
   - Validates upload completion
   - Creates content metadata in Firestore
   - Triggers processing pipeline

### Image Upload Process

1. **Profile Images**
   - Path: `users/{uid}/profile/{filename}`
   - Public read access
   - 10MB size limit

2. **Creator Assets**
   - Path: `creators/{uid}/assets/{filename}`
   - Public read access for discovery
   - 100MB size limit

3. **Content Thumbnails**
   - Path: `creators/{uid}/content/thumb_{timestamp}_{filename}`
   - Authenticated read access
   - 10MB size limit

## API Validation

### Comprehensive Validation Middleware

All API endpoints use the validation middleware (`lib/api-validation.ts`):

```typescript
import { validateRequest, ValidationSchemas } from '@/lib/api-validation'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication, authorization, and data
    const context = await validateRequest(request, {
      requireAuth: true,
      requiredRole: 'creator',
      maxRequestSize: REQUEST_LIMITS.JSON_BODY,
      validation: {
        body: ValidationSchemas.videoUpload
      }
    })

    // Process validated request...
  } catch (error) {
    return formatErrorResponse(error)
  }
}
```

### Validation Schemas

Pre-defined schemas ensure consistent validation:

- `userProfile`: User registration/updates
- `contentItem`: Content creation/updates
- `videoUpload`: Video upload initialization
- `imageUpload`: Image upload validation
- `fileUpload`: Generic file validation

### Security Features

1. **Authentication**: Firebase ID token verification
2. **Authorization**: Role-based access control
3. **Input Validation**: Comprehensive data validation
4. **File Security**: Type and size validation, dangerous file detection
5. **Rate Limiting**: Request frequency control
6. **Audit Logging**: All actions logged for security

## Security Rules

### Firebase Storage Rules

Storage rules enforce access control at the infrastructure level:

```javascript
// Creator content - Authenticated read, owner write
match /creators/{creatorId}/content/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if (isOwner(creatorId) || isCreatorOrHigher()) &&
                  (isValidImageType() || isValidVideoType()) &&
                  isValidFileSize(10000) &&
                  isValidFileName();
}
```

### Key Security Features

1. **Authentication Required**: Most paths require authentication
2. **Role-Based Access**: Different permissions by user role
3. **File Type Validation**: Only allowed file types accepted
4. **Size Limits**: Enforced at storage level
5. **Filename Security**: Prevents malicious filenames

## Best Practices

### Data Consistency

1. **Always Use Services**: Use `UserDataService` for user operations
2. **Batch Operations**: Use Firestore batches for multi-document updates
3. **Validate Input**: Use validation schemas before database writes
4. **Standardized Paths**: Use `StoragePathManager` for consistent paths

### Error Handling

1. **Specific Errors**: Use typed errors (`ValidationError`, `AuthenticationError`)
2. **Audit Logging**: Log all failures for security monitoring
3. **User Feedback**: Provide clear error messages to users
4. **Graceful Degradation**: Handle failures without breaking the app

### Performance

1. **Minimal User Data**: Keep primary user documents small
2. **Lazy Loading**: Load extended profiles on demand
3. **Caching**: Use appropriate caching strategies
4. **Pagination**: Implement pagination for large datasets

### Security

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Input Sanitization**: Always sanitize user input
3. **Rate Limiting**: Implement rate limiting on sensitive endpoints
4. **Regular Audits**: Review audit logs regularly

## Migration Guide

### From Legacy Storage Paths

If you have existing code using legacy paths:

```typescript
// 1. Find legacy path usage
const legacyPath = `content/${userId}/file.mp4`

// 2. Update to standardized path
const standardPath = `creators/${userId}/content/file.mp4`

// 3. Update storage rules (already done)
// 4. Test upload functionality
// 5. Monitor for any remaining legacy usage
```

### Database Schema Updates

When updating user data structures:

1. Use `UserDataService.validateUserIntegrity()` to check consistency
2. Test with `UserDataService.createUser()` for new schema
3. Use batched updates for existing users
4. Monitor error logs during migration

## Troubleshooting

### Common Issues

1. **Storage Permission Denied**
   - Check user authentication
   - Verify user role permissions
   - Ensure correct storage path

2. **Validation Failures**
   - Check validation schema requirements
   - Verify data types and formats
   - Review file size/type limits

3. **Upload Failures**
   - Verify signed URL not expired
   - Check network connectivity
   - Review file size limits

### Debugging

1. **Check Audit Logs**: All operations are logged
2. **Validate Data Integrity**: Use `validateUserIntegrity(uid)`
3. **Test Permissions**: Use security rules simulator
4. **Monitor Storage Usage**: Check for unexpected usage patterns

## Support

For questions about data ingestion and storage:

1. Review this guide first
2. Check audit logs for error details
3. Use validation utilities for debugging
4. Test with minimal data sets
5. Escalate to platform administrators if needed

---

This guide ensures clear, consistent data ingestion across the Game Plan platform. All development should follow these patterns to maintain data integrity and security.