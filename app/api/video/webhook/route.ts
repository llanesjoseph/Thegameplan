/**
 * Transcoder webhook handler
 * Receives notifications when transcoding jobs complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { db } from '@/lib/firebase.client'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const storage = new Storage({
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID
})

const UPLOAD_BUCKET = process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET || 'gameplan-uploads'
const DELIVERY_BUCKET = process.env.NEXT_PUBLIC_GCS_DELIVERY_BUCKET || 'gameplan-delivery'
const WEBHOOK_SECRET = process.env.TRANSCODER_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const receivedSecret = request.headers.get('x-webhook-secret')
    if (receivedSecret !== WEBHOOK_SECRET) {
      console.warn('⚠️ Webhook secret mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    console.log('📥 Transcoder webhook received:', payload)

    const { jobName, state } = payload

    if (!jobName) {
      return NextResponse.json({ error: 'Missing job name' }, { status: 400 })
    }

    // Extract video ID from job name
    const jobId = jobName.split('/').pop()
    const videoId = jobId?.split('-')[0]

    if (!videoId) {
      console.warn('Could not extract videoId from job name:', jobName)
      return NextResponse.json({ error: 'Invalid job name' }, { status: 400 })
    }

    console.log('🎬 Processing webhook for video:', videoId, 'state:', state)

    switch (state) {
      case 'SUCCEEDED':
        await handleTranscodeSuccess(videoId, jobId)
        break

      case 'FAILED':
        await handleTranscodeFailed(videoId, payload.error)
        break

      case 'RUNNING':
        await updateVideoStatus(videoId, 'transcoding')
        break

      default:
        console.log('Unhandled transcode state:', state)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful transcoding - copy outputs to delivery bucket
 */
async function handleTranscodeSuccess(videoId: string, jobId: string) {
  try {
    console.log('✅ Transcoding succeeded for video:', videoId)

    // Copy transcoded outputs to delivery bucket
    await publishOutputs(videoId)

    // Update video status
    await updateVideoStatus(videoId, 'ready', {
      processedAt: new Date().toISOString(),
      deliveryUrls: {
        hls: `gs://${DELIVERY_BUCKET}/hls/${videoId}/master.m3u8`,
        mp4: `gs://${DELIVERY_BUCKET}/mp4/${videoId}/video.mp4`,
        thumbnails: `gs://${DELIVERY_BUCKET}/thumbnails/${videoId}/`
      }
    })

    console.log('🚀 Video ready for delivery:', videoId)

  } catch (error) {
    console.error('Failed to handle transcode success:', error)
    await handleTranscodeFailed(videoId, (error as Error).message)
  }
}

/**
 * Handle failed transcoding
 */
async function handleTranscodeFailed(videoId: string, error: string) {
  console.error('❌ Transcoding failed for video:', videoId, error)

  await updateVideoStatus(videoId, 'error', {
    error: error || 'Transcoding failed',
    failedAt: new Date().toISOString()
  })
}

/**
 * Update video status in database
 */
async function updateVideoStatus(videoId: string, status: string, additionalData: any = {}) {
  try {
    await updateDoc(doc(db, 'videos', videoId), {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    })
  } catch (error) {
    console.error('Failed to update video status:', error)
  }
}

/**
 * Copy transcoded outputs from upload bucket to delivery bucket
 */
async function publishOutputs(videoId: string) {
  const srcBucket = storage.bucket(UPLOAD_BUCKET)
  const dstBucket = storage.bucket(DELIVERY_BUCKET)

  const prefix = `transcoder-output/${videoId}/`

  try {
    // Get all transcoded files
    const [files] = await srcBucket.getFiles({ prefix })

    console.log(`📦 Publishing ${files.length} output files for video ${videoId}`)

    // Copy HLS files
    const hlsFiles = files.filter(f => f.name.includes('.m3u8') || f.name.includes('.ts'))
    await Promise.all(hlsFiles.map(async (file) => {
      const relativePath = file.name.replace(prefix, '')
      const dstPath = `hls/${videoId}/${relativePath}`

      try {
        await file.copy(dstBucket.file(dstPath))
        console.log(`📁 Copied HLS file: ${dstPath}`)
      } catch (error) {
        console.error(`Failed to copy ${file.name}:`, error)
      }
    }))

    // Copy MP4 files if any
    const mp4Files = files.filter(f => f.name.includes('.mp4'))
    await Promise.all(mp4Files.map(async (file) => {
      const relativePath = file.name.replace(prefix, '')
      const dstPath = `mp4/${videoId}/${relativePath}`

      try {
        await file.copy(dstBucket.file(dstPath))
        console.log(`📁 Copied MP4 file: ${dstPath}`)
      } catch (error) {
        console.error(`Failed to copy ${file.name}:`, error)
      }
    }))

    // Copy thumbnail files if any
    const thumbFiles = files.filter(f => f.name.includes('.jpg') || f.name.includes('.png'))
    await Promise.all(thumbFiles.map(async (file) => {
      const relativePath = file.name.replace(prefix, '')
      const dstPath = `thumbnails/${videoId}/${relativePath}`

      try {
        await file.copy(dstBucket.file(dstPath))
        console.log(`📁 Copied thumbnail: ${dstPath}`)
      } catch (error) {
        console.error(`Failed to copy ${file.name}:`, error)
      }
    }))

    console.log('✅ All outputs published successfully')

  } catch (error) {
    console.error('❌ Failed to publish outputs:', error)
    throw error
  }
}