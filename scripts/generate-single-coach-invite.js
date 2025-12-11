/**
 * Generate a single generic coach invitation
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
const BASE_URL = 'https://athleap.crucibleanalytics.dev';

async function createCoachInvitation() {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const invitationCode = `inv_${timestamp}_${randomSuffix}`;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const invitationUrl = `${BASE_URL}/coach-onboard/${invitationCode}`;

  const invitationData = {
    id: invitationCode,
    type: 'coach_invitation',
    role: 'coach',
    coachEmail: '',
    coachName: '',
    sport: '',
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
    isGenericInvitation: true
  };

  await db.collection('invitations').doc(invitationCode).set(invitationData);

  console.log('\n' + '='.repeat(80));
  console.log('🎯 GENERIC COACH INVITATION CREATED');
  console.log('='.repeat(80));
  console.log(`\nCode: ${invitationCode}`);
  console.log(`URL:  ${invitationUrl}`);
  console.log('\n' + '='.repeat(80));
  console.log('✅ Invitation created successfully!');
  console.log('💡 Expires in 30 days');
  console.log('💡 User can enter their own email, name, and sport');
  console.log('='.repeat(80) + '\n');

  return invitationUrl;
}

createCoachInvitation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
