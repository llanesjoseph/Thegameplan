import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// GET - List all announcements for a coach
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
      return NextResponse.json({ error: 'Only coaches can view announcements' }, { status: 403 })
    }

    const announcementsSnapshot = await adminDb
      .collection('announcements')
      .where('coachId', '==', uid)
      .orderBy('sentAt', 'desc')
      .get()

    const announcements = announcementsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({ success: true, announcements, count: announcements.length })
  } catch (error: any) {
    console.error('Error listing announcements:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new announcement
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
      return NextResponse.json({ error: 'Only coaches can create announcements' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, audience, sport, urgent } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing required fields: title, message' }, { status: 400 })
    }

    const announcementData = {
      coachId: uid,
      title,
      message,
      audience: audience || 'all',
      sport: sport || null,
      athleteIds: [],
      urgent: urgent || false,
      views: 0,
      acknowledged: 0,
      sentAt: new Date(),
      createdAt: new Date()
    }

    const announcementRef = await adminDb.collection('announcements').add(announcementData)

    return NextResponse.json({
      success: true,
      announcementId: announcementRef.id,
      message: 'Announcement created successfully'
    })
  } catch (error: any) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an announcement
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
      return NextResponse.json({ error: 'Only coaches can delete announcements' }, { status: 403 })
    }

    const body = await request.json()
    const { announcementId } = body

    if (!announcementId) {
      return NextResponse.json({ error: 'Missing required field: announcementId' }, { status: 400 })
    }

    const announcementDoc = await adminDb.collection('announcements').doc(announcementId).get()

    if (!announcementDoc.exists) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const announcementData = announcementDoc.data()

    if (announcementData?.coachId !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'You can only delete your own announcements' }, { status: 403 })
    }

    await adminDb.collection('announcements').doc(announcementId).delete()

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
