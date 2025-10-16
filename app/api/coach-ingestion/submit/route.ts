import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { nanoid } from 'nanoid'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ingestionId,
      coachData,
      userInfo
    } = body

    // Validate required fields
    if (!ingestionId || !coachData || !userInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get and validate ingestion link
    const ingestionDoc = await db.collection('coach_ingestion_links').doc(ingestionId).get()

    if (!ingestionDoc.exists) {
      return NextResponse.json({ error: 'Invalid ingestion link' }, { status: 404 })
    }

    const ingestionData = ingestionDoc.data()
    const now = new Date()
    const expiresAt = ingestionData?.expiresAt?.toDate()

    // Validate link status
    if (ingestionData?.status !== 'active') {
      return NextResponse.json({ error: 'Ingestion link is inactive' }, { status: 410 })
    }

    if (expiresAt && now > expiresAt) {
      return NextResponse.json({ error: 'Ingestion link has expired' }, { status: 410 })
    }

    if (ingestionData?.currentUses >= ingestionData?.maxUses) {
      return NextResponse.json({ error: 'Ingestion link usage limit exceeded' }, { status: 410 })
    }

    // Generate application ID
    const applicationId = nanoid()

    // Create coach application with ingestion context
    const applicationData = {
      id: applicationId,
      ingestionId,
      ingestionData: {
        organizationName: ingestionData?.organizationName,
        inviterName: ingestionData?.inviterName,
        inviterEmail: ingestionData?.inviterEmail,
        inviterUserId: ingestionData?.inviterUserId,
        sport: ingestionData?.sport,
        autoApprove: ingestionData?.autoApprove
      },
      // User info
      email: userInfo.email,
      displayName: userInfo.displayName,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone,
      // Coach profile data
      sport: coachData.sport || ingestionData?.sport,
      experience: coachData.experience,
      credentials: coachData.credentials,
      tagline: coachData.tagline,
      philosophy: coachData.philosophy,
      specialties: coachData.specialties || [],
      achievements: coachData.achievements || [],
      references: coachData.references || [],
      sampleQuestions: coachData.sampleQuestions || [],
      bio: coachData.bio,
      // Voice capture data for AI integration
      voiceCaptureData: coachData.voiceCaptureData || null,
      // Application metadata
      status: ingestionData?.autoApprove ? 'approved' : 'pending',
      submittedAt: now,
      submittedVia: 'ingestion_link',
      source: 'coach_ingestion',
      createdAt: now,
      updatedAt: now
    }

    // Save application
    await db.collection('coach_applications').doc(applicationId).set(applicationData)

    // Voice profile integration (legacy - now uses voice-refiner system)
    // If voice capture data is provided, it's stored with the application
    // and will be processed during coach profile creation
    if (coachData.voiceCaptureData) {
      console.log(`🎤 Voice capture data received for ${applicationId} - will be processed during profile creation`)
    }

    // Update ingestion link usage
    await db.collection('coach_ingestion_links').doc(ingestionId).update({
      currentUses: (ingestionData?.currentUses || 0) + 1,
      'analytics.completions': (ingestionData?.analytics?.completions || 0) + 1,
      'analytics.conversions': (ingestionData?.analytics?.conversions || 0) + 1,
      updatedAt: now,
      [`uses.${applicationId}`]: {
        applicationId,
        email: userInfo.email,
        submittedAt: now
      }
    })

    // Audit log
    await auditLog('coach_application_submitted_via_ingestion', {
      applicationId,
      ingestionId,
      email: userInfo.email,
      sport: coachData.sport || ingestionData?.sport,
      organizationName: ingestionData?.organizationName,
      autoApprove: ingestionData?.autoApprove
    })

    // If auto-approve, immediately set coach role
    if (ingestionData?.autoApprove) {
      // Note: This would typically create a user account and set role
      // For now, we'll just mark the application as approved
      await auditLog('coach_application_auto_approved', {
        applicationId,
        ingestionId,
        email: userInfo.email
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        status: applicationData.status,
        autoApproved: ingestionData?.autoApprove,
        organizationName: ingestionData?.organizationName,
        message: ingestionData?.autoApprove
          ? 'Your coach application has been automatically approved! You should receive access shortly.'
          : 'Your coach application has been submitted successfully. You will receive an email when it has been reviewed.'
      }
    })

  } catch (error) {
    console.error('Submit coach application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit coach application' },
      { status: 500 }
    )
  }
}