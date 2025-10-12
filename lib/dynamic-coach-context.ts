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
 * Fetch coach's actual lesson content for AI context
 * ⚡ ENHANCED: Supports BOTH text and video lessons
 */
async function fetchCoachLessonContent(coachId: string): Promise<{
  techniques: string[]
  lessonTitles: string[]
  fullContent: string[]
  videoLessons: number
  textLessons: number
  hasContent: boolean
}> {
  try {
    console.log(`📚 Fetching ALL lesson content (text + video) for coach: ${coachId}`)

    const lessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .limit(15) // Increased to capture more lessons
      .get()

    const techniques: string[] = []
    const lessonTitles: string[] = []
    const fullContent: string[] = []
    let videoLessons = 0
    let textLessons = 0

    lessonsSnapshot.forEach(doc => {
      const data = doc.data()
      const hasVideo = !!(data.videoUrl || data.videoId)
      const hasText = !!(data.content || data.longDescription || (data.sections && data.sections.length > 0))

      // Count lesson types
      if (hasVideo) videoLessons++
      if (hasText) textLessons++

      // Add lesson title with type indicator
      if (data.title) {
        const typeIndicator = hasVideo && hasText ? '[Video + Text]' : hasVideo ? '[Video]' : '[Text]'
        lessonTitles.push(`${data.title} ${typeIndicator}`)
      }

      // Extract content from text-based fields
      if (data.content) {
        fullContent.push(data.content)
      }

      if (data.longDescription) {
        fullContent.push(data.longDescription)
      }

      // ⚡ VIDEO LESSON SUPPORT: Extract metadata from video lessons
      if (hasVideo && data.description) {
        // Video lessons often have rich descriptions - use them!
        fullContent.push(`[From Video Lesson: ${data.title}] ${data.description}`)
      }

      // Extract from sections array (works for both text and video lessons)
      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((section: any) => {
          if (section.title) {
            techniques.push(section.title)
          }
          if (section.content) {
            fullContent.push(section.content)
          }
          // Video sections may have descriptions
          if (section.videoUrl && section.title) {
            fullContent.push(`[Video Section: ${section.title}]`)
          }
        })
      }

      // Extract techniques from description (fallback)
      if (data.description && !hasVideo) {
        fullContent.push(data.description)
      }

      // Extract from tags (often contain technique names)
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          if (tag && tag.length > 3) { // Filter out short tags
            techniques.push(tag)
          }
        })
      }
    })

    const hasContent = lessonTitles.length > 0 || fullContent.length > 0 || techniques.length > 0

    console.log(`✅ Found ${lessonTitles.length} lessons (${videoLessons} video, ${textLessons} text) with ${fullContent.length} content sections and ${techniques.length} techniques`)

    return {
      techniques: [...new Set(techniques)], // Remove duplicates
      lessonTitles: lessonTitles,
      fullContent: fullContent,
      videoLessons,
      textLessons,
      hasContent
    }
  } catch (error) {
    console.error('Error fetching lesson content:', error)
    return {
      techniques: [],
      lessonTitles: [],
      fullContent: [],
      videoLessons: 0,
      textLessons: 0,
      hasContent: false
    }
  }
}

/**
 * ⚡ FALLBACK SYSTEM: Sport-specific fundamentals for coaches without lessons
 * Provides solid coaching advice based on sport expertise
 */
