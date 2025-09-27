import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { approveCoachApplicationAndCreateProfile } from '@/lib/coach-profile-auto-population'
import { auditLog } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    // Require admin or superadmin role to approve applications
    const authResult = await requireAuth(request, ['admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult
    const body = await request.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Approve application and create profile
    const success = await approveCoachApplicationAndCreateProfile(applicationId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to approve application and create profile' },
        { status: 500 }
      )
    }

    // Audit log
    await auditLog('coach_application_approved_by_admin', {
      applicationId,
      approvedBy: authUser.uid,
      approverEmail: authUser.email
    }, { userId: authUser.uid })

    return NextResponse.json({
      success: true,
      message: 'Coach application approved and profile created successfully'
    })

  } catch (error) {
    console.error('Approve coach application error:', error)
    return NextResponse.json(
      { error: 'Failed to approve coach application' },
      { status: 500 }
    )
  }
}