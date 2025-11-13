import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export async function GET() {
  try {
    // Prefer curatedGear if present; fall back to gear
    let snapshot = await adminDb.collection('curatedGear').orderBy('createdAt', 'desc').get().catch(() => null)
    if (!snapshot || snapshot.empty) {
      snapshot = await adminDb.collection('gear').orderBy('createdAt', 'desc').get().catch(() => null)
    }
    const gearItems = (snapshot?.docs || []).map((doc) => {
      const d = doc.data() as any
      return {
        id: doc.id,
        name: d.name || d.product || 'Product',
        description: d.description || '',
        price: d.price || '',
        imageUrl: d.imageUrl || d.photoURL || '',
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


