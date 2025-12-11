// Reset Stripe subscription status for a user
// Usage: node scripts/reset-stripe-user.js

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetStripeUser(email) {
  console.log(`Looking for user with email: ${email}`);

  // Find user by email
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.log('❌ User not found with that email');
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log(`\nFound user: ${userId}`);
  console.log(`Current subscription data:`, JSON.stringify(userData.subscription, null, 2));
  console.log(`Current access data:`, JSON.stringify(userData.access, null, 2));

  // Reset subscription and access fields
  await db.collection('users').doc(userId).update({
    'subscription': admin.firestore.FieldValue.delete(),
    'access': admin.firestore.FieldValue.delete(),
    'stripeCustomerId': admin.firestore.FieldValue.delete(),
    updatedAt: new Date(),
  });

  console.log(`\n✅ Stripe subscription data cleared for ${email}`);
  console.log('User can now subscribe fresh.');
}

const email = process.argv[2] || 'bigpenger@gmail.com';
resetStripeUser(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
