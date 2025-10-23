import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { ensureCoachVisibility, batchEnsureCoachVisibility } from '@/lib/ensure-coach-visibility'

export const runtime = 'nodejs'

/**
 * POST /api/admin/validate-coach-visibility
 * Admin endpoint to validate and fix coach visibility issues
 * Ensures all coaches are visible in Browse Coaches section
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [VALIDATE-COACH-VISIBILITY] Starting validation...')

    // Get all users with coach role
    const usersSnapshot = await adminDb
      .collection('users')
      .where('role', 'in', ['coach', 'creator'])
      .get()

    console.log(`📊 Found ${usersSnapshot.size} coaches in users collection`)

    // Get all coaches in creators_index
    const creatorsSnapshot = await adminDb
      .collection('creators_index')
      .get()

    console.log(`📊 Found ${creatorsSnapshot.size} coaches in creators_index`)

    const coachesToFix = []
    const results = []

    // Check each coach
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const uid = userDoc.id

      // Check if coach exists in creators_index
      const creatorDoc = await adminDb.collection('creators_index').doc(uid).get()
      
      if (!creatorDoc.exists) {
        console.log(`⚠️ Coach ${userData.displayName} missing from creators_index`)
        
        coachesToFix.push({
          uid: uid,
          email: userData.email || '',
          displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          sport: userData.sport || '',
          tagline: userData.tagline || '',
          bio: userData.bio || '',
          specialties: userData.specialties || [],
          achievements: userData.achievements || [],
          experience: userData.experience || '',
          credentials: userData.credentials || '',
          isActive: true,
          profileComplete: true,
          status: 'approved',
          verified: true,
          featured: false
        })
      } else {
        const creatorData = creatorDoc.data()
        const isVisible = creatorData?.isActive === true && 
                         creatorData?.profileComplete === true && 
                         (creatorData?.status === 'approved' || !creatorData?.status)

        if (!isVisible) {
          console.log(`⚠️ Coach ${userData.displayName} exists but not visible`)
          
          coachesToFix.push({
            uid: uid,
            email: userData.email || '',
            displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            sport: userData.sport || '',
            tagline: userData.tagline || '',
            bio: userData.bio || '',
            specialties: userData.specialties || [],
            achievements: userData.achievements || [],
            experience: userData.experience || '',
            credentials: userData.credentials || '',
            isActive: true,
            profileComplete: true,
            status: 'approved',
            verified: true,
            featured: false
          })
        } else {
          console.log(`✅ Coach ${userData.displayName} is properly visible`)
        }
      }
    }

    // Fix coaches that need it
    if (coachesToFix.length > 0) {
      console.log(`🔧 Fixing ${coachesToFix.length} coaches...`)
      
      const batchResult = await batchEnsureCoachVisibility(coachesToFix)
      
      results.push({
        action: 'batch_fix',
        coachesFixed: batchResult.success,
        coachesFailed: batchResult.failed,
        details: batchResult.results
      })
    }

    // Final verification
    const finalCreatorsSnapshot = await adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .get()

    const activeCoaches = finalCreatorsSnapshot.docs.filter(doc => {
      const data = doc.data()
      return data.profileComplete === true && 
             (data.status === 'approved' || !data.status)
    })

    console.log(`✅ [VALIDATE-COACH-VISIBILITY] Complete: ${activeCoaches.length} active coaches visible`)

    return NextResponse.json({
      success: true,
      message: `Validation complete. ${activeCoaches.length} coaches are now visible in Browse Coaches.`,
      data: {
        totalCoaches: usersSnapshot.size,
        visibleCoaches: activeCoaches.length,
        coachesFixed: coachesToFix.length,
        results: results
      }
    })

  } catch (error: any) {
    console.error('❌ [VALIDATE-COACH-VISIBILITY] Error:', error)
    return NextResponse.json(
      { error: `Validation failed: ${error.message}` },
      { status: 500 }
    )
  }
}
