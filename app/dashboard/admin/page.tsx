'use client'
import { useEffect } from 'react'
import { useUrlEnhancedRole } from "@/hooks/use-url-role-switcher"
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import UserSignupTracker from '@/components/admin/UserSignupTracker'
import CoachIngestionManager from '@/components/admin/CoachIngestionManager'

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
      <a
       href="/dashboard/admin/users"
       className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
       <h2 className="text-lg  text-gray-900 mb-2">User Management</h2>
       <p className="text-gray-600 text-sm">Manage user accounts and permissions</p>
      </a>

      <a
       href="/dashboard/admin/content"
       className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
       <h2 className="text-lg  text-gray-900 mb-2">Content Review</h2>
       <p className="text-gray-600 text-sm">Review and moderate content</p>
      </a>

      <a
       href="/dashboard/admin/analytics"
       className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
       <h2 className="text-lg  text-gray-900 mb-2">Analytics</h2>
       <p className="text-gray-600 text-sm">View platform analytics and insights</p>
      </a>
     </div>
    </div>
   </main>
  </div>
 )
}


