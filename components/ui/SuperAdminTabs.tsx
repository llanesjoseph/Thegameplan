'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import {
  Crown,
  Settings,
  Star,
  User,
  Shield,
  Eye,
  TestTube
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
    id: 'admin',
    label: 'Admin View',
    icon: Settings,
    color: 'text-orange-600',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-50',
    description: 'Administrative functions',
    defaultPath: '/dashboard/admin'
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    icon: Crown,
    color: 'text-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    description: 'Full system access',
    defaultPath: '/dashboard/superadmin'
  }
]

interface SuperAdminTabsProps {
  children?: React.ReactNode
  className?: string
}

export default function SuperAdminTabs({ children, className = '' }: SuperAdminTabsProps) {
  const { user } = useAuth()
  const { role, switchToRole } = useUrlEnhancedRole()
  const router = useRouter()

  // Only show for super admins
  if (user?.role !== 'superadmin') {
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
          {/* Super Admin Banner */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-600">Super Admin Access</span>
              <div className="flex items-center gap-2 px-2 py-1 bg-red-50 rounded-full">
                <TestTube className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600">Role Testing Mode</span>
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
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `${tab.borderColor} ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? tab.color : 'text-gray-400'}`} />
                  {tab.label}
                  {isActive && (
                    <Eye className="w-3 h-3 text-yellow-500" />
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
        <div className={`${activeTab.bgColor} border-b border-gray-200`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <activeTab.icon className={`w-5 h-5 ${activeTab.color}`} />
              <div>
                <h2 className={`font-semibold ${activeTab.color}`}>
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