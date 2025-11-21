'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

interface AthleteProfile {
  uid: string
  displayName: string
  email: string
  sport: string
  level: string
  coachId: string
  assignedCoachId: string
  profileImageUrl: string | null
  location?: string
  bio?: string
  trainingGoals?: string
}

const sampleCoaches = [
  {
    name: 'Jasmine Aikey',
    title: 'College Soccer Champion',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_b4d18c96521d48d39f3576e074099d2d~mv2.jpg/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/F-sPYvXa0AA7EAA.jpg'
  },
  {
    name: 'Alana Beard',
    title: 'Professional Basketball',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_5ce2a239003845288e36fdda83cb0851~mv2.webp/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Alana-Beard-Headshot-500x.webp'
  }
]

const sampleTrainingLibrary = [
  {
    title: 'Footwork and Passing in Soccer',
    status: 'Ended',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png/v1/fill/w_210,h_210,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png'
  },
  {
    title: 'Soccer Drills for Beginners',
    status: 'Ended',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png/v1/fill/w_210,h_210,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png'
  }
]

const sampleRecommendedGear = [
  {
    name: "copy of I'm a product",
    price: '$40.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg/v1/fill/w_240,h_240,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg'
  },
  {
    name: "I'm a product",
    price: '$20.00',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_9e80f4f714ed4aa6af571767e94cd183~mv2.jpg/v1/fill/w_240,h_240,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_9e80f4f714ed4aa6af571767e94cd183~mv2.jpg'
  },
  {
    name: "I'm a product",
    price: '$40.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg/v1/fill/w_240,h_240,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg'
  },
  {
    name: "I'm a product",
    price: '$120.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_8adb0d7018b047e0a998acf987fd3fd6~mv2.jpg/v1/fill/w_240,h_240,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_8adb0d7018b047e0a998acf987fd3fd6~mv2.jpg'
  }
]

const socialLinks = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/wix-com',
    iconUrl:
      'https://static.wixstatic.com/media/6ea5b4a88f0b4f91945b40499aa0af00.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6ea5b4a88f0b4f91945b40499aa0af00.png'
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/wix',
    iconUrl:
      'https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0fdef751204647a3bbd7eaa2827ed4f9.png'
  },
  {
    name: 'Twitter',
    url: 'https://www.twitter.com/wix',
    iconUrl:
      'https://static.wixstatic.com/media/c7d035ba85f6486680c2facedecdcf4d.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c7d035ba85f6486680c2facedecdcf4d.png'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/wix',
    iconUrl:
      'https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/01c3aff52f2a4dffa526d7a9843d46ea.png'
  }
]

