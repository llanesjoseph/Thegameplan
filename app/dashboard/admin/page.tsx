'use client'
import { useEffect } from 'react'
import { useUrlEnhancedRole } from "@/hooks/use-url-role-switcher"
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import UserSignupTracker from '@/components/admin/UserSignupTracker'
import CoachIngestionManager from '@/components/admin/CoachIngestionManager'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AdminDashboard() {
 const { role } = useUrlEnhancedRole()
 const router = useRouter()
 useEffect(() => {
  if (role !== 'superadmin' && role !== 'admin') router.replace('/dashboard')
 }, [role, router])

 return (
  <div className="min-h-screen bg-gray-50">
   <AppHeader />
   <main className="max-w-6xl mx-auto px-6 py-10">
    <Card>
     <h1 className="text-3xl text-gray-900">Admin Dashboard</h1>
     <p className="text-gray-600 mt-2">Manage creators, content, sponsors, and reviews.</p>

     {/* User Signup Tracker */}
     <div className="mt-8">
      <UserSignupTracker />
     </div>

     {/* Coach Ingestion Manager */}
     <div className="mt-8">
      <CoachIngestionManager />
     </div>

     <div className="grid md:grid-cols-3 gap-6 mt-8">
      <a href="/dashboard/admin/users">
       <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardTitle>User Management</CardTitle>
        <p className="text-gray-600 text-sm mt-2">Manage user accounts and permissions</p>
       </Card>
      </a>

      <a href="/dashboard/admin/admin-invites">
       <Card className="transition-all hover:shadow-md cursor-pointer bg-purple-50">
        <CardTitle>Admin Invitations</CardTitle>
        <p className="text-gray-600 text-sm mt-2">Invite and manage admin team members</p>
       </Card>
      </a>

      <a href="/dashboard/admin/invitations">
       <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardTitle>Athlete Invitations</CardTitle>
        <p className="text-gray-600 text-sm mt-2">View all athlete invitations across coaches</p>
       </Card>
      </a>

      <a href="/dashboard/admin/sync-coaches">
       <Card className="transition-all hover:shadow-md cursor-pointer bg-blue-50">
        <CardTitle>Sync Coaches</CardTitle>
        <p className="text-gray-600 text-sm mt-2">Sync coach profiles to public browse page</p>
       </Card>
      </a>

      <a href="/dashboard/admin/content">
       <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardTitle>Content Review</CardTitle>
        <p className="text-gray-600 text-sm mt-2">Review and moderate content</p>
       </Card>
      </a>

      <a href="/dashboard/admin/analytics">
       <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardTitle>Analytics</CardTitle>
        <p className="text-gray-600 text-sm mt-2">View platform analytics and insights</p>
       </Card>
      </a>
     </div>
    </Card>
   </main>
  </div>
 )
}


