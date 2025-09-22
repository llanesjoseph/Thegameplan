/**
 * Enhanced Content Generation Service
 * Leverages comprehensive sports knowledge base for detailed, expert-level content creation
 */

import { getSportContext, SportContext } from './sports-knowledge-base'
import { getCoachingContext, CoachingContext } from './ai-service'
import { generateWithRedundancy } from './llm-service'

export interface ContentGenerationRequest {
  title: string
  sport: string
  creatorId?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  focus?: 'technical' | 'tactical' | 'physical' | 'mental' | 'comprehensive'
  duration?: number // in minutes
  safetyLevel?: 'high' | 'medium' | 'low'
}

export interface GeneratedContent {
  detailedWriteup: string
  keyTechniques: string[]
  safetyNotes: string[]
  progressionTips: string[]
  commonMistakes: string[]
  expertInsights: string[]
  practicedrills: string[]
  estimatedDuration: number
}

/**
 * Generate comprehensive lesson content using AI with sports-specific knowledge
 */
export async function generateLessonContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const sportContext = getSportContext(request.sport)
  const coachingContext = getCoachingContext(request.creatorId, request.sport)

  // Build comprehensive prompt with sports knowledge
  const prompt = buildEnhancedPrompt(request, sportContext, coachingContext)

  try {
    // Use the robust AI service
    const result = await generateWithRedundancy(prompt, coachingContext)

    // Parse and structure the AI response
    const structuredContent = parseAIResponse(result.text, request, sportContext)

    return structuredContent
  } catch (error) {
    console.error('Content generation failed:', error)
    // Fallback to structured template
    return generateFallbackContent(request, sportContext, coachingContext)
  }
}

/**
 * Analyze lesson title to extract key concepts and focus areas
 */
function analyzeLessonTitle(title: string, sport: string): {
  primaryFocus: string
  keySkills: string[]
  trainingType: string
  techniques: string[]
} {
  const lowerTitle = title.toLowerCase()

  // Determine primary focus based on keywords
  let primaryFocus = 'General Skill Development'
  if (lowerTitle.includes('progressive') || lowerTitle.includes('development')) {
    primaryFocus = 'Progressive Skill Building'
  } else if (lowerTitle.includes('advanced') || lowerTitle.includes('elite')) {
    primaryFocus = 'Advanced Technique Mastery'
  } else if (lowerTitle.includes('fundamental') || lowerTitle.includes('basic')) {
    primaryFocus = 'Fundamental Technique'
  } else if (lowerTitle.includes('conditioning') || lowerTitle.includes('fitness')) {
    primaryFocus = 'Physical Conditioning'
  } else if (lowerTitle.includes('mental') || lowerTitle.includes('psychology')) {
    primaryFocus = 'Mental Preparation'
  }

  // Extract key skills based on sport and title
  const keySkills: string[] = []
  const techniques: string[] = []

  if (sport.toLowerCase() === 'football' || sport.toLowerCase() === 'american football') {
    // American Football skill extraction
    if (lowerTitle.includes('blocking')) keySkills.push('Blocking Technique')
    if (lowerTitle.includes('tackling')) keySkills.push('Tackling Form')
    if (lowerTitle.includes('route') || lowerTitle.includes('receiving')) keySkills.push('Route Running')
    if (lowerTitle.includes('quarterback') || lowerTitle.includes('qb')) keySkills.push('Quarterback Mechanics')
    if (lowerTitle.includes('coverage') || lowerTitle.includes('defense')) keySkills.push('Defensive Coverage')
    if (lowerTitle.includes('rush') || lowerTitle.includes('running')) keySkills.push('Rush Technique')
    if (lowerTitle.includes('line') || lowerTitle.includes('lineman')) keySkills.push('Line Play')
    if (lowerTitle.includes('special teams')) keySkills.push('Special Teams')

    // Extract specific techniques
    if (lowerTitle.includes('stance')) techniques.push('Proper Stance')
    if (lowerTitle.includes('footwork')) techniques.push('Footwork Mechanics')
    if (lowerTitle.includes('hand placement')) techniques.push('Hand Positioning')
    if (lowerTitle.includes('leverage')) techniques.push('Leverage Technique')
    if (lowerTitle.includes('pass protection')) techniques.push('Pass Protection')
    if (lowerTitle.includes('run fit')) techniques.push('Run Fit Assignment')
  } else if (sport.toLowerCase() === 'soccer') {
    // Soccer skill extraction
    if (lowerTitle.includes('passing')) keySkills.push('Passing Accuracy')
    if (lowerTitle.includes('shooting')) keySkills.push('Shooting Technique')
    if (lowerTitle.includes('dribbling')) keySkills.push('Ball Control')
    if (lowerTitle.includes('defending')) keySkills.push('Defensive Positioning')
    if (lowerTitle.includes('crossing')) keySkills.push('Wing Play')
    if (lowerTitle.includes('heading')) keySkills.push('Aerial Ability')
    if (lowerTitle.includes('goalkeeping')) keySkills.push('Goalkeeping')
    if (lowerTitle.includes('set piece')) keySkills.push('Set Piece Execution')

    // Extract specific techniques
    if (lowerTitle.includes('first touch')) techniques.push('First Touch Control')
    if (lowerTitle.includes('vision')) techniques.push('Field Vision')
    if (lowerTitle.includes('positioning')) techniques.push('Tactical Positioning')
    if (lowerTitle.includes('finishing')) techniques.push('Clinical Finishing')
  }

  // Default skills if none detected
  if (keySkills.length === 0) {
    keySkills.push('Technical Development', 'Tactical Understanding')
  }

  // Determine training type
  let trainingType = 'Technical Training'
  if (lowerTitle.includes('drill') || lowerTitle.includes('practice')) {
    trainingType = 'Drill-Based Practice'
  } else if (lowerTitle.includes('conditioning') || lowerTitle.includes('fitness')) {
    trainingType = 'Physical Conditioning'
  } else if (lowerTitle.includes('tactical') || lowerTitle.includes('strategy')) {
    trainingType = 'Tactical Development'
  } else if (lowerTitle.includes('game') || lowerTitle.includes('match')) {
    trainingType = 'Game Application'
  }

  return {
    primaryFocus,
    keySkills,
    trainingType,
    techniques
  }
}

