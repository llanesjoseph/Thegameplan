'use client'
import { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

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
              /* Welcome/Empty State */
              <div className="h-full flex items-center justify-center p-8">
                <div className="max-w-2xl text-center">
                  <div className="mb-6">
                    <Shield className="w-20 h-20 mx-auto mb-4" style={{ color: '#8B5CF6' }} />
                    <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                      Admin Dashboard
                    </h2>
                    <p className="text-lg" style={{ color: '#666' }}>
                      Select a tool from the left sidebar to manage the platform
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-5 border-2 border-purple-500/30">
                      <UserCog className="w-8 h-8 mb-3" style={{ color: '#8B5CF6' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>User Management</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Manage users, roles, and permissions
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-teal/10 to-teal/5 rounded-lg p-5 border-2" style={{ borderColor: '#20B2AA' }}>
                      <UserCheck className="w-8 h-8 mb-3" style={{ color: '#20B2AA' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Invitations</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Review and approve applications
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange/10 to-orange/5 rounded-lg p-5 border-2" style={{ borderColor: '#FF6B35' }}>
                      <BarChart3 className="w-8 h-8 mb-3" style={{ color: '#FF6B35' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>Analytics</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        View platform metrics and insights
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-black/10 to-black/5 rounded-lg p-5 border-2 border-black/20">
                      <Settings className="w-8 h-8 mb-3" style={{ color: '#000000' }} />
                      <h3 className="font-semibold mb-1" style={{ color: '#000000' }}>System Settings</h3>
                      <p className="text-sm" style={{ color: '#666' }}>
                        Configure platform settings
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-5 text-white text-left">
                    <h3 className="font-semibold mb-3 text-lg">🛡️ Admin Quick Access</h3>
                    <ol className="space-y-2 text-sm">
                      <li><strong>1.</strong> Click any tool in the sidebar to open it</li>
                      <li><strong>2.</strong> Use "User & Role Management" for user admin</li>
                      <li><strong>3.</strong> Check "Analytics" for platform insights</li>
                    </ol>
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
