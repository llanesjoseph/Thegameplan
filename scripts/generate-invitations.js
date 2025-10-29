/**
 * Generate invitation URLs for testing
 * Creates 5 coach invitations, 5 athlete invitations, and 1 test invitation
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

// Base URL for invitations
const BASE_URL = 'https://athleap.crucibleanalytics.dev';

// Sports for variety
const SPORTS = ['Soccer', 'Basketball', 'Football', 'Baseball', 'Volleyball'];

/**
 * Generate a unique invitation code
 */
function generateInvitationCode(type) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  if (type === 'coach') {
    return `inv_${timestamp}_${randomSuffix}`;
  } else {
    return `athlete-invite-${timestamp}-${randomSuffix}`;
  }
}

/**
 * Create a coach invitation
 */
async function createCoachInvitation(index) {
  const invitationCode = generateInvitationCode('coach');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

  const invitationUrl = `${BASE_URL}/coach-onboard/${invitationCode}`;

  const invitationData = {
    id: invitationCode,
    type: 'coach_invitation',
    role: 'coach',
    coachEmail: '',  // Empty - user will provide their own
    coachName: '',   // Empty - user will provide their own
    sport: '',       // Empty - user will select their sport
    customMessage: `Join AthLeap as a coach and help athletes reach their full potential!`,
    invitationUrl,
    status: 'pending',
    createdBy: 'system',
    createdByName: 'System Generated',
    createdAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    used: false,
    usedAt: null,
    usedBy: null,
    emailSent: false,
    emailError: 'Email not sent - generic invitation for direct URL sharing',
    isGenericInvitation: true  // Flag to indicate this is a generic invitation
  };

  await db.collection('invitations').doc(invitationCode).set(invitationData);

  return {
    type: 'Coach',
    number: index + 1,
    sport: 'General',
    url: invitationUrl,
    code: invitationCode
  };
}

/**
 * Create an athlete invitation
 */
async function createAthleteInvitation(index) {
  const invitationCode = generateInvitationCode('athlete');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

  const invitationUrl = `${BASE_URL}/athlete-onboard/${invitationCode}`;

  const invitationData = {
    id: invitationCode,
    type: 'athlete_invitation',
    role: 'athlete',
    athleteEmail: '',  // Empty - user will provide their own
    athleteName: '',   // Empty - user will provide their own
    sport: '',         // Empty - user will select their sport
    invitationUrl,
    status: 'pending',
    creatorUid: 'system',
    creatorName: 'System Generated',
    createdAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    used: false,
    usedAt: null,
    usedBy: null,
    emailSent: false,
    emailError: 'Email not sent - generic invitation for direct URL sharing',
    isGenericInvitation: true  // Flag to indicate this is a generic invitation
  };

  await db.collection('invitations').doc(invitationCode).set(invitationData);

  return {
    type: 'Athlete',
    number: index + 1,
    sport: 'General',
    url: invitationUrl,
    code: invitationCode
  };
}

/**
 * Main function to generate all invitations
 */
async function generateAllInvitations() {
  console.log('🎯 Starting invitation generation...\n');

  const results = {
    coaches: [],
    athletes: [],
    test: null
  };

  try {
    // Generate 5 coach invitations
    console.log('👨‍🏫 Creating 5 generic coach invitations...');
    for (let i = 0; i < 5; i++) {
      const invitation = await createCoachInvitation(i);
      results.coaches.push(invitation);
      console.log(`  ✅ Coach ${i + 1}: Generic invitation created`);
    }

    // Generate 5 athlete invitations
    console.log('\n🏃 Creating 5 generic athlete invitations...');
    for (let i = 0; i < 5; i++) {
      const invitation = await createAthleteInvitation(i);
      results.athletes.push(invitation);
      console.log(`  ✅ Athlete ${i + 1}: Generic invitation created`);
    }

    // Generate 1 test invitation (athlete)
    console.log('\n🧪 Creating 1 test invitation...');
    const testInvitation = await createAthleteInvitation(99);
    testInvitation.number = 'TEST';
    results.test = testInvitation;
    console.log(`  ✅ Test: Generic invitation created`);

    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 INVITATION URLS SUMMARY');
    console.log('='.repeat(80));

    console.log('\n👨‍🏫 COACH INVITATIONS (5):');
    console.log('-'.repeat(80));
    results.coaches.forEach((inv, idx) => {
      console.log(`\n${idx + 1}. Generic Coach Invitation`);
      console.log(`   Code:  ${inv.code}`);
      console.log(`   URL:   ${inv.url}`);
    });

    console.log('\n\n🏃 ATHLETE INVITATIONS (5):');
    console.log('-'.repeat(80));
    results.athletes.forEach((inv, idx) => {
      console.log(`\n${idx + 1}. Generic Athlete Invitation`);
      console.log(`   Code:  ${inv.code}`);
      console.log(`   URL:   ${inv.url}`);
    });

    console.log('\n\n🧪 TEST INVITATION:');
    console.log('-'.repeat(80));
    console.log(`\nGeneric Test Invitation (Athlete)`);
    console.log(`   Code:  ${results.test.code}`);
    console.log(`   URL:   ${results.test.url}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All 11 invitations created successfully!');
    console.log('='.repeat(80));
    console.log('\n💡 Note: All invitations expire in 30 days and are marked as pending.');
    console.log('💡 No emails were sent - these are test invitations for direct URL access.\n');

  } catch (error) {
    console.error('❌ Error generating invitations:', error);
    throw error;
  }
}

// Run the script
generateAllInvitations()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
