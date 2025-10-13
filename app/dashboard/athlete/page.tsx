'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  BookOpen,
  Video,
  Sparkles,
  Calendar,
  LayoutDashboard,
  ChevronRight,
  X,
  Clock,
  TrendingUp,
  Megaphone,
  ShoppingBag
} from 'lucide-react'
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
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<number>(0)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const loadDismissedAnnouncements = () => {
      try {
        const dismissed = localStorage.getItem('dismissedAnnouncements')
        if (dismissed) {
          setDismissedAnnouncements(new Set(JSON.parse(dismissed)))
        }
      } catch (error) {
        console.error('Error loading dismissed announcements:', error)
      }
    }

    loadDismissedAnnouncements()
  }, [])

  // Handle dismissing an announcement
  const handleDismissAnnouncement = (announcementId: string) => {
    const newDismissed = new Set(dismissedAnnouncements)
    newDismissed.add(announcementId)
    setDismissedAnnouncements(newDismissed)

    // Save to localStorage
    try {
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(newDismissed)))
    } catch (error) {
      console.error('Error saving dismissed announcements:', error)
    }
  }

  // Filter visible announcements (exclude dismissed ones)
  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id))

  // Athlete tools - simplified for sidebar
  const athleteTools = [
    {
      id: 'ai-assistant',
      title: coachName ? `Ask ${coachName.split(' ')[0]}` : 'Ask Your Coach',
      description: 'Chat with your coach\'s AI assistant',
      icon: Sparkles,
      color: '#20B2AA'
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: `${unreadAnnouncements > 0 ? `${unreadAnnouncements} new` : 'View updates from your coach'}`,
      icon: Megaphone,
      color: '#A01C21',
      badge: unreadAnnouncements
    },
    {
      id: 'lessons',
      title: 'My Lessons',
      description: 'View and complete training lessons',
      icon: BookOpen,
      color: '#91A6EB'
    },
    {
      id: 'video-review',
      title: 'Video Review',
      description: 'Request coach feedback on your clips',
      icon: Video,
      color: '#FF6B35'
    },
    {
      id: 'gear',
      title: 'Gear Shop',
      description: 'Browse recommended equipment',
      icon: ShoppingBag,
      color: '#91A6EB'
    },
    ...(hasCoachRole ? [{
      id: 'coach-dashboard',
      title: 'Coach Dashboard',
      description: 'Switch to your coach view',
      icon: LayoutDashboard,
      color: '#000000'
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

          // Check if user also has coach role
          const userRole = userData?.role
          const userRoles = userData?.roles || []
          setHasCoachRole(
            userRole === 'coach' ||
            userRole === 'assistant_coach' ||
            userRoles.includes('coach') ||
            userRoles.includes('assistant_coach')
          )

          setCoachId(userData?.coachId || userData?.assignedCoachId || null)
        } else {
          setShowOnboarding(true)
        }
      } catch (error: any) {
        console.error('Error checking onboarding status:', error)
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
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

  // Fetch coach data
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

          let profileImageUrl = coachData?.photoURL || ''

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
        console.error('Error fetching coach data:', error)
        setCoachName('Your Coach')
        setCoachPhotoURL('')
      }
    }

    fetchCoachData()
  }, [coachId])

  // Fetch lesson counts
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

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!coachId || !user) {
        setAnnouncements([])
        setUnreadAnnouncements(0)
        return
      }

      try {
        const announcementsRef = collection(db, 'announcements')
        const announcementsQuery = query(
          announcementsRef,
          where('creatorUid', '==', coachId)
        )
        const announcementsSnap = await getDocs(announcementsQuery)

        const announcementsList = announcementsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => {
          const dateA = a.sentAt?.toDate?.()?.getTime() || 0
          const dateB = b.sentAt?.toDate?.()?.getTime() || 0
          return dateB - dateA
        })

        setAnnouncements(announcementsList)

        // Count unread (announcements from last 7 days that haven't been dismissed)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Get dismissed IDs from localStorage
        let dismissedIds: string[] = []
        try {
          const dismissed = localStorage.getItem('dismissedAnnouncements')
          if (dismissed) {
            dismissedIds = JSON.parse(dismissed)
          }
        } catch (error) {
          console.error('Error loading dismissed announcements:', error)
        }

        const unread = announcementsList.filter((announcement: any) => {
          const sentAt = announcement.sentAt?.toDate?.()
          return sentAt && sentAt > sevenDaysAgo && !dismissedIds.includes(announcement.id)
        }).length

        setUnreadAnnouncements(unread)
      } catch (error) {
        console.error('Error fetching announcements:', error)
        setAnnouncements([])
        setUnreadAnnouncements(0)
      }
    }

    fetchAnnouncements()
  }, [coachId, user])

  const handleToolClick = (toolId: string) => {
    if (toolId === 'video-review') {
      setShowVideoReviewModal(true)
      return
    }
    if (toolId === 'coach-dashboard') {
      router.push('/dashboard/coach-unified')
      return
    }
    setActiveSection(toolId)
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl mb-3" style={{ color: '#000000' }}>
              {loadError === 'permission' ? 'Permission Issue' : 'Error Loading Dashboard'}
            </h2>
            <p className="mb-6" style={{ color: '#666' }}>
              {loadError === 'permission'
                ? 'Having trouble loading your profile. Try signing out and back in.'
                : 'An error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#91A6EB' }}
            >
              Refresh Page
            </button>
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
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <AthleteOnboardingModal
          userId={user.uid}
          userEmail={user.email || ''}
          onComplete={() => {
            setOnboardingComplete(true)
            setShowOnboarding(false)
          }}
        />
      )}

      {/* Video Review Modal */}
      {showVideoReviewModal && user && (
        <VideoReviewRequestModal
          userId={user.uid}
          userEmail={user.email || ''}
          coachId={coachId || undefined}
          onClose={() => setShowVideoReviewModal(false)}
          onSuccess={() => alert('✅ Video review request submitted!')}
        />
      )}

      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader title="Athlete Dashboard" subtitle="Your training hub for excellence" />

        <main className="relative" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Mobile: Toggle button for sidebar */}
          {activeSection && (
            <button
              onClick={() => setActiveSection(null)}
              className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-black text-white rounded-full shadow-lg flex items-center gap-2 touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Back to Tools
            </button>
          )}

          <div className="flex h-full">
            {/* Left Sidebar - Compact Training Tools */}
            <aside
              className={`w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 overflow-y-auto ${activeSection ? 'hidden lg:block' : 'block'}`}
              style={{ height: '100%' }}
            >
              {/* Sidebar Header with Coach Info */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 p-4">
                {coachId && coachName ? (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-md" style={{ backgroundColor: '#20B2AA' }}>
                      {coachPhotoURL ? (
                        <img src={coachPhotoURL} alt={coachName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                          {coachName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: '#666' }}>Your Coach</p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#000000' }}>
                        {coachName.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <h2 className="text-base font-semibold" style={{ color: '#000000' }}>
                      Training Tools
                    </h2>
                  </div>
                )}
                <p className="text-xs" style={{ color: '#666' }}>
                  {athleteTools.length} tools available
                </p>
              </div>

              {/* Compact Tool List */}
              <div className="p-2 space-y-1">
                {athleteTools.map((tool) => {
                  const Icon = tool.icon
                  const isActive = activeSection === tool.id

                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={`w-full text-left transition-all rounded-lg touch-manipulation active:scale-95 ${
                        isActive ? 'bg-black/10 shadow-md' : 'hover:bg-gray-100/80'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                          style={{ backgroundColor: tool.color }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                          {(tool as any).badge && (tool as any).badge > 0 && (
                            <span
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
                            >
                              {(tool as any).badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium truncate" style={{ color: '#000000' }}>
                              {tool.title}
                            </h3>
                            <ChevronRight
                              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                isActive ? 'rotate-90' : ''
                              }`}
                              style={{ color: tool.color }}
                            />
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#666' }}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Quick Stats in Sidebar */}
              <div className="p-4 mt-4 border-t border-gray-200">
                <p className="text-xs font-semibold mb-3" style={{ color: '#666' }}>Quick Stats</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#666' }}>Lessons</span>
                    <span className="text-sm font-bold" style={{ color: '#91A6EB' }}>{lessonCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#666' }}>Videos</span>
                    <span className="text-sm font-bold" style={{ color: '#20B2AA' }}>{videoCount}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 overflow-hidden relative ${!activeSection ? 'hidden lg:block' : ''}`}>
              {activeSection ? (
                <div className="h-full bg-white/90 backdrop-blur-sm">
                  {/* Content Header - Hidden on mobile to save space */}
                  <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
                        {athleteTools.find(t => t.id === activeSection)?.title}
                      </h2>
                      <p className="text-sm mt-0.5" style={{ color: '#666' }}>
                        {athleteTools.find(t => t.id === activeSection)?.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                      title="Close"
                    >
                      <X className="w-5 h-5" style={{ color: '#000000' }} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="h-full lg:h-[calc(100%-73px)]">
                    {activeSection === 'ai-assistant' && user && (
                      <div className="h-full p-6 overflow-y-auto">
                        <AIAssistant
                          mode="inline"
                          userId={user.uid}
                          userEmail={user.email || ''}
                          title={coachName ? `${coachName}'s AI Assistant` : "AI Coach Assistant"}
                          context={`You are ${coachName || "Coach"}'s AI assistant. Provide specific, technical coaching advice. Always speak as the coach using first person. Be specific with techniques, positions, and step-by-step instructions. Never give generic platitudes.`}
                          placeholder={coachName ? `Ask ${coachName.split(' ')[0]} anything...` : "Ask me anything..."}
                          requireLegalConsent={true}
                          sport="Training"
                          creatorId={coachId || undefined}
                          creatorName={coachName || undefined}
                          userPhotoURL={user.photoURL || undefined}
                          coachPhotoURL={coachPhotoURL || undefined}
                        />
                      </div>
                    )}

                    {activeSection === 'announcements' && (
                      <div className="h-full overflow-y-auto p-6">
                        {visibleAnnouncements.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <Megaphone className="w-16 h-16 mb-4" style={{ color: '#A01C21' }} />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: '#000000' }}>
                              No announcements
                            </h3>
                            <p style={{ color: '#666' }}>
                              {announcements.length > 0
                                ? 'All announcements have been dismissed.'
                                : 'Your coach hasn\'t sent any announcements. Check back later!'}
                            </p>
                          </div>
                        ) : (
                          <div className="max-w-4xl mx-auto space-y-4">
                            {visibleAnnouncements.map((announcement: any) => {
                              const sentAt = announcement.sentAt?.toDate?.()
                              const isRecent = sentAt && sentAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              const isUrgent = announcement.urgent

                              return (
                                <div
                                  key={announcement.id}
                                  className={`rounded-lg p-6 shadow-md border-2 transition-all ${
                                    isUrgent
                                      ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      {isUrgent && (
                                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                          🚨 URGENT
                                        </span>
                                      )}
                                      {isRecent && !isUrgent && (
                                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                                          NEW
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {sentAt && (
                                        <span className="text-xs" style={{ color: '#666' }}>
                                          {sentAt.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleDismissAnnouncement(announcement.id)}
                                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        title="Dismiss announcement"
                                      >
                                        <X className="w-4 h-4" style={{ color: '#666' }} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Title */}
                                  <h3
                                    className="text-xl font-bold mb-3"
                                    style={{ color: isUrgent ? '#DC2626' : '#000000' }}
                                  >
                                    {announcement.title}
                                  </h3>

                                  {/* Message */}
                                  <p
                                    className="whitespace-pre-wrap leading-relaxed"
                                    style={{ color: '#374151' }}
                                  >
                                    {announcement.message}
                                  </p>

                                  {/* Footer */}
                                  <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium" style={{ color: '#666' }}>
                                        From: {coachName}
                                      </span>
                                    </div>
                                    {announcement.sport && (
                                      <span
                                        className="px-3 py-1 bg-gray-100 text-xs font-semibold rounded-full"
                                        style={{ color: '#666' }}
                                      >
                                        {announcement.sport}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeSection === 'lessons' && (
                      <iframe
                        src="/dashboard/athlete-lessons?embedded=true"
                        className="w-full h-full border-0"
                        title="Your Lessons"
                      />
                    )}

                    {activeSection === 'gear' && (
                      <iframe
                        src="/dashboard/gear?embedded=true"
                        className="w-full h-full border-0"
                        title="Gear Shop"
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Welcome State */
                <div className="h-full flex items-center justify-center p-4 sm:p-8">
                  <div className="max-w-2xl text-center">
                    <div className="mb-6">
                      <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" style={{ color: '#20B2AA' }} />
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                        Welcome back, {user?.displayName?.split(' ')[0] || 'Athlete'}!
                      </h2>
                      <p className="text-base sm:text-lg" style={{ color: '#666' }}>
                        Select a tool from the left sidebar to start training
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                      <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-5 border-2" style={{ borderColor: '#20B2AA' }}>
                        <Sparkles className="w-8 h-8 mb-3" style={{ color: '#20B2AA' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Ask Your Coach</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Get instant answers from AI assistant
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-5 border-2" style={{ borderColor: '#91A6EB' }}>
                        <BookOpen className="w-8 h-8 mb-3" style={{ color: '#91A6EB' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Training Lessons</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          {lessonCount} lessons available
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-5 border-2" style={{ borderColor: '#FF6B35' }}>
                        <Video className="w-8 h-8 mb-3" style={{ color: '#FF6B35' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Video Review</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Get feedback on your performance
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-5 border-2 border-purple-500/30">
                        <Clock className="w-8 h-8 mb-3" style={{ color: '#8B5CF6' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Your Progress</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Track your training journey
                        </p>
                      </div>
                    </div>

                    {coachId && coachName && (
                      <div className="mt-4 sm:mt-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 sm:p-5 text-white text-left">
                        <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">🎯 Training with {coachName.split(' ')[0]}</h3>
                        <p className="text-xs sm:text-sm">
                          Your coach has prepared {lessonCount} lessons and {videoCount} videos for your training. Click "Ask {coachName.split(' ')[0]}" to get personalized coaching advice!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
