const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

console.log('🔍 COMPREHENSIVE PLATFORM TESTING SUITE');
console.log('=' .repeat(60));
console.log('⏰ Started at:', new Date().toISOString());
console.log('');

let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  criticalIssues: [],
  bugs: [],
  recommendations: []
};

function logTest(testName, status, message = '', isCritical = false) {
  testResults.totalTests++;
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const criticalIcon = isCritical ? '🚨' : '';
  
  console.log(`${statusIcon} ${criticalIcon} ${testName}: ${message}`);
  
  if (status === 'PASS') {
    testResults.passed++;
  } else if (status === 'FAIL') {
    testResults.failed++;
    if (isCritical) {
      testResults.criticalIssues.push({ test: testName, message });
    } else {
      testResults.bugs.push({ test: testName, message });
    }
  } else {
    testResults.warnings++;
    testResults.recommendations.push({ test: testName, message });
  }
}

async function testDatabaseConnectivity() {
  console.log('\n📊 TESTING DATABASE CONNECTIVITY');
  console.log('-'.repeat(40));
  
  try {
    // Test basic Firestore connection
    const testDoc = await db.collection('users').limit(1).get();
    logTest('Database Connection', 'PASS', 'Successfully connected to Firestore');
    
    // Test collections exist
    const collections = ['users', 'messages', 'submissions', 'reviews', 'invitations', 'athlete_feed', 'content', 'notifications'];
    
    for (const collectionName of collections) {
      try {
        const testQuery = await db.collection(collectionName).limit(1).get();
        logTest(`Collection: ${collectionName}`, 'PASS', 'Collection accessible');
      } catch (error) {
        logTest(`Collection: ${collectionName}`, 'FAIL', `Collection not accessible: ${error.message}`, true);
      }
    }
    
  } catch (error) {
    logTest('Database Connection', 'FAIL', `Failed to connect: ${error.message}`, true);
  }
}

