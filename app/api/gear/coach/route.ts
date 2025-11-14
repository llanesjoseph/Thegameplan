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
    const docs: any[] = []
    for (const col of collections) {
      const s = await adminDb.collection(col).where('coachId', '==', coachUid).get().catch(() => null)
      if (s && !s.empty) docs.push(...s.docs)
    }
    // fall back to gear where recommended true and creator/coach matches
    const rec = await adminDb
      .collection('gear')
      .where('recommended', '==', true)
      .where('coachId', '==', coachUid)
      .get()
      .catch(() => null)
    if (rec && !rec.empty) docs.push(...rec.docs)

    const gearItems = docs.map((doc) => {
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
    console.error('[API/GEAR/COACH] error', error)
    return NextResponse.json({ success: false, error: 'Failed to load coach gear' }, { status: 500 })
  }
}


