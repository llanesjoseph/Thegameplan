/**
 * Simple Browser Console Script for Database Seeding
 * This bypasses role checks and creates data directly
 */

async function createSampleData() {
  try {
    // Import Firebase from your app
    const { db } = await import('/lib/firebase.client.js');
    const { serverTimestamp, addDoc, collection, doc, setDoc } = await import('firebase/firestore');

    console.log('🚀 Creating sample data directly...');

    // Create a simple user first
    const testUser = {
      uid: "test-user-001",
      email: "test.athlete@email.com",
      displayName: "Test Athlete",
      firstName: "Test",
      lastName: "Athlete",
      role: "user",
      sport: "soccer",
      level: "beginner",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    };

    await setDoc(doc(db, "users", testUser.uid), testUser);
    console.log('✅ Created test user:', testUser.displayName);

    // Create a test profile
    const testProfile = {
      uid: "test-user-001",
      firstName: "Test",
      lastName: "Athlete",
      email: "test.athlete@email.com",
      bio: "Test athlete for platform testing",
      expertise: ["fundamentals"],
      sports: ["soccer"],
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "profiles", testProfile.uid), testProfile);
    console.log('✅ Created test profile');

    // Create test content
    const testLesson = {
      id: "test-lesson-001",
      title: "Test Soccer Lesson",
      description: "A sample lesson for testing the platform",
      creatorId: "jasmine-aikey",
      creatorName: "Jasmine Aikey",
      sport: "soccer",
      category: "technical",
      level: "beginner",
      duration: 600,
      price: 15.99,
      tags: ["test", "fundamentals"],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published"
    };

    await setDoc(doc(db, "content", testLesson.id), testLesson);
    console.log('✅ Created test lesson');

    console.log('\n🎉 SUCCESS! Test data created successfully!');
    console.log('\n📍 Check Firebase Console:');
    console.log('https://console.firebase.google.com/project/gameplan-787a2/firestore');
    console.log('\n📋 Look for these collections:');
    console.log('• users (test-user-001)');
    console.log('• profiles (test-user-001)');
    console.log('• content (test-lesson-001)');

  } catch (error) {
    console.error('❌ Error creating data:', error);
    console.log('Error details:', error.message);
  }
}

// Make function available
window.createSampleData = createSampleData;

console.log('🚀 Simple seeding script loaded!');
console.log('Run: createSampleData()');