'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
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
  MessageCircle,
  Send,
  X,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
  Video
} from 'lucide-react'
import AthleteShowcaseCard from '@/components/athlete/AthleteShowcaseCard'
import AppHeader from '@/components/ui/AppHeader'

interface AnalyticsData {
  totalLessons: number
  completedLessons: number
  completionRate: number
  lastActivity: string | null
  daysSinceLastActive: number | null
  daysSinceJoined: number
  aiQuestionsAsked: number
  averageEngagement: number
  sessionRequestsPending: number
  sessionRequestsCompleted: number
  totalMessages: number
  messagesLastWeek: number
  videoSubmissions?: number
  pendingReviews?: number
  contentByType: {
    lessons: number
    videos: number
    articles: number
  }
  engagementTrend: 'up' | 'down' | 'stable'
  weeklyActivity: number[]
  messagingEnabled?: boolean
}

interface AthleteProfile {
  uid: string
  slug: string
  displayName: string
  email: string
  sport: string
  level: string
  coachId: string
  assignedCoachId: string
  profileImageUrl: string
  isActive: boolean
  createdAt: any
  lastUpdated: any
  location?: string
  bio?: string
  trainingGoals?: string
}

export default function SecureAthleteProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const slug = params.slug as string
  const embedded = searchParams.get('embedded') === 'true'

  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [aiChatSummary, setAiChatSummary] = useState<string>('')
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Helper function for navigation that handles embedded context
  const navigate = (path: string) => {
    if (embedded && typeof window !== 'undefined') {
      // If embedded in iframe, change the section in parent coach dashboard
      // Map paths to section IDs
      const pathToSection: Record<string, string> = {
        '/dashboard/coach/lessons/library': 'lesson-library',
        '/dashboard/coach/messages': 'messages',
        '/dashboard/coach/queue-bypass': 'video-queue',
        '/dashboard/coach/live-sessions': 'live-sessions'
      }
      const sectionId = pathToSection[path]
      if (sectionId) {
        window.parent.postMessage({ type: 'SET_SECTION', sectionId }, window.location.origin)
      }
    } else {
      // Normal navigation
      router.push(path)
    }
  }

  useEffect(() => {
    if (slug && user) {
      loadAthleteDetails()
    }
  }, [slug, user])

  const loadAthleteDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get auth token for secure API call
      const token = await user!.getIdToken()

      // SECURITY: Use slug-based API to prevent ID exposure
      const response = await fetch(`/api/secure-athlete/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Athlete not found')
        return
      }

      const athleteProfile = result.data
      setAthlete(athleteProfile)

      // Load analytics data and AI chat summary after athlete data is available
      await loadAnalytics(athleteProfile.uid)
      await loadAIChatSummary(athleteProfile.uid)

    } catch (error) {
      console.error('Error loading athlete details:', error)
      setError('Failed to load athlete details')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async (athleteId: string) => {
    try {
      setAnalyticsError(null)
      const token = await user!.getIdToken()
      const response = await fetch(`/api/coach/athletes/${athleteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.analytics) {
          setAnalytics(data.analytics)
        } else {
          // Set default analytics if none returned
          setAnalytics({
            totalLessons: 0,
            completedLessons: 0,
            completionRate: 0,
            lastActivity: null,
            daysSinceLastActive: null,
            daysSinceJoined: 0,
            aiQuestionsAsked: 0,
            averageEngagement: 0,
            sessionRequestsPending: 0,
            sessionRequestsCompleted: 0,
            totalMessages: 0,
            messagesLastWeek: 0,
            videoSubmissions: 0,
            pendingReviews: 0,
            contentByType: { lessons: 0, videos: 0, articles: 0 },
            engagementTrend: 'stable',
            weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
            messagingEnabled: false
          })
        }
      } else {
        setAnalyticsError('Unable to load analytics data')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalyticsError('Failed to load analytics')
    }
  }

  const loadAIChatSummary = async (athleteUid: string) => {
    try {
      if (!athleteUid) return

      const token = await user!.getIdToken()
      const response = await fetch(`/api/coach/athletes/${athleteUid}/ai-chat-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.summary?.verbalSummary) {
          setAiChatSummary(data.summary.verbalSummary)
        } else if (typeof data.summary === 'string') {
          setAiChatSummary(data.summary)
        } else {
          setAiChatSummary('No recent AI interactions.')
        }
      } else {
        setAiChatSummary('Unable to load AI chat summary.')
      }
    } catch (error) {
      console.error('Error loading AI chat summary:', error)
      setAiChatSummary('Error loading AI chat summary.')
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !athlete?.uid) return

    try {
      setSendingMessage(true)
      const token = await user!.getIdToken()
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: athlete.uid,
          content: messageText.trim()
        })
      })

      if (response.ok) {
        setMessageText('')
        // Reload AI chat summary
        if (athlete?.uid) {
          await loadAIChatSummary(athlete.uid)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Loading athlete profile...</p>
        </div>
      </div>
    )
  }

  if (error || !athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center">
            <div className="w-20 h-20 rounded-lg mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FEE' }}>
              <User className="w-10 h-10" style={{ color: '#FC0105' }} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Athlete Not Found
            </h2>
            <p className="mb-6" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              {error || 'The athlete you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/coach/athletes')}
                className="px-6 py-3 rounded-lg text-white transition-colors hover:bg-gray-800"
                style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                Back to Athletes
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {!embedded && <AppHeader title="Athlete Profile" subtitle="View athlete details and progress" />}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        {!embedded && (
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Athletes
            </button>
          </div>
        )}

        {/* Athlete Header */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-8">
            {/* Profile Image - Square */}
            <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-black">
              {athlete.profileImageUrl ? (
                <img
                  src={athlete.profileImageUrl}
                  alt={athlete.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>

            {/* Athlete Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {athlete.displayName}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{athlete.email}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">{athlete.sport}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  <Target className="w-4 h-4" />
                  <span className="text-sm">{athlete.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                    athlete.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`} style={{ fontFamily: '"Open Sans", sans-serif' }}>
                    {athlete.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Athlete Profile Details - marketing-style sample card based on client design */}
        <div className="mb-10">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
          >
            Athlete Profile
          </h2>
          <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            This read-only card mirrors how an athlete’s story, location, sport and goals can be
            showcased in a clean profile layout. It pulls live Athleap data only – all legacy Wix
            markup has been replaced with native components.
          </p>
          <AthleteShowcaseCard
            displayName={athlete.displayName}
            email={athlete.email}
            sport={athlete.sport}
            location={athlete.location}
            level={athlete.level}
            bio={athlete.bio}
            trainingGoals={athlete.trainingGoals}
            profileImageUrl={athlete.profileImageUrl}
          />
        </div>

        {/* Comprehensive Coaching Dashboard */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            <BarChart3 className="w-6 h-6" style={{ color: '#FC0105' }} />
            Athlete Metrics & Progress
          </h2>
          <p style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Track progress, engagement, and performance</p>
        </div>

        {/* Analytics Grid */}
        {analyticsError && (
          <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#FC0105' }} />
              <p className="text-sm font-semibold">{analyticsError}</p>
            </div>
          </div>
        )}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Lessons - Clickable */}
            <button
              onClick={() => navigate('/dashboard/coach/lessons/library')}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <BookOpen className="w-8 h-8" style={{ color: '#FC0105' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Total Lessons</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.totalLessons}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.completedLessons} completed
              </p>
            </button>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8" style={{ color: '#00A651' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Completion Rate</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.completionRate}%
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.engagementTrend === 'up' ? '↗ Growing' : analytics.engagementTrend === 'down' ? '↘ Declining' : '→ Stable'}
              </p>
            </div>

            {/* AI Questions */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <Brain className="w-8 h-8" style={{ color: '#9B59B6' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>AI Questions</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.aiQuestionsAsked}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.aiQuestionsAsked > 20 ? 'High engagement' : analytics.aiQuestionsAsked > 10 ? 'Moderate' : 'Getting started'}
              </p>
            </div>

            {/* Direct Messages - Clickable */}
            <button
              onClick={() => navigate('/dashboard/coach/messages')}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <MessageCircle className="w-8 h-8" style={{ color: '#FF9800' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Direct Messages</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.totalMessages}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Coach ↔ Athlete
              </p>
            </button>

            {/* Video Submissions - Clickable */}
            <button
              onClick={() => navigate('/dashboard/coach/queue-bypass')}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <Video className="w-8 h-8" style={{ color: '#FC0105' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Video Submissions</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.videoSubmissions || 0}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.pendingReviews || 0} pending review
              </p>
            </button>

            {/* Session Requests - Clickable */}
            <button
              onClick={() => navigate('/dashboard/coach/live-sessions')}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-8 h-8" style={{ color: '#3F51B5' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Session Requests</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.sessionRequestsPending + analytics.sessionRequestsCompleted}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.sessionRequestsPending} pending
              </p>
            </button>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-8 h-8" style={{ color: '#666' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Last Active</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.daysSinceLastActive !== null
                  ? analytics.daysSinceLastActive === 0
                    ? 'Today'
                    : `${analytics.daysSinceLastActive}d`
                  : 'Never'
                }
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Member for {analytics.daysSinceJoined || 0} days
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-8 h-8" style={{ color: '#FFC107' }} />
              </div>
              <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>Engagement Score</p>
              <p className="text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {Math.round(analytics.averageEngagement)}%
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {analytics.averageEngagement > 75 ? 'Excellent' : analytics.averageEngagement > 50 ? 'Good' : 'Needs boost'}
              </p>
            </div>
          </div>
        )}

        {/* AI Chat Summary */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            <Sparkles className="w-6 h-6" style={{ color: '#9B59B6' }} />
            AI Chat Summary
          </h3>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', lineHeight: '1.6' }}>{aiChatSummary}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
