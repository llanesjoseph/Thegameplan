/**
 * CRITICAL: Coach-Athlete Data Flow Cloud Functions
 *
 * These functions ensure automated, real-time content delivery from coaches to athletes.
 * DO NOT modify without understanding the complete data flow architecture.
 *
 * See: /docs/COACH_ATHLETE_DATA_FLOW_SOLUTION.md for complete documentation
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// FUNCTION 1: onLessonPublished
// Trigger: When a lesson is published, deliver it to all assigned athletes
// ============================================================================

exports.onLessonPublished = functions.firestore
  .document('content/{lessonId}')
  .onWrite(async (change, context) => {
    try {
      const lessonId = context.params.lessonId;

      // If lesson was deleted, skip
      if (!change.after.exists) {
        console.log(`Lesson ${lessonId} was deleted, skipping`);
        return null;
      }

      const lessonData = change.after.data();
      const beforeData = change.before.exists ? change.before.data() : null;

      // Only process if status changed to 'published'
      const wasPublished = beforeData?.status === 'published';
      const isPublished = lessonData.status === 'published';

      if (isPublished && !wasPublished) {
        console.log(`✅ Lesson ${lessonId} was just published. Delivering to athletes...`);
      } else if (!isPublished) {
        console.log(`Lesson ${lessonId} is not published (status: ${lessonData.status}), skipping`);
        return null;
      } else {
        console.log(`Lesson ${lessonId} was already published, skipping delivery`);
        return null;
      }

      const coachId = lessonData.creatorUid;

      if (!coachId) {
        console.error(`❌ Lesson ${lessonId} has no creatorUid, cannot deliver`);
        return null;
      }

      // Get coach's roster
      const rosterDoc = await db.doc(`coach_rosters/${coachId}`).get();

      if (!rosterDoc.exists) {
        console.log(`⚠️ No roster found for coach ${coachId}. Creating roster...`);

        // Create roster by finding all athletes assigned to this coach
        const athletesSnapshot = await db.collection('users')
          .where('role', '==', 'athlete')
          .get();

        const assignedAthletes = athletesSnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.coachId === coachId || data.assignedCoachId === coachId;
          })
          .map(doc => doc.id);

        if (assignedAthletes.length === 0) {
          console.log(`No athletes assigned to coach ${coachId}`);
          return null;
        }

        // Create roster
        await db.doc(`coach_rosters/${coachId}`).set({
          coachId,
          athletes: assignedAthletes,
          athleteCount: assignedAthletes.length,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Created roster for coach ${coachId} with ${assignedAthletes.length} athletes`);

        // Continue with delivery
        await deliverLessonToAthletes(assignedAthletes, lessonId, coachId);
        return null;
      }

      const athletes = rosterDoc.data().athletes || [];

      if (athletes.length === 0) {
        console.log(`Coach ${coachId} has no athletes in roster`);
        return null;
      }

      // Deliver lesson to all athletes
      await deliverLessonToAthletes(athletes, lessonId, coachId);

      console.log(`✅ Successfully delivered lesson ${lessonId} to ${athletes.length} athletes`);
      return null;

    } catch (error) {
      console.error('❌ Error in onLessonPublished:', error);
      throw error; // Let Firebase retry
    }
  });

/**
 * Helper function to deliver a lesson to multiple athletes
 */
