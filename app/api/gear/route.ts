import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export async function GET() {
  try {
    // Merge from multiple sources: curatedGear, recommendedGear, gear where recommended==true
    const collections = ['curatedGear', 'recommendedGear']
    const docs: any[] = []
    for (const col of collections) {
      const s = await adminDb.collection(col).orderBy('createdAt', 'desc').get().catch(() => null)
      if (s && !s.empty) docs.push(...s.docs)
    }
    const gearRec = await adminDb
      .collection('gear')
      .where('recommended', '==', true)
      .orderBy('createdAt', 'desc')
      .get()
      .catch(() => null)
    if (gearRec && !gearRec.empty) docs.push(...gearRec.docs)

    // Fallback: plain gear if nothing else
    if (docs.length === 0) {
      const s = await adminDb.collection('gear').orderBy('createdAt', 'desc').get().catch(() => null)
      if (s && !s.empty) docs.push(...s.docs)
    }

    const gearItems = docs.map((doc) => {
      const d = doc.data() as any
      return {
        id: doc.id,
        name: d.name || d.product || 'Product',
        description: d.description || '',
        price: d.price || d.priceUSD || '',
        imageUrl: d.imageUrl || d.photoURL || d.imagePath || '',
        coachId: d.coachId || d.creatorUid || '',
        link: d.link || d.url || ''
      }
    })
    return NextResponse.json({ success: true, gearItems })
  } catch (error) {
    console.error('[API/GEAR] error', error)
    return NextResponse.json({ success: false, error: 'Failed to load gear' }, { status: 500 })
  }
}


