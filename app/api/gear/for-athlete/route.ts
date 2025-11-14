import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET(request: Request) {
  try {
    // Verify user
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 })
    const decoded = await getAuth().verifyIdToken(token)
    const uid = decoded.uid

    // Load assigned coach
    const userDoc = await adminDb.collection('users').doc(uid).get()
    const coachUid = userDoc.exists ? (userDoc.data() as any).coachId || (userDoc.data() as any).assignedCoachId || '' : ''
    if (!coachUid) return NextResponse.json({ success: true, coachUid: '', count: 0, gearItems: [] })

    // Reuse logic similar to /api/gear/coach
    const collections = ['curatedGear', 'recommendedGear']
    const docsMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
    const ownerFields = ['coachId', 'creatorUid', 'createdBy', 'ownerUid', 'coachUID', 'creatorID', 'authorUid', 'userId']
    for (const col of collections) {
      for (const field of ownerFields) {
        const s = await adminDb.collection(col).where(field, '==', coachUid).get().catch(() => null)
        if (s && !s.empty) {
          for (const d of s.docs) docsMap.set(`${col}:${d.id}`, d)
        }
      }
    }
    for (const field of ownerFields) {
      const s = await adminDb
        .collection('gear')
        .where('recommended', '==', true)
        .where(field, '==', coachUid)
        .get()
        .catch(() => null)
      if (s && !s.empty) {
        for (const d of s.docs) docsMap.set(`gear:${d.id}`, d)
      }
    }

    const gearItems = Array.from(docsMap.values()).map((doc) => {
      const d = doc.data() as any
      return {
        id: doc.id,
        name: d.name || d.product || 'Product',
        description: d.description || '',
        price: d.price || d.priceUSD || '',
        imageUrl: d.imageUrl || d.photoURL || d.imagePath || '',
        coachId: d.coachId || d.creatorUid || '',
        link: d.link || d.url || '',
        source: doc.ref.parent.path
      }
    })

    return NextResponse.json({ success: true, coachUid, count: gearItems.length, gearItems })
  } catch (error) {
    console.error('[API/GEAR/FOR-ATHLETE] error', error)
    return NextResponse.json({ success: false, error: 'Failed to load gear for athlete' }, { status: 500 })
  }
}


