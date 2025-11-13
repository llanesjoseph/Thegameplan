'use client'

import { useRouter } from 'next/navigation'

export default function CoachAthletes() {
  const router = useRouter()
  const athletes = [
    { id: 'a1', name: 'Athlete', imageUrl: '' },
    { id: 'a2', name: 'Athlete', imageUrl: '' },
    { id: 'a3', name: 'Athlete', imageUrl: '' },
  ]

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Your Athletes
      </h2>

      <div className="flex flex-wrap gap-4">
        {athletes.map((a) => (
          <button
            key={a.id}
            onClick={() => router.push('/dashboard/coach/athletes')}
            className="text-left w-44 md:w-48 lg:w-56"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              {a.name}
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
              View profile
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}


