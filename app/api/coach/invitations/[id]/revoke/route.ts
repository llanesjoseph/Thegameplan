import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can revoke invitations' },
        { status: 403 }
      )
    }

    const invitationId = params.id

    // 3. Get the invitation
    const invitationRef = adminDb.collection('invitations').doc(invitationId)
    const invitationDoc = await invitationRef.get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data()

    // 4. Verify the coach owns this invitation (unless admin/superadmin)
    if (invitationData?.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only revoke your own invitations' },
        { status: 403 }
      )
    }

    // 5. Check if invitation can be revoked
    if (invitationData?.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot revoke accepted invitations' },
        { status: 400 }
      )
    }

    // 6. Revoke the invitation
    await invitationRef.update({
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy: uid
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    )
  }
}
