'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import {
  Crown,
  Settings,
  Star,
  User,
  Shield,
  Eye,
  TestTube,
  UserCheck
} from 'lucide-react'

interface TabRole {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  borderColor: string
  bgColor: string
  description: string
  defaultPath: string
}

const TAB_ROLES: TabRole[] = [
  {
    id: 'user',
    label: 'Athlete View',
    icon: User,
    color: 'text-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Athlete training experience',
    defaultPath: '/dashboard/overview'
  },
  {
    id: 'creator',
    label: 'Coach View',
    icon: Star,
    color: 'text-purple-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    description: 'Coach content creation tools',
    defaultPath: '/dashboard/creator'
  },
  {
    id: 'assistant_coach',
    label: 'Assistant Coach',
    icon: UserCheck,
    color: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50',
    description: 'Assistant coach engagement tools',
    defaultPath: '/dashboard/assistant'
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    icon: Crown,
    color: 'text-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    description: 'Full system administration',
    defaultPath: '/dashboard/admin'
  }
]

interface AdminTabsProps {
  children?: React.ReactNode
  className?: string
}

export default function AdminTabs({ children, className = '' }: AdminTabsProps) {
  const { user } = useAuth()
  const { role, switchToRole, originalRole } = useEnhancedRole()
  const router = useRouter()

  // Only show for superadmins (check the actual user role from Firestore, not auth)
  if (originalRole !== 'superadmin') {
    return <>{children}</>
  }

  const activeTab = TAB_ROLES.find(tab => tab.id === role) || TAB_ROLES[0]

  const handleRoleSwitch = (newRole: string) => {
    const targetTab = TAB_ROLES.find(tab => tab.id === newRole)
    if (targetTab) {
      // Switch role and navigate to the appropriate page
      switchToRole(newRole as any)
      router.push(targetTab.defaultPath)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Banner */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5" style={{color: '#8C1515'}} />
              <span className="text-sm font-semibold" style={{color: '#8C1515'}}>Admin Access</span>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full" style={{backgroundColor: 'rgba(140, 21, 21, 0.1)'}}>
                <TestTube className="w-3 h-3" style={{color: '#8C1515'}} />
                <span className="text-xs" style={{color: '#8C1515'}}>Role Testing Mode</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Viewing as: <span className="font-medium text-gray-700">{activeTab.label}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 overflow-x-auto">
            {TAB_ROLES.map((tab) => {
              const isActive = role === tab.id
              const TabIcon = tab.icon

              return (
                <button
                  key={tab.id}
                  onClick={() => handleRoleSwitch(tab.id)}
                  className="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200"
                  style={{
                    borderBottomColor: isActive ? '#5A2C59' : 'transparent',
                    color: isActive ? '#5A2C59' : '#6B7280'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.borderBottomColor = '#D1D5DB'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6B7280'
                      e.currentTarget.style.borderBottomColor = 'transparent'
                    }
                  }}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-[#5A2C59]' : 'text-[#9CA3AF]'}`} />
                  {tab.label}
                  {isActive && (
                    <Eye className="w-3 h-3 text-[#8D9440]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen bg-gray-50">
        {/* Active Role Indicator */}
        <div className="border-b border-gray-200" style={{backgroundColor: role === 'superadmin' ? 'rgba(140, 21, 21, 0.05)' : 'rgba(32, 178, 170, 0.05)'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <activeTab.icon className={`w-5 h-5 ${role === 'superadmin' ? 'text-[#8C1515]' : 'text-[#20B2AA]'}`} />
              <div>
                <h2 className="font-semibold" style={{color: role === 'superadmin' ? '#8C1515' : '#20B2AA'}}>
                  {activeTab.label}
                </h2>
                <p className="text-sm text-gray-600">{activeTab.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}