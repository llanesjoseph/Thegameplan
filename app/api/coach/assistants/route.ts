import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List all assistants for a coach
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const uid = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Only coaches can view assistants' }, { status: 403 })
    }

    const assistantsSnapshot = await adminDb
      .collection('assistant_coaches')
      .where('creatorUid', '==', uid)
      .orderBy('invitedAt', 'desc')
      .get()

    const assistants = assistantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      invitedAt: doc.data().invitedAt?.toDate?.()?.toISOString() || null,
      acceptedAt: doc.data().acceptedAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({ success: true, assistants, count: assistants.length })
  } catch (error: any) {
    console.error('Error listing assistants:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Invite a new assistant coach
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const uid = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Only coaches can invite assistants' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, permissions } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 })
    }

    const assistantData = {
      creatorUid: uid,
      name,
      email: email.toLowerCase(),
      status: 'pending',
      role: role || 'viewer',
      permissions: permissions || [],
      invitedAt: new Date(),
      createdAt: new Date()
    }

    const assistantRef = await adminDb.collection('assistant_coaches').add(assistantData)

    return NextResponse.json({
      success: true,
      assistantId: assistantRef.id,
      message: 'Assistant invitation sent successfully'
    })
  } catch (error: any) {
    console.error('Error inviting assistant:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove an assistant
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const uid = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Only coaches can remove assistants' }, { status: 403 })
    }

    const body = await request.json()
    const { assistantId } = body

    if (!assistantId) {
      return NextResponse.json({ error: 'Missing required field: assistantId' }, { status: 400 })
    }

    const assistantDoc = await adminDb.collection('assistant_coaches').doc(assistantId).get()

    if (!assistantDoc.exists) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })
    }

    const assistantData = assistantDoc.data()

    if (assistantData?.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'You can only remove your own assistants' }, { status: 403 })
    }

    await adminDb.collection('assistant_coaches').doc(assistantId).delete()

    return NextResponse.json({ success: true, message: 'Assistant removed successfully' })
  } catch (error: any) {
    console.error('Error removing assistant:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
