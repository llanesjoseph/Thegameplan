/**
 * Complete GCS upload and start transcoding
 * Verifies upload completion and submits Transcoder job
 */

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { TranscoderServiceClient } from '@google-cloud/video-transcoder'
import { db } from '@/lib/firebase.client'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const storage = new Storage({
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID
})

const transcoder = new TranscoderServiceClient()

const UPLOAD_BUCKET = process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET || 'gameplan-uploads'
const PROJECT_ID = process.env.NEXT_PUBLIC_GCP_PROJECT_ID || 'gameplan-787a2'
const LOCATION = process.env.NEXT_PUBLIC_GCS_REGION || 'us-central1'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
    }

    console.log('🏁 Completing upload and starting transcode:', videoId)

    // Get video metadata
    const videoDoc = await getDoc(doc(db, 'videos', videoId))
    if (!videoDoc.exists()) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const videoData = videoDoc.data()
    const inputPath = videoData.uploadPath

    // Verify file exists in GCS
    const inputFile = storage.bucket(UPLOAD_BUCKET).file(inputPath)
    const [exists] = await inputFile.exists()

    if (!exists) {
      return NextResponse.json({ error: 'Upload file not found' }, { status: 404 })
    }

    // Get file metadata
    const [metadata] = await inputFile.getMetadata()
    console.log('📹 Input file verified:', {
      size: `${(parseInt(String(metadata.size || '0')) / (1024 * 1024)).toFixed(1)} MB`,
      contentType: metadata.contentType
    })

    // Create transcoder job
    const transcodeJobId = `${videoId}-${Date.now()}`
    const outputPrefix = `transcoder-output/${videoId}`

    const job = {
      inputUri: `gs://${UPLOAD_BUCKET}/${inputPath}`,
      outputUri: `gs://${UPLOAD_BUCKET}/${outputPrefix}/`,
      config: {
        elementaryStreams: [
          // Video streams for different qualities
          {
            key: 'video-1080p',
            videoStream: {
              h264: {
                bitrateBps: 5000000, // 5 Mbps
                frameRate: 30,
                heightPixels: 1080,
                widthPixels: 1920
              }
            }
          },
          {
            key: 'video-720p',
            videoStream: {
              h264: {
                bitrateBps: 3000000, // 3 Mbps
                frameRate: 30,
                heightPixels: 720,
                widthPixels: 1280
              }
            }
          },
          {
            key: 'video-480p',
            videoStream: {
              h264: {
                bitrateBps: 1500000, // 1.5 Mbps
                frameRate: 30,
                heightPixels: 480,
                widthPixels: 854
              }
            }
          },
          // Audio stream
          {
            key: 'audio-aac',
            audioStream: {
              codec: 'aac',
              bitrateBps: 128000 // 128 kbps
            }
          }
        ],
        muxStreams: [
          // HLS renditions
          {
            key: 'hls-1080p',
            container: 'ts',
            elementaryStreams: ['video-1080p', 'audio-aac']
          },
          {
            key: 'hls-720p',
            container: 'ts',
            elementaryStreams: ['video-720p', 'audio-aac']
          },
          {
            key: 'hls-480p',
            container: 'ts',
            elementaryStreams: ['video-480p', 'audio-aac']
          }
        ],
        manifests: [
          // Master HLS playlist
          {
            fileName: 'master.m3u8',
            type: 'HLS' as any,
            muxStreams: ['hls-1080p', 'hls-720p', 'hls-480p']
          }
        ],
        output: {
          uri: `gs://${UPLOAD_BUCKET}/${outputPrefix}/`
        }
      }
    }

    const operation = await transcoder.createJob({
      parent: transcoder.locationPath(PROJECT_ID, LOCATION),
      job
    })

    console.log('🎬 Transcoder job created:', {
      jobId: transcodeJobId,
      operation: operation?.[0]?.name || 'unknown'
    })

    // Update video document
    await updateDoc(doc(db, 'videos', videoId), {
      status: 'transcoding',
      transcodeJobId,
      inputSize: parseInt(String(metadata.size || '0')),
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      videoId,
      transcodeJobId,
      status: 'transcoding',
      inputSize: parseInt(String(metadata.size || '0'))
    })

  } catch (error) {
    console.error('❌ Failed to complete upload:', error)

    // Update video status to error
    try {
      const { videoId } = await request.json()
      await updateDoc(doc(db, 'videos', videoId), {
        status: 'error',
        error: (error as Error).message,
        updatedAt: new Date().toISOString()
      })
    } catch (updateError) {
      console.error('Failed to update error status:', updateError)
    }

    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}