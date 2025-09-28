/**
 * Voice Capture Service
 *
 * Processes and integrates detailed coach voice data captured during onboarding
 * to enhance AI coaching responses with authentic coach personality and context.
 */

export interface VoiceCaptureData {
  collegeExperience: {
    university: string
    yearsAttended: string
    major: string
    sportRole: string
    teamAchievements: string[]
    memorableGames: string[]
    coaches: string[]
    teammates: string[]
  }
  careerMilestones: {
    biggestWin: string
    toughestLoss: string
    breakthrough: string
    proudestMoment: string
    definingGame: string
    championships: string[]
    records: string[]
  }
  philosophy: {
    coreBeliefs: string[]
    trainingApproach: string
    motivationStyle: string
    communicationStyle: string
    successDefinition: string
    failureHandling: string
    teamBuilding: string
  }
  voiceCharacteristics: {
    catchphrases: string[]
    encouragementStyle: string
    correctionApproach: string
    celebrationStyle: string
    intensityLevel: string
    humorStyle: string
    professionalTone: string
  }
  technicalExpertise: {
    specialties: string[]
    uniqueDrills: string[]
    innovations: string[]
    strengthAreas: string[]
    developmentFocus: string[]
    mentalGame: string[]
    physicalConditioning: string[]
  }
  storyBank: {
    inspirationalStories: string[]
    teachingMoments: string[]
    realWorldExamples: string[]
    comebackStories: string[]
    disciplineStories: string[]
    growthStories: string[]
    teamworkStories: string[]
  }
  currentContext: {
    currentTeam: string
    currentLocation: string
    recentEvents: string[]
    currentChallenges: string[]
    seasonGoals: string[]
    upcomingEvents: string[]
    localReferences: string[]
  }
}

export interface ProcessedVoiceProfile {
  coachId: string
  personalityProfile: {
    communicationStyle: string
    motivationApproach: string
    intensityLevel: string
    humorUse: string
    professionalTone: string
  }
  contextualKnowledge: {
    biographicalContext: string[]
    experienceBasedInsights: string[]
    localReferences: string[]
    culturalContext: string[]
  }
  responsePatterns: {
    encouragementPatterns: string[]
    correctionPatterns: string[]
    celebrationPatterns: string[]
    storyTriggers: { keyword: string; story: string }[]
  }
  technicalAuthority: {
    specialtyAreas: string[]
    uniqueMethodologies: string[]
    preferredDrills: string[]
    philosophicalFramework: string[]
  }
  completenessScore: number
  lastUpdated: Date
}

/**
 * Process raw voice capture data into structured AI-consumable format
 */
export function processVoiceCaptureData(
  coachId: string,
  rawData: VoiceCaptureData
): ProcessedVoiceProfile {

  // Extract personality patterns
  const personalityProfile = {
    communicationStyle: rawData.voiceCharacteristics?.communicationStyle || 'professional',
    motivationApproach: rawData.philosophy?.motivationStyle || 'supportive',
    intensityLevel: rawData.voiceCharacteristics?.intensityLevel || 'moderate',
    humorUse: rawData.voiceCharacteristics?.humorStyle || 'minimal',
    professionalTone: rawData.voiceCharacteristics?.professionalTone || 'formal'
  }

  // Compile contextual knowledge
  const contextualKnowledge = {
    biographicalContext: [
      ...rawData.collegeExperience?.memorableGames || [],
      ...rawData.careerMilestones?.championships || [],
      rawData.collegeExperience?.university || '',
      rawData.currentContext?.currentTeam || ''
    ].filter(Boolean),
    experienceBasedInsights: [
      rawData.careerMilestones?.biggestWin || '',
      rawData.careerMilestones?.toughestLoss || '',
      rawData.careerMilestones?.breakthrough || ''
    ].filter(Boolean),
    localReferences: rawData.currentContext?.localReferences || [],
    culturalContext: [
      rawData.currentContext?.currentLocation || '',
      rawData.collegeExperience?.university || ''
    ].filter(Boolean)
  }

  // Build response patterns
  const responsePatterns = {
    encouragementPatterns: [
      rawData.voiceCharacteristics?.encouragementStyle || '',
      ...(rawData.voiceCharacteristics?.catchphrases || [])
    ].filter(Boolean),
    correctionPatterns: [
      rawData.voiceCharacteristics?.correctionApproach || ''
    ].filter(Boolean),
    celebrationPatterns: [
      rawData.voiceCharacteristics?.celebrationStyle || ''
    ].filter(Boolean),
    storyTriggers: (rawData.storyBank?.inspirationalStories || []).map((story, index) => ({
      keyword: `inspiration_${index}`,
      story
    }))
  }

  // Technical authority mapping
  const technicalAuthority = {
    specialtyAreas: rawData.technicalExpertise?.specialties || [],
    uniqueMethodologies: rawData.technicalExpertise?.innovations || [],
    preferredDrills: rawData.technicalExpertise?.uniqueDrills || [],
    philosophicalFramework: rawData.philosophy?.coreBeliefs || []
  }

  // Calculate completeness score
  const completenessScore = calculateCompletenessScore(rawData)

  return {
    coachId,
    personalityProfile,
    contextualKnowledge,
    responsePatterns,
    technicalAuthority,
    completenessScore,
    lastUpdated: new Date()
  }
}

