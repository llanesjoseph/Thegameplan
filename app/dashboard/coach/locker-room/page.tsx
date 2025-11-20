'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { Calendar, Video, Users, FileText, Facebook, Instagram, Youtube, Linkedin, X } from 'lucide-react'
import EnhancedAthleteRosterModal from '@/components/coach/EnhancedAthleteRosterModal'
import CoachContentUpload from '@/components/coach/CoachContentUpload'

const trainingActions = [
  {
    key: 'athletes',
    title: 'Manage Athletes',
    description: 'See and manage athlete lists for your community',
    icon: Users
  },
  {
    key: 'create-lesson',
    title: 'Create Lessons',
    description: 'Build new training lessons',
    icon: FileText
  },
  {
    key: 'add-content',
    title: 'Videos & Content',
    description: 'Upload content to your profile',
    icon: Video
  }
]

const calendarActions = [
  {
    key: 'event-schedule',
    title: 'Event Calendar',
    description: 'Add community events and upcoming games',
    icon: Calendar
  },
  {
    key: 'schedule-session',
    title: 'Training Schedule',
    description: 'Review requests and add 1:1 coaching sessions',
    icon: FileText
  }
]

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
    <div className="min-h-screen bg-[#4B0102] text-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.03em' }}>
              ATHLEAP
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/coach"
            className="px-4 py-2 rounded-full border border-white/40 text-sm font-semibold hover:bg-white/10 transition-colors"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Return to Dashboard
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
            className="px-4 py-2 rounded-full bg-white text-[#4B0102] text-sm font-semibold hover:bg-gray-100 transition-colors"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-16">
          <section
            className="bg-white rounded-[28px] shadow-xl px-8 sm:px-16 py-12 text-center"
            style={{ border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="flex justify-center mb-6">
              <img
                src="/brand/athleap-logo-colored.png"
                alt="Athleap logo"
                className="w-[113px] h-[122px] object-cover"
              />
            </div>
            <h1
              className="font-bold mb-4"
              style={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '40px',
                letterSpacing: '-0.05em',
                color: '#F62004',
                lineHeight: 'normal'
              }}
            >
              Welcome to your locker room.
            </h1>
            <p
              style={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '30px',
                lineHeight: '1.3em',
                color: '#000000'
              }}
            >
              Manage your athletes, lessons, and sessions.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard/coach"
                className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
                style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#C40000' }}
              >
                View Your Profile
                <span aria-hidden="true" className="inline-flex">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 12h13.17l-4.58 4.59L15 18l6-6-6-6-1.41 1.41L18.17 11H5z" />
                  </svg>
                </span>
              </Link>
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em]" style={{ color: '#FFD6C9', fontFamily: '"Open Sans", sans-serif' }}>
                Locker Tools
              </p>
              <h2 className="text-2xl font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                Athletes and Training Content
              </h2>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {trainingActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.key}
                    onClick={() => setActiveModal(action.key)}
                    className="group text-left rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #FF3B1D 0%, #8B0C01 100%)' }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {action.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/90" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {action.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

  <section className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em]" style={{ color: '#FFD6C9', fontFamily: '"Open Sans", sans-serif' }}>
                Planning
              </p>
              <h2 className="text-2xl font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                Calendar and Events
              </h2>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {calendarActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.key}
                    onClick={() => setActiveModal(action.key)}
                    className="group text-left rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #FF3B1D 0%, #8B0C01 100%)' }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {action.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/90" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {action.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-end gap-5">
          <a href="https://www.linkedin.com/company/athleap" className="text-gray-500 hover:text-black" aria-label="LinkedIn">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://www.facebook.com" className="text-gray-500 hover:text-black" aria-label="Facebook">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="https://twitter.com" className="text-gray-500 hover:text-black" aria-label="Twitter">
            <X className="w-5 h-5" />
          </a>
          <a href="https://www.instagram.com" className="text-gray-500 hover:text-black" aria-label="Instagram">
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </footer>

      {/* Modals */}
      <EnhancedAthleteRosterModal
        isOpen={activeModal === 'athletes'}
        onClose={() => setActiveModal(null)}
      />

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


