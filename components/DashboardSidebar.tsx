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
  MessageSquare
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
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/creator/analytics', color: 'text-purple-600' },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'Profile', icon: User, href: '/dashboard/profile', color: 'text-gray-600' },
  ],
  admin: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Users', icon: Users, href: '/dashboard/admin/users', color: 'text-green-600' },
    { title: 'Content', icon: Video, href: '/dashboard/admin/content', color: 'text-red-600' },
    { title: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics', color: 'text-purple-600' },
    { title: 'Curated Gear', icon: ShoppingBag, href: '/gear', color: 'text-emerald-600' },
    { title: 'Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'text-gray-600' },
  ],
  superadmin: [
    { title: 'Overview', icon: LayoutDashboard, href: '/dashboard/overview', color: 'text-blue-600' },
    { title: 'Role Management', icon: Crown, href: '/dashboard/superadmin', color: 'text-red-600' },
    { title: 'System Analytics', icon: BarChart3, href: '/dashboard/superadmin/analytics', color: 'text-purple-600' },
    { title: '━━━ Admin Features ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'All Users', icon: Users, href: '/dashboard/admin/users', color: 'text-green-600' },
    { title: 'Creator Applications', icon: Award, href: '/dashboard/admin/creator-applications', color: 'text-indigo-600' },
    { title: 'Content Management', icon: Video, href: '/dashboard/admin/content', color: 'text-orange-600' },
    { title: 'Admin Analytics', icon: TrendingUp, href: '/dashboard/admin/analytics', color: 'text-pink-600' },
    { title: '━━━ Creator Features ━━━', icon: null, href: '', color: 'text-gray-400', disabled: true },
    { title: 'Creator Studio', icon: Video, href: '/dashboard/creator', color: 'text-red-600' },
    { title: 'Creator Requests', icon: MessageCircle, href: '/dashboard/creator/requests', color: 'text-green-600' },
    { title: 'Creator Analytics', icon: BarChart3, href: '/dashboard/creator/analytics', color: 'text-purple-600' },
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
    switch (role) {
      case 'creator': 
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          <Award className="w-3 h-3 mr-1" />
          Creator
        </div>
      case 'admin': 
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <Settings className="w-3 h-3 mr-1" />
          Admin
        </div>
      case 'superadmin': 
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </div>
      default: 
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <User className="w-3 h-3 mr-1" />
          User
        </div>
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 w-64 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">GP</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {user?.displayName || 'Dashboard'}
              </h2>
            </div>
          </div>
          {getRoleBadge()}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
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

            const isActive = pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon && <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'}`} />}
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