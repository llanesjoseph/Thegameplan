'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import {
  User,
  Mail,
  Calendar,
  Trophy,
  Target,
  Activity,
  BookOpen,
  Users,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  Video,
  MessageSquare
} from 'lucide-react'

interface CoachProfile {
  uid: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  role: string
  createdAt: Date
  lastLoginAt: Date

  // Coach Profile
  sport?: string
  bio?: string
  location?: string
  experience?: string
  certifications?: string[]
  specialties?: string[]

  // Stats
  athleteCount?: number
  lessonsCreated?: number
  totalViews?: number
}

interface Athlete {
  uid: string
  displayName: string
  email: string
  primarySport: string
  skillLevel: string
  joinedAt: Date
}

interface Lesson {
  id: string
  title: string
  sport: string
  createdAt: Date
  status: string
  views: number
}

export default function AdminCoachProfileView() {
  const params = useParams()
  const uid = params.uid as string
  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (uid) {
      loadCoachData()
    }
  }, [uid])

  const loadCoachData = async () => {
    try {
      setLoading(true)

      // Load coach user document
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (!userDoc.exists()) {
        console.error('User not found')
        return
      }

      const userData = userDoc.data()
      const coachData: CoachProfile = {
        uid: userDoc.id,
        email: userData.email || '',
        displayName: userData.displayName || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || '',
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        sport: userData.sport,
        bio: userData.bio,
        location: userData.location,
        experience: userData.experience,
        certifications: userData.certifications || [],
        specialties: userData.specialties || [],
        athleteCount: userData.athleteCount || 0,
        lessonsCreated: userData.lessonsCreated || 0,
        totalViews: userData.totalViews || 0
      }

      setCoach(coachData)

      // Load athletes assigned to this coach
      const athletesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'athlete'),
        where('coachId', '==', uid)
      )
      const athletesSnapshot = await getDocs(athletesQuery)
      const athletesData: Athlete[] = []
      athletesSnapshot.forEach(doc => {
        const data = doc.data()
        athletesData.push({
          uid: doc.id,
          displayName: data.displayName || data.email || 'Unknown',
          email: data.email || '',
          primarySport: data.primarySport || 'Not specified',
          skillLevel: data.skillLevel || 'Not specified',
          joinedAt: data.createdAt?.toDate() || new Date()
        })
      })
      setAthletes(athletesData)

      // Load lessons created by this coach
      const lessonsQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', uid),
        orderBy('createdAt', 'desc')
      )
      const lessonsSnapshot = await getDocs(lessonsQuery)
      const lessonsData: Lesson[] = []
      lessonsSnapshot.forEach(doc => {
        const data = doc.data()
        lessonsData.push({
          id: doc.id,
          title: data.title || 'Untitled Lesson',
          sport: data.sport || 'General',
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || 'draft',
          views: data.views || 0
        })
      })
      setLessons(lessonsData)

    } catch (error) {
      console.error('Error loading coach data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading coach profile...</p>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <p style={{ color: '#000000' }}>Coach not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#20B2AA' }}>
                <Star className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: '#000000' }}>
                  {coach.displayName}
                </h1>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                  <Mail className="w-4 h-4" />
                  <span>{coach.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1" style={{ color: '#000000', opacity: 0.7 }}>
                  <Calendar className="w-4 h-4" />
                  <span>Joined {coach.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#20B2AA', color: 'white' }}>
                Coach
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Engagement Stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#20B2AA' }} />
                Coaching Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: '#0284c7' }} />
                    <span className="text-sm font-medium">Athletes</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#0284c7' }}>
                    {athletes.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    <span className="text-sm font-medium">Lessons Created</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                    {lessons.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" style={{ color: '#16a34a' }} />
                    <span className="text-sm font-medium">Total Views</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#16a34a' }}>
                    {lessons.reduce((sum, l) => sum + l.views, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fce7f3' }}>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: '#be123c' }} />
                    <span className="text-sm font-medium">Last Active</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#be123c' }}>
                    {coach.lastLoginAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Target className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                Coach Information
              </h2>
              <div className="space-y-3">
                {coach.sport && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>PRIMARY SPORT</label>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                      <span className="text-sm font-medium">{coach.sport}</span>
                    </div>
                  </div>
                )}
                {coach.location && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>LOCATION</label>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                      <span className="text-sm font-medium">{coach.location}</span>
                    </div>
                  </div>
                )}
                {coach.experience && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>EXPERIENCE</label>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                      <span className="text-sm font-medium">{coach.experience}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {coach.bio && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                  <MessageSquare className="w-5 h-5" style={{ color: '#91A6EB' }} />
                  Bio
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: '#000000', opacity: 0.8 }}>
                  {coach.bio}
                </p>
              </div>
            )}

            {/* Certifications & Specialties */}
            {(coach.certifications && coach.certifications.length > 0) || (coach.specialties && coach.specialties.length > 0) && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                  <Award className="w-5 h-5" style={{ color: '#FF6B35' }} />
                  Credentials & Specialties
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {coach.certifications && coach.certifications.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: '#000000', opacity: 0.6 }}>CERTIFICATIONS</label>
                      <div className="space-y-2">
                        {coach.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {coach.specialties && coach.specialties.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: '#000000', opacity: 0.6 }}>SPECIALTIES</label>
                      <div className="space-y-2">
                        {coach.specialties.map((specialty, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#dbeafe' }}>
                            <Trophy className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{specialty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Athletes List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Users className="w-5 h-5" style={{ color: '#91A6EB' }} />
                Athletes ({athletes.length})
              </h2>
              {athletes.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {athletes.map((athlete) => (
                    <div key={athlete.uid} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#f8fafc' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{athlete.displayName}</div>
                          <div className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                            {athlete.primarySport} • {athlete.skillLevel}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                        Joined {athlete.joinedAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>No athletes assigned yet</p>
              )}
            </div>

            {/* Lessons Created */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <BookOpen className="w-5 h-5" style={{ color: '#FF6B35' }} />
                Lessons Created ({lessons.length})
              </h2>
              {lessons.length > 0 ? (
                <div className="space-y-2">
                  {lessons.slice(0, 10).map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#f8fafc' }}>
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                        <div>
                          <div className="font-medium text-sm">{lesson.title}</div>
                          <div className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                            {lesson.sport} • {lesson.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                          {lesson.views} views
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lesson.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>No lessons created yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
