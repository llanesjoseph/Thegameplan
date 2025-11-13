'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import { usePageAnalytics } from '@/hooks/use-page-analytics'
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
import CoachOverview from '@/components/coach/CoachOverview'
import CoachProfile from '@/components/coach/CoachProfile'
import CoachAthletes from '@/components/coach/CoachAthletes'
import CoachLessonLibrary from '@/components/coach/CoachLessonLibrary'
import CoachRecommendedGear from '@/components/coach/CoachRecommendedGear'
import Link from 'next/link'

export default function CoachUnifiedDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('home') // Default to Home
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [pendingVideosCount, setPendingVideosCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  // Track page analytics
  usePageAnalytics()

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
            const role = data.data.role

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

  // Load unread messages count
  useEffect(() => {
    if (!user?.uid) return

    const loadUnreadMessages = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/coach/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const unreadCount = data.messages.filter((msg: any) => msg.status === 'unread').length
            setUnreadMessagesCount(unreadCount)
          }
        }
      } catch (error) {
        console.error('Error loading unread messages count:', error)
      }
    }

    loadUnreadMessages()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Load pending videos count
  useEffect(() => {
    if (!user?.uid) return

    const loadPendingVideos = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/coach/submissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const awaitingCount = data.awaitingCoach?.length || 0
            setPendingVideosCount(awaitingCount)
          }
        }
      } catch (error) {
        console.error('Error loading pending videos count:', error)
      }
    }

    loadPendingVideos()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingVideos, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Handle postMessage events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin for security
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'REVIEW_PUBLISHED') {
        // Close the current section and go back to home
        setActiveSection(null)
        // Optionally refresh the video queue count
        console.log('Review published - returning to dashboard')
      } else if (event.data.type === 'CLOSE_REVIEW') {
        // Close the current section and go back to home
        setActiveSection(null)
        console.log('Review closed - returning to dashboard')
      } else if (event.data.type === 'NAVIGATE_TO_HOME') {
        // Navigate to home section
        setActiveSection('home')
        console.log('Navigating to home from error modal')
      } else if (event.data.type === 'SET_SECTION' && event.data.sectionId) {
        // Change the active section (keeps iframe view)
        setActiveSection(event.data.sectionId)
        console.log('Switching to section:', event.data.sectionId)
      } else if (event.data.type === 'NAVIGATE' && event.data.path) {
        // Navigate to the requested path (full page navigation)
        router.push(event.data.path)
        console.log('Navigating to:', event.data.path)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

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
      id: 'messages',
      title: 'Incoming Messages',
      description: 'View and respond to athlete messages',
      icon: Bell,
      color: '#5A9B9B'
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
      id: 'lesson-library',
      title: 'Lesson Manager',
      description: 'Create, edit, and manage all your lessons',
      icon: BookOpen,
      color: '#5A9B9B'
    },
    {
      id: 'videos',
      title: 'Video Manager',
      description: 'Organize and embed training videos',
      icon: Video,
      color: '#C4886A'
    },
    {
      id: 'feed',
      title: 'Post Updates',
      description: 'Share tips with athletes',
      icon: FileText,
      color: '#5A9A70'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track engagement and progress',
      icon: BarChart3,
      color: '#5A9B9B'
    }
  ]

  const getSectionPath = (sectionId: string) => {
    const pathMap: Record<string, string> = {
      'home': '/dashboard/coach/home?embedded=true',
      'video-queue': '/dashboard/coach/queue-bypass?embedded=true',
      'messages': '/dashboard/coach/messages?embedded=true',
      'athletes': '/dashboard/coach/athletes?embedded=true',
      'lesson-library': '/dashboard/coach/lessons/library?embedded=true',
      'videos': '/dashboard/coach/videos?embedded=true',
      'feed': '/dashboard/coach/feed?embedded=true',
      'analytics': '/dashboard/coach/analytics?embedded=true',
      'profile': '/dashboard/profile?embedded=true'
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

  // Always render the rebranded frameless layout to mirror athlete page
  {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
                ATHLEAP
              </span>
            </Link>
          </div>
        </header>

        <main className="w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="w-full max-w-5xl mx-auto space-y-5">
              <CoachOverview />
              <CoachProfile />
              <CoachAthletes />
              <CoachLessonLibrary />
              <CoachRecommendedGear />
            </div>
          </div>
        </main>
      </div>
    )
  }
}