async function deliverLessonToAthletes(athleteIds, lessonId, coachId) {
  const batch = db.batch();

  for (const athleteId of athleteIds) {
    const feedRef = db.doc(`athlete_feed/${athleteId}`);

    batch.set(feedRef, {
      athleteId,
      coachId,
      availableLessons: admin.firestore.FieldValue.arrayUnion(lessonId),
      totalLessons: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Delivered lesson ${lessonId} to ${athleteIds.length} athletes`);
}

// ============================================================================
// FUNCTION 2: onAthleteAssigned
// Trigger: When athlete is assigned to a coach, give them all existing lessons
// ============================================================================

exports.onAthleteAssigned = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const userId = context.params.userId;
      const before = change.before.data();
      const after = change.after.data();

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

      console.log(`👤 Athlete ${userId} coach assignment changed: ${oldCoachId} → ${newCoachId}`);

      const batch = db.batch();

      // 1. Remove from old coach's roster (if exists)
      if (oldCoachId) {
        const oldRosterRef = db.doc(`coach_rosters/${oldCoachId}`);
        batch.update(oldRosterRef, {
          athletes: admin.firestore.FieldValue.arrayRemove(userId),
          athleteCount: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`➖ Removed athlete ${userId} from coach ${oldCoachId} roster`);
      }

      // 2. Add to new coach's roster (if exists)
      if (newCoachId) {
        const newRosterRef = db.doc(`coach_rosters/${newCoachId}`);

        // Check if roster exists
        const rosterDoc = await newRosterRef.get();

        if (rosterDoc.exists) {
          batch.update(newRosterRef, {
            athletes: admin.firestore.FieldValue.arrayUnion(userId),
            athleteCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create new roster
          batch.set(newRosterRef, {
            coachId: newCoachId,
            athletes: [userId],
            athleteCount: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        console.log(`➕ Added athlete ${userId} to coach ${newCoachId} roster`);

        // 3. Get all published lessons from new coach
        const lessonsSnapshot = await db.collection('content')
          .where('creatorUid', '==', newCoachId)
          .where('status', '==', 'published')
          .get();

        const availableLessons = lessonsSnapshot.docs.map(doc => doc.id);

        console.log(`📚 Found ${availableLessons.length} published lessons from coach ${newCoachId}`);

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
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Created feed for athlete ${userId} with ${availableLessons.length} lessons`);
      }

      // Commit all changes atomically
      await batch.commit();

      console.log(`✅ Successfully processed coach assignment change for athlete ${userId}`);
      return null;

    } catch (error) {
      console.error('❌ Error in onAthleteAssigned:', error);
      throw error; // Let Firebase retry
    }
  });

// ============================================================================
// FUNCTION 3: onLessonCompleted (Bonus - Track Progress)
// Trigger: Track when athlete marks a lesson as completed
// ============================================================================

exports.onLessonCompleted = functions.firestore
  .document('athlete_feed/{athleteId}')
  .onUpdate(async (change, context) => {
    try {
      const athleteId = context.params.athleteId;
      const before = change.before.data();
      const after = change.after.data();

      const beforeCompleted = before.completedLessons || [];
      const afterCompleted = after.completedLessons || [];

      // Check if new lessons were completed
      const newCompletions = afterCompleted.filter(id => !beforeCompleted.includes(id));

      if (newCompletions.length === 0) {
        return null;
      }

      console.log(`✅ Athlete ${athleteId} completed ${newCompletions.length} new lessons`);

      // Calculate completion rate
      const totalLessons = after.availableLessons.length;
      const completedLessons = after.completedLessons.length;
      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Update completion rate
      await db.doc(`athlete_feed/${athleteId}`).update({
        completionRate,
        lastActivity: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`📊 Updated completion rate for athlete ${athleteId}: ${completionRate}%`);

      return null;

    } catch (error) {
      console.error('❌ Error in onLessonCompleted:', error);
      // Don't throw - this is non-critical
      return null;
    }
  });

// ============================================================================
// HELPER FUNCTION: Manual Sync (Callable from client)
// Use this if data gets out of sync
// ============================================================================

exports.syncAthleteData = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user data
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    if (userData.role !== 'athlete') {
      throw new functions.https.HttpsError('permission-denied', 'Only athletes can sync');
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Manually synced ${availableLessons.length} lessons for athlete ${userId}`);

    return {
      success: true,
      message: `Synced ${availableLessons.length} lessons from your coach`,
      lessonCount: availableLessons.length
    };

  } catch (error) {
    console.error('❌ Error in syncAthleteData:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync data');
  }
});
