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
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading athlete profile...</p>
        </div>
      </div>
    )
  }

  if (error || !athlete) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
              <User className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#000000' }}>
              Athlete Not Found
            </h2>
            <p className="mb-6" style={{ color: '#666' }}>
              {error || 'The athlete you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/coach/athletes')}
                className="px-6 py-3 rounded-lg text-white transition-colors"
                style={{ backgroundColor: '#91A6EB' }}
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
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      {!embedded && <AppHeader title="Athlete Profile" subtitle="View athlete details and progress" />}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        {!embedded && (
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Athletes
            </button>
          </div>
        )}

        {/* Athlete Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {athlete.profileImageUrl ? (
                <img
                  src={athlete.profileImageUrl}
                  alt={athlete.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>

            {/* Athlete Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                {athlete.displayName}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {athlete.email}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {athlete.sport}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {athlete.level}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  athlete.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {athlete.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Coaching Dashboard */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: '#000000' }}>
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Comprehensive Coaching Dashboard
          </h2>
          <p className="text-gray-600">Track athlete progress, engagement, and performance metrics</p>
        </div>

        {/* Analytics Grid */}
        {analyticsError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{analyticsError}</p>
            </div>
          </div>
        )}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lessons</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.totalLessons}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.completedLessons} completed
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.completionRate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.engagementTrend === 'up' ? '📈 Growing' : analytics.engagementTrend === 'down' ? '📉 Declining' : '➡️ Stable'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Questions</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.aiQuestionsAsked}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.aiQuestionsAsked > 20 ? 'High engagement' : analytics.aiQuestionsAsked > 10 ? 'Moderate' : 'Getting started'}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Direct Messages</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.totalMessages}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coach ↔ Athlete
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Video Submissions</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.videoSubmissions || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.pendingReviews || 0} pending review
                  </p>
                </div>
                <Video className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Session Requests</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.sessionRequestsPending + analytics.sessionRequestsCompleted}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.sessionRequestsPending} pending
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Active</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.daysSinceLastActive !== null
                      ? analytics.daysSinceLastActive === 0
                        ? 'Today'
                        : `${analytics.daysSinceLastActive}d`
                      : 'Never'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Member for {analytics.daysSinceJoined || 0} days
                  </p>
                </div>
                <Activity className="w-8 h-8 text-teal-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {Math.round(analytics.averageEngagement)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.averageEngagement > 75 ? '⭐ Excellent' : analytics.averageEngagement > 50 ? '👍 Good' : '💪 Needs boost'}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Chat Summary
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700">{aiChatSummary}</p>
          </div>

          {/* Messaging Status Warning */}
          {analytics && analytics.messagingEnabled === false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Messaging Disabled</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This athlete has not enabled messaging yet. They need to enable it in their settings before you can send direct messages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={analytics?.messagingEnabled === false ? "Messaging disabled - athlete must enable in settings" : "Send a message to this athlete..."}
              disabled={analytics?.messagingEnabled === false}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage || !messageText.trim() || analytics?.messagingEnabled === false}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  )
}
