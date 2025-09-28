import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase.client'
import { FirebaseUser, UserRole } from '../types'
import { isJasmineAikey, handleJasmineProvisioning } from './jasmine-client'

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
export async function initializeUserDocument(user: FirebaseUser | null, defaultRole: UserRole = 'user'): Promise<UserProfile> {
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
      await setDoc(userDocRef, {
        ...userData,
        lastLoginAt: Timestamp.now()
      }, { merge: true })

      console.log('Existing user document updated:', user.uid)

      // Handle Jasmine onboarding if needed
      if (user.email) {
        const jasmineResult = await handleJasmineProvisioning(user.uid, user.email)
        if (jasmineResult.shouldRedirect && jasmineResult.onboardingUrl) {
          console.log('🎯 Jasmine needs onboarding - redirect to:', jasmineResult.onboardingUrl)
          // Note: Redirect will be handled by the calling component
        }
      }

      return userData
    } else {
      // Create new user document with comprehensive data
      // Note: Jasmine's role will be updated during provisioning if applicable
      const newUserData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        role: defaultRole,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }

      await setDoc(userDocRef, newUserData)
      console.log('New user document created:', user.uid)

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