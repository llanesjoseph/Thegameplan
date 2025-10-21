import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration from environment variables with fallback
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gameplan-787a2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gameplan-787a2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gameplan-787a2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "301349049756",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:301349049756:web:c3091e3966de56117ae459",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y7SV159J6E"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Firestore connection and handle offline scenarios
if (typeof window !== 'undefined') {

  // Enable network on client side and handle initialization
  const initializeFirestore = async () => {
    try {
      await enableNetwork(db)
    } catch (error: unknown) {
      console.warn('Failed to enable Firestore network:', error)
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
    enableNetwork(db).catch((error) => {
      console.warn('Failed to re-enable network:', error)
    })
  })

  window.addEventListener('offline', () => {
    disableNetwork(db).catch((error) => {
      console.warn('Failed to disable network:', error)
    })
  })
}
