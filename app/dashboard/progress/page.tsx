'use client'

/**
 * Athlete Dashboard - Unified Card & Iframe Pattern
 * Matches coach dashboard design with clickable cards that open iframes inline
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  BookOpen,
  Video,
  Users,
  MessageCircle,
  LayoutDashboard,
  Sparkles,
  Calendar,
  X
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'
import AthleteOnboardingModal from '@/components/athlete/AthleteOnboardingModal'
import VideoReviewRequestModal from '@/components/athlete/VideoReviewRequestModal'

// Responsive iframe component with dynamic height
function DynamicIframe({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<string>('60vh')

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const measureHeight = () => {
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDocument) {
          const contentHeight = iframeDocument.documentElement.scrollHeight
          const maxHeight = window.innerHeight * 0.6
          const calculatedHeight = Math.min(contentHeight + 40, maxHeight)
          setHeight(`${calculatedHeight}px`)
        }
      } catch (e) {
        setHeight('60vh')
      }
    }

    iframe.addEventListener('load', () => {
      setTimeout(measureHeight, 100)
      setTimeout(measureHeight, 300)
      setTimeout(measureHeight, 500)
      setTimeout(measureHeight, 1000)
    })

    return () => {
      iframe.removeEventListener('load', measureHeight)
    }
  }, [src])

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full" style={{
      height,
      maxHeight: '60vh',
      transition: 'height 0.3s ease'
    }}>
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full border-0"
        title={title}
      />
    </div>
  )
}

export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [showVideoReviewModal, setShowVideoReviewModal] = useState(false)
  const [hasCoachRole, setHasCoachRole] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // NO REDIRECT LOGIC HERE - Main dashboard handles all routing
  // This page just renders athlete dashboard content

  // Athlete cards matching coach dashboard pattern
  const athleteCards = [
    {
      id: 'lessons',
      title: 'Review Lessons',
      description: 'Access all assigned and completed training content',
      icon: BookOpen,
      color: '#91A6EB',
      path: '/dashboard/lessons?embedded=true'
    },
    {
      id: 'video-review',
      title: 'Request Video Review',
      description: 'Upload a performance clip for coach feedback',
      icon: Video,
      color: '#20B2AA',
      path: null, // Opens modal instead
      action: () => setShowVideoReviewModal(true)
    },
    {
      id: 'schedule',
      title: 'Request 1-on-1',
      description: 'Schedule a private training session',
      icon: Calendar,
      color: '#FF6B35',
      path: '/dashboard/schedule?embedded=true'
    },
    {
      id: 'ai-chat',
      title: 'Chat with AI Agent',
      description: 'Get instant answers to training questions',
      icon: Sparkles,
      color: '#9333EA',
      path: null, // Coming soon
      action: () => alert('🤖 AI Coach Assistant coming soon!')
    }
  ]

  // Add coach dashboard card conditionally
  if (hasCoachRole) {
    athleteCards.push({
      id: 'coach-dashboard',
      title: 'Coach Dashboard',
      description: 'Switch to your coach dashboard',
      icon: LayoutDashboard,
      color: '#000000',
      path: '/dashboard/coach-unified',
      action: () => router.push('/dashboard/coach-unified')
    })
  }

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

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const handleCardClick = (card: typeof athleteCards[0]) => {
    if (card.action) {
      card.action()
    } else if (card.path) {
      setActiveSection(card.id)
    }
  }

  const renderInlineContent = () => {
    if (!activeSection) return null

    const activeCard = athleteCards.find(card => card.id === activeSection)
    if (!activeCard || !activeCard.path) return null

    return <DynamicIframe src={activeCard.path} title={activeCard.title} />
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
        <AppHeader title="Athlete Dashboard" subtitle="Your training hub for excellence" />

        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
          {/* Inline Content Display */}
          {activeSection && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
              <button
                onClick={() => setActiveSection(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-50 shadow-lg"
                title="Close"
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
              {renderInlineContent()}
            </div>
          )}

          {/* Athlete Tools Grid */}
          <div>
            <h2 className="text-xl sm:text-2xl font-heading mb-4 sm:mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
              Training Tools
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {athleteCards.map((card, index) => {
                const Icon = card.icon
                const isActive = activeSection === card.id

                return (
                  <button
                    key={index}
                    onClick={() => handleCardClick(card)}
                    className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
                  >
                    <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-white/50 p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
                      <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                        {/* Icon */}
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
                          style={{ backgroundColor: card.color }}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-heading mb-1 line-clamp-2" style={{ color: '#000000' }}>
                          {card.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[10px] sm:text-xs flex-grow line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Welcome Section (when no card is active) */}
          {!activeSection && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 sm:p-8">
              <div className="max-w-3xl">
                <h2 className="text-2xl sm:text-3xl font-heading mb-4" style={{ color: '#000000' }}>
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Athlete'}! 👋
                </h2>
                <p className="text-base sm:text-lg mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  Your training hub gives you everything you need to excel in your sport.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-4 border-2" style={{ borderColor: '#91A6EB' }}>
                    <BookOpen className="w-8 h-8 mb-2" style={{ color: '#91A6EB' }} />
                    <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Review Lessons</h3>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      Access all your assigned training content and track progress
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-4 border-2" style={{ borderColor: '#20B2AA' }}>
                    <Video className="w-8 h-8 mb-2" style={{ color: '#20B2AA' }} />
                    <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Get Feedback</h3>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      Upload performance videos and receive personalized coaching
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-4 border-2" style={{ borderColor: '#FF6B35' }}>
                    <Calendar className="w-8 h-8 mb-2" style={{ color: '#FF6B35' }} />
                    <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Schedule Sessions</h3>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      Book 1-on-1 training sessions with your coach
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple/10 to-purple/5 rounded-lg p-4 border-2 border-purple-200">
                    <Sparkles className="w-8 h-8 mb-2" style={{ color: '#9333EA' }} />
                    <h3 className="font-heading mb-1" style={{ color: '#000000' }}>AI Assistant</h3>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      Get instant answers to your training questions (Coming Soon)
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-sky-blue/10 rounded-lg">
                    <div className="text-3xl font-heading mb-1" style={{ color: '#91A6EB' }}>0</div>
                    <p className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Lessons Completed</p>
                  </div>
                  <div className="text-center p-4 bg-teal/10 rounded-lg">
                    <div className="text-3xl font-heading mb-1" style={{ color: '#20B2AA' }}>0</div>
                    <p className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Videos Reviewed</p>
                  </div>
                  <div className="text-center p-4 bg-orange/10 rounded-lg">
                    <div className="text-3xl font-heading mb-1" style={{ color: '#FF6B35' }}>0</div>
                    <p className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Training Hours</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
