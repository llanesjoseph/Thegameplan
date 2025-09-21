'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './use-auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

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

  // Loading state to prevent multiple rapid updates
  const [isUpdating, setIsUpdating] = useState(false)

  // Track if page is unloading to prevent flicker during transitions
  const [isPageUnloading, setIsPageUnloading] = useState(false)

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

  // Initialize with user's actual role
  useEffect(() => {
    // Skip updates during role switching operations or page unloading
    if (isUpdating || isPageUnloading) return

    // Add debounce to prevent rapid updates that cause flicker
    const debounceTimeout = setTimeout(() => {
      if (user?.role) {
        setRoleSwitcherState(prev => {
          // Only update if role actually changed and we're not in testing mode
          if (prev.originalRole !== user.role && !prev.isTestingMode) {
            console.log('🔄 Role switcher updating to:', user.role)
            return {
              ...prev,
              originalRole: user.role as UserRole,
              currentRole: user.role as UserRole
            }
          }
          return prev
        })
      }
    }, 100) // Small debounce to prevent rapid updates

    return () => clearTimeout(debounceTimeout)
  }, [user?.role, user?.email, isUpdating, isPageUnloading])

  // Check if current user is super admin
  const isSuperAdmin = user?.role === 'superadmin'

  // Switch to a different role (only for super admins)
  const switchToRole = async (role: UserRole) => {
    if (!isSuperAdmin) {
      console.warn('Role switching is only available for super admins')
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
        'superadmin_roleTest': {
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
      localStorage.setItem('superadmin_roleTestingMode', JSON.stringify({
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
    if (!isSuperAdmin) return

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

    const originalRole = roleSwitcherState.originalRole || 'superadmin'

    try {
      // Update the user document in Firestore to reset role
      const userDocRef = doc(db, 'users', user.uid)

      await updateDoc(userDocRef, {
        // Clear the role test data
        'superadmin_roleTest': null,
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
      localStorage.removeItem('superadmin_roleTestingMode')

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

      localStorage.removeItem('superadmin_roleTestingMode')
      setForceUpdate(prev => prev + 1)

      console.log('⚠️ Role reset locally (database failed)')
    } finally {
      setIsUpdating(false)
    }
  }

  // Load testing state from database on mount
  useEffect(() => {
    const loadRoleStateFromDatabase = async () => {
      if (isSuperAdmin && user?.uid) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            const roleTestData = userData?.superadmin_roleTest

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
                console.log('🔄 Restored superadmin role state from database:', roleTestData.currentRole)
              } else {
                console.log('⏰ Superadmin role state expired, clearing from database')
                // Clear expired data
                await updateDoc(userDocRef, {
                  'superadmin_roleTest': null,
                  role: 'superadmin'
                })
              }
            }
          }
        } catch (error) {
          console.error('Error loading role state from database:', error)
          // Fallback to localStorage if database fails
          const savedState = localStorage.getItem('superadmin_roleTestingMode')
          if (savedState) {
            try {
              const parsed = JSON.parse(savedState)
              if (parsed.userId === user?.uid) {
                setRoleSwitcherState({
                  originalRole: parsed.originalRole,
                  currentRole: parsed.currentRole,
                  isTestingMode: parsed.isTestingMode
                })
                console.log('🔄 Restored superadmin role state from localStorage fallback')
              }
            } catch (fallbackError) {
              console.error('Error parsing localStorage fallback:', fallbackError)
            }
          }
        }
      }
    }

    loadRoleStateFromDatabase()
  }, [isSuperAdmin, user?.uid])

  // Get the effective role (what the UI should use) - memoized to prevent re-renders
  const effectiveRole = useMemo((): UserRole => {
    if (!isSuperAdmin) {
      return (user?.role as UserRole) || 'guest'
    }
    return roleSwitcherState.currentRole || (user?.role as UserRole) || 'guest'
  }, [isSuperAdmin, user?.role, roleSwitcherState.currentRole])

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
    effectiveRole: effectiveRole,
    
    // Actions
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles,
    
    // Utility
    canSwitchRoles: isSuperAdmin,
    isUpdating: isUpdating,

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
  
  // Debug logging to help track role changes (commented out to prevent re-render loops)
  // console.log('🎯 useEnhancedRole:', {
  //   effectiveRole,
  //   isTestingMode: roleSwitcher.isTestingMode,
  //   currentRole: roleSwitcher.currentRole,
  //   originalRole: roleSwitcher.originalRole,
  //   userRole: user?.role
  // })
  
  return {
    role: effectiveRole,
    loading,
    ...roleSwitcher
  }
}