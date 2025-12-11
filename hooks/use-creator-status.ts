/**
 * Hook for managing coach status and application workflow
 */

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { useUrlEnhancedRole } from './use-url-role-switcher'
import {
  getUserRole,
  getCreatorApplicationStatus,
  canCreateContent,
  isCreator,
  hasPendingCreatorApplication,
  UserRoleData,
  CreatorApplicationStatus
} from '@/lib/role-management'

export interface CreatorStatusData {
  roleData: UserRoleData | null
  applicationStatus: CreatorApplicationStatus | null
  canCreate: boolean
  isApprovedCreator: boolean
  hasPendingApplication: boolean
  loading: boolean
  error: string | null
}

export function useCreatorStatus() {
  const { user, loading: authLoading } = useAuth()
  const [statusData, setStatusData] = useState<CreatorStatusData>({
    roleData: null,
    applicationStatus: null,
    canCreate: false,
    isApprovedCreator: false,
    hasPendingApplication: false,
    loading: true,
    error: null
  })

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (statusData.loading) {
        console.warn('Creator status loading timeout - forcing state to resolve')
        setStatusData(prev => ({
          ...prev,
          loading: false,
          error: 'Loading timeout'
        }))
      }
    }, 12000) // 12 second timeout

    return () => clearTimeout(timeout)
  }, [statusData.loading])

  const refreshStatus = async () => {
    if (!user?.uid) {
      setStatusData({
        roleData: null,
        applicationStatus: null,
        canCreate: false,
        isApprovedCreator: false,
        hasPendingApplication: false,
        loading: false,
        error: null
      })
      return
    }

    try {
      setStatusData(prev => ({ ...prev, loading: true, error: null }))

      // Fetch role data and application status in parallel with timeout
      const statusPromise = Promise.all([
        getUserRole(user.uid),
        getCreatorApplicationStatus(user.uid)
      ])

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Status check timeout')), 10000)
      )

      const [roleData, applicationStatus] = await Promise.race([statusPromise, timeoutPromise])

      setStatusData({
        roleData,
        applicationStatus,
        canCreate: canCreateContent(roleData),
        isApprovedCreator: isCreator(roleData),
        hasPendingApplication: hasPendingCreatorApplication(roleData),
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching creator status:', error)
      // Set default values on timeout/error so page doesn't hang
      setStatusData({
        roleData: null,
        applicationStatus: null,
        canCreate: false,
        isApprovedCreator: false,
        hasPendingApplication: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  useEffect(() => {
    if (!authLoading) {
      refreshStatus()
    }
  }, [user?.uid, authLoading])

  return {
    ...statusData,
    refreshStatus
  }
}

/**
 * Hook for creator dashboard access control
 * Updated to use the enhanced role system for consistency with UI
 */
export function useCreatorDashboardAccess() {
  // Use the enhanced role system for consistency with UI components
  const { role, loading: roleLoading } = useUrlEnhancedRole()

  const {
    hasPendingApplication,
    loading: statusLoading,
    roleData
  } = useCreatorStatus()

  const loading = roleLoading || statusLoading

  const getAccessStatus = () => {
    if (loading) return 'loading'

    // If user has creator, coach, assistant, or superadmin role (using enhanced role for consistency), they're approved
    if (role === 'creator' || role === 'coach' || role === 'assistant' || role === 'superadmin') return 'approved'

    // Check for pending applications only if not already a creator/coach/assistant/superadmin
    if (hasPendingApplication) return 'pending'

    // If guest role, they haven't applied
    if (role === 'guest') return 'not-applied'

    // If they have creatorStatus but it's rejected
    if (roleData?.creatorStatus === 'rejected') return 'rejected'

    return 'not-applied'
  }

  const getAccessMessage = () => {
    const status = getAccessStatus()

    switch (status) {
      case 'loading':
        return 'Checking your creator status...'
      case 'approved':
        return 'Welcome to your creator dashboard!'
      case 'pending':
        return 'Your creator application is under review. You\'ll be notified once it\'s processed.'
      case 'not-applied':
        return 'Apply to become a creator to access this dashboard.'
      case 'rejected':
        return 'Your creator application was not approved. Please contact support for more information.'
      default:
        return 'Unable to determine creator status.'
    }
  }

  return {
    accessStatus: getAccessStatus(),
    accessMessage: getAccessMessage(),
    canAccess: role === 'creator' || role === 'coach' || role === 'assistant' || role === 'superadmin', // Use enhanced role for consistency
    canApply: !hasPendingApplication && role !== 'creator' && role !== 'coach' && role !== 'assistant' && role !== 'superadmin',
    loading
  }
}
