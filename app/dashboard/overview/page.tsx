'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTrendingLesson, TrendingLesson } from '@/lib/trending-service'
import {
  Video,
  MessageCircle,
  BarChart3,
  TrendingUp,
  BookOpen,
  Users,
  PlayCircle,
  ArrowUpRight,
  CheckCircle,
  Eye,
  Heart,
  Clock,
  Flame
} from 'lucide-react'

const quickActions = {
  user: [
    {
      title: 'Browse Training',
      description: 'Explore athletic content',
      icon: BookOpen,
      href: '/lessons',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Request Coaching',
      description: 'Get personalized guidance',
      icon: MessageCircle,
      href: '/dashboard/coaching',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'My Progress',
      description: 'Track your athletic development',
      icon: TrendingUp,
      href: '/dashboard/progress',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ],
  creator: [
    {
      title: 'Create Training',
      description: 'Share your expertise',
      icon: Video,
      href: '/dashboard/creator',
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Athlete Requests',
      description: 'Help athletes improve',
      icon: MessageCircle,
      href: '/dashboard/creator/requests',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Analytics',
      description: 'View your coaching impact',
      icon: BarChart3,
      href: '/dashboard/creator/analytics',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ],
  assistant_coach: [
    {
      title: 'Manage Content',
      description: 'Help organize training materials',
      icon: BookOpen,
      href: '/dashboard/creator',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Support Athletes',
      description: 'Assist with athlete requests',
      icon: MessageCircle,
      href: '/dashboard/creator/requests',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Review Progress',
      description: 'Monitor coaching effectiveness',
      icon: BarChart3,
      href: '/dashboard/creator/analytics',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [trendingLesson, setTrendingLesson] = useState<TrendingLesson | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(true)

  // Fetch trending content
  useEffect(() => {
    const fetchTrending = async () => {
      console.log('🔍 Starting to fetch trending lesson...')
      setTrendingLoading(true)
      try {
        const trending = await getTrendingLesson()
        console.log('📊 Trending lesson result:', trending)
        setTrendingLesson(trending)
      } catch (error) {
        console.error('❌ Error fetching trending lesson:', error)
      } finally {
        setTrendingLoading(false)
        console.log('✅ Trending fetch completed')
      }
    }

    if (user) {
      fetchTrending()
    } else {
      console.log('👤 No user found, skipping trending fetch')
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clarity-accent mx-auto"></div>
          <p className="mt-2 text-clarity-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2 text-clarity-text-primary">Sign In Required</h1>
          <p className="text-clarity-text-secondary mb-4">Please sign in to access your dashboard.</p>
          <Link href="/dashboard" className="clarity-btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const actions = quickActions[role as keyof typeof quickActions] || quickActions.user

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user.displayName || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your {role === 'creator' ? 'coaching' : role === 'assistant_coach' ? 'assistant coaching' : 'athletic development'} overview
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-card hover:shadow-card-md transition hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${action.iconBg}`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>


      {/* Recent Activity & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-card">
            <div className="text-center py-8">
              <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No recent activity yet</p>
              <p className="text-sm text-gray-500">
                {role === 'creator'
                  ? 'Start coaching to see your activity here'
                  : role === 'assistant_coach'
                  ? 'Begin assisting with content to see your activity here'
                  : 'Begin training to track your progress here'
                }
              </p>
              <div className="mt-4">
                <Link
                  href={role === 'creator' ? '/dashboard/creator' : '/lessons'}
                  className="inline-flex items-center gap-2 text-cardinal hover:text-cardinal-dark text-sm font-medium"
                >
                  {role === 'creator' ? 'Start Coaching' : 'Browse Training'}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended</h2>
          <div className="space-y-4">
            {/* Trending Now Section */}
            <div className="bg-gradient-to-r from-orange-600 via-red-500 to-red-700 rounded-lg p-6 text-white relative overflow-hidden shadow-lg">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-yellow-400 drop-shadow-sm" />
                  <h3 className="font-bold text-lg">Trending Now</h3>
                  <div className="px-2 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold tracking-wide shadow-sm">LIVE</div>
                </div>

                {/* Always show trending content - simplified for debugging */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg leading-tight">
                    {trendingLesson ? trendingLesson.title : 'Building Our Community'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-white/90">
                    {trendingLesson ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{trendingLesson.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{trendingLesson.likes}</span>
                        </div>
                        <div className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                          {trendingLesson.sport}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Growing Daily</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>Multi-Sport</span>
                        </div>
                        <div className="px-2 py-1 bg-white/20 rounded text-xs font-medium animate-pulse">
                          LAUNCHING
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-white/80 text-sm">
                    {trendingLesson
                      ? `Most interactive lesson across all sports - join ${trendingLesson.views} others!`
                      : 'Be among the first to experience our cross-sport training platform. Help us discover what\'s trending!'
                    }
                  </p>
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={trendingLesson ? `/lesson/${trendingLesson.id}` : '/lessons'}
                    className="inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/35 transition-colors flex-1 justify-center"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {trendingLesson ? 'Watch Now' : 'Explore Training'}
                  </Link>
                  <Link
                    href={trendingLesson ? '/lessons?filter=trending' : '/dashboard/creator'}
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/25 transition-colors"
                  >
                    {trendingLesson ? <TrendingUp className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    {trendingLesson ? 'More' : 'Create'}
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Connect & Grow</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {role === 'creator'
                  ? 'View feedback from your athletes'
                  : 'Connect with expert coaches'
                }
              </p>
              <Link 
                href={role === 'creator' ? '/dashboard/creator/requests' : '/contributors'}
                className="text-sm font-medium text-cardinal hover:text-cardinal-dark flex items-center gap-1"
              >
                {role === 'creator' ? 'View Requests' : 'Find Coaches'}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}