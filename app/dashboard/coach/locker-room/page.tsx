'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { Calendar, Video, Users, FileText, Facebook, Instagram, Youtube, Linkedin, X } from 'lucide-react'
import AthleteEngagementList from '@/components/coach/AthleteEngagementList'
import CoachContentUpload from '@/components/coach/CoachContentUpload'

export default function CoachLockerRoom() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied only after loading is complete
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
            ATHLEAP
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/coaches"
              className="px-4 py-2 text-sm font-bold hover:opacity-80 transition-opacity"
              style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}
            >
              Browse Coaches
            </Link>
            <button
              onClick={async () => {
                if (isSigningOut) return
                setIsSigningOut(true)
                setTimeout(async () => {
                  try {
                    await signOut(auth)
                  } catch (e) {
                    console.error('Sign out failed:', e)
                  } finally {
                    window.location.href = '/'
                  }
                }, 900)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isSigningOut ? 'bg-gray-800 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              style={{ fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
            >
              {isSigningOut ? 'Goodbye…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full max-w-6xl mx-auto space-y-5">
            {/* Return to Dashboard - Top Right */}
            <div className="flex justify-end">
              <Link
                href="/dashboard/coach"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm inline-block"
                style={{ fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
              >
                Return to Dashboard
              </Link>
            </div>
            {/* Welcome Section */}
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
                Welcome to your locker room, {user?.displayName || 'Coach'}!
              </h1>
              <p className="text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Empower your athletes with expert training
              </p>
            </div>

            {/* Athletes and Training Content */}
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
                Athletes and Training Content
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Manage Athletes */}
                <button
                  onClick={() => setActiveModal('athletes')}
                  className="text-left w-full"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-1" style={{ backgroundColor: '#8B7D7B' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Manage Athletes
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    See and Manage Athlete List
                  </p>
                </button>

                {/* Create Lesson */}
                <button
                  onClick={() => setActiveModal('create-lesson')}
                  className="text-left w-full"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-1" style={{ backgroundColor: '#8B7D7B' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Create Lesson
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Build New Training
                  </p>
                </button>

                {/* Add Videos and Content */}
                <button
                  onClick={() => setActiveModal('add-content')}
                  className="text-left w-full"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-1" style={{ backgroundColor: '#8B7D7B' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Add Videos and Content
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Upload Content to Your Profile
                  </p>
                </button>
              </div>
            </div>

            {/* Calendar and Events */}
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
                Calendar and Events
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Event Schedule */}
                <button
                  onClick={() => setActiveModal('event-schedule')}
                  className="text-left w-full"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-1" style={{ backgroundColor: '#8B7D7B' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Event Schedule
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Add Community Events for Athletes
                  </p>
                </button>

                {/* Schedule Training Session */}
                <button
                  onClick={() => setActiveModal('schedule-session')}
                  className="text-left w-full"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-1" style={{ backgroundColor: '#8B7D7B' }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Schedule Training Session
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    Review Requests and Add to Calendar
                  </p>
                </button>

              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4 pt-8">
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'athletes' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Athlete Roster & Invitations
                </h2>
                <p className="text-sm mt-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Track athlete status and engagement
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" style={{ color: '#000000' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AthleteEngagementList />
            </div>
          </div>
        </div>
      )}

      {activeModal === 'create-lesson' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Create Lesson
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-black text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <iframe
              src="/dashboard/coach/lessons/create?embedded=true"
              className="w-full h-[70vh] border-0 rounded-lg"
              title="Create Lesson"
            />
          </div>
        </div>
      )}

      {activeModal === 'add-content' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  Add Videos and Content
                </h2>
                <p className="text-sm mt-1" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                  Upload training videos and documents for your athletes
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" style={{ color: '#000000' }} />
              </button>
            </div>
            <CoachContentUpload />
          </div>
        </div>
      )}

      {activeModal === 'event-schedule' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Event Schedule
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-black text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <iframe
              src="/dashboard/coach/events?embedded=true"
              className="w-full h-[60vh] border-0 rounded-lg"
              title="Event Schedule"
            />
          </div>
        </div>
      )}

      {activeModal === 'schedule-session' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Schedule Training Session
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-black text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <iframe
              src="/dashboard/coach/live-sessions?embedded=true"
              className="w-full h-[60vh] border-0 rounded-lg"
              title="Schedule Training Session"
            />
          </div>
        </div>
      )}
    </div>
  )
}


