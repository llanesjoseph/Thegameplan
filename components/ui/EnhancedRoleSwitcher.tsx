'use client'
import { useState } from 'react'
import { useEnhancedRole, UserRole } from '@/hooks/use-role-switcher'
import { ChevronDown, Crown, Award, Settings, User, Info } from 'lucide-react'

const roleConfig = {
  user: {
    label: 'User',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Access lessons and coaching'
  },
  creator: {
    label: 'Creator',
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Create content and coach others'
  },
  admin: {
    label: 'Admin',
    icon: Settings,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Manage users and content'
  },
  superadmin: {
    label: 'Super Admin',
    icon: Crown,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Full system access'
  }
}

export default function EnhancedRoleSwitcher() {
  const { role, switchToRole, canSwitchRoles, getAvailableRoles } = useEnhancedRole()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const availableRoles = getAvailableRoles()

  if (!canSwitchRoles || availableRoles.length <= 1) {
    return null
  }

  const currentRoleConfig = roleConfig[role as keyof typeof roleConfig]
  const CurrentIcon = currentRoleConfig.icon

  const handleRoleSwitch = (newRole: UserRole) => {
    switchToRole(newRole)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Role Switcher Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
            ${isOpen 
              ? 'border-clarity-accent bg-clarity-accent/10 text-clarity-accent' 
              : 'border-clarity-text-secondary/20 hover:border-clarity-accent/50 hover:bg-clarity-accent/5'
            }
          `}
        >
          <div className={`p-1 rounded ${currentRoleConfig.bgColor}`}>
            <CurrentIcon className={`w-3 h-3 ${currentRoleConfig.color}`} />
          </div>
          <span className="text-sm font-medium text-clarity-text-primary">
            {currentRoleConfig.label}
          </span>
          <ChevronDown className={`w-4 h-4 text-clarity-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Info Icon */}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="p-1 text-clarity-text-secondary hover:text-clarity-accent transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <div className="text-sm">
            <div className="font-medium text-gray-900 mb-1">Role Switching</div>
            <div className="text-gray-600 mb-2">
              You have access to multiple roles. Switch between them to access different features and permissions.
            </div>
            <div className="text-xs text-gray-500">
              Current: {currentRoleConfig.description}
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-clarity-accent rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Switch Role</h3>
              </div>
              <p className="text-xs text-gray-600">
                Choose your role to access different features and permissions
              </p>
            </div>

            {/* Role Options */}
            <div className="p-2">
              {availableRoles.map((availableRole) => {
                const config = roleConfig[availableRole.value as keyof typeof roleConfig]
                const Icon = config.icon
                const isCurrentRole = availableRole.value === role

                return (
                  <button
                    key={availableRole.value}
                    onClick={() => handleRoleSwitch(availableRole.value)}
                    disabled={isCurrentRole}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
                      ${isCurrentRole 
                        ? 'bg-clarity-accent/10 border border-clarity-accent/20 cursor-default' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{availableRole.label}</span>
                        {isCurrentRole && (
                          <span className="px-2 py-1 bg-clarity-accent text-white text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{availableRole.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Your role determines which features and data you can access
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
