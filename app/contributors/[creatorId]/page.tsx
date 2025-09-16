'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Star, Trophy, Target, Users, LucideIcon } from 'lucide-react'

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
      headshotUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
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

  useEffect(() => {
    // Extract creatorId from params - this makes it dynamic for any creator
    const creatorId = params.creatorId || 'jasmine-aikey'
    const creatorData = getCreatorData(creatorId)
    setCreator(creatorData)
  }, [params.creatorId])

  const handleAskCreator = async () => {
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
          message: userMessage,
          context: `${creator?.id}-${creator?.sport}-training`,
          specialty: `${creator?.sport}-${creator?.specialties?.join('-').toLowerCase()}-training`,
          creatorName: creator?.firstName || creator?.name,
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
              <h2 className="section-headline mb-4">Ask {creator.firstName || creator.name}</h2>
              <p className="paragraph-text">
                Get personalized {creator.sport} training insights, tactical advice, and mental performance tips
                from {creator.firstName || creator.name}'s expertise. Ask about technique, game strategy, or athletic development.
              </p>
            </div>

            {/* Chat Interface */}
            <div className="content-card max-w-3xl mx-auto">
              {/* Messages */}
              {messages.length > 0 && (
                <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-clarity-accent text-white'
                          : 'bg-clarity-background text-clarity-text-primary border border-clarity-text-secondary/20'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-clarity-background text-clarity-text-primary border border-clarity-text-secondary/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-clarity-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Ask about ${creator.sport} training, tactics, mental performance...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskCreator()}
                  className="flex-1 px-4 py-3 border border-clarity-text-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-clarity-accent/30 focus:border-clarity-accent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleAskCreator}
                  disabled={isLoading || !message.trim()}
                  className="px-6 py-3 bg-clarity-accent text-white rounded-lg hover:bg-clarity-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Sample Questions */}
              {messages.length === 0 && (
                <div className="mt-6">
                  <p className="text-sm text-clarity-text-secondary mb-3">Try asking:</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {creator.sampleQuestions?.map((question) => (
                      <button
                        key={question}
                        onClick={() => setMessage(question)}
                        className="text-left p-3 text-sm bg-clarity-background hover:bg-clarity-accent/5 border border-clarity-text-secondary/20 rounded-lg transition-colors"
                      >
                        {question}
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

      {/* CTA Section */}
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
    </div>
  )
}