'use client'

import { useState, useEffect } from 'react'
import { X, Mail, MessageSquare, Calendar, User, Video, MapPin, Clock } from 'lucide-react'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

interface MyCoachPanelProps {
  coachId: string
  isOpen: boolean
  onClose: () => void
}

interface CoachData {
  displayName: string
  email: string
  photoURL?: string
  sport?: string
  bio?: string
  phone?: string
}

interface NextSession {
  id: string
  sessionDate: any
  sessionType: 'video_call' | 'in_person' | 'phone'
  title: string
  notes?: string
  status: string
}

export default function MyCoachPanel({ coachId, isOpen, onClose }: MyCoachPanelProps) {
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [nextSession, setNextSession] = useState<NextSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && coachId) {
      loadCoachData()
      loadNextSession()
    }
  }, [isOpen, coachId])

  const loadCoachData = async () => {
    try {
      // Load from users collection
      const userRef = doc(db, 'users', coachId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data() as CoachData
        setCoachData(userData)

        // Try to get additional data from coach_profiles or creator_profiles
        try {
          const profileQuery = query(
            collection(db, 'creator_profiles'),
            where('uid', '==', coachId)
          )
          const profileSnap = await getDocs(profileQuery)

          if (!profileSnap.empty) {
            const profileData = profileSnap.docs[0].data()
            setCoachData(prev => ({
              ...prev!,
              photoURL: profileData.profileImageUrl || profileData.headshot || prev?.photoURL,
              bio: profileData.bio || prev?.bio,
              sport: profileData.sport || prev?.sport
            }))
          }
        } catch (error) {
          console.warn('Could not load coach profile:', error)
        }
      }
    } catch (error) {
      console.error('Error loading coach data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNextSession = async () => {
    try {
      // Query for upcoming sessions
      const sessionsRef = collection(db, 'next_sessions')
      const sessionsQuery = query(
        sessionsRef,
        where('coachId', '==', coachId),
        where('status', '==', 'scheduled'),
        orderBy('sessionDate', 'asc'),
        limit(1)
      )
      const sessionsSnap = await getDocs(sessionsQuery)

      if (!sessionsSnap.empty) {
        const sessionData = sessionsSnap.docs[0].data() as NextSession
        setNextSession({
          id: sessionsSnap.docs[0].id,
          ...sessionData
        })
      }
    } catch (error) {
      console.error('Error loading next session:', error)
      // Fail silently - sessions might not be set up yet
    }
  }

  const handleMessageCoach = () => {
    // Future: Open in-app messaging
    alert('💬 Messaging feature coming soon! For now, please email your coach.')
  }

  const handleEmailCoach = () => {
    if (coachData?.email) {
      window.location.href = `mailto:${coachData.email}?subject=Question from Athlete`
    }
  }

  const handleViewProfile = () => {
    // Navigate to coach's full public profile
    window.open(`/coach/${coachId}`, '_blank')
  }

  const formatSessionDate = (sessionDate: any) => {
    try {
      const date = sessionDate?.toDate?.() || new Date(sessionDate)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'Date unavailable'
    }
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call':
        return <Video className="w-4 h-4" />
      case 'in_person':
        return <MapPin className="w-4 h-4" />
      case 'phone':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video_call':
        return 'Video Call'
      case 'in_person':
        return 'In Person'
      case 'phone':
        return 'Phone Call'
      default:
        return 'Session'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform overflow-y-auto"
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 shadow-md z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Coach</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/90 text-sm">Quick access to your coach's information</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        ) : coachData ? (
          <div className="p-6 space-y-6">
            {/* Coach Profile Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md">
              <div className="flex items-start gap-4 mb-4">
                {/* Coach Photo */}
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg flex-shrink-0" style={{ backgroundColor: '#20B2AA' }}>
                  {coachData.photoURL ? (
                    <img
                      src={coachData.photoURL}
                      alt={coachData.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {coachData.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Coach Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#000000' }}>
                    {coachData.displayName}
                  </h3>
                  {coachData.sport && (
                    <p className="text-sm mb-2" style={{ color: '#666' }}>
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
                        {coachData.sport}
                      </span>
                    </p>
                  )}
                  {coachData.email && (
                    <p className="text-xs truncate" style={{ color: '#666' }}>
                      {coachData.email}
                    </p>
                  )}
                </div>
              </div>

              {coachData.bio && (
                <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                  {coachData.bio.substring(0, 150)}{coachData.bio.length > 150 ? '...' : ''}
                </p>
              )}
            </div>

            {/* Contact Buttons */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#666' }}>
                Contact Options
              </h4>

              <button
                onClick={handleMessageCoach}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Message Coach</span>
              </button>

              <button
                onClick={handleEmailCoach}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              >
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Send Email</span>
              </button>
            </div>

            {/* Next Session Card */}
            {nextSession ? (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-md border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5" style={{ color: '#3B82F6' }} />
                  <h4 className="font-semibold" style={{ color: '#000000' }}>Next Session</h4>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-lg" style={{ color: '#000000' }}>
                    {nextSession.title}
                  </p>

                  <div className="flex items-center gap-2 text-sm" style={{ color: '#666' }}>
                    <Clock className="w-4 h-4" />
                    <span>{formatSessionDate(nextSession.sessionDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: '#666' }}>
                    {getSessionTypeIcon(nextSession.sessionType)}
                    <span>{getSessionTypeLabel(nextSession.sessionType)}</span>
                  </div>

                  {nextSession.notes && (
                    <p className="text-sm mt-3 p-3 bg-white/60 rounded-lg" style={{ color: '#666' }}>
                      {nextSession.notes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#CCC' }} />
                <p className="text-sm" style={{ color: '#666' }}>
                  No upcoming sessions scheduled
                </p>
              </div>
            )}

            {/* View Full Profile Button */}
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all shadow-md hover:shadow-lg"
            >
              <User className="w-5 h-5" />
              <span className="font-semibold">View Full Profile</span>
            </button>

            {/* Help Text */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-xs" style={{ color: '#666' }}>
                💡 <strong>Tip:</strong> You can also reach your coach through the "Ask Your Coach" AI assistant in the main dashboard.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12 text-center">
            <div>
              <User className="w-16 h-16 mx-auto mb-4" style={{ color: '#CCC' }} />
              <p className="text-lg mb-2" style={{ color: '#000000' }}>Coach Not Found</p>
              <p className="text-sm" style={{ color: '#666' }}>
                Unable to load coach information
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
