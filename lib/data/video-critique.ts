import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  startAfter,
  DocumentData,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import {
  Submission,
  Review,
  Comment,
  Skill,
  CreateSubmissionRequest,
  PublishReviewRequest,
  SubmissionListFilters,
  PaginationParams,
  PaginatedResponse,
  SubmissionStatus,
  CommentAuthorRole,
} from '@/types/video-critique';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to typed object with proper timestamp handling
 */
export function convertFirestoreDoc<T>(
  doc: DocumentSnapshot | QueryDocumentSnapshot
): T | null {
  if (!doc.exists()) {
    return null;
  }

  const data = doc.data();
  const converted = { ...data, id: doc.id } as T;

  // Convert Firestore Timestamps to Date objects
  Object.keys(converted as any).forEach((key) => {
    const value = (converted as any)[key];
    if (value && value instanceof Timestamp) {
      (converted as any)[key] = value.toDate();
    }
  });

  return converted;
}

/**
 * Calculate SLA deadline based on submitted time and SLA hours
 */
export function calculateSLADeadline(
  submittedAt: Date,
  slaHours: number = 48
): Date {
  const deadline = new Date(submittedAt);
  deadline.setHours(deadline.getHours() + slaHours);
  return deadline;
}

/**
 * Check if SLA deadline has been breached
 */
export function checkSLABreach(slaDeadline: Date): boolean {
  return new Date() > slaDeadline;
}

/**
 * Calculate turnaround time in minutes
 */
export function calculateTurnaround(
  submittedAt: Date,
  completedAt: Date
): number {
  return Math.round((completedAt.getTime() - submittedAt.getTime()) / 60000);
}

// ============================================================================
// SUBMISSION OPERATIONS
// ============================================================================

/**
 * Create a new submission
 */
export async function createSubmission(
  data: CreateSubmissionRequest & {
    athleteUid: string;
    athleteName: string;
    athletePhotoUrl?: string;
    videoFileName: string;
    videoFileSize: number;
    videoStoragePath: string;
    coachId?: string;
    skillId?: string;
    teamId?: string;
  }
): Promise<string> {
  try {
    // Get skill details if skillId provided
    let skill: Skill | null = null;
    if (data.skillId) {
      const skillDoc = await getDoc(doc(db, 'skills', data.skillId));
      skill = convertFirestoreDoc<Skill>(skillDoc);
    }

    const now = new Date();
    const slaDeadline = calculateSLADeadline(now, 48);

    const submission: Omit<Submission, 'id'> = {
      // Owner info
      athleteUid: data.athleteUid,
      athleteName: data.athleteName,
      athletePhotoUrl: data.athletePhotoUrl,
      teamId: data.teamId,
      coachId: data.coachId,

      // Skill context (optional)
      skillId: data.skillId,
      skillName: skill?.name,

      // Video info
      videoFileName: data.videoFileName,
      videoFileSize: data.videoFileSize,
      videoStoragePath: data.videoStoragePath,
      videoDuration: 0, // Will be updated after processing

      // Workflow state
      status: 'uploading',
      slaBreach: false,

      // Context from athlete
      athleteContext: data.athleteContext,
      athleteGoals: data.athleteGoals,
      specificQuestions: data.specificQuestions,

      // Metrics
      viewCount: 0,
      commentCount: 0,
      uploadProgress: 0,

      // Metadata
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      submittedAt: serverTimestamp() as any,
      slaDeadline: Timestamp.fromDate(slaDeadline),
      version: 1,
    };

    const docRef = await addDoc(collection(db, 'submissions'), submission);
    return docRef.id;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw new Error('Failed to create submission');
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(id: string): Promise<Submission | null> {
  try {
    const docSnap = await getDoc(doc(db, 'submissions', id));
    return convertFirestoreDoc<Submission>(docSnap);
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw new Error('Failed to fetch submission');
  }
}

/**
 * Get submissions with filters and pagination
 */
export async function getSubmissions(
  filters: SubmissionListFilters = {},
  pagination?: PaginationParams
): Promise<PaginatedResponse<Submission>> {
  try {
    let q = query(collection(db, 'submissions'));

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.teamId) {
      q = query(q, where('teamId', '==', filters.teamId));
    }
    if (filters.athleteUid) {
      q = query(q, where('athleteUid', '==', filters.athleteUid));
    }
    if (filters.coachUid) {
      q = query(q, where('claimedBy', '==', filters.coachUid));
    }
    if (filters.coachId) {
      q = query(q, where('coachId', '==', filters.coachId));
    }
    if (filters.slaBreach !== undefined) {
      q = query(q, where('slaBreach', '==', filters.slaBreach));
    }

    // Apply ordering
    const orderField = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'desc';
    q = query(q, orderBy(orderField, orderDirection));

    // Apply pagination
    if (pagination?.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit + 1)); // Get one extra to check hasMore
    }

    const querySnapshot = await getDocs(q);
    const items: Submission[] = [];
    let lastDoc: DocumentSnapshot | undefined;

    let index = 0;
    querySnapshot.forEach((doc) => {
      if (!pagination?.limit || index < pagination.limit) {
        const submission = convertFirestoreDoc<Submission>(doc);
        if (submission) {
          items.push(submission);
        }
        lastDoc = doc;
      }
      index++;
    });

    const hasMore = pagination?.limit
      ? querySnapshot.size > pagination.limit
      : false;

    return {
      items,
      hasMore,
      lastDoc,
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
}

/**
 * Update submission fields
 */
export async function updateSubmission(
  id: string,
  data: Partial<Submission>
): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(doc(db, 'submissions', id), updateData);
  } catch (error) {
    console.error('Error updating submission:', error);
    throw new Error('Failed to update submission');
  }
}

