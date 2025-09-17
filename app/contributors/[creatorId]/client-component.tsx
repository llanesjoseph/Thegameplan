'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Star, Trophy, Target, Users, LucideIcon, Shield, CheckCircle, Play, BookOpen, Eye, Calendar, UserPlus, Heart, Settings, Package } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import AILegalDisclaimer from '@/components/AILegalDisclaimer'
import DisclaimerTracker from '@/lib/disclaimer-tracking'

interface PhilosophyPoint {
  icon: LucideIcon
  title: string
  description: string
}

interface Creator {
  id: string
  name: string
  firstName: string
  sport: string
  tagline: string
  heroImageUrl: string
  headshotUrl: string
  badges: string[]
  lessonCount: number
  specialties: string[]
  experience: string
  verified: boolean
  featured: boolean
  credentials: string
  philosophy: {
    title: string
    description: string
    points: PhilosophyPoint[]
  }
  sampleQuestions: string[]
}

// This should be fetched from the database in a real app
const getCreatorData = (creatorId: string): Creator | null => {
  // In a real app, this would fetch from Firestore based on creatorId
  // For now, we support multiple creators but return Jasmine's data as default

  const creators: Record<string, Creator> = {
    'jasmine-aikey': {
      id: 'jasmine-aikey',
      name: 'Jasmine Aikey',
      firstName: 'Jasmine',
      sport: 'soccer',
      tagline: 'Elevating the mental game of soccer through tactical intelligence and confidence building',
      heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
      headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
      badges: ['Professional Player', 'Mental Performance Coach', 'Tactical Expert'],
      lessonCount: 12,
      specialties: ['Mental Conditioning', 'Tactical Awareness', 'Confidence Building', 'Game Intelligence'],
      experience: '10+ years professional soccer experience with focus on mental performance and tactical development',
      verified: true,
      featured: true,
      credentials: 'Former Professional Player, Certified Mental Performance Coach',
      philosophy: {
        title: 'Excellence Through Mental Mastery',
        description: 'Soccer is 90% mental. I help players unlock their potential by developing unshakeable confidence, tactical intelligence, and the mental resilience needed to perform under pressure.',
        points: [
          {
            icon: Target,
            title: 'Tactical Intelligence',
            description: 'Master the mental side of the game through improved decision-making and field awareness'
          },
          {
            icon: Trophy,
            title: 'Confidence Building',
            description: 'Develop unshakeable self-belief that translates to fearless play on the field'
          },
          {
            icon: Users,
            title: 'Team Leadership',
            description: 'Learn to elevate not just your game, but inspire and lead your teammates to excellence'
          }
        ]
      },
      sampleQuestions: [
        "How do I stay confident after making mistakes during a game?",
        "What's the best way to read the game and make quick decisions?",
        "How can I help my team stay focused under pressure?",
        "What mental exercises help with penalty kick situations?"
      ]
    }
  }

  return creators[creatorId] || creators['jasmine-aikey'] // Default to Jasmine if creator not found
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'creator'
  timestamp: Date
}

interface Lesson {
  id: string
  title: string
  description: string
  creatorUid: string
  sport: string
  status: string
  type: string
  level?: string
  views?: number
  videoUrl?: string
  thumbnail?: string
  createdAt: any
}

