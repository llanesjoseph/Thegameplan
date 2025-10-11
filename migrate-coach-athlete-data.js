/**
 * DATA MIGRATION: Backfill Coach Rosters and Athlete Feeds
 *
 * This script creates:
 * - coach_rosters collection (maps coaches to their athletes)
 * - athlete_feed collection (gives athletes instant access to coach's lessons)
 *
 * Run this ONCE after deploying Cloud Functions to backfill existing data.
 *
 * Usage: node migrate-coach-athlete-data.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  console.log('🚀 Starting Coach-Athlete Data Migration...\n');

  try {
    // Step 1: Get all users
    console.log('📊 Step 1: Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    const coaches = users.filter(u => u.role === 'coach' || u.role === 'creator' || u.role === 'assistant_coach');
    const athletes = users.filter(u => u.role === 'athlete');

    console.log(`✅ Found ${coaches.length} coaches and ${athletes.length} athletes\n`);

    // Step 2: Build coach-athlete relationships
    console.log('🔗 Step 2: Building coach-athlete relationships...');
    const coachAthleteMap = {};

    athletes.forEach(athlete => {
      const coachId = athlete.coachId || athlete.assignedCoachId;

      if (coachId) {
        if (!coachAthleteMap[coachId]) {
          coachAthleteMap[coachId] = [];
        }
        coachAthleteMap[coachId].push(athlete.uid);
      }
    });

    console.log(`✅ Found ${Object.keys(coachAthleteMap).length} coaches with assigned athletes\n`);

    // Step 3: Create coach_rosters collection
    console.log('📝 Step 3: Creating coach_rosters...');
    const rosterBatch = db.batch();
    let rosterCount = 0;

    for (const [coachId, athleteIds] of Object.entries(coachAthleteMap)) {
      const rosterRef = db.doc(`coach_rosters/${coachId}`);

      rosterBatch.set(rosterRef, {
        coachId,
        athletes: athleteIds,
        athleteCount: athleteIds.length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      rosterCount++;

      const coach = users.find(u => u.uid === coachId);
      console.log(`  ✅ Roster for ${coach?.displayName || coach?.email || coachId}: ${athleteIds.length} athletes`);
    }

    if (rosterCount > 0) {
      await rosterBatch.commit();
      console.log(`\n✅ Created ${rosterCount} coach rosters\n`);
    } else {
      console.log(`\n⚠️ No coach rosters to create (no athletes assigned to coaches)\n`);
    }

    // Step 4: Get all published lessons
    console.log('📚 Step 4: Fetching all published lessons...');
    const contentSnapshot = await db.collection('content')
      .where('status', '==', 'published')
      .get();

    const lessons = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Found ${lessons.length} published lessons\n`);

    // Group lessons by coach
    const lessonsByCoach = {};
    lessons.forEach(lesson => {
      if (!lessonsByCoach[lesson.creatorUid]) {
        lessonsByCoach[lesson.creatorUid] = [];
      }
      lessonsByCoach[lesson.creatorUid].push(lesson.id);
    });

    console.log('📖 Lessons by coach:');
    Object.entries(lessonsByCoach).forEach(([coachId, lessonIds]) => {
      const coach = users.find(u => u.uid === coachId);
      console.log(`  - ${coach?.displayName || coach?.email || coachId}: ${lessonIds.length} lessons`);
    });
    console.log('');

    // Step 5: Create athlete_feed collection
    console.log('🎯 Step 5: Creating athlete_feed for all athletes...');
    const feedBatch = db.batch();
    let feedCount = 0;

    for (const athlete of athletes) {
      const coachId = athlete.coachId || athlete.assignedCoachId;

      if (!coachId) {
        console.log(`  ⚠️ Skipping ${athlete.displayName || athlete.email}: No coach assigned`);
        continue;
      }

      const availableLessons = lessonsByCoach[coachId] || [];

      const feedRef = db.doc(`athlete_feed/${athlete.uid}`);

      feedBatch.set(feedRef, {
        athleteId: athlete.uid,
        coachId,
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

      feedCount++;

      const coach = users.find(u => u.uid === coachId);
      console.log(`  ✅ Feed for ${athlete.displayName || athlete.email}: ${availableLessons.length} lessons from ${coach?.displayName || coach?.email}`);
    }

    if (feedCount > 0) {
      await feedBatch.commit();
      console.log(`\n✅ Created ${feedCount} athlete feeds\n`);
    } else {
      console.log(`\n⚠️ No athlete feeds to create (no athletes with assigned coaches)\n`);
    }

    // Summary
    console.log('🎉 MIGRATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`  - ${rosterCount} coach rosters created`);
    console.log(`  - ${feedCount} athlete feeds created`);
    console.log(`  - ${lessons.length} total lessons available`);
    console.log('');
    console.log('✅ Next Steps:');
    console.log('  1. Deploy Cloud Functions: firebase deploy --only functions');
    console.log('  2. Verify athlete can see lessons in dashboard');
    console.log('  3. Test: Coach publishes new lesson → Athlete receives it automatically');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
