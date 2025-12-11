import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

// Public gear feed used by the Gear Store page.
// Merges curated and recommended gear and enriches each item with the coach's sport (when available)
// so the UI can filter/sort by sport.
export async function GET() {
  try {
    // Merge from multiple sources: curatedGear, recommendedGear, gear where recommended==true
    const collections = ['curatedGear', 'recommendedGear']
    const docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = []

    for (const col of collections) {
      const s = await adminDb
        .collection(col)
        .orderBy('createdAt', 'desc')
        .get()
        .catch(() => null)

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
      const s = await adminDb
        .collection('gear')
        .orderBy('createdAt', 'desc')
        .get()
        .catch(() => null)

      if (s && !s.empty) docs.push(...s.docs)
    }

    // Base gear items pulled from Firestore
    const baseItems = docs.map((doc) => {
      const d = doc.data() as any
      const rawPrice = typeof d.priceUSD !== 'undefined' && d.priceUSD !== null ? d.priceUSD : d.price

      return {
        id: doc.id,
        name: d.name || d.product || 'Product',
        description: d.description || '',
        price: rawPrice ?? '',
        imageUrl: d.imageUrl || d.photoURL || d.imagePath || '',
        coachId: d.coachId || d.creatorUid || '',
        coachName: d.coachName || d.creatorName || d.displayName || '',
        link: d.link || d.url || ''
      }
    })

    // Enrich with coach sport so the UI can filter by sport.
    const coachIds = Array.from(
      new Set(
        baseItems
          .map((g) => g.coachId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    )

    const coachSportMap: Record<string, string> = {}

    if (coachIds.length > 0) {
      await Promise.all(
        coachIds.map(async (coachId) => {
          try {
            // Try creator_profiles first
            let profileSnap = await adminDb.collection('creator_profiles').doc(coachId).get()
            let profileData: any = profileSnap.exists ? profileSnap.data() : null

            // Fallback to creatorPublic
            if (!profileData) {
              const publicSnap = await adminDb.collection('creatorPublic').doc(coachId).get()
              if (publicSnap.exists) profileData = publicSnap.data()
            }

            // Final fallback to users collection
            if (!profileData) {
              const userSnap = await adminDb.collection('users').doc(coachId).get()
              if (userSnap.exists) profileData = userSnap.data()
            }

            if (profileData) {
              const sport =
                profileData.sport ||
                profileData.primarySport ||
                (Array.isArray(profileData.specialties) && profileData.specialties.length > 0
                  ? profileData.specialties[0]
                  : '')

              if (sport) {
                coachSportMap[coachId] = sport
              }
            }
          } catch (err) {
            console.warn('[API/GEAR] failed to load coach sport for', coachId, err)
          }
        })
      )
    }

    const gearItems = baseItems.map((item) => ({
      ...item,
      sport: item.coachId ? coachSportMap[item.coachId] || '' : ''
    }))

    return NextResponse.json({ success: true, gearItems })
  } catch (error) {
    console.error('[API/GEAR] error', error)
    return NextResponse.json({ success: false, error: 'Failed to load gear' }, { status: 500 })
  }
}

