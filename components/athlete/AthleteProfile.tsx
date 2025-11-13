'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export default function AthleteProfile() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    displayName: '',
    location: '',
    bio: '',
    trainingGoals: '',
    profileImageUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [sports, setSports] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      // Initialize with user auth data immediately
      if (user?.uid) {
        setProfileData({
          displayName: user.displayName || '',
          location: '[Location]',
          bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
          trainingGoals: '[entered from pick list]',
          profileImageUrl: user.photoURL || ''
        })

        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists()) {
            const data = snap.data() as any
            const extracted: string[] = []
            // Common shapes: array, single string, or object map of booleans
            if (Array.isArray(data?.sports)) {
              extracted.push(...data.sports.filter((s: any) => typeof s === 'string' && s))
            }
            if (typeof data?.sport === 'string' && data.sport.trim()) {
              extracted.push(data.sport.trim())
            }
            if (Array.isArray(data?.selectedSports)) {
              extracted.push(...data.selectedSports.filter((s: any) => typeof s === 'string' && s))
            }
            if (data?.sports && !Array.isArray(data.sports) && typeof data.sports === 'object') {
              Object.entries(data.sports).forEach(([key, value]) => {
                if (value) extracted.push(key)
              })
            }
            const unique = Array.from(new Set(extracted.map((s) => String(s).trim()))).filter(Boolean)
            setSports(unique)
          }
        } catch (err) {
          console.error('Error loading user sports:', err)
        }
      }
      setLoading(false)
    }

    init()
  }, [user])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  const imageClasses = 'w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56'

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
      {/* LEFT SIDE - Text Content */}
      <div className="flex-1 max-w-2xl space-y-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
            {profileData.displayName || user?.displayName || 'Athlete'}
          </h2>
          <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            {profileData.location}
          </p>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
          {profileData.bio}
        </p>

        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
            Training Goals:
          </h3>
          <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            {profileData.trainingGoals}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Square Profile Image and sport tags */}
      <div className="flex-shrink-0 md:w-48 lg:w-56 flex flex-col items-center md:items-stretch gap-3">
        <div className={`rounded-lg overflow-hidden bg-gray-100 ${imageClasses}`} style={{ aspectRatio: '1/1' }}>
          {profileData.profileImageUrl ? (
            <img
              src={profileData.profileImageUrl}
              alt={profileData.displayName || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FC0105' }}>
              {/* Placeholder for athlete profile image */}
              <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800"></div>
            </div>
          )}
        </div>

        <div className="w-full space-y-2">
          {sports.length > 0 ? (
            sports.map((sport) => (
              <button
                key={sport}
                className="w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                {sport}
              </button>
            ))
          ) : (
            <button className="w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              Sport
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

