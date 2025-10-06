'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuth } from './use-auth'
import { useMemo } from 'react'

export type UserRole = 'guest' | 'user' | 'athlete' | 'creator' | 'coach' | 'assistant' | 'admin' | 'superadmin'

export function useUrlRoleSwitcher() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Safe searchParams access - returns null during SSR
  let searchParams
  try {
    searchParams = useSearchParams()
  } catch (e) {
    searchParams = null
  }

  // Get the view-as parameter from URL
  const urlRole = searchParams?.get('view-as') as UserRole

  // Get user's actual role
  const actualRole = (user?.role as UserRole) || 'guest'
  const isAdmin = actualRole === 'superadmin'

  // Determine effective role: URL role (if admin) or actual role
  const effectiveRole = useMemo((): UserRole => {
    if (!isAdmin) {
      return actualRole
    }

    // If admin and URL has valid role, use that
    if (urlRole && ['guest', 'user', 'creator', 'coach', 'assistant', 'admin', 'superadmin'].includes(urlRole)) {
      return urlRole
    }

    // Default to actual role
    return actualRole
  }, [isAdmin, urlRole, actualRole])

  // Check if currently testing a role
  const isTestingMode = isAdmin && urlRole && urlRole !== actualRole

  // Switch to a different role (only for admins)
  const switchToRole = (role: UserRole) => {
    if (!isAdmin) {
      console.warn('Role switching is only available for admins')
      return
    }

    // Create new URL with view-as parameter
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '')
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
    if (!isAdmin) return

    const newSearchParams = new URLSearchParams(searchParams?.toString() || '')
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
      label: 'Creator',
      description: 'Can create and manage training content'
    },
    {
      value: 'coach',
      label: 'Coach',
      description: 'Professional coach with athlete management'
    },
    {
      value: 'assistant',
      label: 'Assistant',
      description: 'Assists coaches with training management'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'System administration access'
    },
    {
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full system access with role switching'
    }
  ]

  return {
    // State
    isAdmin,
    isTestingMode,
    originalRole: actualRole,
    currentRole: effectiveRole,
    effectiveRole,

    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,

    // Utility
    canSwitchRoles: isAdmin,
    isUpdating: false, // No loading states with URL approach
    _forceUpdate: 0
  }
}

// Enhanced hook that provides the same interface as before
export function useUrlEnhancedRole() {
  const { user, loading: authLoading } = useAuth()
  const roleSwitcher = useUrlRoleSwitcher()

  // Loading state should check auth loading, not just user presence
  const loading = authLoading

  return {
    role: roleSwitcher.effectiveRole,
    loading,
    ...roleSwitcher
  }
}