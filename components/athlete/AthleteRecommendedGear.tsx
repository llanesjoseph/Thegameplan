'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface GearItem {
  id: string
  name: string
  description?: string
  price?: string
  imageUrl?: string
  link?: string
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
            imageUrl: g.imageUrl,
            link: g.link
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

  const visible = gear.slice(0, 4)

  return (
    <section className="w-full bg-[#4B0102]">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2
          className="mb-6"
          style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#FFFFFF' }}
        >
          Your Recommended Gear
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {(loading ? Array.from({ length: 4 }) : visible).map((item: any, idx: number) => {
          const ItemWrapper = item?.link ? 'a' : 'div'
          const wrapperProps = item?.link ? {
            href: item.link,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'overflow-hidden w-full block group cursor-pointer'
          } : {
            className: 'overflow-hidden w-full'
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
                <div className="pt-1 text-center">
                  <p className="font-bold mb-0.5 text-xs" style={{ color: '#FFFFFF', fontFamily: '"Open Sans", sans-serif' }}>
                    {item.name}
                  </p>
                  {item.price && (
                    <p className="font-bold text-xs" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
                      {item.price}
                    </p>
                  )}
                </div>
              )}
            </ItemWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}

