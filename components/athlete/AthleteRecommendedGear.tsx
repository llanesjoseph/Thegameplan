'use client'

import { useState } from 'react'

interface GearItem {
  id: string
  product: string
  description: string
  price: string
  imageUrl?: string
}

export default function AthleteRecommendedGear() {
  // TODO: Fetch from gear collection when available
  const [gear] = useState<GearItem[]>([
    {
      id: '1',
      product: 'Product',
      description: 'Description of first product',
      price: '$10.99',
      imageUrl: undefined
    },
    {
      id: '2',
      product: 'Product',
      description: 'Description of second product',
      price: '$10.99',
      imageUrl: undefined
    },
    {
      id: '3',
      product: 'Product',
      description: 'Description of third product',
      price: '$10.99',
      imageUrl: undefined
    }
  ])

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Recommended Gear
      </h2>
      
      <div className="flex flex-wrap gap-4">
        {gear.map((item) => (
          <div key={item.id} className="overflow-hidden w-44 md:w-48 lg:w-56">
            <div className="w-full bg-gray-100 mb-1 rounded-lg" style={{ aspectRatio: '1/1' }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.product}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: '#E5E5E5' }}>
                  {/* Placeholder for gear product image */}
                  <div className="w-full h-full bg-gray-300"></div>
                </div>
              )}
            </div>
            <div className="pt-1">
              <p className="font-bold mb-0.5 text-xs" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {item.product}
              </p>
              <p className="text-xs mb-0.5" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {item.description}
              </p>
              <p className="font-bold text-xs" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {item.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

