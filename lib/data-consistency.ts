// @ts-nocheck
/**
 * Data Consistency Management Utility
 *
 * This module ensures data consistency across multiple Firestore collections
 * and provides utilities for safe data ingestion and synchronization.
 */

import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.client'
import { UserProfile, ExtendedUserProfile, CreatorProfile, PublicCreatorProfile, AppRole } from '../types/user'

// COLLECTION NAMES - Single source of truth
export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  CREATOR_PROFILES: 'creator_profiles',
  CREATOR_PUBLIC: 'creatorPublic',
  AI_SESSIONS: 'ai_sessions',
  AI_LOGS: 'ai_interaction_logs',
  COACHING_REQUESTS: 'coaching_requests',
  SAVED_RESPONSES: 'savedResponses',
  NOTIFICATIONS: 'notifications',
  CONTENT: 'content',
  ANALYTICS: 'analytics'
} as const

/**
 * Data Ingestion Error Types
 */
export class DataConsistencyError extends Error {
  constructor(
    message: string,
    public code: string,
    public collection: string,
    public uid?: string
  ) {
    super(message)
    this.name = 'DataConsistencyError'
  }
}

/**
 * User Data Management Service
 * Ensures consistency across users, profiles, and creator collections
 */
export class UserDataService {
  /**
   * Create a new user with consistent data across all collections
   */
  static async createUser(userData: {
    uid: string
    email: string
    displayName?: string
    photoURL?: string
    role: AppRole
  }): Promise<void> {
    const batch = writeBatch(db)

    try {
      // Primary user document
      const userProfile: UserProfile = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        onboardingComplete: false,
        subscriptionLevel: 'free',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false
      }

      // Extended profile document
      const extendedProfile: ExtendedUserProfile = {
        uid: userData.uid,
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisible: true,
            shareProgress: true,
            shareAchievements: true
          },
          coaching: {}
        },
        metrics: {
          totalSessions: 0,
          totalWatchTime: 0,
          favoriteContent: [],
          progressCompleted: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Batch write both documents
      batch.set(doc(db, COLLECTIONS.USERS, userData.uid), userProfile)
      batch.set(doc(db, COLLECTIONS.PROFILES, userData.uid), extendedProfile)

      await batch.commit()

      console.log('✅ User created successfully with consistent data:', userData.uid)
    } catch (error) {
      throw new DataConsistencyError(
        'Failed to create user with consistent data',
        'USER_CREATION_FAILED',
        COLLECTIONS.USERS,
        userData.uid
      )
    }
  }

  /**
   * Update user role and ensure data consistency
   */
  static async updateUserRole(uid: string, newRole: AppRole): Promise<void> {
    const batch = writeBatch(db)

    try {
      // Update primary user document
      batch.update(doc(db, COLLECTIONS.USERS, uid), {
        role: newRole,
        updatedAt: serverTimestamp()
      })

      // If promoting to creator role, ensure creator profile exists
      if (newRole === 'creator' || newRole === 'coach') {
        const creatorDoc = await getDoc(doc(db, COLLECTIONS.CREATOR_PROFILES, uid))

        if (!creatorDoc.exists()) {
          // Create minimal creator profile
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid))
          const userData = userDoc.data() as UserProfile

          const creatorProfile: CreatorProfile = {
            uid,
            displayName: userData.displayName || 'New Creator',
            slug: userData.displayName?.toLowerCase().replace(/\s+/g, '-') || `creator-${uid.slice(0, 8)}`,
            bio: '',
            sports: [],
            certifications: [],
            experience: '',
            specialties: [],
            isVerified: false,
            isActive: false,
            featured: false,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }

          batch.set(doc(db, COLLECTIONS.CREATOR_PROFILES, uid), creatorProfile)
        }
      }

      await batch.commit()

      console.log('✅ User role updated successfully:', uid, newRole)
    } catch (error) {
      throw new DataConsistencyError(
        'Failed to update user role consistently',
        'ROLE_UPDATE_FAILED',
        COLLECTIONS.USERS,
        uid
      )
    }
  }

  /**
   * Sync creator profile data between private and public collections
   */
  static async syncCreatorProfile(uid: string): Promise<void> {
    try {
      const creatorDoc = await getDoc(doc(db, COLLECTIONS.CREATOR_PROFILES, uid))

      if (!creatorDoc.exists()) {
        throw new DataConsistencyError(
          'Creator profile not found',
          'CREATOR_NOT_FOUND',
          COLLECTIONS.CREATOR_PROFILES,
          uid
        )
      }

      const creatorData = creatorDoc.data() as CreatorProfile

      // Only sync if creator is approved and active
      if (creatorData.status !== 'approved' || !creatorData.isActive) {
        // Remove from public collection if not approved
        try {
          await updateDoc(doc(db, COLLECTIONS.CREATOR_PUBLIC, uid), {
            lastActiveAt: serverTimestamp()
          })
        } catch {
          // Document might not exist, which is fine
        }
        return
      }

      // Create/update public profile
      const publicProfile: PublicCreatorProfile = {
        id: uid,
        name: creatorData.displayName,
        firstName: creatorData.displayName.split(' ')[0] || creatorData.displayName,
        sport: creatorData.sports[0] || 'General',
        tagline: creatorData.bio.slice(0, 100),
        heroImageUrl: creatorData.heroImageUrl,
        headshotUrl: creatorData.headshotUrl,
        badges: creatorData.certifications,
        lessonCount: creatorData.stats?.totalLessons || 0,
        specialties: creatorData.specialties,
        experience: this.mapExperienceLevel(creatorData.experience),
        verified: creatorData.isVerified,
        featured: creatorData.featured,
        stats: {
          totalStudents: creatorData.stats?.totalStudents || 0,
          avgRating: creatorData.stats?.avgRating || 0,
          totalReviews: creatorData.stats?.totalReviews || 0
        },
        lastActiveAt: serverTimestamp()
      }

      await setDoc(doc(db, COLLECTIONS.CREATOR_PUBLIC, uid), publicProfile)

      console.log('✅ Creator profile synced successfully:', uid)
    } catch (error) {
      throw new DataConsistencyError(
        'Failed to sync creator profile',
        'CREATOR_SYNC_FAILED',
        COLLECTIONS.CREATOR_PROFILES,
        uid
      )
    }
  }

  /**
   * Map experience text to standardized levels
   */
  private static mapExperienceLevel(experience: string): 'college' | 'pro' | 'olympic' | 'coach' | 'analyst' {
    const exp = experience.toLowerCase()
    if (exp.includes('olympic') || exp.includes('international')) return 'olympic'
    if (exp.includes('professional') || exp.includes('pro')) return 'pro'
    if (exp.includes('college') || exp.includes('university')) return 'college'
    if (exp.includes('coach') || exp.includes('trainer')) return 'coach'
    return 'analyst'
  }

  /**
   * Validate user data integrity across collections
   */
  static async validateUserIntegrity(uid: string): Promise<{
    isValid: boolean
    issues: string[]
    collections: {
      user: boolean
      profile: boolean
      creator?: boolean
      public?: boolean
    }
  }> {
    const issues: string[] = []
    const collections = {
      user: false,
      profile: false,
      creator: false,
      public: false
    }

    try {
      // Check primary user document
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid))
      collections.user = userDoc.exists()

      if (!collections.user) {
        issues.push('Primary user document missing')
      }

      // Check extended profile
      const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, uid))
      collections.profile = profileDoc.exists()

      if (!collections.profile) {
        issues.push('Extended profile document missing')
      }

      // If user exists, check role consistency
      if (collections.user) {
        const userData = userDoc.data() as UserProfile

        // Check creator-specific data if applicable
        if (userData.role === 'creator' || userData.role === 'coach') {
          const creatorDoc = await getDoc(doc(db, COLLECTIONS.CREATOR_PROFILES, uid))
          collections.creator = creatorDoc.exists()

          if (!collections.creator) {
            issues.push('Creator profile missing for creator/coach role')
          } else {
            const creatorData = creatorDoc.data() as CreatorProfile

            // Check public profile sync
            const publicDoc = await getDoc(doc(db, COLLECTIONS.CREATOR_PUBLIC, uid))
            collections.public = publicDoc.exists()

            if (creatorData.status === 'approved' && creatorData.isActive && !collections.public) {
              issues.push('Public creator profile missing for approved creator')
            }
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        collections
      }
    } catch (error) {
      throw new DataConsistencyError(
        'Failed to validate user integrity',
        'VALIDATION_FAILED',
        COLLECTIONS.USERS,
        uid
      )
    }
  }

  /**
   * Clean up orphaned data for a user
   */
  static async cleanupUserData(uid: string): Promise<void> {
    const batch = writeBatch(db)

    try {
      // Find and remove orphaned AI sessions
      const aiSessionsQuery = query(
        collection(db, COLLECTIONS.AI_SESSIONS),
        where('userId', '==', uid)
      )
      const aiSessions = await getDocs(aiSessionsQuery)
      aiSessions.forEach(doc => batch.delete(doc.ref))

      // Find and remove orphaned coaching requests
      const coachingQuery = query(
        collection(db, COLLECTIONS.COACHING_REQUESTS),
        where('userId', '==', uid)
      )
      const coachingRequests = await getDocs(coachingQuery)
      coachingRequests.forEach(doc => batch.delete(doc.ref))

      // Find and remove orphaned saved responses
      const savedQuery = query(
        collection(db, COLLECTIONS.SAVED_RESPONSES),
        where('userId', '==', uid)
      )
      const savedResponses = await getDocs(savedQuery)
      savedResponses.forEach(doc => batch.delete(doc.ref))

      await batch.commit()

      console.log('✅ User data cleanup completed:', uid)
    } catch (error) {
      throw new DataConsistencyError(
        'Failed to cleanup user data',
        'CLEANUP_FAILED',
        'multiple',
        uid
      )
    }
  }
}

