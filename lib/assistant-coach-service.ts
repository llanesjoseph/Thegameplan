/**
 * Assistant Coach Management Service
 * Handles invitation, assignment, and management of assistant coaches
 */

import { collection, doc, getDoc, setDoc, getDocs, query, where, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore'
import { db } from './firebase.client'
import { UserRoleData, updateUserRoleLocal } from './role-management'

export interface AssistantCoachInvitation {
  id: string
  coachId: string
  coachName: string
  coachEmail: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: any
  respondedAt?: any
  expiresAt: any
  message?: string
}

export interface AssistantCoachAssignment {
  id: string
  assistantCoachId: string
  assistantCoachEmail: string
  assistantCoachName: string
  coachId: string
  coachName: string
  coachEmail: string
  assignedAt: any
  permissions: {
    canViewCoachingRequests: boolean
    canRespondToRequests: boolean
    canManageSchedule: boolean
    canOrganizeContent: boolean
    canManageAthletes: boolean
  }
  isActive: boolean
}

/**
 * Invite an assistant coach
 */
export async function inviteAssistantCoach(
  coachId: string,
  coachName: string,
  coachEmail: string,
  inviteeEmail: string,
  message?: string
): Promise<string> {
  try {
    // Check if invitation already exists
    const existingInvitation = await getExistingInvitation(coachId, inviteeEmail)
    if (existingInvitation && existingInvitation.status === 'pending') {
      throw new Error('An invitation is already pending for this email')
    }

    // Create expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation: Omit<AssistantCoachInvitation, 'id'> = {
      coachId,
      coachName,
      coachEmail,
      inviteeEmail,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: expiresAt,
      message: message || `${coachName} has invited you to be their assistant coach on Game Plan.`
    }

    const docRef = await addDoc(collection(db, 'assistantCoachInvitations'), invitation)

    // TODO: Send email notification to invitee
    console.log(`Assistant coach invitation sent to ${inviteeEmail}`)

    return docRef.id
  } catch (error) {
    console.error('Error inviting assistant coach:', error)
    throw error
  }
}

/**
 * Accept an assistant coach invitation
 */
export async function acceptAssistantCoachInvitation(
  invitationId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    // Get the invitation
    const invitationDoc = await getDoc(doc(db, 'assistantCoachInvitations', invitationId))
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found')
    }

    const invitation = invitationDoc.data() as AssistantCoachInvitation

    // Validate invitation
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid')
    }

    if (invitation.inviteeEmail !== userEmail) {
      throw new Error('This invitation is not for your email address')
    }

    if (new Date() > invitation.expiresAt.toDate()) {
      throw new Error('Invitation has expired')
    }

    // Update user role to assistant
    await updateUserRoleLocal(userId, 'assistant', {
      assignedCoachId: invitation.coachId
    })

    // Create assignment record
    const assignment: Omit<AssistantCoachAssignment, 'id'> = {
      assistantCoachId: userId,
      assistantCoachEmail: userEmail,
      assistantCoachName: userName,
      coachId: invitation.coachId,
      coachName: invitation.coachName,
      coachEmail: invitation.coachEmail,
      assignedAt: serverTimestamp(),
      permissions: {
        canViewCoachingRequests: true,
        canRespondToRequests: true,
        canManageSchedule: true,
        canOrganizeContent: true,
        canManageAthletes: true
      },
      isActive: true
    }

    await addDoc(collection(db, 'assistantCoachAssignments'), assignment)

    // Update invitation status
    await setDoc(doc(db, 'assistantCoachInvitations', invitationId), {
      status: 'accepted',
      respondedAt: serverTimestamp()
    }, { merge: true })

    console.log(`Assistant coach assignment created for ${userName} -> ${invitation.coachName}`)
  } catch (error) {
    console.error('Error accepting assistant coach invitation:', error)
    throw error
  }
}

/**
 * Decline an assistant coach invitation
 */
