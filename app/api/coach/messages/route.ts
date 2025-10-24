import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')

    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching messages for coach:', '[COACH_ID]')

    // First, try to find the coach by the provided ID
    let actualCoachId = coachId
    let coachEmail = null

    try {
      const coachDoc = await adminDb.collection('users').doc(coachId).get()
      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        coachEmail = coachData?.email
        console.log('Found coach by ID:', coachData?.displayName, coachData?.email)
      } else {
        console.log('Coach not found by ID, trying to find by email or other means')
        // If coach not found by ID, try to find by email or other identifiers
        // This handles cases where the user ID might be different from the coach profile ID
      }
    } catch (userError) {
      console.log('Error fetching coach user data:', userError)
    }

    // Fetch messages where coachId matches
    let messagesSnapshot
    try {
      messagesSnapshot = await adminDb
        .collection('messages')
        .where('coachId', '==', actualCoachId)
        .orderBy('createdAt', 'desc')
        .get()
    } catch (queryError) {
      console.error('Error querying messages by coachId:', queryError)
      // If the query fails (possibly due to missing index), try a different approach
      // Get all messages and filter client-side (not ideal for large datasets, but works for now)
      const allMessagesSnapshot = await adminDb.collection('messages').get()
      const filteredMessages = allMessagesSnapshot.docs.filter(doc => {
        const data = doc.data()
        return data.coachId === actualCoachId || 
               (coachEmail && data.coachEmail === coachEmail)
      })
      
      messagesSnapshot = {
        docs: filteredMessages,
        size: filteredMessages.length
      }
    }

    const messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        readAt: data.readAt?.toDate?.() || data.readAt || null,
        repliedAt: data.repliedAt?.toDate?.() || data.repliedAt || null
      }
    })

    console.log(`Found ${messages.length} messages for coach ${actualCoachId}`)

    return NextResponse.json({
      success: true,
      messages,
      totalCount: messages.length
    })

  } catch (error: any) {
    console.error('Error fetching coach messages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messageId, action } = await request.json()

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'Message ID and action are required' },
        { status: 400 }
      )
    }

    console.log(`Updating message [MESSAGE_ID]`)

    const messageRef = adminDb.collection('messages').doc(messageId)
    const messageDoc = await messageRef.get()

    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (action === 'mark_read') {
      updateData.status = 'read'
      updateData.readAt = new Date()
    } else if (action === 'mark_replied') {
      updateData.status = 'replied'
      updateData.repliedAt = new Date()
    }

    await messageRef.update(updateData)

    console.log(`Message [MESSAGE_ID] updated successfully`)

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
