'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
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
  X,
  UserCheck,
  ChevronDown
} from 'lucide-react'

export default function CoachUnifiedDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(false)

  // Role-based redirect - prevent admins from accessing coach dashboard
  useEffect(() => {
    if (!user?.uid) return

    const checkRoleAndRedirect = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const role = userDoc.data()?.role

          // Redirect admins to admin dashboard
          if (role === 'admin' || role === 'superadmin') {
            console.log('🛡️ Admin detected on coach page - redirecting to admin dashboard')
            router.replace('/dashboard/admin')
          }
          // Redirect athletes to their dashboard
          else if (role === 'athlete') {
            console.log('🏃 Athlete detected on coach page - redirecting to progress dashboard')
            router.replace('/dashboard/progress')
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
      }
    }

    checkRoleAndRedirect()
  }, [user?.uid, router])

  // Show welcome only once per session
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('coach-welcome-seen')
    if (!hasSeenWelcome) {
      setShowWelcome(true)
      sessionStorage.setItem('coach-welcome-seen', 'true')
    }
  }, [])

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
      id: 'recruit-coach',
      title: 'Recruit Fellow Coach',
      description: 'Invite other coaches to join',
      icon: UserCheck,
      color: '#20B2AA',
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
      'athletes': '/dashboard/coach/athletes',
      'create-lesson': '/dashboard/coach/lessons/create',
      'lesson-library': '/dashboard/coach/lessons/library',
      'videos': '/dashboard/coach/videos',
      'resources': '/dashboard/coach/resources',
      'analytics': '/dashboard/coach/analytics',
      'invite': '/dashboard/coach/invite',
      'recruit-coach': '/dashboard/coach/recruit',
      'profile': '/dashboard/profile',
      'announcements': '/dashboard/coach/announcements',
      'assistants': '/dashboard/coach/assistants'
    }
    return pathMap[sectionId]
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Coach Dashboard" subtitle="Empower your athletes with expert training" />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Coach Tools Grid */}
        <div>
          <h2 className="text-xl sm:text-2xl mb-4 sm:mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
            Coaching Tools
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {coachCards.map((card, index) => {
              const Icon = card.icon

              return (
                <button
                  key={index}
                  onClick={() => {
                    const path = getSectionPath(card.id)
                    if (path) {
                      router.push(path)
                    }
                  }}
                  className="block group cursor-pointer text-left transition-all w-full"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 border border-white/50">
                    <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                      <div className="flex items-start justify-between mb-2">
                        {/* Icon */}
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md"
                          style={{ backgroundColor: card.color }}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>

                        {/* Prominent Chevron Indicator */}
                        {card.inline && (
                          <div className="p-2 rounded-full bg-white/50 shadow-md">
                            <ChevronDown
                              className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300"
                              style={{ color: card.color, strokeWidth: 2.5 }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xs sm:text-sm mb-1 line-clamp-2 font-medium" style={{ color: '#000000' }}>
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

        {/* Welcome Section (only shown once per session) */}
        {showWelcome && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 sm:p-8 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close welcome message"
            >
              <X className="w-5 h-5" style={{ color: '#000000' }} />
            </button>
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl mb-4" style={{ color: '#000000' }}>
                Welcome, Coach {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
              </h2>
              <p className="text-base sm:text-lg mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                Your unified coaching dashboard gives you everything you need to create exceptional training experiences for your athletes.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-lg p-4 border-2" style={{ borderColor: '#91A6EB' }}>
                  <GraduationCap className="w-8 h-8 mb-2" style={{ color: '#91A6EB' }} />
                  <h3 className="mb-1" style={{ color: '#000000' }}>Create Lessons</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Build comprehensive training lessons with videos, drills, and resources
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-4 border-2" style={{ borderColor: '#20B2AA' }}>
                  <Video className="w-8 h-8 mb-2" style={{ color: '#20B2AA' }} />
                  <h3 className="mb-1" style={{ color: '#000000' }}>Manage Videos</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Embed videos from YouTube, Vimeo, or upload directly
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-4 border-2" style={{ borderColor: '#FF6B35' }}>
                  <Users className="w-8 h-8 mb-2" style={{ color: '#FF6B35' }} />
                  <h3 className="mb-1" style={{ color: '#000000' }}>Track Athletes</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Monitor progress, completion rates, and engagement
                  </p>
                </div>

                <div className="bg-gradient-to-br from-black/10 to-black/5 rounded-lg p-4 border-2 border-black/20">
                  <BarChart3 className="w-8 h-8 mb-2" style={{ color: '#000000' }} />
                  <h3 className="mb-1" style={{ color: '#000000' }}>View Analytics</h3>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Get insights on lesson popularity and athlete activity
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-sky-blue to-teal rounded-lg p-4 text-white">
                <h3 className="mb-2 text-lg">🎯 Quick Start Guide</h3>
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

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-bounce-slow {
          animation: bounceSlow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