const formatAIResponse = (content: string): string => {
  // Clean and format AI response content
  let formatted = content
    // Remove any HTML tags and problematic class strings
    .replace(/<[^>]*>/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/font-semibold text-emerald-600/g, '')
    .replace(/italic text-slate-600/g, '')
    .replace(/ml-\d+ mb-\d+/g, '')
    .replace(/space-y-\d+ my-\d+ ml-\d+/g, '')
    .replace(/mb-\d+ leading-relaxed/g, '')

    // Convert **bold** to simple bold formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Convert quotes to simple emphasis
    .replace(/"([^"]+)"/g, '<em>"$1"</em>')

  // Split into paragraphs
  const paragraphs = formatted.split(/\n\s*\n/).filter(p => p.trim())

  return paragraphs.map(paragraph => {
    // Handle bullet points
    if (paragraph.includes('\n- ') || paragraph.includes('\n* ') || paragraph.includes('\n• ')) {
      const lines = paragraph.split('\n')
      let result = ''
      let inList = false

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.match(/^[\-\*\•]\s+/)) {
          if (!inList) {
            result += '<ul>'
            inList = true
          }
          result += `<li>${trimmed.substring(2)}</li>`
        } else if (trimmed) {
          if (inList) {
            result += '</ul>'
            inList = false
          }
          result += `<p>${trimmed}</p>`
        }
      }
      if (inList) result += '</ul>'
      return result
    } else {
      return `<p>${paragraph}</p>`
    }
  }).join('')
}

interface CreatorPageClientProps {
  creatorId: string
}

