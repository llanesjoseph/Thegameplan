'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import {
  Users,
  BookOpen,
  Video,
  FileText,
  BarChart3,
  UserPlus,
  Settings,
  Bell,
  UserCog,
  GraduationCap,
  X,
  UserCheck,
  ChevronRight,
  ShoppingBag,
  Calendar,
  Home,
  FileVideo
} from 'lucide-react'

export default function CoachUnifiedDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('home') // Default to Home
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  // Role-based redirect - prevent admins from accessing coach dashboard
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setIsInitializing(true)
      return
    }

    const checkRoleAndRedirect = async () => {
      try {
        // Small delay to ensure Firestore is fully initialized after auth
        await new Promise(resolve => setTimeout(resolve, 500))

        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const role = userDoc.data()?.role

          // Redirect admins to admin dashboard
          if (role === 'admin' || role === 'superadmin') {
            console.log('🛡️ Admin detected on coach page - redirecting to admin dashboard')
            router.replace('/dashboard/admin')
            return
          }
          // Redirect athletes to their dashboard
          else if (role === 'athlete') {
            console.log('🏃 Athlete detected on coach page - redirecting to athlete dashboard')
            router.replace('/dashboard/athlete')
            return
          }
        }

        // If no redirect needed, mark as initialized
        setIsInitializing(false)
      } catch (error) {
        console.error('Error checking role:', error)
        // Even on error, allow the page to load
        setIsInitializing(false)
      }
    }

    checkRoleAndRedirect()
  }, [user?.uid, authLoading, router])

  // Show welcome only once per session
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('coach-welcome-seen')
    if (!hasSeenWelcome) {
      setShowWelcome(true)
      sessionStorage.setItem('coach-welcome-seen', 'true')
    }
  }, [])

  // Load pending live session requests count
  useEffect(() => {
    if (!user?.uid) return

    const loadPendingRequests = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/coach/live-sessions/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setPendingRequestsCount(data.pendingCount || 0)
        }
      } catch (error) {
        console.error('Error loading pending requests count:', error)
      }
    }

    loadPendingRequests()
    // Refresh count every 30 seconds
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [user])

  const coachCards = [
    {
      id: 'home',
      title: 'Home',
      description: 'Today\'s overview and quick actions',
      icon: Home,
      color: '#5A9B9B'
    },
    {
      id: 'video-queue',
      title: 'Video Review Queue',
      description: 'Review athlete video submissions',
      icon: FileVideo,
      color: '#E53E3E'
    },
    {
      id: 'video-analytics',
      title: 'Video Analytics',
      description: 'Track review performance metrics',
      icon: BarChart3,
      color: '#5A52D5'
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Edit your coach profile',
      icon: Settings,
      color: '#C4886A'
    },
    {
      id: 'athletes',
      title: 'My Athletes',
      description: 'View and manage your athletes',
      icon: Users,
      color: '#7B92C4'
    },
    {
      id: 'create-lesson',
      title: 'Create Lesson',
      description: 'Build comprehensive training lessons',
      icon: GraduationCap,
      color: '#5A9B9B'
    },
    {
      id: 'live-sessions',
      title: 'Live 1-on-1 Sessions',
      description: 'Manage session requests',
      icon: Calendar,
      color: '#5A9A70',
      badge: pendingRequestsCount
    },
    {
      id: 'lesson-library',
      title: 'Lesson Library',
      description: 'View and edit all your lessons',
      icon: BookOpen,
      color: '#000000'
    },
    {
      id: 'invite',
      title: 'Invite Athletes',
      description: 'Send bulk invitations to athletes',
      icon: UserPlus,
      color: '#000000'
    },
    {
      id: 'videos',
      title: 'Video Manager',
      description: 'Organize and embed training videos',
      icon: Video,
      color: '#C4886A'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track engagement and progress',
      icon: BarChart3,
      color: '#5A9B9B'
    },
    {
      id: 'assistants',
      title: 'Assistant Coaches',
      description: 'Manage coaching staff',
      icon: UserCog,
      color: '#5A9B9B'
    },
    {
      id: 'recruit-coach',
      title: 'Recruit Fellow Coach',
      description: 'Invite other coaches to join',
      icon: UserCheck,
      color: '#5A9B9B'
    },
    {
      id: 'gear',
      title: 'Gear Recommendations',
      description: 'Recommend equipment to athletes',
      icon: ShoppingBag,
      color: '#C4886A'
    }
  ]

  const getSectionPath = (sectionId: string) => {
    const pathMap: Record<string, string> = {
      'home': '/dashboard/coach/home?embedded=true',
      'video-queue': '/dashboard/coach/queue-bypass?embedded=true',
      'video-analytics': '/dashboard/coach/analytics/video-critique',
      'athletes': '/dashboard/coach/athletes?embedded=true',
      'create-lesson': '/dashboard/coach/lessons/create?embedded=true',
      'live-sessions': '/dashboard/coach/live-sessions?embedded=true',
      'lesson-library': '/dashboard/coach/lessons/library?embedded=true',
      'videos': '/dashboard/coach/videos?embedded=true',
      'analytics': '/dashboard/coach/analytics?embedded=true',
      'invite': '/dashboard/coach/invite?embedded=true',
      'recruit-coach': '/dashboard/coach/recruit?embedded=true',
      'profile': '/dashboard/profile?embedded=true',
      'assistants': '/dashboard/coach/assistants?embedded=true',
      'gear': '/dashboard/coach/gear?embedded=true'
    }
    return pathMap[sectionId]
  }

  // Show loading screen while auth or Firebase initializes
  if (authLoading || isInitializing) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Loading your dashboard...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we set things up</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Coach Dashboard" subtitle="Empower your athletes with expert training" />

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

        {/* Two-column layout: Sidebar + Main Content */}
        <div className="flex h-full">
          {/* Left Sidebar - Compact Coaching Tools */}
          <aside
            className={`bg-white/90 backdrop-blur-sm border-r border-gray-200 transition-all duration-300 overflow-y-auto ${
              isSidebarCollapsed ? 'w-16' : 'w-80'
            } ${activeSection ? 'hidden lg:block' : 'block'}`}
            style={{ height: '100%' }}
          >
            {/* Sidebar Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 p-3 sm:p-4">
              {!isSidebarCollapsed && (
                <h2 className="text-base sm:text-lg font-semibold mb-1" style={{ color: '#000000' }}>
                  Coaching Tools
                </h2>
              )}
              <p className={`text-xs ${isSidebarCollapsed ? 'text-center' : ''}`} style={{ color: '#666' }}>
                {isSidebarCollapsed ? '13' : '13 tools available'}
              </p>
            </div>


            {/* Compact Tool Cards */}
            <div className="p-2 space-y-1">
              {coachCards.map((card) => {
                const Icon = card.icon
                const isActive = activeSection === card.id

                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      // Open these pages directly (not in iframe)
                      if (card.id === 'invite') {
                        router.push('/dashboard/coach/invite')
                      } else if (card.id === 'video-analytics') {
                        router.push('/dashboard/coach/analytics/video-critique')
                      } else {
                        setActiveSection(card.id)
                      }
                    }}
                    className={`w-full text-left transition-all rounded-sm touch-manipulation active:scale-95 ${
                      isActive
                        ? 'bg-black/10 shadow-md'
                        : 'hover:bg-gray-100/80'
                    }`}
                    style={{ minHeight: '44px' }}
                    title={isSidebarCollapsed ? card.title : undefined}
                  >
                    <div className={`flex items-center gap-3 p-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                      {/* Icon with badge */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center"
                          style={{ backgroundColor: card.color }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {/* Notification Badge */}
                        {(card as any).badge && (card as any).badge > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                            {(card as any).badge}
                          </div>
                        )}
                      </div>

                      {/* Text content - hidden when collapsed */}
                      {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium truncate" style={{ color: '#000000' }}>
                                {card.title}
                              </h3>
                              {/* Badge in title area */}
                              {(card as any).badge && (card as any).badge > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {(card as any).badge}
                                </span>
                              )}
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                isActive ? 'rotate-90' : ''
                              }`}
                              style={{ color: card.color }}
                            />
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#666' }}>
                            {card.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Main Content Area - Expanded Iframe */}
          <div className={`flex-1 overflow-hidden relative ${!activeSection ? 'hidden lg:block' : ''}`}>
            {activeSection ? (
              <div className="h-full">
                {/* Iframe Content - Full Height */}
                <iframe
                  src={getSectionPath(activeSection)}
                  className="w-full h-full border-0"
                  title={coachCards.find(c => c.id === activeSection)?.title || 'Section'}
                />
              </div>
            ) : (
              /* Welcome/Empty State */
              <div className="h-full flex items-center justify-center p-4 sm:p-8">
                <div className="max-w-2xl text-center">
                  <div className="mb-6">
                    <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" style={{ color: '#5A9B9B' }} />
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                      Welcome, Coach {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
                    </h2>
                    <p className="text-base sm:text-lg" style={{ color: '#666' }}>
                      Select a tool from the left sidebar to get started
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                    <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-5 border-2" style={{ borderColor: '#7B92C4' }}>
                      <GraduationCap className="w-8 h-8 mb-3" style={{ color: '#7B92C4' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Create Lessons</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Build training lessons with videos and drills
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-5 border-2" style={{ borderColor: '#5A9B9B' }}>
                      <Users className="w-8 h-8 mb-3" style={{ color: '#5A9B9B' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Manage Athletes</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Track progress and engagement
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-5 border-2" style={{ borderColor: '#C4886A' }}>
                      <Video className="w-8 h-8 mb-3" style={{ color: '#C4886A' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Video Library</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Organize all your training videos
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-black/10 to-black/5 rounded-lg p-5 border-2 border-black/20">
                      <BarChart3 className="w-8 h-8 mb-3" style={{ color: '#000000' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Analytics</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        View insights and metrics
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg p-4 sm:p-5 text-white text-left">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">🎯 Quick Start</h3>
                    <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <li><strong>1.</strong> Click any tool in the sidebar to open it</li>
                      <li><strong>2.</strong> Use "Create Lesson" to build your first training</li>
                      <li><strong>3.</strong> Check "Analytics" to track athlete engagement</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
