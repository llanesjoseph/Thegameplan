import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * API Route to proxy Firebase Function calls for role management
 * This allows the frontend to call the Firebase Function securely
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, role } = body

    // Get the admin secret from headers
    const adminSecret = request.headers.get('x-admin-secret')
    
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin secret required' },
        { status: 401 }
      )
    }

    // Validate role
    const validRoles = ['guest', 'user', 'creator', 'admin', 'superadmin']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Call Firebase Function
    const functionUrl = process.env.FIREBASE_FUNCTION_URL || 'https://us-central1-gameplan-787a2.cloudfunctions.net/setUserRole'
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret
      },
      body: JSON.stringify({ uid, email, role })
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'Function call failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in set-user-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
