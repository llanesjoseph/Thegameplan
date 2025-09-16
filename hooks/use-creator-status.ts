/**
 * Hook for managing creator status and application workflow
 */

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
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

      // Fetch role data and application status in parallel
      const [roleData, applicationStatus] = await Promise.all([
        getUserRole(user.uid),
        getCreatorApplicationStatus(user.uid)
      ])

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
      setStatusData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
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
 */
export function useCreatorDashboardAccess() {
  const { 
    canCreate, 
    isApprovedCreator, 
    hasPendingApplication, 
    loading, 
    roleData 
  } = useCreatorStatus()

  const getAccessStatus = () => {
    if (loading) return 'loading'
    
    // If user has creator role, they're approved regardless of creatorStatus
    if (roleData?.role === 'creator') return 'approved'
    
    // Check for pending applications only if not already a creator
    if (hasPendingApplication) return 'pending'
    
    // If no role data or guest role, they haven't applied
    if (!roleData || roleData.role === 'guest') return 'not-applied'
    
    // If they have creatorStatus but it's rejected
    if (roleData.creatorStatus === 'rejected') return 'rejected'
    
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
    canAccess: roleData?.role === 'creator', // Direct check for creator role
    canApply: !hasPendingApplication && roleData?.role !== 'creator',
    loading
  }
}
