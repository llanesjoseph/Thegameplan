'use client'
import { useState, useRef, useEffect } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import {
  Users,
  BookOpen,
  Plus,
  Mail,
  Video,
  FileText,
  BarChart3,
  Bell,
  UserCog,
  User,
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

export default function CoachDashboard() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const coachCards = [
    {
      id: 'athletes',
      title: 'My Athletes',
      description: 'Manage your athletes and track progress',
      icon: Users,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'lessons',
      title: 'Lesson Library',
      description: 'View and manage your lessons',
      icon: BookOpen,
      color: '#20B2AA',
      inline: true
    },
    {
      id: 'create-lesson',
      title: 'Create Lesson',
      description: 'Build new training content',
      icon: Plus,
      color: '#FF6B35',
      inline: true
    },
    {
      id: 'invite',
      title: 'Invite Athletes',
      description: 'Send invitations to new athletes',
      icon: Mail,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'videos',
      title: 'Video Manager',
      description: 'Manage your training videos',
      icon: Video,
      color: '#20B2AA',
      inline: true
    },
    {
      id: 'resources',
      title: 'Resource Library',
      description: 'PDFs, links, and training materials',
      icon: FileText,
      color: '#FF6B35',
      inline: true
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track engagement and performance',
      icon: BarChart3,
      color: '#20B2AA',
      inline: true
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Broadcast updates to athletes',
      icon: Bell,
      color: '#91A6EB',
      inline: true
    },
    {
      id: 'assistants',
      title: 'Assistant Coaches',
      description: 'Manage coaching staff permissions',
      icon: UserCog,
      color: '#000000',
      inline: true
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Manage your coaching profile',
      icon: User,
      color: '#FF6B35',
      inline: true
    }
  ]

  const getSectionPath = (sectionId: string) => {
    const pathMap: Record<string, string> = {
      'athletes': '/dashboard/coach/athletes?embedded=true',
      'lessons': '/dashboard/coach/lessons/library?embedded=true',
      'create-lesson': '/dashboard/coach/lessons/create?embedded=true',
      'invite': '/dashboard/coach/invite?embedded=true',
      'videos': '/dashboard/coach/videos?embedded=true',
      'resources': '/dashboard/coach/resources?embedded=true',
      'analytics': '/dashboard/coach/analytics?embedded=true',
      'announcements': '/dashboard/coach/announcements?embedded=true',
      'assistants': '/dashboard/coach/assistants?embedded=true',
      'profile': '/dashboard/coach/profile?embedded=true'
    }
    return pathMap[sectionId]
  }

  const renderInlineContent = () => {
    if (!activeSection) return null

    const activeCard = coachCards.find(card => card.id === activeSection)
    const title = activeCard?.title || 'Section'

    const sectionPath = getSectionPath(activeSection)
    if (sectionPath) {
      return <DynamicIframe src={sectionPath} title={title} />
    }

    return null
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Coach Dashboard" subtitle="Manage your athletes and training content" />

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
            Coach Tools
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
      </main>
    </div>
  )
}
