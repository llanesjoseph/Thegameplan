// Core user profile data contract (Single Source of Truth for roles)
import { Timestamp } from 'firebase/firestore'

// UNIFIED ROLE DEFINITION - Single source of truth
// NOTE: 'creator' is deprecated - use 'coach' instead. Both are treated as equivalent.
export type AppRole = 'guest' | 'user' | 'creator' | 'coach' | 'assistant' | 'admin' | 'superadmin'

// Helper function to normalize creator -> coach
export function normalizeRole(role: AppRole): AppRole {
  return role === 'creator' ? 'coach' : role
}

// Helper function to check if user is a coach (handles both creator and coach roles)
export function isCoachRole(role?: AppRole | null): boolean {
  return role === 'coach' || role === 'creator'
}

// UNIFIED USER PROFILE - Primary user document structure
export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: AppRole
  onboardingComplete: boolean
  subscriptionLevel?: 'free' | 'basic' | 'pro' | 'elite'
  createdAt: Timestamp
  lastLoginAt: Timestamp
  updatedAt: Timestamp
  // Profile extension fields
  preferredSports?: string[]
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  goals?: string[]
  experienceYears?: number
  emailVerified?: boolean
}

// EXTENDED PROFILE DATA - For detailed user information (stored in separate collection)
export interface ExtendedUserProfile {
  uid: string
  bio?: string
  location?: string
  timezone?: string
  languages?: string[]
  socialLinks?: {
    instagram?: string
    youtube?: string
    tiktok?: string
    website?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  preferences?: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      profileVisible: boolean
      shareProgress: boolean
      shareAchievements: boolean
    }
    coaching: {
      availabilityPerWeekHours?: number
      preferredCoachStyle?: 'technical' | 'motivational' | 'analytical' | 'holistic'
    }
  }
  achievements?: Array<{
    id: string
    title: string
    description: string
    earnedAt: Timestamp
    sport?: string
  }>
  metrics?: {
    totalSessions: number
    totalWatchTime: number
    favoriteContent: string[]
    progressCompleted: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

// CREATOR SPECIFIC DATA - Stored in separate creator_profiles collection
export interface CreatorProfile {
  uid: string // Links to UserProfile.uid
  displayName: string
  slug: string
  bio: string
  sports: string[]
  certifications: string[]
  experience: string
  specialties: string[]
  profileImageUrl?: string
  headshotUrl?: string
  heroImageUrl?: string
  actionPhotos?: string[]
  highlightVideo?: string
  socialLinks?: {
    instagram?: string
    youtube?: string
    tiktok?: string
    website?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  stats?: {
    totalStudents: number
    totalContent: number
    avgRating: number
    totalReviews: number
    totalLessons: number
  }
  isVerified: boolean
  isActive: boolean
  featured: boolean
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  createdAt: Timestamp
  updatedAt: Timestamp
  approvedAt?: Timestamp
  approvedBy?: string
}

// PUBLIC CREATOR DATA - For discovery (stored in creatorPublic collection)
export interface PublicCreatorProfile {
  id: string // Maps to CreatorProfile.uid
  name: string // Maps to CreatorProfile.displayName
  firstName: string
  sport: string // Primary sport from CreatorProfile.sports[0]
  tagline?: string
  heroImageUrl?: string
  headshotUrl?: string
  badges?: string[]
  lessonCount?: number
  specialties?: string[]
  experience?: 'college' | 'pro' | 'olympic' | 'coach' | 'analyst'
  verified: boolean
  featured: boolean
  stats?: {
    totalStudents: number
    avgRating: number
    totalReviews: number
  }
  lastActiveAt: Timestamp
}


