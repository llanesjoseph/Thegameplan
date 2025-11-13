'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type GearItem = {
  id: string
  name: string
  price?: string
  description?: string
  imageUrl?: string
  link?: string
}

export default function GearStore() {
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/gear', { cache: 'no-store' })
        const data = await res.json()
        if (data?.success) setItems(data.gearItems || [])
      } catch (e) {
        console.warn('Failed to load gear', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
              ATHLEAP
            </span>
          </Link>
        </div>
      </header>

      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full max-w-5xl mx-auto space-y-5">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
              Gear Store
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(loading ? Array.from({ length: 8 }) : items).map((g: any, idx: number) => (
                <div key={g?.id || idx}>
                  <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {loading ? (
                      <div className="w-full h-full bg-gray-200 animate-pulse" />
                    ) : g?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-300" />
                    )}
                  </div>
                  <p className="font-bold text-sm mt-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    {loading ? 'Product' : g?.name}
                  </p>
                  {!loading && g?.price && (
                    <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                      {g.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
 