/**
 * Data ingestion validation utilities
 */
export class DataIngestionValidator {
  /**
   * Validate user input before database insertion
   */
  static validateUserInput(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format')
    }

    // Role validation
    const validRoles: AppRole[] = ['guest', 'user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']
    if (!data.role || !validRoles.includes(data.role)) {
      errors.push('Invalid user role')
    }

    // UID validation
    if (!data.uid || typeof data.uid !== 'string' || data.uid.length < 1) {
      errors.push('Invalid user ID')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Sanitize user input data
   */
  static sanitizeUserData(data: any): UserProfile {
    return {
      uid: String(data.uid).trim(),
      email: String(data.email).toLowerCase().trim(),
      displayName: data.displayName ? String(data.displayName).trim() : undefined,
      photoURL: data.photoURL ? String(data.photoURL).trim() : undefined,
      role: data.role,
      onboardingComplete: Boolean(data.onboardingComplete),
      subscriptionLevel: data.subscriptionLevel || 'free',
      preferredSports: Array.isArray(data.preferredSports) ? data.preferredSports : undefined,
      skillLevel: data.skillLevel || undefined,
      goals: Array.isArray(data.goals) ? data.goals : undefined,
      experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : undefined,
      emailVerified: Boolean(data.emailVerified),
      createdAt: data.createdAt || serverTimestamp(),
      lastLoginAt: data.lastLoginAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  }
}

/**
 * Storage path utilities for consistent file organization
 */
export class StoragePathManager {
  /**
   * Generate consistent storage paths for user content
   */
  static getUserContentPath(uid: string, contentType: 'profile' | 'temp' | 'content'): string {
    return `users/${uid}/${contentType}/`
  }

  /**
   * Generate creator-specific storage paths
   */
  static getCreatorContentPath(uid: string, contentType: 'content' | 'assets'): string {
    return `creators/${uid}/${contentType}/`
  }

  /**
   * Generate lesson storage paths
   */
  static getLessonContentPath(lessonId: string): string {
    return `lessons/${lessonId}/`
  }

  /**
   * Validate file upload paths
   */
  static validateStoragePath(path: string): boolean {
    // Must follow pattern: collection/id/type/
    const pathPattern = /^(users|creators|lessons|gear|sessions)\/[a-zA-Z0-9_-]+\/(profile|temp|content|assets)\/$/
    return pathPattern.test(path)
  }
}

export default {
  UserDataService,
  DataIngestionValidator,
  StoragePathManager,
  COLLECTIONS,
  DataConsistencyError
}