import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Simple response that tells client to do the seeding
    const sampleData = {
      users: [
        {
          uid: "user-athlete-001",
          email: "alex.johnson@email.com",
          displayName: "Alex Johnson",
          firstName: "Alex",
          lastName: "Johnson",
          role: "user",
          sport: "soccer",
          level: "intermediate",
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
          permissions: {
            canCreateContent: true,
            canManageContent: true,
            canAccessAnalytics: true,
            canReceivePayments: true
          }
        }
      ],
      profiles: [
        {
          uid: "user-athlete-001",
          firstName: "Alex",
          lastName: "Johnson",
          email: "alex.johnson@email.com",
          bio: "Passionate soccer player looking to improve technical skills.",
          expertise: ["midfield", "passing", "ball-control"],
          sports: ["soccer"],
          isPublic: true
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
          isPublic: true
        }
      ],
      content: [
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
          status: "published",
          viewCount: 245,
          rating: 4.8
        }
      ],
      coachingRequests: [
        {
          userId: "user-athlete-001",
          userName: "Alex Johnson",
          creatorId: "creator-001",
          creatorName: "Maria Rodriguez",
          message: "Hi Coach Rodriguez! I need help with my first touch technique.",
          status: "pending",
          sport: "soccer",
          category: "technical"
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: sampleData,
      instructions: "Use this data to seed the database client-side"
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get seed data' },
      { status: 500 }
    )
  }
}