export default function CreatorPageClient({ creatorId }: CreatorPageClientProps) {
  const creator = useMemo(() => getCreatorData(creatorId), [creatorId])
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(true)

  // Check disclaimer acceptance on component mount
  useEffect(() => {
    const checkDisclaimer = async () => {
      if (user?.uid) {
        const hasAccepted = await DisclaimerTracker.hasAcceptedDisclaimer(user.uid)
        if (!hasAccepted) {
          setShowDisclaimer(true)
        }
      }
    }

    checkDisclaimer()
  }, [user])

  // Fetch creator's lessons
  useEffect(() => {
    const fetchCreatorLessons = async () => {
      if (!creator) return

      try {
        setLessonsLoading(true)

        // For demo purposes, we'll simulate lessons without Firebase query
        // In production, this would query the actual database
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading

        // Mock lessons data for demo
        const mockLessons: Lesson[] = [
          {
            id: '1',
            title: 'Mental Toughness in High-Pressure Situations',
            description: 'Learn how to maintain composure and confidence during crucial moments in your soccer career.',
            creatorUid: 'jasmine-aikey-uid',
            sport: 'soccer',
            status: 'published',
            type: 'lesson',
            level: 'Intermediate',
            views: 234,
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'Reading the Game: Tactical Intelligence',
            description: 'Develop your ability to anticipate plays and make split-second decisions on the field.',
            creatorUid: 'jasmine-aikey-uid',
            sport: 'soccer',
            status: 'published',
            type: 'lesson',
            level: 'Advanced',
            views: 189,
            createdAt: new Date()
          },
          {
            id: '3',
            title: 'Building Unshakeable Confidence',
            description: 'Master the mental techniques that separate good players from great ones.',
            creatorUid: 'jasmine-aikey-uid',
            sport: 'soccer',
            status: 'published',
            type: 'lesson',
            level: 'Beginner',
            views: 167,
            createdAt: new Date()
          }
        ]

        setLessons(mockLessons)
      } catch (error) {
        console.error('Error fetching creator lessons:', error)
        // Set empty array on error
        setLessons([])
      } finally {
        setLessonsLoading(false)
      }
    }

    fetchCreatorLessons()
  }, [creator])

  if (!creator) {
    return (
      <div className="min-h-screen bg-clarity-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <p className="text-clarity-text-secondary mb-6">
            The contributor you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            href="/contributors"
            className="btn-primary"
          >
            View All Contributors
          </Link>
        </div>
      </div>
    )
  }

  const handleAskCreator = async () => {
    if (!user) {
      alert('Please sign in to ask questions')
      return
    }

    if (!message.trim()) return

    // Check disclaimer before proceeding
    const hasAccepted = await DisclaimerTracker.hasAcceptedDisclaimer(user.uid)
    if (!hasAccepted) {
      setShowDisclaimer(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          creatorId: creator.id,
          userId: user.uid,
          userEmail: user.email
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const creatorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'creator',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, creatorMessage])
      } else {
        console.error('API Error:', data)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.error || 'Sorry, I encountered an error. Please try again.',
          sender: 'creator',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Network error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'creator',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisclaimerAccept = async () => {
    if (user?.email) {
      await DisclaimerTracker.recordAcceptance(user.uid, user.email)
      setShowDisclaimer(false)
      // Retry the AI coaching request
      if (message.trim()) {
        handleAskCreator()
      }
    }
  }

  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false)
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-clarity-surface">
      {/* Sign-up Banner for Non-authenticated Users */}
      {!user && (
        <div className="bg-clarity-accent text-white py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <span className="font-medium">
                  Join {creator.firstName}'s coaching community • Free AI training sessions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="bg-white text-clarity-accent px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/dashboard"
                  className="text-white/90 hover:text-white font-medium text-sm transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[400px] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src={creator.heroImageUrl}
            alt={`${creator.name} - Hero Image`}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-between py-8">
          {/* Back Button */}
          <Link
            href="/contributors"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit hover:bg-black/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">All Contributors</span>
          </Link>

          {/* Hero Content */}
          <div className="flex items-end gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <Image
                  src={creator.headshotUrl}
                  alt={creator.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
              {creator.verified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-clarity-accent rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{creator.name}</h1>
                {creator.featured && (
                  <div className="bg-clarity-accent px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-white">Featured</span>
                  </div>
                )}
              </div>

              <p className="text-lg md:text-xl text-white/90 mb-4 max-w-3xl leading-relaxed">
                {creator.tagline}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {creator.badges.map((badge) => (
                  <div
                    key={badge}
                    className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30"
                  >
                    <span className="text-sm font-medium text-white">{badge}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium capitalize">{creator.sport} Expert</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{creator.lessonCount} Lessons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions / Connections Section for Signed-in Users */}
      {user && (
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Link
                  href={`/lessons?coach=${creator.id}`}
                  className="group bg-gray-50 hover:bg-clarity-accent/5 border border-gray-200 hover:border-clarity-accent/20 rounded-xl p-3 sm:p-4 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clarity-accent/10 group-hover:bg-clarity-accent/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-clarity-accent" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Lessons</div>
                      <div className="text-xs text-gray-600 truncate">{lessons.length} available</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/requests"
                  className="group bg-gray-50 hover:bg-clarity-accent/5 border border-gray-200 hover:border-clarity-accent/20 rounded-xl p-3 sm:p-4 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clarity-accent/10 group-hover:bg-clarity-accent/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-clarity-accent" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Support</div>
                      <div className="text-xs text-gray-600 truncate">Get help</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/gear?creator=${creator.id}`}
                  className="group bg-gray-50 hover:bg-clarity-accent/5 border border-gray-200 hover:border-clarity-accent/20 rounded-xl p-3 sm:p-4 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clarity-accent/10 group-hover:bg-clarity-accent/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-clarity-accent" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Gear</div>
                      <div className="text-xs text-gray-600 truncate">{creator.firstName}'s gear</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="group bg-gray-50 hover:bg-clarity-accent/5 border border-gray-200 hover:border-clarity-accent/20 rounded-xl p-3 sm:p-4 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clarity-accent/10 group-hover:bg-clarity-accent/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-clarity-accent" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Dashboard</div>
                      <div className="text-xs text-gray-600 truncate">Your profile</div>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    // Add to favorites functionality
                    console.log('Adding to favorites...')
                  }}
                  className="group bg-gray-50 hover:bg-clarity-accent/5 border border-gray-200 hover:border-clarity-accent/20 rounded-xl p-3 sm:p-4 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clarity-accent/10 group-hover:bg-clarity-accent/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-clarity-accent" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">Follow</div>
                      <div className="text-xs text-gray-600 truncate">Stay updated</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Coaching Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-clarity-accent/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-clarity-accent" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ask {creator.firstName}</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get personalized coaching insights from {creator.firstName}. Ask about {creator.sport} technique,
                mental preparation, tactical decisions, or anything related to your development as an athlete.
              </p>
              {!user && (
                <div className="mt-6 p-6 bg-gradient-to-br from-clarity-accent/5 to-clarity-accent/10 border border-clarity-accent/20 rounded-xl">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Start Your Training Journey with {creator.firstName}
                    </h3>
                    <p className="text-clarity-text-secondary mb-4">
                      Join thousands of athletes improving their game with personalized AI coaching
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/dashboard"
                        className="bg-clarity-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-clarity-accent/90 transition-colors shadow-lg"
                      >
                        Sign Up Free
                      </Link>
                      <Link
                        href="/dashboard"
                        className="border-2 border-clarity-accent text-clarity-accent px-6 py-3 rounded-xl font-semibold hover:bg-clarity-accent/5 transition-colors"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Interface */}
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              {/* Messages */}
              {messages.length > 0 && (
                <div className="space-y-6 mb-8 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] lg:max-w-[75%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        {msg.sender === 'creator' && (
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={creator.headshotUrl}
                                alt={creator.firstName}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-sm font-medium text-clarity-text-primary">{creator.firstName}</span>
                          </div>
                        )}
                        {msg.sender === 'user' ? (
                          <div className="bg-clarity-accent text-white rounded-2xl rounded-br-md p-5 shadow-sm">
                            <p className="text-base leading-relaxed" style={{ lineHeight: '1.6' }}>{msg.content}</p>
                          </div>
                        ) : (
                          <div className="bg-white text-clarity-text-primary border border-gray-100 shadow-sm rounded-2xl rounded-bl-md p-6">
                            <div
                              className="ai-response-content"
                              style={{
                                lineHeight: '1.7',
                                fontSize: '16px'
                              }}
                              dangerouslySetInnerHTML={{
                                __html: formatAIResponse(msg.content)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] lg:max-w-[75%]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={creator.headshotUrl}
                              alt={creator.firstName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-clarity-text-primary">{creator.firstName}</span>
                        </div>
                        <div className="bg-white text-clarity-text-primary border border-gray-100 shadow-sm rounded-2xl rounded-bl-md p-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-sm text-gray-500">{creator.firstName} is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="border border-gray-200 rounded-2xl p-2 bg-white shadow-sm">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={user ? `Ask ${creator.firstName} about ${creator.sport} training, tactics, mental performance...` : 'Sign in to ask questions...'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!user || isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskCreator()}
                    className={`flex-1 px-4 py-4 bg-transparent text-base placeholder-gray-400 focus:outline-none ${!user ? 'text-gray-400' : 'text-clarity-text-primary'}`}
                  />
                  <button
                    onClick={handleAskCreator}
                    disabled={!user || isLoading || !message.trim()}
                    className="px-6 py-4 bg-clarity-accent text-white rounded-xl hover:bg-clarity-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sample Questions */}
              {messages.length === 0 && (
                <div className="mt-8">
                  <p className="text-sm font-medium text-clarity-text-secondary mb-4">💡 Try asking {creator.firstName}:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {creator.sampleQuestions?.map((question) => (
                      <button
                        key={question}
                        onClick={() => setMessage(question)}
                        disabled={!user}
                        className="text-left p-4 text-sm bg-gradient-to-br from-gray-50 to-white hover:from-clarity-accent/5 hover:to-clarity-accent/10 border border-gray-200 hover:border-clarity-accent/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-clarity-text-primary leading-relaxed">{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lessons Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{creator.firstName}'s Lessons</h2>
                <p className="text-lg text-gray-600">
                  Explore educational content from {creator.firstName}
                </p>
              </div>
              {lessons.length > 0 && (
                <Link
                  href={`/lessons?coach=${creator.id}`}
                  className="bg-clarity-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-clarity-accent/90 transition-colors"
                >
                  View All Lessons
                </Link>
              )}
            </div>

            {lessonsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lessons Yet</h3>
                <p className="text-gray-600 mb-4">
                  {creator.firstName} hasn't published any lessons yet. Check back soon for new content!
                </p>
                {!user ? (
                  <div className="bg-clarity-accent/10 border border-clarity-accent/20 rounded-lg p-4">
                    <p className="text-clarity-accent font-medium">
                      <Link href="/dashboard" className="hover:underline">
                        Sign up
                      </Link> to get notified when {creator.firstName} publishes new lessons
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.slice(0, 6).map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
                    {/* Lesson Preview */}
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      {lesson.videoUrl || lesson.thumbnail ? (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <Play className="w-12 h-12 text-clarity-accent group-hover:text-clarity-accent/80 transition-colors" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <BookOpen className="w-12 h-12 text-gray-500 mb-2" />
                          <span className="text-gray-500 text-sm">Text Content</span>
                        </div>
                      )}

                      {/* Level Badge */}
                      {lesson.level && (
                        <div className="absolute top-3 left-3 bg-clarity-accent/90 text-white px-2 py-1 rounded text-xs font-medium">
                          {lesson.level}
                        </div>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-clarity-accent transition-colors line-clamp-2">
                        {lesson.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {lesson.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Eye className="w-3 h-3" />
                          {lesson.views || 0} views
                        </div>
                        {user ? (
                          <Link
                            href={`/lesson/${lesson.id}`}
                            className="text-clarity-accent hover:text-clarity-accent/80 text-sm font-medium transition-colors"
                          >
                            View Lesson →
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard"
                            className="text-clarity-accent hover:text-clarity-accent/80 text-sm font-medium transition-colors"
                          >
                            Sign in to view →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lessons.length > 6 && (
              <div className="text-center mt-8">
                <Link
                  href={`/lessons?coach=${creator.id}`}
                  className="inline-flex items-center gap-2 text-clarity-accent hover:text-clarity-accent/80 font-medium transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  View all {lessons.length} lessons
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Training Philosophy</h2>
            <p className="text-xl font-semibold text-clarity-accent mb-4">{creator.philosophy?.title}</p>
            <p className="text-lg text-gray-600 mb-8">
              {creator.philosophy?.description}
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {creator.philosophy?.points?.map((point, index) => {
                const IconComponent = point.icon
                return (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <div className="w-12 h-12 bg-clarity-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-clarity-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{point.title}</h3>
                    <p className="text-clarity-text-secondary">
                      {point.description}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Creator Stats for Signed-in Users */}
            {user && (
              <div className="mt-12 bg-white border border-gray-200 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  {creator.firstName}'s Impact
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-clarity-accent mb-2">{lessons.length}</div>
                    <div className="text-sm text-gray-600">Published Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-clarity-accent mb-2">10+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-clarity-accent mb-2">1.2k+</div>
                    <div className="text-sm text-gray-600">Students Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-clarity-accent mb-2">4.9★</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/contributors"
                      className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      Explore Other Contributors
                    </Link>
                    <Link
                      href="/dashboard/requests"
                      className="inline-flex items-center justify-center gap-2 bg-clarity-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-clarity-accent/90 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Submit a Request
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Only show if user is not logged in */}
      {!user && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-clarity-accent text-white p-12 rounded-2xl shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Train with {creator.firstName || creator.name}?</h3>
              <p className="text-lg mb-8 opacity-90">
                Join the community of dedicated players committed to the highest standards.
                Access exclusive training content and personalized coaching insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="inline-block bg-white text-clarity-accent font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:bg-gray-100 transition-all duration-300">
                  Start Training
                </Link>
                <Link href="/contributors" className="inline-block border-2 border-white text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white hover:text-clarity-accent transition-all duration-300">
                  View All Contributors
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Legal Disclaimer Modal */}
      {showDisclaimer && (
        <AILegalDisclaimer
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
          userEmail={user?.email || undefined}
          showFullDisclaimer={true}
        />
      )}
    </div>
  )
}