/**
 * Build an enhanced prompt that leverages sports knowledge base
 */
function buildEnhancedPrompt(
  request: ContentGenerationRequest,
  sportContext: SportContext,
  coachingContext: CoachingContext
): string {
  const { title, sport, skillLevel = 'intermediate', focus = 'comprehensive' } = request

  // Analyze the lesson title to extract key concepts
  const titleAnalysis = analyzeLessonTitle(title, sport)

  return `You are ${coachingContext.coachName}, an elite ${sport} coach creating a comprehensive lesson titled "${title}".

**LESSON TITLE ANALYSIS:**
Primary Focus: ${titleAnalysis.primaryFocus}
Key Skills: ${titleAnalysis.keySkills.join(', ')}
Training Type: ${titleAnalysis.trainingType}
Specific Techniques: ${titleAnalysis.techniques.join(', ')}

**CRITICAL INSTRUCTION - LESSON MUST BE ABOUT:**
"${title}" - Every section must directly relate to this specific topic. Do not write generic content.

**LESSON REQUIREMENTS:**
- Target Skill Level: ${skillLevel}
- Primary Focus: ${focus}
- Sport: ${sport}
- Duration: ${request.duration || 30} minutes
- MUST address the specific skills mentioned in the title

**SPORT-SPECIFIC CONTEXT:**
Coaching Philosophy: ${coachingContext.expertise.join(', ')}
Key Technical Areas: ${sportContext.technicalAspects.slice(0, 5).join(', ')}
Mental Aspects: ${sportContext.mentalAspects.slice(0, 3).join(', ')}
Physical Requirements: ${sportContext.physicalAspects.slice(0, 3).join(', ')}

**SKILL LEVEL CONTEXT (${skillLevel.toUpperCase()}):**
Focus on: ${sportContext.skillProgression[skillLevel].slice(0, 4).join(', ')}

**EXPERT KNOWLEDGE TO INCORPORATE:**
Common Terminology: ${Object.entries(sportContext.commonTerminology).slice(0, 3).map(([term, def]) => `${term} (${def})`).join(', ')}
Safety Priorities: ${sportContext.safetyConsiderations.slice(0, 3).join(', ')}
Common Mistakes to Address: ${sportContext.commonMistakes.slice(0, 3).join(', ')}

**REQUIRED OUTPUT STRUCTURE:**
Generate a comprehensive lesson writeup (800-1200 words) specifically about "${title}". Every section must relate directly to this topic:

## Lesson Overview
Explain specifically what "${title}" covers and why these particular skills are important for ${skillLevel} players. Reference the ${titleAnalysis.primaryFocus} and ${titleAnalysis.trainingType}.

## Technical Breakdown of ${title}
Detailed explanation of the specific techniques mentioned in the title:
${titleAnalysis.keySkills.length > 0 ? `Focus on: ${titleAnalysis.keySkills.join(', ')}` : ''}
${titleAnalysis.techniques.length > 0 ? `Key techniques: ${titleAnalysis.techniques.join(', ')}` : ''}
- Proper body positioning and mechanics for these specific skills
- Step-by-step execution of the techniques in the title
- Key coaching points for mastering these exact skills
- Variations and progressions specific to this lesson

## Key Fundamentals
3-4 core principles with specific details:
- **[Fundamental 1]**: [Detailed explanation]
- **[Fundamental 2]**: [Detailed explanation]
- **[Fundamental 3]**: [Detailed explanation]

## Practice Drills
3-4 specific drills with exact instructions:
1. **[Drill Name]**: [Setup and execution steps]
2. **[Drill Name]**: [Setup and execution steps]
3. **[Drill Name]**: [Setup and execution steps]

## Game Application
How to apply this skill in match/competition situations:
- Situational awareness
- Decision-making factors
- Timing considerations

## Common Mistakes & Corrections
Address 3-4 typical errors with solutions:
- **Mistake**: [Description] → **Correction**: [Fix]

## Progression Tips
How to advance this skill:
- Next level variations
- Training recommendations
- Performance indicators

## Safety Considerations
Essential safety points specific to this technique:
- Equipment requirements
- Injury prevention
- Training precautions

## Pro Insights
Advanced tips from elite competition experience:
- Mental approach
- Technical refinements
- Strategic applications

**COACHING VOICE:**
Write in your authentic coaching voice: ${coachingContext.voiceCharacteristics.tone}
Include your catchphrase naturally: "${coachingContext.voiceCharacteristics.catchphrases[0]}"
Draw from your credentials: ${coachingContext.coachCredentials.join(', ')}

**QUALITY STANDARDS:**
- Use specific ${sport} terminology correctly
- Include measurable, actionable advice
- Reference real competition scenarios
- Maintain appropriate difficulty for ${skillLevel} level
- Ensure 100% accuracy in technique descriptions
- Make every sentence valuable and specific to this lesson

Write this as if you're creating content for elite athletes who need detailed, expert-level instruction.`
}

