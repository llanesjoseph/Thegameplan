import { NextRequest, NextResponse } from 'next/server'
import { adminDb, auth as adminAuth } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_COLLECTIONS = ['curatedGear', 'recommendedGear', 'gear']

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    const source = (searchParams.get('source') || '').trim()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing gear id' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    // Load user role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data() || {}
    const userRole = userData.role || userData.roles?.[0] || 'user'
    const isAdmin = ['admin', 'superadmin'].includes(userRole)

    // Helper to check ownership and delete from a specific collection
    const tryDeleteFromCollection = async (collection: string): Promise<boolean> => {
      const ref = adminDb.collection(collection).doc(id)
      const snap = await ref.get()
      if (!snap.exists) return false

      const data = snap.data() as any
      const ownerId =
        data.coachId ||
        data.creatorUid ||
        data.createdBy ||
        data.ownerUid ||
        data.coachUID ||
        data.creatorID ||
        data.authorUid ||
        data.userId ||
        ''

      if (!isAdmin && ownerId && ownerId !== uid) {
        // Not owner
        return false
      }

      await ref.delete()
      return true
    }

    let deleted = false

    if (source && ALLOWED_COLLECTIONS.includes(source)) {
      deleted = await tryDeleteFromCollection(source)
    } else {
      // Probe all allowed collections until we find the document
      for (const col of ALLOWED_COLLECTIONS) {
        deleted = await tryDeleteFromCollection(col)
        if (deleted) break
      }
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Gear item not found or not owned by this coach' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/GEAR/DELETE] error', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete gear item' },
      { status: 500 }
    )
  }
}

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
