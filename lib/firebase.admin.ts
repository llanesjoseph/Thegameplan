import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const PROJECT_ID = 'gameplan-787a2'

function initializeFirebaseAdmin(): App {
  // Already initialized
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Method 1: Full service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      
      // Validate the parsed object has required fields
      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Service account JSON missing required fields (private_key or client_email)')
      }
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: PROJECT_ID,
      })
      console.log('🔥 Firebase Admin initialized with service account')
      return app
    } catch (parseError: any) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message)
      // Don't fall through - throw so we know there's a config problem
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY: ${parseError.message}`)
    }
  }

  // Method 2: Individual env variables
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      const app = initializeApp({
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: PROJECT_ID,
      })
      console.log('🔥 Firebase Admin initialized with env credentials')
      return app
    } catch (credError: any) {
      console.error('❌ Failed to init with FIREBASE_PRIVATE_KEY/CLIENT_EMAIL:', credError.message)
      throw new Error(`Invalid Firebase credentials: ${credError.message}`)
    }
  }

  // Method 3: Development only - no credentials (will fail on authenticated operations)
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Firebase Admin initialized WITHOUT credentials - auth operations will fail!')
    return initializeApp({ projectId: PROJECT_ID })
  }

  // Production without credentials = fatal error
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY+FIREBASE_CLIENT_EMAIL required in production')
}

const app = initializeFirebaseAdmin()

export const auth = getAuth(app)
export const adminDb = getFirestore(app)
export const adminStorage = getStorage(app)

export default app