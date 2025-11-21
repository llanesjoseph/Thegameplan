'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { storage, auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'

type GearItem = {
  id: string
  name: string
  price?: string | number
  description?: string
  imageUrl?: string
  link?: string
  coachId?: string
  coachName?: string
  sport?: string
}

export default function GearStore() {
  const { user } = useAuth()
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/gear', { cache: 'no-store' })
        const data = await res.json()
        if (data?.success) {
          let list = data.gearItems || []
          // Resolve storage paths to URLs
          list = await Promise.all(
            list.map(async (g: any) => {
              const isHttp = /^https?:\/\//i.test(g.imageUrl || '')
              if (g.imageUrl && !isHttp) {
                try {
                  const url = await getDownloadURL(ref(storage, g.imageUrl))
                  return { ...g, imageUrl: url }
                } catch {
                  return g
                }
              }
              return g
            })
          )
          setItems(list)
        }
      } catch (e) {
        console.warn('Failed to load gear', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const availableSports = useMemo(() => {
    const sports = Array.from(
      new Set(
        items
          .map((g) => g.sport)
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      )
    )
    return sports.sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (selectedSport === 'all') return items
    return items.filter((g) => (g.sport || '').trim() === selectedSport)
  }, [items, selectedSport])

  return (
    <div className="min-h-screen bg-[#4B0102] text-white flex flex-col">
      {/* Sticky App Header */}
      <div className="sticky top-0 z-40 shadow-sm">
        <div className="w-full bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
              {/* Left: logo + ATHLEAP wordmark (matches dashboard header) */}
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

              {/* Right: signed-in status chip (mirrors dashboard header) */}
              <div className="flex items-center gap-6">
                {user ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                    aria-label="Account"
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
                        'https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png'
                      }
                      alt={user.displayName || user.email || 'Athleap User'}
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
                      {user.displayName || user.email || 'Athleap User'}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span
                      className="text-xs text-gray-700 underline"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/onboarding/auth"
                    className="text-xs sm:text-sm text-gray-700 underline"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </header>
          <section aria-label="Gear store banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3 flex justify-end">
              <p
                className="text-[15px] leading-none font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
              >
                Gear Store
              </p>
            </div>
          </section>
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="space-y-10">
          {/* Hero banner – full-width maroon band with centered logo and title */}
          <section className="w-full bg-[#4B0102]">
            <div className="max-w-6xl mx-auto px-4 sm:px-10 py-10 text-center">
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/athleap-logo-transparent.png"
                  alt="Athleap mark"
                  className="h-32 w-auto object-contain"
                />
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.05em', color: '#FFFFFF' }}
              >
                Gear Store
              </h1>
            </div>
          </section>

          {/* Filter + grid card */}
          <div className="max-w-6xl mx-auto px-4 sm:px-10 pb-10">
          <section className="bg-white rounded-none border border-[#f0f0f0] px-6 sm:px-10 py-8 space-y-6">
            {/* Sport filters */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedSport('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
                  selectedSport === 'all'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                }`}
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                All Sports
              </button>
              {availableSports.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
                    selectedSport === sport
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                  }`}
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {sport}
                </button>
              ))}
            </div>

            {/* Gear grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(loading ? Array.from({ length: 8 }) : filteredItems).map((g: any, idx: number) => {
                const key = g?.id || idx
                const content = (
                  <>
                    <div className="w-full aspect-square bg-gray-100 rounded-none overflow-hidden">
                      {loading ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse" />
                      ) : g?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-60" />
                        </div>
                      )}
                    </div>
                    <p
                      className="font-bold text-sm mt-2"
                      style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {loading ? 'Product' : g?.name}
                    </p>
                    {!loading && (g?.price || g?.priceUSD) && (
                      <p
                        className="text-xs"
                        style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        {typeof g.price === 'number' ? `$${g.price.toFixed(2)}` : g.price || g.priceUSD}
                      </p>
                    )}
                    {!loading && (g?.coachName || g?.sport) && (
                      <p
                        className="mt-1 text-[11px]"
                        style={{ color: '#8B4B41', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        {g.coachName ? `Recommended by ${g.coachName}` : 'Recommended by an Athleap coach'}
                        {g.sport ? ` · ${g.sport}` : ''}
                      </p>
                    )}
                  </>
                )

                if (!loading && g?.link) {
                  return (
                    <a
                      key={key}
                      href={g.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <div key={key} className="block group">
                    {content}
                  </div>
                )
              })}
            </div>
          </section>
          </div>
        </div>
      </main>
    </div>
  )
}
 

