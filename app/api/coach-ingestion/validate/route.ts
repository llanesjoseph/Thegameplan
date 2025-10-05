import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ingestionId = searchParams.get('id')

    if (!ingestionId) {
      return NextResponse.json({ error: 'Ingestion ID is required' }, { status: 400 })
    }

    // Get ingestion link details
    const ingestionDoc = await db.collection('coach_ingestion_links').doc(ingestionId).get()

    if (!ingestionDoc.exists) {
      return NextResponse.json({
        valid: false,
        error: 'Invitation link not found. This link may have been deleted or never existed.'
      }, { status: 404 })
    }

    const ingestionData = ingestionDoc.data()
    const now = new Date()
    const expiresAt = ingestionData?.expiresAt?.toDate()

    // Check if link is expired
    if (expiresAt && now > expiresAt) {
      return NextResponse.json({
        valid: false,
        error: 'This invitation link has expired.'
      })
    }

    // Check if link is inactive
    if (ingestionData?.status !== 'active') {
      return NextResponse.json({
        valid: false,
        error: 'This invitation link has been deactivated.'
      })
    }

    // Check if max uses exceeded
    if (ingestionData?.currentUses >= ingestionData?.maxUses) {
      return NextResponse.json({
        valid: false,
        error: 'This invitation link has reached its maximum usage limit.'
      })
    }

    // Update analytics
    await db.collection('coach_ingestion_links').doc(ingestionId).update({
      'analytics.views': (ingestionData?.analytics?.views || 0) + 1,
      updatedAt: new Date()
    })

    return NextResponse.json({
      valid: true,
      data: {
        organizationName: ingestionData?.organizationName,
        inviterName: ingestionData?.inviterName,
        sport: ingestionData?.sport,
        description: ingestionData?.description,
        customMessage: ingestionData?.customMessage,
        autoApprove: ingestionData?.autoApprove,
        expiresAt: expiresAt?.toISOString(),
        usesRemaining: ingestionData?.maxUses - ingestionData?.currentUses
      }
    })

  } catch (error) {
    console.error('Validate ingestion link error:', error)
    return NextResponse.json(
      { error: 'Failed to validate ingestion link' },
      { status: 500 }
    )
  }
}