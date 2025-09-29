import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

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

    // Validate that this is a simple invitation
    if (!ingestionId.startsWith('inv_')) {
      return NextResponse.json(
        { error: 'Invalid simple invitation ID' },
        { status: 400 }
      )
    }

    // Validate the simple invitation first
    const validationResponse = await fetch(`${request.nextUrl.origin}/api/validate-simple-invitation?id=${ingestionId}`)
    const validationResult = await validationResponse.json()

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    // Generate application ID
    const applicationId = nanoid()
    const now = new Date()

    // Create a simplified coach application data structure
    const applicationData = {
      id: applicationId,
      invitationId: ingestionId,
      invitationType: 'simple',
      // Invitation context
      organizationName: validationResult.data.organizationName,
      inviterName: validationResult.data.inviterName,
      sport: validationResult.data.sport,
      autoApprove: validationResult.data.autoApprove,
      // User info
      email: userInfo.email?.toLowerCase(),
      displayName: userInfo.displayName,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '', // Make phone optional
      // Coach profile data (all optional - take what we can get)
      experience: coachData.experience || '',
      credentials: coachData.credentials || '',
      tagline: coachData.tagline || '',
      philosophy: coachData.philosophy || '',
      specialties: coachData.specialties || [],
      achievements: coachData.achievements || [],
      references: coachData.references || [],
      sampleQuestions: coachData.sampleQuestions || [],
      bio: coachData.bio || '',
      // Voice capture data for AI integration
      voiceCaptureData: coachData.voiceCaptureData || null,
      // Application metadata
      status: validationResult.data.autoApprove ? 'approved' : 'pending',
      submittedAt: now,
      submittedVia: 'simple_invitation',
      source: 'simple_coach_invitation',
      createdAt: now,
      updatedAt: now
    }

    // Log the application (in a real implementation, this would be saved to database)
    console.log('🎯 Simple coach application submitted:', {
      applicationId,
      email: userInfo.email,
      sport: validationResult.data.sport,
      organizationName: validationResult.data.organizationName,
      autoApprove: validationResult.data.autoApprove,
      hasVoiceCapture: !!coachData.voiceCaptureData
    })

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Process voice capture data
    // 3. Send confirmation emails
    // 4. Create user account if auto-approved
    // 5. Set up coach role and permissions

    // For now, simulate success
    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        status: applicationData.status,
        autoApproved: validationResult.data.autoApprove,
        organizationName: validationResult.data.organizationName,
        message: validationResult.data.autoApprove
          ? 'Your coach application has been automatically approved! You should receive access shortly.'
          : 'Your coach application has been submitted successfully. You will receive an email when it has been reviewed.'
      }
    })

  } catch (error) {
    console.error('Submit simple coach application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit coach application' },
      { status: 500 }
    )
  }
}