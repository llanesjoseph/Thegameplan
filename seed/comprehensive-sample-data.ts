import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'

const config = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
}

const app = initializeApp(config)
const db = getFirestore(app)

async function seedComprehensiveData() {
  console.log("🌱 Starting comprehensive database seeding...")

  // ===== 1. USERS (5 of each role) =====
  console.log("\n👥 Creating Users...")

  const users = [
    // 5 Regular Users (Athletes)
    {
      uid: "user-athlete-001",
      email: "alex.johnson@email.com",
      displayName: "Alex Johnson",
      firstName: "Alex",
      lastName: "Johnson",
      role: "user",
      sport: "soccer",
      level: "intermediate",
      age: 22,
      location: "Los Angeles, CA",
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
      age: 19,
      location: "Chicago, IL",
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
      age: 25,
      location: "New York, NY",
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
      age: 21,
      location: "Austin, TX",
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
      age: 18,
      location: "Miami, FL",
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
      specialties: ["technical", "tactical", "youth-development"],
      experience: "professional",
      yearsExperience: 8,
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
      specialties: ["shooting", "defense", "mental-training"],
      experience: "college",
      yearsExperience: 12,
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
      specialties: ["technique", "strategy", "fitness"],
      experience: "professional",
      yearsExperience: 15,
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
      specialties: ["serving", "blocking", "team-coordination"],
      experience: "college",
      yearsExperience: 6,
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
      specialties: ["stroke-technique", "endurance", "competitive-training"],
      experience: "olympic",
      yearsExperience: 20,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true
      }
    },

    // 5 Admins
    {
      uid: "admin-001",
      email: "admin.smith@gameplan.com",
      displayName: "Robert Smith",
      firstName: "Robert",
      lastName: "Smith",
      role: "admin",
      department: "content-moderation",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canModerateContent: true
      }
    },
    {
      uid: "admin-002",
      email: "admin.davis@gameplan.com",
      displayName: "Michelle Davis",
      firstName: "Michelle",
      lastName: "Davis",
      role: "admin",
      department: "user-support",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canModerateContent: true
      }
    },
    {
      uid: "admin-003",
      email: "admin.taylor@gameplan.com",
      displayName: "Kevin Taylor",
      firstName: "Kevin",
      lastName: "Taylor",
      role: "admin",
      department: "platform-operations",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canModerateContent: true
      }
    },
    {
      uid: "admin-004",
      email: "admin.miller@gameplan.com",
      displayName: "Amanda Miller",
      firstName: "Amanda",
      lastName: "Miller",
      role: "admin",
      department: "analytics",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canModerateContent: true
      }
    },
    {
      uid: "admin-005",
      email: "admin.white@gameplan.com",
      displayName: "Brian White",
      firstName: "Brian",
      lastName: "White",
      role: "admin",
      department: "creator-relations",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canModerateContent: true
      }
    }
  ]

  // Create all users
  for (const user of users) {
    await setDoc(doc(db, "users", user.uid), user)
    console.log(`✅ Seeded: users/${user.uid} (${user.role} - ${user.displayName})`)
  }

  // ===== 2. USER PROFILES =====
  console.log("\n👤 Creating Profiles...")

  const profiles = [
    // Athlete Profiles
    {
      uid: "user-athlete-001",
      firstName: "Alex",
      lastName: "Johnson",
      email: "alex.johnson@email.com",
      bio: "Passionate soccer player looking to improve technical skills and tactical understanding.",
      expertise: ["midfield", "passing", "ball-control"],
      sports: ["soccer"],
      goals: ["improve-passing", "increase-fitness", "tactical-awareness"],
      achievements: ["High School All-State", "Regional Tournament MVP"],
      isPublic: true,
      profileImageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: "user-athlete-002",
      firstName: "Sarah",
      lastName: "Martinez",
      email: "sarah.martinez@email.com",
      bio: "New to basketball but eager to learn fundamentals and build confidence on the court.",
      expertise: ["fundamentals", "defense"],
      sports: ["basketball"],
      goals: ["learn-basics", "improve-shooting", "build-confidence"],
      achievements: ["JV Team Member"],
      isPublic: true,
      profileImageUrl: "https://images.unsplash.com/photo-1594736797933-d0782ba2d36a?w=400",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: "user-athlete-003",
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@email.com",
      bio: "Competitive tennis player focused on advancing to professional level.",
      expertise: ["serve", "forehand", "mental-game"],
      sports: ["tennis"],
      goals: ["professional-preparation", "tournament-success", "mental-toughness"],
      achievements: ["State Championship Runner-up", "Division 1 Scholarship"],
      isPublic: true,
      profileImageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },

    // Creator Profiles
    {
      uid: "creator-001",
      firstName: "Maria",
      lastName: "Rodriguez",
      email: "coach.rodriguez@email.com",
      bio: "Former professional soccer player with 8 years coaching experience. Specializes in youth development and technical training.",
      expertise: ["technical-skills", "tactical-awareness", "youth-development", "player-psychology"],
      sports: ["soccer"],
      certifications: ["UEFA B License", "Youth Development Specialist", "Sports Psychology"],
      achievements: ["Professional Player 2010-2015", "Youth Coach of the Year 2022"],
      contentTypes: ["technical-drills", "tactical-analysis", "mental-training"],
      targetAudience: ["youth-players", "intermediate-players", "parents"],
      isPublic: true,
      profileImageUrl: "https://images.unsplash.com/photo-1551721434-8b94ddff0e6d?w=400",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: "creator-002",
      firstName: "James",
      lastName: "Thompson",
      email: "coach.thompson@email.com",
      bio: "College basketball coach with focus on shooting mechanics and defensive strategies.",
      expertise: ["shooting-technique", "defensive-systems", "game-strategy", "player-development"],
      sports: ["basketball"],
      certifications: ["NCAA Coaching Certification", "Shooting Specialist"],
      achievements: ["Conference Championship 2021", "15+ years coaching experience"],
      contentTypes: ["shooting-drills", "defensive-concepts", "game-film-analysis"],
      targetAudience: ["high-school-players", "college-players", "coaches"],
      isPublic: true,
      profileImageUrl: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=400",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  for (const profile of profiles) {
    await setDoc(doc(db, "profiles", profile.uid), profile)
    console.log(`✅ Seeded: profiles/${profile.uid}`)
  }

  // ===== 3. CONTENT/LESSONS =====
  console.log("\n🎬 Creating Content...")

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
      duration: 900, // 15 minutes
      videoUrl: "https://example.com/soccer-first-touch.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      price: 19.99,
      tags: ["first-touch", "ball-control", "fundamentals", "technique"],
      difficulty: "beginner",
      equipment: ["soccer-ball", "cones"],
      objectives: [
        "Improve first touch consistency",
        "Learn proper body positioning",
        "Practice under pressure scenarios"
      ],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published",
      viewCount: 245,
      rating: 4.8,
      reviewCount: 32
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
      duration: 1200, // 20 minutes
      videoUrl: "https://example.com/basketball-shooting.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
      price: 24.99,
      tags: ["shooting", "form", "mechanics", "consistency"],
      difficulty: "intermediate",
      equipment: ["basketball", "hoop"],
      objectives: [
        "Perfect shooting mechanics",
        "Increase shooting percentage",
        "Develop muscle memory"
      ],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published",
      viewCount: 187,
      rating: 4.9,
      reviewCount: 28
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
      duration: 1800, // 30 minutes
      videoUrl: "https://example.com/tennis-serve.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400",
      price: 29.99,
      tags: ["serve", "power", "placement", "technique"],
      difficulty: "advanced",
      equipment: ["tennis-racket", "tennis-balls", "court"],
      objectives: [
        "Increase serve speed",
        "Improve placement accuracy",
        "Develop tactical serving"
      ],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published",
      viewCount: 156,
      rating: 4.7,
      reviewCount: 19
    },
    {
      id: "lesson-volleyball-001",
      title: "Spike Technique: Power and Precision",
      description: "Learn proper spiking form and timing to become a dominant offensive player.",
      creatorId: "creator-004",
      creatorName: "Carlos Garcia",
      sport: "volleyball",
      category: "technical",
      level: "intermediate",
      duration: 720, // 12 minutes
      videoUrl: "https://example.com/volleyball-spike.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400",
      price: 19.99,
      tags: ["spike", "attack", "timing", "power"],
      difficulty: "intermediate",
      equipment: ["volleyball", "net"],
      objectives: [
        "Perfect spiking form",
        "Improve timing",
        "Increase attack success rate"
      ],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published",
      viewCount: 134,
      rating: 4.6,
      reviewCount: 15
    },
    {
      id: "lesson-swimming-001",
      title: "Freestyle Stroke Optimization",
      description: "Refine your freestyle technique for maximum speed and efficiency in competitive swimming.",
      creatorId: "creator-005",
      creatorName: "Jennifer Lee",
      sport: "swimming",
      category: "technical",
      level: "advanced",
      duration: 1500, // 25 minutes
      videoUrl: "https://example.com/swimming-freestyle.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400",
      price: 34.99,
      tags: ["freestyle", "technique", "speed", "efficiency"],
      difficulty: "advanced",
      equipment: ["pool", "kickboard", "pull-buoy"],
      objectives: [
        "Optimize stroke technique",
        "Increase swimming speed",
        "Improve endurance"
      ],
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      status: "published",
      viewCount: 98,
      rating: 4.9,
      reviewCount: 12
    }
  ]

  for (const lesson of content) {
    await setDoc(doc(db, "content", lesson.id), lesson)
    console.log(`✅ Seeded: content/${lesson.id}`)
  }

  // ===== 4. COACHING REQUESTS =====
  console.log("\n💬 Creating Coaching Requests...")

  const coachingRequests = [
    {
      userId: "user-athlete-001",
      userEmail: "alex.johnson@email.com",
      userName: "Alex Johnson",
      creatorId: "creator-001",
      creatorName: "Maria Rodriguez",
      message: "Hi Coach Rodriguez! I've been working on my first touch but struggle with consistency under pressure. Could you provide some specific drills and mental techniques to help me improve?",
      status: "pending",
      sport: "soccer",
      category: "technical",
      urgency: "normal",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-002",
      userEmail: "sarah.martinez@email.com",
      userName: "Sarah Martinez",
      creatorId: "creator-002",
      creatorName: "James Thompson",
      message: "Coach Thompson, I'm new to basketball and feel overwhelmed by all the fundamentals. Where should I start to build a solid foundation?",
      status: "responded",
      sport: "basketball",
      category: "fundamentals",
      urgency: "normal",
      response: "Sarah, great question! Start with these fundamentals in order: 1) Proper shooting form, 2) Dribbling with both hands, 3) Defensive stance. I'll create a beginner series just for you!",
      respondedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-003",
      userEmail: "mike.chen@email.com",
      userName: "Mike Chen",
      creatorId: "creator-003",
      creatorName: "Lisa Anderson",
      message: "Coach Anderson, I'm preparing for college tournaments and need help with my mental game. How do you handle pressure during crucial points?",
      status: "responded",
      sport: "tennis",
      category: "mental",
      urgency: "high",
      response: "Mike, mental toughness is crucial at your level. I recommend visualization techniques and breathing exercises. Let's schedule a one-on-one session to work on pressure scenarios.",
      respondedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-004",
      userEmail: "emma.wilson@email.com",
      userName: "Emma Wilson",
      creatorId: "creator-004",
      creatorName: "Carlos Garcia",
      message: "Hey Coach Garcia! Our team is struggling with communication during games. Any tips for better on-court coordination?",
      status: "pending",
      sport: "volleyball",
      category: "teamwork",
      urgency: "normal",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      userId: "user-athlete-005",
      userEmail: "david.brown@email.com",
      userName: "David Brown",
      creatorId: "creator-005",
      creatorName: "Jennifer Lee",
      message: "Coach Lee, I'm working on improving my freestyle times but plateau at practice. What advanced techniques should I focus on?",
      status: "pending",
      sport: "swimming",
      category: "technical",
      urgency: "normal",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  for (const request of coachingRequests) {
    await addDoc(collection(db, "coaching_requests"), request)
    console.log("✅ Seeded: coaching_requests (new document)")
  }

  console.log("\n🎉 Comprehensive database seeding completed successfully!")
  console.log("\n📊 Data Summary:")
  console.log("- Users: 15 total (5 athletes, 5 creators, 5 admins)")
  console.log("- Profiles: 5 detailed profiles")
  console.log("- Content: 5 lessons across all sports")
  console.log("- Coaching Requests: 5 requests with various statuses")
  console.log("- All data includes realistic interactions and relationships")
}

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  seedComprehensiveData().catch(console.error)
}

export { seedComprehensiveData }