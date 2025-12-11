import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail } from '@/lib/email-service'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface StatusUpdateRequest {
  invitationId: string
  status: 'declined' | 'expired'
  athleteInfo?: {
    name: string
    email: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StatusUpdateRequest = await request.json()
    const { invitationId, status, athleteInfo } = body

    if (!invitationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId and status' },
        { status: 400 }
      )
    }

    // Get the invitation from Firestore
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data()

    // Update invitation status
    await adminDb.collection('invitations').doc(invitationId).update({
      status,
      updatedAt: new Date().toISOString()
    })

    // Send notification to coach if they have an email
    if (invitationData?.creatorUid) {
      try {
        // Get coach information
        const coachDoc = await adminDb.collection('users').doc(invitationData.creatorUid).get()
        if (coachDoc.exists) {
          const coachData = coachDoc.data()
          const coachEmail = coachData?.email
          let coachName = coachData?.displayName || 'Coach'

          // If no display name, check creator_profiles
          if (coachName === 'Coach') {
            const creatorDoc = await adminDb.collection('creator_profiles').doc(invitationData.creatorUid).get()
            if (creatorDoc.exists) {
              const creatorData = creatorDoc.data()
              coachName = creatorData?.displayName || 'Coach'
            }
          }

          if (coachEmail) {
            const notificationType = status === 'declined' ? 'invitation_declined' : 'invitation_expired'

            await sendCoachNotificationEmail({
              to: coachEmail,
              coachName,
              type: notificationType,
              athleteInfo: athleteInfo || {
                name: invitationData.athleteName || 'Unknown Athlete',
                email: invitationData.athleteEmail || '',
                sport: invitationData.sport
              }
            })

            console.log(`📧 Coach notification sent to ${coachEmail} - invitation ${status}`)
          }
        }
      } catch (error) {
        console.error('Failed to send coach notification:', error)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation status updated to ${status}`,
      invitationId
    })

  } catch (error) {
    console.error('Invitation status update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update invitation status'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check for expired invitations
export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    // Query for pending invitations that have expired
    const expiredInvitations = await adminDb
      .collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now.toISOString())
      .get()

    let processedCount = 0
    const results = []

    for (const doc of expiredInvitations.docs) {
      const invitationData = doc.data()
      const invitationId = doc.id

      // Update status to expired
      await adminDb.collection('invitations').doc(invitationId).update({
        status: 'expired',
        updatedAt: now.toISOString()
      })

      // Send notification to coach
      if (invitationData.creatorUid) {
        try {
          const coachDoc = await adminDb.collection('users').doc(invitationData.creatorUid).get()
          if (coachDoc.exists) {
            const coachData = coachDoc.data()
            const coachEmail = coachData?.email
            let coachName = coachData?.displayName || 'Coach'

            // If no display name, check creator_profiles
            if (coachName === 'Coach') {
              const creatorDoc = await adminDb.collection('creator_profiles').doc(invitationData.creatorUid).get()
              if (creatorDoc.exists) {
                const creatorData = creatorDoc.data()
                coachName = creatorData?.displayName || 'Coach'
              }
            }

            if (coachEmail) {
              await sendCoachNotificationEmail({
                to: coachEmail,
                coachName,
                type: 'invitation_expired',
                athleteInfo: {
                  name: invitationData.athleteName || 'Unknown Athlete',
                  email: invitationData.athleteEmail || '',
                  sport: invitationData.sport
                }
              })

              console.log(`📧 Expiry notification sent to ${coachEmail} for invitation ${invitationId}`)
            }
          }
        } catch (error) {
          console.error(`Failed to send expiry notification for ${invitationId}:`, error)
        }
      }

      results.push({
        invitationId,
        athleteEmail: invitationData.athleteEmail,
        status: 'expired'
      })
      processedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} expired invitations`,
      results
    })

  } catch (error) {
    console.error('Check expired invitations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check expired invitations'
      },
      { status: 500 }
    )
  }
}