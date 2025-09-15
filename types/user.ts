// Core user profile data contract (Single Source of Truth for roles)
import { Timestamp } from 'firebase/firestore'

export type AppRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  role: AppRole
  onboardingComplete: boolean
  createdAt: Timestamp
  lastLoginAt: Timestamp
}


