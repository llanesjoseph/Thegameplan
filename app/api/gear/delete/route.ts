import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 })

    const decoded = await getAuth().verifyIdToken(token)
    const coachUid = decoded.uid

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })

    // Get the gear item to verify ownership
    const gearDoc = await adminDb.collection('curatedGear').doc(id).get()
    if (!gearDoc.exists) {
      return NextResponse.json({ success: false, error: 'Gear item not found' }, { status: 404 })
    }

    const gearData = gearDoc.data()

    // Verify ownership
    if (gearData?.coachId !== coachUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the gear item
    await adminDb.collection('curatedGear').doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API/GEAR/DELETE] error', error)
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
  }
}
