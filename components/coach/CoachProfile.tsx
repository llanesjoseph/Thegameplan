'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export default function CoachProfile() {
  const { user } = useAuth()
  const [sports, setSports] = useState<string[]>([])
  const [bio, setBio] = useState<string>('')
  const [primarySport, setPrimarySport] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data() as any
          const list: string[] = []
          if (Array.isArray(data?.sports)) list.push(...data.sports)
          if (typeof data?.sport === 'string') list.push(data.sport)
          if (Array.isArray(data?.specialties)) list.push(...data.specialties)
          const unique = Array.from(new Set(list.map(s => String(s).trim()))).filter(Boolean)
          setSports(unique)
          setPrimarySport((data?.sport as string) || unique[0] || '')
          setBio((data?.bio as string) || (data?.about as string) || '')

          // Prefer explicit profile image fields, then auth photoURL
          setPhotoUrl(
            (data?.profileImageUrl as string) ||
            (data?.headshotUrl as string) ||
            (data?.heroImageUrl as string) ||
            user.photoURL ||
            ''
          )
        }
      } catch (e) {
        console.warn('Failed to load coach profile:', e)
      }
    }
    load()
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
            {primarySport || ''}
          </p>
        </div>

        <p className="text-sm" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
          {bio}
        </p>

        <div>
          <h3
            className="text-base font-bold mb-1"
            style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
          >
            Specialties:
          </h3>
          <p className="text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
            {sports.slice(0, 3).join(', ')}
          </p>
        </div>
      </div>

      {/* RIGHT - Square profile image and sport chips */}
      <div className="flex-shrink-0 md:w-48 lg:w-56 flex flex-col items-center md:items-stretch gap-3">
        <div
          className="rounded-lg overflow-hidden bg-gray-100 w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56"
          style={{ aspectRatio: '1/1' }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={user?.displayName || 'Coach'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center">
              {/* Logo placeholder */}
              <img src="/athleap-logo-transparent.png" alt="AthLeap" className="w-1/2 opacity-30" />
            </div>
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


