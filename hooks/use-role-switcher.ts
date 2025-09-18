'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export type UserRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach'

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

    // Store in localStorage for superadmin persistence across browser sessions
    localStorage.setItem('superadmin_roleTestingMode', JSON.stringify({
      ...newState,
      timestamp: Date.now(),
      userId: user?.uid // Tie to specific user for security
    }))
    
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

    // Clear from localStorage
    localStorage.removeItem('superadmin_roleTestingMode')
    
    // Force UI re-render
    setForceUpdate(prev => prev + 1)
    
    console.log('✅ Role reset completed')
  }

  // Load testing state from localStorage on mount
  useEffect(() => {
    if (isSuperAdmin) {
      const savedState = localStorage.getItem('superadmin_roleTestingMode')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)

          // Security check: ensure this saved state belongs to current user
          if (parsed.userId === user?.uid) {
            // Optional: Check if state is not too old (e.g., 7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            const isExpired = parsed.timestamp && (Date.now() - parsed.timestamp > maxAge)

            if (!isExpired) {
              setRoleSwitcherState({
                originalRole: parsed.originalRole,
                currentRole: parsed.currentRole,
                isTestingMode: parsed.isTestingMode
              })
              console.log('🔄 Restored superadmin role state:', parsed.currentRole)
            } else {
              console.log('⏰ Superadmin role state expired, clearing')
              localStorage.removeItem('superadmin_roleTestingMode')
            }
          } else {
            console.log('🚫 Superadmin role state belongs to different user, clearing')
            localStorage.removeItem('superadmin_roleTestingMode')
          }
        } catch (error) {
          console.error('Error parsing saved role testing state:', error)
          localStorage.removeItem('superadmin_roleTestingMode')
        }
      }
    }
  }, [isSuperAdmin, user?.uid])

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
      label: 'Athlete',
      description: 'Training and content access'
    },
    {
      value: 'creator',
      label: 'Coach',
      description: 'Can create and manage training content'
    },
    {
      value: 'assistant_coach',
      label: 'Assistant Coach',
      description: 'Helps coaches manage their content'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Platform administration access'
    },
    {
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full system access with role switching'
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
    ...roleSwitcher
  }
}