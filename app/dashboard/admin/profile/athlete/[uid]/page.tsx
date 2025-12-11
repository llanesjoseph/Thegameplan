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
  Clock,
  Star,
  TrendingUp,
  Award,
  Flame,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface AthleteProfile {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  role: string
  createdAt: Date
  lastLoginAt: Date

  // Athletic Profile
  primarySport?: string
  secondarySports?: string[]
  skillLevel?: string
  trainingGoals?: string
  achievements?: string
  learningStyle?: string
  availability?: any[]
  specialNotes?: string

  // Assignment
  coachId?: string
  assignedCoachId?: string

  // Progress
  lessonsCompleted?: number
  currentStreak?: number
  totalVideosSubmitted?: number
}

interface CoachInfo {
  uid: string
  displayName: string
  email: string
}

interface LessonProgress {
  lessonId: string
  lessonTitle: string
  completedAt: Date
  status: string
}

export default function AdminAthleteProfileView() {
  const params = useParams()
  const uid = params.uid as string
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [coach, setCoach] = useState<CoachInfo | null>(null)
  const [lessons, setLessons] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (uid) {
      loadAthleteData()
    }
  }, [uid])

  const loadAthleteData = async () => {
    try {
      setLoading(true)

      // Load athlete user document
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (!userDoc.exists()) {
        console.error('User not found')
        return
      }

      const userData = userDoc.data()
      const athleteData: AthleteProfile = {
        uid: userDoc.id,
        email: userData.email || '',
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || '',
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        primarySport: userData.primarySport,
        secondarySports: userData.secondarySports || [],
        skillLevel: userData.skillLevel,
        trainingGoals: userData.trainingGoals,
        achievements: userData.achievements,
        learningStyle: userData.learningStyle,
        availability: userData.availability || [],
        specialNotes: userData.specialNotes,
        coachId: userData.coachId || userData.assignedCoachId,
        assignedCoachId: userData.assignedCoachId || userData.coachId,
        lessonsCompleted: userData.lessonsCompleted || 0,
        currentStreak: userData.currentStreak || 0,
        totalVideosSubmitted: userData.totalVideosSubmitted || 0
      }

      setAthlete(athleteData)

      // Load coach info
      const coachUid = athleteData.coachId || athleteData.assignedCoachId
      if (coachUid) {
        const coachDoc = await getDoc(doc(db, 'users', coachUid))
        if (coachDoc.exists()) {
          const coachData = coachDoc.data()
          setCoach({
            uid: coachDoc.id,
            displayName: coachData.displayName || coachData.email || 'Unknown Coach',
            email: coachData.email || ''
          })
        }
      }

      // Load lesson progress
      const progressQuery = query(
        collection(db, 'lesson_progress'),
        where('athleteId', '==', uid),
        orderBy('completedAt', 'desc')
      )
      const progressSnapshot = await getDocs(progressQuery)
      const progressData: LessonProgress[] = []
      progressSnapshot.forEach(doc => {
        const data = doc.data()
        progressData.push({
          lessonId: data.lessonId || '',
          lessonTitle: data.lessonTitle || 'Untitled Lesson',
          completedAt: data.completedAt?.toDate() || new Date(),
          status: data.status || 'completed'
        })
      })
      setLessons(progressData)

    } catch (error) {
      console.error('Error loading athlete data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading athlete profile...</p>
        </div>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <p style={{ color: '#000000' }}>Athlete not found</p>
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
              <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#91A6EB' }}>
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: '#000000' }}>
                  {athlete.displayName || `${athlete.firstName} ${athlete.lastName}`}
                </h1>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                  <Mail className="w-4 h-4" />
                  <span>{athlete.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1" style={{ color: '#000000', opacity: 0.7 }}>
                  <Calendar className="w-4 h-4" />
                  <span>Joined {athlete.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#91A6EB', color: 'white' }}>
                Athlete
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
                <TrendingUp className="w-5 h-5" style={{ color: '#91A6EB' }} />
                Engagement Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: '#0284c7' }} />
                    <span className="text-sm font-medium">Lessons Completed</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#0284c7' }}>
                    {athlete.lessonsCompleted || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    <span className="text-sm font-medium">Current Streak</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                    {athlete.currentStreak || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#dcfce7' }}>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: '#16a34a' }} />
                    <span className="text-sm font-medium">Videos Submitted</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: '#16a34a' }}>
                    {athlete.totalVideosSubmitted || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fce7f3' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: '#be123c' }} />
                    <span className="text-sm font-medium">Last Active</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#be123c' }}>
                    {athlete.lastLoginAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Coach */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Star className="w-5 h-5" style={{ color: '#20B2AA' }} />
                Assigned Coach
              </h2>
              {coach ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f0fdfa' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#20B2AA' }}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#000000' }}>{coach.displayName}</div>
                      <div className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>{coach.email}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm" style={{ color: '#991b1b' }}>No coach assigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Athletic Profile */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Trophy className="w-5 h-5" style={{ color: '#91A6EB' }} />
                Athletic Profile
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>PRIMARY SPORT</label>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                    <span className="font-medium">{athlete.primarySport || 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>SKILL LEVEL</label>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                    <span className="font-medium capitalize">{athlete.skillLevel || 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>LEARNING STYLE</label>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                    <span className="font-medium capitalize">{athlete.learningStyle || 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>SECONDARY SPORTS</label>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                    <span className="font-medium">
                      {athlete.secondarySports && athlete.secondarySports.length > 0
                        ? athlete.secondarySports.join(', ')
                        : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>TRAINING GOALS</label>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                    <p className="text-sm">{athlete.trainingGoals || 'No goals specified'}</p>
                  </div>
                </div>

                {athlete.achievements && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>ACHIEVEMENTS</label>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="text-sm">{athlete.achievements}</p>
                    </div>
                  </div>
                )}

                {athlete.specialNotes && (
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#000000', opacity: 0.6 }}>SPECIAL NOTES</label>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
                      <p className="text-sm">{athlete.specialNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            {athlete.availability && athlete.availability.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                  <Calendar className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                  Training Availability
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {athlete.availability.map((slot: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg border" style={{ backgroundColor: '#f5f3ff', borderColor: '#8B5CF6' }}>
                      <div className="font-semibold capitalize text-sm mb-1">{slot.day}</div>
                      <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>{slot.timeSlots || 'Flexible'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Lesson Progress */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Award className="w-5 h-5" style={{ color: '#FF6B35' }} />
                Recent Lesson Progress
              </h2>
              {lessons.length > 0 ? (
                <div className="space-y-2">
                  {lessons.slice(0, 10).map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#f8fafc' }}>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium text-sm">{lesson.lessonTitle}</div>
                          <div className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                            Completed {lesson.completedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                        {lesson.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>No lessons completed yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
