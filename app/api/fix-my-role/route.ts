import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

/**
 * Emergency endpoint to fix user role
 * GET /api/fix-my-role?email=bigpenger@gmail.com&role=athlete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const newRole = searchParams.get('role')

    if (!email || !newRole) {
      return NextResponse.json(
        { error: 'Missing email or role parameter' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['athlete', 'coach', 'assistant_coach', 'admin', 'superadmin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`🔍 Searching for user: ${email}`)

    // Find user by email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    const userId = userDoc.id

    console.log(`📋 Current role: ${userData.role}`)
    console.log(`🔄 Updating to: ${newRole}`)

    // Update role
    await adminDb.collection('users').doc(userId).update({
      role: newRole,
      roleUpdatedAt: new Date(),
      roleUpdateReason: 'Manual role fix via API'
    })

    console.log(`✅ Role updated successfully`)

    return NextResponse.json({
      success: true,
      message: `Role updated from '${userData.role}' to '${newRole}'`,
      user: {
        email: userData.email,
        oldRole: userData.role,
        newRole: newRole,
        uid: userId
      }
    })
  } catch (error: any) {
    console.error('❌ Error updating role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}
