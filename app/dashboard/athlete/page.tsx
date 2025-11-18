'use client'

/**
 * Athlete Profile Page - Single Point of Truth
 * Clean, frameless design matching the new vision
 * No sidebar, no iframe - direct content rendering
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react'
import AthleteOverview from '@/components/athlete/AthleteOverview'
import AthleteProfile from '@/components/athlete/AthleteProfile'
import AthleteProgress from '@/components/athlete/AthleteProgress'
import AthleteCoaches from '@/components/athlete/AthleteCoaches'
import AthleteTrainingLibrary from '@/components/athlete/AthleteTrainingLibrary'
import AthleteRecommendedGear from '@/components/athlete/AthleteRecommendedGear'
import AthleteAssistant from '@/components/athlete/AthleteAssistant'
import ProfileQuickSetupModal from '@/components/athlete/ProfileQuickSetupModal'
import WelcomePopup from '@/components/athlete/WelcomePopup'
import AthleteShowcaseCard from '@/components/athlete/AthleteShowcaseCard'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [athleteName, setAthleteName] = useState<string>('')
  const [coachName, setCoachName] = useState<string>('')
  const [heroProfile, setHeroProfile] = useState<{
    displayName: string
    location: string
    bio: string
    trainingGoals: string
    profileImageUrl: string
    sport: string
  }>({
    displayName: '',
    location: '',
    bio: '',
    trainingGoals: '',
    profileImageUrl: '',
    sport: ''
  })
  const [progressSummary, setProgressSummary] = useState<{
    totalLessons: number
    completedLessons: number
    inProgressLessons: number
    upcomingEvents: number
  }>({
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    upcomingEvents: 0
  })

  // Redirect non-athletes
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/user/role', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const userRole = data.data.role
            // Redirect non-athletes to their correct dashboard
            if (userRole && ['coach', 'admin', 'superadmin', 'assistant_coach'].includes(userRole)) {
              router.push(userRole === 'admin' || userRole === 'superadmin' ? '/dashboard/admin' : '/dashboard/coach-unified')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkRole()
  }, [user, router])

  useEffect(() => {
    const loadWelcomeData = async () => {
      try {
        const welcomeFlag = localStorage.getItem('athleap_show_welcome_popup')
        if (welcomeFlag === '1') {
          setShowWelcome(true)
          localStorage.removeItem('athleap_show_welcome_popup')
          // Get athlete name and coach name from user data
          if (user) {
            const token = await user.getIdToken()
            fetch('/api/user/role', {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(data => {
              if (data.success && data.data) {
                setAthleteName(data.data.displayName || '')
                setCoachName(data.data.coachName || '')
              }
            }).catch(() => {})
          }
        }

        const quickSetupFlag = localStorage.getItem('athleap_show_quick_profile_setup')
        if (quickSetupFlag === '1' && !welcomeFlag) {
          setShowQuickSetup(true)
        }
      } catch {}
    }
    loadWelcomeData()
  }, [user])

  // Load hero profile info for the top band
  useEffect(() => {
    const loadHeroProfile = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        let data: any = {}
        if (snap.exists()) data = snap.data()

        const mappedDisplayName =
          (data.displayName as string) || user.displayName || ''
        const mappedLocation =
          (data.location as string) ||
          [data.city, data.state].filter(Boolean).join(', ') ||
          ''
        const mappedBio =
          (data.bio as string) ||
          (data.about as string) ||
          ''
        const mappedTrainingGoals =
          (Array.isArray(data.trainingGoals) ? data.trainingGoals.join(', ') : data.trainingGoals) ||
          (Array.isArray(data.goals) ? data.goals.join(', ') : data.goals) ||
          ''
        const mappedImage =
          (data.profileImageUrl as string) ||
          (data.photoURL as string) ||
          user.photoURL ||
          ''

        let primarySport = ''
        if (Array.isArray(data?.sports) && data.sports.length > 0) {
          primarySport = String(data.sports[0])
        } else if (typeof data?.sport === 'string' && data.sport.trim()) {
          primarySport = data.sport.trim()
        } else if (Array.isArray(data?.selectedSports) && data.selectedSports.length > 0) {
          primarySport = String(data.selectedSports[0])
        }

        setHeroProfile({
          displayName: mappedDisplayName,
          location: mappedLocation,
          bio: mappedBio,
          trainingGoals: mappedTrainingGoals,
          profileImageUrl: mappedImage,
          sport: primarySport
        })
      } catch (error) {
        console.error('Error loading hero profile:', error)
      }
    }

    loadHeroProfile()
  }, [user])

  // Load high-level progress summary for hero metrics row
  useEffect(() => {
    const loadProgressSummary = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/athlete/progress', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const json = await res.json()
        if (res.ok && json.success && json.progress) {
          const p = json.progress
          setProgressSummary({
            totalLessons: p.totalLessons || 0,
            completedLessons: p.completedLessons || 0,
            inProgressLessons: p.inProgressLessons || 0,
            upcomingEvents: 0
          })
        }
      } catch (error) {
        console.warn('Error loading progress summary:', error)
      }
    }

    loadProgressSummary()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header + red community bar (Wix-style frame) */}
      <div className="sticky top-0 z-30 bg-white">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span
                className="text-2xl font-bold"
                style={{ color: '#440102', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                ATHLEAP
              </span>
            </Link>

            {/* Right Navigation */}
            <nav className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  try {
                    const el = document.getElementById('athlete-profile-section')
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    window.dispatchEvent(new CustomEvent('athlete-edit-profile'))
                  } catch {
                    window.dispatchEvent(new CustomEvent('athlete-edit-profile'))
                  }
                }}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-lg border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
                style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                Edit Profile
              </button>
              <Link
                href="/coaches"
                className="hidden md:block text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}
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
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isSigningOut ? 'bg-gray-800 text-white' : 'bg-black text-white hover:bg-gray-800'
                }`}
                style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
                aria-live="polite"
              >
                {isSigningOut ? 'Goodbye…' : 'Sign Out'}
              </button>
            </nav>
          </div>
        </header>
        <div className="w-full bg-[#FC0105]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
            <p
              className="text-[15px] leading-none font-bold text-white"
              style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
            >
              Athlete Community{heroProfile.sport ? ` - ${heroProfile.sport}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Hero + metrics + main sections */}
      <main className="w-full">
        {/* Hero band */}
        <section className="w-full bg-[#4B0102]">
          <div className="max-w-6xl mx-auto px-8 py-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
            {/* Left: name, location, long bio */}
            <div className="space-y-4">
              <h2
                className="font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '54px', lineHeight: 'normal' }}
              >
                {heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
              </h2>
              <h5
                className="text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px' }}
              >
                {heroProfile.location || 'Your location'}
              </h5>
              <p
                className="text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '21px', lineHeight: '1.3em' }}
              >
                {heroProfile.bio ||
                  'This is your space to share your story, your background, and what drives you as an athlete.'}
              </p>
            </div>

            {/* Right: hero image */}
            <div className="flex justify-center md:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  heroProfile.profileImageUrl ||
                  'https://static.wixstatic.com/media/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg/v1/crop/x_958,y_0,w_3350,h_3468/fill/w_402,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg'
                }
                alt={heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
                className="w-[402px] h-[416px] object-cover"
              />
            </div>
          </div>
        </section>

        {/* Game Plan & Progress metrics row */}
        <section className="w-full bg-[#4B0102]">
          <div className="max-w-6xl mx-auto px-8 py-12">
            <h2
              className="text-left text-white mb-8"
              style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
            >
              Your Game Plan and Progress
            </hspace>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Training Goals */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {heroProfile.trainingGoals
                      ? heroProfile.trainingGoals.split(',').map(g => g.trim()).filter(Boolean).length
                      : 0}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAINING GOALS
                  </div>
                </div>
              </div>
              {/* Trainings Complete */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.completedLessons}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAININGS COMPLETE
                  </div>
                </div>
              </div>
              {/* Trainings In Progress */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.inProgressLessons}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAININGS IN PROGRESS
                  </div>
                </div>
              </div>
              {/* Upcoming Events */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.upcomingEvents}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    UPCOMING EVENTS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main sections using existing components */}
        <section className="w-full bg-[#F5F5F5]">
          <div className "max-w-6xl mx-auto px-8 py-12 space-y-8">
            {/* Coaches row & CTAs */}
            <div>
              <h2
                className="text-center mb-10"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
              >
                Your Athleap Coaches
              </h2>
              <AthleteCoaches />
            </div>

            {/* Training Library */}
            <div className="mt-10">
              <AthleteTrainingLibrary />
            </div>

            {/* Recommended Gear */}
            <section className="mt-12">
              <AthleteRecommendedGear />
            </section>
          </div>
        </section>

        {/* Social + Assistant */}
        <section className="w-full bg-white">
          <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
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
            <AthleteAssistant />
          </div>
        </section>

        {/* Welcome popup & quick setup modals */}
        {showWelcome && (
          <WelcomePopup
            athleteName={athleteName}
            coachName={coachName}
            onClose={() => setShowWelcome(false)}
          />
        )}
        <ProfileQuickSetupModal
          isOpen={showQuickSetup && !showWelcome}
          onClose={() => setShowQuickSetup(false)}
        />
      </main>
    </div>
  )
}
