'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import AppHeader from '@/components/ui/AppHeader'
import InvitationsApprovalsUnified from './invitations-approvals/page'
import {
  Users,
  Mail,
  Calendar,
  BarChart3,
  UserCheck,
  Target,
  Shield,
  Dumbbell,
  UserCog,
  MessageSquare,
  ShoppingBag,
  Settings,
  FileText,
  Trophy,
  X,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  // Check if user has admin privileges
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/signin')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (!userDoc.exists()) {
          setIsAdmin(false)
          setChecking(false)
          return
        }

        const userData = userDoc.data()
        const userRole = userData?.role || userData?.roles?.[0] || 'user'

        // Only admin and superadmin can access
        const hasAccess = ['admin', 'superadmin'].includes(userRole)
        setIsAdmin(hasAccess)
        setChecking(false)

        if (!hasAccess) {
          // Log unauthorized access attempt
          console.warn(`Unauthorized admin access attempt by ${user.email} (role: ${userRole})`)
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        setIsAdmin(false)
        setChecking(false)
      }
    }

    checkAdminAccess()
  }, [user, authLoading, router])

  // Show loading state
  if (authLoading || checking) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#000000' }}>
              Access Denied
            </h2>
            <p className="mb-6" style={{ color: '#666' }}>
              You don't have permission to access the admin dashboard. This area is restricted to administrators only.
            </p>
            <button
              onClick={() => router.push('/dashboard/coach-unified')}
              className="px-6 py-3 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#91A6EB' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const adminCards = [
    {
      id: 'users',
      title: 'User & Role Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: UserCog,
      color: '#8B5CF6'
    },
    {
      id: 'analytics',
      title: 'System Analytics',
      description: 'View comprehensive platform analytics',
      icon: BarChart3,
      color: '#FF6B35'
    },
    {
      id: 'invitations-approvals',
      title: 'Invitations & Approvals',
      description: 'Manage all invitations, applications, and approval workflows',
      icon: UserCheck,
      color: '#20B2AA'
    },
    {
      id: 'locker-room',
      title: 'Coaches Locker Room',
      description: 'Manage coach resources and tools',
      icon: Target,
      color: '#000000'
    },
    {
      id: 'athletes',
      title: 'Athletes',
      description: 'Manage athlete accounts and progress',
      icon: Trophy,
      color: '#91A6EB'
    },
    {
      id: 'content',
      title: 'Content Management',
      description: 'Review and moderate platform content',
      icon: Calendar,
      color: '#000000'
    },
    {
      id: 'gear',
      title: 'Curated Gear',
      description: 'Manage recommended gear and equipment',
      icon: ShoppingBag,
      color: '#91A6EB'
    },
    {
      id: 'coach-management',
      title: 'Coach Management',
      description: 'Manage coach verification and featured status',
      icon: Shield,
      color: '#8B5CF6'
    },
    {
      id: 'sync',
      title: 'Sync Coaches',
      description: 'Sync coach profiles to public browse page',
      icon: Dumbbell,
      color: '#20B2AA'
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure platform-wide settings',
      icon: Settings,
      color: '#000000'
    }
  ]

  const getSectionPath = (sectionId: string) => {
    const pathMap: Record<string, string> = {
      'users': '/dashboard/admin/users?embedded=true',
      'analytics': '/dashboard/admin/analytics?embedded=true',
      'locker-room': '/dashboard/admin/coaches-locker-room?embedded=true',
      'athletes': '/dashboard/admin/athletes?embedded=true',
      'content': '/dashboard/admin/content?embedded=true',
      'gear': '/dashboard/admin/curated-gear?embedded=true',
      'coach-management': '/dashboard/admin/coach-management?embedded=true',
      'sync': '/dashboard/admin/sync-coaches?embedded=true',
      'settings': '/dashboard/admin/settings?embedded=true'
    }
    return pathMap[sectionId]
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Admin Dashboard" subtitle="Full platform control" />

      <main className="relative" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Two-column layout: Sidebar + Main Content */}
        <div className="flex h-full">
          {/* Left Sidebar - Compact Admin Tools */}
          <aside
            className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 overflow-y-auto"
            style={{ height: '100%' }}
          >
            {/* Sidebar Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>
                Admin Tools
              </h2>
              <p className="text-xs" style={{ color: '#666' }}>
                {adminCards.length} tools available
              </p>
            </div>

            {/* Compact Tool Cards */}
            <div className="p-2 space-y-1">
              {adminCards.map((card) => {
                const Icon = card.icon
                const isActive = activeSection === card.id

                return (
                  <button
                    key={card.id}
                    onClick={() => setActiveSection(card.id)}
                    className={`w-full text-left transition-all rounded-lg ${
                      isActive
                        ? 'bg-black/10 shadow-md'
                        : 'hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: card.color }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium truncate" style={{ color: '#000000' }}>
                            {card.title}
                          </h3>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              isActive ? 'rotate-90' : ''
                            }`}
                            style={{ color: card.color }}
                          />
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#666' }}>
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Main Content Area - Expanded Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeSection ? (
              <div className="h-full bg-white/90 backdrop-blur-sm">
                {/* Content Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
                      {adminCards.find(c => c.id === activeSection)?.title}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: '#666' }}>
                      {adminCards.find(c => c.id === activeSection)?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" style={{ color: '#000000' }} />
                  </button>
                </div>

                {/* Content */}
                <div style={{ height: 'calc(100% - 73px)' }}>
                  {/* Special handling for invitations-approvals - render component directly */}
                  {activeSection === 'invitations-approvals' ? (
                    <div className="h-full overflow-y-auto">
                      <InvitationsApprovalsUnified searchParams={{ embedded: 'true' }} />
                    </div>
                  ) : (
                    /* All other sections use iframe */
                    <iframe
                      src={getSectionPath(activeSection)}
                      className="w-full h-full border-0"
                      title={adminCards.find(c => c.id === activeSection)?.title || 'Section'}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* Quick View Dashboard with Live Iframes */
              <div className="h-full p-6 overflow-y-auto">
                <div className="mb-6 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-3" style={{ color: '#8B5CF6' }} />
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                    Admin Dashboard
                  </h2>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Live overview of all platform tools - Click any preview to open full view
                  </p>
                </div>

                {/* Quick View Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* User Management Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-semibold text-white">User Management</h3>
                      </div>
                    </div>
                    <div className="h-48">
                      <iframe
                        src="/dashboard/admin/users?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="User Management Quick View"
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('users')}
                        className="w-full text-xs bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 transition-colors"
                      >
                        Open Full View
                      </button>
                    </div>
                  </div>

                  {/* Analytics Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-semibold text-white">Analytics</h3>
                      </div>
                    </div>
                    <div className="h-48">
                      <iframe
                        src="/dashboard/admin/analytics?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="Analytics Quick View"
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('analytics')}
                        className="w-full text-xs bg-orange-600 text-white py-1 px-3 rounded hover:bg-orange-700 transition-colors"
                      >
                        Open Full View
                      </button>
                    </div>
                  </div>

                  {/* Coach Management Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-semibold text-white">Coach Management</h3>
                      </div>
                    </div>
                    <div className="h-48">
                      <iframe
                        src="/dashboard/admin/coach-management?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="Coach Management Quick View"
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('coach-management')}
                        className="w-full text-xs bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition-colors"
                      >
                        Open Full View
                      </button>
                    </div>
                  </div>

                  {/* Invitations Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-white" />
                        <h3 className="text-sm font-semibold text-white">Invitations</h3>
                      </div>
                    </div>
                    <div className="h-48">
                      <iframe
                        src="/dashboard/admin/invitations-approvals?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="Invitations Quick View"
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('invitations-approvals')}
                        className="w-full text-xs bg-teal-600 text-white py-1 px-3 rounded hover:bg-teal-700 transition-colors"
                      >
                        Open Full View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Quick Views Row */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Athletes Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-white" />
                        <h3 className="text-xs font-semibold text-white">Athletes</h3>
                      </div>
                    </div>
                    <div className="h-32">
                      <iframe
                        src="/dashboard/admin/athletes?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="Athletes Quick View"
                      />
                    </div>
                    <div className="p-2 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('athletes')}
                        className="w-full text-xs bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  {/* Content Management Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white" />
                        <h3 className="text-xs font-semibold text-white">Content</h3>
                      </div>
                    </div>
                    <div className="h-32">
                      <iframe
                        src="/dashboard/admin/content?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="Content Management Quick View"
                      />
                    </div>
                    <div className="p-2 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('content')}
                        className="w-full text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  {/* System Settings Quick View */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-white" />
                        <h3 className="text-xs font-semibold text-white">Settings</h3>
                      </div>
                    </div>
                    <div className="h-32">
                      <iframe
                        src="/dashboard/admin/settings?embedded=true&quickview=true"
                        className="w-full h-full border-0"
                        title="System Settings Quick View"
                      />
                    </div>
                    <div className="p-2 bg-gray-50 border-t">
                      <button
                        onClick={() => setActiveSection('settings')}
                        className="w-full text-xs bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
