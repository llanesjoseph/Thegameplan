import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name = 'Coach', type = 'regular' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate a simple test invitation ID
    const timestamp = Date.now()
    const ingestionId = type === 'jasmine'
      ? `jasmine-special-${timestamp}`
      : `test-${timestamp}`

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ingestionUrl = `${baseUrl}/coach-onboard/${ingestionId}`

    console.log(`✅ Test invitation created for ${email}`)
    console.log(`🔗 Onboarding URL: ${ingestionUrl}`)

    // For now, we'll create a mock ingestion data structure
    const mockIngestionData = {
      id: ingestionId,
      organizationName: type === 'jasmine' ? 'GamePlan Platform' : 'GamePlan Demo',
      inviterName: 'GamePlan Team',
      inviterEmail: 'team@gameplan.ai',
      inviterUserId: 'system',
      sport: 'Soccer',
      description: type === 'jasmine'
        ? 'Special onboarding for Jasmine Aikey - Stanford Soccer Star'
        : 'Test coach invitation to experience the GamePlan onboarding flow',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      maxUses: 1,
      currentUses: 0,
      autoApprove: true,
      customMessage: type === 'jasmine'
        ? 'Welcome to GamePlan, Jasmine! We\'re excited to have you as one of our featured coaches. Please complete your profile to get started.'
        : 'This is a test invitation to see how the coach onboarding flow looks and feels. Complete it to experience the full process including the optional voice capture system!',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        isTestInvitation: type !== 'jasmine',
        isJasmineSpecial: type === 'jasmine',
        prePopulateData: type === 'jasmine'
      }
    }

    // Store in temporary global cache for testing (in production this would go to database)
    if (typeof globalThis !== 'undefined') {
      if (!(globalThis as any).testInvitations) {
        (globalThis as any).testInvitations = new Map()
      }
      (globalThis as any).testInvitations.set(ingestionId, mockIngestionData)
      console.log(`📝 Stored test invitation in memory: ${ingestionId}`)
    }

    return NextResponse.json({
      success: true,
      message: `Test coach invitation created successfully for ${email}`,
      data: {
        ingestionId,
        url: ingestionUrl,
        expiresAt: mockIngestionData.expiresAt.toISOString(),
        type: type,
        instructions: type === 'jasmine'
          ? 'This invitation simulates the Jasmine Aikey experience with pre-populated data'
          : 'This is a regular test invitation for the coach onboarding flow',
        note: 'This is a test invitation stored in memory. In production, this would be saved to the database.'
      }
    })

  } catch (error) {
    console.error('Create simple test invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test invitation' },
      { status: 500 }
    )
  }
}