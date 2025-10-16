import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Sync existing coach profiles to creatorPublic collection
 * This ensures coaches appear on the /coaches page
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting coach profiles sync to creatorPublic...')

    // Get all coach profiles
    const coachProfilesSnapshot = await adminDb.collection('coach_profiles').get()
    let syncedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const profileDoc of coachProfilesSnapshot.docs) {
      try {
        const profileData = profileDoc.data()
        const uid = profileDoc.id

        // Check if already exists in creatorPublic
        const existingDoc = await adminDb.collection('creatorPublic').doc(uid).get()
        if (existingDoc.exists) {
          console.log(`⏭️  Skipping ${profileData.displayName} - already exists in creatorPublic`)
          skippedCount++
          continue
        }

        // Create creatorPublic entry
        const creatorPublicData = {
          id: uid,
          name: profileData.displayName || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          firstName: profileData.firstName || '',
          sport: (profileData.sport || '').toLowerCase(),
          tagline: profileData.tagline || '',
          heroImageUrl: profileData.heroImageUrl || '',
          headshotUrl: profileData.headshotUrl || '',
          badges: profileData.badges || [],
          lessonCount: profileData.lessonCount || 0,
          specialties: profileData.specialties || [],
          experience: 'coach' as const,
          verified: profileData.verified !== false, // Default to true if not specified
          featured: profileData.featured || false,
          createdAt: profileData.createdAt || new Date(),
          updatedAt: new Date()
        }

        await adminDb.collection('creatorPublic').doc(uid).set(creatorPublicData)
        console.log(`✅ Synced ${creatorPublicData.name} to creatorPublic`)
        syncedCount++

      } catch (error) {
        console.error(`❌ Error syncing profile ${profileDoc.id}:`, error)
        errorCount++
      }
    }

    // Also sync creator_profiles collection
    const creatorProfilesSnapshot = await adminDb.collection('creator_profiles').get()

    for (const profileDoc of creatorProfilesSnapshot.docs) {
      try {
        const profileData = profileDoc.data()
        const uid = profileDoc.id

        // Check if already exists in creatorPublic
        const existingDoc = await adminDb.collection('creatorPublic').doc(uid).get()
        if (existingDoc.exists) {
          console.log(`⏭️  Skipping ${profileData.displayName} - already exists in creatorPublic`)
          skippedCount++
          continue
        }

        // Create creatorPublic entry
        const creatorPublicData = {
          id: uid,
          name: profileData.displayName || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          firstName: profileData.firstName || '',
          sport: (profileData.sport || '').toLowerCase(),
          tagline: profileData.tagline || '',
          heroImageUrl: profileData.heroImageUrl || '',
          headshotUrl: profileData.headshotUrl || '',
          badges: profileData.badges || [],
          lessonCount: profileData.lessonCount || 0,
          specialties: profileData.specialties || [],
          experience: 'coach' as const,
          verified: profileData.verified !== false,
          featured: profileData.featured || false,
          createdAt: profileData.createdAt || new Date(),
          updatedAt: new Date()
        }

        await adminDb.collection('creatorPublic').doc(uid).set(creatorPublicData)
        console.log(`✅ Synced ${creatorPublicData.name} to creatorPublic`)
        syncedCount++

      } catch (error) {
        console.error(`❌ Error syncing profile ${profileDoc.id}:`, error)
        errorCount++
      }
    }

    const summary = {
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: coachProfilesSnapshot.size + creatorProfilesSnapshot.size
    }

    console.log('✅ Sync complete:', summary)

    return NextResponse.json({
      success: true,
      data: summary,
      message: `Synced ${syncedCount} profiles to creatorPublic (${skippedCount} skipped, ${errorCount} errors)`
    })

  } catch (error) {
    console.error('Sync coaches to public error:', error)
    return NextResponse.json(
      { error: 'Failed to sync coaches to public collection' },
      { status: 500 }
    )
  }
}
