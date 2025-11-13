'use client'

export default function CoachRecommendedGear() {
  const gear = [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }]

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Recommended Gear
      </h2>

      <div className="flex flex-wrap gap-4">
        {gear.map((g) => (
          <div key={g.id} className="w-44 md:w-48 lg:w-56">
            <div className="w-full aspect-square bg-gray-100 rounded-lg mb-1">
              <div className="w-full h-full bg-gray-300" />
            </div>
            <p className="font-bold mb-0.5 text-xs" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              Product
            </p>
            <p className="text-xs mb-0.5" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
              Description
            </p>
            <p className="font-bold text-xs" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              $19.99
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}


