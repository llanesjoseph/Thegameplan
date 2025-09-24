'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import { useState } from 'react'
import {
  LayoutDashboard,
  Video,
  MessageCircle,
  Calendar,
  BarChart3,
  Users,
  Settings,
  BookOpen,
  TrendingUp,
  User,
  Crown,
  Award,
  Menu,
  X,
  ShoppingBag,
  MessageSquare,
  UserCheck
} from 'lucide-react'

const navigationItems = {
  user: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Progress', icon: TrendingUp, href: '/dashboard/progress', color: 'text-green-600' },
    { title: 'Request Coaching', icon: MessageCircle, href: '/dashboard/coaching', color: 'text-purple-600' },
    { title: 'Schedule', icon: Calendar, href: '/dashboard/schedule', color: 'text-orange-600' },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'Profile', icon: User, href: '/dashboard/profile', color: 'text-gray-600' },
  ],
  creator: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Lesson Studio', icon: Video, href: '/dashboard/creator', color: 'text-red-600' },
    { title: 'Coaching Requests', icon: MessageCircle, href: '/dashboard/creator/requests', color: 'text-green-600' },
    { title: 'My Schedule', icon: Calendar, href: '/dashboard/creator/schedule', color: 'text-orange-600' },
    { title: 'Assistant Coaches', icon: UserCheck, href: '/dashboard/creator/assistants', color: 'text-indigo-600' },
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/creator/analytics', color: 'text-purple-600' },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'Profile', icon: User, href: '/dashboard/profile', color: 'text-gray-600' },
  ],
  assistant_coach: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Coaching Requests', icon: MessageCircle, href: '/dashboard/assistant/requests', color: 'text-green-600' },
    { title: 'Schedule Management', icon: Calendar, href: '/dashboard/assistant/schedule', color: 'text-orange-600' },
    { title: 'Content Organization', icon: Video, href: '/dashboard/assistant/content', color: 'text-red-600' },
    { title: 'Athlete Management', icon: Users, href: '/dashboard/assistant/athletes', color: 'text-purple-600' },
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/assistant/analytics', color: 'text-pink-600' },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'Profile', icon: User, href: '/dashboard/profile', color: 'text-gray-600' },
  ],
  superadmin: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Role Management', icon: Crown, href: '/dashboard/admin/roles', color: 'text-red-600' },
    { title: 'System Analytics', icon: BarChart3, href: '/dashboard/admin/analytics', color: 'text-purple-600' },
    { title: '━━━ User Management ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'All Users', icon: Users, href: '/dashboard/admin/users', color: 'text-green-600' },
    { title: 'Coach Applications', icon: Award, href: '/dashboard/admin/creator-applications', color: 'text-indigo-600' },
    { title: '━━━ Content Management ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'Content Management', icon: Video, href: '/dashboard/admin/content', color: 'text-orange-600' },
    { title: '━━━ Coach Tools ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'Coach Studio', icon: Video, href: '/dashboard/creator', color: 'text-red-600' },
    { title: 'Coach Requests', icon: MessageCircle, href: '/dashboard/creator/requests', color: 'text-green-600' },
    { title: 'Assistant Coaches', icon: UserCheck, href: '/dashboard/creator/assistants', color: 'text-indigo-600' },
    { title: '━━━ General ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'System Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'text-gray-600' },
  ]
}

export function DashboardSidebar() {
  const { user } = useAuth()
  const { role } = useUrlEnhancedRole()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = navigationItems[role as keyof typeof navigationItems] || navigationItems.user

  const getRoleBadge = () => {
    // For superadmins, show the current view they're testing
    if (user?.role === 'superadmin') {
      const viewLabel = role === 'superadmin' ? 'Super Admin' :
                       role === 'creator' ? 'Coach View' :
                       role === 'assistant_coach' ? 'Assistant View' : 'Athlete View'

      return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(140, 21, 21, 0.1)', color: '#8C1515'}}>
        <Crown className="w-3 h-3 mr-1" />
        {viewLabel}
      </div>
    }

    switch (role) {
      case 'creator':
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(90, 44, 89, 0.1)', color: '#5A2C59'}}>
          <Award className="w-3 h-3 mr-1" />
          Coach
        </div>
      case 'assistant_coach':
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1'}}>
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant Coach
        </div>
      case 'superadmin':
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(140, 21, 21, 0.1)', color: '#8C1515'}}>
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </div>
      default:
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(32, 178, 170, 0.1)', color: '#20B2AA'}}>
          <User className="w-3 h-3 mr-1" />
          Athlete
        </div>
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="xl:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="xl:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 w-56 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-deep-plum to-sky-blue">
              <span className="text-white text-sm font-bold font-heading tracking-wide">PBd</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{color: '#5A2C59'}}>
                {user?.displayName || 'Dashboard'}
              </h2>
            </div>
          </div>
          {getRoleBadge()}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {items.map((item, index) => {
            // Handle separator items
            if ((item as any).disabled) {
              return (
                <div key={`separator-${index}`} className="px-4 py-2">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {item.title.replace(/━/g, '')}
                  </div>
                </div>
              )
            }

            const isActive = pathname === item.href || (item.href !== '/dashboard/overview' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
                style={isActive ?
                  {backgroundColor: 'rgba(90, 44, 89, 0.1)', color: '#5A2C59', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'} :
                  {color: '#6B7280'}
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#5A2C59'
                    e.currentTarget.style.backgroundColor = 'rgba(90, 44, 89, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#6B7280'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {item.icon && <item.icon className="w-5 h-5" style={{color: isActive ? '#5A2C59' : '#9CA3AF'}} />}
                <span className="font-medium text-sm">
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Links */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-around text-xs">
              <Link href="/lessons" className="text-gray-600 hover:text-gray-900 transition-colors">
                📚 Training
              </Link>
              <Link href="/contributors" className="text-gray-600 hover:text-gray-900 transition-colors">
                👥 Coaches  
              </Link>
              <Link href="/subscribe" className="text-gray-600 hover:text-gray-900 transition-colors">
                ⭐ Subscribe
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}