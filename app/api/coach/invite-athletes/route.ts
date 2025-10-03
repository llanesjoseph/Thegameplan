import { NextRequest, NextResponse } from 'next/server'
import { sendAthleteInvitationEmail, sendCoachNotificationEmail } from '@/lib/email-service'
import { adminDb } from '@/lib/firebase.admin'

interface AthleteInvite {
  email: string
  name: string
}

interface InviteRequest {
  coachId: string
  sport: string
  customMessage?: string
  athletes: AthleteInvite[]
}

export async function POST(request: NextRequest) {
  try {
    const body: InviteRequest = await request.json()
    const { coachId, sport, customMessage, athletes } = body

    if (!coachId || !sport || !athletes || athletes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: coachId, sport, and athletes' },
        { status: 400 }
      )
    }

    // Validate athletes array
    const validAthletes = athletes.filter(
      athlete => athlete.email?.trim() && athlete.name?.trim()
    )

    if (validAthletes.length === 0) {
      return NextResponse.json(
        { error: 'No valid athletes provided' },
        { status: 400 }
      )
    }

    // Get coach information for notifications
    let coachEmail = ''
    let coachName = 'Coach'
    try {
      // First try to get coach data from the users collection
      const coachDoc = await adminDb.collection('users').doc(coachId).get()
      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        coachEmail = coachData?.email || ''
        coachName = coachData?.displayName || 'Coach'
      }

      // If no display name, check creator_profiles collection
      if (coachName === 'Coach') {
        const creatorDoc = await adminDb.collection('creator_profiles').doc(coachId).get()
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data()
          coachName = creatorData?.displayName || 'Coach'
        }
      }
    } catch (error) {
      console.log('Could not fetch coach data:', error)
    }

    const results = []
    let successCount = 0
    let failCount = 0
    const successfulAthleteNames: string[] = []

    // Process each athlete invitation
    for (const athlete of validAthletes) {
      try {
        // Generate unique invitation ID
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const invitationId = `athlete-invite-${timestamp}-${randomSuffix}`

        // Create invitation URL - get from env or request headers
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                       `https://${request.headers.get('host')}` ||
                       'https://playbookd.crucibleanalytics.dev'
        const invitationUrl = `${baseUrl}/athlete-onboard/${invitationId}`

        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

        // Store invitation data in Firestore
        const invitationData = {
          id: invitationId,
          coachId,
          athleteEmail: athlete.email.toLowerCase(),
          athleteName: athlete.name,
          sport,
          customMessage: customMessage || `Join our ${sport} team and take your performance to the next level!`,
          invitationUrl,
          qrCodeUrl,
          status: 'pending',
          role: 'athlete', // CRITICAL: Store the target role
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          type: 'athlete_invitation',
          used: false
        }

        // Store invitation in Firestore
        await adminDb.collection('invitations').doc(invitationId).set(invitationData)
        console.log(`💾 Stored athlete invitation in Firestore: ${invitationId}`)

        // Send email invitation
        const emailResult = await sendAthleteInvitationEmail({
          to: athlete.email,
          athleteName: athlete.name,
          coachName,
          sport,
          invitationUrl,
          qrCodeUrl,
          customMessage: invitationData.customMessage,
          expiresAt: invitationData.expiresAt
        })

        if (emailResult.success) {
          successCount++
          successfulAthleteNames.push(athlete.name)
          results.push({
            email: athlete.email,
            name: athlete.name,
            status: 'sent',
            invitationId,
            emailId: emailResult.data?.id
          })
          console.log(`✅ Athlete invitation sent to ${athlete.email}`)
        } else {
          failCount++
          results.push({
            email: athlete.email,
            name: athlete.name,
            status: 'failed',
            error: emailResult.error
          })
          console.error(`❌ Failed to send invitation to ${athlete.email}:`, emailResult.error)
        }

      } catch (error) {
        failCount++
        results.push({
          email: athlete.email,
          name: athlete.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ Error processing invitation for ${athlete.email}:`, error)
      }
    }

    // Send notification to coach if any invitations were successful
    if (successCount > 0 && coachEmail) {
      try {
        await sendCoachNotificationEmail({
          to: coachEmail,
          coachName,
          type: 'invitation_sent',
          invitationsSummary: {
            totalSent: successCount,
            athleteNames: successfulAthleteNames,
            sport
          }
        })
        console.log(`📧 Coach notification sent to ${coachEmail}`)
      } catch (error) {
        console.error('Failed to send coach notification:', error)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${validAthletes.length} invitations`,
      successCount,
      failCount,
      results
    })

  } catch (error) {
    console.error('Bulk athlete invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to process athlete invitations' },
      { status: 500 }
    )
  }
}