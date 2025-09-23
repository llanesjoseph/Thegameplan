'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './use-auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export type UserRole = 'guest' | 'user' | 'creator' | 'assistant_coach' | 'superadmin'

interface RoleSwitcherState {
  originalRole: UserRole | null
  currentRole: UserRole | null
  isTestingMode: boolean
}

export function useRoleSwitcher() {
  const { user } = useAuth()

  // Check for admin role change flag immediately
  const adminRoleChangeFlag = typeof window !== 'undefined' ? localStorage.getItem('admin_role_change_in_progress') : null

  // NUCLEAR OPTION: If admin role change is in progress, return minimal hook immediately
  if (adminRoleChangeFlag) {
    console.log('💥 NUCLEAR: Role switcher completely disabled due to admin role change')
    const frozenRole = (user?.role as UserRole) || 'guest'
    return {
      // State - frozen values
      isSuperAdmin: user?.role === 'superadmin',
      isTestingMode: false,
      originalRole: frozenRole,
      currentRole: frozenRole,
      effectiveRole: frozenRole,

      // Actions - disabled
      switchToRole: () => console.log('💥 NUCLEAR: switchToRole disabled during admin change'),
      resetToOriginalRole: () => console.log('💥 NUCLEAR: resetToOriginalRole disabled during admin change'),
      getAvailableRoles: () => [],

      // Utility - frozen
      canSwitchRoles: false,
      isUpdating: true, // Show as updating to prevent further changes
      _forceUpdate: 0
    }
  }

  const [roleSwitcherState, setRoleSwitcherState] = useState<RoleSwitcherState>({
    originalRole: null,
    currentRole: null,
    isTestingMode: false
  })

  // Force re-render counter to ensure UI updates
  const [forceUpdate, setForceUpdate] = useState(0)

  // Loading state to prevent multiple rapid updates
  const [isUpdating, setIsUpdating] = useState(false)

  // Track if page is unloading to prevent flicker during transitions
  const [isPageUnloading, setIsPageUnloading] = useState(false)

  // Global flag to disable role updates during admin changes
  const [isAdminRoleChange, setIsAdminRoleChange] = useState(false)

  // Page unload detection to prevent flicker during transitions
  useEffect(() => {
    const handleBeforeUnload = () => setIsPageUnloading(true)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPageUnloading(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Check for admin role change flag in localStorage
  useEffect(() => {
    const checkAdminRoleChange = () => {
      const adminChangeFlag = localStorage.getItem('admin_role_change_in_progress')
      console.log('🔍 Checking admin role change flag:', adminChangeFlag)

      if (adminChangeFlag) {
        console.log('🚨 ADMIN ROLE CHANGE DETECTED - Blocking role switcher for 2 seconds')
        setIsAdminRoleChange(true)
        // Clear the flag after a short delay
        setTimeout(() => {
          console.log('⏰ Admin role change timeout - Clearing flag and allowing updates')
          localStorage.removeItem('admin_role_change_in_progress')
          setIsAdminRoleChange(false)
        }, 2000)
      }
    }

    checkAdminRoleChange()

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', checkAdminRoleChange)
    return () => window.removeEventListener('storage', checkAdminRoleChange)
  }, [])

  // Initialize with user's actual role
  useEffect(() => {
    console.log('📊 Role switcher useEffect triggered:', {
      userRole: user?.role,
      userEmail: user?.email,
      isUpdating,
      isPageUnloading,
      isAdminRoleChange,
      currentState: roleSwitcherState
    })

    // Skip updates during role switching operations, page unloading, or admin changes
    if (isUpdating || isPageUnloading || isAdminRoleChange) {
      if (isAdminRoleChange) {
        console.log('🚫 BLOCKING: Role switcher updates blocked due to admin role change')
      } else if (isUpdating) {
        console.log('🚫 BLOCKING: Role switcher updates blocked due to isUpdating')
      } else if (isPageUnloading) {
        console.log('🚫 BLOCKING: Role switcher updates blocked due to page unloading')
      }
      return
    }

    // Add debounce to prevent rapid updates that cause flicker
    const debounceTimeout = setTimeout(() => {
      if (user?.role) {
        console.log('⏱️ Debounce timeout triggered, checking for role update...')
        setRoleSwitcherState(prev => {
          // Only update if role actually changed and we're not in testing mode
          if (prev.originalRole !== user.role && !prev.isTestingMode) {
            console.log('🔄 UPDATING: Role switcher updating from', prev.originalRole, 'to', user.role)
            return {
              ...prev,
              originalRole: user.role as UserRole,
              currentRole: user.role as UserRole
            }
          } else {
            console.log('⏭️ SKIPPING: No role update needed', {
              prevOriginal: prev.originalRole,
              userRole: user.role,
              isTestingMode: prev.isTestingMode
            })
          }
          return prev
        })
      } else {
        console.log('❌ No user role available for update')
      }
    }, 100) // Small debounce to prevent rapid updates

    return () => {
      console.log('🧹 Cleaning up role switcher timeout')
      clearTimeout(debounceTimeout)
    }
  }, [user?.role, user?.email, isUpdating, isPageUnloading, isAdminRoleChange])

  // Check if current user is superadmin
  const isAdmin = user?.role === 'superadmin'

  // Switch to a different role (only for admins)
  const switchToRole = async (role: UserRole) => {
    if (!isAdmin) {
      console.warn('Role switching is only available for admins')
      return
    }

    if (!user?.uid) {
      console.error('No user ID available for role switching')
      return
    }

    if (isUpdating) {
      console.log('⏳ Role switch already in progress, ignoring request')
      return
    }

    setIsUpdating(true)
    console.log('🔄 Switching to role:', role)

    const newState: RoleSwitcherState = {
      originalRole: (roleSwitcherState.originalRole || user?.role) as UserRole,
      currentRole: role,
      isTestingMode: true
    }

    try {
      // Update the user document in Firestore with role testing information
      const userDocRef = doc(db, 'users', user.uid)

      await updateDoc(userDocRef, {
        'admin_roleTest': {
          originalRole: newState.originalRole,
          currentRole: role,
          isTestingMode: true,
          timestamp: Date.now(),
          lastUpdated: new Date().toISOString()
        },
        // Also update the main role field so it persists everywhere
        role: role,
        lastRoleUpdate: new Date().toISOString()
      })

      setRoleSwitcherState(newState)

      // Force UI re-render
      setForceUpdate(prev => prev + 1)

      console.log('✅ Role switched to:', role, 'and saved to database')
    } catch (error) {
      console.error('❌ Failed to save role switch to database:', error)
      // Fallback to localStorage if database fails
      localStorage.setItem('admin_roleTestingMode', JSON.stringify({
        ...newState,
        timestamp: Date.now(),
        userId: user?.uid
      }))

      setRoleSwitcherState(newState)
      setForceUpdate(prev => prev + 1)

      console.log('⚠️ Role switched locally (database failed):', role)
    } finally {
      setIsUpdating(false)
    }
  }

  // Reset to original role
  const resetToOriginalRole = async () => {
    if (!isAdmin) return

    if (!user?.uid) {
      console.error('No user ID available for role reset')
      return
    }

    if (isUpdating) {
      console.log('⏳ Role reset already in progress, ignoring request')
      return
    }

    setIsUpdating(true)
    console.log('🔄 Resetting to original role:', roleSwitcherState.originalRole)

    const originalRole = roleSwitcherState.originalRole || 'admin'

    try {
      // Update the user document in Firestore to reset role
      const userDocRef = doc(db, 'users', user.uid)

      await updateDoc(userDocRef, {
        // Clear the role test data
        'admin_roleTest': null,
        // Restore original role
        role: originalRole,
        lastRoleUpdate: new Date().toISOString()
      })

      setRoleSwitcherState(prev => ({
        ...prev,
        currentRole: prev.originalRole,
        isTestingMode: false
      }))

      // Clear from localStorage as backup
      localStorage.removeItem('admin_roleTestingMode')

      // Force UI re-render
      setForceUpdate(prev => prev + 1)

      console.log('✅ Role reset to:', originalRole, 'and saved to database')
    } catch (error) {
      console.error('❌ Failed to reset role in database:', error)
      // Fallback to local state reset if database fails
      setRoleSwitcherState(prev => ({
        ...prev,
        currentRole: prev.originalRole,
        isTestingMode: false
      }))

      localStorage.removeItem('admin_roleTestingMode')
      setForceUpdate(prev => prev + 1)

      console.log('⚠️ Role reset locally (database failed)')
    } finally {
      setIsUpdating(false)
    }
  }

  // Load testing state from database on mount
  useEffect(() => {
    const loadRoleStateFromDatabase = async () => {
      if (isAdmin && user?.uid) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const roleTestData = userData?.admin_roleTest

            if (roleTestData && roleTestData.isTestingMode) {
              // Check if role test data is not too old (7 days)
              const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
              const isExpired = roleTestData.timestamp && (Date.now() - roleTestData.timestamp > maxAge)

              if (!isExpired) {
                setRoleSwitcherState({
                  originalRole: roleTestData.originalRole,
                  currentRole: roleTestData.currentRole,
                  isTestingMode: roleTestData.isTestingMode
                })
                console.log('🔄 Restored admin role state from database:', roleTestData.currentRole)
              } else {
                console.log('⏰ Admin role state expired, clearing from database')
                // Clear expired data
                await updateDoc(userDocRef, {
                  'admin_roleTest': null,
                  role: 'admin'
                })
              }
            }
          }
        } catch (error) {
          console.error('Error loading role state from database:', error)
          // Fallback to localStorage if database fails
          const savedState = localStorage.getItem('admin_roleTestingMode')
          if (savedState) {
            try {
              const parsed = JSON.parse(savedState)
              if (parsed.userId === user?.uid) {
                setRoleSwitcherState({
                  originalRole: parsed.originalRole,
                  currentRole: parsed.currentRole,
                  isTestingMode: parsed.isTestingMode
                })
                console.log('🔄 Restored admin role state from localStorage fallback')
              }
            } catch (fallbackError) {
              console.error('Error parsing localStorage fallback:', fallbackError)
            }
          }
        }
      }
    }

    loadRoleStateFromDatabase()
  }, [isAdmin, user?.uid])

  // Get the effective role (what the UI should use) - memoized to prevent re-renders
  const effectiveRole = useMemo((): UserRole => {
    // During admin role changes, freeze the current role to prevent flicker
    if (isAdminRoleChange && roleSwitcherState.currentRole) {
      console.log('🔒 Freezing role during admin change:', roleSwitcherState.currentRole)
      return roleSwitcherState.currentRole
    }

    if (!isAdmin) {
      return (user?.role as UserRole) || 'guest'
    }
    return roleSwitcherState.currentRole || (user?.role as UserRole) || 'guest'
  }, [isAdmin, user?.role, roleSwitcherState.currentRole, isAdminRoleChange])

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
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full system access with role switching'
    }
  ]

  return {
    // State
    isAdmin,
    isTestingMode: roleSwitcherState.isTestingMode,
    originalRole: roleSwitcherState.originalRole,
    currentRole: roleSwitcherState.currentRole,
    effectiveRole: effectiveRole,

    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,

    // Utility
    canSwitchRoles: isAdmin,
    isUpdating: isUpdating,

    // Force update counter (causes re-renders when changed)
    _forceUpdate: forceUpdate
  }
}

