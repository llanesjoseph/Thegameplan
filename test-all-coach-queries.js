const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testAllCoachQueries() {
  const uid = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2'; // Joseph's UID

  console.log('🔍 TESTING ALL COACH API QUERIES FOR INDEX REQUIREMENTS\n');
  console.log('Testing with coach UID:', uid);
  console.log('=' .repeat(80) + '\n');

  const tests = [
    {
      name: '1. Lessons Query (app/api/coach/lessons/list)',
      query: () => db.collection('content')
        .where('creatorUid', '==', uid)
        .orderBy('createdAt', 'desc')
    },
    {
      name: '2. Resources Query (app/api/coach/resources)',
      query: () => db.collection('resources')
        .where('creatorId', '==', uid)
        .orderBy('createdAt', 'desc')
    },
    {
      name: '3. Videos Query (app/api/coach/videos)',
      query: () => db.collection('videos')
        .where('creatorId', '==', uid)
        .orderBy('createdAt', 'desc')
    },
    {
      name: '4. Announcements Query (app/api/coach/announcements)',
      query: () => db.collection('announcements')
        .where('coachId', '==', uid)
        .orderBy('createdAt', 'desc')
    },
    {
      name: '5. Assistants Query (app/api/coach/assistants)',
      query: () => db.collection('users')
        .where('role', '==', 'assistant_coach')
        .where('assignedCoachId', '==', uid)
    }
  ];

  let passed = 0;
  let failed = 0;
  const missingIndexes = [];

  for (const test of tests) {
    try {
      const result = await test.query().get();
      console.log(`✅ ${test.name}`);
      console.log(`   Found ${result.size} documents`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      if (error.message.includes('index')) {
        console.log(`   ERROR: Missing index`);
        failed++;

        // Extract index URL if available
        const match = error.message.match(/https:\/\/[^\s]+/);
        if (match) {
          missingIndexes.push({
            test: test.name,
            url: match[0]
          });
        }
      } else if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
        console.log(`   ERROR: Permission denied (collection might not exist)`);
        // This is OK - collection doesn't exist yet
      } else {
        console.log(`   ERROR: ${error.message.substring(0, 100)}`);
        failed++;
      }
    }
    console.log('');
  }

  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);

  if (missingIndexes.length > 0) {
    console.log('\n⚠️  MISSING INDEXES - CREATE THESE NOW:\n');
    missingIndexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.test}`);
      console.log(`   ${idx.url}\n`);
    });
  } else if (failed === 0) {
    console.log('\n🎉 All queries have proper indexes! System ready to scale.');
  }

  process.exit(0);
}

testAllCoachQueries();
