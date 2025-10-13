import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendAnnouncementEmail } from '@/lib/email-service'

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
      .where('creatorUid', '==', uid)
      .get()

    const announcements = announcementsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || null
      }))
      .sort((a, b) => {
        // Sort by sentAt descending (newest first)
        const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return dateB - dateA
      })

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
      creatorUid: uid,
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

    // ============================================
    // SEND EMAILS TO ATHLETES
    // ============================================

    console.log(`📧 Sending announcement emails to athletes...`)

    // Get coach name for email
    const coachName = userData?.displayName || userData?.name || 'Your Coach'

    // Fetch athletes based on audience setting
    let athletesToNotify: any[] = []

    try {
      // Get all accepted invitations from this coach
      const invitationsSnapshot = await adminDb
        .collection('invitations')
        .where('creatorUid', '==', uid)
        .where('status', '==', 'accepted')
        .get()

      const athleteEmails = invitationsSnapshot.docs.map(doc => doc.data().athleteEmail)

      console.log(`Found ${athleteEmails.length} accepted invitations`)

      if (athleteEmails.length === 0) {
        console.log('⚠️  No athletes found for this coach')
        return NextResponse.json({
          success: true,
          announcementId: announcementRef.id,
          message: 'Announcement created successfully (no athletes to notify)',
          emailsSent: 0,
          emailsFailed: 0
        })
      }

      console.log(`Found ${athleteEmails.length} athletes in coach's roster`)

      // Fetch athlete details using email addresses
      const athleteDetailsPromises = athleteEmails.map(async (email) => {
        // Query users by email
        const usersSnapshot = await adminDb
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get()

        if (!usersSnapshot.empty) {
          const athleteDoc = usersSnapshot.docs[0]
          const athleteData = athleteDoc.data()
          return {
            uid: athleteDoc.id,
            email: athleteData?.email,
            name: athleteData?.displayName || athleteData?.name || 'Athlete',
            sport: athleteData?.sport || athleteData?.sports?.[0]
          }
        }
        return null
      })

      const allAthletesRaw = await Promise.all(athleteDetailsPromises)
      const allAthletes = allAthletesRaw.filter((a): a is NonNullable<typeof a> => a !== null && Boolean(a.email))

      // Filter based on audience setting
      if (audience === 'all') {
        athletesToNotify = allAthletes
      } else if (audience === 'sport' && sport) {
        athletesToNotify = allAthletes.filter(athlete =>
          athlete.sport?.toLowerCase() === sport.toLowerCase()
        )
      } else {
        // For now, default to all if audience type is not recognized
        athletesToNotify = allAthletes
      }

      console.log(`Filtered to ${athletesToNotify.length} athletes based on audience: ${audience}`)

    } catch (error) {
      console.error('Error fetching athletes:', error)
    }

    // Send emails to each athlete
    let emailsSent = 0
    let emailsFailed = 0
    const athleteIdsSent: string[] = []

    for (const athlete of athletesToNotify) {
      try {
        const emailResult = await sendAnnouncementEmail({
          to: athlete.email,
          athleteName: athlete.name,
          coachName: coachName,
          announcementTitle: title,
          announcementMessage: message,
          isUrgent: urgent || false
        })

        if (emailResult.success) {
          emailsSent++
          athleteIdsSent.push(athlete.uid)
          console.log(`✅ Email sent to ${athlete.name} (${athlete.email})`)
        } else {
          emailsFailed++
          console.error(`❌ Failed to send email to ${athlete.name}: ${emailResult.error}`)
        }
      } catch (error) {
        emailsFailed++
        console.error(`❌ Error sending email to ${athlete.name}:`, error)
      }
    }

    // Update announcement document with email stats
    await announcementRef.update({
      athleteIds: athleteIdsSent,
      emailsSent: emailsSent,
      emailsFailed: emailsFailed,
      totalRecipients: athletesToNotify.length
    })

    console.log(`📊 Email Summary: ${emailsSent} sent, ${emailsFailed} failed`)

    return NextResponse.json({
      success: true,
      announcementId: announcementRef.id,
      message: 'Announcement created and emails sent successfully',
      emailsSent,
      emailsFailed,
      totalRecipients: athletesToNotify.length
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

    if (announcementData?.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'You can only delete your own announcements' }, { status: 403 })
    }

    await adminDb.collection('announcements').doc(announcementId).delete()

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
