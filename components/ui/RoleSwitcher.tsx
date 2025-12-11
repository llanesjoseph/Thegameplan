'use client'

import { useState } from 'react'
import { useEnhancedRole, UserRole } from '@/hooks/use-role-switcher'
import {
 Shield,
 User,
 Star,
 Settings,
 Crown,
 ChevronDown,
 RotateCcw,
 TestTube,
 Eye,
 UserCheck
} from 'lucide-react'

interface RoleSwitcherProps {
 className?: string
}

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
 guest: User,
 user: User,
 athlete: UserCheck,
 creator: Star,
 coach: Shield,
 assistant: Shield,
 admin: Settings,
 superadmin: Crown
}

const roleColors: Record<UserRole, string> = {
 guest: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
 user: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
 athlete: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
 creator: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
 coach: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
 assistant: 'text-green-400 bg-green-400/10 border-green-400/20',
 admin: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
 superadmin: 'text-red-400 bg-red-400/10 border-red-400/20'
}

export default function RoleSwitcher({ className = '' }: RoleSwitcherProps) {
 const [isOpen, setIsOpen] = useState(false)
 const {
  effectiveRole,
  originalRole,
  isTestingMode,
  canSwitchRoles,
  switchToRole,
  resetToOriginalRole,
  getAvailableRoles
 } = useEnhancedRole()

 // Only render for admins
 if (!canSwitchRoles) {
  return null
 }

 const CurrentRoleIcon = roleIcons[effectiveRole]
 const availableRoles = getAvailableRoles()

 return (
  <div className={`relative ${className}`}>
   {/* Testing Mode Banner */}
   {isTestingMode && (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30 px-4 py-2 backdrop-blur-sm">
     <div className="flex items-center justify-center gap-3 text-sm">
      <TestTube className="w-4 h-4 text-yellow-400" />
      <span className="text-yellow-300 ">
       Role Testing Mode: Viewing as <strong className="text-yellow-100">{effectiveRole}</strong>
      </span>
      <button
       onClick={resetToOriginalRole}
       className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
      >
       <RotateCcw className="w-3 h-3" />
       Exit Testing
      </button>
     </div>
    </div>
   )}

   {/* Role Switcher Dropdown */}
   <div className="relative">
    <button
     onClick={() => setIsOpen(!isOpen)}
     className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:bg-white/5 ${
      isTestingMode 
       ? 'border-yellow-400/30 bg-yellow-400/5' 
       : 'border-white/10 bg-white/5'
     }`}
    >
     <div className="flex items-center gap-2">
      <div className="relative">
       <CurrentRoleIcon className={`w-4 h-4 ${
        roleColors[effectiveRole].split(' ')[0]
       }`} />
       {isTestingMode && (
        <Eye className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />
       )}
      </div>
      <span className="text-sm  capitalize">
       {isTestingMode ? `Testing: ${effectiveRole}` : effectiveRole}
      </span>
     </div>
     <ChevronDown className={`w-4 h-4 text-brand-grey transition-transform ${
      isOpen ? 'rotate-180' : ''
     }`} />
    </button>

    {/* Dropdown Menu */}
    {isOpen && (
     <>
      <div 
       className="fixed inset-0 z-40" 
       onClick={() => setIsOpen(false)}
      />
      <div className="absolute top-full left-0 mt-2 w-80 bg-brand-dark border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
       <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
         <Crown className="w-4 h-4 text-red-400" />
         <span className="text-sm  text-red-400">Admin Tools</span>
        </div>
        <p className="text-xs text-brand-grey">
         Switch roles to test different user experiences
        </p>
       </div>

       <div className="max-h-64 overflow-y-auto">
        {availableRoles.map((role) => {
         const RoleIcon = roleIcons[role.value]
         const isCurrentRole = effectiveRole === role.value
         const isOriginalRole = originalRole === role.value

         return (
          <button
           key={role.value}
           onClick={() => {
            switchToRole(role.value)
            setIsOpen(false)
           }}
           disabled={isCurrentRole}
           className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-l-4 ${
            isCurrentRole 
             ? `${roleColors[role.value]} border-l-current` 
             : 'border-l-transparent hover:border-l-white/20'
           }`}
          >
           <div className="flex items-center gap-3">
            <RoleIcon className={`w-5 h-5 ${
             isCurrentRole 
              ? roleColors[role.value].split(' ')[0]
              : 'text-brand-grey'
            }`} />
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
              <span className={` ${
               isCurrentRole ? 'text-white' : 'text-brand-grey-light'
              }`}>
               {role.label}
              </span>
              {isOriginalRole && !isTestingMode && (
               <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                Your Role
               </span>
              )}
              {isCurrentRole && isTestingMode && (
               <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                Active
               </span>
              )}
             </div>
             <p className="text-xs text-brand-grey mt-0.5">
              {role.description}
             </p>
            </div>
           </div>
          </button>
         )
        })}
       </div>

       {isTestingMode && (
        <div className="p-3 border-t border-white/10 bg-white/5">
         <button
          onClick={() => {
           resetToOriginalRole()
           setIsOpen(false)
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm  text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors"
         >
          <RotateCcw className="w-4 h-4" />
          Reset to Admin
         </button>
        </div>
       )}
      </div>
     </>
    )}
   </div>
  </div>
 )
}