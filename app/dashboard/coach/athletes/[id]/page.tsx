'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  User,
  Mail,
  Calendar,
  Trophy,
  Target,
  Clock,
  ArrowLeft,
  Activity,
  TrendingUp,
  BookOpen,
  Award,
  Star,
  MessageCircle
} from 'lucide-react'

interface AthleteDetails {
  id: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  sport?: string
  primarySport?: string
  skillLevel?: string
  trainingGoals?: string
  achievements?: string
  learningStyle?: string
  availability?: any[]
  specialNotes?: string
  createdAt?: string
  status?: string
}

export default function AthleteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const athleteId = params.id as string
  const embedded = searchParams.get('embedded') === 'true'

  const [athlete, setAthlete] = useState<AthleteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (athleteId && user) {
      loadAthleteDetails()
    }
  }, [athleteId, user])

  const loadAthleteDetails = async () => {
    try {
      setLoading(true)

      // Try to fetch from API first (provides richer data)
      try {
        const token = await user!.getIdToken()
        const response = await fetch(`/api/coach/athletes/${athleteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.athlete) {
            // Use API data and fetch additional Firestore fields
            const athleteDoc = await getDoc(doc(db, 'users', athleteId))
            const firestoreData = athleteDoc.exists() ? athleteDoc.data() : {}

            setAthlete({
              id: data.athlete.id,
              email: data.athlete.email,
              displayName: data.athlete.displayName,
              firstName: firestoreData.firstName,
              lastName: firestoreData.lastName,
              sport: data.athlete.sport,
              primarySport: firestoreData.primarySport,
              skillLevel: firestoreData.skillLevel,
              trainingGoals: firestoreData.trainingGoals,
              achievements: firestoreData.achievements,
              learningStyle: firestoreData.learningStyle,
              availability: firestoreData.availability,
              specialNotes: firestoreData.specialNotes,
              createdAt: data.athlete.createdAt,
              status: 'active'
            })
            return
          }
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to Firestore:', apiError)
      }

      // Fallback to Firestore
      const athleteDoc = await getDoc(doc(db, 'users', athleteId))

      if (!athleteDoc.exists()) {
        setError('Athlete not found')
        return
      }

      const data = athleteDoc.data()

      setAthlete({
        id: athleteDoc.id,
        email: data.email || '',
        displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown Athlete',
        firstName: data.firstName,
        lastName: data.lastName,
        sport: data.sport || data.primarySport || 'Unknown',
        primarySport: data.primarySport,
        skillLevel: data.skillLevel,
        trainingGoals: data.trainingGoals,
        achievements: data.achievements,
        learningStyle: data.learningStyle,
        availability: data.availability,
        specialNotes: data.specialNotes,
        createdAt: data.createdAt,
        status: data.status || 'active'
      })
    } catch (err) {
      console.error('Error loading athlete details:', err)
      setError('Failed to load athlete details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`${embedded ? 'p-12' : 'min-h-screen'} flex items-center justify-center`} style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading athlete details...</p>
        </div>
      </div>
    )
  }

  if (error || !athlete) {
    return (
      <div className={`${embedded ? 'p-12' : 'min-h-screen'} flex items-center justify-center`} style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }}>
        <div className="text-center bg-white rounded-xl p-8 max-w-md shadow-lg">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
            {error || 'Athlete not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'min-h-screen'} style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }}>
      {/* Header */}
      {!embedded && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Athletes
            </button>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                {athlete.displayName}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span style={{ color: '#000000', opacity: 0.7 }}>{athlete.email}</span>
                </div>
                {athlete.sport && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gray-500" />
                    <span style={{ color: '#000000', opacity: 0.7 }}>{athlete.sport}</span>
                  </div>
                )}
                {athlete.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span style={{ color: '#000000', opacity: 0.7 }}>
                      Joined {new Date(athlete.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {athlete.status || 'Active'}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Embedded Header - Compact version */}
      {embedded && (
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-3 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Athletes
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: '#000000' }}>
                {athlete.displayName}
              </h1>
              <p className="text-sm truncate" style={{ color: '#000000', opacity: 0.7 }}>
                {athlete.email}
              </p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {athlete.status || 'Active'}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${embedded ? 'px-4 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Athletic Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Goals */}
            {athlete.trainingGoals && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>Training Goals</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{athlete.trainingGoals}</p>
              </div>
            )}

            {/* Achievements */}
            {athlete.achievements && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>Achievements</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{athlete.achievements}</p>
              </div>
            )}

            {/* Special Notes */}
            {athlete.specialNotes && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>Special Notes</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{athlete.specialNotes}</p>
              </div>
            )}

            {/* Availability */}
            {athlete.availability && athlete.availability.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>Training Availability</h2>
                </div>
                <div className="space-y-2">
                  {athlete.availability.map((slot: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium capitalize" style={{ color: '#000000' }}>{slot.day}</span>
                      <span className="text-sm text-gray-600">{slot.timeSlots || 'Flexible'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Stats & Info */}
          <div className="space-y-6">
            {/* Skill Level */}
            {athlete.skillLevel && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-5 h-5" style={{ color: '#20B2AA' }} />
                  <h3 className="font-semibold" style={{ color: '#000000' }}>Skill Level</h3>
                </div>
                <div className="px-4 py-2 bg-teal-50 text-teal-800 rounded-lg text-center font-medium capitalize">
                  {athlete.skillLevel}
                </div>
              </div>
            )}

            {/* Learning Style */}
            {athlete.learningStyle && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5" style={{ color: '#91A6EB' }} />
                  <h3 className="font-semibold" style={{ color: '#000000' }}>Learning Style</h3>
                </div>
                <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-center font-medium capitalize">
                  {athlete.learningStyle}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="font-semibold mb-4" style={{ color: '#000000' }}>Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                <button className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Assign Lesson
                </button>
                <button className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  View Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
