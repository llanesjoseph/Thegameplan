import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Direct Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
  storageBucket: "gameplan-787a2.firebasestorage.app",
  messagingSenderId: "301349049756",
  appId: "1:301349049756:web:c3091e3966de56117ae459",
  measurementId: "G-Y7SV159J6E"
}

console.log('🔥 Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing'
})

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

console.log('🔥 Firebase services initialized:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage,
  appName: app.name,
  projectId: app.options.projectId
})

// Initialize Firestore connection and handle offline scenarios
if (typeof window !== 'undefined') {
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId)

  // Enable network on client side and handle initialization
  const initializeFirestore = async () => {
    try {
      await enableNetwork(db)
      console.log('Firestore network enabled successfully')
    } catch (error: unknown) {
      console.warn('Failed to enable Firestore network:', error)
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'failed-precondition') {
        console.log('Firestore may already be enabled or in offline mode')
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirestore)
  } else {
    initializeFirestore()
  }

  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('Network online - enabling Firestore')
    enableNetwork(db).catch((error) => {
      console.warn('Failed to re-enable network:', error)
    })
  })

  window.addEventListener('offline', () => {
    console.log('Network offline - disabling Firestore')
    disableNetwork(db).catch((error) => {
      console.warn('Failed to disable network:', error)
    })
  })
}
