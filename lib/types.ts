// Core application types for type safety
import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  role?: 'user' | 'creator' | 'admin' | 'superadmin'
  createdAt: Date
  updatedAt: Date
}

export interface Creator {
  uid: string
  name: string
  firstName?: string
  tagline: string
  sport: string
  badges: string[]
  heroImageUrl: string
  headshotUrl?: string
  actionImageUrl?: string
  stadiumBgUrl?: string
  lessons: Lesson[]
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl?: string
  level: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced'
  length: string
  creatorUid: string
  visibility: 'public' | 'subscribers' | 'private'
  status: 'draft' | 'published' | 'scheduled'
  scheduledAt?: Date
  views: number
  totalViewTime: number
  averageCompletionRate: number
  engagementScore: number
  createdAt: Date
  updatedAt: Date
}

export interface Progress {
  uid: string
  contentId: string
  percent: number
  updatedAt: Date
}

export interface CoachingRequest {
  id: string
  userId: string // User who created the request
  userEmail: string
  type: 'one_on_one' | 'file_review' | 'group_session'
  status: 'new' | 'accepted' | 'scheduled' | 'completed' | 'cancelled'
  title: string
  description: string
  sport: string
  skillLevel: string
  preferredTime: string
  targetCreatorUid?: string
  targetCreatorName?: string
  urgency?: string
  fileUrl?: string
  createdAt: Date
  scheduledAt?: Date
  updatedAt?: Date
}

export interface Session {
  id: string
  userUid: string
  creatorUid: string
  title: string
  description: string
  scheduledAt: Date
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'counter'
  meetingLink?: string
  notes?: string
  proposed?: Array<{ day: string; start: string; end: string }>
  counter?: Array<{ day: string; start: string; end: string }>
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  uid: string
  status: 'active' | 'cancelled' | 'past_due'
  plan: 'basic' | 'premium' | 'enterprise'
  currentPeriodEnd: Date
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface FormError {
  field: string
  message: string
}

// Firebase Firestore document data (without timestamps converted)
export type FirestoreData<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp // Firestore Timestamp
  updatedAt: Timestamp // Firestore Timestamp
}

// Firebase Functions response types
export interface SetRoleResponse {
  uid: string
  role: string
}

export interface StripeCheckoutResponse {
  url: string
}

export interface FirebaseFunctionError extends Error {
  message: string
  code?: string
}

// Firebase Auth custom claims
export interface FirebaseCustomClaims {
  superadmin?: boolean
  admin?: boolean
  role?: 'user' | 'creator' | 'admin' | 'superadmin'
}

// Analytics and Metrics
export interface LessonAnalytics {
  id: string
  lessonId: string
  creatorUid: string
  views: number
  uniqueViews: number
  totalViewTime: number
  averageViewDuration: number
  completionRate: number
  engagementScore: number
  likes: number
  shares: number
  comments: number
  monthlyGrowth: number
  peakViewTime: string
  userRetentionRate: number
  createdAt: Date
  updatedAt: Date
}

export interface UserAnalytics {
  id: string
  userId: string
  totalWatchTime: number
  lessonsCompleted: number
  averageEngagement: number
  favoriteContent: string[]
  skillProgression: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

export interface CreatorAnalytics {
  id: string
  creatorUid: string
  totalFollowers: number
  activeViewers: number
  totalViews: number
  totalViewTime: number
  averageEngagement: number
  topEngagement: number
  monthlyGrowth: number
  contentCount: number
  revenueGenerated: number
  topPerformingContent: string[]
  audienceRetention: number
  createdAt: Date
  updatedAt: Date
}