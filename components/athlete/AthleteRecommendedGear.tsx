'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface GearItem {
  id: string
  name: string
  description?: string
  price?: string
  imageUrl?: string
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
            imageUrl: g.imageUrl
          })))
        }
      } catch (e) {
        console.warn('Failed to load athlete gear', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const totalPages = Math.max(1, Math.ceil((gear?.length || 0) / pageSize))
  const canPrev = page > 0
  const canNext = page < totalPages - 1
  const visible = gear.slice(page * pageSize, page * pageSize + pageSize)

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Recommended Gear
      </h2>
      
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }) : visible).map((item: any, idx: number) => (
          <div key={item?.id || idx} className="overflow-hidden w-full">
            <div className="w-full bg-gray-100 mb-1 rounded-lg" style={{ aspectRatio: '1/1' }}>
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              ) : item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-60" />
                </div>
              )}
            </div>
            {!loading && (
              <div className="pt-1">
                <p className="font-bold mb-0.5 text-xs" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs mb-0.5" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    {item.description}
                  </p>
                )}
                {item.price && (
                  <p className="font-bold text-xs" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    {item.price}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        </div>

        {/* Arrows */}
        {!loading && gear.length > pageSize && (
          <>
            <button
              aria-label="Previous gear"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                canPrev
                  ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                  : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              aria-label="Next gear"
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                canNext
                  ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                  : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

