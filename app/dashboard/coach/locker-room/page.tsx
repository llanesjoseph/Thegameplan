'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { signOut } from 'firebase/auth'
import { X } from 'lucide-react'
import { auth } from '@/lib/firebase.client'
import EnhancedAthleteRosterModal from '@/components/coach/EnhancedAthleteRosterModal'
import CoachContentUpload from '@/components/coach/CoachContentUpload'
import lockerLogo from '@/Favicon/Wordpress Transparent.png'

type LockerAction = {
  key: string
  title: string
  description: string
}

const trainingActions: LockerAction[] = [
  {
    key: 'athletes',
    title: 'Manage Athletes',
    description: 'See and manage athlete lists for your community'
  },
  {
    key: 'create-lesson',
    title: 'Create Lessons',
    description: 'Build new training lessons'
  },
  {
    key: 'add-content',
    title: 'Videos & Content',
    description: 'Upload content to your profile'
  }
]

const calendarActions: LockerAction[] = [
  {
    key: 'event-schedule',
    title: 'Event Calendar',
    description: 'Add community events and upcoming games'
  },
  {
    key: 'schedule-session',
    title: 'Training Schedule',
    description: 'Review requests and add 1:1 coaching sessions'
  }
]

export default function CoachLockerRoom() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [coachSportLabel, setCoachSportLabel] = useState('')

  useEffect(() => {
    if (!user) return
    let isMounted = true

    const loadCoachSport = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/coach-profile/get', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          console.warn('Failed to fetch coach profile for locker room header')
          return
        }

        const data = await response.json()
        const sport = data?.data?.sport
        if (sport && isMounted) {
          setCoachSportLabel(sport)
        }
      } catch (error) {
        console.warn('Unable to load coach sport for locker room', error)
      }
    }

    loadCoachSport()

    return () => {
      isMounted = false
    }
  }, [user])

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

  const communityLabel = coachSportLabel ? `Coach Community - ${coachSportLabel}` : 'Coach Community - Locker Room'

  return (
    <div className="min-h-screen bg-[#4B0102] text-white flex flex-col">
      <div className="sticky top-0 z-40 shadow-sm">
        <div className="w-full bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.04em', color: '#181818' }}>
                  ATHLEAP
                </span>
              </Link>
              <div className="flex items-center gap-3">
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
                  className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          </header>
          <section aria-label="Coach community banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3">
              <p
                className="text-right font-semibold"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '15px', letterSpacing: '0.01em', color: '#FFFFFF' }}
              >
                {communityLabel}
              </p>
            </div>
          </section>
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-10 space-y-16">
          <section className="bg-white px-6 sm:px-12 py-12 text-center border border-[#f0f0f0]" style={{ borderRadius: '0px' }}>
            <div className="flex justify-center mb-6">
              <Image src={lockerLogo} alt="Athleap mark" width={113} height={122} priority className="object-contain" />
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
                color: '#000000',
                marginBottom: '40px'
              }}
            >
              Manage your athletes, lessons, and sessions.
            </p>
          </section>
          <div className="-mt-8 flex justify-center">
            <Link
              href="/dashboard/coach"
              className="inline-flex items-center justify-center px-10 py-3 rounded-full text-white text-sm font-semibold shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all"
              style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#C40000', letterSpacing: '0.08em' }}
            >
              <span>View Your Profile</span>
              <svg width="20" height="20" viewBox="0 0 60 60" fill="currentColor" aria-hidden="true" className="ml-2">
                <path d="M46.5 28.9L20.6 3c-.6-.6-1.6-.6-2.2 0l-4.8 4.8c-.6.6-.6 1.6 0 2.2l19.8 20-19.9 19.9c-.6.6-.6 1.6 0 2.2l4.8 4.8c.6.6 1.6.6 2.2 0l21-21 4.8-4.8c.8-.6.8-1.6.2-2.2z" />
              </svg>
            </Link>
          </div>

          <section className="space-y-6">
            <div className="space-y-3">
              <h2
                className="text-left"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '25px',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                Athletes and Training Content
              </h2>
            </div>
            <div className="flex flex-wrap gap-10">
              {trainingActions.map((action) => (
                <LockerCard key={action.key} action={action} onClick={() => setActiveModal(action.key)} />
              ))}
            </div>
          </section>

          <section className="space-y-6 pb-4">
            <div className="space-y-3">
              <h2
                className="text-left"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '25px',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                Calendar and Events
              </h2>
            </div>
            <div className="flex flex-wrap gap-10">
              {calendarActions.map((action) => (
                <LockerCard key={action.key} action={action} onClick={() => setActiveModal(action.key)} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <EnhancedAthleteRosterModal
        isOpen={activeModal === 'athletes'}
        onClose={() => setActiveModal(null)}
        initialSport={coachSportLabel}
      />

      <LockerModalShell
        isOpen={activeModal === 'create-lesson'}
        onClose={() => setActiveModal(null)}
        title="Create Lesson"
        description="Build new training lessons without leaving the locker room"
        size="large"
      >
        <iframe
          src="/dashboard/coach/lessons/create?embedded=true"
          className="w-full h-[70vh] border-0 rounded-2xl"
          title="Create Lesson"
        />
      </LockerModalShell>

      <LockerModalShell
        isOpen={activeModal === 'add-content'}
        onClose={() => setActiveModal(null)}
        title="Add Videos and Content"
        description="Upload fresh content for your athletes"
        size="medium"
      >
        <CoachContentUpload />
      </LockerModalShell>

      <LockerModalShell
        isOpen={activeModal === 'event-schedule'}
        onClose={() => setActiveModal(null)}
        title="Event Schedule"
        description="Add community events and upcoming games"
        size="medium"
      >
        <iframe
          src="/dashboard/coach/events?embedded=true"
          className="w-full h-[60vh] border-0 rounded-2xl"
          title="Event Schedule"
        />
      </LockerModalShell>

      <LockerModalShell
        isOpen={activeModal === 'schedule-session'}
        onClose={() => setActiveModal(null)}
        title="Schedule Training Session"
        description="Review 1-1 requests and lock in training times"
        size="medium"
      >
        <iframe
          src="/dashboard/coach/live-sessions?embedded=true"
          className="w-full h-[60vh] border-0 rounded-2xl"
          title="Schedule Training Session"
        />
      </LockerModalShell>
    </div>
  )
}

function LockerCard({ action, onClick }: { action: LockerAction; onClick: () => void }) {
  return (
    <div
      className="flex flex-col items-start gap-4"
      style={{ fontFamily: '"Open Sans", sans-serif', maxWidth: '280px', width: '100%' }}
    >
      <button
        type="button"
        onClick={onClick}
        className="relative w-full focus:outline-none"
      >
        <span
          className="absolute inset-0"
          style={{
            transform: 'translate(10px, 12px)',
            backgroundColor: '#2A0200',
            borderRadius: '0px'
          }}
          aria-hidden="true"
        />
        <div
          className="relative flex items-center justify-center text-center"
          style={{
            backgroundColor: '#FF2C13',
            border: '1px solid #430B08',
            boxShadow: '0px 18px 32px rgba(0,0,0,0.6)',
            borderRadius: '0px',
            minHeight: '180px'
          }}
        >
          <span
            style={{
              fontSize: '40px',
              lineHeight: '1.05em',
              fontWeight: 700,
              color: '#430B08',
              letterSpacing: '-0.01em'
            }}
          >
            {action.title}
          </span>
        </div>
      </button>

      <p className="w-full text-left" style={{ fontSize: '16px', color: '#FFFFFF', lineHeight: '1.5em' }}>
        {action.description}
      </p>
    </div>
  )
}

function LockerModalShell({
  isOpen,
  onClose,
  title,
  description,
  size = 'large',
  children
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'medium' | 'large'
}) {
  if (!isOpen) return null

  const sizeClass = size === 'large' ? 'max-w-5xl' : 'max-w-3xl'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(18, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClass} rounded-[32px] border border-[#3B0000] shadow-[0_35px_90px_rgba(0,0,0,0.65)] overflow-hidden`}
        style={{ backgroundColor: '#FFF9F5' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 sm:px-10 py-6" style={{ backgroundColor: '#C40000' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: '"Open Sans", sans-serif', color: '#FFFFFF' }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-1" style={{ fontFamily: '"Open Sans", sans-serif', color: 'rgba(255,255,255,0.85)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" style={{ color: '#FFFFFF' }} />
          </button>
        </div>
        <div className="p-6 sm:p-10" style={{ backgroundColor: '#FFF3ED' }}>
          {children}
        </div>
      </div>
    </div>
  )
}


