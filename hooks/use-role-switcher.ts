'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export type UserRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin'

interface RoleSwitcherState {
  originalRole: UserRole | null
  currentRole: UserRole | null
  isTestingMode: boolean
}

export function useRoleSwitcher() {
  const { user } = useAuth()
  const [roleSwitcherState, setRoleSwitcherState] = useState<RoleSwitcherState>({
    originalRole: null,
    currentRole: null,
    isTestingMode: false
  })
  
  // Force re-render counter to ensure UI updates
  const [forceUpdate, setForceUpdate] = useState(0)

  // Initialize with user's actual role
  useEffect(() => {
    console.log('🔐 User object in roleSwitcher:', {
      user: user,
      userRole: user?.role,
      userEmail: user?.email,
      userDisplayName: user?.displayName
    })
    
    if (user?.role) {
      setRoleSwitcherState(prev => ({
        ...prev,
        originalRole: user.role as UserRole,
        currentRole: prev.isTestingMode ? prev.currentRole : user.role as UserRole
      }))
    }
  }, [user?.role, user?.email])

  // Check if current user is super admin
  const isSuperAdmin = user?.role === 'superadmin'

  // Switch to a different role (only for super admins)
  const switchToRole = (role: UserRole) => {
    if (!isSuperAdmin) {
      console.warn('Role switching is only available for super admins')
      return
    }

    console.log('🔄 Switching to role:', role)
    
    const newState = {
      originalRole: roleSwitcherState.originalRole || user?.role,
      currentRole: role,
      isTestingMode: true
    }

    setRoleSwitcherState(newState)

    // Store in sessionStorage for persistence across page refreshes
    sessionStorage.setItem('roleTestingMode', JSON.stringify(newState))
    
    // Force UI re-render
    setForceUpdate(prev => prev + 1)
    
    // Force a small delay to ensure state updates are processed
    setTimeout(() => {
      console.log('✅ Role switch completed:', newState)
    }, 100)
  }

  // Reset to original role
  const resetToOriginalRole = () => {
    if (!isSuperAdmin) return

    console.log('🔄 Resetting to original role:', roleSwitcherState.originalRole)

    setRoleSwitcherState(prev => ({
      ...prev,
      currentRole: prev.originalRole,
      isTestingMode: false
    }))

    // Clear from sessionStorage
    sessionStorage.removeItem('roleTestingMode')
    
    // Force UI re-render
    setForceUpdate(prev => prev + 1)
    
    console.log('✅ Role reset completed')
  }

  // Load testing state from sessionStorage on mount
  useEffect(() => {
    if (isSuperAdmin) {
      const savedState = sessionStorage.getItem('roleTestingMode')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          setRoleSwitcherState({
            originalRole: parsed.originalRole,
            currentRole: parsed.currentRole,
            isTestingMode: parsed.isTestingMode
          })
        } catch (error) {
          console.error('Error parsing saved role testing state:', error)
          sessionStorage.removeItem('roleTestingMode')
        }
      }
    }
  }, [isSuperAdmin])

  // Get the effective role (what the UI should use)
  const getEffectiveRole = (): UserRole => {
    if (!isSuperAdmin) {
      const role = (user?.role as UserRole) || 'guest'
      console.log('🔍 Non-superadmin effective role:', role)
      return role
    }

    const effectiveRole = roleSwitcherState.currentRole || (user?.role as UserRole) || 'guest'
    console.log('🔍 Superadmin effective role:', effectiveRole, '| Testing mode:', roleSwitcherState.isTestingMode)
    return effectiveRole
  }

  // Get available roles for switching
  const getAvailableRoles = (): { value: UserRole; label: string; description: string }[] => [
    {
      value: 'guest',
      label: 'Guest',
      description: 'Not signed in - limited access'
    },
    {
      value: 'user',
      label: 'Regular User',
      description: 'Standard user accessing content'
    },
    {
      value: 'creator',
      label: 'Content Creator',
      description: 'Can create and manage content'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Platform administration access'
    },
    {
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full system access'
    }
  ]

  return {
    // State
    isSuperAdmin,
    isTestingMode: roleSwitcherState.isTestingMode,
    originalRole: roleSwitcherState.originalRole,
    currentRole: roleSwitcherState.currentRole,
    effectiveRole: getEffectiveRole(),
    
    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,
    
    // Utility
    canSwitchRoles: isSuperAdmin,
    
    // Force update counter (causes re-renders when changed)
    _forceUpdate: forceUpdate
  }
}

// Enhanced hook that replaces the original useRole for super admins
export function useEnhancedRole() {
  const roleSwitcher = useRoleSwitcher()
  const { user } = useAuth()
  
  // Add loading state to match original useRole signature
  const loading = !user
  
  const effectiveRole = roleSwitcher.effectiveRole
  
  // Debug logging to help track role changes
  console.log('🎯 useEnhancedRole:', {
    effectiveRole,
    isTestingMode: roleSwitcher.isTestingMode,
    currentRole: roleSwitcher.currentRole,
    originalRole: roleSwitcher.originalRole,
    userRole: user?.role
  })
  
  return {
    role: effectiveRole,
    loading,
    originalRole: roleSwitcher.originalRole,
    isTestingMode: roleSwitcher.isTestingMode,
    canSwitchRoles: roleSwitcher.canSwitchRoles,
    ...roleSwitcher
  }
}