/**
 * Role Management Service
 * Integrates with Firebase Functions for role-based access control
 */

import { User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.client'

export type UserRole = 'guest' | 'user' | 'creator' | 'coach' | 'assistant' | 'admin' | 'superadmin'

export interface UserRoleData {
  role: UserRole
  lastUpdatedAt: any
  applicationId?: string
  approvedAt?: any
  approvedBy?: string
  creatorStatus?: 'pending' | 'approved' | 'suspended' | 'rejected'
  permissions?: {
    canCreateContent: boolean
    canManageContent: boolean
    canAccessAnalytics: boolean
    canReceivePayments: boolean
    canSwitchRoles?: boolean
    canManageUsers?: boolean
    canViewCoachingRequests?: boolean
    canRespondToRequests?: boolean
    canManageSchedule?: boolean
    canOrganizeContent?: boolean
    canManageAthletes?: boolean
  }
  assignedCoachId?: string // for assistant coaches
}

export interface CreatorApplicationStatus {
  applicationId: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: any
  reviewedAt?: any
  reviewerNotes?: string
  userData?: UserRoleData
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(userId: string): Promise<UserRoleData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return userDoc.data() as UserRoleData
    }
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Update user role locally (Firebase Functions will handle the authoritative update)
 */
export async function updateUserRoleLocal(
  userId: string, 
  role: UserRole, 
  additionalData?: Partial<UserRoleData>
): Promise<void> {
  try {
    const roleData: UserRoleData = {
      role,
      lastUpdatedAt: serverTimestamp(),
      permissions: getDefaultPermissions(role),
      ...additionalData
    }
    
    await setDoc(doc(db, 'users', userId), roleData, { merge: true })
  } catch (error) {
    console.error('Error updating user role locally:', error)
    throw error
  }
}

/**
 * Call Firebase Function to update user role (requires admin privileges)
 */
export async function setUserRoleViaFunction(
  uid: string,
  email: string,
  role: UserRole,
  adminSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/set-user-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret
      },
      body: JSON.stringify({ uid, email, role })
    })

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Unknown error' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error calling setUserRole function:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Check if user has permission to create content
 */
export function canCreateContent(roleData: UserRoleData | null): boolean {
  if (!roleData) return false

  return roleData.role === 'creator' ||
         roleData.role === 'admin' ||
         roleData.role === 'superadmin' ||
         roleData.permissions?.canCreateContent === true
}

/**
 * Check if user has admin privileges (full site management access)
 */
export function isAdmin(roleData: UserRoleData | null): boolean {
  if (!roleData) return false
  return roleData.role === 'admin' || roleData.role === 'superadmin'
}

/**
 * Check if user can switch roles (admin capability)
 */
export function canSwitchRoles(roleData: UserRoleData | null): boolean {
  if (!roleData) return false
  return (roleData.role === 'admin' || roleData.role === 'superadmin') && roleData.permissions?.canSwitchRoles !== false
}

/**
 * Check if user is a creator
 */
export function isCreator(roleData: UserRoleData | null): boolean {
  if (!roleData) return false
  // If user has creator role, they are a creator regardless of creatorStatus
  return roleData.role === 'creator'
}

/**
 * Check if user is an assistant coach
 */
export function isAssistantCoach(roleData: UserRoleData | null): boolean {
  if (!roleData) return false
  return roleData.role === 'assistant'
}

/**
 * Check if user can manage coaching requests (creator or assistant)
 */
export function canManageCoachingRequests(roleData: UserRoleData | null): boolean {
  if (!roleData) return false

  return roleData.role === 'creator' ||
         roleData.role === 'assistant' ||
         roleData.role === 'admin' ||
         roleData.role === 'superadmin' ||
         roleData.permissions?.canViewCoachingRequests === true
}

/**
 * Check if user has pending creator application
 */
export function hasPendingCreatorApplication(roleData: UserRoleData | null): boolean {
  if (!roleData) return false
  // Only show pending status if user is not already a creator
  return roleData.creatorStatus === 'pending' && roleData.role !== 'creator'
}

/**
 * Get default permissions for a role
 */
function getDefaultPermissions(role: UserRole) {
  switch (role) {
    case 'creator':
      return {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true,
        canViewCoachingRequests: true,
        canRespondToRequests: true,
        canManageSchedule: true,
        canOrganizeContent: true,
        canManageAthletes: true
      }
    case 'assistant':
      return {
        canCreateContent: false,
        canManageContent: false,
        canAccessAnalytics: true, // read-only
        canReceivePayments: false,
        canViewCoachingRequests: true,
        canRespondToRequests: true, // with coach oversight
        canManageSchedule: true,
        canOrganizeContent: true,
        canManageAthletes: true // limited scope
      }
    case 'admin':
    case 'superadmin':
      return {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true,
        canSwitchRoles: true,
        canManageUsers: true,
        canViewCoachingRequests: true,
        canRespondToRequests: true,
        canManageSchedule: true,
        canOrganizeContent: true,
        canManageAthletes: true
      }
    case 'user':
      return {
        canCreateContent: false,
        canManageContent: false,
        canAccessAnalytics: false,
        canReceivePayments: false,
        canViewCoachingRequests: false,
        canRespondToRequests: false,
        canManageSchedule: false,
        canOrganizeContent: false,
        canManageAthletes: false
      }
    default:
      return {
        canCreateContent: false,
        canManageContent: false,
        canAccessAnalytics: false,
        canReceivePayments: false,
        canViewCoachingRequests: false,
        canRespondToRequests: false,
        canManageSchedule: false,
        canOrganizeContent: false,
        canManageAthletes: false
      }
  }
}

/**
 * Get creator application status
 */
export async function getCreatorApplicationStatus(userId: string): Promise<CreatorApplicationStatus | null> {
  try {
    // First check if user has an approved role
    const roleData = await getUserRole(userId)
    
    if (roleData && roleData.role === 'creator') {
      return {
        applicationId: roleData.applicationId || '',
        status: 'approved',
        submittedAt: null,
        reviewedAt: roleData.approvedAt,
        userData: roleData
      }
    }

    // Check for pending applications
    // This would typically query the contributorApplications collection
    // Implementation depends on your specific data structure
    
    return null
  } catch (error) {
    console.error('Error fetching creator application status:', error)
    return null
  }
}

/**
 * Apply for creator role
 */
export async function applyForCreatorRole(userId: string, applicationData: any): Promise<string> {
  try {
    // Update user status to pending
    await updateUserRoleLocal(userId, 'user', {
      creatorStatus: 'pending',
      applicationId: applicationData.id
    })

    return applicationData.id
  } catch (error) {
    console.error('Error applying for creator role:', error)
    throw error
  }
}
