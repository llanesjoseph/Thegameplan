'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Live1on1RequestModal from './Live1on1RequestModal'
import VideoManagementModal from './VideoManagementModal'
import dynamic from 'next/dynamic'

const AskCoachAI = dynamic(() => import('./AskCoachAI'), { ssr: false })

export default function AthleteCoaches() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [showAskModal, setShowAskModal] = useState(false)
  const [showSubmitVideoModal, setShowSubmitVideoModal] = useState(false)
  const [coachPage, setCoachPage] = useState(0)
  const coachPageSize = 3

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
                isAssigned: true
              })
            }
          }
        }

        // 2. Get followed coaches
        try {
          const followingResponse = await fetch('/api/athlete/following', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (followingResponse.ok) {
            const followingData = await followingResponse.json()
            if (followingData.success && followingData.following) {
              // Fetch details for each followed coach
              for (const follow of followingData.following) {
                if (!coachMap.has(follow.coachId)) {
                  try {
                    const coachDoc = await getDoc(doc(db, 'users', follow.coachId))
                    if (coachDoc.exists()) {
                      const coachData = coachDoc.data()
                      coachMap.set(follow.coachId, {
                        id: follow.coachId,
                        name: coachData.displayName || follow.coachName || 'Coach',
                        imageUrl: coachData.photoURL || '',
                        title: coachData.sport || 'Coach',
                        author: coachData.displayName || follow.coachName || 'Coach',
                        isAssigned: false
                      })
                    }
                  } catch (e) {
                    console.warn(`Could not fetch coach ${follow.coachId}:`, e)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Could not fetch followed coaches:', error)
        }

        // Convert map to array
        const allCoaches = Array.from(coachMap.values())

        // Set first coach as primary (assigned coach takes priority)
        if (allCoaches.length > 0) {
          const primaryCoach = allCoaches.find(c => c.isAssigned) || allCoaches[0]
          setCoachId(primaryCoach.id)
        }

        setCoaches(allCoaches)
        console.log(`✅ Loaded ${allCoaches.length} coaches (${allCoaches.filter(c => c.isAssigned).length} assigned, ${allCoaches.filter(c => !c.isAssigned).length} followed)`)
      } catch (error) {
        console.error('Error loading coaches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoaches()
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

  return (
    <>
      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
          Your Coaches
        </h2>
        
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Columns 1-3: Coach Images - show 3 at a time, leave empty if no coach */}
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '1/1' }}></div>
                ))}
              </>
            ) : (
              <>
                {[0, 1, 2].map((index) => {
                  const coach = coaches[coachPage * coachPageSize + index]
                  return coach ? (
                    <div key={coach.id} className="text-center w-full">
                      <div className="w-full rounded-lg overflow-hidden bg-gray-100 mb-1" style={{ aspectRatio: '1/1' }}>
                        {coach.imageUrl ? (
                          <img
                            src={coach.imageUrl}
                            alt={coach.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                            <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                        {coach.title}
                      </p>
                      <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        {coach.author}
                      </p>
                    </div>
                  ) : (
                    <div key={`empty-${index}`} className="w-full" style={{ aspectRatio: '1/1' }}></div>
                  )
                })}
              </>
            )}

            {/* 4th column - Action Buttons centered vertically */}
            {!loading && (
              <div className="w-full flex flex-col justify-center gap-2">
                <button
                  onClick={handleScheduleSession}
                  className="w-full bg-black text-white py-2.5 text-sm font-bold hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
                >
                  Schedule 1-1 Session With a Coach
                </button>
                <button
                  onClick={handleSubmitVideo}
                  className="w-full bg-black text-white py-2.5 text-xs font-bold hover:bg-gray-800 transition-colors leading-tight"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
                >
                  Submit Training Video for Coach Feedback
                </button>
                <button
                  onClick={handleAskQuestion}
                  className="w-full bg-black text-white py-2.5 text-sm font-bold hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
                >
                  Ask a Question With Your Coach
                </button>
              </div>
            )}
          </div>

          {/* Pagination arrows - only show if MORE than 3 coaches */}
          {!loading && coaches.length > 3 && (
            <>
              <button
                aria-label="Previous coaches"
                disabled={coachPage === 0}
                onClick={() => setCoachPage((p) => Math.max(0, p - 1))}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  coachPage > 0
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                aria-label="Next coaches"
                disabled={coachPage >= Math.ceil(coaches.length / coachPageSize) - 1}
                onClick={() => setCoachPage((p) => Math.min(Math.ceil(coaches.length / coachPageSize) - 1, p + 1))}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  coachPage < Math.ceil(coaches.length / coachPageSize) - 1
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
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
    </>
  )
}