function getSportSpecificFallbackContent(sport: string): {
  techniques: string[]
  fundamentals: string[]
  commonTopics: string[]
} {
  const sportLower = sport.toLowerCase()

  const sportContent: Record<string, any> = {
    'bjj': {
      techniques: [
        'Guard Passing Fundamentals', 'Escapes from Side Control', 'Submission Defense',
        'Positional Control', 'Grip Fighting', 'Sweeps from Closed Guard',
        'Mount Attacks', 'Back Control Maintenance', 'Triangle Choke Setup',
        'Armbar Mechanics', 'Kimura from Guard', 'Rear Naked Choke Details'
      ],
      fundamentals: [
        'Position before submission', 'Base and posture management',
        'Breathing and energy conservation', 'Hip movement and mobility',
        'Frame creation and maintenance', 'Weight distribution principles'
      ],
      commonTopics: [
        'How to improve guard retention', 'Dealing with bigger opponents',
        'Developing a systematic game plan', 'Competition preparation',
        'Training consistently without injury', 'Conceptual understanding of positions'
      ]
    },
    'brazilian jiu-jitsu': {
      techniques: [
        'Guard Passing Fundamentals', 'Escapes from Side Control', 'Submission Defense',
        'Positional Control', 'Grip Fighting', 'Sweeps from Closed Guard',
        'Mount Attacks', 'Back Control Maintenance', 'Triangle Choke Setup',
        'Armbar Mechanics', 'Kimura from Guard', 'Rear Naked Choke Details'
      ],
      fundamentals: [
        'Position before submission', 'Base and posture management',
        'Breathing and energy conservation', 'Hip movement and mobility',
        'Frame creation and maintenance', 'Weight distribution principles'
      ],
      commonTopics: [
        'How to improve guard retention', 'Dealing with bigger opponents',
        'Developing a systematic game plan', 'Competition preparation',
        'Training consistently without injury', 'Conceptual understanding of positions'
      ]
    },
    'mma': {
      techniques: [
        'Striking Fundamentals', 'Takedown Defense', 'Ground and Pound',
        'Cage Cutting', 'Clinch Work', 'Submission Defense from MMA positions',
        'Striking from Guard', 'Stand-up Transitions', 'Fight IQ Development'
      ],
      fundamentals: [
        'Cardio and conditioning', 'Weight cutting strategies',
        'Camp structure and periodization', 'Mental preparation',
        'Recovery and injury prevention', 'Fight analysis and game planning'
      ],
      commonTopics: [
        'Balancing striking and grappling', 'Managing fight nerves',
        'Building fight endurance', 'Developing finishing instincts',
        'Cage awareness and positioning', 'Transitioning between ranges'
      ]
    },
    'soccer': {
      techniques: [
        'Ball Control Fundamentals', 'Passing Accuracy', 'Shooting Technique',
        'Defensive Positioning', 'Off-the-ball Movement', 'First Touch Development',
        'Tactical Awareness', '1v1 Attacking', '1v1 Defending', 'Set Piece Execution'
      ],
      fundamentals: [
        'Field vision and awareness', 'Communication on the pitch',
        'Fitness and conditioning', 'Tactical discipline',
        'Decision making under pressure', 'Team chemistry'
      ],
      commonTopics: [
        'Improving technical skills', 'Tactical positioning',
        'Reading the game', 'Building confidence',
        'Playing under pressure', 'Team coordination'
      ]
    },
    'basketball': {
      techniques: [
        'Shooting Form and Mechanics', 'Ball Handling Drills', 'Defensive Footwork',
        'Pick and Roll Execution', 'Post Moves', 'Transition Offense',
        'Help Defense Principles', 'Rebounding Positioning', 'Free Throw Routine'
      ],
      fundamentals: [
        'Court awareness and vision', 'Communication on defense',
        'Conditioning and stamina', 'Mental toughness',
        'Team concepts and spacing', 'Shot selection'
      ],
      commonTopics: [
        'Improving shooting consistency', 'Developing court vision',
        'Playing better defense', 'Leadership on court',
        'Handling pressure situations', 'Building basketball IQ'
      ]
    }
  }

  const defaultContent = {
    techniques: [
      'Fundamental Skills Development', 'Proper Technique Training',
      'Mental Game Improvement', 'Physical Conditioning',
      'Strategic Thinking', 'Competition Preparation'
    ],
    fundamentals: [
      'Building strong foundations', 'Consistent practice habits',
      'Mental toughness development', 'Injury prevention',
      'Recovery and rest strategies', 'Goal setting and tracking'
    ],
    commonTopics: [
      'Improving fundamental skills', 'Building confidence',
      'Overcoming mental blocks', 'Training effectively',
      'Competition preparation', 'Long-term development'
    ]
  }

  return sportContent[sportLower] || defaultContent
}

/**
 * Build a dynamic coaching context from a coach's Firestore profile
 * ENHANCED with actual lesson content for specific, non-generic responses
 */
