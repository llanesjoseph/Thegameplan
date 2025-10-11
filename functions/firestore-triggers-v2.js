/**
 * CRITICAL: Coach-Athlete Data Flow Cloud Functions (v2 API)
 *
 * These functions ensure automated, real-time content delivery from coaches to athletes.
 * DO NOT modify without understanding the complete data flow architecture.
 *
 * See: /docs/COACH_ATHLETE_DATA_FLOW_SOLUTION.md for complete documentation
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ============================================================================
// FUNCTION 1: onLessonPublished
// Trigger: When a lesson is published, deliver it to all assigned athletes
// ============================================================================

exports.onLessonPublished = onDocumentWritten('content/{lessonId}', async (event) => {
  const startTime = Date.now();
  const lessonId = event.params.lessonId;

  try {

    // If lesson was deleted, skip
    if (!event.data.after.exists) {
      logger.log(`Lesson ${lessonId} was deleted, skipping`);
      return null;
    }

    const lessonData = event.data.after.data();
    const beforeData = event.data.before.exists ? event.data.before.data() : null;

    // Only process if status changed to 'published'
    const wasPublished = beforeData?.status === 'published';
    const isPublished = lessonData.status === 'published';

    if (isPublished && !wasPublished) {
      logger.log(`✅ Lesson ${lessonId} was just published. Delivering to athletes...`);
    } else if (!isPublished) {
      logger.log(`Lesson ${lessonId} is not published (status: ${lessonData.status}), skipping`);
      return null;
    } else {
      logger.log(`Lesson ${lessonId} was already published, skipping delivery`);
      return null;
    }

    const coachId = lessonData.creatorUid;

    if (!coachId) {
      logger.error(`❌ Lesson ${lessonId} has no creatorUid, cannot deliver`);
      return null;
    }

    // Get coach's roster
    const rosterDoc = await db.doc(`coach_rosters/${coachId}`).get();

    if (!rosterDoc.exists) {
      logger.log(`⚠️ No roster found for coach ${coachId}. Creating roster...`);

      // OPTIMIZED: Query only athletes assigned to this coach (uses index)
      // Queries are run in parallel for performance
      const [coachIdSnapshot, assignedCoachIdSnapshot] = await Promise.all([
        db.collection('users')
          .where('role', '==', 'athlete')
          .where('coachId', '==', coachId)
          .get(),
        db.collection('users')
          .where('role', '==', 'athlete')
          .where('assignedCoachId', '==', coachId)
          .get()
      ]);

      // Combine results and deduplicate
      const athleteSet = new Set();
      coachIdSnapshot.docs.forEach(doc => athleteSet.add(doc.id));
      assignedCoachIdSnapshot.docs.forEach(doc => athleteSet.add(doc.id));
      const assignedAthletes = Array.from(athleteSet);

      if (assignedAthletes.length === 0) {
        logger.log(`No athletes assigned to coach ${coachId}`);
        return null;
      }

      // Create roster
      await db.doc(`coach_rosters/${coachId}`).set({
        coachId,
        athletes: assignedAthletes,
        athleteCount: assignedAthletes.length,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.log(`✅ Created roster for coach ${coachId} with ${assignedAthletes.length} athletes (optimized query)`);

      // Continue with delivery
      await deliverLessonToAthletes(assignedAthletes, lessonId, coachId);
      return null;
    }

    const athletes = rosterDoc.data().athletes || [];

    if (athletes.length === 0) {
      logger.log(`Coach ${coachId} has no athletes in roster`);
      return null;
    }

    // Deliver lesson to all athletes
    await deliverLessonToAthletes(athletes, lessonId, coachId);

    const duration = Date.now() - startTime;
    logger.log({
      event: 'lesson_published_success',
      lessonId,
      coachId,
      athleteCount: athletes.length,
      duration_ms: duration,
      status: 'success'
    });

    return null;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      event: 'lesson_published_error',
      lessonId,
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
      status: 'failed'
    });
    throw error; // Let Firebase retry
  }
});

/**
 * Helper function to deliver a lesson to multiple athletes
 * Optimized for scale: Handles unlimited athletes with chunked batch processing
 */
async function deliverLessonToAthletes(athleteIds, lessonId, coachId) {
  const BATCH_SIZE = 450; // Leave buffer below 500 Firestore limit
  const executionId = Date.now().toString(); // For idempotency tracking

  let totalDelivered = 0;

  // Process in chunks to avoid batch size limits
  for (let i = 0; i < athleteIds.length; i += BATCH_SIZE) {
    const chunk = athleteIds.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const athleteId of chunk) {
      const feedRef = db.doc(`athlete_feed/${athleteId}`);

      batch.set(feedRef, {
        athleteId,
        coachId,
        availableLessons: FieldValue.arrayUnion(lessonId),
        totalLessons: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        // Track delivery for idempotency
        lastDeliveryExecutionId: executionId
      }, { merge: true });
    }

    await batch.commit();
    totalDelivered += chunk.length;

    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(athleteIds.length / BATCH_SIZE);
    logger.log(`✅ Batch ${batchNumber}/${totalBatches}: Delivered lesson ${lessonId} to ${chunk.length} athletes`);
  }

  logger.log(`✅ Total delivered: lesson ${lessonId} to ${totalDelivered} athletes`);
}

