import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')
    const type = searchParams.get('type') // 'athlete', 'coach', 'assistant'

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required', success: false },
        { status: 400 }
      )
    }

    // Fetch invitation from Firestore
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation', success: false },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data()

    // Check if invitation has expired
    if (invitationData?.expiresAt) {
      const expiresAt = new Date(invitationData.expiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'This invitation has expired', success: false },
          { status: 400 }
        )
      }
    }

    // Check if invitation has already been used
    if (invitationData?.used) {
      return NextResponse.json(
        { error: 'This invitation has already been used', success: false },
        { status: 400 }
      )
    }

    // Optionally validate the invitation type matches what's expected
    if (type && invitationData?.role !== type) {
      return NextResponse.json(
        { error: `Invalid invitation type. Expected ${type}, got ${invitationData?.role}`, success: false },
        { status: 400 }
      )
    }

    console.log(`✅ Validated ${invitationData?.role} invitation:`, invitationId)

    return NextResponse.json({
      success: true,
      invitation: invitationData
    })

  } catch (error) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation', success: false },
      { status: 500 }
    )
  }
}