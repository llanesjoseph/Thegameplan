'use client'

import { useState } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { Mail, UserCheck, FileText, MessageSquare, Shield } from 'lucide-react'

interface ApprovalSection {
  id: string
  title: string
  description: string
  icon: any
  color: string
  url: string
}

export default function InvitationsApprovalsHub() {
  const [activeTab, setActiveTab] = useState<string>('invitations')

  const sections: ApprovalSection[] = [
    {
      id: 'invitations',
      title: 'All Invitations',
      description: 'Manage all platform invitations',
      icon: Mail,
      color: '#91A6EB',
      url: '/dashboard/admin/invitations?embedded=true'
    },
    {
      id: 'admin-invites',
      title: 'Admin Invitations',
      description: 'Invite and manage admin team members',
      icon: UserCheck,
      color: '#20B2AA',
      url: '/dashboard/admin/admin-invites?embedded=true'
    },
    {
      id: 'coach-applications',
      title: 'Coach Applications',
      description: 'Review and approve coach applications',
      icon: FileText,
      color: '#FF6B35',
      url: '/dashboard/admin/coach-applications?embedded=true'
    },
    {
      id: 'requests',
      title: 'Coach Requests',
      description: 'Handle coaching session requests',
      icon: MessageSquare,
      color: '#20B2AA',
      url: '/dashboard/admin/requests?embedded=true'
    },
    {
      id: 'assistant-coaches',
      title: 'Assistant Coaches',
      description: 'Manage assistant coach accounts',
      icon: Shield,
      color: '#FF6B35',
      url: '/dashboard/admin/assistant-coaches?embedded=true'
    }
  ]

  const activeSection = sections.find(s => s.id === activeTab)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Invitations & Approvals" subtitle="Manage all invitations, applications, and approval workflows" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeTab === section.id

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{section.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Section Content */}
        {activeSection && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden" style={{
            height: 'clamp(400px, 60vh, 850px)',
            maxHeight: '65vh'
          }}>
            <iframe
              src={activeSection.url}
              className="w-full h-full border-0"
              title={activeSection.title}
            />
          </div>
        )}
      </main>
    </div>
  )
}
