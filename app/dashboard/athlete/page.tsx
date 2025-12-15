'use client'

/**
 * Athlete Profile Page - Single Point of Truth
 * Clean, frameless design matching the new vision
 * No sidebar, no iframe - direct content rendering
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase.client'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import AthleteOverview from '@/components/athlete/AthleteOverview'
import AthleteProfile from '@/components/athlete/AthleteProfile'
import AthleteProgress from '@/components/athlete/AthleteProgress'
import AthleteCoaches from '@/components/athlete/AthleteCoaches'
import AthleteTrainingLibrary from '@/components/athlete/AthleteTrainingLibrary'
import AthleteRecommendedGear from '@/components/athlete/AthleteRecommendedGear'
import ProfileQuickSetupModal from '@/components/athlete/ProfileQuickSetupModal'
import AthleteShowcaseCard from '@/components/athlete/AthleteShowcaseCard'


export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  const [subscriptionVerifying, setSubscriptionVerifying] = useState(false)
  const [subscriptionVerified, setSubscriptionVerified] = useState(false)
  const [athleteName, setAthleteName] = useState<string>('')
  const [coachName, setCoachName] = useState<string>('')
  const [heroProfile, setHeroProfile] = useState<{
    displayName: string
    location: string
    bio: string
    trainingGoals: string
    profileImageUrl: string
    sport: string
  }>({
    displayName: '',
    location: '',
    bio: '',
    trainingGoals: '',
    profileImageUrl: '',
    sport: ''
  })
  const [editHeroProfile, setEditHeroProfile] = useState<{
    displayName: string
    location: string
    bio: string
    trainingGoals: string
    profileImageUrl: string
    sport: string
  }>({
    displayName: '',
    location: '',
    bio: '',
    trainingGoals: '',
    profileImageUrl: '',
    sport: ''
  })
  const [progressSummary, setProgressSummary] = useState<{
    totalLessons: number
    completedLessons: number
    inProgressLessons: number
    upcomingEvents: number
  }>({
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    upcomingEvents: 0
  })
  const [heroLoading, setHeroLoading] = useState(true)
  const [isEditingHero, setIsEditingHero] = useState(false)
  const [isSavingHero, setIsSavingHero] = useState(false)
  const [isUploadingHeroPhoto, setIsUploadingHeroPhoto] = useState(false)
  const heroPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const [subscriptionSummary, setSubscriptionSummary] = useState<{
    tier: string
    status: string
    isActive: boolean
  } | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // Redirect non-athletes
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/user/role', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const userRole = data.data.role
            // Redirect non-athletes to their correct dashboard
            if (userRole && ['coach', 'admin', 'superadmin', 'assistant_coach'].includes(userRole)) {
              if (userRole === 'admin' || userRole === 'superadmin') {
                router.push('/dashboard/admin')
              } else {
                // Coaches and assistants now go through unified coach dashboard
                router.push('/dashboard/coach')
              }
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkRole()
  }, [user, router])

  // Verify subscription after Stripe checkout redirect
  // This handles the race condition where webhook may not have processed yet
  const verifySubscription = useCallback(async (retries = 3): Promise<boolean> => {
    if (!user) return false
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/athlete/subscriptions/verify-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (!res.ok) return false
      
      const data = await res.json()
      
      if (data.isActive || data.alreadyActive) {
        setSubscriptionSummary({
          tier: data.tier,
          status: data.status,
          isActive: true
        })
        return true
      }
      
      // If not active and we have retries left, wait and try again
      if (retries > 0) {
        console.log(`[SUBSCRIPTION] Not active yet, retrying in 2s... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return verifySubscription(retries - 1)
      }
      
      return false
    } catch (err) {
      console.error('Error verifying subscription:', err)
      return false
    }
  }, [user])

  // Load athlete subscription status so we can show a clear CTA into the Stripe pricing / checkout flow.
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return
      
      const isSuccessRedirect = searchParams?.get('subscription') === 'success'
      
      try {
        setSubscriptionLoading(true)
        
        // If this is a success redirect, use verification with polling
        if (isSuccessRedirect && !subscriptionVerified) {
          setSubscriptionVerifying(true)
          console.log('[SUBSCRIPTION] Detected success redirect, verifying with Stripe...')
          
          const verified = await verifySubscription(5) // Try up to 5 times (10 seconds total)
          
          if (verified) {
            setSubscriptionVerified(true)
            console.log('[SUBSCRIPTION] ✅ Subscription verified successfully!')
            // Clean up URL
            router.replace('/dashboard/athlete', { scroll: false })
          } else {
            console.warn('[SUBSCRIPTION] ⚠️ Could not verify subscription after retries')
          }
          
          setSubscriptionVerifying(false)
          setSubscriptionLoading(false)
          return
        }
        
        // Normal subscription status check
        const token = await user.getIdToken()
        const res = await fetch('/api/athlete/subscriptions/status', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        setSubscriptionSummary({
          tier: data.tier,
          status: data.status,
          isActive: data.isActive
        })
      } catch (err) {
        console.error('Error loading subscription status:', err)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscription()
  }, [user, searchParams, subscriptionVerified, verifySubscription, router])

  useEffect(() => {
    const loadWelcomeData = async () => {
      try {
        const quickSetupFlag = localStorage.getItem('athleap_show_quick_profile_setup')
        if (quickSetupFlag === '1') {
          setShowQuickSetup(true)
        }
      } catch {}
    }
    loadWelcomeData()
  }, [user])

  // Load hero profile info for the top band
  useEffect(() => {
    const loadHeroProfile = async () => {
      if (!user?.uid) return
      try {
        setHeroLoading(true)

        const userRef = doc(db, 'users', user.uid)

        const userSnap = await getDoc(userRef)
        const userData: any = userSnap.exists() ? userSnap.data() : {}

        // Athletes created from invite flow use a random athleteId stored on the user document.
        // We aggressively try three strategies, in order:
        // 1) athletes/{athleteId from user document}
        // 2) athletes/{uid} (legacy)
        // 3) any athletes doc where uid == current user
        let athleteData: any = {}

        const athleteIdFromUser = typeof userData.athleteId === 'string' ? userData.athleteId : ''
        if (athleteIdFromUser) {
          try {
            const athleteByIdSnap = await getDoc(doc(db, 'athletes', athleteIdFromUser))
            if (athleteByIdSnap.exists()) {
              athleteData = athleteByIdSnap.data()
            }
          } catch (err) {
            console.warn('Error loading athlete by athleteId from user doc:', err)
          }
        }

        if (!athleteData || Object.keys(athleteData).length === 0) {
          try {
            const directAthleteSnap = await getDoc(doc(db, 'athletes', user.uid))
            if (directAthleteSnap.exists()) {
              athleteData = directAthleteSnap.data()
            }
          } catch (err) {
            console.warn('Error loading athlete by uid:', err)
          }
        }

        if (!athleteData || Object.keys(athleteData).length === 0) {
          try {
            const { collection, getDocs, query, where } = await import('firebase/firestore')
            const athletesCol = collection(db, 'athletes')
            const q = query(athletesCol, where('uid', '==', user.uid))
            const qs = await getDocs(q)
            if (!qs.empty) {
              athleteData = qs.docs[0].data()
            }
          } catch (err) {
            console.warn('Error querying athletes collection for current user:', err)
          }
        }

        const athleteDisplayNameFromProfile: string =
          (athleteData?.displayName as string) ||
          [athleteData?.firstName, athleteData?.lastName].filter(Boolean).join(' ')

        const mappedDisplayName =
          (userData.displayName as string) ||
          athleteDisplayNameFromProfile ||
          user.displayName ||
          ''
        const mappedLocation =
          (userData.location as string) ||
          [userData.city, userData.state].filter(Boolean).join(', ') ||
          ''
        const mappedBio =
          (userData.bio as string) ||
          (userData.about as string) ||
          ''

        // Prefer structured goals from athlete onboarding (athletes.athleticProfile.trainingGoals)
        const athleteGoalsArray: string[] =
          Array.isArray(athleteData?.athleticProfile?.trainingGoals)
            ? athleteData.athleticProfile.trainingGoals
            : []
        const goalsFromAthlete =
          athleteGoalsArray.length > 0
            ? athleteGoalsArray.join(', ')
            : ''

        const goalsFromUser =
          (Array.isArray(userData.trainingGoals)
            ? userData.trainingGoals.join(', ')
            : userData.trainingGoals) ||
          (Array.isArray(userData.goals)
            ? userData.goals.join(', ')
            : userData.goals) ||
          ''

        const mappedTrainingGoals = goalsFromAthlete || goalsFromUser || ''

        const mappedImage =
          (userData.profileImageUrl as string) ||
          (userData.photoURL as string) ||
          user.photoURL ||
          ''

        let primarySport = ''
        if (Array.isArray(userData?.sports) && userData.sports.length > 0) {
          primarySport = String(userData.sports[0])
        } else if (typeof userData?.sport === 'string' && userData.sport.trim()) {
          primarySport = userData.sport.trim()
        } else if (Array.isArray(userData?.selectedSports) && userData.selectedSports.length > 0) {
          primarySport = String(userData.selectedSports[0])
        } else if (typeof athleteData?.athleticProfile?.primarySport === 'string' && athleteData.athleticProfile.primarySport.trim()) {
          // Fallback to the primary sport collected during athlete onboarding / invite flow
          primarySport = athleteData.athleticProfile.primarySport.trim()
        }

        const nextProfile = {
          displayName: mappedDisplayName,
          location: mappedLocation,
          bio: mappedBio,
          trainingGoals: mappedTrainingGoals,
          profileImageUrl: mappedImage,
          sport: primarySport
        }

        setHeroProfile(nextProfile)
        // Keep edit state in sync when not actively editing
        if (!isEditingHero) {
          setEditHeroProfile(nextProfile)
        }
      } catch (error) {
        console.error('Error loading hero profile:', error)
      } finally {
        setHeroLoading(false)
      }
    }

    loadHeroProfile()
  }, [user, isEditingHero])

  // Load high-level progress summary for hero metrics row
  useEffect(() => {
    const loadProgressSummary = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/athlete/progress', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const json = await res.json()
        if (res.ok && json.success && json.progress) {
          const p = json.progress
          setProgressSummary({
            totalLessons: p.totalLessons || 0,
            completedLessons: p.completedLessons || 0,
            inProgressLessons: p.inProgressLessons || 0,
            upcomingEvents: 0
          })
        }
      } catch (error) {
        console.warn('Error loading progress summary:', error)
      }
    }

    loadProgressSummary()
  }, [user])

  const handleStartHeroEdit = () => {
    setEditHeroProfile(heroProfile)
    setIsEditingHero(true)
  }

  const handleCancelHeroEdit = () => {
    setEditHeroProfile(heroProfile)
    setIsEditingHero(false)
  }

  const handleSaveHeroEdit = async () => {
    if (!user?.uid) return
    const trimmedName = editHeroProfile.displayName.trim()
    const trimmedLocation = editHeroProfile.location.trim()
    const trimmedBio = editHeroProfile.bio.trim()
    const trimmedGoals = editHeroProfile.trainingGoals.trim()

    if (!trimmedName || !trimmedLocation || !trimmedBio || !trimmedGoals) {
      return
    }

    setIsSavingHero(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      const athleteRef = doc(db, 'athletes', user.uid)

      const goalsArray = trimmedGoals
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)

      await Promise.all([
        updateDoc(userRef, {
          displayName: trimmedName,
          location: trimmedLocation,
          bio: trimmedBio,
          trainingGoals: trimmedGoals
        }),
        updateDoc(athleteRef, {
          'athleticProfile.trainingGoals': goalsArray
        }).catch(() => Promise.resolve())
      ])

      const updated = {
        ...heroProfile,
        displayName: trimmedName,
        location: trimmedLocation,
        bio: trimmedBio,
        trainingGoals: trimmedGoals
      }
      setHeroProfile(updated)
      setEditHeroProfile(updated)
      setIsEditingHero(false)
    } catch (error) {
      console.error('Error saving hero profile edits:', error)
    } finally {
      setIsSavingHero(false)
    }
  }

  const handleHeroPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setIsUploadingHeroPhoto(true)
    try {
      const sanitizedName = file.name.replace(/\s+/g, '-').toLowerCase()
      const storagePath = `athletes/${user.uid}/profile-photo/${Date.now()}-${sanitizedName}`
      const storageRef = ref(storage, storagePath)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: downloadURL,
        photoURL: downloadURL
      })

      const updated = {
        ...heroProfile,
        profileImageUrl: downloadURL
      }
      setHeroProfile(updated)
      setEditHeroProfile((prev) => ({
        ...prev,
        profileImageUrl: downloadURL
      }))
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      alert('Failed to upload profile photo. Please try again.')
    } finally {
      setIsUploadingHeroPhoto(false)
      // reset input so same file can be re-selected if needed
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  if (isLoading || heroLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#4B0102]">
      {/* Sticky header + red community bar (Wix-style frame, identical to /test) */}
      <div className="sticky top-0 z-40">
        <div className="w-full sticky top-0 z-30 bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
              {/* Left: logo + ATHLEAP wordmark */}
              <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png"
                  alt="Athleap logo"
                  className="h-8 w-auto"
                />
                <span
                  className="text-xl font-semibold tracking-[0.02em]"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  ATHLEAP
                </span>
              </Link>

              {/* Right: account chip with Settings and Sign out */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      heroProfile.profileImageUrl ||
                      user?.photoURL ||
                      'https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png'
                    }
                    alt={heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span
                    className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Hello
                  </span>
                  <span
                    className="text-sm"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
                  </span>
                  <span className="text-xs text-gray-400">|</span>
                  <Link
                    href="/settings"
                    className="text-xs text-gray-700 underline hover:text-gray-900 transition-colors"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Settings
                  </Link>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isSigningOut) return
                      setIsSigningOut(true)
                      setTimeout(async () => {
                        try {
                          await signOut(auth)
                        } catch (e) {
                          console.error('Sign out failed:', e)
                        } finally {
                          window.location.href = '/'
                        }
                      }, 300)
                    }}
                    className="text-xs text-gray-700 underline hover:text-gray-900 transition-colors"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Red bar under header with Athlete Community text (Wix colorUnderlay + rich text) */}
          <div className="w-full bg-[#FC0105]">
            <div className="max-w-6xl mx-auto px-8 py-2 flex justify-end">
              <p
                className="text-[15px] leading-none font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
              >
                Athlete Community{heroProfile.sport ? ` - ${heroProfile.sport}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero + metrics + main sections */}
      <main className="w-full">
        {/* Subscription banner / CTA into Stripe pricing page */}
        {!subscriptionLoading && subscriptionSummary && !subscriptionSummary.isActive && (
          <section className="w-full bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-900"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Upgrade to Premium Features
                </p>
                <p
                  className="text-xs text-gray-700 mt-1"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  You're on the free plan with access to 1 coach. Upgrade to unlock live sessions, video submissions, AI coaching, and unlimited coaches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/dashboard/athlete/pricing'
                }}
                className="inline-flex items-center justify-center px-6 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase shadow-sm transition-colors"
                style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#FC0105', color: '#FFFFFF' }}
              >
                View Plans
              </button>
            </div>
          </section>
        )}

        {/* Hero band */}
        <section className="w-full bg-[#4B0102]">
          <div className="max-w-6xl mx-auto px-8 py-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
            {/* Left: name, location, long bio (inline-editable) */}
            <div className="space-y-4">
              {isEditingHero ? (
                <>
                  <input
                    type="text"
                    value={editHeroProfile.displayName}
                    onChange={(e) =>
                      setEditHeroProfile((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-md border border-white/60 bg-white/10 text-white text-3xl font-bold"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  />
                  <input
                    type="text"
                    value={editHeroProfile.location}
                    onChange={(e) =>
                      setEditHeroProfile((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="City, State or Country"
                    className="w-full px-3 py-2 rounded-md border border-white/60 bg-white/10 text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px' }}
                  />
                  <textarea
                    value={editHeroProfile.bio}
                    onChange={(e) =>
                      setEditHeroProfile((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell your story as an athlete..."
                    className="w-full px-3 py-2 rounded-md border border-white/60 bg-white/10 text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '21px', lineHeight: '1.3em' }}
                    rows={4}
                  />
                  <div className="pt-2 space-y-2">
                    <label
                      className="block text-sm font-semibold uppercase tracking-[0.12em] text-white/80"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Training Goals
                    </label>
                    <textarea
                      value={editHeroProfile.trainingGoals}
                      onChange={(e) =>
                        setEditHeroProfile((prev) => ({ ...prev, trainingGoals: e.target.value }))
                      }
                      placeholder="List your goals, separated by commas (e.g., Compete at Worlds, Improve guard retention)"
                      className="w-full px-3 py-2 rounded-md border border-white/60 bg-white/10 text-white"
                      style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', lineHeight: '1.4em' }}
                      rows={3}
                    />
                    <p
                      className="text-xs text-white/70"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      These goals power your <strong>Your Game Plan and Progress</strong> metrics.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelHeroEdit}
                      disabled={isSavingHero}
                      className="px-4 py-2 rounded-full border border-white/70 bg-transparent text-white text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveHeroEdit}
                      disabled={
                        isSavingHero ||
                        !editHeroProfile.displayName.trim() ||
                        !editHeroProfile.location.trim() ||
                        !editHeroProfile.bio.trim() ||
                        !editHeroProfile.trainingGoals.trim()
                      }
                      className="px-5 py-2 rounded-full border border-white/60 bg-[#FC0105] text-white text-sm font-semibold tracking-wide hover:bg-[#d70004] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {isSavingHero ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2
                    className="font-bold text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '54px', lineHeight: 'normal' }}
                  >
                    {heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
                  </h2>
                  <h5
                    className="text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px' }}
                  >
                    {heroProfile.location || 'Your location'}
                  </h5>
                  <p
                    className="text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '21px', lineHeight: '1.3em' }}
                  >
                    {heroProfile.bio ||
                      'This is your space to share your story, your background, and what drives you as an athlete.'}
                  </p>
                </>
              )}
            </div>

            {/* Right: hero image + Edit Profile CTA (match coach sizing) */}
            <div className="flex flex-col items-center md:items-end gap-3 w-full max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  heroProfile.profileImageUrl ||
                  'https://static.wixstatic.com/media/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg/v1/crop/x_958,y_0,w_3350,h_3468/fill/w_402,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg'
                }
                alt={heroProfile.displayName || user?.displayName || 'Athleap Athlete'}
                className="w-[347px] h-[359px] object-cover"
              />

              {/* Hidden file input for photo upload */}
              <input
                ref={heroPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeroPhotoSelected}
              />

              {isEditingHero && (
                <button
                  type="button"
                  onClick={() => heroPhotoInputRef.current?.click()}
                  disabled={isUploadingHeroPhoto}
                  className="w-[347px] h-10 rounded-full border border-white/60 bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.12em] hover:bg-white/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {isUploadingHeroPhoto ? 'Uploading Photo…' : 'Change Photo'}
                </button>
              )}

              {!isEditingHero && (
                <button
                  type="button"
                  onClick={handleStartHeroEdit}
                  className="w-[347px] h-12 rounded-2xl border border-white/40 bg-[#C40000] text-white text-sm font-semibold uppercase tracking-wide px-6 hover:bg-[#a80000] transition-colors"
                  style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Game Plan & Progress metrics row */}
        <section className="w-full bg-[#4B0102]">
          <div className="max-w-6xl mx-auto px-8 py-12">
            <h2
              className="text-left text-white mb-8"
              style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
            >
              Your Game Plan and Progress
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Training Goals */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {heroProfile.trainingGoals
                      ? heroProfile.trainingGoals.split(',').map(g => g.trim()).filter(Boolean).length
                      : 0}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAINING GOALS
                  </div>
                </div>
              </div>
              {/* Trainings Complete */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.completedLessons}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAININGS COMPLETE
                  </div>
                </div>
              </div>
              {/* Trainings In Progress */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.inProgressLessons}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    TRAININGS IN PROGRESS
                  </div>
                </div>
              </div>
              {/* Upcoming Events */}
              <div className="flex flex-col items-stretch">
                <div className="flex-1 bg-[#7A0202] bg-opacity-90 px-6 py-6 text-white flex flex-col items-center justify-center">
                  <div
                    className="leading-none mb-2"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '100px' }}
                  >
                    {progressSummary.upcomingEvents}
                  </div>
                  <div className="w-12 border-t border-white mb-2" />
                  <div
                    className="text-center"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', letterSpacing: '0.1em' }}
                  >
                    UPCOMING EVENTS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coaches section – solid white band edge-to-edge */}
        <section className="w-full bg-white">
          <div className="max-w-6xl mx-auto px-8 py-12">
            <AthleteCoaches subscription={subscriptionSummary} />
          </div>
        </section>

        {/* Training Library – light gray band edge-to-edge */}
        <section className="w-full" style={{ backgroundColor: '#EDEDED' }}>
          <div className="max-w-6xl mx-auto px-8 py-10">
            <AthleteTrainingLibrary 
              subscription={subscriptionSummary} 
              isVerifying={subscriptionVerifying}
            />
          </div>
        </section>

        {/* Recommended Gear - darker red band stretching edge-to-edge */}
        <AthleteRecommendedGear />

        {/* Quick setup modal (no welcome popup; welcome is now a full page) */}
        <ProfileQuickSetupModal
          isOpen={showQuickSetup}
          onClose={() => setShowQuickSetup(false)}
        />
      </main>
    </div>
  )
}
