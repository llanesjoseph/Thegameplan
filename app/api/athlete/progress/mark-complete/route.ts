import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const athleteUid = decodedToken.uid

    // 2. Get request body
    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })
    }

    // 3. Mark lesson as complete in athlete's progress
    const progressRef = adminDb
      .collection('users')
      .doc(athleteUid)
      .collection('progress')
      .doc(lessonId)

    await progressRef.set(
      {
        lessonId,
        completedAt: FieldValue.serverTimestamp(),
        athleteUid,
        status: 'completed'
      },
      { merge: true }
    )

    // 4. Update lesson completion count
    await adminDb
      .collection('content')
      .doc(lessonId)
      .update({
        completionCount: FieldValue.increment(1)
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/ATHLETE/PROGRESS/MARK-COMPLETE] error', error)
    return NextResponse.json({ error: 'Failed to mark lesson as complete' }, { status: 500 })
  }
}
