import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Require admin or superadmin role
    const authResult = await requireAuth(request, ['admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult

    console.log(`🔧 [FIX-COACH-ASSIGNMENT] Starting coach assignment fix...`)

    // Get all athletes
    const athletesSnapshot = await db.collection('athletes').get()
    console.log(`📊 Found ${athletesSnapshot.size} total athletes`)

    let fixedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const results: any[] = []

    for (const athleteDoc of athletesSnapshot.docs) {
      const athleteData = athleteDoc.data()
      const athleteId = athleteDoc.id
      const athleteEmail = athleteData.email

      try {
        // Check if coach is already assigned
        const hasCoachAssignment = athleteData.coachId || athleteData.assignedCoachId

        if (hasCoachAssignment) {
          console.log(`✅ Athlete ${athleteEmail} already has coach assigned, skipping`)
          skippedCount++
          results.push({
            athleteId,
            athleteEmail,
            status: 'skipped',
            reason: 'Already has coach assignment'
          })
          continue
        }

        // Get invitation ID from athlete document
        const invitationId = athleteData.invitationId

        if (!invitationId) {
          console.log(`⚠️ Athlete ${athleteEmail} has no invitation ID, skipping`)
          skippedCount++
          results.push({
            athleteId,
            athleteEmail,
            status: 'skipped',
            reason: 'No invitation ID found'
          })
          continue
        }

        // Get the invitation to find the coach
        const invitationDoc = await db.collection('invitations').doc(invitationId).get()

        if (!invitationDoc.exists) {
          console.log(`⚠️ Invitation ${invitationId} not found for athlete ${athleteEmail}`)
          errorCount++
          results.push({
            athleteId,
            athleteEmail,
            status: 'error',
            reason: 'Invitation not found'
          })
          continue
        }

        const invitationData = invitationDoc.data()
        const coachUid = invitationData?.creatorUid || invitationData?.coachId

        if (!coachUid) {
          console.log(`⚠️ No coach UID in invitation for athlete ${athleteEmail}`)
          errorCount++
          results.push({
            athleteId,
            athleteEmail,
            status: 'error',
            reason: 'No coach UID in invitation'
          })
          continue
        }

        // Update athlete document
        await db.collection('athletes').doc(athleteId).update({
          coachId: coachUid,
          assignedCoachId: coachUid,
          updatedAt: new Date()
        })

        console.log(`✅ Updated athlete document for ${athleteEmail} with coach ${coachUid}`)

        // Update user document
        const userUid = athleteData.uid

        if (userUid) {
          await db.collection('users').doc(userUid).update({
            coachId: coachUid,
            assignedCoachId: coachUid,
            updatedAt: new Date()
          })

          console.log(`✅ Updated user document for ${athleteEmail} with coach ${coachUid}`)
        }

        fixedCount++
        results.push({
          athleteId,
          athleteEmail,
          status: 'fixed',
          coachUid
        })

        console.log(`🎯 Fixed coach assignment for ${athleteEmail}`)

      } catch (error) {
        console.error(`❌ Error fixing athlete ${athleteEmail}:`, error)
        errorCount++
        results.push({
          athleteId,
          athleteEmail,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Audit log
    await auditLog('athlete_coach_assignment_fix', {
      totalAthletes: athletesSnapshot.size,
      fixedCount,
      skippedCount,
      errorCount,
      fixedBy: authUser.uid,
      fixedByEmail: authUser.email
    }, { userId: authUser.uid, severity: 'high' })

    console.log(`✅ [FIX-COACH-ASSIGNMENT] Complete: ${fixedCount} fixed, ${skippedCount} skipped, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Coach assignment fix complete: ${fixedCount} athletes fixed, ${skippedCount} skipped, ${errorCount} errors`,
      data: {
        totalAthletes: athletesSnapshot.size,
        fixedCount,
        skippedCount,
        errorCount,
        results
      }
    })

  } catch (error) {
    console.error('Fix athlete coach assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to fix athlete coach assignments' },
      { status: 500 }
    )
  }
}
