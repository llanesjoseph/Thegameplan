'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  ShoppingBag,
  Rss,
  User,
  FileVideo,
  RefreshCw
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import Live1on1RequestModal from '@/components/athlete/Live1on1RequestModal'
import MyCoachPanel from '@/components/athlete/MyCoachPanel'
import CoachFeedView from '@/components/athlete/CoachFeedView'
import CoachScheduleView from '@/components/athlete/CoachScheduleView'
import AIAssistant from '@/components/AIAssistant'
import AskCoachAI from '@/components/athlete/AskCoachAI'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [showLive1on1Modal, setShowLive1on1Modal] = useState(false)
  const [showCoachPanel, setShowCoachPanel] = useState(false)
  const [hasCoachRole, setHasCoachRole] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string>('')
  const [coachPhotoURL, setCoachPhotoURL] = useState<string>('')
  // Initialize activeSection from URL hash or default to 'home'
  const getInitialSection = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1); // Remove #
      return hash || 'home';
    }
    return 'home';
  };

  const [activeSection, setActiveSection] = useState<string | null>(getInitialSection())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)

  // Athlete tools - simplified for sidebar
  const athleteTools = [
    {
      id: 'home',
      title: 'Home',
      description: 'Today\'s overview and quick actions',
      icon: LayoutDashboard,
      color: '#5A9B9B'
    },
    {
      id: 'video-reviews',
      title: 'Video Reviews',
      description: 'View and submit videos for feedback',
      icon: Video,
      color: '#E53E3E'
    },
    {
      id: 'ai-assistant',
      title: coachName ? `Ask ${coachName.split(' ')[0]}` : 'Ask Your Coach',
      description: 'Chat with your coach\'s AI assistant',
      icon: Sparkles,
      color: '#5A9B9B'
    },
    {
      id: 'coach-feed',
      title: "Coach's Feed",
      description: 'Updates and tips from your coach',
      icon: Rss,
      color: '#5A9B9B'
    },
    {
      id: 'coach-schedule',
      title: "Coach's Schedule",
      description: 'View upcoming events and sessions',
      icon: Calendar,
      color: '#5A9A70'
    },
    {
      id: 'lessons',
      title: 'My Lessons',
      description: 'View and complete training lessons',
      icon: BookOpen,
      color: '#7B92C4'
    },
    {
      id: 'live-session',
      title: 'Live 1-on-1 Session',
      description: 'Schedule a live coaching call',
      icon: Calendar,
      color: '#5A9A70'
    },
    {
      id: 'gear',
      title: 'Gear Shop',
      description: 'Browse recommended equipment',
      icon: ShoppingBag,
      color: '#7B92C4'
    },
    ...(hasCoachRole ? [{
      id: 'coach-dashboard',
      title: 'Coach Dashboard',
      description: 'Switch to your coach view',
      icon: LayoutDashboard,
      color: '#000000'
    }] : [])
  ]

  // Load user data and check if they should be here
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const userRole = userData?.role

          console.log('👤 User loaded:', {
            email: user.email,
            role: userRole,
            displayName: userData?.displayName
          })

          // SAFETY CHECK: If user is NOT an athlete, redirect them
          if (userRole && ['coach', 'admin', 'superadmin', 'assistant_coach'].includes(userRole)) {
            console.log(`⚠️ User has role '${userRole}' - redirecting to correct dashboard`)
            router.push(userRole === 'admin' || userRole === 'superadmin' ? '/dashboard/admin' : '/dashboard/coach-unified')
            return
          }

          // Check if user also has coach role (dual role: athlete who is also a coach)
          const userRoles = userData?.roles || []
          setHasCoachRole(
            userRole === 'coach' ||
            userRole === 'assistant_coach' ||
            userRoles.includes('coach') ||
            userRoles.includes('assistant_coach')
          )

          // Load coach assignment
          const extractedCoachId = userData?.coachId || userData?.assignedCoachId || null
          setCoachId(extractedCoachId)

          // CRITICAL: Log if coach assignment is missing
          if (!extractedCoachId) {
            console.error('⚠️ [ATHLETE-DASHBOARD] WARNING: No coach assignment found for athlete', {
              athleteUid: user?.uid,
              athleteEmail: user?.email,
              userData: {
                coachId: userData?.coachId,
                assignedCoachId: userData?.assignedCoachId,
                creatorUid: userData?.creatorUid
              }
            })
          } else {
            console.log('✅ [ATHLETE-DASHBOARD] Coach ID loaded:', extractedCoachId)
          }
        }
      } catch (error: any) {
        console.error('Error loading user data:', error)
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
          setLoadError('permission')
        } else if (error?.code === 'not-found') {
          setLoadError('not-found')
        } else {
          setLoadError('unknown')
        }
      }
    }

    loadUserData()
  }, [user, router])

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

  // Memoize handleToolClick to prevent recreation on every render
  const handleToolClick = useCallback((toolId: string) => {
    if (toolId === 'live-session') {
      setShowLive1on1Modal(true)
      return
    }
    if (toolId === 'coach-dashboard') {
      router.push('/dashboard/coach-unified')
      return
    }
    setActiveSection(toolId)
    // Update URL hash for browser history
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${toolId}`);
    }
  }, [router])

  // Handle iframe refresh
  const refreshIframe = useCallback(() => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = currentSrc;
    }
  }, [])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Listen for postMessage from embedded iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: only accept messages from our own origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'CHANGE_SECTION' && event.data.section) {
        console.log('📨 Received section change request:', event.data.section)
        handleToolClick(event.data.section)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleToolClick])

  // Fetch lesson counts and athlete submission counts
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLessonCount(0)
        setVideoCount(0)
        return
      }

      try {
        // Fetch coach content for lessons
        let lessons = 0
        if (coachId) {
          const contentRef = collection(db, 'content')
          const contentQuery = query(contentRef)
          const contentSnap = await getDocs(contentQuery)

          contentSnap.forEach(doc => {
            const data = doc.data()
            if (data.creatorUid === coachId && data.status === 'published' && data.type !== 'video') {
              lessons++
            }
          })
        }

        // Fetch athlete's submitted videos using secure API
        let submittedVideos = 0
        try {
          const token = await user.getIdToken()
          const response = await fetch('/api/submissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            submittedVideos = data.submissions?.length || 0
          }
        } catch (apiError) {
          console.warn('Could not fetch submission count via API:', apiError)
        }

        setLessonCount(lessons)
        setVideoCount(submittedVideos)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setLessonCount(0)
        setVideoCount(0)
      }
    }

    fetchStats()
  }, [user, coachId])

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
              style={{ backgroundColor: '#7B92C4' }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Live 1-on-1 Session Modal */}
      {showLive1on1Modal && user && (
        <Live1on1RequestModal
          userId={user.uid}
          userEmail={user.email || ''}
          coachId={coachId || undefined}
          coachName={coachName}
          onClose={() => setShowLive1on1Modal(false)}
          onSuccess={() => alert('✅ Live session request submitted! Your coach will respond soon.')}
        />
      )}

      {/* My Coach Panel */}
      {coachId && (
        <MyCoachPanel
          coachId={coachId}
          isOpen={showCoachPanel}
          onClose={() => setShowCoachPanel(false)}
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
                  <button
                    onClick={() => setShowCoachPanel(true)}
                    className="flex items-center gap-3 mb-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-all active:scale-95 touch-manipulation"
                    style={{ minHeight: '44px' }}
                    title="View coach information"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-md flex-shrink-0" style={{ backgroundColor: '#5A9B9B' }}>
                      {coachPhotoURL ? (
                        <img src={coachPhotoURL} alt={coachName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                          {coachName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs" style={{ color: '#666' }}>My Coach: Quick View</p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#000000' }}>
                        {coachName.split(' ')[0]}
                      </p>
                      <p className="text-[10px]" style={{ color: '#5A9B9B' }}>Tap to view →</p>
                    </div>
                  </button>
                ) : (
                  <div className="mb-3">
                    <h2 className="text-base font-semibold" style={{ color: '#000000' }}>
                      Training Tools
                    </h2>
                  </div>
                )}
                <p className="text-xs" style={{ color: '#666' }}>
                  {athleteTools.filter(t => !t.id.includes('coach-dashboard')).length} tools available
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
                    <span className="text-sm font-bold" style={{ color: '#7B92C4' }}>{lessonCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#666' }}>Videos</span>
                    <span className="text-sm font-bold" style={{ color: '#5A9B9B' }}>{videoCount}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 overflow-hidden relative ${!activeSection ? 'hidden lg:block' : ''}`}>
              {activeSection ? (
                <div className="h-full relative">
                  {/* Refresh Button for iframe sections */}
                  {['home', 'video-reviews', 'lessons', 'gear'].includes(activeSection) && (
                    <button
                      onClick={refreshIframe}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      title="Refresh content"
                    >
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                  )}

                  {/* Content - Full Height */}
                  <div className="h-full">
                    {activeSection === 'home' && (
                      <iframe
                        ref={activeSection === 'home' ? iframeRef : null}
                        src="/dashboard/athlete/home?embedded=true"
                        className="w-full h-full border-0"
                        title="Home"
                      />
                    )}

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

                    {activeSection === 'coach-feed' && user && (
                      <div className="h-full overflow-y-auto">
                        <CoachFeedView />
                      </div>
                    )}

                    {activeSection === 'coach-schedule' && user && (
                      <div className="h-full overflow-y-auto">
                        <CoachScheduleView />
                      </div>
                    )}

                    {activeSection === 'video-reviews' && (
                      <iframe
                        ref={activeSection === 'video-reviews' ? iframeRef : null}
                        src="/dashboard/athlete/reviews?embedded=true"
                        className="w-full h-full border-0"
                        title="Video Reviews"
                      />
                    )}

                    {activeSection === 'lessons' && (
                      <iframe
                        ref={activeSection === 'lessons' ? iframeRef : null}
                        src="/dashboard/athlete-lessons?embedded=true"
                        className="w-full h-full border-0"
                        title="Your Lessons"
                      />
                    )}

                    {activeSection === 'gear' && (
                      <iframe
                        ref={activeSection === 'gear' ? iframeRef : null}
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
                      <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" style={{ color: '#5A9B9B' }} />
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                        Welcome back, {user?.displayName?.split(' ')[0] || 'Athlete'}!
                      </h2>
                      <p className="text-base sm:text-lg" style={{ color: '#666' }}>
                        Select a tool from the left sidebar to start training
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                      <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-5 border-2" style={{ borderColor: '#5A9B9B' }}>
                        <Sparkles className="w-8 h-8 mb-3" style={{ color: '#5A9B9B' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Ask Your Coach</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Get instant answers from AI assistant
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-5 border-2" style={{ borderColor: '#7B92C4' }}>
                        <BookOpen className="w-8 h-8 mb-3" style={{ color: '#7B92C4' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Training Lessons</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          {lessonCount} lessons available
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-5 border-2" style={{ borderColor: '#C4886A' }}>
                        <Video className="w-8 h-8 mb-3" style={{ color: '#C4886A' }} />
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
                      <div className="mt-4 sm:mt-6 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg p-4 sm:p-5 text-white text-left">
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
