import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'

/**
 * Emergency endpoint to set superadmin role
 * TEMPORARY - Remove after fixing role issue
 */

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, userEmail } = body

    // Use environment variable as secret
    const expectedSecret = process.env.EMERGENCY_ADMIN_SECRET || 'temp-secret-12345'

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Find user by email
    const usersQuery = await db.collection('users').where('email', '==', userEmail).get()

    if (usersQuery.empty) {
      return NextResponse.json(
        { error: `User with email ${userEmail} not found` },
        { status: 404, headers: corsHeaders }
      )
    }

    const userDoc = usersQuery.docs[0]
    const oldRole = userDoc.data().role

    // Update user role to superadmin
    await db.collection('users').doc(userDoc.id).update({
      role: 'superadmin',
      updatedAt: new Date(),
      roleUpdateReason: 'Emergency superadmin fix'
    })

    console.log(`✅ Emergency role update: ${userEmail} from ${oldRole} to superadmin`)

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} role updated from ${oldRole} to superadmin`,
      data: {
        userEmail,
        oldRole,
        newRole: 'superadmin'
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Emergency superadmin error:', error)
    return NextResponse.json(
      { error: 'Failed to update user role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
