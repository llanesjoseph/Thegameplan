import { NextRequest, NextResponse } from 'next/server'
import { autoProvisionSuperadmin, isSuperadminEmail } from '@/lib/auto-superadmin-setup'
import { auth } from '@/lib/firebase.admin'

export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json()

    if (!email || !uid) {
      return NextResponse.json(
        { error: 'Email and UID are required' },
        { status: 400 }
      )
    }

    // Verify this is a predefined superadmin email
    if (!isSuperadminEmail(email)) {
      return NextResponse.json(
        { error: 'Email is not authorized for superadmin provisioning' },
        { status: 403 }
      )
    }

    // Verify the user exists in Firebase Auth
    try {
      await auth.getUser(uid)
    } catch (error) {
      return NextResponse.json(
        { error: 'User not found in Firebase Auth' },
        { status: 404 }
      )
    }

    // Provision the superadmin
    const result = await autoProvisionSuperadmin(uid, email)

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Successfully provisioned ${email} as superadmin`,
        uid,
        email
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to provision superadmin' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error provisioning superadmin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return list of emails that can be auto-provisioned
  const superadminEmails = [
    'joseph@crucibleanalytics.dev',
    'LonaLorraine.Vincent@gmail.com',
    'merlinesaintil@gmail.com'
  ]

  return NextResponse.json({
    message: 'Superadmin auto-provisioning endpoint',
    authorizedEmails: superadminEmails,
    usage: 'POST with { email, uid } to provision a superadmin'
  })
}