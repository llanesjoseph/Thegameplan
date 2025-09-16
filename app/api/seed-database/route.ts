import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Initialize Firebase Admin if not already initialized
let adminDb: any
try {
  const app = getApps().length === 0
    ? initializeApp({
        projectId: 'gameplan-787a2',
        // Use environment-based auth for production
      })
    : getApps()[0]

  adminDb = getFirestore(app)
} catch (error) {
  console.error('Firebase Admin initialization error:', error)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting aggressive database seeding...')

    // Get current timestamp
    const now = FieldValue.serverTimestamp()

    // ===== 1. USERS =====
    const users = [
      {
        uid: "user-athlete-001",
        email: "alex.johnson@email.com",
        displayName: "Alex Johnson",
        firstName: "Alex",
        lastName: "Johnson",
        role: "user",
        sport: "soccer",
        level: "intermediate",
        joinedAt: now,
        lastActive: now,
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
        joinedAt: now,
        lastActive: now,
        subscriptionPlan: "basic",
        subscriptionStatus: "active"
      },
      {
        uid: "creator-001",
        email: "coach.rodriguez@email.com",
        displayName: "Maria Rodriguez",
        firstName: "Maria",
        lastName: "Rodriguez",
        role: "creator",
        sport: "soccer",
        creatorStatus: "approved",
        joinedAt: now,
        lastActive: now,
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
        joinedAt: now,
        lastActive: now,
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true
        }
      }
    ]

    // Create users
    const batch = adminDb.batch()
    for (const user of users) {
      const userRef = adminDb.collection('users').doc(user.uid)
      batch.set(userRef, user)
    }
    await batch.commit()
    console.log('✅ Users created')

    // ===== 2. PROFILES =====
    const profiles = [
      {
        uid: "user-athlete-001",
        firstName: "Alex",
        lastName: "Johnson",
        email: "alex.johnson@email.com",
        bio: "Passionate soccer player looking to improve technical skills.",
        expertise: ["midfield", "passing", "ball-control"],
        sports: ["soccer"],
        isPublic: true,
        createdAt: now,
        updatedAt: now
      },
      {
        uid: "creator-001",
        firstName: "Maria",
        lastName: "Rodriguez",
        email: "coach.rodriguez@email.com",
        bio: "Former professional soccer player with 8 years coaching experience.",
        expertise: ["technical-skills", "tactical-awareness", "youth-development"],
        sports: ["soccer"],
        certifications: ["UEFA B License", "Youth Development Specialist"],
        isPublic: true,
        createdAt: now,
        updatedAt: now
      }
    ]

    const profileBatch = adminDb.batch()
    for (const profile of profiles) {
      const profileRef = adminDb.collection('profiles').doc(profile.uid)
      profileBatch.set(profileRef, profile)
    }
    await profileBatch.commit()
    console.log('✅ Profiles created')

    // ===== 3. CONTENT =====
    const content = [
      {
        id: "lesson-soccer-001",
        title: "Perfect First Touch: Ball Control Fundamentals",
        description: "Master the essential skill of controlling the ball with your first touch.",
        creatorId: "creator-001",
        creatorName: "Maria Rodriguez",
        sport: "soccer",
        category: "technical",
        level: "beginner",
        duration: 900,
        price: 19.99,
        tags: ["first-touch", "ball-control", "fundamentals"],
        publishedAt: now,
        createdAt: now,
        status: "published",
        viewCount: 245,
        rating: 4.8
      },
      {
        id: "lesson-basketball-001",
        title: "Elite Shooting Form: Mechanics and Consistency",
        description: "Break down the perfect shooting form and learn drills.",
        creatorId: "creator-002",
        creatorName: "James Thompson",
        sport: "basketball",
        category: "technical",
        level: "intermediate",
        duration: 1200,
        price: 24.99,
        tags: ["shooting", "form", "mechanics"],
        publishedAt: now,
        createdAt: now,
        status: "published",
        viewCount: 187,
        rating: 4.9
      }
    ]

    const contentBatch = adminDb.batch()
    for (const lesson of content) {
      const contentRef = adminDb.collection('content').doc(lesson.id)
      contentBatch.set(contentRef, lesson)
    }
    await contentBatch.commit()
    console.log('✅ Content created')

    // ===== 4. COACHING REQUESTS =====
    const requests = [
      {
        userId: "user-athlete-001",
        userName: "Alex Johnson",
        creatorId: "creator-001",
        creatorName: "Maria Rodriguez",
        message: "Hi Coach Rodriguez! I need help with my first touch technique.",
        status: "pending",
        sport: "soccer",
        category: "technical",
        createdAt: now,
        updatedAt: now
      }
    ]

    for (const request of requests) {
      await adminDb.collection('coaching_requests').add(request)
    }
    console.log('✅ Coaching requests created')

    // ===== 5. CONTRIBUTOR APPLICATIONS =====
    const applications = [
      {
        firstName: "Maria",
        lastName: "Rodriguez",
        email: "coach.rodriguez@email.com",
        primarySport: "soccer",
        experience: "professional",
        specialties: ["technical-skills", "tactical-awareness"],
        contentDescription: "Technical training for soccer players.",
        status: "approved",
        userId: "creator-001",
        submittedAt: now,
        reviewedAt: now,
        reviewerNotes: "Excellent credentials."
      }
    ]

    for (const app of applications) {
      await adminDb.collection('contributorApplications').add(app)
    }
    console.log('✅ Applications created')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        users: users.length,
        profiles: profiles.length,
        content: content.length,
        requests: requests.length,
        applications: applications.length
      }
    })

  } catch (error) {
    console.error('❌ Seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error },
      { status: 500 }
    )
  }
}