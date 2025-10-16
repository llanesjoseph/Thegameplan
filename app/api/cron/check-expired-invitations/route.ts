import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail } from '@/lib/email-service'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron job endpoint to check for expired invitations
 * This should be called periodically (e.g., daily) via Vercel Cron or external scheduler
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-expired-invitations",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (in production)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    console.log(`🕐 Checking for expired invitations at ${now.toISOString()}`)

    // Query for pending invitations that have expired
    const expiredInvitations = await adminDb
      .collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now.toISOString())
      .limit(100) // Process in batches to avoid timeout
      .get()

    let processedCount = 0
    let notificationsSent = 0
    const errors: string[] = []

    for (const doc of expiredInvitations.docs) {
      try {
        const invitationData = doc.data()
        const invitationId = doc.id

        // Update status to expired
        await adminDb.collection('invitations').doc(invitationId).update({
          status: 'expired',
          updatedAt: now.toISOString()
        })
        processedCount++

        // Send notification to coach if this is an athlete invitation
        if (invitationData.type === 'athlete_invitation' && invitationData.creatorUid) {
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
                notificationsSent++
                console.log(`📧 Expiry notification sent to coach ${coachEmail} for invitation ${invitationId}`)
              }
            }
          } catch (notificationError) {
            const errorMsg = `Failed to send notification for ${invitationId}: ${notificationError}`
            console.error(errorMsg)
            errors.push(errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process invitation ${doc.id}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    // Log summary
    console.log(`✅ Processed ${processedCount} expired invitations`)
    console.log(`📧 Sent ${notificationsSent} coach notifications`)
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} errors occurred`)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} expired invitations`,
      stats: {
        processed: processedCount,
        notificationsSent,
        errors: errors.length
      },
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Cron job error - check expired invitations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check expired invitations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}