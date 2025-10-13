import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from './firebase.client'
import { FirebaseUser, UserRole } from '../types'
import { isJasmineAikey, handleJasmineProvisioning } from './jasmine-client'
import { isKnownCoach, getKnownCoachRole } from './coach-role-mapping'

// Superadmin emails - these users should never have their role auto-corrected
const SUPERADMIN_EMAILS = [
  'joseph@crucibleanalytics.dev'
]

function isSuperadmin(email: string | null): boolean {
  return email ? SUPERADMIN_EMAILS.includes(email.toLowerCase()) : false
}

/**
 * Check if user has a pending invitation and return the role from invitation
 */
async function checkPendingInvitation(email: string | null): Promise<UserRole | null> {
  if (!email) return null

  try {
    // CRITICAL: Check admin invitations FIRST (highest priority)
    const adminInvitationsRef = collection(db, 'admin_invitations')
    const adminQuery = query(
      adminInvitationsRef,
      where('recipientEmail', '==', email.toLowerCase()),
      limit(1)
    )

    const adminSnapshot = await getDocs(adminQuery)

    if (!adminSnapshot.empty) {
      const invitationData = adminSnapshot.docs[0].data()
      const role = invitationData.role as UserRole
      console.log(`🎯 Found ADMIN invitation for ${email} with role: ${role}`)
      return role
    }

    // Query regular invitations collection for this email
    // Check BOTH used and unused invitations to respect role during sign-in
    const invitationsRef = collection(db, 'invitations')

    // Try coachEmail field first (for coach invitations)
    const coachQuery = query(
      invitationsRef,
      where('coachEmail', '==', email.toLowerCase()),
      limit(1)
    )

    const coachSnapshot = await getDocs(coachQuery)

    if (!coachSnapshot.empty) {
      const invitationData = coachSnapshot.docs[0].data()
      const role = invitationData.role as UserRole
      console.log(`🎯 Found invitation for ${email} with role: ${role} (coachEmail field)`)
      return role
    }

    // Try athleteEmail field (for athlete invitations)
    const athleteQuery = query(
      invitationsRef,
      where('athleteEmail', '==', email.toLowerCase()),
      limit(1)
    )

    const athleteSnapshot = await getDocs(athleteQuery)

    if (!athleteSnapshot.empty) {
      const invitationData = athleteSnapshot.docs[0].data()
      const role = invitationData.role as UserRole
      console.log(`🎯 Found invitation for ${email} with role: ${role} (athleteEmail field)`)
      return role
    }

    return null
  } catch (error) {
    console.error('Error checking pending invitation:', error)
    return null
  }
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Timestamp | Date
  lastLoginAt: Timestamp | Date
  manuallySetRole?: boolean
  roleProtected?: boolean
  roleSource?: string
}

/**
 * Ensures a user document exists in Firestore with proper role
 * Call this when user signs in to prevent permission errors
 */
