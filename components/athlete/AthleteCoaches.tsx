'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { User } from 'lucide-react'
import Live1on1RequestModal from './Live1on1RequestModal'
import dynamic from 'next/dynamic'

export default function AthleteCoaches() {
  const { user } = useAuth()
  const router = useRouter()
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  // Removed inline AskCoachAI modal; floating launcher handles chat

  useEffect(() => {
    const loadCoaches = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Get athlete's assigned coach
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const assignedCoachId = userData?.coachId || userData?.assignedCoachId

          if (assignedCoachId) {
            // Fetch coach data
            const coachDoc = await getDoc(doc(db, 'users', assignedCoachId))
            if (coachDoc.exists()) {
              const coachData = coachDoc.data()
              setCoaches([{
                id: assignedCoachId,
                name: coachData.displayName || 'Coach',
                imageUrl: coachData.photoURL || '',
                title: coachData.sport || 'Coach',
                author: coachData.displayName || 'Coach'
              }])
              setCoachId(assignedCoachId)
            }
          }
        }
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
    router.push('/dashboard/athlete/submit-video')
  }

  // Ask question handled by global floating chat; no-op here

  return (
    <>
      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
          Your Coaches
        </h2>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          {/* Coach Images Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '1/1' }}></div>
                ))}
              </div>
            ) : coaches.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {coaches.map((coach) => (
                  <div key={coach.id} className="text-center w-44 md:w-48 lg:w-56">
                    <div className="w-full rounded-lg overflow-hidden bg-gray-100 mb-1" style={{ aspectRatio: '1/1' }}>
                      {coach.imageUrl ? (
                        <img
                          src={coach.imageUrl}
                          alt={coach.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: '#E5E5E5' }}>
                          {/* Placeholder for coach image */}
                          <div className="w-full h-full bg-gray-300"></div>
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
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No coaches assigned yet</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="md:w-44 md:max-w-[14rem] lg:w-56 space-y-2 mt-4 md:mt-0">
            <button
              onClick={handleScheduleSession}
              className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
              style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
            >
              Schedule 1-1 Session With a Coach
            </button>
            <button
              onClick={handleSubmitVideo}
              className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
              style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
            >
              Submit Training Video for Coach Feedback
            </button>
          </div>
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

      {/* Ask a Question modal removed to avoid duplicate AI entry point */}
    </>
  )
}

