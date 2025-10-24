import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/user/role
 * Fetch user's role information
 * SECURITY: Only allows users to access their own role
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({
        success: true,
        data: {
          role: 'user',
          hasRole: false
        }
      })
    }

    const userData = userDoc.data()
    const role = userData?.role || 'user'

    console.log(`[USER-ROLE-API] Successfully fetched role for user ${userId}: ${role}`)

    return NextResponse.json({
      success: true,
      data: {
        role,
        hasRole: true
      }
    })

  } catch (error: any) {
    console.error('[USER-ROLE-API] Error fetching user role:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user role',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
