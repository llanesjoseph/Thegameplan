const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

async function checkAnalyticsData() {
  console.log('\n🔍 CHECKING FIRESTORE DATA FOR ANALYTICS\n');
  console.log('='.repeat(60));

  try {
    // Check Content Collection
    console.log('\n📊 CONTENT COLLECTION:');
    console.log('-'.repeat(60));

    const contentSnapshot = await db.collection('content').limit(10).get();
    console.log(`Total documents found: ${contentSnapshot.size}`);

    if (contentSnapshot.size > 0) {
      console.log('\nSample content documents:');
      contentSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
        const data = doc.data();
        console.log(`\n${idx + 1}. Document ID: ${doc.id}`);
        console.log(`   Title: ${data.title || 'NO TITLE'}`);
        console.log(`   CreatorUid: ${data.creatorUid || 'MISSING'}`);
        console.log(`   Views: ${data.views || 0}`);
        console.log(`   TotalWatchTime: ${data.totalWatchTime || 0}`);
        console.log(`   Completions: ${data.completions || 0}`);
        console.log(`   Status: ${data.status || 'MISSING'}`);
        console.log(`   Rating: ${data.rating || 'MISSING'}`);
        console.log(`   Fields: ${Object.keys(data).join(', ')}`);
      });
    } else {
      console.log('❌ NO CONTENT DOCUMENTS FOUND');
    }

    // Check Users Collection for Coaches
    console.log('\n\n👥 USERS COLLECTION (Coaches/Creators):');
    console.log('-'.repeat(60));

    const usersSnapshot = await db.collection('users').limit(20).get();
    console.log(`Total users found: ${usersSnapshot.size}`);

    const coaches = usersSnapshot.docs.filter(doc => {
      const role = doc.data().role;
      return role === 'coach' || role === 'creator' || role === 'superadmin';
    });

    console.log(`Coaches/Creators found: ${coaches.length}`);

    if (coaches.length > 0) {
      console.log('\nSample coach/creator profiles:');
      coaches.slice(0, 3).forEach((doc, idx) => {
        const data = doc.data();
        console.log(`\n${idx + 1}. User ID: ${doc.id}`);
        console.log(`   DisplayName: ${data.displayName || 'NO NAME'}`);
        console.log(`   Email: ${data.email || 'NO EMAIL'}`);
        console.log(`   Role: ${data.role || 'MISSING'}`);
        console.log(`   Followers: ${data.followers || 0}`);
        console.log(`   CreatedAt: ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'MISSING'}`);
      });
    } else {
      console.log('❌ NO COACHES/CREATORS FOUND');
    }

    // Check if content has creatorUid matching actual users
    console.log('\n\n🔗 CONTENT-TO-CREATOR MAPPING:');
    console.log('-'.repeat(60));

    if (contentSnapshot.size > 0) {
      const contentWithCreators = contentSnapshot.docs.filter(doc => doc.data().creatorUid);
      console.log(`Content with creatorUid: ${contentWithCreators.length}/${contentSnapshot.size}`);

      if (contentWithCreators.length > 0) {
        const sampleCreatorUid = contentWithCreators[0].data().creatorUid;
        const creatorDoc = await db.collection('users').doc(sampleCreatorUid).get();

        if (creatorDoc.exists) {
          console.log(`✅ Sample creatorUid maps to user: ${creatorDoc.data().displayName || creatorDoc.data().email}`);
        } else {
          console.log(`❌ Sample creatorUid does NOT map to any user`);
        }
      }
    }

    // Summary
    console.log('\n\n📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✓ Total Content Documents: ${contentSnapshot.size}`);
    console.log(`✓ Total Users: ${usersSnapshot.size}`);
    console.log(`✓ Coaches/Creators: ${coaches.length}`);

    const contentWithViews = contentSnapshot.docs.filter(doc => (doc.data().views || 0) > 0);
    console.log(`✓ Content with Views: ${contentWithViews.length}/${contentSnapshot.size}`);

    const contentWithCreatorUid = contentSnapshot.docs.filter(doc => doc.data().creatorUid);
    console.log(`✓ Content with CreatorUid: ${contentWithCreatorUid.length}/${contentSnapshot.size}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data check complete!\n');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkAnalyticsData();