// ============================================================================
// FUNCTION 2: onAthleteAssigned
// Trigger: When athlete is assigned to a coach, give them all existing lessons
// ============================================================================

exports.onAthleteAssigned = onDocumentUpdated('users/{userId}', async (event) => {
  try {
    const userId = event.params.userId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only process athletes
    if (after.role !== 'athlete') {
      return null;
    }

    const oldCoachId = before.coachId || before.assignedCoachId;
    const newCoachId = after.coachId || after.assignedCoachId;

    // Check if coach assignment changed
    if (oldCoachId === newCoachId) {
      return null;
    }

    logger.log(`👤 Athlete ${userId} coach assignment changed: ${oldCoachId} → ${newCoachId}`);

    const batch = db.batch();

    // 1. Remove from old coach's roster (if exists)
    if (oldCoachId) {
      const oldRosterRef = db.doc(`coach_rosters/${oldCoachId}`);
      batch.update(oldRosterRef, {
        athletes: FieldValue.arrayRemove(userId),
        athleteCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.log(`➖ Removed athlete ${userId} from coach ${oldCoachId} roster`);
    }

    // 2. Add to new coach's roster (if exists)
    if (newCoachId) {
      const newRosterRef = db.doc(`coach_rosters/${newCoachId}`);

      // Check if roster exists
      const rosterDoc = await newRosterRef.get();

      if (rosterDoc.exists) {
        batch.update(newRosterRef, {
          athletes: FieldValue.arrayUnion(userId),
          athleteCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        // Create new roster
        batch.set(newRosterRef, {
          coachId: newCoachId,
          athletes: [userId],
          athleteCount: 1,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      logger.log(`➕ Added athlete ${userId} to coach ${newCoachId} roster`);

      // 3. Get all published lessons from new coach
      const lessonsSnapshot = await db.collection('content')
        .where('creatorUid', '==', newCoachId)
        .where('status', '==', 'published')
        .get();

      const availableLessons = lessonsSnapshot.docs.map(doc => doc.id);

      logger.log(`📚 Found ${availableLessons.length} published lessons from coach ${newCoachId}`);

      // 4. Create/update athlete feed with all lessons
      const feedRef = db.doc(`athlete_feed/${userId}`);

      batch.set(feedRef, {
        athleteId: userId,
        coachId: newCoachId,
        availableLessons,
        assignedLessons: [],
        completedLessons: [],
        totalLessons: availableLessons.length,
        completionRate: 0,
        unreadAnnouncements: 0,
        lastActivity: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.log(`✅ Created feed for athlete ${userId} with ${availableLessons.length} lessons`);
    }

    // Commit all changes atomically
    await batch.commit();

    logger.log(`✅ Successfully processed coach assignment change for athlete ${userId}`);
    return null;

  } catch (error) {
    logger.error('❌ Error in onAthleteAssigned:', error);
    throw error; // Let Firebase retry
  }
});

// ============================================================================
// FUNCTION 3: onLessonCompleted (Bonus - Track Progress)
// Trigger: Track when athlete marks a lesson as completed
// ============================================================================

exports.onLessonCompleted = onDocumentUpdated('athlete_feed/{athleteId}', async (event) => {
  try {
    const athleteId = event.params.athleteId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    const beforeCompleted = before.completedLessons || [];
    const afterCompleted = after.completedLessons || [];

    // Check if new lessons were completed
    const newCompletions = afterCompleted.filter(id => !beforeCompleted.includes(id));

    if (newCompletions.length === 0) {
      return null;
    }

    logger.log(`✅ Athlete ${athleteId} completed ${newCompletions.length} new lessons`);

    // Calculate completion rate
    const totalLessons = after.availableLessons.length;
    const completedLessons = after.completedLessons.length;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update completion rate
    await db.doc(`athlete_feed/${athleteId}`).update({
      completionRate,
      lastActivity: FieldValue.serverTimestamp()
    });

    logger.log(`📊 Updated completion rate for athlete ${athleteId}: ${completionRate}%`);

    return null;

  } catch (error) {
    logger.error('❌ Error in onLessonCompleted:', error);
    // Don't throw - this is non-critical
    return null;
  }
});

// ============================================================================
// HELPER FUNCTION: Manual Sync (Callable from client)
// Use this if data gets out of sync
// ============================================================================

exports.syncAthleteData = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    // Get user data
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    if (userData.role !== 'athlete') {
      throw new HttpsError('permission-denied', 'Only athletes can sync');
    }

    const coachId = userData.coachId || userData.assignedCoachId;

    if (!coachId) {
      return { success: true, message: 'No coach assigned', lessonCount: 0 };
    }

    // Get all published lessons from coach
    const lessonsSnapshot = await db.collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .get();

    const availableLessons = lessonsSnapshot.docs.map(doc => doc.id);

    // Update athlete feed
    await db.doc(`athlete_feed/${userId}`).set({
      athleteId: userId,
      coachId,
      availableLessons,
      totalLessons: availableLessons.length,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    logger.log(`✅ Manually synced ${availableLessons.length} lessons for athlete ${userId}`);

    return {
      success: true,
      message: `Synced ${availableLessons.length} lessons from your coach`,
      lessonCount: availableLessons.length
    };

  } catch (error) {
    logger.error('❌ Error in syncAthleteData:', error);
    throw new HttpsError('internal', 'Failed to sync data');
  }
});