/**
 * Coach claims a submission
 */
export async function claimSubmission(
  submissionId: string,
  coachUid: string,
  coachName: string
): Promise<void> {
  try {
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }

    const submission = submissionDoc.data() as Submission;

    // Check if already claimed
    if (submission.claimedBy && submission.claimedBy !== coachUid) {
      throw new Error('Submission already claimed by another coach');
    }

    // Update submission
    await updateDoc(submissionRef, {
      claimedBy: coachUid,
      claimedByName: coachName,
      claimedAt: serverTimestamp(),
      status: 'claimed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error claiming submission:', error);
    throw error;
  }
}

/**
 * Get unclaimed submissions for a team (coach queue)
 */
export async function getCoachQueue(
  teamId: string,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Submission>> {
  return getSubmissions(
    {
      teamId,
      status: 'awaiting_coach' as SubmissionStatus,
    },
    {
      ...pagination,
      orderBy: 'slaDeadline',
      orderDirection: 'asc', // Show urgent ones first
    }
  );
}

/**
 * Get athlete's submissions
 */
export async function getMySubmissions(
  athleteUid: string,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Submission>> {
  return getSubmissions({ athleteUid }, pagination);
}

/**
 * Listen to submission changes (real-time)
 */
export function listenToSubmission(
  submissionId: string,
  callback: (submission: Submission | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'submissions', submissionId),
    (doc) => {
      callback(convertFirestoreDoc<Submission>(doc));
    },
    (error) => {
      console.error('Error listening to submission:', error);
      callback(null);
    }
  );
}

/**
 * Listen to coach queue changes (real-time)
 */
export function listenToCoachQueue(
  coachId: string,
  callback: (submissions: Submission[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'submissions'),
    where('coachId', '==', coachId),
    where('status', 'in', ['awaiting_coach', 'claimed']),
    orderBy('slaDeadline', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const submissions: Submission[] = [];
      snapshot.forEach((doc) => {
        const submission = convertFirestoreDoc<Submission>(doc);
        if (submission) {
          submissions.push(submission);
        }
      });
      callback(submissions);
    },
    (error) => {
      console.error('Error listening to coach queue:', error);
      callback([]);
    }
  );
}

// ============================================================================
// REVIEW OPERATIONS
// ============================================================================

/**
 * Create and publish a review
 */
export async function createReview(
  data: PublishReviewRequest & {
    coachUid: string;
    coachName: string;
    coachPhotoUrl?: string;
    teamId: string;
  }
): Promise<string> {
  try {
    const batch = writeBatch(db);

    // Create review document
    const reviewRef = doc(collection(db, 'reviews'));
    const review: Omit<Review, 'id'> = {
      submissionId: data.submissionId,
      coachUid: data.coachUid,
      coachName: data.coachName,
      coachPhotoUrl: data.coachPhotoUrl,
      teamId: data.teamId,
      skillId: '', // Will be filled from submission

      rubricScores: data.rubricScores,
      timecodes: data.timecodes,
      drillRecommendations: data.drillRecommendations,

      overallFeedback: data.overallFeedback,
      nextSteps: data.nextSteps,
      strengths: data.strengths,
      areasForImprovement: data.areasForImprovement,

      status: 'published',
      publishedAt: serverTimestamp() as any,
      version: 1,

      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    batch.set(reviewRef, review);

    // Update submission status
    const submissionRef = doc(db, 'submissions', data.submissionId);
    batch.update(submissionRef, {
      status: 'complete',
      reviewId: reviewRef.id,
      reviewedBy: data.coachUid,
      reviewedAt: serverTimestamp(),
      turnaroundMinutes: 0, // Will be calculated server-side
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return reviewRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    throw new Error('Failed to create review');
  }
}

/**
 * Get a single review by ID
 */
export async function getReview(id: string): Promise<Review | null> {
  try {
    const docSnap = await getDoc(doc(db, 'reviews', id));
    return convertFirestoreDoc<Review>(docSnap);
  } catch (error) {
    console.error('Error fetching review:', error);
    throw new Error('Failed to fetch review');
  }
}

/**
 * Get reviews for a submission
 */
export async function getReviewsForSubmission(
  submissionId: string
): Promise<Review[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('submissionId', '==', submissionId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      const review = convertFirestoreDoc<Review>(doc);
      if (review) {
        reviews.push(review);
      }
    });

    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw new Error('Failed to fetch reviews');
  }
}

/**
 * Get single review for a submission (most recent)
 */
export async function getReviewBySubmission(
  submissionId: string
): Promise<Review | null> {
  try {
    const reviews = await getReviewsForSubmission(submissionId);
    return reviews.length > 0 ? reviews[0] : null;
  } catch (error) {
    console.error('Error fetching review:', error);
    throw new Error('Failed to fetch review');
  }
}

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

/**
 * Add a comment to a submission
 */
export async function addComment(
  submissionId: string,
  comment: {
    authorUid: string;
    authorName: string;
    authorPhotoUrl?: string;
    authorRole: CommentAuthorRole;
    content: string;
    timestamp?: number;
    parentCommentId?: string;
  }
): Promise<string> {
  try {
    const commentData: Omit<Comment, 'id'> = {
      ...comment,
      submissionId,
      createdAt: serverTimestamp() as any,
      edited: false,
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);

    // Update comment count on submission
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (submissionDoc.exists()) {
      const currentCount = submissionDoc.data().commentCount || 0;
      await updateDoc(submissionRef, {
        commentCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }
}

/**
 * Get comments for a submission
 */
export async function getComments(submissionId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('submissionId', '==', submissionId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const comment = convertFirestoreDoc<Comment>(doc);
      if (comment) {
        comments.push(comment);
      }
    });

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }
}

/**
 * Get comments for a review (wrapper for getComments using submissionId)
 */
export async function getCommentsByReview(reviewId: string): Promise<Comment[]> {
  try {
    // Get the review to find its submissionId
    const review = await getReview(reviewId);
    if (!review) {
      return [];
    }

    // Get comments by submissionId
    return await getComments(review.submissionId);
  } catch (error) {
    console.error('Error fetching comments for review:', error);
    throw new Error('Failed to fetch comments');
  }
}

/**
 * Listen to comments for a submission (real-time)
 */
export function listenToComments(
  submissionId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'comments'),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        const comment = convertFirestoreDoc<Comment>(doc);
        if (comment) {
          comments.push(comment);
        }
      });
      callback(comments);
    },
    (error) => {
      console.error('Error listening to comments:', error);
      callback([]);
    }
  );
}

// ============================================================================
// SKILL OPERATIONS
// ============================================================================

/**
 * Get skills for a team
 */
export async function getTeamSkills(teamId: string): Promise<Skill[]> {
  try {
    // For now, return all skills (can be filtered by team later)
    const q = query(collection(db, 'skills'), orderBy('name', 'asc'));

    const querySnapshot = await getDocs(q);
    const skills: Skill[] = [];

    querySnapshot.forEach((doc) => {
      const skill = convertFirestoreDoc<Skill>(doc);
      if (skill) {
        skills.push(skill);
      }
    });

    return skills;
  } catch (error) {
    console.error('Error fetching skills:', error);
    // Return empty array if skills don't exist yet
    return [];
  }
}