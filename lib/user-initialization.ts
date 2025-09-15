import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase.client'
import { FirebaseUser, UserRole } from '../types'

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
        lastLoginAt: serverTimestamp()
      }, { merge: true })
      
      console.log('Existing user document updated:', user.uid)
      return userData
    } else {
      // Create new user document with comprehensive data
      const newUserData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        role: defaultRole,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }
      
      await setDoc(userDocRef, newUserData)
      console.log('New user document created:', user.uid)
      
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