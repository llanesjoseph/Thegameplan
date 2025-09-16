// AI Disclaimer Acceptance Tracking
import { auth } from '@/lib/firebase.client'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export interface DisclaimerAcceptance {
  userId: string
  userEmail: string
  acceptedAt: Timestamp
  termsVersion: string
  ipAddress?: string
  userAgent?: string
}

const DISCLAIMER_STORAGE_KEY = 'ai_disclaimer_accepted'
const CURRENT_DISCLAIMER_VERSION = '1.0'

export class DisclaimerTracker {
  // Check if user has already accepted disclaimer
  static async hasAcceptedDisclaimer(userId?: string): Promise<boolean> {
    try {
      // Check local storage first for quick response
      const localAcceptance = localStorage.getItem(DISCLAIMER_STORAGE_KEY)
      if (localAcceptance) {
        const parsed = JSON.parse(localAcceptance)
        if (parsed.version === CURRENT_DISCLAIMER_VERSION && parsed.userId === userId) {
          return true
        }
      }

      // Check Firestore for persistent record
      if (userId) {
        const docRef = doc(db, 'disclaimer_acceptances', userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.termsVersion === CURRENT_DISCLAIMER_VERSION) {
            // Update local storage for faster future checks
            localStorage.setItem(DISCLAIMER_STORAGE_KEY, JSON.stringify({
              version: CURRENT_DISCLAIMER_VERSION,
              userId: userId,
              acceptedAt: data.acceptedAt.toDate().toISOString()
            }))
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.warn('Error checking disclaimer acceptance:', error)
      return false
    }
  }

  // Record disclaimer acceptance
  static async recordAcceptance(userId: string, userEmail: string): Promise<void> {
    try {
      const acceptance: DisclaimerAcceptance = {
        userId,
        userEmail,
        acceptedAt: Timestamp.now(),
        termsVersion: CURRENT_DISCLAIMER_VERSION,
        userAgent: navigator.userAgent
      }

      // Store in Firestore
      const docRef = doc(db, 'disclaimer_acceptances', userId)
      await setDoc(docRef, acceptance, { merge: true })

      // Store in local storage for quick access
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, JSON.stringify({
        version: CURRENT_DISCLAIMER_VERSION,
        userId: userId,
        acceptedAt: new Date().toISOString()
      }))

      console.log('✅ Disclaimer acceptance recorded successfully')
    } catch (error) {
      console.error('❌ Error recording disclaimer acceptance:', error)
      throw error
    }
  }

  // Clear disclaimer acceptance (for testing or version updates)
  static clearAcceptance(userId?: string): void {
    localStorage.removeItem(DISCLAIMER_STORAGE_KEY)
    console.log('🗑️ Disclaimer acceptance cleared from local storage')
  }

  // Get disclaimer acceptance info
  static async getAcceptanceInfo(userId: string): Promise<DisclaimerAcceptance | null> {
    try {
      const docRef = doc(db, 'disclaimer_acceptances', userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as DisclaimerAcceptance
      }
      return null
    } catch (error) {
      console.warn('Error getting disclaimer acceptance info:', error)
      return null
    }
  }
}

export default DisclaimerTracker