'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { BookOpen, Users, MessageSquare, BarChart2, UserCog, PlusSquare } from 'lucide-react'

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
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
            ATHLEAP
          </span>
          <Link href="/dashboard/coach" className="px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:bg-gray-800">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
                Coach Locker Room
              </h1>
              <p className="text-sm text-gray-600">Your tools and resources, in one frameless space.</p>
            </div>

            {/* Frameless square-card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              <a href="/dashboard/coach/lessons/library" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <BookOpen className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Lesson Library</div>
                </div>
              </a>
              <a href="/dashboard/coach/lessons/create" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <PlusSquare className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Create Lesson</div>
                </div>
              </a>
              <a href="/dashboard/coach/athletes" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <Users className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Your Athletes</div>
                </div>
              </a>
              <a href="/dashboard/coach/messages" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Messages</div>
                </div>
              </a>
              <a href="/dashboard/coach/analytics" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <BarChart2 className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Analytics</div>
                </div>
              </a>
              <a href="/dashboard/coach/profile" className="group rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                <div className="w-full aspect-square flex flex-col items-center justify-center">
                  <UserCog className="w-8 h-8 mb-2" />
                  <div className="text-sm font-semibold">Profile</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


