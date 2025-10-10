'use client'

/**
 * Athlete Dashboard - Completely Redesigned
 * Features:
 * - Mandatory onboarding on first login
 * - Card-style navigation with logical grouping
 * - Learning & Training cards
 * - Communication & Support cards
 * - Conditional Coach Dashboard access
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  BookOpen,
  Video,
  Users,
  MessageCircle,
  LayoutDashboard,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'
import AthleteOnboardingModal from '@/components/athlete/AthleteOnboardingModal'
import VideoReviewRequestModal from '@/components/athlete/VideoReviewRequestModal'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const router = useRouter()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [showVideoReviewModal, setShowVideoReviewModal] = useState(false)
  const [hasCoachRole, setHasCoachRole] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)

  // Redirect non-athletes
  useEffect(() => {
    if (!roleLoading && role && role !== 'athlete') {
      router.replace('/dashboard/coach-unified')
    }
  }, [role, roleLoading, router])

  // Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsCheckingOnboarding(false)
        return
      }

      try {
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const completed = userData?.onboardingComplete === true

          setOnboardingComplete(completed)
          setShowOnboarding(!completed)

          // Check if user also has coach role (for conditional card)
          const userRole = userData?.role
          const userRoles = userData?.roles || []
          setHasCoachRole(
            userRole === 'coach' ||
            userRole === 'creator' ||
            userRoles.includes('coach') ||
            userRoles.includes('creator')
          )

          // Get assigned coach ID if exists
          setCoachId(userData?.assignedCoachId || null)

          console.log('✅ Onboarding status checked:', completed ? 'Complete' : 'Incomplete')
        } else {
          // New user without profile - show onboarding
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user])

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true)
    setShowOnboarding(false)
  }

  const handleVideoReviewSuccess = () => {
    alert('✅ Video review request submitted successfully! Your coach will be notified.')
  }

  if (roleLoading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const cardSectionStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  }

  const sectionTitleStyle = {
    color: '#000000',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  return (
    <>
      {/* Mandatory Onboarding Modal */}
      {showOnboarding && user && (
        <AthleteOnboardingModal
          userId={user.uid}
          userEmail={user.email || ''}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Video Review Request Modal */}
      {showVideoReviewModal && user && (
        <VideoReviewRequestModal
          userId={user.uid}
          userEmail={user.email || ''}
          coachId={coachId || undefined}
          onClose={() => setShowVideoReviewModal(false)}
          onSuccess={handleVideoReviewSuccess}
        />
      )}

      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader />

        {/* Header Section */}
        <div className="text-center py-12 px-6">
          <h1 className="text-4xl mb-4 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
            Athlete Dashboard
          </h1>
          <p className="text-lg" style={{ color: '#000000' }}>
            {user?.displayName ? `Welcome back, ${user.displayName}!` : 'Welcome to your training hub'}
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-6 pb-12 space-y-8">

          {/* ========== LEARNING & TRAINING ========== */}
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <BookOpen className="w-6 h-6" style={{ color: '#91A6EB' }} />
              Learning & Training
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Review Lessons Card */}
              <Link href="/dashboard/lessons" className="group cursor-pointer">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
                  <div className="flex flex-col h-full">
                    <div
                      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#91A6EB' }}
                    >
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      Review Lessons
                    </h3>

                    <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
                      Access all assigned and completed training content from your coach
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: '#91A6EB' }}>
                      <span>Open Lessons</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Request Video Review Card */}
              <button
                onClick={() => setShowVideoReviewModal(true)}
                className="group cursor-pointer text-left"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
                  <div className="flex flex-col h-full">
                    <div
                      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#20B2AA' }}
                    >
                      <Video className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      Request Video Review
                    </h3>

                    <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
                      Upload a performance clip and get personalized feedback from your coach
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: '#20B2AA' }}>
                      <span>Submit Video</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ========== COMMUNICATION & SUPPORT ========== */}
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <MessageCircle className="w-6 h-6" style={{ color: '#FF6B35' }} />
              Communication & Support
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Request 1-on-1 Card */}
              <Link href="/dashboard/schedule" className="group cursor-pointer">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
                  <div className="flex flex-col h-full">
                    <div
                      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#FF6B35' }}
                    >
                      <Users className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      Request 1-on-1
                    </h3>

                    <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
                      Schedule a private training session with your coach
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: '#FF6B35' }}>
                      <span>View Schedule</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Chat with AI Agent Card */}
              <button
                onClick={() => alert('🤖 AI Coach Assistant coming soon! Get instant answers to your training questions.')}
                className="group cursor-pointer text-left"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
                  <div className="flex flex-col h-full">
                    <div
                      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#9333EA' }}
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      Chat with AI Agent
                    </h3>

                    <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
                      Get instant answers to training questions from our AI assistant
                    </p>

                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ========== CONDITIONAL: COACH DASHBOARD ACCESS ========== */}
          {hasCoachRole && (
            <div style={cardSectionStyle}>
              <h2 style={sectionTitleStyle}>
                <LayoutDashboard className="w-6 h-6" style={{ color: '#000000' }} />
                Quick Access
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Access Coach Dashboard Card */}
                <Link href="/dashboard/coach-unified" className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
                    <div className="flex flex-col h-full">
                      <div
                        className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: '#FFFFFF' }}
                      >
                        <LayoutDashboard className="w-7 h-7" style={{ color: '#000000' }} />
                      </div>

                      <h3 className="text-xl font-heading mb-2 text-white">
                        Access Coach Dashboard
                      </h3>

                      <p className="text-sm flex-grow text-white opacity-80">
                        Switch to your coach dashboard to manage athletes and content
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all text-white">
                        <span>Switch to Coach</span>
                        <span className="text-lg">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-3xl font-heading mb-2" style={{ color: '#91A6EB' }}>0</div>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Lessons Completed</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-3xl font-heading mb-2" style={{ color: '#20B2AA' }}>0</div>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Videos Reviewed</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-3xl font-heading mb-2" style={{ color: '#FF6B35' }}>0</div>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Training Hours</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