export default function TestPage() {
  const { user } = useAuth()
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    upcomingEvents: 0
  })
  const [progressError, setProgressError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const fetchAthlete = async () => {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        const token = await user.getIdToken()
        const email = 'bigpenger@gmail.com'
        const res = await fetch(`/api/coach/athlete-by-email?email=${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setError(json.error || 'Unable to load athlete')
          return
        }
        setAthlete(json.data as AthleteProfile)
      } catch (err: any) {
        console.error('Error loading athlete for TEST page:', err)
        setError('Failed to load athlete profile')
      } finally {
        setLoading(false)
      }
    }

    fetchAthlete()
  }, [user])

  const displayName = athlete?.displayName || 'Merline Saintil'
  const location = athlete?.location || 'Silicon Valley, California'
  const bio =
    athlete?.bio ||
    'A software engineer turned Silicon Valley COO who has taken six companies public, Merline is an active investor in dozens of businesses that are shaping enterprise technology, healthcare tech, and the future of work. She serves as a director on the boards of numerous public and private companies, advising them on enterprise risks, technology trends, innovation, strategy, cybersecurity, and digital transformation.'
  const heroImage =
    athlete?.profileImageUrl ||
    'https://static.wixstatic.com/media/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg/v1/crop/x_958,y_0,w_3350,h_3468/fill/w_402,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg'

  // Derive training goals count from athlete trainingGoals string (comma-separated)
  const trainingGoalsCount =
    athlete?.trainingGoals?.split(',').map(goal => goal.trim()).filter(Boolean).length || 0

  // Load progress metrics for this athlete (as coach)
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !athlete?.uid) return
      try {
        setProgressError(null)
        const token = await user.getIdToken()
        const res = await fetch(`/api/coach/athlete-progress/${athlete.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setProgressError(json.error || 'Unable to load progress')
          return
        }
        setProgress(json.progress)
      } catch (err: any) {
        console.error('Error loading athlete progress for TEST page:', err)
        setProgressError('Failed to load athlete progress')
      }
    }

    fetchProgress()
  }, [user, athlete?.uid])

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {/* Block 1: Top Athleap header bar (from Wix) - sticky/frozen at top */}
      <div className="sticky top-0 z-40">
        {/* Sticky top header + red bar */}
        <div className="w-full sticky top-0 z-30 bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
              {/* Left: logo + ATHLEAP wordmark */}
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/athleap-logo-transparent.png"
                  alt="Athleap logo"
                  className="h-8 w-auto"
                />
                <span
                  className="text-xl font-semibold tracking-[0.02em]"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  ATHLEAP
                </span>
              </div>

              {/* Right: account chip only when signed in */}
              <div className="flex items-center gap-6">
                {user && (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                    aria-label="Athlete account"
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
                      }, 300)
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        (user as any).photoURL ||
                        '/athleap-logo-transparent.png'
                      }
                      alt={(user as any).displayName || (user as any).email || 'Athleap User'}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Hello
                    </span>
                    <span
                      className="text-sm"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {(user as any).displayName || (user as any).email || 'Athleap User'}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span
                      className="text-xs text-gray-700 underline"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Red bar under header with Athlete Community text (Wix colorUnderlay + rich text) */}
          <div className="w-full bg-[#FC0105]">
            <div className="max-w-6xl mx-auto px-8 py-2 flex justify-end">
              <p
                className="text-[15px] leading-none font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
              >
                Athlete Community - Basketball
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Block 2: Merline/athlete hero section (text left, image right) */}
      <section className="w-full bg-[#4B0102]">
        <div className="max-w-6xl mx-auto px-8 py-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
          {/* Left: name, location, long bio */}
          <div className="space-y-4">
            <h2
              className="font-bold text-white"
              style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '54px', lineHeight: 'normal' }}
            >
              {displayName}
            </h2>
            <h5
              className="text-white"
              style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px' }}
            >
              {location}
            </h5>
            <p
              className="text-white"
              style={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '21px',
                lineHeight: '1.3em'
              }}
            >
              {bio}
            </p>

            {loading && (
              <p className="text-xs text-gray-300 mt-2" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                Loading live athlete data&hellip;
              </p>
            )}
            {error && (
              <p className="text-xs text-red-300 mt-2" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                {error}
              </p>
            )}
          </div>

          {/* Right: portrait image */}
          <div className="flex justify-center md:justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={displayName}
              className="w-[402px] h-[416px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Block 3: Your Game Plan and Progress metrics, using live progress data */}
      <section className="w-full bg-[#4B0102]">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Section title */}
          <h2
            className="text-left text-white mb-8"
            style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
          >
            Your Game Plan and Progress
          </h2>

          {/* Four metric columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Training Goals */}
            <div className="flex flex-col items-stretch">
              <div className="flex-1 bg-[#7A3B3B] bg-opacity-80 px-6 py-6 text-white flex flex-col items-center justify-center">
                <div
                  className="leading-none mb-2"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                >
                  {trainingGoalsCount}
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
              <div className="flex-1 bg-[#7A3B3B] bg-opacity-80 px-6 py-6 text-white flex flex-col items-center justify-center">
                <div
                  className="leading-none mb-2"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                >
                  {progress.completedLessons}
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
              <div className="flex-1 bg-[#7A3B3B] bg-opacity-80 px-6 py-6 text-white flex flex-col items-center justify-center">
                <div
                  className="leading-none mb-2"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                >
                  {progress.inProgressLessons}
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
              <div className="flex-1 bg-[#7A3B3B] bg-opacity-80 px-6 py-6 text-white flex flex-col items-center justify-center">
                <div
                  className="leading-none mb-2"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                >
                  {progress.upcomingEvents}
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

          {progressError && (
            <p
              className="mt-4 text-center text-red-300 text-xs"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              {progressError}
            </p>
          )}
        </div>
      </section>

      {/* Block 4: Your Athleap Coaches (static sample layout from Wix) */}
      <section className="w-full" style={{ backgroundColor: '#EDEDED' }}>
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h2
            className="text-center mb-10"
            style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
          >
            Your Athleap Coaches
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 justify-items-center">
            {sampleCoaches.map((coach) => (
              <div key={coach.name} className="flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coach.imageUrl}
                  alt={coach.name}
                  className="w-[225px] h-[225px] rounded-full object-cover mb-4"
                />
                <p
                  className="mb-1"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '27px', color: '#111111' }}
                >
                  {coach.name}
                </p>
                <p
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', color: '#000000' }}
                >
                  {coach.title}
                </p>
              </div>
            ))}
          </div>

          {/* Red CTA buttons row */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:w-auto sm:flex-1 text-center"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Request Coaching Session
            </button>
            <button
              type="button"
              className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:w-auto sm:flex-1 text-center"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Ask A Question
            </button>
            <button
              type="button"
              className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:w-auto sm:flex-1 text-center"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Submit Training Video
            </button>
          </div>
        </div>
      </section>

      {/* Block 5: Your Training Library (static layout from Wix) */}
      <section className="w-full bg-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h2
            className="mb-6"
            style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
          >
            Your Training Library
          </h2>

          <div className="border-t border-gray-300">
            {sampleTrainingLibrary.map((lesson, idx) => (
              <div
                key={lesson.title}
                className="flex items-center gap-6 py-6 border-b border-gray-200 last:border-b-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lesson.imageUrl}
                  alt={lesson.title}
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex items-center justify-between gap-4">
                  <p
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px', color: '#000000' }}
                  >
                    {lesson.title}
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
                  >
                    {lesson.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              className="rounded-full bg-[#FC0105] px-10 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Browse Training
            </button>
          </div>
        </div>
      </section>

      {/* Block 6: Your Recommended Gear (static carousel-style row from Wix) */}
      <section className="w-full bg-[#4B0102]">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <h2
            className="mb-8"
            style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#FFFFFF' }}
          >
            Your Recommended Gear
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {sampleRecommendedGear.map((item) => (
              <div
                key={item.name + item.price}
                className="bg-[#5A0202] bg-opacity-90 rounded-lg p-4 flex flex-col items-center text-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-40 h-40 object-cover mb-3"
                />
                <p
                  className="mb-1"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: '#FFFFFF' }}
                >
                  {item.name}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#FF0000' }}
                >
                  {item.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 7: Footer social bar (deprecated in favor of GlobalSocialBar) */}
    </main>
  )
}


