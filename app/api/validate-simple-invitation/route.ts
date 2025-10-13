import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const invitationId = url.searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Check if this is a simple invitation ID (starts with 'inv_')
    if (!invitationId.startsWith('inv_')) {
      return NextResponse.json(
        { error: 'Invalid invitation format' },
        { status: 400 }
      )
    }

    // For simple invitations, we'll validate the format and return basic data
    // In a full implementation, you'd check this against a database
    const isValidFormat = /^inv_\d{13}_[a-z0-9]{9}$/.test(invitationId)

    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Invalid invitation ID format' },
        { status: 400 }
      )
    }

    // Check if invitation exists in Firestore and has been used
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (invitationDoc.exists) {
      const invitationData = invitationDoc.data()

      // CRITICAL: Verify this is a coach/assistant/creator invitation
      const targetRole = invitationData?.role
      if (targetRole && !['coach', 'assistant', 'creator'].includes(targetRole)) {
        return NextResponse.json({
          success: false,
          error: `This invitation is for a ${targetRole} account, not a coach account. Please use the correct invitation link.`,
          wrongType: true,
          correctType: targetRole
        }, { status: 400 })
      }

      // Check if already used
      if (invitationData?.used) {
        return NextResponse.json({
          success: false,
          alreadyUsed: true,
          shouldRedirect: true,
          redirectTo: '/sign-in',
          message: 'This invitation has already been used. Your account was created successfully. Redirecting to sign in...',
          userEmail: invitationData?.email
        })
      }
    }

    // Extract timestamp to check if invitation has expired (30 days)
    const timestamp = parseInt(invitationId.split('_')[1])
    const invitationDate = new Date(timestamp)
    const expirationDate = new Date(timestamp + 30 * 24 * 60 * 60 * 1000) // 30 days
    const now = new Date()

    if (now > expirationDate) {
      return NextResponse.json({
        success: false,
        error: 'This invitation has expired',
        expired: true
      }, { status: 400 })
    }

    // Return validation success with basic invitation data
    return NextResponse.json({
      success: true,
      data: {
        organizationName: 'PLAYBOOKD Coaching Network',
        inviterName: 'PLAYBOOKD Team',
        sport: 'Coaching', // Generic since we don't store this in the simple ID
        description: 'Join our coaching platform',
        customMessage: 'Welcome to PLAYBOOKD! Complete your profile to get started.',
        autoApprove: true, // Simple invitations are auto-approved
        expiresAt: expirationDate.toISOString(),
        usesRemaining: 1,
        metadata: {
          isSimpleInvitation: true,
          invitationId
        }
      }
    })

  } catch (error) {
    console.error('Error validating simple invitation:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}