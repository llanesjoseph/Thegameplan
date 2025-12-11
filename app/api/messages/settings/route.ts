import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get current messaging settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    return NextResponse.json({
      success: true,
      settings: {
        messagingEnabled: userData?.messagingEnabled || false,
        emailNotifications: userData?.messagingPreferences?.emailNotifications ?? true,
        pushNotifications: userData?.messagingPreferences?.pushNotifications ?? false
      }
    })

  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update messaging settings
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { messagingEnabled, emailNotifications, pushNotifications } = body

    const updates: any = {}

    if (typeof messagingEnabled === 'boolean') {
      updates.messagingEnabled = messagingEnabled
    }

    if (emailNotifications !== undefined || pushNotifications !== undefined) {
      const userDoc = await adminDb.collection('users').doc(userId).get()
      const currentPrefs = userDoc.data()?.messagingPreferences || {}

      updates.messagingPreferences = {
        ...currentPrefs,
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications })
      }
    }

    await adminDb.collection('users').doc(userId).update(updates)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
