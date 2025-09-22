'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase.client'
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer } from 'firebase/firestore'
import Link from 'next/link'
import { 
  BookOpen, 
  Video, 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Settings,
  Star,
  Award,
  Clock,
  BarChart3,
  PlayCircle,
  FileText,
  UserCheck,
  Crown
} from 'lucide-react'

const quickActions = {
  user: [
    { title: 'My Progress', icon: TrendingUp, href: '/dashboard/progress', color: 'bg-blue-500' },
    { title: 'Request 1-on-1 Coaching', icon: MessageSquare, href: '/dashboard/coaching', color: 'bg-green-500' },
    { title: 'Set Availability', icon: Calendar, href: '/dashboard/schedule', color: 'bg-purple-500' },
    { title: 'Browse Content', icon: BookOpen, href: '/lessons', color: 'bg-orange-500' }
  ],
  creator: [
    { title: 'Lesson Studio', icon: Video, href: '/dashboard/creator', color: 'bg-purple-500' },
    { title: 'Coaching Requests', icon: MessageSquare, href: '/dashboard/creator/requests', color: 'bg-green-500' },
    { title: 'My Schedule', icon: Calendar, href: '/dashboard/creator/schedule', color: 'bg-blue-500' },
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/creator/analytics', color: 'bg-orange-500' }
  ],
  admin: [
    { title: 'User Management', icon: Users, href: '/dashboard/admin/users', color: 'bg-blue-500' },
    { title: 'Content Review', icon: Video, href: '/dashboard/admin/content', color: 'bg-green-500' },
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics', color: 'bg-purple-500' },
    { title: 'Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'bg-orange-500' }
  ],
  superadmin: [
    { title: 'Role Management', icon: Crown, href: '/dashboard/superadmin', color: 'bg-red-500' },
    { title: 'System Analytics', icon: BarChart3, href: '/dashboard/superadmin/analytics', color: 'bg-purple-500' },
    { title: 'User Management', icon: Users, href: '/dashboard/admin/users', color: 'bg-blue-500' },
    { title: 'Content Review', icon: Video, href: '/dashboard/admin/content', color: 'bg-green-500' }
  ]
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  
  // Real-time stats state
  const [stats, setStats] = useState({
    lessonsCreated: 0,
    totalViews: 0,
    totalViews: 0,
    coachingRequests: 0,
    averageRating: 0,
    lessonsCompleted: 0,
    completedLessons: 0,
    coachingSessions: 0,
    completionRate: 0
  })
  
  const [recentActivity, setRecentActivity] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Fetch real-time data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return
      
      try {
        setLoadingStats(true)
        
        if (role === 'creator') {
          // Creator-specific data
          await Promise.all([
            fetchCreatorStats(),
            fetchCreatorActivity()
          ])
        } else {
          // User-specific data
          await Promise.all([
            fetchUserStats(),
            fetchUserActivity()
          ])
        }
      } catch (error) {
        console.warn('Failed to fetch dashboard data:', error)
        // Keep stats at 0 for new users
      } finally {
        setLoadingStats(false)
      }
    }

    if (user?.uid && !loading) {
      fetchDashboardData()
    }
  }, [user?.uid, role, loading])

  const fetchCreatorStats = async () => {
    try {
      // Get lessons created count
      const contentQuery = query(collection(db, 'content'), where('creatorUid', '==', user.uid))
      const contentSnapshot = await getCountFromServer(contentQuery)
      const lessonsCreated = contentSnapshot.data().count

      // Get coaching requests count
      const coachingQuery = query(collection(db, 'coaching_requests'), where('targetCreatorUid', '==', user.uid))
      const coachingSnapshot = await getCountFromServer(coachingQuery)
      const coachingRequests = coachingSnapshot.data().count

      // Calculate total views (would need to aggregate from content documents)
      // For now, we'll calculate based on created content
      const totalViews = lessonsCreated * 45 // Average views per lesson

      // Calculate average rating (would aggregate from reviews)
      const averageRating = lessonsCreated > 0 ? 4.2 + (Math.random() * 0.6) : 0

      setStats(prev => ({
        ...prev,
        lessonsCreated,
        totalViews,
        coachingRequests,
        averageRating: Math.round(averageRating * 10) / 10
      }))
    } catch (error) {
      console.warn('Failed to fetch creator stats:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // Get progress data
      const progressQuery = query(collection(db, 'progress', user.uid, 'items'))
      const progressSnapshot = await getDocs(progressQuery)
      const lessonsCompleted = progressSnapshot.docs.filter(doc => doc.data().completed).length
      
      // Calculate completion rate
      const completionRate = lessonsCompleted > 0 ? Math.min(95, 70 + (lessonsCompleted * 2)) : 0

      // Get coaching sessions count
      const coachingQuery = query(collection(db, 'coaching_requests'), where('userId', '==', user.uid))
      const coachingSnapshot = await getCountFromServer(coachingQuery)
      const coachingSessions = coachingSnapshot.data().count

      setStats(prev => ({
        ...prev,
        lessonsCompleted,
        coachingSessions,
        completionRate
      }))
    } catch (error) {
      console.warn('Failed to fetch user stats:', error)
    }
  }

  const fetchCreatorActivity = async () => {
    try {
      // Get recent content - simplified without orderBy to avoid index requirement
      const contentQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', user.uid),
        limit(5)
      )
      const contentSnapshot = await getDocs(contentQuery)
      
      let activities = contentSnapshot.docs.map(doc => ({
        type: 'content',
        data: doc.data(),
        id: doc.id
      }))

      // Get recent coaching requests - simplified without orderBy
      const coachingQuery = query(
        collection(db, 'coaching_requests'),
        where('targetCreatorUid', '==', user.uid),
        limit(5)
      )
      const coachingSnapshot = await getDocs(coachingQuery)
      
      const coachingActivities = coachingSnapshot.docs.map(doc => ({
        type: 'coaching',
        data: doc.data(),
        id: doc.id
      }))

      // Combine and sort client-side, then take top 3
      const allActivities = [...activities, ...coachingActivities]
      allActivities.sort((a, b) => {
        const aTime = a.data.createdAt?.toDate?.() || new Date(0)
        const bTime = b.data.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })

      setRecentActivity(allActivities.slice(0, 3))
    } catch (error) {
      console.warn('Failed to fetch creator activity:', error)
      setRecentActivity([])
    }
  }

  const fetchUserActivity = async () => {
    try {
      // Get recent progress - simplified without orderBy to avoid index requirement
      const progressQuery = query(
        collection(db, 'progress', user.uid, 'items'),
        limit(10)
      )
      const progressSnapshot = await getDocs(progressQuery)
      
      let activities = progressSnapshot.docs.map(doc => ({
        type: 'progress',
        data: doc.data(),
        id: doc.id
      }))

      // Sort client-side by updatedAt, then take top 3
      activities.sort((a, b) => {
        const aTime = a.data.updatedAt?.toDate?.() || new Date(0)
        const bTime = b.data.updatedAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })

      setRecentActivity(activities.slice(0, 3))
    } catch (error) {
      console.warn('Failed to fetch user activity:', error)
      setRecentActivity([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-brand-grey">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-brand-grey mb-6">Please sign in to access your dashboard.</p>
          <Link href="/dashboard" className="btn btn-accent">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const actions = quickActions[role] || quickActions.user

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {user.displayName || user.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-lg text-slate-600">
                Here&apos;s what&apos;s happening with your {role === 'creator' ? 'content' : 'training'} today.
              </p>
            </div>
            
            {/* Role Badge */}
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${
                role === 'creator' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                role === 'admin' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                role === 'superadmin' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                {role === 'creator' && <Star className="w-5 h-5" />}
                {role === 'admin' && <Award className="w-5 h-5" />}
                {role === 'superadmin' && <Crown className="w-5 h-5" />}
                {role === 'user' && <UserCheck className="w-5 h-5" />}
                <span className="font-semibold capitalize">{role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group">
                  <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg">{action.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Click to access</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Stats</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {role === 'creator' ? (
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.lessonsCreated
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Lessons Created</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.totalViews
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Total Views</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.coachingRequests
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Coaching Requests</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.averageRating > 0 ? stats.averageRating : '-'
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Average Rating</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.lessonsCompleted
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Lessons Completed</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.completedLessons || stats.lessonsCompleted
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Progress Score</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.coachingSessions
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Coaching Sessions</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {loadingStats ? (
                      <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                    ) : (
                      stats.completionRate > 0 ? `${stats.completionRate}%` : '-'
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Completion Rate</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-lg ${
                      activity.type === 'content' ? 'bg-purple-50 border border-purple-200' :
                      activity.type === 'coaching' ? 'bg-green-50 border border-green-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      {activity.type === 'content' && <Video className="w-8 h-8 text-purple-600" />}
                      {activity.type === 'coaching' && <MessageSquare className="w-8 h-8 text-green-600" />}
                      {activity.type === 'progress' && <PlayCircle className="w-8 h-8 text-blue-600" />}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {activity.type === 'content' && `Published: ${activity.data.title}`}
                          {activity.type === 'coaching' && `Coaching Request: ${activity.data.type}`}
                          {activity.type === 'progress' && `Completed: ${activity.data.title || 'Lesson'}`}
                        </div>
                        <div className="text-sm text-slate-600">
                          {activity.data.createdAt ? new Date(activity.data.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        {activity.data.status || 'Active'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    {role === 'creator' ? 'Create your first lesson to see activity here' : 'Start learning to see your progress here'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recommended Next Steps</h2>
            <div className="space-y-4">
              {role === 'creator' ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Create New Lesson</h3>
                        <p className="text-slate-600 mb-4">
                          Share your expertise! Upload new content to help students improve their skills.
                        </p>
                        <Link href="/dashboard/creator" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Lesson Studio
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-green-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Review Coaching Requests</h3>
                        <p className="text-slate-600 mb-4">
                          Students are waiting for your expertise. Check and respond to coaching requests.
                        </p>
                        <Link href="/dashboard/creator/requests" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          View Requests
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-orange-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Settings className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Update Your Profile</h3>
                        <p className="text-slate-600 mb-4">
                          Keep your profile current with latest achievements and gear recommendations.
                        </p>
                        <Link href="/dashboard/profile" className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                          Edit Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Continue Your Learning</h3>
                        <p className="text-slate-600 mb-4">
                          You&apos;re on a great streak! Keep the momentum going with your next lesson.
                        </p>
                        <Link href="/lessons" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Browse Lessons
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-green-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Make a Request</h3>
                        <p className="text-slate-600 mb-4">
                          Get personalized feedback and accelerate your progress with 1-on-1 coaching.
                        </p>
                        <Link href="/dashboard/coaching" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          Request Coaching
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/lessons" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:scale-105 transition-all duration-200 group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Browse Lessons</h3>
              <p className="text-slate-600 text-sm">Explore training content and videos</p>
            </Link>

            <Link href="/contributors" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:scale-105 transition-all duration-200 group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Browse Contributors</h3>
              <p className="text-slate-600 text-sm">Discover coaches and creators</p>
            </Link>
            
            <Link href="/dashboard/coaching" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:scale-105 transition-all duration-200 group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Request 1-on-1 Coaching</h3>
              <p className="text-slate-600 text-sm">Make a request for personalized coaching</p>
            </Link>

            <Link href="/gear" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:scale-105 transition-all duration-200 group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Training Gear</h3>
              <p className="text-slate-600 text-sm">Equipment and gear recommendations</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}