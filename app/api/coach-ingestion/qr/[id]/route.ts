import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ingestionId = params.id

    // Get ingestion link details
    const ingestionDoc = await db.collection('coach_ingestion_links').doc(ingestionId).get()

    if (!ingestionDoc.exists) {
      return NextResponse.json({ error: 'Ingestion link not found' }, { status: 404 })
    }

    const ingestionData = ingestionDoc.data()

    // Check if link is expired or inactive
    if (ingestionData?.status !== 'active' || new Date() > ingestionData?.expiresAt?.toDate()) {
      return NextResponse.json({ error: 'Ingestion link is expired or inactive' }, { status: 410 })
    }

    // Generate QR code URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ingestionUrl = `${baseUrl}/coach-onboard/${ingestionId}`

    // Generate QR code
    const qrCode = await QRCode.toBuffer(ingestionUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Update analytics
    await db.collection('coach_ingestion_links').doc(ingestionId).update({
      'analytics.views': (ingestionData?.analytics?.views || 0) + 1,
      updatedAt: new Date()
    })

    return new NextResponse(qrCode as any, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="coach-invite-${ingestionId}.png"`,
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}