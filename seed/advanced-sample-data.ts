import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'

const config = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
}

const app = initializeApp(config)
const db = getFirestore(app)

async function seedAdvancedData() {
  console.log("🚀 Starting advanced sample data seeding...")

  // ===== 1. CONTRIBUTOR APPLICATIONS =====
  console.log("\n📝 Creating Contributor Applications...")

  const contributorApplications = [
    {
      firstName: "Maria",
      lastName: "Rodriguez",
      email: "coach.rodriguez@email.com",
      primarySport: "soccer",
      experience: "professional",
      experienceDetails: "Former professional player for FC Barcelona Women (2010-2015). 8 years coaching youth and professional teams. Specializes in technical development and tactical awareness.",
      specialties: ["technical-skills", "tactical-awareness", "youth-development", "player-psychology"],
      contentTypes: ["video-lessons", "drill-demonstrations", "tactical-analysis", "mental-training"],
      targetAudience: ["youth-players", "intermediate-players", "parents", "coaches"],
      contentDescription: "I create comprehensive training content focusing on technical skill development and tactical understanding. My lessons combine professional experience with proven coaching methodologies.",
      achievements: ["Professional Player FC Barcelona", "Youth Coach of the Year 2022", "UEFA B Licensed"],
      certifications: ["UEFA B License", "Youth Development Specialist", "Sports Psychology Certificate"],
      socialMediaLinks: {
        instagram: "@coach_maria_soccer",
        youtube: "Maria Rodriguez Soccer",
        tiktok: "@soccer_maria"
      },
      status: "approved",
      userId: "creator-001",
      userEmail: "coach.rodriguez@email.com",
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: "Excellent credentials and clear content vision. Approved immediately.",
      reviewerId: "admin-005"
    },
    {
      firstName: "James",
      lastName: "Thompson",
      email: "coach.thompson@email.com",
      primarySport: "basketball",
      experience: "college",
      experienceDetails: "12 years as Division 1 assistant coach. Specialized in shooting mechanics and defensive systems. Led team to conference championship in 2021.",
      specialties: ["shooting-technique", "defensive-systems", "game-strategy", "player-development"],
      contentTypes: ["technical-breakdowns", "game-film-analysis", "drill-progressions"],
      targetAudience: ["high-school-players", "college-players", "coaches"],
      contentDescription: "My content focuses on advanced basketball concepts with emphasis on shooting mechanics and defensive strategy. I break down complex concepts into actionable steps.",
      achievements: ["Conference Championship 2021", "15+ years coaching", "Shooting Specialist Certification"],
      certifications: ["NCAA Coaching Certification", "Shooting Specialist", "Defensive Concepts Expert"],
      status: "approved",
      userId: "creator-002",
      userEmail: "coach.thompson@email.com",
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: "Strong coaching background and clear content strategy.",
      reviewerId: "admin-005"
    },
    {
      firstName: "Lisa",
      lastName: "Anderson",
      email: "coach.anderson@email.com",
      primarySport: "tennis",
      experience: "professional",
      experienceDetails: "Former WTA Tour player ranked #45. 15 years coaching experience with multiple junior Grand Slam champions. Expert in serve technique and mental game.",
      specialties: ["serve-technique", "mental-game", "competitive-strategy", "fitness-training"],
      contentTypes: ["technique-analysis", "mental-training", "competitive-preparation"],
      targetAudience: ["competitive-players", "junior-players", "tennis-coaches"],
      contentDescription: "Professional-level tennis instruction focusing on serve development and mental toughness. Content designed for serious competitive players.",
      achievements: ["WTA Tour Player", "Junior Grand Slam Coach", "Mental Performance Specialist"],
      certifications: ["PTR Professional", "Mental Performance", "Serve Specialist"],
      status: "approved",
      userId: "creator-003",
      userEmail: "coach.anderson@email.com",
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: "Elite professional background with proven coaching success.",
      reviewerId: "admin-005"
    },
    {
      firstName: "Carlos",
      lastName: "Garcia",
      email: "coach.garcia@email.com",
      primarySport: "volleyball",
      experience: "college",
      experienceDetails: "College volleyball coach for 6 years. Specializes in offensive systems and player development. Team won conference championship twice.",
      specialties: ["offensive-systems", "serving", "blocking", "team-coordination"],
      contentTypes: ["system-breakdowns", "drill-progressions", "team-concepts"],
      targetAudience: ["high-school-teams", "college-players", "volleyball-coaches"],
      contentDescription: "Volleyball training focused on offensive systems and team coordination. I teach players how to work together effectively.",
      achievements: ["2x Conference Champions", "Coach of the Year 2023"],
      certifications: ["AVCA Certified", "Offensive Systems Specialist"],
      status: "pending",
      userId: "creator-004",
      userEmail: "coach.garcia@email.com",
      submittedAt: serverTimestamp(),
      reviewerNotes: "Under review - checking references",
      reviewerId: "admin-005"
    },
    {
      firstName: "Jennifer",
      lastName: "Lee",
      email: "coach.lee@email.com",
      primarySport: "swimming",
      experience: "olympic",
      experienceDetails: "Olympic swimmer (2008, 2012). 20 years coaching experience including Olympic development programs. World record holder in 200m freestyle.",
      specialties: ["stroke-technique", "competitive-training", "endurance-development", "race-strategy"],
      contentTypes: ["technique-analysis", "training-programs", "competitive-preparation"],
      targetAudience: ["competitive-swimmers", "swim-coaches", "elite-athletes"],
      contentDescription: "Olympic-level swimming instruction covering technique optimization and competitive preparation for serious swimmers.",
      achievements: ["Olympic Swimmer", "World Record Holder", "Olympic Coach 2020"],
      certifications: ["USA Swimming Certified", "Olympic Development", "Stroke Technique Expert"],
      status: "approved",
      userId: "creator-005",
      userEmail: "coach.lee@email.com",
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: "Olympic credentials speak for themselves. Immediate approval.",
      reviewerId: "admin-001"
    }
  ]

  for (const application of contributorApplications) {
    await addDoc(collection(db, "contributorApplications"), application)
    console.log(`✅ Seeded: [ID] (${application.firstName} ${application.lastName})`)
  }

  // ===== 2. ANALYTICS DATA =====
  console.log("\n📊 Creating Analytics Data...")

  const creatorAnalytics = [
    {
      creatorId: "creator-001",
      creatorName: "Maria Rodriguez",
      period: "monthly",
      year: 2024,
      month: 12,
      totalViews: 1250,
      totalEarnings: 2500.00,
      lessonsPublished: 8,
      newSubscribers: 85,
      completionRate: 0.78,
      averageRating: 4.8,
      engagementRate: 0.65,
      topContent: ["Perfect First Touch", "Tactical Positioning", "Youth Development"],
      audienceBreakdown: {
        "youth": 45,
        "intermediate": 35,
        "advanced": 20
      },
      createdAt: serverTimestamp()
    },
    {
      creatorId: "creator-002",
      creatorName: "James Thompson",
      period: "monthly",
      year: 2024,
      month: 12,
      totalViews: 980,
      totalEarnings: 1950.00,
      lessonsPublished: 6,
      newSubscribers: 67,
      completionRate: 0.82,
      averageRating: 4.9,
      engagementRate: 0.71,
      topContent: ["Elite Shooting Form", "Defensive Systems", "Game Analysis"],
      audienceBreakdown: {
        "high-school": 40,
        "college": 35,
        "coaches": 25
      },
      createdAt: serverTimestamp()
    },
    {
      creatorId: "creator-003",
      creatorName: "Lisa Anderson",
      period: "monthly",
      year: 2024,
      month: 12,
      totalViews: 756,
      totalEarnings: 2267.00,
      lessonsPublished: 5,
      newSubscribers: 42,
      completionRate: 0.85,
      averageRating: 4.7,
      engagementRate: 0.68,
      topContent: ["Serve Power", "Mental Game", "Competitive Strategy"],
      audienceBreakdown: {
        "competitive": 60,
        "junior": 25,
        "coaches": 15
      },
      createdAt: serverTimestamp()
    },
    {
      creatorId: "creator-005",
      creatorName: "Jennifer Lee",
      period: "monthly",
      year: 2024,
      month: 12,
      totalViews: 623,
      totalEarnings: 2178.00,
      lessonsPublished: 4,
      newSubscribers: 38,
      completionRate: 0.89,
      averageRating: 4.9,
      engagementRate: 0.74,
      topContent: ["Freestyle Optimization", "Race Strategy", "Endurance Training"],
      audienceBreakdown: {
        "competitive": 70,
        "masters": 20,
        "coaches": 10
      },
      createdAt: serverTimestamp()
    }
  ]

  for (const analytics of creatorAnalytics) {
    await addDoc(collection(db, "creatorAnalytics"), analytics)
    console.log(`✅ Seeded: creatorAnalytics (${analytics.creatorName})`)
  }

  // ===== 3. USER PROGRESS TRACKING =====
  console.log("\n📈 Creating User Progress Data...")

  const userProgress = [
    {
      userId: "user-athlete-001",
      userName: "Alex Johnson",
      sport: "soccer",
      level: "intermediate",
      lessonsCompleted: 12,
      totalLessonsStarted: 15,
      completionRate: 0.80,
      averageRating: 4.6,
      skillAreas: {
        "technical": 75,
        "tactical": 68,
        "physical": 72,
        "mental": 65
      },
      recentActivity: [
        { date: "2024-12-15", lesson: "Perfect First Touch", completed: true, rating: 5 },
        { date: "2024-12-14", lesson: "Tactical Positioning", completed: true, rating: 4 },
        { date: "2024-12-13", lesson: "Ball Control Drills", completed: false, progress: 0.6 }
      ],
      goals: [
        { area: "first-touch", target: 85, current: 75, deadline: "2025-01-15" },
        { area: "passing-accuracy", target: 90, current: 82, deadline: "2025-02-01" }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-002",
      userName: "Sarah Martinez",
      sport: "basketball",
      level: "beginner",
      lessonsCompleted: 6,
      totalLessonsStarted: 8,
      completionRate: 0.75,
      averageRating: 4.8,
      skillAreas: {
        "shooting": 45,
        "dribbling": 52,
        "defense": 48,
        "fundamentals": 60
      },
      recentActivity: [
        { date: "2024-12-15", lesson: "Basic Shooting Form", completed: true, rating: 5 },
        { date: "2024-12-12", lesson: "Dribbling Fundamentals", completed: true, rating: 4 },
        { date: "2024-12-10", lesson: "Defensive Stance", completed: false, progress: 0.3 }
      ],
      goals: [
        { area: "shooting-form", target: 70, current: 45, deadline: "2025-01-30" },
        { area: "ball-handling", target: 65, current: 52, deadline: "2025-02-15" }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-003",
      userName: "Mike Chen",
      sport: "tennis",
      level: "advanced",
      lessonsCompleted: 18,
      totalLessonsStarted: 20,
      completionRate: 0.90,
      averageRating: 4.7,
      skillAreas: {
        "serve": 88,
        "forehand": 85,
        "backhand": 82,
        "mental": 78
      },
      recentActivity: [
        { date: "2024-12-16", lesson: "Advanced Serve Placement", completed: true, rating: 5 },
        { date: "2024-12-14", lesson: "Mental Toughness", completed: true, rating: 4 },
        { date: "2024-12-12", lesson: "Competitive Strategy", completed: true, rating: 5 }
      ],
      goals: [
        { area: "serve-speed", target: 95, current: 88, deadline: "2024-12-31" },
        { area: "mental-game", target: 85, current: 78, deadline: "2025-01-15" }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  for (const progress of userProgress) {
    await setDoc(doc(db, "progress", progress.userId), progress)
    console.log(`✅ Seeded: progress/${progress.userId}`)
  }

  // ===== 4. NOTIFICATIONS =====
  console.log("\n🔔 Creating Notifications...")

  const notifications = [
    {
      userId: "creator-001",
      type: "new_coaching_request",
      title: "New Coaching Request",
      message: "Alex Johnson sent you a coaching request about first touch technique",
      read: false,
      requestId: "req-123",
      fromUser: "user-athlete-001",
      fromUserName: "Alex Johnson",
      createdAt: serverTimestamp(),
      priority: "normal"
    },
    {
      userId: "user-athlete-001",
      type: "lesson_recommendation",
      title: "New Lesson Available",
      message: "Maria Rodriguez just published 'Advanced Ball Control' - perfect for your goals!",
      read: false,
      lessonId: "lesson-soccer-002",
      creatorId: "creator-001",
      creatorName: "Maria Rodriguez",
      createdAt: serverTimestamp(),
      priority: "normal"
    },
    {
      userId: "user-athlete-002",
      type: "progress_milestone",
      title: "Milestone Achieved!",
      message: "Congratulations! You've completed 5 basketball fundamentals lessons",
      read: true,
      milestone: "5_lessons_completed",
      sport: "basketball",
      createdAt: serverTimestamp(),
      priority: "low"
    },
    {
      userId: "creator-002",
      type: "content_approved",
      title: "Content Approved",
      message: "Your lesson 'Elite Shooting Form' has been approved and published",
      read: true,
      lessonId: "lesson-basketball-001",
      approvedBy: "admin-001",
      createdAt: serverTimestamp(),
      priority: "normal"
    },
    {
      userId: "admin-001",
      type: "new_application",
      title: "New Creator Application",
      message: "Carlos Garcia submitted a volleyball coaching application for review",
      read: false,
      applicationId: "app-volleyball-001",
      applicantName: "Carlos Garcia",
      sport: "volleyball",
      createdAt: serverTimestamp(),
      priority: "high"
    }
  ]

  for (const notification of notifications) {
    await addDoc(collection(db, "notifications"), notification)
    console.log("✅ Seeded: notifications (new document)")
  }

  // ===== 5. EVENTS (User Activity Tracking) =====
  console.log("\n📊 Creating Event Tracking Data...")

  const events = [
    {
      type: "lesson_started",
      userId: "user-athlete-001",
      userName: "Alex Johnson",
      lessonId: "lesson-soccer-001",
      lessonTitle: "Perfect First Touch",
      creatorId: "creator-001",
      sport: "soccer",
      timestamp: serverTimestamp(),
      metadata: {
        device: "mobile",
        location: "Los Angeles, CA",
        sessionId: "sess-001"
      }
    },
    {
      type: "lesson_completed",
      userId: "user-athlete-001",
      userName: "Alex Johnson",
      lessonId: "lesson-soccer-001",
      lessonTitle: "Perfect First Touch",
      creatorId: "creator-001",
      sport: "soccer",
      duration: 872, // seconds watched
      completionPercentage: 97.2,
      rating: 5,
      timestamp: serverTimestamp(),
      metadata: {
        device: "mobile",
        watchTime: 872,
        replays: 3
      }
    },
    {
      type: "coaching_request_sent",
      userId: "user-athlete-002",
      userName: "Sarah Martinez",
      creatorId: "creator-002",
      creatorName: "James Thompson",
      sport: "basketball",
      category: "fundamentals",
      messageLength: 156,
      timestamp: serverTimestamp(),
      metadata: {
        urgency: "normal",
        device: "desktop"
      }
    },
    {
      type: "profile_updated",
      userId: "user-athlete-003",
      userName: "Mike Chen",
      sport: "tennis",
      updatedFields: ["goals", "skillAreas"],
      timestamp: serverTimestamp(),
      metadata: {
        device: "mobile",
        previousLevel: "intermediate",
        newLevel: "advanced"
      }
    },
    {
      type: "content_published",
      userId: "creator-001",
      userName: "Maria Rodriguez",
      lessonId: "lesson-soccer-002",
      lessonTitle: "Advanced Ball Control",
      sport: "soccer",
      category: "technical",
      price: 24.99,
      timestamp: serverTimestamp(),
      metadata: {
        duration: 1080,
        equipment: ["soccer-ball", "cones"],
        targetAudience: ["intermediate", "advanced"]
      }
    }
  ]

  for (const event of events) {
    await addDoc(collection(db, "events"), event)
    console.log("✅ Seeded: events (new document)")
  }

  console.log("\n🎉 Advanced sample data seeding completed successfully!")
  console.log("\n📋 Advanced Data Summary:")
  console.log("- Contributor Applications: 5 (mixed statuses)")
  console.log("- Creator Analytics: 4 monthly reports")
  console.log("- User Progress: 3 detailed progress tracks")
  console.log("- Notifications: 5 various notification types")
  console.log("- Events: 5 user activity tracking events")
  console.log("- All data shows realistic user interactions and platform usage")
}

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  seedAdvancedData().catch(console.error)
}

export { seedAdvancedData }