import { NextRequest, NextResponse } from 'next/server'
import { adminDb, auth as adminAuth } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_COLLECTIONS = ['curatedGear', 'recommendedGear', 'gear']

async function parseUrlMeta(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  const html = await res.text()
  const get = (re: RegExp) => (html.match(re)?.[1] || '').trim()

  const ogTitle =
    get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<title[^>]*>([^<]+)<\/title>/i)
  const ogImage = get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  const ogDesc =
    get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)

  let priceText =
    get(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) ||
    get(/"price"\s*:\s*"([^"]+)"/i) ||
    ''

  if (!priceText) {
    const currencyMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/)
    if (currencyMatch) {
      priceText = `$${currencyMatch[1]}`
    }
  }

  let priceUSD: number | undefined
  if (priceText) {
    const numeric = parseFloat(priceText.replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(numeric)) {
      priceUSD = numeric
    }
  }

  return {
    name: ogTitle || url,
    imageUrl: ogImage || '',
    description: ogDesc || '',
    price: priceText || (priceUSD !== undefined ? priceUSD : ''),
    priceUSD,
    link: url
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const body = await request.json()
    const id: string = (body.id || '').trim()
    const url: string = (body.url || '').trim()
    const source: string = (body.source || '').trim()

    if (!id || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, url' },
        { status: 400 }
      )
    }

    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data() || {}
    const userRole = userData.role || userData.roles?.[0] || 'user'
    const isAdmin = ['admin', 'superadmin'].includes(userRole)

    const resolveDocRef = async () => {
      if (source && ALLOWED_COLLECTIONS.includes(source)) {
        const ref = adminDb.collection(source).doc(id)
        const snap = await ref.get()
        if (snap.exists) return { ref, snap }
      }

      for (const col of ALLOWED_COLLECTIONS) {
        const ref = adminDb.collection(col).doc(id)
        const snap = await ref.get()
        if (snap.exists) return { ref, snap }
      }

      return null
    }

    const resolved = await resolveDocRef()
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: 'Gear item not found' },
        { status: 404 }
      )
    }

    const { ref, snap } = resolved
    const data = snap.data() as any

    const ownerId =
      data.coachId ||
      data.creatorUid ||
      data.createdBy ||
      data.ownerUid ||
      data.coachUID ||
      data.creatorID ||
      data.authorUid ||
      data.userId ||
      ''

    if (!isAdmin && ownerId && ownerId !== uid) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own gear' },
        { status: 403 }
      )
    }

    const meta = await parseUrlMeta(url)

    const updateData = {
      ...meta,
      updatedAt: new Date()
    }

    await ref.update(updateData)

    return NextResponse.json({ success: true, data: updateData })
  } catch (error: any) {
    console.error('[API/GEAR/UPDATE] error', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update gear' },
      { status: 500 }
    )
  }
}

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
