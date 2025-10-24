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
              /* Clean Dashboard Overview */
              <div className="h-full p-8">
                <div className="text-center mb-8">
                  <Shield className="w-20 h-20 mx-auto mb-4" style={{ color: '#8B5CF6' }} />
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                    Admin Dashboard
                  </h2>
                  <p className="text-lg" style={{ color: '#666' }}>
                    Platform overview and quick access to all admin tools
                  </p>
                </div>

                {/* Comprehensive Metrics Dashboard */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-6" style={{ color: '#000000' }}>Platform Metrics</h3>
                  
                  {/* Primary Metrics Row */}
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#8B5CF6' }}>6</div>
                      <div className="text-sm font-medium" style={{ color: '#000000' }}>Active Athletes</div>
                      <div className="text-xs" style={{ color: '#666' }}>Total registered athletes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#20B2AA' }}>3</div>
                      <div className="text-sm font-medium" style={{ color: '#000000' }}>Coaches</div>
                      <div className="text-xs" style={{ color: '#666' }}>Verified coaches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#FF6B35' }}>22</div>
                      <div className="text-sm font-medium" style={{ color: '#000000' }}>Content Items</div>
                      <div className="text-xs" style={{ color: '#666' }}>Lessons & videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: '#91A6EB' }}>2</div>
                      <div className="text-sm font-medium" style={{ color: '#000000' }}>Pending Invites</div>
                      <div className="text-xs" style={{ color: '#666' }}>Awaiting approval</div>
                    </div>
                  </div>

                  {/* Secondary Metrics Row */}
                  <div className="grid grid-cols-6 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#000000' }}>9</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#10B981' }}>2</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Featured</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#F59E0B' }}>0</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#EF4444' }}>0</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Suspended</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#6B7280' }}>0</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: '#8B5CF6' }}>100%</div>
                      <div className="text-xs font-medium" style={{ color: '#000000' }}>Health Score</div>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666' }}>System Status:</span>
                      <span className="text-sm font-medium text-green-600">● Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666' }}>Last Updated:</span>
                      <span className="text-sm font-medium" style={{ color: '#000000' }}>Just now</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666' }}>Uptime:</span>
                      <span className="text-sm font-medium" style={{ color: '#000000' }}>99.9%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>User Management</h3>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                            <UserCog className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>User & Role Management</h4>
                            <p className="text-sm" style={{ color: '#666' }}>Manage users, roles, and permissions</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('users')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#8B5CF6' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Total Users:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>9</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Active:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>9</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#20B2AA' }}>
                            <UserCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>Invitations & Approvals</h4>
                            <p className="text-sm" style={{ color: '#666' }}>Review and approve applications</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('invitations-approvals')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#20B2AA' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Pending:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>2</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Approved:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>0</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>Athletes</h4>
                            <p className="text-sm" style={{ color: '#666' }}>Manage athlete accounts and progress</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('athletes')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#91A6EB' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Total:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>6</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Active:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>6</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>Content & Analytics</h3>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>System Analytics</h4>
                            <p className="text-sm" style={{ color: '#666' }}>View platform metrics and insights</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('analytics')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#FF6B35' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Total Views:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>0</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Growth:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>+0%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>Coach Management</h4>
                            <p className="text-sm" style={{ color: '#666' }}>Manage coach verification and featured status</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('coach-management')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#8B5CF6' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Verified:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>3</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Featured:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>2</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{ color: '#000000' }}>Content Management</h4>
                            <p className="text-sm" style={{ color: '#666' }}>Review and moderate platform content</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveSection('content')}
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#000000' }}
                        >
                          Open
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666' }}>Published:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>22</span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Pending:</span>
                          <span className="ml-2 font-semibold" style={{ color: '#000000' }}>0</span>
                        </div>
                      </div>
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
