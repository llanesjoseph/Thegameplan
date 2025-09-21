'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from './use-auth'
import { useMemo } from 'react'

export type UserRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach'

export function useUrlRoleSwitcher() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get the view-as parameter from URL
  const urlRole = searchParams.get('view-as') as UserRole

  // Get user's actual role
  const actualRole = (user?.role as UserRole) || 'guest'
  const isSuperAdmin = actualRole === 'superadmin'

  // Determine effective role: URL role (if superadmin) or actual role
  const effectiveRole = useMemo((): UserRole => {
    if (!isSuperAdmin) {
      return actualRole
    }

    // If superadmin and URL has valid role, use that
    if (urlRole && ['guest', 'user', 'creator', 'admin', 'superadmin', 'assistant_coach'].includes(urlRole)) {
      return urlRole
    }

    // Default to actual role
    return actualRole
  }, [isSuperAdmin, urlRole, actualRole])

  // Check if currently testing a role
  const isTestingMode = isSuperAdmin && urlRole && urlRole !== actualRole

  // Switch to a different role (only for super admins)
  const switchToRole = (role: UserRole) => {
    if (!isSuperAdmin) {
      console.warn('Role switching is only available for super admins')
      return
    }

    // Create new URL with view-as parameter
    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (role === actualRole) {
      // Remove view-as parameter if switching back to actual role
      newSearchParams.delete('view-as')
    } else {
      newSearchParams.set('view-as', role)
    }

    const newUrl = `${pathname}?${newSearchParams.toString()}`
    console.log('🔄 Switching to role via URL:', role, '→', newUrl)

    // Use replace to avoid adding to browser history
    router.replace(newUrl)
  }

  // Reset to original role
  const resetToOriginalRole = () => {
    if (!isSuperAdmin) return

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('view-as')

    const newUrl = pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '')
    console.log('🔄 Resetting to original role via URL:', actualRole)

    router.replace(newUrl)
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
    isTestingMode,
    originalRole: actualRole,
    currentRole: effectiveRole,
    effectiveRole,

    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,

    // Utility
    canSwitchRoles: isSuperAdmin,
    isUpdating: false, // No loading states with URL approach
    _forceUpdate: 0
  }
}

// Enhanced hook that provides the same interface as before
export function useUrlEnhancedRole() {
  const { user } = useAuth()
  const roleSwitcher = useUrlRoleSwitcher()

  const loading = !user

  return {
    role: roleSwitcher.effectiveRole,
    loading,
    ...roleSwitcher
  }
}