export async function initializeUserDocument(user: FirebaseUser | null, defaultRole: UserRole = 'coach'): Promise<UserProfile> {
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

      // CRITICAL: Check if role is manually set and protected from auto-corrections
      const userDataAny = userData as any
      const isRoleProtected = userDataAny.manuallySetRole === true || userDataAny.roleProtected === true
      const invitationRole = userDataAny.invitationRole as UserRole | undefined

      // BULLETPROOF RULE #1: If user has invitationRole field, ALWAYS enforce it
      if (invitationRole && userData.role !== invitationRole) {
        console.log(`🎯 INVITATION ROLE ENFORCEMENT: ${user.email} should be '${invitationRole}' (from invitation), currently '${userData.role}' - correcting now!`)
        try {
          await setDoc(userDocRef, {
            ...userData,
            role: invitationRole,
            roleUpdatedAt: Timestamp.now(),
            roleUpdateReason: 'Enforced from invitation',
            manuallySetRole: true,
            roleProtected: true
          }, { merge: true })
          console.log(`✅ ROLE ENFORCED: ${user.email} corrected to ${invitationRole} from invitation`)
          return { ...userData, role: invitationRole }
        } catch (error) {
          console.error('Failed to enforce invitation role:', error)
        }
      }

      // BULLETPROOF RULE #2: Protected roles cannot be auto-corrected
      if (isRoleProtected) {
        console.log(`🔒 ROLE PROTECTED: ${user.email} has manually set role '${userData.role}' - no auto-corrections will be applied`)
        return userData
      }

      // BULLETPROOF RULE #3: Athlete, creator, coach, admin, and superadmin roles are ALWAYS protected
      if (userData.role === 'athlete' || userData.role === 'creator' || userData.role === 'coach' || userData.role === 'admin' || userData.role === 'superadmin') {
        console.log(`🛡️ ROLE PROTECTED: ${user.email} role '${userData.role}' - no auto-corrections applied`)
        return userData
      }

      // Check if this is a known coach who needs role correction
      let roleNeedsUpdate = false
      let correctRole: UserRole = userData.role

      // Only apply auto-corrections to 'user' role and for known coaches
      if (!isSuperadmin(user.email)) {
        // PRIORITY 1: Check if known coach and needs correction
        if (user.email && isKnownCoach(user.email)) {
          const shouldBeRole = getKnownCoachRole(user.email)
          if (shouldBeRole && userData.role !== shouldBeRole) {
            correctRole = shouldBeRole
            roleNeedsUpdate = true
            console.log(`🚨 ROLE CORRECTION: ${user.email} should be ${shouldBeRole}, currently ${userData.role}`)
          }
        }
        // PRIORITY 2: Upgrade 'user' to 'athlete' ONLY if NOT a known coach
        else if (userData.role === 'user') {
          correctRole = 'athlete'
          roleNeedsUpdate = true
          console.log(`🔄 ROLE UPGRADE: Upgrading ${user.email} from '${userData.role}' to 'athlete'`)
        }
      }

      // Only update Firestore if role actually needs to change
      if (roleNeedsUpdate) {
        try {
          await setDoc(userDocRef, {
            ...userData,
            role: correctRole,
            roleUpdatedAt: Timestamp.now(),
            roleUpdateReason: 'Known coach auto-correction'
          }, { merge: true })

          console.log(`✅ ROLE CORRECTED: ${user.email} updated from ${userData.role} to ${correctRole}`)
        } catch (updateError) {
          // Gracefully handle permission errors - user doc exists, that's what matters
          console.warn('Could not update user document (non-critical):', updateError)
        }
      }

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
      // Check role priority: superadmin > pending invitation > known coach > default
      let initialRole = defaultRole
      let roleSource = 'default'

      if (isSuperadmin(user.email)) {
        initialRole = 'superadmin'
        roleSource = 'superadmin'
        console.log(`✨ SUPERADMIN DETECTED: Setting ${user.email} to superadmin role`)
      } else {
        // Check for pending invitation first
        const invitationRole = await checkPendingInvitation(user.email)
        if (invitationRole) {
          initialRole = invitationRole
          roleSource = 'invitation'
          console.log(`✨ PENDING INVITATION DETECTED: Setting ${user.email} to ${initialRole} role from invitation`)
        } else if (user.email && isKnownCoach(user.email)) {
          initialRole = getKnownCoachRole(user.email) || defaultRole
          roleSource = 'known_coach'
          console.log(`✨ KNOWN COACH DETECTED: Setting ${user.email} to ${initialRole} role`)
        }
      }

      const newUserData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        role: initialRole,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }

      // CRITICAL: Protect roles from invitations and known mappings
      if (roleSource === 'invitation' || roleSource === 'known_coach' || roleSource === 'superadmin') {
        newUserData.manuallySetRole = true
        newUserData.roleProtected = true
        newUserData.roleSource = roleSource
        console.log(`🔒 ROLE PROTECTED: ${user.email} role '${initialRole}' from ${roleSource} - protection flags set`)
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