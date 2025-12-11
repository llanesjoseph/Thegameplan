import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'

/**
 * Update Voice Traits for Coach
 * Processes voice capture data and saves to users collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voiceCaptureData, userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!voiceCaptureData) {
      return NextResponse.json(
        { success: false, error: 'Voice capture data is required' },
        { status: 400 }
      )
    }

    console.log('🎤 Processing voice capture update for user:', userId)

    // Process voice capture data into voice traits for AI
    const voiceTraits: string[] = []

    // 1. Communication style
    if (voiceCaptureData.communicationStyle) {
      voiceTraits.push(voiceCaptureData.communicationStyle)
    }

    // 2. Coaching philosophy
    if (voiceCaptureData.coachingPhilosophy) {
      voiceTraits.push(`Coaching philosophy: ${voiceCaptureData.coachingPhilosophy}`)
    }

    // 3. Motivation approach
    if (voiceCaptureData.motivationApproach) {
      voiceTraits.push(voiceCaptureData.motivationApproach)
    }

    // 4. Catchphrases
    if (voiceCaptureData.catchphrases && Array.isArray(voiceCaptureData.catchphrases)) {
      voiceCaptureData.catchphrases.forEach((phrase: string) => {
        if (phrase.trim()) {
          voiceTraits.push(`Catchphrase: "${phrase}"`)
        }
      })
    }

    // 5. Key stories
    if (voiceCaptureData.keyStories && Array.isArray(voiceCaptureData.keyStories)) {
      voiceCaptureData.keyStories.forEach((story: string) => {
        if (story.trim()) {
          voiceTraits.push(`Story: ${story}`)
        }
      })
    }

    // 6. Current context
    if (voiceCaptureData.currentContext) {
      voiceTraits.push(`Current context: ${voiceCaptureData.currentContext}`)
    }

    // 7. Technical focus
    if (voiceCaptureData.technicalFocus) {
      voiceTraits.push(`Technical focus: ${voiceCaptureData.technicalFocus}`)
    }

    // 8. Personality traits
    if (voiceCaptureData.personalityTraits && Array.isArray(voiceCaptureData.personalityTraits)) {
      voiceTraits.push(...voiceCaptureData.personalityTraits)
    }

    // 9. Career highlights (if detailed mode)
    if (voiceCaptureData.careerHighlights) {
      voiceTraits.push(`Career highlights: ${voiceCaptureData.careerHighlights}`)
    }

    // 10. Specific examples (if detailed mode)
    if (voiceCaptureData.specificExamples && Array.isArray(voiceCaptureData.specificExamples)) {
      voiceCaptureData.specificExamples.forEach((example: string) => {
        if (example.trim()) {
          voiceTraits.push(`Example: ${example}`)
        }
      })
    }

    console.log(`✅ Processed ${voiceTraits.length} voice traits`)

    // Update user document with new voice traits
    await adminDb.collection('users').doc(userId).update({
      voiceTraits,
      voiceCaptureData, // Also save raw data for reference
      voiceLastUpdated: new Date().toISOString()
    })

    console.log('✅ Voice traits updated successfully in Firestore')

    return NextResponse.json({
      success: true,
      voiceTraits,
      message: `Successfully updated ${voiceTraits.length} voice traits`
    })

  } catch (error) {
    console.error('❌ Error updating voice traits:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update voice traits',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
