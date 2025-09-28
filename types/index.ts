// @ts-nocheck
// Comprehensive TypeScript definitions for Game Plan application

// import { User } from 'firebase/auth' // Commented out as it's exported at the end
import { Timestamp } from 'firebase/firestore'

// Import unified user types from dedicated user types file
export type {
  AppRole as UserRole,
  UserProfile,
  ExtendedUserProfile,
  CreatorProfile,
  PublicCreatorProfile
} from './user'

// Firebase User Extensions - Legacy compatibility
export interface FirebaseUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

// Legacy AppUser interface for backward compatibility
export interface AppUser extends FirebaseUser {
  role: UserRole
  createdAt: Timestamp | Date
  lastLoginAt?: Timestamp | Date
  subscriptionLevel?: SubscriptionTier
  onboardingCompleted?: boolean
}

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'elite'

// AI Service Types
export interface AIRequest {
  question: string
  sport?: string
  context?: string
  userId: string
  sessionId: string
}

export interface AIResponse {
  content: string
  provider: AIProvider
  usage?: {
    tokens: number
    cost?: number
  }
  metadata?: Record<string, unknown>
}

export type AIProvider = 'vertex' | 'openai' | 'gemini' | 'fallback' | 'emergency' | 'safety_system'

// Content Management
export interface ContentItem {
  id: string
  title: string
  description: string
  creatorUid: string
  sport: string
  type: 'video' | 'article' | 'lesson' | 'drill'
  status: 'draft' | 'published' | 'archived'
  requiredTier: SubscriptionTier
  publishedAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  tags: string[]
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  views?: number
}

// Coaching Requests
export interface CoachingRequest {
  id: string
  userId: string
  userEmail: string
  targetCreatorUid?: string
  sport: string
  requestType: 'video_review' | 'technique_help' | 'training_plan' | 'general'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  fileUrls?: string[]
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  dueDate?: Timestamp | Date
  response?: string
  responseAt?: Timestamp | Date
}

// CreatorProfile is now imported from ./user types file - removed duplicate definition

// Error Handling
export interface AppErrorContext {
  userId?: string
  action?: string
  component?: string
  metadata?: Record<string, unknown>
}

export interface APIErrorResponse {
  success: false
  error: {
    message: string
    code: string
    statusCode: number
    timestamp: string
  }
}

export interface APISuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse

// Form Data Types
export interface OnboardingFormData {
  sports: string[]
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  goals: string[]
  experienceYears: number
  availabilityPerWeekHours: number
  preferredCoachStyle: 'technical' | 'motivational' | 'analytical' | 'holistic'
}

export interface CreatorOnboardingData {
  displayName: string
  slug: string
  bio: string
  sports: string[]
  certifications: string[]
  experience: string
  specialties: string[]
  socialLinks: {
    instagram?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
}

// Event Types
export interface UserEvent {
  type: 'page_view' | 'click' | 'form_submit' | 'video_interaction' | 'feature_usage'
  timestamp: Date
  userId?: string
  properties?: Record<string, unknown>
}

export interface VideoPlayerEvent {
  action: 'play' | 'pause' | 'complete' | 'progress'
  videoId: string
  progress?: number
  timestamp: Date
}

// Performance Monitoring
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  userId?: string
  metadata?: Record<string, unknown>
}

// File Upload Types
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// Search and Filtering
export interface SearchFilters {
  sports?: string[]
  skillLevel?: string[]
  contentType?: string[]
  duration?: {
    min?: number
    max?: number
  }
  requiredTier?: SubscriptionTier[]
}

export interface SearchResult<T = ContentItem | CreatorProfile> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// Firebase Security Rules Helper Types
export interface SecurityContext {
  userId?: string
  userRole?: UserRole
  resourceOwnerId?: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  isRead: boolean
  createdAt: Timestamp | Date
  expiresAt?: Timestamp | Date
  actionUrl?: string
}

// Analytics and Reporting
export interface AnalyticsEvent {
  eventName: string
  eventProperties?: Record<string, unknown>
  userId?: string
  timestamp: Date
  sessionId?: string
}

// Rate Limiting
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (userId: string) => string
}

// Cache Types
export interface CacheEntry<T = unknown> {
  data: T
  timestamp: Date
  expiresAt: Date
}

// Webhook Types
export interface WebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: Date
  signature?: string
}

// Export utility types
export type Awaited<T> = T extends Promise<infer U> ? U : T
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Generic Response Handlers
export type AsyncResult<T, E = Error> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>

// Export commonly used Firebase types
export type { User } from 'firebase/auth'
export { Timestamp } from 'firebase/firestore'
export type { User as FirebaseAuthUser } from 'firebase/auth'