// Enhanced hook that replaces the original useRole for admins
export function useEnhancedRole() {
  const { user } = useAuth()

  // Check for admin role change flag immediately - nuclear option for enhanced role too
  const adminRoleChangeFlag = typeof window !== 'undefined' ? localStorage.getItem('admin_role_change_in_progress') : null

  if (adminRoleChangeFlag) {
    console.log('💥 NUCLEAR: Enhanced role hook completely disabled due to admin role change')
    const frozenRole = (user?.role as UserRole) || 'guest'
    return {
      role: frozenRole,
      loading: !user,
      // Frozen role switcher values
      isAdmin: user?.role === 'superadmin',
      isTestingMode: false,
      originalRole: frozenRole,
      currentRole: frozenRole,
      effectiveRole: frozenRole,
      switchToRole: () => console.log('💥 NUCLEAR: switchToRole disabled during admin change'),
      resetToOriginalRole: () => console.log('💥 NUCLEAR: resetToOriginalRole disabled during admin change'),
      getAvailableRoles: () => [],
      canSwitchRoles: false,
      isUpdating: true,
      _forceUpdate: 0
    }
  }

  const roleSwitcher = useRoleSwitcher()

  // Add loading state to match original useRole signature
  const loading = !user

  const effectiveRole = roleSwitcher.effectiveRole

  return {
    role: effectiveRole,
    loading,
    ...roleSwitcher
  }
}