/**
 * Calculate how complete the voice capture data is (0-100)
 */
function calculateCompletenessScore(data: VoiceCaptureData): number {
  const sections = [
    data.collegeExperience,
    data.careerMilestones,
    data.philosophy,
    data.voiceCharacteristics,
    data.technicalExpertise,
    data.storyBank,
    data.currentContext
  ]

  let totalFields = 0
  let completedFields = 0

  sections.forEach(section => {
    if (section) {
      Object.entries(section).forEach(([key, value]) => {
        totalFields++
        if (Array.isArray(value)) {
          if (value.length > 0) completedFields++
        } else if (value && value.toString().trim().length > 0) {
          completedFields++
        }
      })
    }
  })

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
}

/**
 * Store processed voice profile in database
 */
export async function storeVoiceProfile(
  coachId: string,
  processedProfile: ProcessedVoiceProfile
): Promise<void> {
  try {
    const { adminDb: db } = await import('@/lib/firebase.admin')
    await db.collection('coach_voice_profiles').doc(coachId).set({
      ...processedProfile,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`🎤 Voice profile stored for coach ${coachId} with ${processedProfile.completenessScore}% completeness`)
  } catch (error) {
    console.error('Failed to store voice profile:', error)
    throw error
  }
}

/**
 * Retrieve voice profile for AI coaching
 */
export async function getVoiceProfile(coachId: string): Promise<ProcessedVoiceProfile | null> {
  try {
    const { adminDb: db } = await import('@/lib/firebase.admin')
    const doc = await db.collection('coach_voice_profiles').doc(coachId).get()
    return doc.exists ? doc.data() as ProcessedVoiceProfile : null
  } catch (error) {
    console.error('Failed to retrieve voice profile:', error)
    return null
  }
}

/**
 * Generate AI coaching context enhanced with voice profile
 */
export function enhanceCoachingContextWithVoice(
  baseContext: any,
  voiceProfile: ProcessedVoiceProfile | null
): any {
  if (!voiceProfile) return baseContext

  return {
    ...baseContext,
    voiceCharacteristics: {
      communicationStyle: voiceProfile.personalityProfile.communicationStyle,
      motivationApproach: voiceProfile.personalityProfile.motivationApproach,
      catchphrases: voiceProfile.responsePatterns.encouragementPatterns,
      professionalTone: voiceProfile.personalityProfile.professionalTone
    },
    personalContext: {
      biographicalReferences: voiceProfile.contextualKnowledge.biographicalContext,
      experienceBasedInsights: voiceProfile.contextualKnowledge.experienceBasedInsights,
      localReferences: voiceProfile.contextualKnowledge.localReferences
    },
    technicalExpertise: {
      specialties: voiceProfile.technicalAuthority.specialtyAreas,
      uniqueMethods: voiceProfile.technicalAuthority.uniqueMethodologies,
      preferredDrills: voiceProfile.technicalAuthority.preferredDrills,
      philosophy: voiceProfile.technicalAuthority.philosophicalFramework
    },
    storyBank: voiceProfile.responsePatterns.storyTriggers,
    completenessScore: voiceProfile.completenessScore
  }
}

/**
 * Update AI service to integrate voice profiles
 */
export async function integrateVoiceProfileIntoAI(
  coachId: string,
  rawVoiceData: VoiceCaptureData
): Promise<{ success: boolean; completenessScore: number }> {
  try {
    // Process the raw data
    const processedProfile = processVoiceCaptureData(coachId, rawVoiceData)

    // Store in database
    await storeVoiceProfile(coachId, processedProfile)

    console.log(`🤖 Voice profile integrated for coach ${coachId}`)
    console.log(`📊 Completeness: ${processedProfile.completenessScore}%`)

    if (processedProfile.completenessScore >= 70) {
      console.log('✅ High-quality voice capture achieved - AI responses will be highly personalized')
    } else if (processedProfile.completenessScore >= 40) {
      console.log('⚠️  Moderate voice capture - Consider encouraging coach to complete more sections')
    } else {
      console.log('❌ Low voice capture - AI responses will be generic until more data is provided')
    }

    return { success: true, completenessScore: processedProfile.completenessScore }
  } catch (error) {
    console.error('Failed to integrate voice profile:', error)
    return { success: false, completenessScore: 0 }
  }
}