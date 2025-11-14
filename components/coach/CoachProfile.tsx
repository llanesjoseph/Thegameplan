'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { getDownloadURL, ref } from 'firebase/storage'

export default function CoachProfile() {
  const { user } = useAuth()
  const [sports, setSports] = useState<string[]>([])
  const [bio, setBio] = useState<string>('')
  const [primarySport, setPrimarySport] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [bannerUrl, setBannerUrl] = useState<string>('')

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
          const raw =
            (data?.profileImageUrl as string) ||
            (data?.headshotUrl as string) ||
            (data?.photoURL as string) ||
            user.photoURL ||
            ''

          // Resolve storage paths like 'users/uid/photo.jpg' or 'gs://'
          const isHttp = /^https?:\/\//i.test(raw)
          if (!raw) {
            setPhotoUrl('')
          } else if (isHttp) {
            setPhotoUrl(raw)
          } else {
            try {
              const url = await getDownloadURL(ref(storage, raw))
              setPhotoUrl(url)
            } catch {
              setPhotoUrl('')
            }
          }

          // Banner: prefer bannerUrl/cover/hero
          const rawBanner =
            (data?.bannerUrl as string) ||
            (data?.coverUrl as string) ||
            (data?.heroImageUrl as string) ||
            ''
          const bannerHttp = /^https?:\/\//i.test(rawBanner || '')
          if (!rawBanner) {
            // Fallback to profile image as banner if none provided
            if (photoUrl) {
              setBannerUrl(photoUrl)
            } else {
              setBannerUrl('')
            }
          } else if (bannerHttp) {
            setBannerUrl(rawBanner)
          } else {
            try {
              const url = await getDownloadURL(ref(storage, rawBanner))
              setBannerUrl(url)
            } catch {
              if (photoUrl) setBannerUrl(photoUrl)
              else setBannerUrl('')
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load coach profile:', e)
      }
    }
    load()
  }, [user])

  return (
    <div className="space-y-4">
      {/* Banner with overlay profile */}
      <div className="relative">
        <div className="h-32 sm:h-40 md:h-48 rounded-xl overflow-hidden bg-gray-100">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="Coach banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center">
              <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-24 opacity-40" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-6 left-4 sm:left-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden ring-4 ring-white shadow-xl bg-gray-100">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={user?.displayName || 'Coach'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center">
                <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-10 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Text content below */}
      <div className="pt-8 max-w-2xl space-y-3">
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

        <div className="flex flex-wrap gap-2 pt-1">
          {(sports.length ? sports : ['Sport']).map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-lg bg-black text-white text-xs font-bold"
              style={{ fontFamily: '\"Open Sans\", sans-serif' }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}


