'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import Link from 'next/link'
import { 
  Video, 
  MessageCircle, 
  BarChart3,
  TrendingUp,
  BookOpen,
  Users,
  PlayCircle,
  ArrowUpRight,
  CheckCircle
} from 'lucide-react'

const quickActions = {
  user: [
    { 
      title: 'Browse Lessons', 
      description: 'Explore training content',
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
      description: 'Track your development',
      icon: TrendingUp, 
      href: '/dashboard/progress', 
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ],
  creator: [
    { 
      title: 'Create Lesson', 
      description: 'Share your expertise',
      icon: Video, 
      href: '/dashboard/creator', 
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    { 
      title: 'Coaching Requests', 
      description: 'Help students improve',
      icon: MessageCircle, 
      href: '/dashboard/creator/requests', 
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      title: 'Analytics', 
      description: 'View your impact',
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
          <h1 className="text-2xl font-bold text-clarity-text-primary">
            Welcome back, {user.displayName || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-clarity-text-secondary mt-1">
            Here's your {role === 'creator' ? 'content' : 'learning'} overview
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <div className="bg-clarity-surface rounded-2xl p-6 border border-clarity-text-secondary/20 hover:shadow-lg hover:shadow-clarity-text-secondary/20 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${action.iconBg}`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-clarity-text-primary mb-1">{action.title}</h3>
                  <p className="text-sm text-clarity-text-secondary">{action.description}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-clarity-text-secondary group-hover:text-clarity-text-primary transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>


      {/* Recent Activity & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-clarity-text-primary mb-4">Recent Activity</h2>
          <div className="bg-clarity-surface rounded-xl border border-clarity-text-secondary/20 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-clarity-text-primary">
                    {role === 'creator' ? 'Published lesson: Advanced Techniques' : 'Completed: Basic Training'}
                  </p>
                  <p className="text-sm text-clarity-text-secondary">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-clarity-text-primary">
                    {role === 'creator' ? 'New coaching request received' : 'Coaching session scheduled'}
                  </p>
                  <p className="text-sm text-clarity-text-secondary">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PlayCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-clarity-text-primary">
                    {role === 'creator' ? 'Video reached 100 views' : 'Started new lesson series'}
                  </p>
                  <p className="text-sm text-clarity-text-secondary">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-lg font-semibold text-clarity-text-primary mb-4">Recommended</h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">
                {role === 'creator' ? 'Create Your Next Lesson' : 'Continue Learning'}
              </h3>
              <p className="text-blue-100 text-sm mb-4">
                {role === 'creator' 
                  ? 'Share your expertise with new content' 
                  : 'Keep building your skills with new lessons'
                }
              </p>
              <Link 
                href={role === 'creator' ? '/dashboard/creator' : '/lessons'}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {role === 'creator' ? 'Start Creating' : 'Browse Lessons'}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-clarity-surface rounded-xl p-6 border border-clarity-text-secondary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-clarity-text-primary">Connect & Grow</h3>
              </div>
              <p className="text-clarity-text-secondary text-sm mb-4">
                {role === 'creator' 
                  ? 'View feedback from your students' 
                  : 'Connect with expert coaches'
                }
              </p>
              <Link 
                href={role === 'creator' ? '/dashboard/creator/requests' : '/contributors'}
                className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
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