'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Send, X, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Creator {
  id: string
  name: string
  firstName: string
  sport: string
  tagline: string
  heroImageUrl: string
  headshotUrl: string
  credentials: string
  description: string
  actionPhotos: string[]
  highlightVideo?: string
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  trainingLibrary: Array<{
    id: string
    title: string
    status: 'Ended' | 'In Progress' | 'Upcoming'
    thumbnail: string
  }>
}

// This should be fetched from the database in a real app
const getCreatorData = (creatorId: string): Creator | null => {
  const creators: Record<string, Creator> = {
    'jasmine-aikey': {
      id: 'jasmine-aikey',
      name: 'JASMINE AIKEY',
      firstName: 'Jasmine',
      sport: 'Soccer',
      tagline: 'Elite soccer player at Stanford University.',
      credentials: 'PAC-12 Champion and Midfielder of the Year',
      description: 'I can answer questions about my athletic journey, techniques and mental preparation.',
      heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
      headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
      actionPhotos: [
        'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop'
      ],
      highlightVideo: 'https://www.youtube.com/embed/ZA0DyEOeG6I?start=58',
      socialLinks: {
        facebook: 'https://facebook.com/jasmineaikey',
        twitter: 'https://twitter.com/jasmineaikey',
        instagram: 'https://instagram.com/jasmineaikey',
        linkedin: 'https://linkedin.com/in/jasmineaikey'
      },
      trainingLibrary: [
        {
          id: '1',
          title: 'Footwork and Passing in Soccer',
          status: 'Ended',
          thumbnail: '/api/placeholder/120/80'
        },
        {
          id: '2',
          title: 'Soccer Drills for Beginners',
          status: 'Ended',
          thumbnail: '/api/placeholder/120/80'
        }
      ]
    }
  }

  return creators[creatorId] || creators['jasmine-aikey'] // Default to Jasmine if creator not found
}

interface CreatorPageClientProps {
  creatorId: string
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'creator'
  timestamp: Date
}

export default function CreatorPageClient({ creatorId }: CreatorPageClientProps) {
  const { user } = useAuth()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const creatorData = getCreatorData(creatorId)
    setCreator(creatorData)
  }, [creatorId])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user || !creator) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentMessage,
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
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          sender: 'creator',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        sender: 'creator',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Coach Not Found</h1>
          <Link href="/contributors" className="text-blue-600 hover:underline">
            Back to Coaches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold tracking-wider">
            PLAYBOOKD
          </div>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <Link href="/dashboard" className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium">
              SIGN IN
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-900 text-white">
        {/* Top Section with Name and Credentials */}
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {creator.name}
          </h1>
          <p className="text-lg mb-2">{creator.tagline}</p>
          <p className="text-lg">{creator.credentials}</p>

          {/* Profile Picture */}
          <div className="mt-8 flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
              <Image
                src={creator.headshotUrl}
                alt={creator.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Action Photos Section */}
        <div className="relative">
          <div className="grid grid-cols-2 h-64 md:h-80">
            {creator.actionPhotos.map((photo, index) => (
              <div key={index} className="relative overflow-hidden">
                <Image
                  src={photo}
                  alt={`${creator.firstName} action photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-black/50 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Quote */}
              <div className="text-white">
                <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed">
                  Playing soccer with your feet is one thing, but playing soccer with your heart is another.
                </blockquote>

                {/* Social Links */}
                <div className="flex gap-4 mt-6">
                  {creator.socialLinks.facebook && (
                    <a href={creator.socialLinks.facebook} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                      <Facebook className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {creator.socialLinks.twitter && (
                    <a href={creator.socialLinks.twitter} className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition">
                      <Twitter className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {creator.socialLinks.linkedin && (
                    <a href={creator.socialLinks.linkedin} className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition">
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {creator.socialLinks.instagram && (
                    <a href={creator.socialLinks.instagram} className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition">
                      <Instagram className="w-5 h-5 text-white" />
                    </a>
                  )}
                </div>
              </div>

              {/* Right Side - Highlight Video */}
              {creator.highlightVideo && (
                <div className="relative">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={creator.highlightVideo}
                      title={`${creator.firstName} Highlights`}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="bg-blue-900 text-white px-3 py-1 rounded text-sm font-medium">
                      HIGHLIGHTS
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ask Me About Soccer Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Ask Me About {creator.sport}
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {creator.description}
              </p>
              <button
                onClick={() => setShowAIChat(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Ask {creator.firstName}
              </button>
            </div>

            {/* Right Side - Large Action Photo */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-red-600">
                <Image
                  src={creator.actionPhotos[0]}
                  alt={`${creator.firstName} in action`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Library Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">
            {creator.firstName}'s Training Library
          </h2>

          <div className="space-y-6">
            {creator.trainingLibrary.map((item) => (
              <div key={item.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
                {/* Thumbnail */}
                <div className="w-20 h-14 bg-gray-300 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={80}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'Ended'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-end gap-4">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={creator.headshotUrl}
                    alt={creator.firstName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ask {creator.firstName}</h3>
                  <p className="text-sm text-gray-500">{creator.sport} Coach</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Start a conversation with {creator.firstName}</p>
                  <p className="text-sm text-gray-400">Ask about techniques, training, or anything soccer-related!</p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                  {message.sender === 'creator' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={creator.headshotUrl}
                        alt={creator.firstName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={creator.headshotUrl}
                      alt={creator.firstName}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Ask ${creator.firstName} anything about ${creator.sport.toLowerCase()}...`}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {!user && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  <Link href="/dashboard" className="text-blue-500 hover:underline">Sign in</Link> to start asking questions
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}