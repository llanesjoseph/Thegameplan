'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Star, Trophy, Target, Users, LucideIcon, Shield, CheckCircle } from 'lucide-react'
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
      tagline: 'Elite Performance Training - The Intersection of Intellect and Intensity',
      heroImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
      badges: ['National Player of the Year', 'Stanford Cardinal', 'U-20 World Cup'],
      lessonCount: 15,
      specialties: ['Tactical IQ', 'Mental Training', 'Leadership', 'Technical Skills'],
      experience: 'college',
      verified: true,
      featured: true,
      credentials: 'Stanford University • U-20 World Cup • Gatorade National Player of the Year',
      philosophy: {
        title: 'The Field is a Chessboard',
        description: 'Every drill, every sprint, every decision has a purpose. I teach you to see the game three steps ahead—to anticipate, adapt, and execute with precision. It\'s not just about physical skill; it\'s about cultivating a superior soccer IQ that translates into decisive action when it matters most.',
        points: [
          {
            icon: Target,
            title: 'Tactical IQ Acceleration',
            description: 'Learn to read the game, identify spaces, and make split-second decisions that break down defenses.'
          },
          {
            icon: Users,
            title: 'Student-Athlete Blueprint',
            description: 'Master time management, study habits, and mental wellness to excel in both academics and athletics.'
          },
          {
            icon: Trophy,
            title: 'Elite Technical Mastery',
            description: 'Refine your first touch, passing range, and ball control through purposeful, high-intensity drills.'
          }
        ]
      },
      sampleQuestions: [
        "How do I improve my tactical awareness?",
        "What mental training techniques work best?",
        "How to balance academics and athletics?",
        "Best drills for first touch improvement?"
      ]
    }
    // Future creators can be added here
  }

  return creators[creatorId] || creators['jasmine-aikey'] // Fallback to Jasmine if creator not found
}

interface CreatorPageProps {
  params: {
    creatorId: string
  }
}


