/**
 * Data Model Helpers - Type-safe utilities for AthLeap data model
 *
 * CRITICAL: This file prevents confusion about user types and collections
 *
 * KEY FACTS:
 * - ALL users (athletes, coaches, admins) are in the 'users' collection
 * - Athletes have coachId field pointing to their coach's UID
 * - Coaches have extended profiles in 'creator_profiles' (legacy name)
 * - There is NO separate 'athletes' collection
 */

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase.client'

/**
 * User roles in the system
 */
export type UserRole = 'athlete' | 'coach' | 'assistant_coach' | 'admin' | 'superadmin' | 'creator'

/**
 * Base user document from users collection
 * IMPORTANT: ALL users are in this collection
 */
export interface UserDocument {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole

  // Athlete-specific fields (only present if role === 'athlete')
  coachId?: string
  assignedCoachId?: string

  // Coach-specific fields (optional)
  sport?: string
  yearsExperience?: number

  // Metadata
  createdAt?: string
  lastLoginAt?: string
  onboardingComplete?: boolean
}

/**
 * Extended coach profile from creator_profiles collection
 * LEGACY NAME: Should be called 'coach_profiles' but keeping for backwards compatibility
 */
export interface CoachProfile {
  uid: string
  displayName?: string
  bio?: string
  sport?: string
  yearsExperience?: number
  specialties?: string[]
  certifications?: string[]
  achievements?: string[]
  profileImageUrl?: string
  coverImageUrl?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

/**
 * Check if a user is an athlete
 * CORRECT: Checks users collection with role field
 */
export function isAthlete(user: UserDocument): boolean {
  return user.role === 'athlete'
}

/**
 * Check if a user is a coach (including legacy 'creator' role)
 * CORRECT: Checks users collection with role field
 */
export function isCoach(user: UserDocument): boolean {
  return user.role === 'coach' || user.role === 'creator' || user.role === 'assistant_coach'
}

/**
 * Get a user document from the users collection
 * IMPORTANT: Use this for ALL users (athletes, coaches, everyone)
 *
 * @param uid - User's Firebase Auth UID
 * @returns UserDocument or null if not found
 */
export async function getUserFromUsersCollection(uid: string): Promise<UserDocument | null> {
  try {
    // CRITICAL: ALL users are in 'users' collection
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    return userSnap.data() as UserDocument
  } catch (error) {
    console.error('Error fetching user from users collection:', error)
    return null
  }
}

/**
 * Get an athlete's coach UID
 * CORRECT: Looks at coachId or assignedCoachId in users collection
 *
 * @param athleteUid - Athlete's UID
 * @returns Coach's UID or null if no coach assigned
 */
export async function getAthleteCoachId(athleteUid: string): Promise<string | null> {
  try {
    const athleteUser = await getUserFromUsersCollection(athleteUid)

    if (!athleteUser || !isAthlete(athleteUser)) {
      console.warn(`User ${athleteUid} is not an athlete`)
      return null
    }

    // Check both possible coach ID fields
    return athleteUser.coachId || athleteUser.assignedCoachId || null
  } catch (error) {
    console.error('Error getting athlete coach ID:', error)
    return null
  }
}

/**
 * Get a coach's full profile (combines users + creator_profiles)
 * CORRECT: Fetches from users collection first, then extended profile
 *
 * @param coachUid - Coach's UID
 * @returns Combined coach data or null if not found
 */
export async function getCoachFullProfile(coachUid: string): Promise<{
  user: UserDocument
  profile: CoachProfile | null
} | null> {
  try {
    // Step 1: Get coach from users collection (PRIMARY SOURCE)
    const coachUser = await getUserFromUsersCollection(coachUid)

    if (!coachUser || !isCoach(coachUser)) {
      console.warn(`User ${coachUid} is not a coach`)
      return null
    }

    // Step 2: Try to get extended profile from creator_profiles (OPTIONAL)
    let profileData: CoachProfile | null = null

    try {
      const profileQuery = query(
        collection(db, 'creator_profiles'),
        where('uid', '==', coachUid)
      )
      const profileSnap = await getDocs(profileQuery)

      if (!profileSnap.empty) {
        profileData = profileSnap.docs[0].data() as CoachProfile
      }
    } catch (error) {
      console.warn('Could not fetch creator profile:', error)
    }

    return {
      user: coachUser,
      profile: profileData
    }
  } catch (error) {
    console.error('Error getting coach full profile:', error)
    return null
  }
}

/**
 * Get coach's profile image URL (checks both users and creator_profiles)
 *
 * @param coachUid - Coach's UID
 * @returns Profile image URL or empty string
 */
export async function getCoachProfileImageUrl(coachUid: string): Promise<string> {
  try {
    const fullProfile = await getCoachFullProfile(coachUid)

    if (!fullProfile) {
      return ''
    }

    // Priority: users.photoURL > creator_profiles.profileImageUrl
    return fullProfile.user.photoURL || fullProfile.profile?.profileImageUrl || ''
  } catch (error) {
    console.error('Error getting coach profile image:', error)
    return ''
  }
}

/**
 * Check if an athlete has access to a specific coach's data
 * CORRECT: Checks users.coachId or users.assignedCoachId
 *
 * @param athleteUid - Athlete's UID
 * @param coachUid - Coach's UID
 * @returns true if athlete is assigned to this coach
 */
export async function athleteHasAccessToCoach(athleteUid: string, coachUid: string): Promise<boolean> {
  try {
    const athleteCoachId = await getAthleteCoachId(athleteUid)
    return athleteCoachId === coachUid
  } catch (error) {
    console.error('Error checking athlete access to coach:', error)
    return false
  }
}

/**
 * Get all athletes assigned to a coach
 * CORRECT: Queries users collection with coachId field
 *
 * @param coachUid - Coach's UID
 * @returns Array of athlete UserDocuments
 */
export async function getCoachAthletes(coachUid: string): Promise<UserDocument[]> {
  try {
    // Query users collection for athletes with this coachId
    const athletesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'athlete'),
      where('coachId', '==', coachUid)
    )

    const athletesSnap = await getDocs(athletesQuery)
    return athletesSnap.docs.map(doc => doc.data() as UserDocument)
  } catch (error) {
    console.error('Error getting coach athletes:', error)
    return []
  }
}

/**
 * WRONG PATTERNS - DO NOT USE THESE
 *
 * ❌ const athleteRef = doc(db, 'athletes', uid)  // NO 'athletes' collection!
 * ❌ const coachQuery = query(collection(db, 'creators'), ...)  // Use 'users' not 'creators'
 * ❌ Checking role without loading from users collection
 *
 * CORRECT PATTERNS - USE THESE
 *
 * ✅ const user = await getUserFromUsersCollection(uid)
 * ✅ if (isAthlete(user)) { ... }
 * ✅ const coachId = await getAthleteCoachId(athleteUid)
 * ✅ const fullProfile = await getCoachFullProfile(coachUid)
 */