/**
 * Parse AI response into structured content
 */
function parseAIResponse(aiText: string, request: ContentGenerationRequest, sportContext: SportContext): GeneratedContent {
  // Extract key techniques from the AI response
  const keyTechniques = extractListItems(aiText, ['technique', 'skill', 'fundamental', 'key points'])

  // Extract safety notes
  const safetyNotes = extractListItems(aiText, ['safety', 'precaution', 'injury prevention', 'protection'])
    .concat(sportContext.safetyConsiderations.slice(0, 3))

  // Extract progression tips
  const progressionTips = extractListItems(aiText, ['progression', 'advance', 'next level', 'improve'])

  // Extract common mistakes
  const commonMistakes = extractListItems(aiText, ['mistake', 'error', 'common problems', 'avoid'])
    .concat(sportContext.commonMistakes.slice(0, 3))

  // Extract expert insights
  const expertInsights = extractListItems(aiText, ['pro tip', 'expert', 'insight', 'championship'])
    .concat(sportContext.expertTips.slice(0, 2))

  // Extract practice drills
  const practicedrills = extractListItems(aiText, ['drill', 'exercise', 'practice', 'training'])

  return {
    detailedWriteup: aiText,
    keyTechniques: keyTechniques.slice(0, 6),
    safetyNotes: [...new Set(safetyNotes)].slice(0, 5),
    progressionTips: progressionTips.slice(0, 4),
    commonMistakes: [...new Set(commonMistakes)].slice(0, 5),
    expertInsights: [...new Set(expertInsights)].slice(0, 4),
    practicedrills: practicedrills.slice(0, 4),
    estimatedDuration: request.duration || 30
  }
}

/**
 * Extract list items from text based on keywords
 */
function extractListItems(text: string, keywords: string[]): string[] {
  const items: string[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      // Check if line contains relevant keywords
      const lowercaseLine = trimmed.toLowerCase()
      if (keywords.some(keyword => lowercaseLine.includes(keyword.toLowerCase()))) {
        items.push(trimmed.replace(/^[•\-*\d.]\s*/, ''))
      }
    }
  }

  return items
}