export default function CreatorPage({ params }: CreatorPageProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [disclaimerChecking, setDisclaimerChecking] = useState(true)
  const [disclaimerInfo, setDisclaimerInfo] = useState<any>(null)
  const { user, loading: authLoading } = useAuth()

  // Format AI responses with Claude-style markdown and typography
  const formatAIResponse = (content: string): string => {
    return content
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-clarity-text-primary">$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Convert bullet points to properly formatted lists
      .replace(/^• (.+)$/gm, '<li class="mb-2 pl-2">$1</li>')
      .replace(/^- (.+)$/gm, '<li class="mb-2 pl-2">$1</li>')
      // Convert numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<li class="mb-2 pl-2 list-decimal">$2</li>')
      // Wrap consecutive list items in <ul> or <ol>
      .replace(/(<li class="mb-2 pl-2">.*?<\/li>\s*)+/gs, '<ul class="list-disc pl-6 mb-4 space-y-1">$&</ul>')
      .replace(/(<li class="mb-2 pl-2 list-decimal">.*?<\/li>\s*)+/gs, '<ol class="list-decimal pl-6 mb-4 space-y-1">$&</ol>')
      // Convert line breaks to proper spacing
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br class="mb-2">')
      // Wrap in paragraph tags
      .replace(/^(.+)/, '<p class="mb-4">$1')
      .replace(/(.+)$/, '$1</p>')
      // Fix any double paragraph tags
      .replace(/<\/p><p class="mb-4"><p class="mb-4">/g, '</p><p class="mb-4">')
      .replace(/<\/p><\/p>$/g, '</p>')
      // Style quotes
      .replace(/"([^"]+)"/g, '<span class="italic text-clarity-accent">"$1"</span>')
      // Clean up any malformed tags
      .replace(/<li class="mb-2 pl-2( list-decimal)?"><\/li>/g, '')
  }

  useEffect(() => {
    // Extract creatorId from params - this makes it dynamic for any creator
    const creatorId = params.creatorId || 'jasmine-aikey'
    const creatorData = getCreatorData(creatorId)
    setCreator(creatorData)
  }, [params.creatorId])

  // Check disclaimer acceptance status when user is available
  useEffect(() => {
    const checkDisclaimerStatus = async () => {
      if (user?.uid) {
        setDisclaimerChecking(true)
        try {
          const hasAccepted = await DisclaimerTracker.hasAcceptedDisclaimer(user.uid)
          setDisclaimerAccepted(hasAccepted)

          if (hasAccepted) {
            const info = await DisclaimerTracker.getAcceptanceInfo(user.uid)
            setDisclaimerInfo(info)
          }
        } catch (error) {
          console.warn('Error checking disclaimer status:', error)
        } finally {
          setDisclaimerChecking(false)
        }
      } else {
        setDisclaimerChecking(false)
        setDisclaimerAccepted(false)
        setDisclaimerInfo(null)
      }
    }

    checkDisclaimerStatus()
  }, [user?.uid])

  const handleAskCreator = async () => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to sign in or show sign in modal
      window.location.href = '/dashboard'
      return
    }

    // Show disclaimer if not accepted yet
    if (!disclaimerAccepted) {
      setShowDisclaimer(true)
      return
    }

    if (!message.trim()) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          sport: creator?.sport || 'soccer',
          creatorId: creator?.id, // Primary identifier for context resolution
          creatorName: creator?.firstName || creator?.name,
          userId: user.uid,
          userEmail: user.email || 'unknown@example.com',
          sessionId: null, // Will be created by the API if not provided
          context: `${creator?.id}-${creator?.sport}-training`,
          specialty: `${creator?.sport}-${creator?.specialties?.join('-').toLowerCase()}-training`,
          creatorSport: creator?.sport
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      // Add assistant response to chat
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisclaimerAccept = async () => {
    if (user?.uid && user?.email) {
      try {
        await DisclaimerTracker.recordAcceptance(user.uid, user.email)
        setDisclaimerAccepted(true)
        setShowDisclaimer(false)

        // Get the updated disclaimer info for display
        const info = await DisclaimerTracker.getAcceptanceInfo(user.uid)
        setDisclaimerInfo(info)
      } catch (error) {
        console.error('Error recording disclaimer acceptance:', error)
        // Still allow them to continue for UX
        setDisclaimerAccepted(true)
        setShowDisclaimer(false)
      }
    }
  }

  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false)
  }

  if (!creator) {
    return <div className="min-h-screen bg-clarity-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-clarity-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-clarity-text-secondary">Loading creator...</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-clarity-background">
      {/* Header */}
      <header className="bg-clarity-surface border-b border-clarity-text-secondary/10">
        <div className="page-container py-4">
          <Link href="/contributors" className="inline-flex items-center gap-2 text-clarity-text-secondary hover:text-clarity-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Contributors
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-bg section-padding">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="accent-label">Featured Contributor</span>
                </div>
                <div className="px-3 py-1 bg-clarity-accent text-white text-xs font-semibold rounded-full">
                  Verified
                </div>
              </div>

              <h1 className="main-headline mb-4">{creator.name}</h1>
              <p className="text-xl font-semibold text-clarity-accent mb-4">{creator.credentials}</p>
              <p className="paragraph-text mb-6">
                {creator.tagline}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-clarity-accent">{creator.lessonCount || 0}</div>
                  <div className="text-sm text-clarity-text-secondary">Training Programs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-clarity-accent">{creator.specialties?.length || 0}</div>
                  <div className="text-sm text-clarity-text-secondary">Specialties</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-clarity-accent">1000+</div>
                  <div className="text-sm text-clarity-text-secondary">Athletes Trained</div>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-8">
                {creator.specialties?.map((specialty) => (
                  <span key={specialty} className="px-3 py-1 bg-clarity-surface border border-clarity-text-secondary/20 rounded-full text-sm font-medium">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={creator.headshotUrl || creator.heroImageUrl || '/logo-gp.svg'}
                  alt={creator.name}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ask Creator Section */}
      <section className="section-padding bg-clarity-surface">
        <div className="page-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-accent/10 border border-clarity-accent/20 rounded-full text-clarity-accent text-sm font-semibold mb-4">
                <MessageCircle className="w-4 h-4" />
                AI-Powered Coaching
              </div>

              {/* Disclaimer Status Indicator */}
              {user && disclaimerAccepted && !disclaimerChecking && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-4">
                  <CheckCircle className="w-3 h-3" />
                  Terms Accepted {disclaimerInfo?.acceptedAt && (
                    <span className="text-green-600">
                      • {new Date(disclaimerInfo.acceptedAt.toDate()).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {user && !disclaimerAccepted && !disclaimerChecking && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-medium mb-4">
                  <Shield className="w-3 h-3" />
                  Terms Required
                </div>
              )}

              <h2 className="section-headline mb-4">Ask {creator.firstName || creator.name}</h2>
              <p className="paragraph-text">
                Get personalized {creator.sport} training insights, tactical advice, and mental performance tips
                from {creator.firstName || creator.name}'s expertise. Ask about technique, game strategy, or athletic development.
              </p>
            </div>

            {/* Chat Interface */}
            <div className="content-card max-w-5xl mx-auto">
              {/* Messages */}
              {messages.length > 0 && (
                <div className="mb-8 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-clarity-accent text-white p-4 rounded-2xl rounded-br-md shadow-sm'
                          : 'bg-white text-clarity-text-primary border border-gray-100 shadow-sm rounded-2xl rounded-bl-md'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="p-6">
                            <div
                              className="prose prose-sm max-w-none text-clarity-text-primary leading-relaxed"
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
                      <div className="bg-white text-clarity-text-primary border border-gray-100 shadow-sm rounded-2xl rounded-bl-md p-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-sm text-gray-500 ml-2">Jasmine is thinking...</span>
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

      {/* Philosophy Section */}
      <section className="section-padding hero-bg">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-headline mb-6">Training Philosophy</h2>
            <p className="accent-label mb-4">{creator.philosophy?.title}</p>
            <p className="paragraph-text mb-8">
              {creator.philosophy?.description}
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {creator.philosophy?.points?.map((point, index) => {
                const IconComponent = point.icon
                return (
                  <div key={index} className="content-card text-center">
                    <div className="w-12 h-12 bg-clarity-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-clarity-accent" />
                    </div>
                    <h3 className="card-title mb-3">{point.title}</h3>
                    <p className="text-clarity-text-secondary">
                      {point.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show if user is not logged in */}
      {!user && (
        <section className="section-padding bg-clarity-surface">
          <div className="page-container">
            <div className="max-w-4xl mx-auto text-center bg-clarity-accent text-white p-12 rounded-2xl shadow-2xl">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Train with {creator.firstName || creator.name}?</h3>
              <p className="text-xl mb-8 opacity-90">
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