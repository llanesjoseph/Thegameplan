'use client'

import { useEffect, useState } from 'react'
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Recommended Gear
      </h2>
      
      <div className="flex flex-wrap gap-4">
        {(loading ? Array.from({ length: 3 }) : gear).map((item: any, idx: number) => (
          <div key={item?.id || idx} className="overflow-hidden w-44 md:w-48 lg:w-56">
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
    </div>
  )
}

