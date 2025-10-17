'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
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

interface AnalyticsData {
  totalLessons: number
  completedLessons: number
  completionRate: number
  lastActivity: string | null
  aiQuestionsAsked: number
  averageEngagement: number
  videoReviewsPending: number
  videoReviewsCompleted: number
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

interface Message {
  id: string
  content: string
  senderId: string
  recipientId: string
  createdAt: any
  read: boolean
}

interface AIChatSummary {
  totalConversations: number
  totalQuestions: number
  totalResponses: number
  avgQuestionsPerConversation: number
  lastActivity: string
  topTopics: Array<{ topic: string; count: number }>
  recentQuestions: string[]
  conversations: Array<{
    id: string
    title: string
    createdAt: string | null
    messageCount: number
    userQuestions: number
    aiResponses: number
    lastActivity: string | null
  }>
  engagementLevel: 'High' | 'Medium' | 'Low' | 'None'
}

export default function AthleteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const athleteId = params.id as string
  const embedded = searchParams.get('embedded') === 'true'

  const [athlete, setAthlete] = useState<AthleteDetails | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [aiChatSummary, setAiChatSummary] = useState<AIChatSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (athleteId && user) {
      loadAthleteDetails()
      loadAnalytics()
      loadMessages()
      loadAIChatSummary()
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

  const loadAnalytics = async () => {
    try {
      // Check athlete_feed for completion data
      const feedDoc = await getDoc(doc(db, 'athlete_feed', athleteId))
      const feedData = feedDoc.exists() ? feedDoc.data() : null

      // Check AI sessions for engagement
      let aiSessionsSnap: any = { docs: [], size: 0 }
      try {
        const aiSessionsQuery = query(
          collection(db, 'ai_sessions'),
          where('userId', '==', athleteId),
          orderBy('createdAt', 'desc'),
          limit(50)
        )
        aiSessionsSnap = await getDocs(aiSessionsQuery)
      } catch (error) {
        console.warn('Could not fetch AI sessions:', error)
      }

      // Check chat conversations for AI questions
      let totalQuestions = 0
      try {
        const chatQuery = query(
          collection(db, 'chatConversations'),
          where('userId', '==', athleteId)
        )
        const chatSnap = await getDocs(chatQuery)
        for (const chatDoc of chatSnap.docs) {
          const messagesQuery = query(
            collection(db, 'chatConversations', chatDoc.id, 'messages'),
            where('role', '==', 'user')
          )
          const messagesSnap = await getDocs(messagesQuery)
          totalQuestions += messagesSnap.size
        }
      } catch (error) {
        console.warn('Could not fetch chat conversations:', error)
      }

      // Check video review requests
      const videoReviewsQuery = query(
        collection(db, 'videoReviews'),
        where('athleteId', '==', athleteId)
      )
      const videoReviewsSnap = await getDocs(videoReviewsQuery)
      const videoReviewsPending = videoReviewsSnap.docs.filter(doc => doc.data().status === 'pending').length
      const videoReviewsCompleted = videoReviewsSnap.docs.filter(doc => doc.data().status === 'completed' || doc.data().status === 'reviewed').length

      // Check session requests
      const sessionRequestsQuery = query(
        collection(db, 'liveSessionRequests'),
        where('athleteId', '==', athleteId)
      )
      const sessionRequestsSnap = await getDocs(sessionRequestsQuery)
      const sessionRequestsPending = sessionRequestsSnap.docs.filter(doc => doc.data().status === 'pending').length
      const sessionRequestsCompleted = sessionRequestsSnap.docs.filter(doc => doc.data().status === 'accepted' || doc.data().status === 'completed').length

      // Check messages
      let totalMessages = 0
      let messagesLastWeek = 0
      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('participants', 'array-contains', athleteId)
        )
        const messagesSnap = await getDocs(messagesQuery)
        totalMessages = messagesSnap.size

        // Messages in last week
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const recentMessagesQuery = query(
          collection(db, 'messages'),
          where('participants', 'array-contains', athleteId),
          where('createdAt', '>=', oneWeekAgo)
        )
        const recentMessagesSnap = await getDocs(recentMessagesQuery)
        messagesLastWeek = recentMessagesSnap.size
      } catch (error) {
        console.warn('Could not fetch messages:', error)
      }

      // Content engagement by type
      const contentByType = {
        lessons: feedData?.completedLessons?.filter((l: any) => l.type === 'lesson' || !l.type).length || 0,
        videos: feedData?.completedLessons?.filter((l: any) => l.type === 'video').length || 0,
        articles: feedData?.completedLessons?.filter((l: any) => l.type === 'article').length || 0
      }

      // Weekly activity trend (last 7 days)
      const weeklyActivity: number[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setDate(dayStart.getDate() - i)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)

        const dayActivityQuery = query(
          collection(db, 'ai_sessions'),
          where('userId', '==', athleteId),
          where('createdAt', '>=', dayStart),
          where('createdAt', '<=', dayEnd)
        )
        const dayActivitySnap = await getDocs(dayActivityQuery)
        weeklyActivity.push(dayActivitySnap.size)
      }

