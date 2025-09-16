import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'

const config = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
}

const app = initializeApp(config)
const db = getFirestore(app)

async function seed() {
  console.log("🌱 Starting database seeding...")

  // 1. Creator Public Profiles
  const jasmine = {
    name: "Jasmine Aikey",
    firstName: "Jasmine",
    sport: "soccer",
    tagline: "Elite Performance Training - The Intersection of Intellect and Intensity",
    heroImageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    headshotUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b77c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    badges: ["National Player of the Year", "Stanford Cardinal", "U-20 World Cup"],
    lessonCount: 15,
    specialties: ["tactical", "mental", "leadership", "technical"],
    experience: "college",
    verified: true,
    featured: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, "creatorPublic", "jasmine-aikey"), jasmine)
  console.log("✅ Seeded: creatorPublic/jasmine-aikey")

  // 2. Creator Profiles (Private)
  const jasminePrivate = {
    uid: "jasmine-aikey-uid",
    email: "jasmine.aikey@stanford.edu",
    role: "creator",
    status: "active",
    ...jasmine,
    stripeAccountId: "acct_1234567890",
    earningsTotal: 15000,
    earningsThisMonth: 2500,
    earningsPending: 500
  }

  await setDoc(doc(db, "creator_profiles", "jasmine-aikey"), jasminePrivate)
  console.log("✅ Seeded: creator_profiles/jasmine-aikey")

  // 3. Content Collections
  const sampleLessons = [
    {
      id: "lesson-1",
      title: "Tactical Awareness and Positioning",
      description: "Learn to read the game and position yourself for maximum impact",
      creatorId: "jasmine-aikey",
      creatorName: "Jasmine Aikey",
      sport: "soccer",
      category: "tactical",
      level: "intermediate",
      duration: 720, // 12 minutes in seconds
      videoUrl: "https://example.com/lesson-1.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      price: 19.99,
      tags: ["positioning", "tactics", "awareness"],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published"
    },
    {
      id: "lesson-2",
      title: "Mental Resilience in High-Pressure Situations",
      description: "Develop the mental fortitude to perform under pressure",
      creatorId: "jasmine-aikey",
      creatorName: "Jasmine Aikey",
      sport: "soccer",
      category: "mental",
      level: "advanced",
      duration: 900, // 15 minutes
      videoUrl: "https://example.com/lesson-2.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400",
      price: 24.99,
      tags: ["mental", "pressure", "resilience"],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published"
    },
    {
      id: "lesson-3",
      title: "First Touch and Ball Control Drills",
      description: "Master your first touch with these proven drills",
      creatorId: "jasmine-aikey",
      creatorName: "Jasmine Aikey",
      sport: "soccer",
      category: "technical",
      level: "beginner",
      duration: 600, // 10 minutes
      videoUrl: "https://example.com/lesson-3.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      price: 14.99,
      tags: ["technical", "ball-control", "drills"],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published"
    }
  ]

  for (const lesson of sampleLessons) {
    await setDoc(doc(db, "content", lesson.id), lesson)
    console.log(`✅ Seeded: content/${lesson.id}`)
  }

  // 4. Sample Users
  const sampleUsers = [
    {
      uid: "user-1",
      email: "athlete1@example.com",
      displayName: "Alex Johnson",
      role: "athlete",
      sport: "soccer",
      level: "intermediate",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      subscriptionPlan: "premium",
      subscriptionStatus: "active",
      subscriptionExpiresAt: serverTimestamp()
    },
    {
      uid: "user-2",
      email: "coach1@example.com",
      displayName: "Sarah Martinez",
      role: "coach",
      sport: "soccer",
      level: "expert",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      subscriptionExpiresAt: serverTimestamp()
    }
  ]

  for (const user of sampleUsers) {
    await setDoc(doc(db, "users", user.uid), user)
    console.log(`✅ Seeded: users/${user.uid}`)
  }

  // 5. Coaching Requests
  const sampleCoachingRequests = [
    {
      userId: "user-1",
      creatorId: "jasmine-aikey",
      message: "Hi Jasmine, I'm struggling with my positioning during corner kicks. Could you provide some guidance?",
      status: "pending",
      sport: "soccer",
      category: "tactical",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-2",
      creatorId: "jasmine-aikey",
      message: "My team has been having issues with maintaining possession in the final third. Any advice?",
      status: "responded",
      sport: "soccer",
      category: "tactical",
      response: "Focus on quick passing combinations and movement off the ball. I'll create a lesson on this topic soon!",
      respondedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  for (const request of sampleCoachingRequests) {
    await addDoc(collection(db, "coaching_requests"), request)
    console.log("✅ Seeded: coaching_requests (new document)")
  }

  // 6. Creator Analytics
  const creatorAnalytics = {
    creatorId: "jasmine-aikey",
    period: "monthly",
    year: 2024,
    month: 12,
    totalViews: 1250,
    totalEarnings: 2500.00,
    lessonsPublished: 3,
    newSubscribers: 85,
    completionRate: 0.78,
    averageRating: 4.8,
    createdAt: serverTimestamp()
  }

  await addDoc(collection(db, "creatorAnalytics"), creatorAnalytics)
  console.log("✅ Seeded: creatorAnalytics (new document)")

  // 7. Lesson Analytics
  const lessonAnalytics = [
    {
      lessonId: "lesson-1",
      creatorId: "jasmine-aikey",
      period: "daily",
      date: new Date(),
      views: 45,
      completions: 35,
      averageWatchTime: 680,
      rating: 4.9,
      comments: 12,
      createdAt: serverTimestamp()
    },
    {
      lessonId: "lesson-2",
      creatorId: "jasmine-aikey",
      period: "daily",
      date: new Date(),
      views: 38,
      completions: 30,
      averageWatchTime: 840,
      rating: 4.7,
      comments: 8,
      createdAt: serverTimestamp()
    }
  ]

  for (const analytics of lessonAnalytics) {
    await addDoc(collection(db, "lessonAnalytics"), analytics)
    console.log("✅ Seeded: lessonAnalytics (new document)")
  }

  // 8. Events (for tracking user actions)
  const sampleEvents = [
    {
      type: "lesson_view",
      userId: "user-1",
      lessonId: "lesson-1",
      creatorId: "jasmine-aikey",
      duration: 680,
      completionPercentage: 94.4,
      timestamp: serverTimestamp()
    },
    {
      type: "lesson_purchase",
      userId: "user-1",
      lessonId: "lesson-2",
      creatorId: "jasmine-aikey",
      price: 24.99,
      paymentMethod: "stripe",
      timestamp: serverTimestamp()
    },
    {
      type: "coaching_request",
      userId: "user-2",
      creatorId: "jasmine-aikey",
      category: "tactical",
      messageLength: 127,
      timestamp: serverTimestamp()
    }
  ]

  for (const event of sampleEvents) {
    await addDoc(collection(db, "events"), event)
    console.log("✅ Seeded: events (new document)")
  }

  // 9. Notifications
  const sampleNotifications = [
    {
      userId: "jasmine-aikey",
      type: "new_coaching_request",
      title: "New Coaching Request",
      message: "You have a new coaching request from Alex Johnson",
      read: false,
      requestId: "req-123",
      fromUser: "user-1",
      createdAt: serverTimestamp()
    },
    {
      userId: "user-1",
      type: "lesson_recommendation",
      title: "New Lesson Available",
      message: "Jasmine Aikey just published a new lesson on tactical awareness",
      read: false,
      lessonId: "lesson-1",
      creatorId: "jasmine-aikey",
      createdAt: serverTimestamp()
    }
  ]

  for (const notification of sampleNotifications) {
    await addDoc(collection(db, "notifications"), notification)
    console.log("✅ Seeded: notifications (new document)")
  }

  // 10. Requests (General requests/support tickets)
  const sampleRequests = [
    {
      userId: "user-1",
      type: "technical_support",
      subject: "Video playback issues",
      message: "I'm having trouble playing videos on the mobile app",
      status: "open",
      priority: "medium",
      assignedTo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-2",
      type: "content_request",
      subject: "Goalkeeper training content",
      message: "Would love to see more goalkeeper-specific training content",
      status: "under_review",
      priority: "low",
      assignedTo: "admin-1",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  for (const request of sampleRequests) {
    await addDoc(collection(db, "requests"), request)
    console.log("✅ Seeded: requests (new document)")
  }

  console.log("🎉 Database seeding completed successfully!")
  console.log("\n📊 Collections created:")
  console.log("- creatorPublic (1 document)")
  console.log("- creator_profiles (1 document)")
  console.log("- content (3 documents)")
  console.log("- users (2 documents)")
  console.log("- coaching_requests (2 documents)")
  console.log("- creatorAnalytics (1 document)")
  console.log("- lessonAnalytics (2 documents)")
  console.log("- events (3 documents)")
  console.log("- notifications (2 documents)")
  console.log("- requests (2 documents)")
}

seed().catch(console.error)
