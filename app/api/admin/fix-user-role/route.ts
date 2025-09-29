import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    // Require admin or superadmin role to fix user roles
    const authResult = await requireAuth(request, ['admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult
    const body = await request.json()

    const {
      userEmail,
      newRole,
      reason
    } = body

    // Validate required fields
    if (!userEmail || !newRole || !reason) {
      return NextResponse.json(
        { error: 'userEmail, newRole, and reason are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Find user by email
    const usersQuery = await db.collection('users').where('email', '==', userEmail).get()

    if (usersQuery.empty) {
      return NextResponse.json(
        { error: `User with email ${userEmail} not found` },
        { status: 404 }
      )
    }

    const userDoc = usersQuery.docs[0]
    const userData = userDoc.data()
    const oldRole = userData.role

    // Update user role
    await db.collection('users').doc(userDoc.id).update({
      role: newRole,
      updatedAt: new Date(),
      roleUpdatedBy: authUser.uid,
      roleUpdateReason: reason
    })

    // Audit log the role change
    await auditLog('user_role_updated', {
      targetUserEmail: userEmail,
      targetUserId: userDoc.id,
      oldRole,
      newRole,
      reason,
      updatedBy: authUser.uid,
      updatedByEmail: authUser.email
    }, { userId: authUser.uid, severity: 'high' })

    console.log(`✅ User role updated: ${userEmail} from ${oldRole} to ${newRole}`)

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} role updated from ${oldRole} to ${newRole}`,
      data: {
        userEmail,
        oldRole,
        newRole,
        updatedBy: authUser.email,
        reason
      }
    })

  } catch (error) {
    console.error('Fix user role error:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}