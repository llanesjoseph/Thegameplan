import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminDb } from '@/lib/firebase.admin'

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