export async function buildDynamicCoachingContext(
  coachId: string,
  coachData: any
): Promise<CoachingContext> {
  console.log(`🔨 Building ENHANCED dynamic context for coach: ${coachData.displayName || 'Unknown'}`)

  // Extract coach information
  const displayName = coachData.displayName || coachData.name || 'Coach'
  const sport = coachData.sport || 'General Coaching'
  const bio = coachData.bio || coachData.tagline || ''
  const credentials = coachData.certifications || coachData.credentials || []
  const specialties = coachData.specialties || []
  const experience = coachData.experience || ''

  // ⚡ AGGRESSIVE ENHANCEMENT: Fetch actual lesson content (text + video)
  const lessonContent = await fetchCoachLessonContent(coachId)

  // ⚡ FALLBACK SYSTEM: Use sport-specific fundamentals if no lessons exist
  let effectiveTechniques = lessonContent.techniques
  let effectiveLessonTitles = lessonContent.lessonTitles
  let effectiveContent = lessonContent.fullContent
  let usingFallback = false

  if (!lessonContent.hasContent) {
    console.log(`⚠️  No lessons found for coach ${coachId}, using sport-specific fallback content`)
    const fallbackContent = getSportSpecificFallbackContent(sport)
    effectiveTechniques = fallbackContent.techniques
    effectiveLessonTitles = [...fallbackContent.commonTopics, ...fallbackContent.fundamentals]
    effectiveContent = [
      `As an expert ${sport} coach, I specialize in: ${fallbackContent.techniques.join(', ')}`,
      `Core fundamentals I teach: ${fallbackContent.fundamentals.join(', ')}`,
      `Common topics I address: ${fallbackContent.commonTopics.join(', ')}`
    ]
    usingFallback = true
  }

  // Build dynamic credentials array
  const dynamicCredentials = [
    ...credentials,
    experience ? `${experience} Experience` : null,
    coachData.verified ? 'Verified Coach' : null,
    lessonContent.videoLessons > 0 ? `${lessonContent.videoLessons} Video Lessons` : null,
    lessonContent.textLessons > 0 ? `${lessonContent.textLessons} Text Lessons` : null
  ].filter(Boolean) as string[]

  // Build dynamic expertise from bio, specialties AND actual lesson content (or fallback)
  const dynamicExpertise = [
    ...specialties,
    ...extractExpertiseFromBio(bio),
    ...effectiveTechniques.slice(0, 12) // Add actual techniques from lessons or fallback
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
    responseStyle: responseStyle,
    // ⚡ CRITICAL: Add actual lesson content OR sport-specific fallback
    lessonContent: {
      availableLessons: effectiveLessonTitles,
      techniques: effectiveTechniques,
      contentSamples: effectiveContent.slice(0, 5).map(content =>
        content.substring(0, 500) // First 500 chars of each content piece
      )
    }
  }

  // ⚡ AGGRESSIVE: Always try to enhance with voice profile (lowered threshold)
  try {
    const voiceProfile = await getVoiceProfile(coachId)
    if (voiceProfile && voiceProfile.completenessScore > 10) { // Lowered from 30% to 10%
      console.log(`🎤 Enhancing with voice profile (${voiceProfile.completenessScore}% complete)`)
      return enhanceCoachingContextWithVoice(baseContext, voiceProfile)
    } else if (voiceProfile) {
      console.log(`📊 Voice profile exists but low completeness (${voiceProfile.completenessScore}%), using base context`)
    }
  } catch (error) {
    console.warn('Could not load voice profile, using base context:', error)
  }

  const contentSource = usingFallback ? 'sport-specific fallback' : `${lessonContent.videoLessons} video + ${lessonContent.textLessons} text lessons`
  console.log(`🎯 Context built with ${contentSource}, ${effectiveTechniques.length} techniques, ${effectiveContent.length} content pieces`)
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
    // Try coaches collection first (new data model)
    let coachDoc = await adminDb.collection('coaches').doc(coachId).get()

    // Fall back to legacy collections
    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('coach_profiles').doc(coachId).get()
    }

    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('creator_profiles').doc(coachId).get()
    }

    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('creatorPublic').doc(coachId).get()
    }

    // ⚡ CRITICAL FIX: Also check users collection
    if (!coachDoc.exists) {
      coachDoc = await adminDb.collection('users').doc(coachId).get()
      if (coachDoc.exists) {
        console.log(`✅ Found coach profile in users collection: ${coachId}`)
      }
    }

    if (!coachDoc.exists) {
      console.warn(`⚠️ Coach profile not found in any collection: ${coachId}`)
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
