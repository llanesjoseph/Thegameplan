'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import {
  TrendingUp,
  Calendar,
  Users,
  MessageCircle,
  Target,
  Award,
  PlayCircle,
  Settings,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const router = useRouter()

  // Redirect non-athletes
  useEffect(() => {
    if (!roleLoading && role && role !== 'athlete') {
      router.replace('/dashboard/creator')
    }
  }, [role, roleLoading, router])

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const dashboardCards = [
    {
      title: 'My Progress',
      description: 'Track your training journey and achievements',
      icon: TrendingUp,
      href: '#',
      color: '#91A6EB',
      comingSoon: true
    },
    {
      title: 'Browse Coaches',
      description: 'Find and connect with expert coaches',
      icon: Users,
      href: '/coaches',
      color: '#20B2AA'
    },
    {
      title: 'My Schedule',
      description: 'Manage your training sessions and availability',
      icon: Calendar,
      href: '/dashboard/schedule',
      color: '#FF6B35'
    },
    {
      title: 'Messages',
      description: 'Chat with your coaches and trainers',
      icon: MessageCircle,
      href: '#',
      color: '#91A6EB',
      comingSoon: true
    },
    {
      title: 'Training Videos',
      description: 'Access your personalized training content',
      icon: PlayCircle,
      href: '#',
      color: '#20B2AA',
      comingSoon: true
    },
    {
      title: 'Goals & Achievements',
      description: 'Set goals and celebrate your wins',
      icon: Award,
      href: '#',
      color: '#000000',
      comingSoon: true
    },
    {
      title: 'Performance Analytics',
      description: 'View detailed stats and insights',
      icon: BarChart3,
      href: '#',
      color: '#FF6B35',
      comingSoon: true
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account and preferences',
      icon: Settings,
      href: '/dashboard/profile',
      color: '#000000'
    }
  ]

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader />

      {/* Header Section */}
      <div className="text-center py-12 px-6">
        <h1 className="text-4xl mb-4 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
          Athlete Dashboard
        </h1>
        <p className="text-lg" style={{ color: '#000000' }}>
          Welcome back! Choose what you'd like to do today
        </p>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon
            const CardWrapper = card.comingSoon ? 'div' : Link

            return (
              <CardWrapper
                key={index}
                href={card.comingSoon ? '#' : card.href}
                className={`block ${!card.comingSoon && 'group cursor-pointer'}`}
              >
                <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all ${
                  !card.comingSoon && 'hover:shadow-2xl hover:scale-105'
                } ${card.comingSoon && 'opacity-60'}`}>
                  <div className="flex flex-col h-full">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: card.color }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
                      {card.description}
                    </p>

                    {/* Coming Soon Badge */}
                    {card.comingSoon && (
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    {/* Arrow Indicator for Active Links */}
                    {!card.comingSoon && (
                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: card.color }}>
                        <span>Open</span>
                        <span className="text-lg">→</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardWrapper>
            )
          })}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="text-3xl font-heading mb-2" style={{ color: '#000000' }}>0</div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Sessions</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="text-3xl font-heading mb-2" style={{ color: '#000000' }}>0</div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Hours Trained</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="text-3xl font-heading mb-2" style={{ color: '#000000' }}>0</div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Achievements Earned</p>
          </div>
        </div>
      </div>
    </div>
  )
}
