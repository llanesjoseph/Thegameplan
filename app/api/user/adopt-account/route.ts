import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Email mapping for account adoption
const ACCOUNT_ADOPTION_MAP: Record<string, string> = {
  'jasmineathleap@gmail.com': 'lv255@cornell.edu'
}

/**
 * Adopt an existing account when a new email logs in
 * This transfers all data from the old account to the new account
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const newUid = decodedToken.uid
    const newEmail = decodedToken.email?.toLowerCase() || ''

    // 2. Check if this email needs account adoption
    const oldEmail = ACCOUNT_ADOPTION_MAP[newEmail]
    if (!oldEmail) {
      return NextResponse.json({
        success: false,
        message: 'No account adoption needed for this email',
        needsAdoption: false
      })
    }

    console.log(`🔄 Account adoption detected: ${newEmail} -> adopting ${oldEmail}`)

    // 3. Check if already adopted (prevent duplicate runs)
    const newUserDoc = await adminDb.collection('users').doc(newUid).get()
    const newUserData = newUserDoc.data()
    
    if (newUserData?.accountAdopted === true) {
      console.log(`✅ Account already adopted for ${newEmail}`)
      return NextResponse.json({
        success: true,
        message: 'Account already adopted',
        alreadyAdopted: true
      })
    }

    // 4. Find the old account by email
    const oldUserQuery = await adminDb.collection('users')
      .where('email', '==', oldEmail.toLowerCase())
      .limit(1)
      .get()

    if (oldUserQuery.empty) {
      console.log(`⚠️ Old account not found: ${oldEmail}`)
      return NextResponse.json({
        success: false,
        message: `Old account not found: ${oldEmail}`,
        needsAdoption: true,
        oldAccountFound: false
      })
    }

    const oldUserDoc = oldUserQuery.docs[0]
    const oldUid = oldUserDoc.id
    const oldUserData = oldUserDoc.data()

    console.log(`📦 Found old account: ${oldUid} (${oldEmail})`)

    // 5. Transfer all data from old account to new account
    // Use a transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      // Update new user document with old account data
      const newUserRef = adminDb.collection('users').doc(newUid)
      
      // Merge old user data into new user document
      const mergedUserData = {
        ...oldUserData,
        uid: newUid, // Keep new UID
        email: newEmail, // Keep new email
        accountAdopted: true,
        accountAdoptedFrom: oldEmail,
        accountAdoptedAt: FieldValue.serverTimestamp(),
        accountAdoptedFromUid: oldUid,
        // Preserve any existing data in new account
        createdAt: newUserData?.createdAt || oldUserData?.createdAt || FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }

      transaction.set(newUserRef, mergedUserData, { merge: true })

      // Mark old account as migrated
      const oldUserRef = adminDb.collection('users').doc(oldUid)
      transaction.update(oldUserRef, {
        accountMigrated: true,
        accountMigratedTo: newEmail,
        accountMigratedToUid: newUid,
        accountMigratedAt: FieldValue.serverTimestamp(),
        accountStatus: 'migrated'
      })
    })

    // 6. Update all references to the old UID across collections
    const collectionsToUpdate = [
      { name: 'coach_followers', fields: ['coachId', 'athleteId'] },
      { name: 'athlete_feed', fields: ['athleteId', 'coachId'] },
      { name: 'coach_content', fields: ['coachId'] },
      { name: 'content', fields: ['creatorUid', 'coachId'] },
      { name: 'sessions', fields: ['coachId', 'athleteId', 'userId'] },
      { name: 'training_sessions', fields: ['coachId', 'athleteId'] },
      { name: 'coach_events', fields: ['coachId'] },
      { name: 'submissions', fields: ['athleteId', 'coachId'] },
      { name: 'coaching_requests', fields: ['coachId', 'athleteId'] },
      { name: 'creator_profiles', fields: ['uid', 'userId'] },
      { name: 'coach_profiles', fields: ['uid', 'userId'] },
      { name: 'profiles', fields: ['uid', 'userId'] },
      { name: 'creatorPublic', fields: ['uid'] },
      { name: 'coaches', fields: ['uid', 'coachId'] },
      { name: 'invitations', fields: ['coachEmail', 'athleteEmail', 'createdBy'] },
      { name: 'admin_invitations', fields: ['createdBy', 'inviterUserId'] }
    ]

    const updatePromises = collectionsToUpdate.map(async (coll) => {
      try {
        // Try each field that might reference the old UID
        for (const field of coll.fields) {
          const query = await adminDb.collection(coll.name)
            .where(field, '==', oldUid)
            .get()

          if (!query.empty) {
            console.log(`  📝 Updating ${coll.name}: ${query.size} documents with ${field}=${oldUid}`)
            
            // Process in batches of 500 (Firestore limit)
            const batchSize = 500
            const docs = query.docs
            
            for (let i = 0; i < docs.length; i += batchSize) {
              const batch = adminDb.batch()
              const batchDocs = docs.slice(i, i + batchSize)
              
              batchDocs.forEach((doc) => {
                batch.update(doc.ref, {
                  [field]: newUid,
                  [`${field}_migrated_from`]: oldUid,
                  [`${field}_migrated_at`]: FieldValue.serverTimestamp()
                })
              })
              
              await batch.commit()
            }
          }
        }
      } catch (error) {
        console.error(`⚠️ Error updating ${coll.name}:`, error)
        // Continue with other collections even if one fails
      }
    })

    await Promise.all(updatePromises)

    // 7. Update Firebase Auth email (if possible)
    try {
      const oldUserRecord = await auth.getUserByEmail(oldEmail)
      if (oldUserRecord) {
        // Update the old user's email to mark it as migrated
        await auth.updateUser(oldUserRecord.uid, {
          email: `${oldEmail}.migrated.${Date.now()}@migrated.local`
        })
        console.log(`✅ Updated old Firebase Auth email`)
      }
    } catch (error) {
      console.warn(`⚠️ Could not update Firebase Auth email:`, error)
      // Non-critical, continue
    }

    console.log(`✅ Account adoption complete: ${newEmail} adopted ${oldEmail}`)

    return NextResponse.json({
      success: true,
      message: `Successfully adopted account from ${oldEmail}`,
      oldUid,
      newUid,
      oldEmail,
      newEmail
    })

  } catch (error: any) {
    console.error('❌ Account adoption error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to adopt account',
        success: false
      },
      { status: 500 }
    )
  }
}

