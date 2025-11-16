import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function parseUrlMeta(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  const html = await res.text()
  const get = (re: RegExp) => (html.match(re)?.[1] || '').trim()
  const ogTitle = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || get(/<title[^>]*>([^<]+)<\/title>/i)
  const ogImage = get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  const ogDesc = get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
  const price = get(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) || get(/"price"\s*:\s*"([^"]+)"/i) || ''
  return { name: ogTitle || url, imageUrl: ogImage || '', description: ogDesc || '', price, link: url }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 })

    const decoded = await getAuth().verifyIdToken(token)
    const coachUid = decoded.uid

    const body = await request.json()
    const id = body?.id
    const url = (body?.url || '').trim()

    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })

    // Get the gear item to verify ownership
    const gearDoc = await adminDb.collection('curatedGear').doc(id).get()
    if (!gearDoc.exists) {
      return NextResponse.json({ success: false, error: 'Gear item not found' }, { status: 404 })
    }

    const gearData = gearDoc.data()

    // Verify ownership
    if (gearData?.coachId !== coachUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Parse the new URL to get updated metadata
    const meta = await parseUrlMeta(url)
    const updateData = {
      ...meta,
      updatedAt: new Date()
    }

    // Update the gear item
    await adminDb.collection('curatedGear').doc(id).update(updateData)

    return NextResponse.json({ success: true, data: updateData })
  } catch (error) {
    console.error('[API/GEAR/UPDATE] error', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
