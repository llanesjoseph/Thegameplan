import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb, adminStorage } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * POST /api/tools/purge-incomplete-submissions
 * Deletes athlete's submissions that are incomplete (no videoDownloadUrl) and their storage files
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decoded
    try {
      decoded = await auth.verifyIdToken(token)
    } catch (e: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.uid

    // Find incomplete submissions
    const snap = await adminDb
      .collection('submissions')
      .where('athleteUid', '==', userId)
      .get()

    const toDelete: any[] = []
    snap.forEach(doc => {
      const data = doc.data() as any
      const isIncomplete = !data.videoDownloadUrl || data.status === 'draft' || data.status === 'pending'
      if (isIncomplete) {
        toDelete.push({ id: doc.id, ...data })
      }
    })

    // Delete associated files best-effort
    const bucket = adminStorage.bucket()
    for (const sub of toDelete) {
      try {
        if (sub.videoStoragePath) {
          await bucket.file(sub.videoStoragePath).delete().catch(() => {})
        }
        if (sub.thumbnailStoragePath) {
          await bucket.file(sub.thumbnailStoragePath).delete().catch(() => {})
        }
      } catch {}
    }

    // Delete submission docs
    for (const sub of toDelete) {
      await adminDb.collection('submissions').doc(sub.id).delete().catch(() => {})
    }

    return NextResponse.json({ success: true, deleted: toDelete.length })
  } catch (error: any) {
    console.error('Purge error:', error)
    return NextResponse.json({ error: 'Purge failed', details: error.message }, { status: 500 })
  }
}


