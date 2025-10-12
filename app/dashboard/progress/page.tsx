'use client'

/**
 * Athlete Dashboard - Redesigned with Native AI Assistant Integration
 * Smooth expand/collapse interactions without iFrame feeling
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  BookOpen,
  Video,
  Users,
  Sparkles,
  Calendar,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  X,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'
import AthleteOnboardingModal from '@/components/athlete/AthleteOnboardingModal'
import VideoReviewRequestModal from '@/components/athlete/VideoReviewRequestModal'
import AIAssistant from '@/components/AIAssistant'

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
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasNoData, setHasNoData] = useState(false)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)
  const [coachBio, setCoachBio] = useState<string>('')
  const [coachSport, setCoachSport] = useState<string>('')

  // Athlete cards with AI Assistant as a native card
  const athleteCards = [
    {
      id: 'ai-assistant',
      title: coachName ? `Ask Your Coach ${coachName.split(' ')[0]}` : 'Ask Your Coach',
      description: coachName
        ? `Chat with ${coachName.split(' ')[0]}'s AI assistant about training and techniques`
        : 'Get instant answers from your coach\'s AI assistant',
      icon: Sparkles,
      color: '#20B2AA', // Changed from purple to teal
      path: null,
      action: null,
      expandable: true, // This card expands inline
      isCoachCard: true, // Show coach photo instead of icon
      highlighted: true // Add visual highlight
    },
    {
      id: 'video-review',
      title: 'Request Video Review',
      description: 'Upload a performance clip for coach feedback',
      icon: Video,
      color: '#20B2AA',
      path: null,
      action: () => setShowVideoReviewModal(true),
      expandable: false
    },
    {
      id: 'schedule',
      title: 'Request 1-on-1',
      description: 'Schedule a private training session',
      icon: Calendar,
      color: '#FF6B35',
      path: null,
      action: () => alert('📅 Scheduling feature coming soon! Book 1-on-1 sessions with your coach.'),
      expandable: false
    },
    // Add coach dashboard card conditionally for users who are also coaches
    ...(hasCoachRole ? [{
      id: 'coach-dashboard',
      title: 'Coach Dashboard',
      description: 'Switch to your coach dashboard',
      icon: LayoutDashboard,
      color: '#000000',
      path: null,
      action: () => router.push('/dashboard/coach-unified'),
      expandable: false
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

          // Get assigned coach ID if exists
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
          setCoachBio(coachData?.bio || '')
          setCoachSport(coachData?.sport || 'Coaching')

          // Try to get profile image from users.photoURL first
          let profileImageUrl = coachData?.photoURL || ''
          let bio = coachData?.bio || ''
          let sport = coachData?.sport || 'Coaching'

          // If no photoURL or bio, try to get from creator_profiles
          if (!profileImageUrl || !bio) {
            try {
              const profileQuery = query(
                collection(db, 'creator_profiles'),
                where('uid', '==', coachId)
              )
              const profileSnap = await getDocs(profileQuery)

              if (!profileSnap.empty) {
                const profileData = profileSnap.docs[0].data()
                profileImageUrl = profileImageUrl || profileData?.profileImageUrl || ''
                bio = bio || profileData?.bio || ''
                sport = sport || profileData?.sport || 'Coaching'
              }
            } catch (error) {
              console.warn('Could not fetch creator profile:', error)
            }
          }

          setCoachPhotoURL(profileImageUrl)
          setCoachBio(bio)
          setCoachSport(sport)
        }
      } catch (error) {
        console.error('Error fetching coach data:', error)
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

  const handleCardClick = (card: typeof athleteCards[0]) => {
    // If card has an action, execute it
    if (card.action) {
      card.action()
      return
    }

    // If card has a path (external page), navigate to it
    if (card.path) {
      router.push(card.path)
      return
    }

    // If card is expandable, toggle expansion
    if (card.expandable) {
      setExpandedCard(expandedCard === card.id ? null : card.id)
    }
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
                <h2 className="text-2xl mb-3" style={{ color: '#000000' }}>
                  Permission Issue
                </h2>
                <p className="mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                  We're having trouble loading your profile data. This usually happens when your account is still being set up.
                </p>
                <div className="bg-sky-blue/10 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm mb-2" style={{ color: '#000000' }}>What you can try:</p>
                  <ul className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
                    <li>• Sign out and sign back in</li>
                    <li>• Contact your coach or administrator</li>
                    <li>• Wait a few minutes and refresh the page</li>
                  </ul>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 rounded-lg text-white transition-colors"
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
                <h2 className="text-2xl mb-3" style={{ color: '#000000' }}>
                  Profile Not Found
                </h2>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  Your athlete profile hasn't been created yet. Please complete the onboarding process or contact your coach.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 rounded-lg text-white transition-colors"
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
                <h2 className="text-2xl mb-3" style={{ color: '#000000' }}>
                  Something Went Wrong
                </h2>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  We encountered an unexpected error while loading your dashboard. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-lg text-white transition-colors"
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
          {/* Athlete Tools Grid */}
          <div>
            <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
              Training Tools
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {athleteCards.map((card, index) => {
                const Icon = card.icon
                const isExpanded = expandedCard === card.id
                const isCoachCard = card.isCoachCard || false
                const isHighlighted = card.highlighted

                return (
                  <div key={index} className={`${isCoachCard ? 'col-span-2 sm:col-span-1' : ''} ${isExpanded ? 'col-span-2 sm:col-span-3 md:col-span-4' : ''}`}>
                    {/* Card Button */}
                    <button
                      onClick={() => handleCardClick(card)}
                      className={`block group cursor-pointer text-left transition-all w-full ${isExpanded ? 'ring-2 ring-teal-500 ring-offset-2' : ''} ${isHighlighted ? 'animate-pulse-subtle' : ''}`}
                    >
                      <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isExpanded ? 'bg-white shadow-2xl' : ''} ${isCoachCard ? 'sm:p-6' : ''} ${isHighlighted ? 'border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-white' : 'border border-white/50'}`}>
                        <div className={`flex ${isCoachCard ? 'flex-row items-center gap-4' : 'flex-col'} h-full ${isCoachCard ? 'min-h-[120px]' : 'min-h-[100px] sm:min-h-[120px]'}`}>
                          {/* Icon or Profile Picture */}
                          {isCoachCard ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-xl flex-shrink-0 ring-4 ring-teal-500" style={{ backgroundColor: card.color }}>
                              {coachPhotoURL ? (
                                <img
                                  src={coachPhotoURL}
                                  alt={coachName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl">
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

                          {/* Title and Description */}
                          <div className={`${isCoachCard ? 'flex-1' : 'flex flex-col flex-grow'} ${isExpanded ? 'flex-row items-center justify-between w-full' : ''}`}>
                            <div className={isExpanded ? 'flex-1' : ''}>
                              {/* Title */}
                              <h3 className={`${isCoachCard ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'} mb-1 line-clamp-2`} style={{ color: '#000000' }}>
                                {card.title}
                              </h3>

                              {/* Description */}
                              <p className={`${isCoachCard ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'} ${isCoachCard ? '' : 'flex-grow'} line-clamp-2`} style={{ color: '#000000', opacity: 0.6 }}>
                                {card.description}
                              </p>
                            </div>

                            {/* Expand/Collapse Indicator */}
                            {card.expandable && (
                              <div className={`${isExpanded ? '' : 'hidden sm:block'} mt-2 sm:mt-0`}>
                                <ChevronDown
                                  className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                  style={{ color: card.color }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content - Lessons */}
                    {isExpanded && card.id === 'lessons' && (
                      <div
                        className="mt-4 bg-gradient-to-br from-blue-50/90 to-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-200/50 overflow-hidden animate-slideDown"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-blue-400/10 px-6 py-4 border-b border-blue-200/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color }}>
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                                Your Lessons
                              </h3>
                              <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                                Review and complete your assigned training content
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedCard(null)}
                            className="p-2 hover:bg-orange-100 rounded-full transition-all animate-bounce-slow"
                            title="Collapse Lessons"
                          >
                            <ChevronUp className="w-6 h-6" style={{ color: '#FF6B35' }} />
                          </button>
                        </div>

                        {/* Lessons iframe */}
                        <div style={{ minHeight: '600px', maxHeight: '800px' }}>
                          <iframe
                            src="/dashboard/athlete-lessons?embedded=true"
                            className="w-full h-full border-0"
                            style={{ height: '800px' }}
                            title="Your Lessons"
                          />
                        </div>
                      </div>
                    )}

                    {/* Expanded Content - AI Assistant */}
                    {isExpanded && card.id === 'ai-assistant' && user && (
                      <div
                        className="mt-4 bg-gradient-to-br from-teal-50/90 to-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-teal-200/50 overflow-hidden animate-slideDown"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-500/10 to-teal-400/10 px-6 py-4 border-b border-teal-200/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color }}>
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                                {coachName ? `Your Coach ${coachName.split(' ')[0]}'s AI Assistant` : "Your Coach's AI Assistant"}
                              </h3>
                              <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                                Ask questions about training, techniques, and your coach's philosophy
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedCard(null)}
                            className="p-2 hover:bg-teal-100 rounded-lg transition-colors"
                            title="Close"
                          >
                            <X className="w-5 h-5" style={{ color: '#000000' }} />
                          </button>
                        </div>

                        {/* AI Assistant Component */}
                        <div className="p-6 overflow-y-auto" style={{ minHeight: '500px', maxHeight: '600px' }}>
                          <AIAssistant
                            mode="inline"
                            userId={user.uid}
                            userEmail={user.email || ''}
                            title={coachName ? `${coachName}'s AI Assistant` : "AI Coach Assistant"}
                            context={`You are ${coachName || "Coach"}'s AI assistant, embodying their jiu-jitsu coaching expertise. ${coachName || "Your coach"} is a professional Brazilian Jiu-Jitsu instructor who specializes in teaching fundamental techniques, positional control, and submission mechanics.

CRITICAL INSTRUCTIONS:
1. Always speak as ${coachName || "the coach"}, using first person (I, my, we)
2. Give SPECIFIC technical advice with step-by-step instructions for jiu-jitsu techniques
3. Reference actual positions, grips, and movements (e.g., "From closed guard, control one sleeve with both hands...")
4. Never give generic motivational platitudes - be tactical and technical
5. Include body positioning details, grip fighting tips, and common mistakes to avoid
6. When discussing techniques, break them down into numbered steps
7. Always relate advice back to jiu-jitsu fundamentals and principles

Examples of GOOD responses:
- "Here's how I teach the cross collar choke: First, establish your grips by inserting your right hand deep into their left collar, palm down. Your left hand grabs the opposite collar at the base of their neck..."
- "For posture in closed guard, I always emphasize three points: straight back, elbows in tight, and controlling distance with your frames..."

Examples of BAD responses (NEVER do this):
- "This is a complex subject that deserves thoughtful response..."
- "Understanding fundamentals is important. There are multiple perspectives..."
- "Take time to understand the core concepts..."

Be ${coachName || "the coach"}, be specific, be technical.`}
                            placeholder={coachName ? `Ask ${coachName.split(' ')[0]} anything...` : "Ask me anything about your training..."}
                            requireLegalConsent={true}
                            sport="Brazilian Jiu-Jitsu"
                            creatorId={coachId || undefined}
                            creatorName={coachName || undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Welcome Section (when no card is expanded) */}
          {!expandedCard && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
              {/* Compact Header with Gradient */}
              <div className="bg-gradient-to-r from-sky-blue/20 to-teal/20 px-6 sm:px-8 py-4 sm:py-5 border-b border-white/50">
                <h2 className="text-xl sm:text-2xl" style={{ color: '#000000' }}>
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

                {/* Quick Stats - Clickable Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {/* Lessons Stat Card */}
                  <button
                    onClick={() => setExpandedCard(expandedCard === 'lessons' ? null : 'lessons')}
                    className="text-center p-4 sm:p-5 bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg border border-sky-blue/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                    <div className="text-3xl sm:text-4xl mb-1 font-bold" style={{ color: '#91A6EB' }}>{lessonCount}</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Lessons</p>
                  </button>

                  {/* Videos Stat Card */}
                  <button
                    onClick={() => alert('📹 Video library feature coming soon!')}
                    className="text-center p-4 sm:p-5 bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg border border-teal/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <Video className="w-6 h-6 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                    <div className="text-3xl sm:text-4xl mb-1 font-bold" style={{ color: '#20B2AA' }}>{videoCount}</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Videos</p>
                  </button>

                  {/* Hours/Analytics Stat Card */}
                  <button
                    onClick={() => setExpandedCard(expandedCard === 'stat-hours' ? null : 'stat-hours')}
                    className="text-center p-4 sm:p-5 bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg border border-orange/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                    <div className="text-3xl sm:text-4xl mb-1 font-bold" style={{ color: '#FF6B35' }}>0</div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000', opacity: 0.7 }}>Hours</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Content - Hours & Analytics (outside Welcome Section) */}
          {expandedCard === 'stat-hours' && (
            <div className="bg-gradient-to-br from-orange/10 to-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-orange/20 overflow-hidden animate-slideDown">
              <div className="bg-gradient-to-r from-orange/10 to-orange/5 px-6 py-4 border-b border-orange/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                      Training Analytics
                    </h3>
                    <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                      Track your training time and progress
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedCard(null)}
                  className="p-2 hover:bg-orange/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: '#000000' }} />
                </button>
              </div>
              <div className="p-6">
                {/* Analytics Content */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Total Training Time */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-8 h-8" style={{ color: '#FF6B35' }} />
                      <h4 className="text-lg font-semibold" style={{ color: '#000000' }}>Total Time</h4>
                    </div>
                    <div className="text-4xl font-bold mb-2" style={{ color: '#FF6B35' }}>0 hours</div>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Time spent on training content
                    </p>
                  </div>

                  {/* This Week */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-8 h-8" style={{ color: '#20B2AA' }} />
                      <h4 className="text-lg font-semibold" style={{ color: '#000000' }}>This Week</h4>
                    </div>
                    <div className="text-4xl font-bold mb-2" style={{ color: '#20B2AA' }}>0 hours</div>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Keep building your streak!
                    </p>
                  </div>

                  {/* Lessons Completed */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="w-8 h-8" style={{ color: '#91A6EB' }} />
                      <h4 className="text-lg font-semibold" style={{ color: '#000000' }}>Completed</h4>
                    </div>
                    <div className="text-4xl font-bold mb-2" style={{ color: '#91A6EB' }}>0 / {lessonCount}</div>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Lessons completed this month
                    </p>
                  </div>

                  {/* Streak */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">🔥</div>
                      <h4 className="text-lg font-semibold" style={{ color: '#000000' }}>Streak</h4>
                    </div>
                    <div className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>0 days</div>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Start training to build your streak
                    </p>
                  </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-6 p-4 bg-gradient-to-r from-orange/5 to-yellow/5 rounded-lg border border-orange/20">
                  <p className="text-sm text-center" style={{ color: '#000000', opacity: 0.7 }}>
                    📊 <strong>Detailed analytics coming soon!</strong> Track your training time, completion rates, and progress over time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        @keyframes pulseSubtle {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(20, 184, 166, 0);
          }
        }

        .animate-pulse-subtle {
          animation: pulseSubtle 2s ease-in-out infinite;
        }

        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-bounce-slow {
          animation: bounceSlow 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