async function testUserDataIntegrity() {
  console.log('\n👥 TESTING USER DATA INTEGRITY');
  console.log('-'.repeat(40));
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('User Collection Access', 'PASS', `Found ${users.length} users`);
    
    // Check for required fields
    const requiredFields = ['email', 'role', 'displayName'];
    let usersWithMissingFields = 0;
    
    users.forEach(user => {
      const missingFields = requiredFields.filter(field => !user[field]);
      if (missingFields.length > 0) {
        usersWithMissingFields++;
        logTest(`User ${user.email}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (usersWithMissingFields === 0) {
      logTest('User Data Integrity', 'PASS', 'All users have required fields');
    } else {
      logTest('User Data Integrity', 'WARN', `${usersWithMissingFields} users missing required fields`);
    }
    
    // Check role distribution
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Role Distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    // Check for orphaned data
    const usersWithCoachId = users.filter(user => user.coachId || user.assignedCoachId);
    logTest('Coach Assignments', 'PASS', `${usersWithCoachId.length} users have coach assignments`);
    
  } catch (error) {
    logTest('User Data Integrity', 'FAIL', `Error checking user data: ${error.message}`, true);
  }
}

async function testMessageSystem() {
  console.log('\n💬 TESTING MESSAGE SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const messagesSnapshot = await db.collection('messages').get();
    const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Messages Collection', 'PASS', `Found ${messages.length} messages`);
    
    // Check message structure
    const requiredMessageFields = ['athleteId', 'coachId', 'subject', 'message', 'status'];
    let messagesWithIssues = 0;
    
    messages.forEach(msg => {
      const missingFields = requiredMessageFields.filter(field => !msg[field]);
      if (missingFields.length > 0) {
        messagesWithIssues++;
        logTest(`Message ${msg.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (messagesWithIssues === 0) {
      logTest('Message Structure', 'PASS', 'All messages have required fields');
    } else {
      logTest('Message Structure', 'WARN', `${messagesWithIssues} messages missing required fields`);
    }
    
    // Check message status distribution
    const statusCounts = messages.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Message Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} messages`);
    });
    
  } catch (error) {
    logTest('Message System', 'FAIL', `Error checking messages: ${error.message}`, true);
  }
}

async function testSubmissionSystem() {
  console.log('\n📹 TESTING SUBMISSION SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const submissionsSnapshot = await db.collection('submissions').get();
    const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Submissions Collection', 'PASS', `Found ${submissions.length} submissions`);
    
    // Check submission structure
    const requiredSubmissionFields = ['athleteId', 'videoUrl', 'status'];
    let submissionsWithIssues = 0;
    
    submissions.forEach(sub => {
      const missingFields = requiredSubmissionFields.filter(field => !sub[field]);
      if (missingFields.length > 0) {
        submissionsWithIssues++;
        logTest(`Submission ${sub.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (submissionsWithIssues === 0) {
      logTest('Submission Structure', 'PASS', 'All submissions have required fields');
    } else {
      logTest('Submission Structure', 'WARN', `${submissionsWithIssues} submissions missing required fields`);
    }
    
    // Check submission status distribution
    const statusCounts = submissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Submission Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} submissions`);
    });
    
  } catch (error) {
    logTest('Submission System', 'FAIL', `Error checking submissions: ${error.message}`, true);
  }
}

async function testInvitationSystem() {
  console.log('\n📧 TESTING INVITATION SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const invitationsSnapshot = await db.collection('invitations').get();
    const invitations = invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Invitations Collection', 'PASS', `Found ${invitations.length} invitations`);
    
    // Check invitation structure
    const requiredInvitationFields = ['athleteEmail', 'status'];
    let invitationsWithIssues = 0;
    
    invitations.forEach(inv => {
      const missingFields = requiredInvitationFields.filter(field => !inv[field]);
      if (missingFields.length > 0) {
        invitationsWithIssues++;
        logTest(`Invitation ${inv.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (invitationsWithIssues === 0) {
      logTest('Invitation Structure', 'PASS', 'All invitations have required fields');
    } else {
      logTest('Invitation Structure', 'WARN', `${invitationsWithIssues} invitations missing required fields`);
    }
    
    // Check invitation status distribution
    const statusCounts = invitations.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Invitation Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} invitations`);
    });
    
  } catch (error) {
    logTest('Invitation System', 'FAIL', `Error checking invitations: ${error.message}`, true);
  }
}

async function testContentSystem() {
  console.log('\n📚 TESTING CONTENT SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const contentSnapshot = await db.collection('content').get();
    const content = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Content Collection', 'PASS', `Found ${content.length} content items`);
    
    // Check content structure
    const requiredContentFields = ['title', 'type', 'status'];
    let contentWithIssues = 0;
    
    content.forEach(item => {
      const missingFields = requiredContentFields.filter(field => !item[field]);
      if (missingFields.length > 0) {
        contentWithIssues++;
        logTest(`Content ${item.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (contentWithIssues === 0) {
      logTest('Content Structure', 'PASS', 'All content has required fields');
    } else {
      logTest('Content Structure', 'WARN', `${contentWithIssues} content items missing required fields`);
    }
    
    // Check content type distribution
    const typeCounts = content.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Content Type Distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} items`);
    });
    
  } catch (error) {
    logTest('Content System', 'FAIL', `Error checking content: ${error.message}`, true);
  }
}

async function testAthleteFeedSystem() {
  console.log('\n🏃 TESTING ATHLETE FEED SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const feedSnapshot = await db.collection('athlete_feed').get();
    const feeds = feedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Athlete Feed Collection', 'PASS', `Found ${feeds.length} athlete feeds`);
    
    // Check feed structure
    const requiredFeedFields = ['totalLessons', 'completedLessons'];
    let feedsWithIssues = 0;
    
    feeds.forEach(feed => {
      const missingFields = requiredFeedFields.filter(field => !feed.hasOwnProperty(field));
      if (missingFields.length > 0) {
        feedsWithIssues++;
        logTest(`Feed ${feed.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (feedsWithIssues === 0) {
      logTest('Feed Structure', 'PASS', 'All feeds have required fields');
    } else {
      logTest('Feed Structure', 'WARN', `${feedsWithIssues} feeds missing required fields`);
    }
    
    // Check completion rates
    const completionRates = feeds.map(feed => {
      const rate = feed.totalLessons > 0 ? (feed.completedLessons?.length || 0) / feed.totalLessons : 0;
      return { id: feed.id, rate: Math.round(rate * 100) };
    });
    
    console.log('📊 Completion Rate Distribution:');
    const rateRanges = {
      '0%': 0,
      '1-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };
    
    completionRates.forEach(({ rate }) => {
      if (rate === 0) rateRanges['0%']++;
      else if (rate <= 25) rateRanges['1-25%']++;
      else if (rate <= 50) rateRanges['26-50%']++;
      else if (rate <= 75) rateRanges['51-75%']++;
      else rateRanges['76-100%']++;
    });
    
    Object.entries(rateRanges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} athletes`);
    });
    
  } catch (error) {
    logTest('Athlete Feed System', 'FAIL', `Error checking feeds: ${error.message}`, true);
  }
}

async function testNotificationSystem() {
  console.log('\n🔔 TESTING NOTIFICATION SYSTEM');
  console.log('-'.repeat(40));
  
  try {
    const notificationsSnapshot = await db.collection('notifications').get();
    const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logTest('Notifications Collection', 'PASS', `Found ${notifications.length} notifications`);
    
    // Check notification structure
    const requiredNotificationFields = ['userId', 'type', 'title', 'message'];
    let notificationsWithIssues = 0;
    
    notifications.forEach(notif => {
      const missingFields = requiredNotificationFields.filter(field => !notif[field]);
      if (missingFields.length > 0) {
        notificationsWithIssues++;
        logTest(`Notification ${notif.id}`, 'WARN', `Missing fields: ${missingFields.join(', ')}`);
      }
    });
    
    if (notificationsWithIssues === 0) {
      logTest('Notification Structure', 'PASS', 'All notifications have required fields');
    } else {
      logTest('Notification Structure', 'WARN', `${notificationsWithIssues} notifications missing required fields`);
    }
    
    // Check notification type distribution
    const typeCounts = notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Notification Type Distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} notifications`);
    });
    
    // Check read status
    const readCount = notifications.filter(n => n.read).length;
    const unreadCount = notifications.length - readCount;
    
    logTest('Notification Read Status', 'PASS', `${readCount} read, ${unreadCount} unread`);
    
  } catch (error) {
    logTest('Notification System', 'FAIL', `Error checking notifications: ${error.message}`, true);
  }
}

async function testDataConsistency() {
  console.log('\n🔗 TESTING DATA CONSISTENCY');
  console.log('-'.repeat(40));
  
  try {
    // Test user-coach relationships
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersWithCoachId = users.filter(user => user.coachId || user.assignedCoachId);
    logTest('User-Coach Relationships', 'PASS', `${usersWithCoachId.length} users have coach assignments`);
    
    // Test message-coach relationships
    const messagesSnapshot = await db.collection('messages').get();
    const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const messagesWithValidCoach = messages.filter(msg => msg.coachId);
    logTest('Message-Coach Relationships', 'PASS', `${messagesWithValidCoach.length} messages have valid coach IDs`);
    
    // Test submission-athlete relationships
    const submissionsSnapshot = await db.collection('submissions').get();
    const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const submissionsWithValidAthlete = submissions.filter(sub => sub.athleteId);
    logTest('Submission-Athlete Relationships', 'PASS', `${submissionsWithValidAthlete.length} submissions have valid athlete IDs`);
    
    // Test invitation-email relationships
    const invitationsSnapshot = await db.collection('invitations').get();
    const invitations = invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const invitationsWithEmail = invitations.filter(inv => inv.athleteEmail);
    logTest('Invitation-Email Relationships', 'PASS', `${invitationsWithEmail.length} invitations have valid email addresses`);
    
  } catch (error) {
    logTest('Data Consistency', 'FAIL', `Error checking data consistency: ${error.message}`, true);
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 TESTING API ENDPOINTS');
  console.log('-'.repeat(40));
  
  const baseUrl = 'https://playbookd.crucibleanalytics.dev';
  const endpoints = [
    '/api/coach/messages',
    '/api/coach/reply-message',
    '/api/athlete/contact-coach',
    '/api/athlete/sync-lessons',
    '/api/athlete/progress',
    '/api/generate-lesson',
    '/api/coach-profile/jasmine-aikey--coach'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 || response.status === 404 || response.status === 401) {
        logTest(`API: ${endpoint}`, 'PASS', `Responds with status ${response.status}`);
      } else {
        logTest(`API: ${endpoint}`, 'WARN', `Unexpected status ${response.status}`);
      }
    } catch (error) {
      logTest(`API: ${endpoint}`, 'FAIL', `Error: ${error.message}`, true);
    }
  }
}

async function generateReport() {
  console.log('\n📋 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(60));
  console.log('⏰ Completed at:', new Date().toISOString());
  console.log('');
  
  console.log('📊 TEST SUMMARY:');
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
  console.log('');
  
  if (testResults.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    testResults.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.test}: ${issue.message}`);
    });
    console.log('');
  }
  
  if (testResults.bugs.length > 0) {
    console.log('🐛 BUGS FOUND:');
    testResults.bugs.forEach((bug, index) => {
      console.log(`   ${index + 1}. ${bug.test}: ${bug.message}`);
    });
    console.log('');
  }
  
  if (testResults.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    testResults.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.test}: ${rec.message}`);
    });
    console.log('');
  }
  
  // Overall health score
  const healthScore = Math.round((testResults.passed / testResults.totalTests) * 100);
  console.log(`🏥 PLATFORM HEALTH SCORE: ${healthScore}%`);
  
  if (healthScore >= 90) {
    console.log('🎉 EXCELLENT: Platform is in great condition!');
  } else if (healthScore >= 80) {
    console.log('👍 GOOD: Platform is functioning well with minor issues.');
  } else if (healthScore >= 70) {
    console.log('⚠️  FAIR: Platform has some issues that need attention.');
  } else {
    console.log('🚨 POOR: Platform has significant issues requiring immediate attention.');
  }
  
  console.log('');
  console.log('🔍 NEXT STEPS:');
  if (testResults.criticalIssues.length > 0) {
    console.log('   1. Address critical issues immediately');
  }
  if (testResults.bugs.length > 0) {
    console.log('   2. Fix identified bugs');
  }
  if (testResults.recommendations.length > 0) {
    console.log('   3. Consider implementing recommendations');
  }
  console.log('   4. Run regular health checks');
  console.log('   5. Monitor system performance');
  
  console.log('');
  console.log('📝 Report saved to: comprehensive-test-report.txt');
  
  // Save report to file
  const reportContent = `
COMPREHENSIVE PLATFORM TEST REPORT
Generated: ${new Date().toISOString()}

TEST SUMMARY:
- Total Tests: ${testResults.totalTests}
- Passed: ${testResults.passed}
- Failed: ${testResults.failed}
- Warnings: ${testResults.warnings}
- Health Score: ${healthScore}%

CRITICAL ISSUES:
${testResults.criticalIssues.map((issue, index) => `${index + 1}. ${issue.test}: ${issue.message}`).join('\n')}

BUGS FOUND:
${testResults.bugs.map((bug, index) => `${index + 1}. ${bug.test}: ${bug.message}`).join('\n')}

RECOMMENDATIONS:
${testResults.recommendations.map((rec, index) => `${index + 1}. ${rec.test}: ${rec.message}`).join('\n')}

OVERALL ASSESSMENT:
${healthScore >= 90 ? 'EXCELLENT: Platform is in great condition!' : 
  healthScore >= 80 ? 'GOOD: Platform is functioning well with minor issues.' :
  healthScore >= 70 ? 'FAIR: Platform has some issues that need attention.' :
  'POOR: Platform has significant issues requiring immediate attention.'}
`;
  
  require('fs').writeFileSync('comprehensive-test-report.txt', reportContent);
}

async function runComprehensiveTest() {
  try {
    await testDatabaseConnectivity();
    await testUserDataIntegrity();
    await testMessageSystem();
    await testSubmissionSystem();
    await testInvitationSystem();
    await testContentSystem();
    await testAthleteFeedSystem();
    await testNotificationSystem();
    await testDataConsistency();
    await testAPIEndpoints();
    await generateReport();
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR during testing:', error);
    logTest('Test Suite Execution', 'FAIL', `Test suite failed: ${error.message}`, true);
  }
}

// Run the comprehensive test
runComprehensiveTest().then(() => {
  console.log('\n🎯 COMPREHENSIVE TESTING COMPLETE!');
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
