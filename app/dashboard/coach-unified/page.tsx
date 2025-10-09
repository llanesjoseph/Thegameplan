'use client'

import { useState, useRef, useEffect } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import {
  Users,
  BookOpen,
  Video,
  FileText,
  BarChart3,
  UserPlus,
  Settings,
  Bell,
  UserCog,
  GraduationCap,
  X
} from 'lucide-react'

// Responsive iframe component with dynamic height based on content
function DynamicIframe({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<string>('60vh')

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const measureHeight = () => {
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDocument) {
          const contentHeight = iframeDocument.documentElement.scrollHeight
          const maxHeight = window.innerHeight * 0.6 // 60% of viewport
          const calculatedHeight = Math.min(contentHeight + 40, maxHeight)
          setHeight(`${calculatedHeight}px`)
        }
      } catch (e) {
        // Cross-origin or access denied - fallback to 60vh
        setHeight('60vh')
      }
    }

    // Multiple measurement attempts for reliability
    iframe.addEventListener('load', () => {
      setTimeout(measureHeight, 100)
      setTimeout(measureHeight, 300)
      setTimeout(measureHeight, 500)
      setTimeout(measureHeight, 1000)
    })

    return () => {
      iframe.removeEventListener('load', measureHeight)
    }
  }, [src])

  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-full" style={{
      height,
      maxHeight: '60vh',
      transition: 'height 0.3s ease'
    }}>
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full border-0"
        title={title}
      />
    </div>
  )
}

export default function CoachUnifiedDashboard() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const coachCards = [
    {
      id: 'athletes',
      title: 'My Athletes',
      description: 'View and manage your athletes',
      icon: Users,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'create-lesson',
      title: 'Create Lesson',
      description: 'Build comprehensive training lessons',
      icon: GraduationCap,
      color: '#20B2AA',
      inline: true
    },
    {
      id: 'lesson-library',
      title: 'Lesson Library',
      description: 'View and edit all your lessons',
      icon: BookOpen,
      color: '#000000',
      inline: true
    },
    {
      id: 'videos',
      title: 'Video Manager',
      description: 'Organize and embed training videos',
      icon: Video,
      color: '#FF6B35',
      inline: true
    },
    {
      id: 'resources',
      title: 'Resource Library',
      description: 'PDFs, links, and training materials',
      icon: FileText,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track engagement and progress',
      icon: BarChart3,
      color: '#20B2AA',
      inline: true
    },
    {
      id: 'invite',
      title: 'Invite Athletes',
      description: 'Send bulk invitations to athletes',
      icon: UserPlus,
      color: '#000000',
      inline: true
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Edit your coach profile',
      icon: Settings,
      color: '#FF6B35',
      inline: true
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Send updates to all athletes',
      icon: Bell,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'assistants',
      title: 'Assistant Coaches',
      description: 'Manage coaching staff',
      icon: UserCog,
      color: '#20B2AA',
      inline: true
    }
  ]

  const getSectionPath = (sectionId: string) => {
    const pathMap: Record<string, string> = {
      'athletes': '/dashboard/coach/athletes?embedded=true',
      'create-lesson': '/dashboard/coach/lessons/create?embedded=true',
      'lesson-library': '/dashboard/coach/lessons/library?embedded=true',
      'videos': '/dashboard/coach/videos?embedded=true',
      'resources': '/dashboard/coach/resources?embedded=true',
      'analytics': '/dashboard/coach/analytics?embedded=true',
      'invite': '/dashboard/coach/invite?embedded=true',
      'profile': '/dashboard/coach/profile?embedded=true',
      'announcements': '/dashboard/coach/announcements?embedded=true',
      'assistants': '/dashboard/coach/assistants?embedded=true'
    }
    return pathMap[sectionId]
  }

  const renderInlineContent = () => {
    if (!activeSection) return null

    const activeCard = coachCards.find(card => card.id === activeSection)
    const title = activeCard?.title || 'Section'

    // All sections load via iframe for now
    const sectionPath = getSectionPath(activeSection)
    if (sectionPath) {
      return <DynamicIframe src={sectionPath} title={title} />
    }

    return (
      <div className="p-6 text-center">
        <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
          {title}
        </h3>
        <p style={{ color: '#000000', opacity: 0.6 }}>
          This section is under construction. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Coach Dashboard" subtitle="Empower your athletes with expert training" />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Inline Content Display */}
        {activeSection && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
            <button
              onClick={() => setActiveSection(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-50 shadow-lg"
              title="Close"
            >
              <X className="w-5 h-5" style={{ color: '#000000' }} />
            </button>
            {renderInlineContent()}
          </div>
        )}

        {/* Coach Tools Grid */}
        <div>
          <h2 className="text-xl sm:text-2xl font-heading mb-4 sm:mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
            Coaching Tools
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {coachCards.map((card, index) => {
              const Icon = card.icon
              const isActive = activeSection === card.id

              return (
                <button
                  key={index}
                  onClick={() => setActiveSection(card.id)}
                  className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
                >
                  <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-white/50 p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
                    <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                      {/* Icon */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
                        style={{ backgroundColor: card.color }}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xs sm:text-sm font-heading mb-1 line-clamp-2" style={{ color: '#000000' }}>
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[10px] sm:text-xs flex-grow line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Welcome Section (when no card is active) */}
        {!activeSection && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 sm:p-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-heading mb-4" style={{ color: '#000000' }}>
                Welcome, Coach {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
              </h2>
              <p className="text-base sm:text-lg mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                Your unified coaching dashboard gives you everything you need to create exceptional training experiences for your athletes.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-4 border-2" style={{ borderColor: '#91A6EB' }}>
                  <GraduationCap className="w-8 h-8 mb-2" style={{ color: '#91A6EB' }} />
                  <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Create Lessons</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Build comprehensive training lessons with videos, drills, and resources
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-4 border-2" style={{ borderColor: '#20B2AA' }}>
                  <Video className="w-8 h-8 mb-2" style={{ color: '#20B2AA' }} />
                  <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Manage Videos</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Embed videos from YouTube, Vimeo, or upload directly
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-4 border-2" style={{ borderColor: '#FF6B35' }}>
                  <Users className="w-8 h-8 mb-2" style={{ color: '#FF6B35' }} />
                  <h3 className="font-heading mb-1" style={{ color: '#000000' }}>Track Athletes</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Monitor progress, completion rates, and engagement
                  </p>
                </div>

                <div className="bg-gradient-to-br from-black/10 to-black/5 rounded-lg p-4 border-2 border-black/20">
                  <BarChart3 className="w-8 h-8 mb-2" style={{ color: '#000000' }} />
                  <h3 className="font-heading mb-1" style={{ color: '#000000' }}>View Analytics</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Get insights on lesson popularity and athlete activity
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-blue to-teal rounded-lg p-4 text-white">
                <h3 className="font-heading mb-2 text-lg">🎯 Quick Start Guide</h3>
                <ol className="space-y-2 text-sm">
                  <li><strong>1.</strong> Click "Create Lesson" to build your first training lesson</li>
                  <li><strong>2.</strong> Use "Video Manager" to organize your training footage</li>
                  <li><strong>3.</strong> Go to "My Athletes" to see who's enrolled</li>
                  <li><strong>4.</strong> Check "Analytics" to track engagement and progress</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
