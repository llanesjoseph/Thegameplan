import { NextRequest, NextResponse } from 'next/server'
import { adminDb, auth as adminAuth } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const body = await request.json()
    const lessonId: string = (body.lessonId || '').trim()
    const completed: boolean = !!body.completed

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Missing lessonId' },
        { status: 400 }
      )
    }

    const completionId = `${uid}_${lessonId}`
    const ref = adminDb.collection('lessonCompletions').doc(completionId)

    if (completed) {
      const now = new Date()
      await ref.set(
        {
          athleteUid: uid,
          lessonId,
          completedAt: now
        },
        { merge: true }
      )
    } else {
      await ref.delete().catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/ATHLETE/LESSON-COMPLETION] error', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update lesson completion' },
      { status: 500 }
    )
  }
}


