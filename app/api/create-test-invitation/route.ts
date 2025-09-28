import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { nanoid } from 'nanoid'

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

    // Generate unique test ingestion link
    const ingestionId = type === 'jasmine' ? `jasmine-special-${Date.now()}` : `test-${nanoid(10)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Create ingestion link document
    const ingestionLinkData = {
      id: ingestionId,
      organizationName: type === 'jasmine' ? 'GamePlan Platform' : 'GamePlan Demo',
      inviterName: 'GamePlan Team',
      inviterEmail: 'team@gameplan.ai',
      inviterUserId: 'system',
      sport: 'Soccer',
      description: type === 'jasmine'
        ? 'Special onboarding for Jasmine Aikey - Stanford Soccer Star'
        : 'Test coach invitation to experience the GamePlan onboarding flow',
      expiresAt,
      maxUses: 1,
      currentUses: 0,
      autoApprove: true,
      customMessage: type === 'jasmine'
        ? 'Welcome to GamePlan, Jasmine! We\'re excited to have you as one of our featured coaches. Please complete your profile to get started.'
        : 'This is a test invitation to see how the coach onboarding flow looks and feels. Complete it to experience the full process including the optional voice capture system!',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      uses: [],
      analytics: {
        views: 0,
        completions: 0,
        conversions: 0
      },
      metadata: {
        isTestInvitation: type !== 'jasmine',
        isJasmineSpecial: type === 'jasmine',
        prePopulateData: type === 'jasmine'
      }
    }

    // Save to Firestore
    await db.collection('coach_ingestion_links').doc(ingestionId).set(ingestionLinkData)

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ingestionUrl = `${baseUrl}/coach-onboard/${ingestionId}`
    const qrCodeUrl = `${baseUrl}/api/coach-ingestion/qr/${ingestionId}`

    console.log(`✅ Test coach invitation created for ${email}`)
    console.log(`🔗 Onboarding URL: ${ingestionUrl}`)

    return NextResponse.json({
      success: true,
      message: `Test coach invitation created successfully for ${email}`,
      data: {
        ingestionId,
        url: ingestionUrl,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString(),
        type: type,
        instructions: type === 'jasmine'
          ? 'This invitation simulates the Jasmine Aikey experience with pre-populated data'
          : 'This is a regular test invitation for the coach onboarding flow'
      }
    })

  } catch (error) {
    console.error('Create test invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test invitation' },
      { status: 500 }
    )
  }
}