import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email') || ''
    const uid = searchParams.get('uid') || ''

    let coachUid = uid
    if (!coachUid && email) {
      const userSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get()
      if (!userSnap.empty) {
        coachUid = userSnap.docs[0].id
      }
    }

    if (!coachUid) {
      return NextResponse.json({ success: false, error: 'Provide ?uid=COACH_UID or ?email=coach@example.com' }, { status: 400 })
    }

    const collections = ['curatedGear', 'recommendedGear']
    const docsMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
    // Collect matches across multiple possible owner fields
    const ownerFields = ['coachId', 'creatorUid', 'createdBy', 'ownerUid', 'coachUID', 'creatorID', 'authorUid', 'userId']
    const emailFields = ['coachEmail', 'creatorEmail', 'ownerEmail', 'email', 'recommendedByEmail']
    for (const col of collections) {
      for (const field of ownerFields) {
        const s = await adminDb.collection(col).where(field, '==', coachUid).get().catch(() => null)
        if (s && !s.empty) {
          for (const d of s.docs) docsMap.set(`${col}:${d.id}`, d)
        }
      }
      if (email) {
        for (const field of emailFields) {
          const s = await adminDb.collection(col).where(field, '==', email).get().catch(() => null)
          if (s && !s.empty) {
            for (const d of s.docs) docsMap.set(`${col}:${d.id}`, d)
          }
        }
      }
    }
    // gear collection: recommended true and owned by coach via any field
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
    if (email) {
      for (const field of emailFields) {
        const s = await adminDb
          .collection('gear')
          .where('recommended', '==', true)
          .where(field, '==', email)
          .get()
          .catch(() => null)
        if (s && !s.empty) {
          for (const d of s.docs) docsMap.set(`gear:${d.id}`, d)
        }
      }
    }

    const gearItems = Array.from(docsMap.values()).map((doc) => {
      const d = doc.data() as any
      const rawPrice = typeof d.priceUSD !== 'undefined' && d.priceUSD !== null ? d.priceUSD : d.price

      return {
        id: doc.id,
        name: d.name || d.product || 'Product',
        description: d.description || '',
        price: rawPrice ?? '',
        imageUrl: d.imageUrl || d.photoURL || d.imagePath || '',
        coachId: d.coachId || d.creatorUid || '',
        link: d.link || d.url || '',
        source: doc.ref.parent.path
      }
    })

    return NextResponse.json({ success: true, coachUid, count: gearItems.length, gearItems })
  } catch (error) {
    console.error('[API/GEAR/COACH] error', error)
    return NextResponse.json({ success: false, error: 'Failed to load coach gear' }, { status: 500 })
  }
}


