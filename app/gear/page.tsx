'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

type GearItem = {
  id: string
  name: string
  price?: string
  description?: string
  imageUrl?: string
  link?: string
  coachId?: string
  coachName?: string
  sport?: string
}

export default function GearStore() {
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')

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
              <Link href="/" className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.04em', color: '#181818' }}
                >
                  ATHLEAP
                </span>
              </Link>
            </div>
          </header>
          <section aria-label="Gear store banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3">
              <p
                className="text-right font-semibold"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '15px', letterSpacing: '0.01em', color: '#FFFFFF' }}
              >
                Gear Store
              </p>
            </div>
          </section>
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-10 space-y-10">
          {/* Hero banner */}
          <section className="text-center">
            <div className="flex justify-center mb-6">
              {/* Using a plain img here to avoid next.config dependencies */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://static.wixstatic.com/media/75fa07_e1e45308b5c74283b5e34188f149ce73~mv2.png/v1/fill/w_825,h_141,al_c,lg_1,q_85,enc_avif,quality_auto/75fa07_e1e45308b5c74283b5e34188f149ce73~mv2.png"
                alt="Gear Store banner"
                className="w-full max-w-3xl h-auto object-cover"
              />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: 'normal', color: '#FFFFFF' }}
            >
              Gear Store
            </h1>
          </section>

          {/* Filter + grid card */}
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
      </main>
    </div>
  )
}
 

