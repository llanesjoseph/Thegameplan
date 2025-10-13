import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// One-time fix endpoint to add createdAt to users who don't have it
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

    // 2. Verify user has admin role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only admins can run this fix' },
        { status: 403 }
      )
    }

    console.log(`Admin ${uid} running createdAt fix...`)

    // 3. Get all users
    const usersSnapshot = await adminDb.collection('users').get()
    const usersToFix: string[] = []
    const now = new Date()

    // 4. Find users without createdAt
    usersSnapshot.forEach(doc => {
      const data = doc.data()
      if (!data.createdAt) {
        usersToFix.push(doc.id)
      }
    })

    console.log(`Found ${usersToFix.length} users without createdAt field`)

    // 5. Update each user
    const batch = adminDb.batch()
    let batchCount = 0

    for (const userId of usersToFix) {
      const userRef = adminDb.collection('users').doc(userId)

      // Use lastLoginAt if available, otherwise use current date
      const userDocData = usersSnapshot.docs.find(d => d.id === userId)?.data()
      const createdAt = userDocData?.lastLoginAt || now

      batch.update(userRef, {
        createdAt: createdAt,
        updatedAt: now
      })

      batchCount++

      // Firestore batch limit is 500 operations
      if (batchCount === 500) {
        await batch.commit()
        console.log('Committed batch of 500 updates')
        batchCount = 0
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Committed final batch of ${batchCount} updates`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added createdAt to ${usersToFix.length} users`,
      usersFixed: usersToFix.length,
      userIds: usersToFix
    })

  } catch (error: any) {
    console.error('Error fixing createdAt:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
