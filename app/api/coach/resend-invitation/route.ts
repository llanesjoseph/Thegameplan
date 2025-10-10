/**
 * API endpoint for resending athlete invitations
 * Features:
 * - Robust logging and audit trail
 * - Idempotency protection against rapid resends
 * - Asynchronous email delivery
 * - Rate limiting per invitation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendAthleteInvitationEmail, sendCoachNotificationEmail } from '@/lib/email-service'
import { auditLog } from '@/lib/audit-logger'

// Rate limiting store for invitation resends
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of resendAttempts.entries()) {
    if (now - value.lastAttempt > 300000) { // 5 minutes
      resendAttempts.delete(key)
    }
  }
}, 300000)

export async function POST(request: NextRequest) {
  const requestId = `resend-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await auditLog('resend_invitation_unauthorized', {
        requestId,
        error: 'Missing authorization header',
        timestamp: new Date().toISOString()
      }, { severity: 'high' })

      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      await auditLog('resend_invitation_invalid_token', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { severity: 'high' })

      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      await auditLog('resend_invitation_user_not_found', {
        requestId,
        userId: uid,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'medium' })

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      await auditLog('resend_invitation_forbidden', {
        requestId,
        userId: uid,
        userRole,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'medium' })

      return NextResponse.json(
        { error: 'Only coaches can resend invitations' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Missing required field: invitationId' },
        { status: 400 }
      )
    }

    // 4. Fetch invitation from Firestore
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      await auditLog('resend_invitation_not_found', {
        requestId,
        userId: uid,
        invitationId,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'medium' })

      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data()

    // Safety check for invitation data
    if (!invitationData) {
      await auditLog('resend_invitation_invalid_data', {
        requestId,
        userId: uid,
        invitationId,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'high' })

      return NextResponse.json(
        { error: 'Invalid invitation data' },
        { status: 500 }
      )
    }

    // 5. Verify ownership (coach can only resend their own invitations, unless admin)
    if (invitationData.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      await auditLog('resend_invitation_ownership_violation', {
        requestId,
        userId: uid,
        invitationId,
        actualCreatorUid: invitationData.creatorUid,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'high' })

      return NextResponse.json(
        { error: 'You can only resend your own invitations' },
        { status: 403 }
      )
    }

    // 6. Check if invitation is already accepted
    if (invitationData.status === 'accepted' || invitationData.used) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // 7. IDEMPOTENCY CHECK - Prevent rapid resends
    const rateLimitKey = `${invitationId}:${uid}`
    const now = Date.now()
    const rateLimitWindow = 60000 // 1 minute
    const maxResends = 2 // Max 2 resends per minute

    const currentAttempt = resendAttempts.get(rateLimitKey)

    if (currentAttempt) {
      const timeSinceLastAttempt = now - currentAttempt.lastAttempt

      if (timeSinceLastAttempt < rateLimitWindow) {
        if (currentAttempt.count >= maxResends) {
          await auditLog('resend_invitation_rate_limited', {
            requestId,
            userId: uid,
            invitationId,
            attempts: currentAttempt.count,
            timestamp: new Date().toISOString()
          }, { userId: uid, severity: 'medium' })

          return NextResponse.json(
            {
              error: 'Too many resend attempts. Please wait 1 minute before trying again.',
              retryAfter: Math.ceil((rateLimitWindow - timeSinceLastAttempt) / 1000)
            },
            { status: 429 }
          )
        }

        currentAttempt.count++
        currentAttempt.lastAttempt = now
      } else {
        // Reset counter after rate limit window
        currentAttempt.count = 1
        currentAttempt.lastAttempt = now
      }
    } else {
      resendAttempts.set(rateLimitKey, { count: 1, lastAttempt: now })
    }

    // 8. Get coach information
    const coachDoc = await adminDb.collection('users').doc(invitationData.creatorUid).get()
    const coachData = coachDoc.data()
    const coachName = coachData?.displayName || 'Coach'
    const coachEmail = coachData?.email || ''

    // 9. Update invitation with resend timestamp
    const resendTimestamp = new Date().toISOString()
    await adminDb.collection('invitations').doc(invitationId).update({
      lastResendAt: resendTimestamp,
      resendCount: (invitationData.resendCount || 0) + 1,
      status: 'pending' // Reset to pending if it was expired
    })

    // 10. Send email asynchronously (Resend handles queuing internally)
    let emailSent = false
    let emailError = null
    let emailId = null

    try {
      const emailResult = await sendAthleteInvitationEmail({
        to: invitationData.athleteEmail,
        athleteName: invitationData.athleteName,
        coachName,
        sport: invitationData.sport,
        invitationUrl: invitationData.invitationUrl,
        qrCodeUrl: invitationData.qrCodeUrl,
        customMessage: invitationData.customMessage,
        expiresAt: invitationData.expiresAt
      })

      if (emailResult.success) {
        emailSent = true
        emailId = emailResult.data?.id
        console.log(`✅ Resent invitation email to ${invitationData.athleteEmail} (${emailId})`)
      } else {
        emailError = emailResult.error
        console.error(`❌ Failed to resend email to ${invitationData.athleteEmail}:`, emailError)
      }
    } catch (error: any) {
      emailError = error.message || 'Unknown email error'
      console.error('Error sending resend email:', error)
    }

    // 11. Update invitation with email status
    await adminDb.collection('invitations').doc(invitationId).update({
      lastEmailSentAt: emailSent ? resendTimestamp : null,
      lastEmailError: emailError
    })

    // 12. Comprehensive audit logging
    await auditLog('resend_invitation_success', {
      requestId,
      userId: uid,
      invitationId,
      athleteEmail: invitationData.athleteEmail,
      athleteName: invitationData.athleteName,
      sport: invitationData.sport,
      emailSent,
      emailId,
      emailError,
      resendCount: (invitationData.resendCount || 0) + 1,
      timestamp: resendTimestamp
    }, { userId: uid, severity: 'low' })

    // 13. Send notification to coach if email succeeded
    if (emailSent && coachEmail) {
      try {
        // Don't await - fire and forget
        sendCoachNotificationEmail({
          to: coachEmail,
          coachName,
          type: 'invitation_sent',
          invitationsSummary: {
            totalSent: 1,
            athleteNames: [invitationData.athleteName],
            sport: invitationData.sport
          }
        }).catch(err => console.error('Failed to send coach notification:', err))
      } catch (error) {
        // Don't fail the request if notification fails
        console.error('Failed to send coach notification:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invitationId,
        athleteEmail: invitationData.athleteEmail,
        athleteName: invitationData.athleteName,
        emailSent,
        emailId,
        emailError,
        resendCount: (invitationData.resendCount || 0) + 1,
        timestamp: resendTimestamp
      }
    })

  } catch (error: any) {
    console.error('Resend invitation error:', error)

    await auditLog('resend_invitation_error', {
      requestId,
      error: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return NextResponse.json(
      { error: 'Failed to resend invitation', details: error.message },
      { status: 500 }
    )
  }
}
