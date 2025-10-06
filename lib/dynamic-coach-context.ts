/**
 * Dynamic Coach Context System
 *
 * Automatically generates coaching contexts from Firestore coach profiles
 * No hardcoding required - fully scalable and adaptive
 */

import { adminDb } from './firebase.admin'
import { CoachingContext } from './ai-service'
import { getVoiceProfile, enhanceCoachingContextWithVoice } from './voice-capture-service'

// In-memory cache for coach contexts (TTL: 1 hour)
const contextCache = new Map<string, { context: CoachingContext; expiresAt: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Build a dynamic coaching context from a coach's Firestore profile
 */
export async function buildDynamicCoachingContext(
  coachId: string,
  coachData: any
): Promise<CoachingContext> {
  console.log(`🔨 Building dynamic context for coach: ${coachData.displayName || 'Unknown'}`)

  // Extract coach information
  const displayName = coachData.displayName || coachData.name || 'Coach'
  const sport = coachData.sport || 'General Coaching'
  const bio = coachData.bio || coachData.tagline || ''
  const credentials = coachData.certifications || coachData.credentials || []
  const specialties = coachData.specialties || []
  const experience = coachData.experience || ''

  // Build dynamic credentials array
  const dynamicCredentials = [
    ...credentials,
    experience ? `${experience} Experience` : null,
    coachData.verified ? 'Verified Coach' : null
  ].filter(Boolean) as string[]

  // Build dynamic expertise from bio and specialties
  const dynamicExpertise = [
    ...specialties,
    // Extract expertise keywords from bio
    ...extractExpertiseFromBio(bio)
  ]

  // Build dynamic personality traits from bio and sport
  const personalityTraits = buildPersonalityTraits(sport, bio)

  // Build sport-specific voice characteristics
  const voiceCharacteristics = buildVoiceCharacteristics(sport, displayName)

  // Build response style
  const responseStyle = buildResponseStyle(sport, displayName)

  const baseContext: CoachingContext = {
    sport: sport,
    coachName: displayName,
    coachCredentials: dynamicCredentials.length > 0 ? dynamicCredentials : ['Professional Coach'],
    expertise: dynamicExpertise.length > 0 ? dynamicExpertise : ['Fundamentals', 'Technique', 'Mental Training'],
    personalityTraits: personalityTraits,
    voiceCharacteristics: voiceCharacteristics,
    responseStyle: responseStyle
  }

  // Try to enhance with voice profile
  try {
    const voiceProfile = await getVoiceProfile(coachId)
    if (voiceProfile && voiceProfile.completenessScore > 30) {
      console.log(`🎤 Enhancing with voice profile (${voiceProfile.completenessScore}% complete)`)
      return enhanceCoachingContextWithVoice(baseContext, voiceProfile)
    }
  } catch (error) {
    console.warn('Could not load voice profile, using base context:', error)
  }

  return baseContext
}

/**
 * Get coaching context for a coach (with caching)
 */
export async function getDynamicCoachingContext(coachId: string): Promise<CoachingContext | null> {
  // Check cache first
  const cached = contextCache.get(coachId)
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`📦 Using cached context for coach: ${coachId}`)
    return cached.context
  }

  try {
    // Try coach_profiles first
    let coachDoc = await adminDb.collection('coach_profiles').doc(coachId).get()

    // Fall back to creator_profiles
    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('creator_profiles').doc(coachId).get()
    }

    // Fall back to creatorPublic
    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('creatorPublic').doc(coachId).get()
    }

    if (!coachDoc.exists) {
      console.warn(`⚠️ Coach profile not found: ${coachId}`)
      return null
    }

    const coachData = coachDoc.data()
    const context = await buildDynamicCoachingContext(coachId, coachData)

    // Cache it
    contextCache.set(coachId, {
      context,
      expiresAt: Date.now() + CACHE_TTL
    })

    return context

  } catch (error) {
    console.error('Error loading dynamic coach context:', error)
    return null
  }
}

/**
 * Extract expertise keywords from bio text
 */
