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
    const userEmail = decoded.email || ''

    // Load user role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data() || {}
    const userRole = userData.role || userData.roles?.[0] || 'user'
    const isAdmin = ['admin', 'superadmin'].includes(userRole)

    // Helper to check ownership/association and delete from a specific collection
    const tryDeleteFromCollection = async (collection: string): Promise<boolean> => {
      const ref = adminDb.collection(collection).doc(id)
      const snap = await ref.get()
      if (!snap.exists) return false

      const data = snap.data() as any
      
      // Check if user is the owner (created the item)
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

      // FIX: Also check if the gear is ASSOCIATED with this coach (even if not created by them)
      // This allows coaches to remove gear recommendations from their profile
      const associatedCoachId = data.coachId || data.coachUID || data.assignedCoachId || ''
      const associatedEmail = data.coachEmail || data.creatorEmail || data.ownerEmail || data.email || ''
      
      const isOwner = ownerId === uid
      const isAssociatedCoach = associatedCoachId === uid || (userEmail && associatedEmail === userEmail)
      
      // Allow deletion if:
      // 1. User is an admin
      // 2. User is the owner (created the item)
      // 3. User is a coach and the gear is associated with their profile
      // 4. No owner is set (orphaned item)
      if (!isAdmin && !isOwner && !isAssociatedCoach && ownerId) {
        console.log(`[GEAR/DELETE] Denied: uid=${uid}, ownerId=${ownerId}, associatedCoachId=${associatedCoachId}`)
        return false
      }

      await ref.delete()
      console.log(`[GEAR/DELETE] Deleted gear ${id} from ${collection} by user ${uid}`)
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
        { success: false, error: 'Gear item not found or you do not have permission to delete it' },
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

// Legacy single-collection implementation removed in favor of the
// generalized ALLOWED_COLLECTIONS + role-aware handler above.
