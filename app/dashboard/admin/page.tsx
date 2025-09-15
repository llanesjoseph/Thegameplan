'use client'
import { useEffect } from 'react'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const { role, loading } = useEnhancedRole()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (role !== 'admin' && role !== 'superadmin') router.replace('/dashboard')
  }, [role, loading, router])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage creators, content, sponsors, and reviews.</p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <a
              href="/dashboard/admin/users"
              className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600 text-sm">Manage user accounts and permissions</p>
            </a>
            
            <a
              href="/dashboard/admin/content"
              className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Content Review</h2>
              <p className="text-gray-600 text-sm">Review and moderate content</p>
            </a>
            
            <a
              href="/dashboard/admin/analytics"
              className="p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h2>
              <p className="text-gray-600 text-sm">View platform analytics and insights</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}


