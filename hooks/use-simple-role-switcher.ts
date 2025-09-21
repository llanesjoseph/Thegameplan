'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './use-auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export type UserRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach'

interface SimpleRoleState {
  originalRole: UserRole
  currentRole: UserRole
  isTestingMode: boolean
}

export function useSimpleRoleSwitcher() {
  const { user } = useAuth()

  // Initialize with user's actual role immediately - no null state
  const initialRole = (user?.role as UserRole) || 'guest'

  const [state, setState] = useState<SimpleRoleState>({
    originalRole: initialRole,
    currentRole: initialRole,
    isTestingMode: false
  })

  const [isUpdating, setIsUpdating] = useState(false)

  // Only update when user's role actually changes (not on every render)
  useEffect(() => {
    if (user?.role && user.role !== state.originalRole && !state.isTestingMode) {
      console.log('👤 User role changed, updating role switcher:', user.role)
      setState({
        originalRole: user.role as UserRole,
        currentRole: user.role as UserRole,
        isTestingMode: false
      })
    }
  }, [user?.role]) // Only depend on user.role, not state

  const isSuperAdmin = user?.role === 'superadmin'

  // Switch to a different role (only for super admins)
  const switchToRole = async (role: UserRole) => {
    if (!isSuperAdmin || !user?.uid || isUpdating) return

    setIsUpdating(true)
    console.log('🔄 Switching to role:', role)

    try {
      const userDocRef = doc(db, 'users', user.uid)

      await updateDoc(userDocRef, {
        'superadmin_roleTest': {
          originalRole: state.originalRole,
          currentRole: role,
          isTestingMode: true,
          timestamp: Date.now(),
        },
        role: role,
        lastRoleUpdate: new Date().toISOString()
      })

      setState({
        originalRole: state.originalRole,
        currentRole: role,
        isTestingMode: true
      })

      console.log('✅ Role switched to:', role)
    } catch (error) {
      console.error('❌ Failed to switch role:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Reset to original role
  const resetToOriginalRole = async () => {
    if (!isSuperAdmin || !user?.uid || isUpdating) return

    setIsUpdating(true)
    console.log('🔄 Resetting to original role:', state.originalRole)

    try {
      const userDocRef = doc(db, 'users', user.uid)

      await updateDoc(userDocRef, {
        'superadmin_roleTest': null,
        role: state.originalRole,
        lastRoleUpdate: new Date().toISOString()
      })

      setState({
        originalRole: state.originalRole,
        currentRole: state.originalRole,
        isTestingMode: false
      })

      console.log('✅ Role reset to:', state.originalRole)
    } catch (error) {
      console.error('❌ Failed to reset role:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Load testing state from database on mount (only once)
  useEffect(() => {
    if (!isSuperAdmin || !user?.uid) return

    const loadRoleState = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const roleTestData = userData?.superadmin_roleTest

          if (roleTestData && roleTestData.isTestingMode) {
            // Check if role test data is not too old (7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000
            const isExpired = roleTestData.timestamp && (Date.now() - roleTestData.timestamp > maxAge)

            if (!isExpired) {
              setState({
                originalRole: roleTestData.originalRole,
                currentRole: roleTestData.currentRole,
                isTestingMode: true
              })
              console.log('🔄 Restored role state from database:', roleTestData.currentRole)
            } else {
              // Clear expired data
              await updateDoc(userDocRef, {
                'superadmin_roleTest': null,
                role: 'superadmin'
              })
            }
          }
        }
      } catch (error) {
        console.error('Error loading role state:', error)
      }
    }

    loadRoleState()
  }, [isSuperAdmin, user?.uid]) // Only run when these change

  // Get the effective role (what the UI should use)
  const effectiveRole = useMemo((): UserRole => {
    if (!isSuperAdmin) {
      return initialRole
    }
    return state.currentRole
  }, [isSuperAdmin, state.currentRole, initialRole])

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
    isTestingMode: state.isTestingMode,
    originalRole: state.originalRole,
    currentRole: state.currentRole,
    effectiveRole,

    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,

    // Utility
    canSwitchRoles: isSuperAdmin,
    isUpdating,
    _forceUpdate: 0 // For compatibility
  }
}

// Enhanced hook that provides the same interface as before
export function useSimpleEnhancedRole() {
  const { user } = useAuth()
  const roleSwitcher = useSimpleRoleSwitcher()

  const loading = !user

  return {
    role: roleSwitcher.effectiveRole,
    loading,
    ...roleSwitcher
  }
}