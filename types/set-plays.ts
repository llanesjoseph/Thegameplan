import { Timestamp } from 'firebase/firestore'

/**
 * Set Plays Module Type Definitions
 * Manages teams, plays, and collaborative discussions
 */

// ===== TEAM TYPES =====

export interface Team {
  id: string
  name: string
  logo?: string
  sport: string
  description?: string
  coachId: string
  assistantIds: string[]
  athleteIds: string[]
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  archivedAt?: Timestamp | Date
  isArchived: boolean
}

export interface TeamCreateInput {
  name: string
  sport: string
  description?: string
  logo?: string
  athleteIds?: string[]
  assistantIds?: string[]
}

export interface TeamUpdateInput {
  name?: string
  sport?: string
  description?: string
  logo?: string
  athleteIds?: string[]
  assistantIds?: string[]
  isArchived?: boolean
}

// ===== PLAY TYPES =====

export type PlayVisibility = 'coach' | 'assistant' | 'team'
export type PlayMediaType = 'video' | 'image' | 'pdf' | 'diagram'

export interface PlayMedia {
  type: PlayMediaType
  url: string
  thumbnailUrl?: string
  duration?: number // For videos, in seconds
  size?: number // File size in bytes
  mimeType?: string
}

export interface Play {
  id: string
  teamId: string
  title: string
  description?: string
  notes?: string
  tags: string[]
  visibility: PlayVisibility
  media: PlayMedia[]
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  views: number
  completions: number
}

export interface PlayCreateInput {
  teamId: string
  title: string
  description?: string
  notes?: string
  tags?: string[]
  visibility?: PlayVisibility
  media?: PlayMedia[]
}

export interface PlayUpdateInput {
  title?: string
  description?: string
  notes?: string
  tags?: string[]
  visibility?: PlayVisibility
  media?: PlayMedia[]
}

// ===== COMMENT/DISCUSSION TYPES =====

export type CommentAuthorRole = 'coach' | 'assistant' | 'athlete'

export interface Comment {
  id: string
  playId: string
  teamId: string
  authorId: string
  authorRole: CommentAuthorRole
  authorName: string
  authorAvatar?: string
  body: string
  parentId?: string | null // For threaded replies
  mentions: string[] // User IDs mentioned with @
  attachments: PlayMedia[]
  reactions: CommentReactions
  isCoachApproved: boolean
  isPinned: boolean
  isClosed: boolean
  isPrivateNote: boolean // Visible only to author + coach
  isEdited: boolean
  editedAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface CommentReactions {
  [emoji: string]: string[] // emoji -> array of user IDs who reacted
}

export interface CommentCreateInput {
  playId: string
  body: string
  parentId?: string | null
  mentions?: string[]
  attachments?: PlayMedia[]
  isPrivateNote?: boolean
}

export interface CommentUpdateInput {
  body?: string
  mentions?: string[]
  attachments?: PlayMedia[]
}

// ===== ANALYTICS TYPES =====

export interface PlayView {
  playId: string
  teamId: string
  userId: string
  viewedAt: Timestamp | Date
  duration?: number // How long they viewed it
  completed: boolean
}

export interface TeamAnalytics {
  teamId: string
  totalPlays: number
  totalViews: number
  totalCompletions: number
  totalComments: number
  totalUnansweredComments: number
  averageCoachResponseTime: number // In minutes
  mostViewedPlays: Array<{ playId: string; title: string; views: number }>
  mostDiscussedPlays: Array<{ playId: string; title: string; comments: number }>
  athleteEngagement: Array<{
    athleteId: string
    athleteName: string
    views: number
    comments: number
    completions: number
  }>
}

export interface AthleteProgress {
  athleteId: string
  teamId: string
  totalPlaysAvailable: number
  playsViewed: number
  playsCompleted: number
  totalComments: number
  lastActivityAt?: Timestamp | Date
}

// ===== API RESPONSE TYPES =====

export interface SetPlaysAPIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TeamListResponse {
  teams: Team[]
  count: number
}

export interface PlayListResponse {
  plays: Play[]
  count: number
}

export interface CommentListResponse {
  comments: Comment[]
  count: number
}

// ===== NOTIFICATION TYPES =====

export interface PlayNotification {
  type: 'new_play' | 'updated_play' | 'new_comment' | 'comment_reply' | 'mention' | 'coach_approved'
  playId: string
  teamId: string
  triggeredBy: string
  recipients: string[]
  message: string
  createdAt: Timestamp | Date
}

// ===== PERMISSION HELPERS =====

export interface PlayPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canComment: boolean
  canModerate: boolean
}

export interface CommentPermissions {
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canPin: boolean
  canClose: boolean
}
