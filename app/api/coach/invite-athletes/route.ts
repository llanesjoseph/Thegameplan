import { NextRequest, NextResponse } from 'next/server'
import { sendAthleteInvitationEmail } from '@/lib/email-service'

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

    const results = []
    let successCount = 0
    let failCount = 0

    // Process each athlete invitation
    for (const athlete of validAthletes) {
      try {
        // Generate unique invitation ID
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const invitationId = `athlete-invite-${timestamp}-${randomSuffix}`

        // Create invitation URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
        const invitationUrl = `${baseUrl}/athlete-onboard/${invitationId}`

        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

        // Store invitation data in memory (in production, this would go to database)
        const invitationData = {
          id: invitationId,
          coachId,
          athleteEmail: athlete.email,
          athleteName: athlete.name,
          sport,
          customMessage: customMessage || `Join our ${sport} team and take your performance to the next level!`,
          invitationUrl,
          qrCodeUrl,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          type: 'athlete_invitation'
        }

        // Store in global cache for testing
        if (typeof globalThis !== 'undefined') {
          const global = globalThis as any
          if (!global.athleteInvitations) {
            global.athleteInvitations = new Map()
          }
          global.athleteInvitations.set(invitationId, invitationData)
        }

        // Send email invitation
        const emailResult = await sendAthleteInvitationEmail({
          to: athlete.email,
          athleteName: athlete.name,
          coachName: 'Coach', // This should come from coach's profile
          sport,
          invitationUrl,
          qrCodeUrl,
          customMessage: invitationData.customMessage,
          expiresAt: invitationData.expiresAt
        })

        if (emailResult.success) {
          successCount++
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