/**
 * Generate fallback content when AI fails
 */
function generateFallbackContent(
  request: ContentGenerationRequest,
  sportContext: SportContext,
  coachingContext: CoachingContext
): GeneratedContent {
  const { title, skillLevel = 'intermediate', sport } = request

  // Use title analysis for better fallback content
  const titleAnalysis = analyzeLessonTitle(title, sport)

  const fallbackWriteup = `# ${title}

## Lesson Overview
This ${skillLevel}-level lesson specifically focuses on ${titleAnalysis.primaryFocus} through "${title}". As ${coachingContext.coachName}, I've designed this ${titleAnalysis.trainingType} session to develop the core skills identified in this lesson: ${titleAnalysis.keySkills.join(', ')}.

**What You'll Master:**
${titleAnalysis.keySkills.map(skill => `• ${skill}`).join('\n')}
${titleAnalysis.techniques.length > 0 ? '\n**Key Techniques:**\n' + titleAnalysis.techniques.map(technique => `• ${technique}`).join('\n') : ''}

## Technical Breakdown
The key to success in this area lies in understanding the fundamental mechanics and building consistent execution through deliberate practice.

**Core Principles:**
${sportContext.skillProgression[skillLevel].slice(0, 3).map(skill => `• **${skill}**: Focus on precise execution and consistent application`).join('\n')}

## Key Fundamentals
• **Technical Precision**: Master the basic movements before adding speed or complexity
• **Mental Preparation**: Visualize successful execution before attempting
• **Progressive Development**: Build skills systematically through structured practice

## Practice Drills
1. **Foundation Drill**: Start with basic movements, focus on form over speed
2. **Progression Drill**: Add complexity gradually while maintaining technique
3. **Application Drill**: Practice in game-like situations with decision-making

## Safety Considerations
${sportContext.safetyConsiderations.slice(0, 3).map(safety => `• ${safety}`).join('\n')}

## Expert Tips
${sportContext.expertTips.slice(0, 2).map(tip => `• ${tip}`).join('\n')}

Remember: ${coachingContext.voiceCharacteristics.catchphrases[0]}`

  return {
    detailedWriteup: fallbackWriteup,
    keyTechniques: sportContext.skillProgression[skillLevel].slice(0, 4),
    safetyNotes: sportContext.safetyConsiderations.slice(0, 4),
    progressionTips: [
      'Master fundamentals before advancing',
      'Practice consistently with focus on quality',
      'Seek feedback from experienced practitioners',
      'Record progress and set measurable goals'
    ],
    commonMistakes: sportContext.commonMistakes.slice(0, 4),
    expertInsights: sportContext.expertTips.slice(0, 3),
    practicedrills: [
      'Foundation building with basic movements',
      'Progressive complexity development',
      'Game-situation application practice',
      'Mental rehearsal and visualization'
    ],
    estimatedDuration: request.duration || 30
  }
}

/**
 * Generate quick content ideas based on sport and level
 */
export function generateContentIdeas(sport: string, count: number = 10): string[] {
  const sportContext = getSportContext(sport)
  const ideas: string[] = []

  // Combine different aspects to create varied content ideas
  const technicalIdeas = sportContext.technicalAspects.map(aspect =>
    `Mastering ${aspect}: ${['Fundamentals', 'Advanced Techniques', 'Competition Application'][Math.floor(Math.random() * 3)]}`
  )

  const skillLevelIdeas = Object.entries(sportContext.skillProgression).flatMap(([level, skills]) =>
    skills.slice(0, 2).map(skill => `${level.charAt(0).toUpperCase() + level.slice(1)} ${skill}`)
  )

  const mentalIdeas = sportContext.mentalAspects.slice(0, 3).map(aspect =>
    `Building ${aspect} for Competition Success`
  )

  // Combine and randomize
  ideas.push(...technicalIdeas.slice(0, Math.ceil(count * 0.5)))
  ideas.push(...skillLevelIdeas.slice(0, Math.ceil(count * 0.3)))
  ideas.push(...mentalIdeas.slice(0, Math.ceil(count * 0.2)))

  // Shuffle and return requested count
  return shuffleArray(ideas).slice(0, count)
}

/**
 * Utility function to shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}