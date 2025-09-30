import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase.client'
import { FirebaseUser, UserRole } from '../types'
import { isJasmineAikey, handleJasmineProvisioning } from './jasmine-client'
import { isKnownCoach, getKnownCoachRole } from './coach-role-mapping'

// Superadmin emails - these users should never have their role auto-corrected
const SUPERADMIN_EMAILS = [
  'llanes.joseph.m@gmail.com'
]

function isSuperadmin(email: string | null): boolean {
  return email ? SUPERADMIN_EMAILS.includes(email.toLowerCase()) : false
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Timestamp | Date
  lastLoginAt: Timestamp | Date
}

/**
 * Ensures a user document exists in Firestore with proper role
 * Call this when user signs in to prevent permission errors
 */
export async function initializeUserDocument(user: FirebaseUser | null, defaultRole: UserRole = 'creator'): Promise<UserProfile> {
  if (!user?.uid) {
    throw new Error('User object is required')
  }

  const userDocRef = doc(db, 'users', user.uid)
  
  try {
    // Check if user document already exists
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      // Update last login time for existing user
      const userData = userDoc.data() as UserProfile

      // Check if this is a known coach who needs role correction
      let roleNeedsUpdate = false
      let correctRole = userData.role

      // Skip auto-corrections for superadmins
      if (!isSuperadmin(user.email)) {
        if (user.email && isKnownCoach(user.email)) {
          const shouldBeRole = getKnownCoachRole(user.email)
          if (shouldBeRole && userData.role !== shouldBeRole) {
            correctRole = shouldBeRole
            roleNeedsUpdate = true
            console.log(`🚨 ROLE CORRECTION: ${user.email} should be ${shouldBeRole}, currently ${userData.role}`)
          }
        }

        // Upgrade 'user' roles to 'creator' for dashboard access
        if (userData.role === 'user') {
          correctRole = 'creator'
          roleNeedsUpdate = true
          console.log(`🔄 ROLE UPGRADE: Upgrading ${user.email} from 'user' to 'creator' for dashboard access`)
        }
      }

      await setDoc(userDocRef, {
        ...userData,
        role: correctRole, // Update role if needed
        lastLoginAt: Timestamp.now(),
        ...(roleNeedsUpdate && {
          roleUpdatedAt: Timestamp.now(),
          roleUpdateReason: 'Known coach auto-correction'
        })
      }, { merge: true })

      if (roleNeedsUpdate) {
        console.log(`✅ ROLE CORRECTED: ${user.email} updated from ${userData.role} to ${correctRole}`)
      }
      console.log('Existing user document updated:', user.uid)

      // Handle Jasmine onboarding if needed
      if (user.email) {
        const jasmineResult = await handleJasmineProvisioning(user.uid, user.email)
        if (jasmineResult.shouldRedirect && jasmineResult.onboardingUrl) {
          console.log('🎯 Jasmine needs onboarding - redirect to:', jasmineResult.onboardingUrl)
          // Note: Redirect will be handled by the calling component
        }
      }

      return { ...userData, role: correctRole }
    } else {
      // Create new user document with comprehensive data
      // Check if this is a superadmin user first
      let initialRole = defaultRole
      if (isSuperadmin(user.email)) {
        initialRole = 'superadmin'
        console.log(`✨ SUPERADMIN DETECTED: Setting ${user.email} to superadmin role`)
      } else if (user.email && isKnownCoach(user.email)) {
        initialRole = getKnownCoachRole(user.email) || defaultRole
        console.log(`✨ KNOWN COACH DETECTED: Setting ${user.email} to ${initialRole} role`)
      }

      const newUserData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        role: initialRole,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }

      await setDoc(userDocRef, newUserData)
      console.log('New user document created:', user.uid, 'with role:', initialRole)

      // Handle Jasmine onboarding for new user
      if (user.email) {
        const jasmineResult = await handleJasmineProvisioning(user.uid, user.email)
        if (jasmineResult.shouldRedirect && jasmineResult.onboardingUrl) {
          console.log('🎯 New Jasmine user needs onboarding - redirect to:', jasmineResult.onboardingUrl)
          // Note: Redirect will be handled by the calling component
        }
      }

      return newUserData
    }
  } catch (error) {
    console.error('Failed to initialize user document:', error)
    
    // Enhanced error context for debugging
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string }
      console.error('Firebase error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        userId: user.uid,
        email: user.email
      })
    }
    
    throw error
  }
}

/**
 * Updates user role (admin function)
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const userDocRef = doc(db, 'users', userId)
  
  try {
    await setDoc(userDocRef, {
      role: newRole,
      lastUpdatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Failed to update user role:', error)
    throw error
  }
}

/**
 * Gets user role safely with fallback
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    return userDoc.exists() ? userDoc.data()?.role || 'user' : 'user'
  } catch (error) {
    console.warn('Failed to get user role, defaulting to user:', error)
    return 'user'
  }
}