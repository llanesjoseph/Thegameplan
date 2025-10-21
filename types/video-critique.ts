import { Timestamp } from 'firebase/firestore';

// ============================================================================
// VIDEO CRITIQUE SYSTEM - TYPE DEFINITIONS
// ============================================================================

export type SubmissionStatus =
  | 'draft'
  | 'uploading'
  | 'processing'
  | 'awaiting_coach'
  | 'claimed'
  | 'in_review'
  | 'complete'
  | 'needs_resubmission'
  | 'reopened'
  | 'archived';

export type ReviewStatus = 'draft' | 'published' | 'revised';

export type PrivacyLevel = 'team_only' | 'coaches_only' | 'parent_visible';

export type CommentAuthorRole = 'athlete' | 'coach' | 'parent';

export type TimecodeType = 'praise' | 'correction' | 'question';

export type NotificationType =
  | 'new_submission'
  | 'review_published'
  | 'sla_breach'
  | 'comment_added'
  | 'submission_claimed'
  | 'needs_resubmission'
  | 'followup_requested';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  sport: string;
  category: string;
  description: string;
  tags: string[];
  rubricId?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  scoreDescriptions: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  weight?: number;
}

export interface Rubric {
  id: string;
  name: string;
  sport: string;
  skillIds: string[];
  criteria: RubricCriteria[];
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Drill {
  id: string;
  name: string;
  description: string;
  sport: string;
  category: string;
  skillFocusAreas: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  thumbnailUrl?: string;
  defaultReps?: number;
  defaultSets?: number;
  equipment?: string[];
  duration?: number; // in minutes
  instructions?: string[];
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Submission {
  id: string;

  // Owner info
  athleteUid: string;
  athleteName: string;
  athletePhotoUrl?: string;
  teamId: string;

  // Skill context
  skillId: string;
  skillName: string;

  // Video info
  videoFileName: string;
  videoFileSize: number;
  videoDuration?: number;
  videoStoragePath: string;
  videoDownloadUrl?: string;
  thumbnailUrl?: string;

  // Workflow state
  status: SubmissionStatus;
  claimedBy?: string;
  claimedByName?: string;
  claimedAt?: Date | Timestamp;
  reviewedBy?: string;
  reviewedAt?: Date | Timestamp;
  reviewId?: string;

  // SLA tracking
  submittedAt?: Date | Timestamp;
  slaDeadline?: Date | Timestamp;
  slaBreach: boolean;
  turnaroundMinutes?: number;

  // Context from athlete
  athleteContext: string;
  athleteGoals?: string;
  specificQuestions?: string;
  privacyLevel: PrivacyLevel;

  // Follow-up tracking
  followupRequested?: boolean;
  followupRequestedAt?: Date | Timestamp;
  followupDeadline?: Date | Timestamp;

  // Resubmission
  resubmissionRequested?: boolean;
  resubmissionReason?: string;
  parentSubmissionId?: string; // if this is a resubmission

  // Metrics
  viewCount: number;
  commentCount: number;
  uploadProgress?: number;

  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  version: number;
}

export interface RubricScore {
  criteriaId: string;
  score: number;
  notes: string;
}

export interface Timecode {
  id: string;
  timestamp: number; // seconds
  type: TimecodeType;
  comment: string;
  videoUrl?: string;
}

export interface DrillRecommendation {
  drillId: string;
  drillName: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  reps?: number;
  sets?: number;
  videoUrl?: string;
}

export interface Review {
  id: string;

  // References
  submissionId: string;
  coachUid: string;
  coachName: string;
  coachPhotoUrl?: string;
  teamId: string;
  skillId: string;

  // Structured feedback
  rubricScores: RubricScore[];
  timecodes: Timecode[];
  drillRecommendations: DrillRecommendation[];

  // Summary feedback
  overallFeedback: string;
  nextSteps: string;
  strengths?: string[];
  areasForImprovement?: string[];

  // State
  status: ReviewStatus;
  publishedAt?: Date | Timestamp;
  version: number;

  // Athlete feedback on review
  athleteSatisfactionScore?: number; // 1-5
  athleteFeedback?: string;

  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Comment {
  id: string;
  submissionId: string;
  authorUid: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorRole: CommentAuthorRole;
  content: string;
  timestamp?: number; // Optional video timestamp reference
  parentCommentId?: string; // For threading
  createdAt: Date | Timestamp;
  edited: boolean;
  editedAt?: Date | Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;

  // Related entities
  submissionId?: string;
  reviewId?: string;
  commentId?: string;

  // State
  read: boolean;
  readAt?: Date | Timestamp;

  createdAt: Date | Timestamp;
}

export interface AuditEvent {
  id: string;
  entityType: 'submission' | 'review' | 'comment' | 'user';
  entityId: string;
  eventType: string;
  actor: string;
  actorName?: string;

  previousState?: any;
  newState?: any;
  metadata: Record<string, any>;

  timestamp: Date | Timestamp;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSubmissionRequest {
  skillId: string;
  athleteContext: string;
  athleteGoals?: string;
  specificQuestions?: string;
  privacyLevel: PrivacyLevel;
  teamId: string;
}

export interface CreateSubmissionResponse {
  submissionId: string;
  uploadUrl: string;
}

export interface ClaimSubmissionRequest {
  submissionId: string;
}

export interface ClaimSubmissionResponse {
  success: boolean;
  claimedAt: Date;
  claimedBy: string;
}

export interface PublishReviewRequest {
  submissionId: string;
  rubricScores: RubricScore[];
  timecodes: Timecode[];
  drillRecommendations: DrillRecommendation[];
  overallFeedback: string;
  nextSteps: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface PublishReviewResponse {
  reviewId: string;
  publishedAt: Date;
}

// ============================================================================
// UI/COMPONENT TYPES
// ============================================================================

export interface SubmissionListFilters {
  status?: SubmissionStatus;
  teamId?: string;
  athleteUid?: string;
  coachUid?: string;
  slaBreach?: boolean;
}

export interface SubmissionCardProps {
  submission: Submission;
  onClaim?: (submissionId: string) => void;
  onView?: (submissionId: string) => void;
  showActions?: boolean;
}

export interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onAddTimecode?: (timestamp: number) => void;
}

export interface RubricScoringProps {
  rubric: Rubric;
  scores: RubricScore[];
  onChange: (scores: RubricScore[]) => void;
  readOnly?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  limit?: number;
  startAfter?: any;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: any;
  total?: number;
}

// Helper to convert Firestore Timestamp to Date
export type FirestoreTimestamp = {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
};
