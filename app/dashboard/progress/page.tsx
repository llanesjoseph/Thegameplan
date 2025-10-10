'use client'

/**
 * Athlete Dashboard - Unified Card & Iframe Pattern
 * Matches coach dashboard design with clickable cards that open iframes inline
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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
import AIAssistant from '@/components/AIAssistant'

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
  const [coachName, setCoachName] = useState<string>('')
  const [coachPhotoURL, setCoachPhotoURL] = useState<string>('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasNoData, setHasNoData] = useState(false)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)

  // NO REDIRECT LOGIC HERE - Main dashboard handles all routing
  // This page just renders athlete dashboard content

  // Athlete cards matching coach dashboard pattern
  const athleteCards = [
    // Coach Profile Card - First card, only shows if coach is assigned
    ...(coachId && coachName ? [{
      id: 'my-coach',
      title: coachName,
      description: 'View coach profile and training philosophy',
      icon: Users,
      color: '#8D9440',
      path: null,
      action: () => router.push(`/coach/${coachId}`),
      isCoachCard: true // Special flag to render differently
    }] : []),
    {
      id: 'lessons',
      title: 'Review Lessons',
      description: 'Access all assigned and completed training content',
      icon: BookOpen,
      color: '#91A6EB',
      path: null, // Coming soon
      action: () => alert('📚 Lessons feature coming soon! Your coach will assign training content here.')
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
      path: null, // Coming soon
      action: () => alert('📅 Scheduling feature coming soon! Book 1-on-1 sessions with your coach.')
    },
    {
      id: 'ai-chat',
      title: 'Chat with AI Agent',
      description: 'Get instant answers to training questions',
      icon: Sparkles,
      color: '#9333EA',
      path: 'ai-assistant', // Special flag for inline AI component
      action: null
    },
    // Add coach dashboard card conditionally for users who are also coaches
    ...(hasCoachRole ? [{
      id: 'coach-dashboard',
      title: 'Coach Dashboard',
      description: 'Switch to your coach dashboard',
      icon: LayoutDashboard,
      color: '#000000',
      path: null,
      action: () => router.push('/dashboard/coach-unified')
    }] : [])
  ]

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
            userRole === 'assistant_coach' ||
            userRoles.includes('coach') ||
            userRoles.includes('assistant_coach')
          )

          // Get assigned coach ID if exists (use coachId for athletes, assignedCoachId for assistants)
          setCoachId(userData?.coachId || userData?.assignedCoachId || null)

          // Check if user has any data/content
          setHasNoData(!(userData?.coachId || userData?.assignedCoachId) && !completed)
        } else {
          // New user without profile - show onboarding
          setShowOnboarding(true)
          setHasNoData(true)
        }
      } catch (error: any) {
        console.error('Error checking onboarding status:', error)

        // Handle specific Firebase errors gracefully
        if (error?.code === 'permission-denied') {
          setLoadError('permission')
        } else if (error?.message?.includes('Missing or insufficient permissions')) {
          setLoadError('permission')
        } else if (error?.code === 'not-found') {
          setLoadError('not-found')
        } else {
          setLoadError('unknown')
        }
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user])

  // Fetch coach name and profile picture when coachId changes
  useEffect(() => {
    const fetchCoachData = async () => {
      if (!coachId) {
        setCoachName('')
        setCoachPhotoURL('')
        return
      }

      try {
        const coachRef = doc(db, 'users', coachId)
        const coachSnap = await getDoc(coachRef)

        if (coachSnap.exists()) {
          const coachData = coachSnap.data()
          setCoachName(coachData?.displayName || coachData?.email || 'Your Coach')

          // Try to get profile image from users.photoURL first
          let profileImageUrl = coachData?.photoURL || ''

          // If no photoURL, try to get from creator_profiles
          if (!profileImageUrl) {
            try {
              const profileQuery = query(
                collection(db, 'creator_profiles'),
                where('uid', '==', coachId)
              )
              const profileSnap = await getDocs(profileQuery)

              if (!profileSnap.empty) {
                const profileData = profileSnap.docs[0].data()
                profileImageUrl = profileData?.profileImageUrl || ''
              }
            } catch (error) {
              console.warn('Could not fetch creator profile:', error)
            }
          }

          setCoachPhotoURL(profileImageUrl)
        }
      } catch (error) {
        console.warn('Could not fetch coach data:', error)
        setCoachName('Your Coach')
        setCoachPhotoURL('')
      }
    }

    fetchCoachData()
  }, [coachId])

  // Fetch coach's lessons and videos when coachId changes
  useEffect(() => {
    const fetchCoachContent = async () => {
      if (!coachId) {
        setLessonCount(0)
        setVideoCount(0)
        return
      }

      try {
        // 🔍 VERIFICATION: Using correct data model patterns
        // ✅ Collection: content (NOT lessons!)
        // ✅ Field: creatorUid (NOT coachId!)
        // ✅ Pattern: Query content by creator

        const contentRef = collection(db, 'content')
        const contentQuery = query(
          contentRef,
          where('creatorUid', '==', coachId),
          where('status', '==', 'published')
        )
        const contentSnap = await getDocs(contentQuery)

        // Count lessons and videos
        let lessons = 0
        let videos = 0

        contentSnap.forEach(doc => {
          const data = doc.data()
          if (data.type === 'video') {
            videos++
          } else {
            lessons++
          }
        })

        setLessonCount(lessons)
        setVideoCount(videos)

        console.log(`📚 Found ${lessons} lessons and ${videos} videos from coach`)
      } catch (error) {
        console.error('Error fetching coach content:', error)
        setLessonCount(0)
        setVideoCount(0)
      }
    }

    fetchCoachContent()
  }, [coachId])

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true)
    setShowOnboarding(false)
  }

  const handleVideoReviewSuccess = () => {
    alert('✅ Video review request submitted successfully! Your coach will be notified.')
  }

  // Show error state if there's a permission or data loading issue
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 text-center">
            {loadError === 'permission' ? (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-heading mb-3" style={{ color: '#000000' }}>
                  Permission Issue
                </h2>
                <p className="mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                  We're having trouble loading your profile data. This usually happens when your account is still being set up.
                </p>
                <div className="bg-sky-blue/10 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>What you can try:</p>
                  <ul className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
                    <li>• Sign out and sign back in</li>
                    <li>• Contact your coach or administrator</li>
                    <li>• Wait a few minutes and refresh the page</li>
                  </ul>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 rounded-lg text-white font-semibold transition-colors"
                  style={{ backgroundColor: '#91A6EB' }}
                >
                  Return to Dashboard
                </button>
              </>
            ) : loadError === 'not-found' ? (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#20B2AA' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-heading mb-3" style={{ color: '#000000' }}>
                  Profile Not Found
                </h2>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  Your athlete profile hasn't been created yet. Please complete the onboarding process or contact your coach.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 rounded-lg text-white font-semibold transition-colors"
                  style={{ backgroundColor: '#91A6EB' }}
                >
                  Go to Onboarding
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#8D9440' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-heading mb-3" style={{ color: '#000000' }}>
                  Something Went Wrong
                </h2>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  We encountered an unexpected error while loading your dashboard. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-lg text-white font-semibold transition-colors"
                  style={{ backgroundColor: '#91A6EB' }}
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
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

    // Special handling for AI Assistant - render component inline instead of iframe
    if (activeCard.path === 'ai-assistant' && user) {
      return (
        <div className="w-full" style={{ height: '600px' }}>
          <AIAssistant
            mode="inline"
            userId={user.uid}
            userEmail={user.email || ''}
            title={coachName ? `${coachName}'s AI Assistant` : "AI Coach Assistant"}
            context={`You are ${coachName ? coachName + "'s" : "a"} personal AI coaching assistant. You embody ${coachName ? "their" : "expert"} coaching philosophy, voice, and expertise. Provide specific, actionable advice based on ${coachName ? "their" : "professional"} methods and experience. Be personal, not generic.`}
            placeholder={coachName ? `Ask ${coachName.split(' ')[0]} anything...` : "Ask me anything about your training..."}
            requireLegalConsent={true}
            sport={user.displayName?.includes('Soccer') ? 'Soccer' : undefined}
            creatorId={coachId || undefined}
            creatorName={coachName || undefined}
          />
        </div>
      )
    }

    // Default: render as iframe
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

          {/* Your Coach Section - Links to Coach Profile (READ-ONLY) */}
          {!activeSection && coachId && coachName && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-2xl transition-shadow">
              <Link href={`/coach/${coachId}`} className="block p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  {/* Coach Profile Picture */}
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-md flex-shrink-0" style={{ backgroundColor: '#8D9440' }}>
                    {coachPhotoURL ? (
                      <img
                        src={coachPhotoURL}
                        alt={coachName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-heading">
                        {coachName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-heading mb-1" style={{ color: '#000000' }}>
                      Your Coach
                    </h3>
                    <p className="text-lg font-semibold mb-1" style={{ color: '#8D9440' }}>
                      {coachName}
                    </p>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Click to view coach profile →
                    </p>
                  </div>
                </div>
              </Link>
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
                const isCoachCard = card.id === 'my-coach'

                return (
                  <button
                    key={index}
                    onClick={() => handleCardClick(card)}
                    className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
                  >
                    <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-white/50 p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
                      <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                        {/* Icon or Profile Picture */}
                        {isCoachCard ? (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-2 sm:mb-3 shadow-md flex-shrink-0" style={{ backgroundColor: card.color }}>
                            {coachPhotoURL ? (
                              <img
                                src={coachPhotoURL}
                                alt={coachName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-lg font-heading">
                                {coachName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
                            style={{ backgroundColor: card.color }}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        )}

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
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
              {/* Compact Header with Gradient */}
              <div className="bg-gradient-to-r from-sky-blue/20 to-teal/20 px-6 sm:px-8 py-4 sm:py-5 border-b border-white/50">
                <h2 className="text-xl sm:text-2xl font-heading" style={{ color: '#000000' }}>
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Athlete'}!
                </h2>
              </div>

              <div className="p-6 sm:p-8">
                {/* Empty State Message */}
                {hasNoData && !coachId && (
                  <div className="mb-6 p-4 rounded-lg bg-teal/5 border border-teal/20">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#20B2AA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#000000' }}>Getting Started</p>
                        <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                          Waiting for coach assignment. Once connected, you'll see training content here.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats - Persistent and Prominent */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg border border-sky-blue/20">
                    <div className="text-3xl sm:text-4xl font-heading mb-1" style={{ color: '#91A6EB' }}>{lessonCount}</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Lessons</p>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg border border-teal/20">
                    <div className="text-3xl sm:text-4xl font-heading mb-1" style={{ color: '#20B2AA' }}>{videoCount}</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Videos</p>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg border border-orange/20">
                    <div className="text-3xl sm:text-4xl font-heading mb-1" style={{ color: '#FF6B35' }}>0</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Hours</p>
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
