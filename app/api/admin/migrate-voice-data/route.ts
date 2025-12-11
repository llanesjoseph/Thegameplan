import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { requireAuth } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * ONE-TIME MIGRATION: Copy voiceCaptureData from creator_profiles to users collection
 * This fixes coaches who onboarded before the critical bug fix
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting voice data migration...')

    // Get all creator profiles with voiceCaptureData
    const profilesSnapshot = await adminDb
      .collection('creator_profiles')
      .where('voiceCaptureData', '!=', null)
      .get()

    if (profilesSnapshot.empty) {
      console.log('✅ No profiles with voice data found')
      return NextResponse.json({
        success: true,
        message: 'No profiles need migration',
        migrated: 0
      })
    }

    console.log(`📊 Found ${profilesSnapshot.size} profiles with voice data`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    const results: Array<{
      uid: string
      email: string
      status: 'migrated' | 'skipped' | 'error'
      reason?: string
    }> = []

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data()
      const uid = profileDoc.id

      try {
        // Get user document
        const userDoc = await adminDb.collection('users').doc(uid).get()

        if (!userDoc.exists) {
          console.log(`⚠️ User document not found for uid: ${uid}`)
          skippedCount++
          results.push({
            uid,
            email: profileData.email || 'unknown',
            status: 'skipped',
            reason: 'User document not found'
          })
          continue
        }

        const userData = userDoc.data()

        // Check if voice data already exists in users collection
        if (userData?.voiceCaptureData) {
          console.log(`⏭️ Skipping ${profileData.email} - already has voice data in users collection`)
          skippedCount++
          results.push({
            uid,
            email: profileData.email || 'unknown',
            status: 'skipped',
            reason: 'Already has voice data'
          })
          continue
        }

        // Copy voice data from creator_profiles to users
        await adminDb.collection('users').doc(uid).update({
          voiceCaptureData: profileData.voiceCaptureData,
          voiceCaptureCompleteness: profileData.voiceCaptureCompleteness || 'none',
          voiceDataMigrated: true,
          voiceDataMigratedAt: new Date()
        })

        console.log(`✅ Migrated voice data for ${profileData.email || uid}`)
        migratedCount++
        results.push({
          uid,
          email: profileData.email || 'unknown',
          status: 'migrated'
        })

      } catch (error: any) {
        console.error(`❌ Error migrating ${uid}:`, error.message)
        errorCount++
        results.push({
          uid,
          email: profileData.email || 'unknown',
          status: 'error',
          reason: error.message
        })
      }
    }

    console.log(`
🎉 Migration complete!
   ✅ Migrated: ${migratedCount}
   ⏭️ Skipped: ${skippedCount}
   ❌ Errors: ${errorCount}
   📊 Total: ${profilesSnapshot.size}
    `)

    return NextResponse.json({
      success: true,
      summary: {
        total: profilesSnapshot.size,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errorCount
      },
      details: results
    })

  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
