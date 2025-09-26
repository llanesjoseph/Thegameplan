'use client'

import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import { useEffect, useState } from 'react'
import { getAssistantCoachAssignments, AssistantCoachAssignment } from '@/lib/assistant-coach-service'
import { MessageCircle, Calendar, Users, BarChart3, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'

interface DashboardStats {
 pendingRequests: number
 upcomingScheduled: number
 managedAthletes: number
 thisWeekActivity: number
}

export default function AssistantCoachDashboard() {
 const { user } = useAuth()
 const { role } = useUrlEnhancedRole()
 const [assignments, setAssignments] = useState<AssistantCoachAssignment[]>([])
 const [stats, setStats] = useState<DashboardStats>({
  pendingRequests: 0,
  upcomingScheduled: 0,
  managedAthletes: 0,
  thisWeekActivity: 0
 })
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  if (user?.uid) {
   loadDashboardData()
  }
 }, [user])

 const loadDashboardData = async () => {
  try {
   setLoading(true)

   // Load assistant coach assignments (with error handling for permissions)
   try {
    const userAssignments = await getAssistantCoachAssignments(user!.uid)
    setAssignments(userAssignments)
   } catch (assignmentError) {
    console.warn('Could not load assistant coach assignments (may be due to permissions):', assignmentError)
    // Set empty assignments for demo/testing purposes
    setAssignments([])
   }

   // TODO: Load actual stats from Firestore
   // For now, using mock data
   setStats({
    pendingRequests: 5,
    upcomingScheduled: 3,
    managedAthletes: 12,
    thisWeekActivity: 8
   })
  } catch (error) {
   console.error('Error loading dashboard data:', error)
  } finally {
   setLoading(false)
  }
 }

 // Allow access for assistant coaches and superadmins (for role testing)
 const userRole = user?.role
 const hasAccess = role === 'assistant_coach' || userRole === 'superadmin'

 if (!hasAccess) {
  return (
   <div className="p-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
     <p className="text-red-800">Access denied. This page is only accessible to assistant coaches.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="p-6">
    <div className="animate-pulse">
     <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => (
       <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
      ))}
     </div>
    </div>
   </div>
  )
 }

 return (
  <div>
   <AppHeader />
   <div className="p-6">
   {/* Header */}
   <div className="mb-8">
    <h1 className="text-3xl text-gray-900 mb-2">Assistant Coach Dashboard</h1>
    <p className="text-gray-600">Manage coaching activities and support your assigned coaches</p>
   </div>

   {/* Assignments Overview */}
   {assignments.length > 0 && (
    <div className="mb-8">
     <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Coach Assignments</h2>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((assignment) => (
       <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
         <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">
           {assignment.coachName.charAt(0)}
          </span>
         </div>
         <div>
          <h3 className="font-semibold text-gray-900">{assignment.coachName}</h3>
          <p className="text-sm text-gray-600">{assignment.coachEmail}</p>
         </div>
        </div>
        <div className="text-xs text-gray-500">
         Assigned {new Date(assignment.assignedAt.toDate()).toLocaleDateString()}
        </div>
       </div>
      ))}
     </div>
    </div>
   )}

   {/* Stats Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Link href="/dashboard/assistant/requests" className="group">
     <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
       <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
        <MessageCircle className="w-6 h-6 text-green-600" />
       </div>
       <span className="text-green-600 text-2xl ">{stats.pendingRequests}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">Pending Requests</h3>
      <p className="text-sm text-gray-600">Coaching requests awaiting response</p>
     </div>
    </Link>

    <Link href="/dashboard/assistant/schedule" className="group">
     <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
       <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
        <Calendar className="w-6 h-6 text-orange-600" />
       </div>
       <span className="text-orange-600 text-2xl ">{stats.upcomingScheduled}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">Upcoming Sessions</h3>
      <p className="text-sm text-gray-600">Scheduled coaching sessions</p>
     </div>
    </Link>

    <Link href="/dashboard/assistant/athletes" className="group">
     <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
       <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
        <Users className="w-6 h-6 text-purple-600" />
       </div>
       <span className="text-purple-600 text-2xl ">{stats.managedAthletes}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">Managed Athletes</h3>
      <p className="text-sm text-gray-600">Athletes under your support</p>
     </div>
    </Link>

    <Link href="/dashboard/assistant/analytics" className="group">
     <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
       <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
        <BarChart3 className="w-6 h-6 text-pink-600" />
       </div>
       <span className="text-pink-600 text-2xl ">{stats.thisWeekActivity}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">This Week Activity</h3>
      <p className="text-sm text-gray-600">Actions completed this week</p>
     </div>
    </Link>
   </div>

   {/* Quick Actions */}
   <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <Link
      href="/dashboard/assistant/requests"
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
     >
      <MessageCircle className="w-5 h-5 text-green-600" />
      <span className="font-medium text-gray-900">Review Requests</span>
     </Link>

     <Link
      href="/dashboard/assistant/schedule"
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
     >
      <Calendar className="w-5 h-5 text-orange-600" />
      <span className="font-medium text-gray-900">Manage Schedule</span>
     </Link>

     <Link
      href="/dashboard/assistant/athletes"
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
     >
      <Users className="w-5 h-5 text-purple-600" />
      <span className="font-medium text-gray-900">Check Athletes</span>
     </Link>

     <Link
      href="/dashboard/assistant/content"
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
     >
      <Clock className="w-5 h-5 text-blue-600" />
      <span className="font-medium text-gray-900">Organize Content</span>
     </Link>
    </div>
   </div>

   {/* Recent Activity */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
    <div className="space-y-4">
     {/* Mock recent activity items */}
     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <div className="flex-1">
       <p className="font-medium text-gray-900">Responded to coaching request</p>
       <p className="text-sm text-gray-600">Helped athlete with technique review - 2 hours ago</p>
      </div>
     </div>

     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Calendar className="w-5 h-5 text-orange-600" />
      <div className="flex-1">
       <p className="font-medium text-gray-900">Scheduled training session</p>
       <p className="text-sm text-gray-600">Set up 1:1 session for tomorrow - 4 hours ago</p>
      </div>
     </div>

     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Users className="w-5 h-5 text-purple-600" />
      <div className="flex-1">
       <p className="font-medium text-gray-900">Updated athlete progress</p>
       <p className="text-sm text-gray-600">Tracked improvement for 3 athletes - Yesterday</p>
      </div>
     </div>
    </div>
   </div>
  </div>
 </div>
 )
}