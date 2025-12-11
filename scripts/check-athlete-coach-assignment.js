const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAthleteCoachAssignment() {
  try {
    console.log('\n🔍 Checking athlete coach assignment...\n');

    // Find the athlete by email
    const athleteEmail = 'bigpenger@gmail.com';
    const usersSnapshot = await db.collection('users')
      .where('email', '==', athleteEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ Athlete not found with email:', athleteEmail);
      return;
    }

    const athleteDoc = usersSnapshot.docs[0];
    const athleteData = athleteDoc.data();
    console.log('✅ Found athlete:');
    console.log('  - UID:', athleteDoc.id);
    console.log('  - Email:', athleteData.email);
    console.log('  - Name:', athleteData.displayName);
    console.log('  - Role:', athleteData.role);
    console.log('  - Coach ID:', athleteData.coachId || 'NOT SET');
    console.log('  - Assigned Coach ID:', athleteData.assignedCoachId || 'NOT SET');

    // Find the coach by slug
    const coachSlug = 'llanes-joseph-m';
    const coachSnapshot = await db.collection('users')
      .where('slug', '==', coachSlug)
      .limit(1)
      .get();

    if (coachSnapshot.empty) {
      console.log('\n❌ Coach not found with slug:', coachSlug);
      console.log('\n🔍 Searching for coaches with similar names...');

      const allCoachesSnapshot = await db.collection('users')
        .where('role', '==', 'coach')
        .get();

      console.log(`\nFound ${allCoachesSnapshot.size} coaches:`);
      allCoachesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.displayName || data.email} (${doc.id})`);
        console.log(`    Email: ${data.email}`);
        console.log(`    Slug: ${data.slug || 'NO SLUG'}`);
      });
      return;
    }

    const coachDoc = coachSnapshot.docs[0];
    const coachData = coachDoc.data();
    console.log('\n✅ Found coach:');
    console.log('  - UID:', coachDoc.id);
    console.log('  - Email:', coachData.email);
    console.log('  - Name:', coachData.displayName);
    console.log('  - Slug:', coachData.slug);
    console.log('  - Role:', coachData.role);

    // Check if assignment is needed
    if (athleteData.coachId === coachDoc.id || athleteData.assignedCoachId === coachDoc.id) {
      console.log('\n✅ Athlete is already assigned to this coach!');
    } else {
      console.log('\n❌ Athlete is NOT assigned to this coach');
      console.log('\n💡 To assign, run:');
      console.log(`\ndb.collection('users').doc('${athleteDoc.id}').update({`);
      console.log(`  coachId: '${coachDoc.id}',`);
      console.log(`  assignedCoachId: '${coachDoc.id}'`);
      console.log(`});`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAthleteCoachAssignment();
