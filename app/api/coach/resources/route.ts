import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// GET - List all resources for a coach
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can view resources' },
        { status: 403 }
      )
    }

    // 3. Query resources by creatorUid
    const resourcesSnapshot = await adminDb
      .collection('resources')
      .where('creatorUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()

    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({
      success: true,
      resources,
      count: resources.length
    })

  } catch (error: any) {
    console.error('Error listing resources:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new resource
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can create resources' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { title, description, type, url, sport, tags, size } = body

    // 4. Validate required fields
    if (!title || !type || !url || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, url, sport' },
        { status: 400 }
      )
    }

    // 5. Create resource document
    const resourceData = {
      creatorUid: uid,
      title,
      description: description || '',
      type,
      url,
      sport,
      tags: tags || [],
      size: size || null,
      downloads: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const resourceRef = await adminDb.collection('resources').add(resourceData)

    return NextResponse.json({
      success: true,
      resourceId: resourceRef.id,
      message: 'Resource created successfully'
    })

  } catch (error: any) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a resource
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can delete resources' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { resourceId } = body

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Missing required field: resourceId' },
        { status: 400 }
      )
    }

    // 4. Get resource document
    const resourceDoc = await adminDb.collection('resources').doc(resourceId).get()

    if (!resourceDoc.exists) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    const resourceData = resourceDoc.data()

    // 5. Verify ownership (or admin)
    if (resourceData?.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only delete your own resources' },
        { status: 403 }
      )
    }

    // 6. Delete the resource
    await adminDb.collection('resources').doc(resourceId).delete()

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting resource:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
