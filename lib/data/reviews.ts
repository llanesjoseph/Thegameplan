import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Review, RubricScore, Timecode, DrillRecommendation, ReviewStatus } from '@/types/video-critique';

const COLLECTION_NAME = 'reviews';

// ============================================================================
// CREATE & UPDATE
// ============================================================================

export async function createReview(data: Partial<Review>): Promise<string> {
  const reviewRef = doc(collection(db, COLLECTION_NAME));

  await setDoc(reviewRef, {
    ...data,
    id: reviewRef.id,
    status: 'draft' as ReviewStatus,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reviewRef.id;
}

export async function updateReview(
  reviewId: string,
  updates: Partial<Review>
): Promise<void> {
  const reviewRef = doc(db, COLLECTION_NAME, reviewId);

  await updateDoc(reviewRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function saveDraftReview(
  reviewId: string,
  rubricScores: RubricScore[],
  timecodes: Timecode[],
  drillRecommendations: DrillRecommendation[],
  overallFeedback?: string,
  nextSteps?: string,
  strengths?: string[],
  areasForImprovement?: string[]
): Promise<void> {
  const reviewRef = doc(db, COLLECTION_NAME, reviewId);

  await updateDoc(reviewRef, {
    rubricScores,
    timecodes,
    drillRecommendations,
    overallFeedback: overallFeedback || '',
    nextSteps: nextSteps || '',
    strengths: strengths || [],
    areasForImprovement: areasForImprovement || [],
    status: 'draft',
    updatedAt: serverTimestamp(),
  });
}

export async function publishReview(reviewId: string): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const reviewRef = doc(db, COLLECTION_NAME, reviewId);
    const reviewDoc = await transaction.get(reviewRef);

    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    const review = reviewDoc.data() as Review;

    // Validate required fields
    if (!review.overallFeedback || !review.nextSteps) {
      throw new Error('Overall feedback and next steps are required to publish');
    }

    if (!review.rubricScores || review.rubricScores.length === 0) {
      throw new Error('Rubric scores are required to publish');
    }

    // Update review status
    transaction.update(reviewRef, {
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update submission status
    const submissionRef = doc(db, 'submissions', review.submissionId);
    transaction.update(submissionRef, {
      status: 'complete',
      reviewedBy: review.coachUid,
      reviewedAt: serverTimestamp(),
      reviewId: reviewId,
      updatedAt: serverTimestamp(),
    });
  });
}

// ============================================================================
// READ
// ============================================================================

export async function getReview(reviewId: string): Promise<Review | null> {
  const reviewRef = doc(db, COLLECTION_NAME, reviewId);
  const reviewDoc = await getDoc(reviewRef);

  if (!reviewDoc.exists()) {
    return null;
  }

  return reviewDoc.data() as Review;
}

export async function getReviewBySubmission(submissionId: string): Promise<Review | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('submissionId', '==', submissionId),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Review;
}

export async function getCoachReviews(
  coachUid: string,
  status?: ReviewStatus,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ reviews: Review[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('coachUid', '==', coachUid)
  );

  if (status) {
    q = query(q, where('status', '==', status));
  }

  q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => doc.data() as Review);
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { reviews, lastDoc: newLastDoc };
}

// ============================================================================
// ATHLETE FEEDBACK
// ============================================================================

export async function submitAthleteFeedback(
  reviewId: string,
  satisfactionScore: number,
  feedback?: string
): Promise<void> {
  const reviewRef = doc(db, COLLECTION_NAME, reviewId);

  await updateDoc(reviewRef, {
    athleteSatisfactionScore: satisfactionScore,
    athleteFeedback: feedback || '',
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

export function subscribeToReview(
  reviewId: string,
  callback: (review: Review | null) => void
): () => void {
  const reviewRef = doc(db, COLLECTION_NAME, reviewId);

  const unsubscribe = onSnapshot(reviewRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Review);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getCoachReviewStats(coachUid: string): Promise<{
  totalReviews: number;
  averageSatisfaction: number;
  averageTurnaroundHours: number;
  reviewsThisWeek: number;
  reviewsThisMonth: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all published reviews by coach
  const q = query(
    collection(db, COLLECTION_NAME),
    where('coachUid', '==', coachUid),
    where('status', '==', 'published')
  );

  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => doc.data() as Review);

  // Calculate stats
  const totalReviews = reviews.length;

  const satisfactionScores = reviews
    .filter(r => r.athleteSatisfactionScore)
    .map(r => r.athleteSatisfactionScore!);

  const averageSatisfaction = satisfactionScores.length > 0
    ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
    : 0;

  // Calculate reviews in different time periods
  const reviewsThisWeek = reviews.filter(r => {
    const publishedAt = r.publishedAt instanceof Timestamp
      ? r.publishedAt.toDate()
      : r.publishedAt as Date;
    return publishedAt >= sevenDaysAgo;
  }).length;

  const reviewsThisMonth = reviews.filter(r => {
    const publishedAt = r.publishedAt instanceof Timestamp
      ? r.publishedAt.toDate()
      : r.publishedAt as Date;
    return publishedAt >= thirtyDaysAgo;
  }).length;

  // For turnaround time, we'd need to join with submissions data
  // For now, return a placeholder
  const averageTurnaroundHours = 24; // Would calculate from submission data

  return {
    totalReviews,
    averageSatisfaction,
    averageTurnaroundHours,
    reviewsThisWeek,
    reviewsThisMonth,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function calculateAverageRubricScore(rubricScores: RubricScore[]): number {
  if (!rubricScores || rubricScores.length === 0) return 0;

  const totalScore = rubricScores.reduce((sum, score) => sum + score.score, 0);
  return totalScore / rubricScores.length;
}

export function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function parseTimecode(timecode: string): number {
  const [minutes, seconds] = timecode.split(':').map(Number);
  return minutes * 60 + seconds;
}