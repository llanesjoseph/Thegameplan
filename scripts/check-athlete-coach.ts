// Diagnostic script to check if athlete has coach assigned
// Run with: npx ts-node scripts/check-athlete-coach.ts <athlete-email>

import { adminDb } from '../lib/firebase.admin';

async function checkAthleteCoach(email: string) {
  try {
    console.log(`\nChecking athlete: ${email}\n`);

    // Find user by email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found with email:', email);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log('✅ User found:');
    console.log('  UID:', userDoc.id);
    console.log('  Name:', userData.displayName || userData.name);
    console.log('  Role:', userData.role);
    console.log('  Coach ID:', userData.coachId || userData.assignedCoachId || 'NONE ASSIGNED ❌');

    // Check if coach exists if assigned
    const coachId = userData.coachId || userData.assignedCoachId;
    if (coachId) {
      const coachDoc = await adminDb.collection('users').doc(coachId).get();

      if (!coachDoc.exists) {
        console.log('\n❌ PROBLEM: Coach ID is set but coach does not exist!');
        console.log('   Fix: Assign a valid coach to this athlete');
      } else {
        const coachData = coachDoc.data();
        console.log('\n✅ Coach found:');
        console.log('  Name:', coachData?.displayName || coachData?.name);
        console.log('  Email:', coachData?.email);
        console.log('  Role:', coachData?.role);

        if (coachData?.role !== 'coach' && coachData?.role !== 'creator') {
          console.log('\n⚠️  WARNING: Assigned coach does not have coach/creator role!');
        }
      }
    } else {
      console.log('\n❌ PROBLEM: No coach assigned to this athlete');
      console.log('   Fix: Assign a coach in the admin panel');
      console.log('   OR run: npm run assign-coach <athlete-email> <coach-email>');
    }

    // Check custom claims
    const auth = (await import('../lib/firebase.admin')).auth;
    const userRecord = await auth.getUserByEmail(email);
    console.log('\n📋 Custom Claims:', userRecord.customClaims || 'NONE SET ⚠️');

  } catch (error) {
    console.error('Error:', error);
  }
}

const athleteEmail = process.argv[2];

if (!athleteEmail) {
  console.log('Usage: npx ts-node scripts/check-athlete-coach.ts <athlete-email>');
  process.exit(1);
}

checkAthleteCoach(athleteEmail);
