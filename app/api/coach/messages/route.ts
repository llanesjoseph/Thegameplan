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

    console.log('Fetching messages for coach:', coachId)

    // Fetch messages where coachId matches
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('coachId', '==', coachId)
      .orderBy('createdAt', 'desc')
      .get()

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }))

    console.log(`Found ${messages.length} messages for coach ${coachId}`)

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

    console.log(`Updating message ${messageId} with action: ${action}`)

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

    console.log(`Message ${messageId} updated successfully`)

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
