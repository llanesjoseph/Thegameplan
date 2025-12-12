import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * VERIFY JOSEPH: Check if Joseph's profile exists in all collections
 * This helps diagnose if Joseph was accidentally deleted
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VERIFY: Checking Joseph\'s profile status...')
    
    const JOSEPH_UID = 'OQuvoho6w3NC9QTBLFSoIK7A2RQ2'
    const JOSEPH_EMAIL = 'llanes.joseph.m@gmail.com'
    
    // Check all collections
    const [userDoc, creatorDoc, coachDoc, indexDoc] = await Promise.all([
      db.collection('users').doc(JOSEPH_UID).get(),
      db.collection('creator_profiles').doc(JOSEPH_UID).get(),
      db.collection('coach_profiles').doc(JOSEPH_UID).get(),
      db.collection('creators_index').doc(JOSEPH_UID).get()
    ])
    
    // Also check by email in case UID changed
    const usersByEmail = await db.collection('users')
      .where('email', '==', JOSEPH_EMAIL)
      .limit(1)
      .get()
    
    const status = {
      uid: JOSEPH_UID,
      email: JOSEPH_EMAIL,
      collections: {
        users: {
          exists: userDoc.exists,
          data: userDoc.exists ? {
            displayName: userDoc.data()?.displayName,
            email: userDoc.data()?.email,
            role: userDoc.data()?.role,
            sport: userDoc.data()?.sport
          } : null
        },
        creator_profiles: {
          exists: creatorDoc.exists,
          data: creatorDoc.exists ? {
            displayName: creatorDoc.data()?.displayName,
            sport: creatorDoc.data()?.sport,
            isActive: creatorDoc.data()?.isActive,
            profileComplete: creatorDoc.data()?.profileComplete,
            status: creatorDoc.data()?.status
          } : null
        },
        coach_profiles: {
          exists: coachDoc.exists,
          data: coachDoc.exists ? {
            displayName: coachDoc.data()?.displayName,
            sport: coachDoc.data()?.sport
          } : null
        },
        creators_index: {
          exists: indexDoc.exists,
          data: indexDoc.exists ? {
            displayName: indexDoc.data()?.displayName,
            sport: indexDoc.data()?.sport,
            isActive: indexDoc.data()?.isActive,
            profileComplete: indexDoc.data()?.profileComplete,
            status: indexDoc.data()?.status,
            slug: indexDoc.data()?.slug
          } : null
        }
      },
      foundByEmail: !usersByEmail.empty,
      emailMatchUid: !usersByEmail.empty && usersByEmail.docs[0].id === JOSEPH_UID
    }
    
    const isVisible = indexDoc.exists && 
                     indexDoc.data()?.isActive === true &&
                     indexDoc.data()?.profileComplete === true &&
                     (indexDoc.data()?.status === 'approved' || !indexDoc.data()?.status)
    
    return NextResponse.json({
      success: true,
      status,
      summary: {
        userExists: userDoc.exists,
        profileExists: creatorDoc.exists || coachDoc.exists,
        visibleInBrowseCoaches: isVisible,
        needsFix: !userDoc.exists || !isVisible
      }
    })
    
  } catch (error: any) {
    console.error('❌ VERIFY ERROR:', error)
    return NextResponse.json(
      { error: `Failed to verify: ${error.message}`, stack: error.stack },
      { status: 500 }
    )
  }
}

