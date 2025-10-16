import { NextRequest, NextResponse } from 'next/server'
import { sendAthleteInvitationEmail, sendCoachNotificationEmail, getAdminEmails, sendAdminNotificationEmail } from '@/lib/email-service'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface AthleteInvite {
  email: string
  name: string
}

interface InviteRequest {
  creatorUid: string
  sport: string
  customMessage?: string
  athletes: AthleteInvite[]
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can invite athletes' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body: InviteRequest = await request.json()
    const { creatorUid, sport, customMessage, athletes } = body

    // 4. Verify the creatorUid matches the authenticated user (unless admin/superadmin)
    if (creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only send invitations as yourself' },
        { status: 403 }
      )
    }

    if (!creatorUid || !sport || !athletes || athletes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorUid, sport, and athletes' },
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
      const coachDoc = await adminDb.collection('users').doc(creatorUid).get()
      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        coachEmail = coachData?.email || ''
        coachName = coachData?.displayName || 'Coach'
      }

      // If no display name, check creator_profiles collection
      if (coachName === 'Coach') {
        const creatorDoc = await adminDb.collection('creator_profiles').doc(creatorUid).get()
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
    let duplicateCount = 0
    const successfulAthleteNames: string[] = []

    // Process each athlete invitation
    for (const athlete of validAthletes) {
      try {
        // Check for duplicate invitations (pending invitations from this coach to this email)
        const existingInvitesSnapshot = await adminDb
          .collection('invitations')
          .where('creatorUid', '==', creatorUid)
          .where('athleteEmail', '==', athlete.email.toLowerCase())
          .where('status', '==', 'pending')
          .get()

        if (!existingInvitesSnapshot.empty) {
          // Found pending invitation(s)
          duplicateCount++
          results.push({
            email: athlete.email,
            name: athlete.name,
            status: 'duplicate',
            error: 'An invitation to this email is already pending'
          })
          console.log(`⚠️ Duplicate invitation detected for ${athlete.email} - skipping`)
          continue // Skip this athlete and move to next
        }

        // Generate unique invitation ID
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const invitationId = `athlete-invite-${timestamp}-${randomSuffix}`

        // Create invitation URL - get from env or request headers
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                       `https://${request.headers.get('host')}` ||
                       'https://athleap.crucibleanalytics.dev'
        const invitationUrl = `${baseUrl}/athlete-onboard/${invitationId}`

        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

        // Store invitation data in Firestore
        const expirationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        const invitationData = {
          id: invitationId,
          creatorUid,
          athleteEmail: athlete.email.toLowerCase(),
          athleteName: athlete.name,
          sport,
          customMessage: customMessage || `Join our ${sport} team and take your performance to the next level!`,
          invitationUrl,
          qrCodeUrl,
          status: 'pending',
          role: 'athlete', // CRITICAL: Store the target role
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expirationDate),
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
          expiresAt: expirationDate.toISOString() // Email function expects ISO string
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

          // Notify admins about the invitation
          try {
            const adminEmails = await getAdminEmails()
            if (adminEmails.length > 0) {
              await sendAdminNotificationEmail({
                adminEmails,
                invitationType: 'athlete',
                recipientEmail: athlete.email,
                recipientName: athlete.name,
                senderName: coachName,
                senderEmail: coachEmail || userData?.email || 'Unknown',
                sport,
                customMessage
              })
            }
          } catch (error) {
            console.error('Failed to send admin notification:', error)
            // Don't fail the request if admin notification fails
          }
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
      message: `Processed ${validAthletes.length} invitations: ${successCount} sent, ${duplicateCount} duplicates skipped, ${failCount} failed`,
      successCount,
      failCount,
      duplicateCount,
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