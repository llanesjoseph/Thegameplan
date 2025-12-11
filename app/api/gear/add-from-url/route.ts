import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminDb } from '@/lib/firebase.admin'

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

  // Try structured/meta prices first
  let priceText =
    get(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) ||
    get(/"price"\s*:\s*"([^"]+)"/i) ||
    ''

  // Fallback: look for a currency pattern like "$191.99" in the HTML (covers sites like Gold BJJ)
  if (!priceText) {
    const currencyMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/)
    if (currencyMatch) {
      priceText = `$${currencyMatch[1]}`
    }
  }

  // Normalize to a numeric USD price when possible
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
    // Store both the formatted text and a numeric USD value if we could parse it
    price: priceText || (priceUSD !== undefined ? priceUSD : ''),
    priceUSD,
    link: url
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 })
    const decoded = await getAuth().verifyIdToken(token)
    const coachUid = decoded.uid
    const body = await request.json()
    const url = (body?.url || '').trim()
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })

    const meta = await parseUrlMeta(url)
    const doc = {
      ...meta,
      coachId: coachUid,
      recommended: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const ref = await adminDb.collection('curatedGear').add(doc)
    return NextResponse.json({ success: true, id: ref.id, data: doc })
  } catch (error) {
    console.error('[API/GEAR/ADD-FROM-URL] error', error)
    return NextResponse.json({ success: false, error: 'Failed to add' }, { status: 500 })
  }
}


