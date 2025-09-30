import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// For development, we'll use the emulator or fallback to limited functionality
const firebaseAdminConfig = {
  projectId: 'gameplan-787a2',
}

// Try to use service account if available, otherwise use default credentials
let app
if (getApps().length === 0) {
  try {
    // DEBUG: Log what env vars are available
    console.log('🔍 Firebase Admin Init - Checking credentials...')
    console.log('- FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET ✅' : 'NOT SET ❌')
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET ✅' : 'NOT SET ❌')
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET ✅' : 'NOT SET ❌')

    // Check for service account key in environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'gameplan-787a2',
      })
      console.log('🔥 Firebase Admin initialized with service account')
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Use individual environment variables
      app = initializeApp({
        credential: cert({
          projectId: 'gameplan-787a2',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: 'gameplan-787a2',
      })
      console.log('🔥 Firebase Admin initialized with env credentials')
    } else {
      // Development fallback - use default credentials (limited functionality)
      app = initializeApp(firebaseAdminConfig)
      console.log('⚠️  Firebase Admin initialized without service account (limited functionality)')
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin with credentials, using default:', error)
    app = initializeApp(firebaseAdminConfig)
  }
} else {
  app = getApps()[0]
}

export const auth = getAuth(app)
export const adminDb = getFirestore(app)

export default app