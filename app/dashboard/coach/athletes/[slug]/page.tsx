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
  Sparkles
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

interface AnalyticsData {
  totalLessons: number
  completedLessons: number
  completionRate: number
  lastActivity: string | null
  aiQuestionsAsked: number
  averageEngagement: number
  sessionRequestsPending: number
  sessionRequestsCompleted: number
  totalMessages: number
  messagesLastWeek: number
  contentByType: {
    lessons: number
    videos: number
    articles: number
  }
  engagementTrend: 'up' | 'down' | 'stable'
  weeklyActivity: number[]
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
  const [aiChatSummary, setAiChatSummary] = useState<string>('')
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (slug && user) {
      loadAthleteDetails()
      loadAIChatSummary()
    }
  }, [slug, user])

  const loadAthleteDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // SECURITY: Use slug-based API to prevent ID exposure
      const response = await fetch(`/api/secure-athlete/${slug}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Athlete not found')
        return
      }

      const athleteProfile = result.data
      setAthlete(athleteProfile)

      // Load analytics data
      await loadAnalytics(athleteProfile.uid)

    } catch (error) {
      console.error('Error loading athlete details:', error)
      setError('Failed to load athlete details')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async (athleteId: string) => {
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`/api/coach/athletes/${athleteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const loadAIChatSummary = async () => {
    try {
      if (!athlete?.uid) return

      const token = await user!.getIdToken()
      const response = await fetch(`/api/coach/athletes/${athlete.uid}/ai-chat-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAiChatSummary(data.summary || 'No recent AI interactions.')
      }
    } catch (error) {
      console.error('Error loading AI chat summary:', error)
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
        await loadAIChatSummary()
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

        {/* Analytics Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lessons</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.totalLessons}
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
                </div>
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {analytics.totalMessages}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>
            AI Chat Summary
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700">{aiChatSummary}</p>
          </div>
          
          {/* Message Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Send a message to this athlete..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
