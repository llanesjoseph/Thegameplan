'use client'
import { useState } from 'react'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase.client'
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function DirectSeedPage() {
  const { role } = useEnhancedRole()
  const router = useRouter()
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState('')
  const [progress, setProgress] = useState('')

  if (role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only superadmins can access database seeding.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const seedDatabase = async () => {
    setSeeding(true)
    setResult('')
    setProgress('Starting seeding process...')

    try {
      // ===== 1. USERS =====
      setProgress('Creating users...')
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
        }
      ]

      for (const user of users) {
        await setDoc(doc(db, "users", user.uid), user)
        console.log(`✅ Created user: ${user.displayName}`)
      }

      // ===== 2. PROFILES =====
      setProgress('Creating profiles...')
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
        }
      ]

      for (const profile of profiles) {
        await setDoc(doc(db, "profiles", profile.uid), profile)
        console.log(`✅ Created profile: ${profile.firstName}`)
      }

      // ===== 3. CONTENT =====
      setProgress('Creating content...')
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
        }
      ]

      for (const lesson of content) {
        await setDoc(doc(db, "content", lesson.id), lesson)
        console.log(`✅ Created content: ${lesson.title}`)
      }

      // ===== 4. COACHING REQUESTS =====
      setProgress('Creating coaching requests...')
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
        }
      ]

      for (const request of requests) {
        await addDoc(collection(db, "coaching_requests"), request)
        console.log('✅ Created coaching request')
      }

      setProgress('Seeding completed!')
      setResult(`🎉 SUCCESS! Database seeded successfully!

📊 Created:
• ${users.length} Users (Athletes and Creators)
• ${profiles.length} Detailed Profiles
• ${content.length} Professional Lessons
• ${requests.length} Coaching Requests

🔍 Check Firebase Console:
https://console.firebase.google.com/project/gameplan-787a2/firestore

📋 Collections created:
• users - User accounts with roles and permissions
• profiles - User profiles with bios and expertise
• content - Lessons with pricing and ratings
• coaching_requests - User-creator interactions

All data is now live in your database! 🚀`)

    } catch (error) {
      setResult(`❌ ERROR: ${error}

Make sure you're signed in as a superadmin and have proper permissions.`)
      console.error('Seeding error:', error)
    } finally {
      setSeeding(false)
      setProgress('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎯 DIRECT DATABASE SEEDING</h1>
          <p className="text-xl text-gray-600">Client-side seeding using your superadmin authentication</p>
        </div>

        {/* Status */}
        {progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 font-medium">{progress}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className={`px-12 py-6 text-2xl font-bold rounded-lg shadow-lg transform transition-all duration-200 ${
              seeding
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
            }`}
          >
            {seeding ? '⏳ SEEDING...' : '🎯 SEED DATABASE DIRECTLY'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        {/* Links */}
        <div className="mt-8 text-center space-x-4">
          <a
            href="https://console.firebase.google.com/project/gameplan-787a2/firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔍 View Firebase Console
          </a>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            📊 Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}