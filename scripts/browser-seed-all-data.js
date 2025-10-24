/**
 * Browser Console Script for Complete Database Seeding
 *
 * Instructions:
 * 1. Sign in as a superadmin on your Game Plan app
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. Run: seedAllSampleData()
 */

async function seedAllSampleData() {
  try {
    // Import Firebase from your app
    const { db } = await import('/lib/firebase.client.js');
    const { serverTimestamp, addDoc, collection, doc, setDoc } = await import('firebase/firestore');

    console.log('🚀 Starting complete database seeding...');

    // ===== 1. USERS =====
    console.log('\n👥 Creating Users...');

    const users = [
      // 5 Athletes
      {
        uid: "user-athlete-001",
        email: "alex.johnson@email.com",
        displayName: "Alex Johnson",
        firstName: "Alex",
        lastName: "Johnson",
        role: "user",
        sport: "soccer",
        level: "intermediate",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscriptionPlan: "premium",
        subscriptionStatus: "active"
      },
      {
        uid: "user-athlete-002",
        email: "sarah.martinez@email.com",
        displayName: "Sarah Martinez",
        firstName: "Sarah",
        lastName: "Martinez",
        role: "user",
        sport: "basketball",
        level: "beginner",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscriptionPlan: "basic",
        subscriptionStatus: "active"
      },
      {
        uid: "user-athlete-003",
        email: "mike.chen@email.com",
        displayName: "Mike Chen",
        firstName: "Mike",
        lastName: "Chen",
        role: "user",
        sport: "tennis",
        level: "advanced",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscriptionPlan: "premium",
        subscriptionStatus: "active"
      },
      {
        uid: "user-athlete-004",
        email: "emma.wilson@email.com",
        displayName: "Emma Wilson",
        firstName: "Emma",
        lastName: "Wilson",
        role: "user",
        sport: "volleyball",
        level: "intermediate",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscriptionPlan: "basic",
        subscriptionStatus: "active"
      },
      {
        uid: "user-athlete-005",
        email: "david.brown@email.com",
        displayName: "David Brown",
        firstName: "David",
        lastName: "Brown",
        role: "user",
        sport: "swimming",
        level: "beginner",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscriptionPlan: "free",
        subscriptionStatus: "active"
      },

      // 5 Creators
      {
        uid: "creator-001",
        email: "coach.rodriguez@email.com",
        displayName: "Maria Rodriguez",
        firstName: "Maria",
        lastName: "Rodriguez",
        role: "creator",
        sport: "soccer",
        creatorStatus: "approved",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true
        }
      },
      {
        uid: "creator-002",
        email: "coach.thompson@email.com",
        displayName: "James Thompson",
        firstName: "James",
        lastName: "Thompson",
        role: "creator",
        sport: "basketball",
        creatorStatus: "approved",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true
        }
      },
      {
        uid: "creator-003",
        email: "coach.anderson@email.com",
        displayName: "Lisa Anderson",
        firstName: "Lisa",
        lastName: "Anderson",
        role: "creator",
        sport: "tennis",
        creatorStatus: "approved",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true
        }
      },
      {
        uid: "creator-004",
        email: "coach.garcia@email.com",
        displayName: "Carlos Garcia",
        firstName: "Carlos",
        lastName: "Garcia",
        role: "creator",
        sport: "volleyball",
        creatorStatus: "pending",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        permissions: {
          canCreateContent: false,
          canManageContent: false,
          canAccessAnalytics: false,
          canReceivePayments: false
        }
      },
      {
        uid: "creator-005",
        email: "coach.lee@email.com",
        displayName: "Jennifer Lee",
        firstName: "Jennifer",
        lastName: "Lee",
        role: "creator",
        sport: "swimming",
        creatorStatus: "approved",
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true
        }
      }
    ];

    for (const user of users) {
      await setDoc(doc(db, "users", user.uid), user);
      console.log(`✅ Created: users/${user.uid} (${user.displayName})`);
    }

    // ===== 2. PROFILES =====
    console.log('\n👤 Creating Profiles...');

    const profiles = [
      {
        uid: "user-athlete-001",
        firstName: "Alex",
        lastName: "Johnson",
        email: "alex.johnson@email.com",
        bio: "Passionate soccer player looking to improve technical skills and tactical understanding.",
        expertise: ["midfield", "passing", "ball-control"],
        sports: ["soccer"],
        goals: ["improve-passing", "increase-fitness", "tactical-awareness"],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        uid: "creator-001",
        firstName: "Maria",
        lastName: "Rodriguez",
        email: "coach.rodriguez@email.com",
        bio: "Former professional soccer player with 8 years coaching experience. Specializes in youth development and technical training.",
        expertise: ["technical-skills", "tactical-awareness", "youth-development"],
        sports: ["soccer"],
        certifications: ["UEFA B License", "Youth Development Specialist"],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        uid: "creator-002",
        firstName: "James",
        lastName: "Thompson",
        email: "coach.thompson@email.com",
        bio: "College basketball coach with focus on shooting mechanics and defensive strategies.",
        expertise: ["shooting-technique", "defensive-systems", "game-strategy"],
        sports: ["basketball"],
        certifications: ["NCAA Coaching Certification", "Shooting Specialist"],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const profile of profiles) {
      await setDoc(doc(db, "profiles", profile.uid), profile);
      console.log(`✅ Created: profiles/${profile.uid}`);
    }

    // ===== 3. CONTENT =====
    console.log('\n🎬 Creating Content...');

    const content = [
      {
        id: "lesson-soccer-001",
        title: "Perfect First Touch: Ball Control Fundamentals",
        description: "Master the essential skill of controlling the ball with your first touch using proven techniques and drills.",
        creatorId: "creator-001",
        creatorName: "Maria Rodriguez",
        sport: "soccer",
        category: "technical",
        level: "beginner",
        duration: 900,
        price: 19.99,
        tags: ["first-touch", "ball-control", "fundamentals"],
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: "published",
        viewCount: 245,
        rating: 4.8
      },
      {
        id: "lesson-basketball-001",
        title: "Elite Shooting Form: Mechanics and Consistency",
        description: "Break down the perfect shooting form and learn drills to develop consistent, accurate shooting.",
        creatorId: "creator-002",
        creatorName: "James Thompson",
        sport: "basketball",
        category: "technical",
        level: "intermediate",
        duration: 1200,
        price: 24.99,
        tags: ["shooting", "form", "mechanics"],
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: "published",
        viewCount: 187,
        rating: 4.9
      },
      {
        id: "lesson-tennis-001",
        title: "Serve Power and Placement: Advanced Techniques",
        description: "Develop a powerful and precise serve using professional techniques and strategic placement.",
        creatorId: "creator-003",
        creatorName: "Lisa Anderson",
        sport: "tennis",
        category: "technical",
        level: "advanced",
        duration: 1800,
        price: 29.99,
        tags: ["serve", "power", "placement"],
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: "published",
        viewCount: 156,
        rating: 4.7
      }
    ];

    for (const lesson of content) {
      await setDoc(doc(db, "content", lesson.id), lesson);
      console.log(`✅ Created: content/${lesson.id}`);
    }

    // ===== 4. COACHING REQUESTS =====
    console.log('\n💬 Creating Coaching Requests...');

    const requests = [
      {
        userId: "user-athlete-001",
        userName: "Alex Johnson",
        creatorId: "creator-001",
        creatorName: "Maria Rodriguez",
        message: "Hi Coach Rodriguez! I've been working on my first touch but struggle with consistency under pressure. Could you provide some specific drills?",
        status: "pending",
        sport: "soccer",
        category: "technical",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        userId: "user-athlete-002",
        userName: "Sarah Martinez",
        creatorId: "creator-002",
        creatorName: "James Thompson",
        message: "Coach Thompson, I'm new to basketball and feel overwhelmed. Where should I start?",
        status: "responded",
        sport: "basketball",
        category: "fundamentals",
        response: "Sarah, start with shooting form, then dribbling, then defense. I'll create a beginner series!",
        respondedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const request of requests) {
      await addDoc(collection(db, "coaching_requests"), request);
      console.log('✅ Created: coaching_requests (new document)');
    }

    // ===== 5. CONTRIBUTOR APPLICATIONS =====
    console.log('\n📝 Creating Contributor Applications...');

    const applications = [
      {
        firstName: "Maria",
        lastName: "Rodriguez",
        email: "coach.rodriguez@email.com",
        primarySport: "soccer",
        experience: "professional",
        specialties: ["technical-skills", "tactical-awareness", "youth-development"],
        contentDescription: "Technical training and youth development content for soccer players.",
        status: "approved",
        userId: "creator-001",
        submittedAt: serverTimestamp(),
        reviewedAt: serverTimestamp(),
        reviewerNotes: "Excellent credentials and clear content vision."
      },
      {
        firstName: "Carlos",
        lastName: "Garcia",
        email: "coach.garcia@email.com",
        primarySport: "volleyball",
        experience: "college",
        specialties: ["serving", "blocking", "team-coordination"],
        contentDescription: "Volleyball training focused on offensive systems and team coordination.",
        status: "pending",
        userId: "creator-004",
        submittedAt: serverTimestamp(),
        reviewerNotes: "Under review - checking references"
      }
    ];

    for (const app of applications) {
      await addDoc(collection(db, "contributorApplications"), app);
      console.log('✅ Created: [ID] (new document)');
    }

    console.log(`\n🎉 SUCCESS! Sample database seeded successfully!\n==============================================\n\n📊 Data Created:\n• 10 Users (5 athletes + 5 creators)\n• 3 Detailed profiles\n• 3 Professional lessons\n• 2 Coaching requests\n• 2 Contributor applications\n\n🔍 Check Firebase Console:\nhttps://console.firebase.google.com/project/gameplan-787a2/firestore\n\n📋 Collections to view:\n• users - All user accounts\n• profiles - User profiles\n• content - Lessons and courses\n• coaching_requests - User-creator interactions\n• contributorApplications - Creator applications\n\nAll data is now live in your database! 🚀`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.log('💡 Make sure you are signed in as a superadmin');
  }
}

// Instructions
console.log(`\n🚀 Database Seeding Ready!\n=========================\n\nRequired Steps:\n1. Make sure you're signed in as a superadmin\n2. Run: seedAllSampleData()\n\nThis will create realistic sample data for testing:\n• Athletes, creators, admins\n• Lessons and content\n• Coaching interactions\n• Creator applications\n• User profiles\n`);

// Make function globally available
window.seedAllSampleData = seedAllSampleData;