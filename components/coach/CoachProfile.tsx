'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function CoachProfile() {
  const { user } = useAuth()
  const [sports, setSports] = useState<string[]>([])

  useEffect(() => {
    // Lightweight extraction from custom claims if present in user metadata
    // We avoid Firestore here to keep SSR safe; placeholders will render otherwise
    const possible: string[] = []
    // @ts-ignore
    const anyUser: any = user || {}
    if (Array.isArray(anyUser?.sports)) possible.push(...anyUser.sports)
    if (typeof anyUser?.sport === 'string') possible.push(anyUser.sport)
    const unique = Array.from(new Set(possible.map((s) => String(s).trim()))).filter(Boolean)
    setSports(unique)
  }, [user])

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      {/* LEFT - Text */}
      <div className="flex-1 max-w-2xl space-y-3">
        <div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
          >
            {user?.displayName || 'Coach'}
          </h2>
          <p className="text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
            {sports[0] || '[Primary Sport]'}
          </p>
        </div>

        <p className="text-sm" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
          Short bio about coaching style, specialties, and achievements. Replace with live data later.
        </p>

        <div>
          <h3
            className="text-base font-bold mb-1"
            style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
          >
            Specialties:
          </h3>
          <p className="text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
            Technique, Strength & Conditioning, Game IQ
          </p>
        </div>
      </div>

      {/* RIGHT - Square profile image and sport chips */}
      <div className="flex-shrink-0 md:w-48 lg:w-56 flex flex-col items-center md:items-stretch gap-3">
        <div
          className="rounded-lg overflow-hidden bg-gray-100 w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56"
          style={{ aspectRatio: '1/1' }}
        >
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={user.displayName || 'Coach'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        <div className="w-full space-y-2">
          {(sports.length ? sports : ['Sport']).map((s) => (
            <button
              key={s}
              className="w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
              style={{ fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


