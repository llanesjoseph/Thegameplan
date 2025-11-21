'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface GearItem {
  id: string
  name: string
  description?: string
  price?: string | number
  imageUrl?: string
  link?: string
}

export default function AthleteRecommendedGear() {
  const { user } = useAuth()
  const [gear, setGear] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 4

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/gear/for-athlete', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data?.success) {
          setGear((data.gearItems || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            price: g.price,
            imageUrl: g.imageUrl,
            link: g.link
          })))
          setPage(0)
        }
      } catch (e) {
        console.warn('Failed to load athlete gear', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const totalPages = Math.max(1, Math.ceil(gear.length / pageSize))
  const start = page * pageSize
  const visible: GearItem[] = gear.slice(start, start + pageSize)

  return (
    <section className="w-full bg-[#4B0102]">
      <div className="max-w-6xl mx-auto px-8 pt-8 pb-24">
        <h2
          className="mb-6"
          style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#FFFFFF' }}
        >
          Your Recommended Gear
        </h2>

        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {(loading ? Array.from({ length: 4 }) : visible).map((item: any, idx: number) => {
            const ItemWrapper: any = item?.link ? 'a' : 'div'
            const wrapperProps = item?.link
              ? {
                  href: item.link,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'w-full block group cursor-pointer'
                }
              : {
                  className: 'w-full'
                }

            return (
              <ItemWrapper key={item?.id || idx} {...wrapperProps}>
                <div className="w-full mb-3 rounded-lg overflow-hidden bg-[#5A0202] bg-opacity-90" style={{ aspectRatio: '1/1' }}>
                  {loading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  ) : item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover ${item?.link ? 'group-hover:scale-105 transition-transform' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                      <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                    </div>
                  )}
                </div>
                    {!loading && (
                  <div className="pt-2 text-center space-y-1">
                    <p className="font-semibold text-sm line-clamp-2" style={{ color: '#FFFFFF', fontFamily: '"Open Sans", sans-serif', minHeight: '2.5rem' }}>
                      {item.name}
                    </p>
                    {item.price !== undefined && item.price !== null && item.price !== '' && (
                      <p className="font-bold text-base" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
                        {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price}
                      </p>
                    )}
                  </div>
                )}
              </ItemWrapper>
            )
          })}
          </div>

          {/* Pagination arrows - mirror coach view behaviour, only when more than 4 items */}
          {!loading && gear.length > pageSize && (
            <>
              <button
                type="button"
                aria-label="Previous gear"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className={`absolute left-[-18px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                  page === 0
                    ? 'border-gray-400 text-gray-400 cursor-not-allowed opacity-60 bg-[#4B0102]'
                    : 'border-white text-white bg-[#4B0102] hover:bg-white hover:text-[#4B0102]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next gear"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className={`absolute right-[-18px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                  page >= totalPages - 1
                    ? 'border-gray-400 text-gray-400 cursor-not-allowed opacity-60 bg-[#4B0102]'
                    : 'border-white text-white bg-[#4B0102] hover:bg-white hover:text-[#4B0102]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

