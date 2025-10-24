import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/athlete/coach-data
 * Fetch athlete's assigned coach data
 * SECURITY: Only allows athletes to access their own coach data
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Get athlete's user document to find assigned coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const coachId = userData?.coachId || userData?.assignedCoachId

    if (!coachId) {
      return NextResponse.json({
        success: true,
        data: {
          coachId: null,
          coachName: '',
          coachPhotoURL: '',
          hasCoach: false
        }
      })
    }

    // 3. Get coach data
    let coachData = null
    let coachName = ''
    let coachPhotoURL = ''

    try {
      const coachDoc = await adminDb.collection('users').doc(coachId).get()
      
      if (coachDoc.exists) {
        coachData = coachDoc.data()
        coachName = coachData?.displayName || coachData?.email || 'Your Coach'
        coachPhotoURL = coachData?.photoURL || ''
      }
    } catch (error) {
      console.warn('Could not fetch coach data:', error)
    }

    // 4. Try to get coach profile image if not available
    if (!coachPhotoURL && coachId) {
      try {
        const profileQuery = adminDb
          .collection('creator_profiles')
          .where('uid', '==', coachId)
          .limit(1)
        
        const profileSnapshot = await profileQuery.get()
        
        if (!profileSnapshot.empty) {
          const profileData = profileSnapshot.docs[0].data()
          coachPhotoURL = profileData?.profileImageUrl || ''
        }
      } catch (error) {
        console.warn('Could not fetch creator profile:', error)
      }
    }

    console.log(`[COACH-DATA-API] Successfully fetched coach data for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        coachId,
        coachName,
        coachPhotoURL,
        hasCoach: !!coachId
      }
    })

  } catch (error: any) {
    console.error('[COACH-DATA-API] Error fetching coach data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch coach data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
