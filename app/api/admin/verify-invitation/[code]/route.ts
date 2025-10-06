/**
 * API endpoint for verifying admin invitations
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    // Find invitation by code
    const invitationsSnapshot = await adminDb
      .collection('admin_invitations')
      .where('code', '==', code)
      .limit(1)
      .get()

    if (invitationsSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitationDoc = invitationsSnapshot.docs[0]
    const invitation = invitationDoc.data()

    // Check if already used
    if (invitation.status === 'used') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Check if expired
    const now = Timestamp.now()
    if (invitation.expiresAt && invitation.expiresAt.seconds < now.seconds) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Return invitation data
    return NextResponse.json({
      success: true,
      data: {
        code: invitation.code,
        recipientName: invitation.recipientName,
        recipientEmail: invitation.recipientEmail,
        role: invitation.role,
        customMessage: invitation.customMessage || '',
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdByName: invitation.createdByName
      }
    })
  } catch (error: any) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify invitation', details: error.message },
      { status: 500 }
    )
  }
}