function extractExpertiseFromBio(bio: string): string[] {
  if (!bio) return []

  const keywords = [
    'technique', 'tactics', 'strategy', 'conditioning', 'mental',
    'fundamentals', 'advanced', 'beginner', 'elite', 'championship',
    'defense', 'offense', 'training', 'coaching', 'development',
    'performance', 'analysis', 'skill', 'movement', 'positioning'
  ]

  const expertise: string[] = []
  const bioLower = bio.toLowerCase()

  keywords.forEach(keyword => {
    if (bioLower.includes(keyword)) {
      expertise.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  })

  return expertise.slice(0, 5) // Limit to top 5
}

/**
 * Build personality traits based on sport and bio
 */
function buildPersonalityTraits(sport: string, bio: string): string[] {
  const sportLower = sport.toLowerCase()
  const bioLower = bio.toLowerCase()

  // Sport-specific traits
  const sportTraits: Record<string, string[]> = {
    'soccer': ['strategic', 'passionate', 'team-focused'],
    'basketball': ['energetic', 'motivational', 'competitive'],
    'football': ['intense', 'tactical', 'disciplined'],
    'baseball': ['patient', 'analytical', 'detail-oriented'],
    'mma': ['disciplined', 'focused', 'resilient'],
    'bjj': ['technical', 'patient', 'philosophical'],
    'brazilian jiu-jitsu': ['technical', 'patient', 'philosophical'],
    'tennis': ['precise', 'mental-focused', 'strategic'],
    'hockey': ['intense', 'fast-paced', 'competitive']
  }

  let traits = sportTraits[sportLower] || ['motivational', 'encouraging', 'experienced']

  // Add traits from bio keywords
  if (bioLower.includes('elite') || bioLower.includes('championship')) {
    traits.push('championship-minded')
  }
  if (bioLower.includes('mental') || bioLower.includes('mindset')) {
    traits.push('mentally-focused')
  }
  if (bioLower.includes('technical') || bioLower.includes('fundamentals')) {
    traits.push('technically-precise')
  }

  return [...new Set(traits)].slice(0, 5)
}

/**
 * Build voice characteristics for a sport
 */
function buildVoiceCharacteristics(sport: string, coachName: string) {
  const sportLower = sport.toLowerCase()

  const sportVoice: Record<string, any> = {
    'soccer': {
      tone: 'Passionate and strategic',
      pace: 'Energetic with tactical emphasis',
      emphasis: ['technique', 'positioning', 'game intelligence'],
      catchphrases: ['Trust your training', 'Play smart'],
      speakingStyle: 'Passionate with tactical insights'
    },
    'mma': {
      tone: 'Calm and focused',
      pace: 'Measured with intentional emphasis',
      emphasis: ['discipline', 'technique', 'mental fortitude'],
      catchphrases: ['Stay disciplined', 'Control what you can control'],
      speakingStyle: 'Calm and philosophical with technical precision'
    },
    'bjj': {
      tone: 'Calm and philosophical',
      pace: 'Patient with technical emphasis',
      emphasis: ['technique', 'leverage', 'patience'],
      catchphrases: ['Technique over strength', 'Position before submission'],
      speakingStyle: 'Patient and technical, emphasizes philosophy of jiu-jitsu'
    },
    'brazilian jiu-jitsu': {
      tone: 'Calm and philosophical',
      pace: 'Patient with technical emphasis',
      emphasis: ['technique', 'leverage', 'patience'],
      catchphrases: ['Technique over strength', 'Position before submission'],
      speakingStyle: 'Patient and technical, emphasizes philosophy of jiu-jitsu'
    }
  }

  return sportVoice[sportLower] || {
    tone: 'Encouraging and professional',
    pace: 'Clear and measured',
    emphasis: ['fundamentals', 'progress', 'consistency'],
    catchphrases: ['Trust the process', 'Keep working'],
    speakingStyle: 'Supportive and clear, focuses on fundamentals'
  }
}

/**
 * Build response style for a sport
 */
function buildResponseStyle(sport: string, coachName: string) {
  const sportLower = sport.toLowerCase()

  const sportStyle: Record<string, any> = {
    'soccer': {
      greeting: coachName + ' here - let\'s talk soccer!',
      encouragement: ['Great question!', 'You\'re thinking like a pro!'],
      signatureClosing: 'Keep training smart!',
      personalStoryIntros: ['In my experience...', 'I\'ve seen this work...']
    },
    'mma': {
      greeting: coachName + ' here - ready to train?',
      encouragement: ['Stay disciplined', 'That\'s the right mindset'],
      signatureClosing: 'Train hard, fight smart',
      personalStoryIntros: ['From my training...', 'What I\'ve learned...']
    },
    'bjj': {
      greeting: coachName + ' here - let\'s train!',
      encouragement: ['Excellent question', 'You\'re on the right path'],
      signatureClosing: 'Oss! Keep training',
      personalStoryIntros: ['On the mats, I\'ve learned...', 'In jiu-jitsu...']
    },
    'brazilian jiu-jitsu': {
      greeting: coachName + ' here - let\'s train!',
      encouragement: ['Excellent question', 'You\'re on the right path'],
      signatureClosing: 'Oss! Keep training',
      personalStoryIntros: ['On the mats, I\'ve learned...', 'In jiu-jitsu...']
    }
  }

  return sportStyle[sportLower] || {
    greeting: coachName + ' here - happy to help!',
    encouragement: ['Great question!', 'You\'re on the right track!'],
    signatureClosing: 'Keep up the great work!',
    personalStoryIntros: ['In my coaching experience...', 'What I\'ve found...']
  }
}

/**
 * Clear the cache (useful for testing or when coach profiles update)
 */
export function clearCoachContextCache(coachId?: string) {
  if (coachId) {
    contextCache.delete(coachId)
    console.log(`🗑️ Cleared cache for coach: ${coachId}`)
  } else {
    contextCache.clear()
    console.log(`🗑️ Cleared all coach context cache`)
  }
}
