import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getCoachApplications } from '@/lib/coach-profile-auto-population'

export async function GET(request: NextRequest) {
  try {
    // Require admin or superadmin role to view applications
    const authResult = await requireAuth(request, ['admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const sport = searchParams.get('sport')
    const organizationName = searchParams.get('organizationName')
    const limit = searchParams.get('limit')

    const filters = {
      ...(status && { status }),
      ...(sport && { sport }),
      ...(organizationName && { organizationName }),
      ...(limit && { limit: parseInt(limit) })
    }

    const applications = await getCoachApplications(filters)

    return NextResponse.json({
      success: true,
      data: applications
    })

  } catch (error) {
    console.error('List coach applications error:', error)
    return NextResponse.json(
      { error: 'Failed to list coach applications' },
      { status: 500 }
    )
  }
}