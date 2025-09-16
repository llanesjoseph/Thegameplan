import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  projectId: 'gameplan-787a2',
}

// Initialize Firebase Admin if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

export const auth = getAuth(app)
export const adminDb = getFirestore(app)

export default app