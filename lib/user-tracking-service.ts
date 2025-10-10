import { db } from './firebase.client'
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore'
import { autoProvisionSuperadmin, isSuperadminEmail } from './auto-superadmin-setup'

export interface NewUserData {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  signUpMethod: 'google' | 'email'
  timestamp: any
  isNewUser: boolean
}

export interface LessonData {
  id?: string
  userId: string
  title: string
  sport: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  content: any
  createdAt: any
  updatedAt: any
  isPublic: boolean
  tags: string[]
}

/**
 * Track new user sign-ups and save to Firebase
 */
export async function trackNewUser(userData: Omit<NewUserData, 'timestamp'>): Promise<boolean> {
  try {
    const { uid, email, displayName, photoURL, signUpMethod, isNewUser } = userData
    console.log(`📝 Tracking user sign-up: ${email} (${signUpMethod})`)

    // First, check if this is a superadmin
    const isSuperadmin = await autoProvisionSuperadmin(uid, email, displayName)

    // Prepare user document data
    const userDocData = {
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      signUpMethod,
      signUpTimestamp: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isNewUser,
      accountStatus: 'active',
      role: isSuperadmin ? 'superadmin' : 'user',
      onboardingCompleted: false,
      profileComplete: false,
      needsOnboarding: isNewUser,
      preferences: {
        sports: [],
        notifications: {
          email: true,
          push: true,
          lessons: true,
          updates: true
        }
      },
      stats: {
        lessonsCreated: 0,
        lessonsCompleted: 0,
        loginCount: 1
      }
    }

    // Save to users collection
    await setDoc(doc(db, 'users', uid), userDocData, { merge: true })
    console.log(`✅ User document created/updated for ${email}`)

    // If this is a brand new user, also track in signups collection for analytics
    if (isNewUser) {
      await addDoc(collection(db, 'userSignups'), {
        uid,
        email,
        displayName: displayName || '',
        signUpMethod,
        timestamp: serverTimestamp(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        referrer: typeof window !== 'undefined' ? window.document.referrer : '',
        isSuperadmin
      })
      console.log(`🎉 New user signup tracked for ${email}`)

      // Update platform statistics
      await updatePlatformStats('newSignups')
    } else {
      // DISABLED: lastLoginAt updates cause permission errors in production
      // Athletes don't have permission to update their own user documents
      // This was causing Firestore 400 errors on every login
      // await updateDoc(doc(db, 'users', uid), {
      //   lastLoginAt: serverTimestamp(),
      //   'stats.loginCount': increment(1)
      // })
      console.log(`🔄 Returning user login tracked for ${email}`)
    }

    return true
  } catch (error) {
    console.error('❌ Error tracking user:', error)
    return false
  }
}

/**
 * Save lesson data to Firebase
 */
export async function saveLessonData(lessonData: Omit<LessonData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const { userId, title, sport, difficulty, content, isPublic, tags } = lessonData
    console.log(`💾 Saving lesson: "${title}" for user ${userId}`)

    // Prepare lesson document
    const lessonDoc = {
      userId,
      title,
      sport,
      difficulty,
      content,
      isPublic,
      tags: tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      status: 'active'
    }

    // Save to lessons collection
    const lessonRef = await addDoc(collection(db, 'lessons'), lessonDoc)
    console.log(`✅ Lesson saved with ID: ${lessonRef.id}`)

    // DISABLED: User stats updates cause permission errors in production
    // Users don't have permission to update their own user documents
    // await updateDoc(doc(db, 'users', userId), {
    //   'stats.lessonsCreated': increment(1),
    //   lastActive: serverTimestamp()
    // })

    // Update platform statistics
    await updatePlatformStats('lessonsCreated')

    return lessonRef.id
  } catch (error) {
    console.error('❌ Error saving lesson:', error)
    return null
  }
}

/**
 * Update platform-wide statistics
 */
async function updatePlatformStats(metric: 'newSignups' | 'lessonsCreated' | 'activeUsers'): Promise<void> {
  try {
    const statsRef = doc(db, 'platformStats', 'global')
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    await updateDoc(statsRef, {
      [`${metric}.total`]: increment(1),
      [`${metric}.${today}`]: increment(1),
      lastUpdated: serverTimestamp()
    })
  } catch (error) {
    // If document doesn't exist, create it
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'not-found') {
      const today = new Date().toISOString().split('T')[0]
      await setDoc(doc(db, 'platformStats', 'global'), {
        [metric]: {
          total: 1,
          [today]: 1
        },
        lastUpdated: serverTimestamp()
      }, { merge: true })
    } else {
      console.error('Error updating platform stats:', error)
    }
  }
}

/**
 * Get user profile data
 */
export async function getUserProfile(uid: string): Promise<any | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Get user's lessons
 */
export async function getUserLessons(userId: string): Promise<LessonData[]> {
  try {
    const { query, where, getDocs, orderBy } = await import('firebase/firestore')
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(lessonsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LessonData))
  } catch (error) {
    console.error('Error getting user lessons:', error)
    return []
  }
}

/**
 * Send notification to admins about new user signup
 */
export async function notifyAdminsOfNewUser(userData: NewUserData): Promise<void> {
  try {
    await addDoc(collection(db, 'adminNotifications'), {
      type: 'new_user_signup',
      title: 'New User Signup',
      message: `New user ${userData.displayName || userData.email} signed up via ${userData.signUpMethod}`,
      userData: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        signUpMethod: userData.signUpMethod
      },
      timestamp: serverTimestamp(),
      read: false,
      priority: 'normal'
    })
    console.log(`📧 Admin notification sent for new user: ${userData.email}`)
  } catch (error) {
    console.error('Error sending admin notification:', error)
  }
}