'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Live1on1RequestModal from './Live1on1RequestModal'
import VideoManagementModal from './VideoManagementModal'
import CoachProfileModal from './CoachProfileModal'
import dynamic from 'next/dynamic'

const AskCoachAI = dynamic(() => import('./AskCoachAI'), { ssr: false })

interface AthleteSubscriptionSummary {
  tier?: string
  status?: string
  isActive?: boolean
}

interface AthleteCoachesProps {
  subscription?: AthleteSubscriptionSummary | null
}

export default function AthleteCoaches({ subscription }: AthleteCoachesProps = {}) {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [showAskModal, setShowAskModal] = useState(false)
  const [showSubmitVideoModal, setShowSubmitVideoModal] = useState(false)
  const [coachPage, setCoachPage] = useState(0)
  const coachPageSize = 3
  const [showCoachProfileModal, setShowCoachProfileModal] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const hasActiveSubscription = !!subscription?.isActive

  useEffect(() => {
    const loadCoaches = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const coachMap = new Map<string, any>()

        // 1. Get athlete's assigned coach
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const assignedCoachId = userData?.coachId || userData?.assignedCoachId

          if (assignedCoachId) {
            // Fetch assigned coach data
            const coachDoc = await getDoc(doc(db, 'users', assignedCoachId))
            if (coachDoc.exists()) {
              const coachData = coachDoc.data()
              coachMap.set(assignedCoachId, {
                id: assignedCoachId,
                name: coachData.displayName || 'Coach',
                imageUrl: coachData.photoURL || '',
                title: coachData.sport || 'Coach',
                author: coachData.displayName || 'Coach',
                slug: coachData.slug,
                isAssigned: true
              })
            }
          }
        }

        // 2. Get followed coaches
        try {
          console.log('🔍 Fetching followed coaches...')
          const followingResponse = await fetch('/api/athlete/following', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          console.log('📡 Following API response status:', followingResponse.status)

          if (followingResponse.ok) {
            const followingData = await followingResponse.json()
            console.log('📊 Following data:', followingData)

            if (followingData.success && followingData.following) {
              console.log(`✅ Found ${followingData.following.length} followed coaches`)
              // Fetch details for each followed coach
              for (const follow of followingData.following) {
                if (!coachMap.has(follow.coachId)) {
                  try {
                    console.log(`📥 Fetching data for coach ${follow.coachId}`)
                    const coachDoc = await getDoc(doc(db, 'users', follow.coachId))
                    if (coachDoc.exists()) {
                      const coachData = coachDoc.data()
                      coachMap.set(follow.coachId, {
                        id: follow.coachId,
                        name: coachData.displayName || follow.coachName || 'Coach',
                        imageUrl: coachData.photoURL || '',
                        title: coachData.sport || 'Coach',
                        author: coachData.displayName || follow.coachName || 'Coach',
                        slug: coachData.slug,
                        isAssigned: false
                      })
                      console.log(`✅ Added followed coach: ${coachData.displayName}`)
                    }
                  } catch (e) {
                    console.warn(`Could not fetch coach ${follow.coachId}:`, e)
                  }
                }
              }
            }
          } else {
            const errorData = await followingResponse.json().catch(() => ({}))
            console.error('❌ Following API error:', followingResponse.status, errorData)
          }
        } catch (error) {
          console.error('❌ Could not fetch followed coaches:', error)
        }

        // Convert map to array
        const allCoaches = Array.from(coachMap.values())

        // Set first coach as primary (assigned coach takes priority)
        if (allCoaches.length > 0) {
          const primaryCoach = allCoaches.find(c => c.isAssigned) || allCoaches[0]
          setCoachId(primaryCoach.id)
        }

        setCoaches(allCoaches)
        setCoachPage(0)
        console.log(`✅ Loaded ${allCoaches.length} coaches (${allCoaches.filter(c => c.isAssigned).length} assigned, ${allCoaches.filter(c => !c.isAssigned).length} followed)`)
      } catch (error) {
        console.error('Error loading coaches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoaches()

    // Refresh coaches when page becomes visible or window gains focus
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.uid) {
        console.log('🔄 Page visible - refreshing coaches...')
        loadCoaches()
      }
    }

    const handleFocus = () => {
      if (user?.uid) {
        console.log('🔄 Window focused - refreshing coaches...')
        loadCoaches()
      }
    }

    // Also check for localStorage event (custom trigger from browse coaches page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'coachFollowUpdated' && user?.uid) {
        console.log('🔄 Coach follow detected - refreshing coaches...')
        loadCoaches()
        // Clear the flag
        localStorage.removeItem('coachFollowUpdated')
      }
    }

    // Listen for custom event (immediate same-page updates)
    const handleCoachFollowChange = () => {
      if (user?.uid) {
        console.log('🔄 Coach follow change detected - refreshing coaches...')
        loadCoaches()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('coachFollowChange', handleCoachFollowChange as EventListener)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('coachFollowChange', handleCoachFollowChange as EventListener)
    }
  }, [user])

  const handleScheduleSession = () => {
    if (coachId) {
      setShowScheduleModal(true)
    }
  }

  const handleSubmitVideo = () => {
    setShowSubmitVideoModal(true)
  }

  const handleAskQuestion = () => {
    if (coachId) {
      setShowAskModal(true)
    }
  }

  const totalCoachPages = Math.max(1, Math.ceil(coaches.length / coachPageSize))
  const coachStart = coachPage * coachPageSize
  const visibleCoaches = coaches.slice(coachStart, coachStart + coachPageSize)

  return (
    <>
      <div>
        <div className="flex items-center justify-center mb-10 gap-3">
          <h2
            className="text-center"
            style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
          >
            Your Athleap Coaches
          </h2>
          <button
            type="button"
            aria-label="Add coach / browse coaches"
            onClick={() => {
              window.location.href = '/coaches'
            }}
            className="group relative flex items-center justify-center h-10 rounded-2xl border border-[#C40000] text-white focus:outline-none transition-all duration-300 ease-out overflow-hidden"
            style={{ backgroundColor: '#C40000', width: '44px', fontFamily: '"Open Sans", sans-serif' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.width = '160px'
              e.currentTarget.classList.add('justify-start', 'pl-4')
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.width = '44px'
              e.currentTarget.classList.remove('justify-start', 'pl-4')
            }}
          >
            <span className="text-2xl leading-none transition-all duration-300 group-hover:translate-x-1">
              +
            </span>
            <span
              className="ml-0 group-hover:ml-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wide opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[120px] transition-all duration-300 ease-out"
            >
              Add Coach
            </span>
          </button>
        </div>

        {/* No Coaches Message */}
        {!loading && coaches.length === 0 && (
          <div className="bg-white border-2 border-black rounded-lg p-6 text-center max-w-xl mx-auto">
            <p className="text-lg font-semibold mb-3" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              You don't have any coaches yet!
            </p>
            <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              Browse our amazing coaches and start your training journey today.
            </p>
            <a
              href="/coaches"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
              style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
            >
              Browse Coaches
            </a>
          </div>
        )}

        {/* Coach row - show coaches in pages of 3 (assigned + followed) */}
        {!loading && coaches.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 justify-items-center">
              {visibleCoaches.map((coach) => (
                <button
                  key={coach.id}
                  onClick={() => {
                    setSelectedCoach(coach)
                    setShowCoachProfileModal(true)
                  }}
                  className="flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-[225px] h-[225px] rounded-full overflow-hidden bg-gray-100 mb-4 group-hover:ring-2 group-hover:ring-black transition-all">
                    {coach.imageUrl ? (
                      <img
                        src={coach.imageUrl}
                        alt={coach.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                        <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                      </div>
                    )}
                  </div>
                  <p
                    className="mb-1"
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '27px', color: '#111111' }}
                  >
                    {coach.name}
                  </p>
                  <p
                    style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px', color: '#000000' }}
                  >
                    {coach.title}
                  </p>
                </button>
              ))}
            </div>

            {/* Pagination arrows - only when more than 3 coaches */}
            {coaches.length > coachPageSize && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Previous coaches"
                  onClick={() => setCoachPage((prev) => Math.max(0, prev - 1))}
                  disabled={coachPage === 0}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                    coachPage === 0
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span
                  className="text-xs"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
                >
                  Page {coachPage + 1} of {totalCoachPages}
                </span>
                <button
                  type="button"
                  aria-label="Next coaches"
                  onClick={() => setCoachPage((prev) => Math.min(totalCoachPages - 1, prev + 1))}
                  disabled={coachPage >= totalCoachPages - 1}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                    coachPage >= totalCoachPages - 1
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                      : 'border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Red CTA buttons row (gated by subscription) */}
            {hasActiveSubscription ? (
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-3xl">
                <button
                  type="button"
                  onClick={handleScheduleSession}
                  className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:flex-1 text-center"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Request Coaching Session
                </button>
                <button
                  type="button"
                  onClick={handleAskQuestion}
                  className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:flex-1 text-center"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Ask A Question
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVideo}
                  className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:flex-1 text-center"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Submit Training Video
                </button>
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-center gap-3 w-full max-w-3xl">
                <p
                  className="text-sm text-center"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#444444' }}
                >
                  Start your athlete subscription to request live sessions, ask your coach questions, and submit training videos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/dashboard/athlete/pricing'
                  }}
                  className="rounded-full bg-[#FC0105] px-8 py-3 text-sm font-semibold text-white tracking-[0.08em] uppercase shadow-sm hover:bg-[#d70004] transition-colors w-full sm:w-auto text-center"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showScheduleModal && coachId && (
        <Live1on1RequestModal
          userId={user?.uid || ''}
          userEmail={user?.email || ''}
          coachId={coachId}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false)
            console.log('Live 1-1 session request submitted')
          }}
        />
      )}

      {/* Ask a Question - Chat Drawer */}
      {showAskModal && coachId && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAskModal(false)
          }}
        >
          <div
            className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[92vw] sm:w-[520px] max-w-[560px] rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#FFFFFF', animation: 'slideInChat .28s ease-out forwards' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#FC0105' }}>
              <div>
                <h3 className="text-white font-bold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>Ask Your Coach</h3>
                <p className="text-white/90 text-xs">Chat without leaving this page</p>
              </div>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className="h-[60vh] sm:h-[64vh]">
              <AskCoachAI
                coachId={coachId}
                coachName={(coaches?.[0]?.name as string) || 'Coach'}
                sport={(coaches?.[0]?.title as string) || ''}
                inlineMode
              />
            </div>
          </div>
          <style jsx global>{`
            @keyframes slideInChat {
              from { transform: translateY(12px) scale(0.98); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Video Management Modal */}
      {showSubmitVideoModal && (
        <VideoManagementModal
          onClose={() => setShowSubmitVideoModal(false)}
          initialTab="submit"
        />
      )}

      {/* Coach Profile Modal */}
      {showCoachProfileModal && selectedCoach && (
        <CoachProfileModal
          isOpen={showCoachProfileModal}
          onClose={() => {
            setShowCoachProfileModal(false)
            setSelectedCoach(null)
          }}
          coachId={selectedCoach.id}
          coachSlug={selectedCoach.slug}
          hideLessons={true}
        />
      )}
    </>
  )
}

