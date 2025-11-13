'use client'

import Link from 'next/link'

type GearItem = {
  id: string
  name: string
  price: string
  imageUrl?: string
}

const MOCK_GEAR: GearItem[] = [
  { id: 'g1', name: 'Product', price: '$19.99' },
  { id: 'g2', name: 'Product', price: '$29.99' },
  { id: 'g3', name: 'Product', price: '$39.99' },
  { id: 'g4', name: 'Product', price: '$49.99' },
  { id: 'g5', name: 'Product', price: '$59.99' },
  { id: 'g6', name: 'Product', price: '$69.99' },
]

export default function GearStore() {
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
              {MOCK_GEAR.map((g) => (
                <div key={g.id}>
                  <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-gray-300" />
                  </div>
                  <p className="font-bold text-sm mt-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                    {g.name}
                  </p>
                  <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                    {g.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


