/**
 * Generate signed URLs for video playback
 * Creates secure, time-limited URLs for HLS and MP4 delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

const storage = new Storage({
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID
})

const DELIVERY_BUCKET = process.env.NEXT_PUBLIC_GCS_DELIVERY_BUCKET || 'gameplan-delivery'
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const format = searchParams.get('format') || 'hls' // hls, mp4, thumbnail

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
    }

    console.log('🎥 Generating playback URL:', { videoId, format })

    // Verify video exists and is ready
    const videoDoc = await getDoc(doc(db, 'videos', videoId))
    if (!videoDoc.exists()) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const videoData = videoDoc.data()
    if (videoData.status !== 'ready') {
      return NextResponse.json(
        { error: 'Video not ready', status: videoData.status },
        { status: 400 }
      )
    }

    // Generate signed URLs based on format
    let urls: any = {}

    switch (format) {
      case 'hls':
        urls = await generateHlsUrls(videoId)
        break

      case 'mp4':
        urls = await generateMp4Urls(videoId)
        break

      case 'thumbnail':
        urls = await generateThumbnailUrls(videoId)
        break

      case 'all':
        urls = {
          hls: await generateHlsUrls(videoId),
          mp4: await generateMp4Urls(videoId),
          thumbnails: await generateThumbnailUrls(videoId)
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Add CDN URLs if CDN domain is configured
    if (CDN_DOMAIN) {
      urls = addCdnUrls(urls, CDN_DOMAIN)
    }

    return NextResponse.json({
      videoId,
      format,
      urls,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      cdnEnabled: !!CDN_DOMAIN
    })

  } catch (error) {
    console.error('❌ Failed to generate playback URLs:', error)
    return NextResponse.json(
      { error: 'Failed to generate playback URLs' },
      { status: 500 }
    )
  }
}

/**
 * Generate signed URLs for HLS playback
 */
async function generateHlsUrls(videoId: string) {
  const bucket = storage.bucket(DELIVERY_BUCKET)
  const expires = Date.now() + 15 * 60 * 1000 // 15 minutes

  try {
    // Master playlist
    const masterFile = bucket.file(`hls/${videoId}/master.m3u8`)
    const [masterUrl] = await masterFile.getSignedUrl({
      action: 'read',
      expires
    })

    // List all HLS files for this video
    const [files] = await bucket.getFiles({
      prefix: `hls/${videoId}/`
    })

    // Generate signed URLs for all segments
    const segmentUrls: { [key: string]: string } = {}
    await Promise.all(files.map(async (file) => {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires
      })
      const fileName = file.name.split('/').pop() || ''
      segmentUrls[fileName] = url
    }))

    return {
      master: masterUrl,
      segments: segmentUrls
    }

  } catch (error) {
    console.error('Failed to generate HLS URLs:', error)
    throw error
  }
}

/**
 * Generate signed URLs for MP4 playback
 */
async function generateMp4Urls(videoId: string) {
  const bucket = storage.bucket(DELIVERY_BUCKET)
  const expires = Date.now() + 15 * 60 * 1000 // 15 minutes

  try {
    const [files] = await bucket.getFiles({
      prefix: `mp4/${videoId}/`
    })

    const mp4Urls: { [key: string]: string } = {}
    await Promise.all(files.map(async (file) => {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires
      })
      const fileName = file.name.split('/').pop() || ''
      const quality = fileName.includes('1080p') ? '1080p' :
                    fileName.includes('720p') ? '720p' :
                    fileName.includes('480p') ? '480p' : 'default'
      mp4Urls[quality] = url
    }))

    return mp4Urls

  } catch (error) {
    console.error('Failed to generate MP4 URLs:', error)
    throw error
  }
}

/**
 * Generate signed URLs for thumbnails
 */
async function generateThumbnailUrls(videoId: string) {
  const bucket = storage.bucket(DELIVERY_BUCKET)
  const expires = Date.now() + 15 * 60 * 1000 // 15 minutes

  try {
    const [files] = await bucket.getFiles({
      prefix: `thumbnails/${videoId}/`
    })

    const thumbnailUrls: string[] = []
    await Promise.all(files.map(async (file) => {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires
      })
      thumbnailUrls.push(url)
    }))

    return thumbnailUrls

  } catch (error) {
    console.error('Failed to generate thumbnail URLs:', error)
    return []
  }
}

/**
 * Add CDN URLs alongside direct GCS URLs
 */
function addCdnUrls(urls: any, cdnDomain: string) {
  // Transform GCS URLs to CDN URLs
  // This would depend on your CDN configuration
  // For now, we'll just add the CDN domain info
  return {
    ...urls,
    cdn: {
      domain: cdnDomain,
      note: 'CDN URLs would be generated based on your CDN configuration'
    }
  }
}