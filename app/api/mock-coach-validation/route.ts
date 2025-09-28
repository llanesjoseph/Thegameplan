import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Check in-memory test invitations first
    if (typeof globalThis !== 'undefined' && globalThis.testInvitations) {
      const testInvitation = globalThis.testInvitations.get(id)
      if (testInvitation) {
        console.log(`✅ Found test invitation: ${id}`)
        return NextResponse.json({
          valid: true,
          data: testInvitation
        })
      }
    }

    // Check if it's a Jasmine special invitation pattern
    if (id.startsWith('jasmine-special-')) {
      const mockJasmineData = {
        id,
        organizationName: 'GamePlan Platform',
        inviterName: 'GamePlan Team',
        inviterEmail: 'team@gameplan.ai',
        inviterUserId: 'system',
        sport: 'Soccer',
        description: 'Special onboarding for Jasmine Aikey - Stanford Soccer Star',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxUses: 1,
        currentUses: 0,
        autoApprove: true,
        customMessage: 'Welcome to GamePlan, Jasmine! We\'re excited to have you as one of our featured coaches. Please complete your profile to get started.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          isJasmineSpecial: true,
          prePopulateData: true
        }
      }

      console.log(`✅ Generated Jasmine special invitation: ${id}`)
      return NextResponse.json({
        valid: true,
        data: mockJasmineData
      })
    }

    // Check if it's a test invitation pattern
    if (id.startsWith('test-')) {
      const mockTestData = {
        id,
        organizationName: 'GamePlan Demo',
        inviterName: 'GamePlan Team',
        inviterEmail: 'team@gameplan.ai',
        inviterUserId: 'system',
        sport: 'Soccer',
        description: 'Test coach invitation to experience the GamePlan onboarding flow',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxUses: 1,
        currentUses: 0,
        autoApprove: true,
        customMessage: 'This is a test invitation to see how the coach onboarding flow looks and feels. Complete it to experience the full process!',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          isTestInvitation: true
        }
      }

      console.log(`✅ Generated test invitation: ${id}`)
      return NextResponse.json({
        valid: true,
        data: mockTestData
      })
    }

    // If no match found
    console.log(`❌ No invitation found for ID: ${id}`)
    return NextResponse.json({
      valid: false,
      error: 'Invitation not found or expired'
    })

  } catch (error) {
    console.error('Mock validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}