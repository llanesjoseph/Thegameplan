'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'

export default function CoachLockerRoom() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()

  if (!user || (role !== 'coach' && role !== 'creator' && role !== 'superadmin' && role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center border rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-2">Access restricted</h1>
          <p className="text-gray-600 mb-4">This area is for coaches.</p>
          <Link href="/dashboard/coach" className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800">
            Back to Coach Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Coach Locker Room</h1>
          <Link
            href="/dashboard/coach"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <section>
            <h2 className="text-lg font-bold mb-2">Work in progress</h2>
            <p className="text-gray-700">
              This space will host coach resources, templates, announcements, and community tools. For now, you can
              continue managing athletes, lessons, and gear from your dashboard.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


