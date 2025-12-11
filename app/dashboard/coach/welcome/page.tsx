'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export default function CoachWelcomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [checkingGate, setCheckingGate] = useState(true)
  const displayName = user?.displayName || 'Athleap Coach'

  // Welcome screen gating for coaches:
  // - Only show up to 2 times
  // - Only within the first 2 days from initial welcome view
  useEffect(() => {
    if (loading) {
      return
    }

    if (!user?.uid) {
      router.replace('/')
      return
    }

    const runGateCheck = async () => {
      try {
        const userRef = doc(db, 'users', user.uid)
        const snap = await getDoc(userRef)
        const data = snap.exists() ? (snap.data() as Record<string, any>) : {}

        const now = Date.now()
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

        let firstSeenAt: number | null =
          typeof data.welcomeCoachFirstSeenAt === 'number'
            ? data.welcomeCoachFirstSeenAt
            : null
        let viewCount: number =
          typeof data.welcomeCoachViewCount === 'number'
            ? data.welcomeCoachViewCount
            : 0

        if (!firstSeenAt) {
          firstSeenAt = now
          viewCount = 1
          if (snap.exists()) {
            await updateDoc(userRef, {
              welcomeCoachFirstSeenAt: firstSeenAt,
              welcomeCoachViewCount: viewCount
            })
          } else {
            await setDoc(
              userRef,
              {
                welcomeCoachFirstSeenAt: firstSeenAt,
                welcomeCoachViewCount: viewCount
              },
              { merge: true }
            )
          }
          setCheckingGate(false)
          return
        }

        const elapsed = now - firstSeenAt

        if (elapsed > TWO_DAYS_MS || viewCount >= 2) {
          router.replace('/dashboard/coach')
          return
        }

        viewCount += 1
        await updateDoc(userRef, {
          welcomeCoachViewCount: viewCount
        })
      } catch (error) {
        console.warn('Failed to evaluate coach welcome gate:', error)
      } finally {
        setCheckingGate(false)
      }
    }

    runGateCheck()
  }, [user?.uid, loading, router])

  if (loading || checkingGate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#4B0102] text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4" />
          <p
            className="font-semibold text-sm"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Loading your welcome experience…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#4B0102] text-white flex flex-col">
      {/* Sticky header + red bar (matches coach dashboard / locker room) */}
      <div className="sticky top-0 z-40">
        <div className="w-full bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
              {/* Left: logo + ATHLEAP wordmark */}
              <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/athleap-logo-transparent.png"
                  alt="Athleap logo"
                  className="h-8 w-auto"
                />
                <span
                  className="text-xl font-semibold tracking-[0.02em]"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
                >
                  ATHLEAP
                </span>
              </Link>

              {/* Right: account chip + sign out */}
              <div className="flex items-center gap-6">
                {user && (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                    aria-label="Coach account"
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
                        user.photoURL ||
                        '/athleap-logo-transparent.png'
                      }
                      alt={displayName}
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
                      {displayName}
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
          <section aria-label="Welcome banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
            <div className="max-w-6xl mx-auto px-8 py-3">
              <p
                className="text-[15px] leading-none font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
              >
                Coach Community
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full">
        <section className="w-full">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* White hero card */}
            <div className="bg-white text-center px-10 py-12" style={{ borderRadius: 0 }}>
              <div className="flex justify-center mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/athleap-logo-transparent.png"
                  alt="Athleap mark"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h1
                className="mb-4"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '40px',
                  letterSpacing: '-0.05em',
                  color: '#F62004',
                  fontWeight: 700,
                }}
              >
                WELCOME
              </h1>
              <p
                className="mb-2"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '18px',
                  color: '#000000',
                  lineHeight: '1.5em',
                }}
              >
                We are thrilled you have joined the Athleap coaching community. To get the most out of the experience,
                complete the simple steps to a stronger game – personalize your profile for fan engagement, post a
                training, and build community!
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/dashboard/coach"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white text-sm font-semibold"
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    backgroundColor: '#C40000',
                    letterSpacing: '0.08em',
                  }}
                >
                  View Your Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Three-column steps section */}
        <section className="w-full pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2
              className="mb-10"
              style={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}
            >
              Simple steps to a stronger game…
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <h3
                  className="mb-3"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', fontWeight: 700 }}
                >
                  Personalize Your Profile
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Create your athletic profile and define what&apos;s important to your game.
                </p>
              </div>
              <div>
                <h3
                  className="mb-3"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', fontWeight: 700 }}
                >
                  Post a Training
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Leverage simple AI tools to provide tips and techniques and physical and mental performance.
                </p>
              </div>
              <div>
                <h3
                  className="mb-3"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', fontWeight: 700 }}
                >
                  Build Community
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Answer questions, set up personal lessons, and earn commission through gear recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


