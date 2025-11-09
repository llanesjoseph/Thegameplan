'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { usePageAnalytics } from '@/hooks/use-page-analytics'
// Removed client-side Firebase imports - using secure API endpoints instead
import {
  Video,
  Calendar,
  LayoutDashboard,
  ChevronRight,
  X,
  Clock,
  TrendingUp,
  User,
  FileVideo,
  RefreshCw
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import MyCoachPanel from '@/components/athlete/MyCoachPanel'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Track page analytics
  usePageAnalytics()

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
  const [videoCount, setVideoCount] = useState<number>(0)
  const [completedReviewsCount, setCompletedReviewsCount] = useState<number>(0)

  // Athlete tools - reduced scope (core video feedback loop only)
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
      color: '#E53E3E',
      badge: completedReviewsCount
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
        // Use secure API to get user role instead of client-side Firebase
        const token = await user.getIdToken()
        const response = await fetch('/api/user/role', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const userRole = data.data.role

            console.log('👤 User loaded:', {
              email: user.email,
              role: userRole,
              displayName: user.displayName
            })

            // SAFETY CHECK: If user is NOT an athlete, redirect them
            if (userRole && ['coach', 'admin', 'superadmin', 'assistant_coach'].includes(userRole)) {
              console.log(`⚠️ User has role '${userRole}' - redirecting to correct dashboard`)
              router.push(userRole === 'admin' || userRole === 'superadmin' ? '/dashboard/admin' : '/dashboard/coach-unified')
              return
            }

            // Check if user also has coach role (dual role: athlete who is also a coach)
            setHasCoachRole(
              userRole === 'coach' ||
              userRole === 'assistant_coach'
            )

            // Coach data will be loaded by the separate useEffect
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

  // Handle postMessage events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin for security
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'NAVIGATE_TO_VIDEO_REVIEW') {
        setActiveSection('video-review')
        console.log('Navigating to video review from lesson completion')
      } else if (event.data.type === 'NAVIGATE_TO_AI_ASSISTANT') {
        setActiveSection('ai-assistant')
        console.log('Navigating to AI assistant from lesson completion')
      } else if (event.data.type === 'NAVIGATE_TO_LESSONS') {
        setActiveSection('lessons')
        console.log('Navigating to lessons from lesson completion')
      } else if (event.data.type === 'NAVIGATE_TO_GET_FEEDBACK') {
        // Navigate to get-feedback page (outside iframe)
        router.push('/dashboard/athlete/get-feedback')
        console.log('Navigating to get-feedback page')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  // Fetch coach data using secure API
  useEffect(() => {
    const fetchCoachData = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/athlete/coach-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCoachName(data.data.coachName)
            setCoachPhotoURL(data.data.coachPhotoURL)
            if (data.data.coachId) {
              setCoachId(data.data.coachId)
            }
          }
        } else {
          console.warn('Failed to fetch coach data')
          setCoachName('Your Coach')
          setCoachPhotoURL('')
        }
      } catch (error) {
        console.error('Error fetching coach data:', error)
        setCoachName('Your Coach')
        setCoachPhotoURL('')
      }
    }

    fetchCoachData()
  }, [user])

  // Memoize handleToolClick to prevent recreation on every render
  const handleToolClick = useCallback((toolId: string) => {
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
    // Create abort controller for cleanup
    const abortController = new AbortController()
    let isMounted = true

    const fetchStats = async () => {
      if (!user) {
        setVideoCount(0)
        return
      }

      try {
        const token = await user.getIdToken()

        // Fetch athlete's submitted videos using secure API
        let submittedVideos = 0
        try {
          const response = await fetch('/api/submissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal,
          })
          
          if (response.ok) {
            const data = await response.json()
            submittedVideos = data.submissions?.length || 0
          }
        } catch (apiError) {
          if (apiError instanceof Error && apiError.name !== 'AbortError') {
            console.warn('Could not fetch submission count via API:', apiError)
          }
        }

        // Fetch completed reviews count (new reviews ready to view)
        let completedCount = 0
        try {
          const reviewsResponse = await fetch('/api/submissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal,
          })
          
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json()
            const submissions = reviewsData.submissions || []
            // Only count unviewed completed reviews for badge
            completedCount = submissions.filter((s: any) => s.status === 'complete' && !s.viewed).length
          }
        } catch (reviewError) {
          if (reviewError instanceof Error && reviewError.name !== 'AbortError') {
            console.warn('Could not fetch completed reviews count:', reviewError)
          }
        }

        // Check if component is still mounted before setting state
        if (isMounted) {
          setVideoCount(submittedVideos)
          setCompletedReviewsCount(completedCount)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        setVideoCount(0)
        setCompletedReviewsCount(0)
      }
    }

    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    // Cleanup function
    return () => {
      clearInterval(interval)
      abortController.abort()
      isMounted = false
    }
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
                      className={`w-full text-left transition-all rounded-lg touch-manipulation active:scale-95 relative ${
                        isActive ? 'bg-black/10 shadow-md' : 'hover:bg-gray-100/80'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: tool.color }}
                        >
                          <Icon className="w-4 h-4 text-white" />
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

    {activeSection === 'video-reviews' && (
      <div className="h-full overflow-hidden">
        <iframe
          src="/dashboard/athlete/reviews?embedded=true"
          className="w-full h-full border-0"
          title="Video Reviews"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left max-w-lg mx-auto">
                      <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-5 border-2" style={{ borderColor: '#C4886A' }}>
                        <Video className="w-8 h-8 mb-3" style={{ color: '#C4886A' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Video Reviews</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Submit and review your training videos
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-5 border-2" style={{ borderColor: '#5A9B9B' }}>
                        <TrendingUp className="w-8 h-8 mb-3" style={{ color: '#5A9B9B' }} />
                        <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Your Progress</h3>
                        <p className="text-sm" style={{ color: '#666' }}>
                          Track your improvement over time
                        </p>
                      </div>
                    </div>

                    {coachId && coachName && (
                      <div className="mt-4 sm:mt-6 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg p-4 sm:p-5 text-white text-left max-w-lg mx-auto">
                        <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">🎯 Training with {coachName.split(' ')[0]}</h3>
                        <p className="text-xs sm:text-sm">
                          Submit your videos for expert feedback from {coachName}. Your coach will review and provide detailed analysis to help you improve.
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