export async function declineAssistantCoachInvitation(invitationId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'assistantCoachInvitations', invitationId), {
      status: 'declined',
      respondedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error declining assistant coach invitation:', error)
    throw error
  }
}

/**
 * Get coach's assistant coaches
 */
export async function getCoachAssistants(coachId: string): Promise<AssistantCoachAssignment[]> {
  try {
    const q = query(
      collection(db, 'assistantCoachAssignments'),
      where('coachId', '==', coachId),
      where('isActive', '==', true)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssistantCoachAssignment[]
  } catch (error) {
    console.error('Error fetching coach assistants:', error)
    return []
  }
}

/**
 * Get assistant coach's assignments
 */
export async function getAssistantCoachAssignments(assistantCoachId: string): Promise<AssistantCoachAssignment[]> {
  try {
    const q = query(
      collection(db, 'assistantCoachAssignments'),
      where('assistantCoachId', '==', assistantCoachId),
      where('isActive', '==', true)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssistantCoachAssignment[]
  } catch (error) {
    // This is expected in development when Firestore security rules block access
    console.warn('Could not fetch assistant coach assignments (likely due to Firestore permissions):', error)
    return []
  }
}

/**
 * Remove assistant coach assignment
 */
export async function removeAssistantCoach(assignmentId: string, assistantCoachId: string): Promise<void> {
  try {
    // Deactivate assignment
    await setDoc(doc(db, 'assistantCoachAssignments', assignmentId), {
      isActive: false,
      removedAt: serverTimestamp()
    }, { merge: true })

    // Check if assistant coach has other active assignments
    const otherAssignments = await getAssistantCoachAssignments(assistantCoachId)

    // If no other assignments, revert user to regular user role
    if (otherAssignments.length <= 1) { // <= 1 because current assignment is being deactivated
      await updateUserRoleLocal(assistantCoachId, 'user', {
        assignedCoachId: undefined
      })
    }

    console.log(`Assistant coach assignment ${assignmentId} removed`)
  } catch (error) {
    console.error('Error removing assistant coach:', error)
    throw error
  }
}

/**
 * Get pending invitations for an email
 */
export async function getPendingInvitations(email: string): Promise<AssistantCoachInvitation[]> {
  try {
    const q = query(
      collection(db, 'assistantCoachInvitations'),
      where('inviteeEmail', '==', email),
      where('status', '==', 'pending')
    )

    const querySnapshot = await getDocs(q)
    const invitations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssistantCoachInvitation[]

    // Filter out expired invitations
    const validInvitations = invitations.filter(inv =>
      new Date() <= inv.expiresAt.toDate()
    )

    // Mark expired invitations
    const expiredInvitations = invitations.filter(inv =>
      new Date() > inv.expiresAt.toDate()
    )

    for (const expired of expiredInvitations) {
      await setDoc(doc(db, 'assistantCoachInvitations', expired.id), {
        status: 'expired'
      }, { merge: true })
    }

    return validInvitations
  } catch (error) {
    console.error('Error fetching pending invitations:', error)
    return []
  }
}

/**
 * Check if invitation already exists
 */
async function getExistingInvitation(coachId: string, inviteeEmail: string): Promise<AssistantCoachInvitation | null> {
  try {
    const q = query(
      collection(db, 'assistantCoachInvitations'),
      where('coachId', '==', coachId),
      where('inviteeEmail', '==', inviteeEmail),
      where('status', '==', 'pending')
    )

    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as AssistantCoachInvitation
  } catch (error) {
    console.error('Error checking existing invitation:', error)
    return null
  }
}

/**
 * Update assistant coach permissions
 */
export async function updateAssistantCoachPermissions(
  assignmentId: string,
  permissions: Partial<AssistantCoachAssignment['permissions']>
): Promise<void> {
  try {
    await setDoc(doc(db, 'assistantCoachAssignments', assignmentId), {
      permissions: permissions,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error updating assistant coach permissions:', error)
    throw error
  }
}