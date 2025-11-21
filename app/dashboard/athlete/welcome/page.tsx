'use client'

import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

export default function AthleteWelcomePage() {
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const displayName = user?.displayName || 'Athleap Athlete'

  return (
    <div className="min-h-screen bg-[#4B0102] text-white flex flex-col">
      {/* Sticky header + red bar (matches athlete dashboard / gear store) */}
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
                Athlete Community
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
                We are thrilled you have joined the Athleap community. To get the most out of the experience,
                complete the simple steps to a stronger game – personalize your profile, find a coach,
                and start training!
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/dashboard/athlete"
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
                  Share Your Goals
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Create your athletic profile and define what's important to your game.
                </p>
              </div>
              <div>
                <h3
                  className="mb-3"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', fontWeight: 700 }}
                >
                  Find Your Coach
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Our coaches have been carefully curated to provide top guidance on the athletic journey.
                </p>
              </div>
              <div>
                <h3
                  className="mb-3"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', fontWeight: 700 }}
                >
                  Enhance Performance
                </h3>
                <p
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '14px',
                    color: '#F4D7CE',
                  }}
                >
                  Ask questions, engage with the community, and keep track of your AI-powered performance insights.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