      // Calculate engagement trend
      const firstHalf = weeklyActivity.slice(0, 3).reduce((a, b) => a + b, 0)
      const secondHalf = weeklyActivity.slice(4, 7).reduce((a, b) => a + b, 0)
      const engagementTrend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable'

      const completedLessons = feedData?.completedLessons?.length || 0
      const totalLessons = feedData?.assignedLessons?.length || 0
      const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      setAnalytics({
        totalLessons,
        completedLessons,
        completionRate: Math.round(completionRate),
        lastActivity: feedData?.lastActivity || aiSessionsSnap.docs[0]?.data()?.createdAt || null,
        aiQuestionsAsked: totalQuestions,
        averageEngagement: aiSessionsSnap.size > 0 ? Math.min(100, aiSessionsSnap.size * 5) : 0,
        videoReviewsPending,
        videoReviewsCompleted,
        sessionRequestsPending,
        sessionRequestsCompleted,
        totalMessages,
        messagesLastWeek,
        contentByType,
        engagementTrend,
        weeklyActivity
      })
    } catch (err) {
      console.error('Error loading analytics:', err)
    }
  }

  const loadMessages = async () => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', athleteId),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const messagesSnap = await getDocs(messagesQuery)
      const messagesList = messagesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message))
      setMessages(messagesList)
    } catch (err) {
      console.warn('Could not load messages (permissions or collection not found):', err)
      setMessages([]) // Set empty array on error
    }
  }

  const loadAIChatSummary = async () => {
    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/coach/athletes/${athleteId}/ai-chat-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.summary) {
          setAiChatSummary(data.summary)
        }
      }
    } catch (err) {
      console.warn('Could not load AI chat summary:', err)
      setAiChatSummary(null)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return

    try {
      setSending(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: athleteId,
          content: messageText.trim()
        })
      })

      if (response.ok) {
        setMessageText('')
        setShowMessageModal(false)
        loadMessages() // Reload messages
        alert('✅ Message sent successfully!')
      } else {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert('❌ Failed to send message. Please try again.')
    } finally {
      setSending(false)
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
      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>
                Send Message to {athlete.displayName}
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recent Messages */}
            {messages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Recent Conversation</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {messages.map((msg) => {
                    const isSentByMe = msg.senderId === user?.uid
                    return (
                      <div key={msg.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          isSentByMe ? 'bg-black text-white' : 'bg-white border border-gray-200'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isSentByMe ? 'text-gray-300' : 'text-gray-500'}`}>
                            {msg.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent"
              rows={6}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Main Content */}
      <div className={`${embedded ? 'px-4 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {/* Analytics Dashboard */}
        {analytics && (
          <>
            {/* Primary Metrics - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Lessons */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold" style={{ color: '#000000' }}>
                    {analytics.totalLessons}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Lessons</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.completedLessons} completed
                </p>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold" style={{ color: '#000000' }}>
                    {analytics.completionRate}%
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${analytics.completionRate}%` }}
                  />
                </div>
              </div>

              {/* AI Engagement */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-purple-600" />
                  <span className="text-3xl font-bold" style={{ color: '#000000' }}>
                    {analytics.aiQuestionsAsked}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">AI Questions</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.averageEngagement}% engagement
                </p>
              </div>

              {/* Engagement Trend */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className={`w-8 h-8 ${
                    analytics.engagementTrend === 'up' ? 'text-green-600' :
                    analytics.engagementTrend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    analytics.engagementTrend === 'up' ? 'bg-green-100 text-green-800' :
                    analytics.engagementTrend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {analytics.engagementTrend === 'up' ? '↑ Increasing' :
                     analytics.engagementTrend === 'down' ? '↓ Decreasing' : '→ Stable'}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Engagement Trend</h3>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </div>
            </div>

            {/* Secondary Metrics - 6 columns for more detail */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {/* Video Reviews Pending */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{analytics.videoReviewsPending}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">Videos Pending</p>
              </div>

              {/* Video Reviews Completed */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{analytics.videoReviewsCompleted}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">Videos Reviewed</p>
              </div>

              {/* Session Requests Pending */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">{analytics.sessionRequestsPending}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">Sessions Pending</p>
              </div>

              {/* Session Requests Completed */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{analytics.sessionRequestsCompleted}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">Sessions Done</p>
              </div>

              {/* Total Messages */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">{analytics.totalMessages}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">Total Messages</p>
              </div>

              {/* Messages This Week */}
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-8 h-8 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600">{analytics.messagesLastWeek}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">This Week</p>
              </div>
            </div>

            {/* Content Breakdown & Weekly Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Content Type Breakdown */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Content by Type
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Lessons</span>
                      <span className="text-sm font-bold text-blue-600">{analytics.contentByType.lessons}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles) > 0
                              ? (analytics.contentByType.lessons / (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles)) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Videos</span>
                      <span className="text-sm font-bold text-purple-600">{analytics.contentByType.videos}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles) > 0
                              ? (analytics.contentByType.videos / (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles)) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Articles</span>
                      <span className="text-sm font-bold text-green-600">{analytics.contentByType.articles}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles) > 0
                              ? (analytics.contentByType.articles / (analytics.contentByType.lessons + analytics.contentByType.videos + analytics.contentByType.articles)) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Activity Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Weekly Activity
                </h3>
                <div className="flex items-end justify-between h-32 gap-2">
                  {analytics.weeklyActivity.map((count, index) => {
                    const maxActivity = Math.max(...analytics.weeklyActivity, 1)
                    const heightPercent = (count / maxActivity) * 100
                    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                    const today = new Date().getDay()
                    const dayIndex = (today - 6 + index + 7) % 7

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="relative w-full bg-gray-200 rounded-t-lg" style={{ height: '100%' }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                            style={{ height: `${heightPercent}%` }}
                            title={`${count} activities`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{dayLabels[dayIndex]}</span>
                        <span className="text-xs font-bold text-gray-900">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* AI Chat Summary Section */}
        {aiChatSummary && aiChatSummary.totalConversations > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg border border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>AI Chat Summary</h2>
                    <p className="text-sm text-gray-600">What {athlete.displayName} has been asking the AI</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${
                  aiChatSummary.engagementLevel === 'High' ? 'bg-green-100 text-green-800' :
                  aiChatSummary.engagementLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  aiChatSummary.engagementLevel === 'Low' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {aiChatSummary.engagementLevel} Engagement
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{aiChatSummary.totalConversations}</div>
                  <div className="text-xs font-medium text-gray-600">Conversations</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{aiChatSummary.totalQuestions}</div>
                  <div className="text-xs font-medium text-gray-600">Questions Asked</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">{aiChatSummary.avgQuestionsPerConversation}</div>
                  <div className="text-xs font-medium text-gray-600">Avg per Chat</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm font-bold text-gray-800 mb-1">{aiChatSummary.lastActivity}</div>
                  <div className="text-xs font-medium text-gray-600">Last Activity</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Topics */}
                {aiChatSummary.topTopics.length > 0 && (
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Top Discussion Topics
                    </h3>
                    <div className="space-y-3">
                      {aiChatSummary.topTopics.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-purple-100 text-purple-700' :
                              idx === 1 ? 'bg-blue-100 text-blue-700' :
                              idx === 2 ? 'bg-indigo-100 text-indigo-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              #{idx + 1}
                            </div>
                            <span className="font-medium text-gray-800">{topic.topic}</span>
                          </div>
                          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {topic.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Questions */}
                {aiChatSummary.recentQuestions.length > 0 && (
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      Recent Questions
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {aiChatSummary.recentQuestions.slice(0, 5).map((question, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 line-clamp-2">{question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
            {athlete.availability && Array.isArray(athlete.availability) && athlete.availability.length > 0 && (
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
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                <button
                  onClick={() => router.push(`/dashboard/coach/lesson-library?assignTo=${athleteId}`)}
                  className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Assign Lesson
                </button>
                <button
                  onClick={() => router.push(`/dashboard/coach/analytics?athlete=${athleteId}`)}
                  className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Full Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
