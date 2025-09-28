/**
 * Enhanced Content Generation Service
 * Leverages comprehensive sports knowledge base for detailed, expert-level content creation
 */

import { getSportContext, SportContext } from './sports-knowledge-base'
// Dynamic import for ai-service to avoid Node.js modules in client bundle
import type { CoachingContext } from './ai-service'
import { generateWithRedundancy } from './llm-service'

export interface ContentGenerationRequest {
  title: string
  sport: string
  technique?: string // Specific skill or technique being taught
  creatorId?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite' // Alternative naming for clarity
  focus?: 'technical' | 'tactical' | 'physical' | 'mental' | 'comprehensive'
  duration?: number // in minutes
  durationMinutes?: number // Alternative naming for template consistency
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
 * Template variables for dynamic prompt generation
 */
export interface PromptTemplateVariables {
  sport: string
  technique: string
  audienceLevel: string
  durationMinutes: number
  title: string
  focus: string
  safetyLevel: string
}

/**
 * Dynamic prompt template structure
 */
export interface DynamicPromptTemplate {
  systemInstruction: string
  userPrompt: string
}

/**
 * Create template variables from content generation request
 */
function createTemplateVariables(request: ContentGenerationRequest): PromptTemplateVariables {
  return {
    sport: request.sport,
    technique: request.technique || request.title,
    audienceLevel: request.audienceLevel || request.skillLevel || 'intermediate',
    durationMinutes: request.durationMinutes || request.duration || 60,
    title: request.title,
    focus: request.focus || 'comprehensive',
    safetyLevel: request.safetyLevel || 'high'
  }
}

/**
 * Generate dynamic system instruction template
 */
function generateSystemInstructionTemplate(variables: PromptTemplateVariables): string {
  const baseInstruction = `You are an expert ${variables.sport} coach with extensive experience, specializing in a methodical and safety-first approach to instruction. Your persona is professional, knowledgeable, and highly detail-oriented. You must provide well-structured, comprehensive, and technically accurate content. When creating lesson plans, follow standard pedagogical principles for athletic instruction, including warm-ups, technical breakdown, drilling, and skill application. Always use correct ${variables.sport} terminology.`

  // Sport-specific enhancements
  const sportSpecificAdditions = getSportSpecificInstructions(variables.sport, variables.audienceLevel)

  // Safety level modifications
  const safetyModifications = getSafetyLevelInstructions(variables.safetyLevel, variables.sport)

  return `${baseInstruction}

${sportSpecificAdditions}

${safetyModifications}

**SPECIALIZED EXPERTISE FOR THIS LESSON:**
- Technique Focus: You have deep knowledge of ${variables.technique} and its applications in ${variables.sport}
- Audience Level: Your instruction is tailored for ${variables.audienceLevel} practitioners
- Session Duration: You design content appropriate for ${variables.durationMinutes}-minute sessions
- Teaching Focus: Your approach emphasizes ${variables.focus} development`
}

/**
 * Generate dynamic user prompt template
 */
function generateUserPromptTemplate(variables: PromptTemplateVariables): string {
  return `Generate a detailed write-up and a separate ${variables.durationMinutes}-minute lesson plan for an ${variables.audienceLevel}-level ${variables.sport} seminar. The seminar topic is '${variables.technique} and Its Fundamentals.'

The content should include:
1. An introduction to the topic with context and importance in ${variables.sport}
2. A breakdown of key technical and tactical principles
3. At least two specific techniques with clear, step-by-step instructions
4. Progressive drilling sequences appropriate for ${variables.audienceLevel} level
5. Safety considerations and injury prevention protocols
6. Common mistakes and troubleshooting guidance
7. Expert insights and competition applications

The lesson plan should include a detailed timeline for each section of the class, with specific time allocations and transition instructions.

**FORMATTING REQUIREMENTS - CRITICAL FOR READABILITY:**

Use this exact structure with proper spacing and formatting:

## Document 1: Technical Write-up

# ${variables.title}

## Lesson Overview
[Welcome and introduction - 2-3 paragraphs with clear spacing]

## Key Skills You'll Master
• **Skill 1**: Clear description
• **Skill 2**: Clear description
• **Skill 3**: Clear description

## Technical Breakdown
[Detailed section with subsections]

**Fundamental Principles:**
• **Principle 1**: Explanation
• **Principle 2**: Explanation

**Core Concepts:**
• **Concept 1**: Details
• **Concept 2**: Details

## Step-by-Step Instructions
[Numbered sequences with clear breaks]

**Technique 1: [Name]**
1. Step one with clear explanation
2. Step two with clear explanation
3. Step three with clear explanation

**Technique 2: [Name]**
1. Step one with clear explanation
2. Step two with clear explanation
3. Step three with clear explanation

## Safety Considerations
• **Safety Point 1**: Clear guidelines
• **Safety Point 2**: Clear guidelines
• **Safety Point 3**: Clear guidelines

## Expert Insights
**Professional Tips:**
• Insight 1
• Insight 2
• Insight 3

## Document 2: Lesson Plan

# ${variables.durationMinutes}-Minute ${variables.title} Lesson Plan

**Time breakdown with clear sections and spacing between each**

**CRITICAL FORMATTING REQUIREMENTS:**
- Use proper markdown headers (##, ###)
- Add blank lines between all sections
- Use bullet points (•) for lists, not asterisks
- Bold important terms with **text**
- Number steps clearly (1., 2., 3.)
- Every section must directly relate to "${variables.title}" - no generic content
- Content must be appropriate for ${variables.audienceLevel} skill level
- Use correct ${variables.sport} terminology throughout
- Emphasize ${variables.safetyLevel} safety protocols
- Focus on ${variables.focus} development aspects
- Minimum 2000 words total across both documents`
}

/**
 * Get sport-specific instruction enhancements
 */
function getSportSpecificInstructions(sport: string, audienceLevel: string): string {
  switch (sport.toLowerCase()) {
    case 'bjj':
    case 'brazilian jiu-jitsu':
      return `**BJJ COACHING SPECIALIZATION:**
You have IBJJF competition experience and expertise in modern no-gi systems. You emphasize position before submission, systematic development, and building technique through repetition and live application. For ${audienceLevel} students, you ${audienceLevel === 'beginner' ? 'prioritize safety and fundamental movements' : audienceLevel === 'advanced' ? 'include competition-level details and tactical applications' : 'balance technical development with practical application'}.`

    case 'mma':
    case 'mixed martial arts':
      return `**MMA COACHING SPECIALIZATION:**
You have professional fighter development experience combining striking, grappling, and conditioning. You emphasize fight IQ, tactical application, and real combat scenarios. Your approach integrates multiple martial arts disciplines with fight-specific applications.`

    case 'soccer':
    case 'football':
      return `**SOCCER COACHING SPECIALIZATION:**
You have professional and youth development experience focusing on technical skill development, tactical understanding, and team coordination. You emphasize proper biomechanics, decision-making under pressure, and game-realistic training scenarios.`

    case 'basketball':
      return `**BASKETBALL COACHING SPECIALIZATION:**
You have competitive coaching experience at multiple levels. You focus on fundamental mechanics, court awareness, and tactical application. Your training emphasizes proper form, progressive skill development, and game situation application.`

    case 'rock climbing':
    case 'climbing':
      return `**CLIMBING COACHING SPECIALIZATION:**
You have extensive outdoor and competitive climbing experience. You prioritize safety protocols, risk management, and progressive skill development. Your approach emphasizes technique over strength and mental preparation alongside physical training.`

    default:
      return `**${sport.toUpperCase()} COACHING SPECIALIZATION:**
You have extensive competitive and instructional experience in ${sport}. Your methodology focuses on systematic skill development, proper technique, and performance optimization with sport-specific applications.`
  }
}

/**
 * Get safety level-specific instructions
 */
function getSafetyLevelInstructions(safetyLevel: string, sport: string): string {
  switch (safetyLevel) {
    case 'high':
      return `**HIGH SAFETY PROTOCOL:**
Safety is your absolute priority. Include comprehensive warm-up and cool-down procedures, detailed injury prevention strategies, progressive skill introduction, and emergency response protocols. Emphasize proper form over speed or intensity.`

    case 'medium':
      return `**STANDARD SAFETY PROTOCOL:**
Maintain appropriate safety standards with proper warm-up procedures, injury prevention awareness, and progressive skill development. Balance safety with performance development.`

    case 'low':
      return `**PERFORMANCE-FOCUSED PROTOCOL:**
While maintaining essential safety standards, your focus is on performance development and advanced skill application. Assume participants have appropriate experience and conditioning.`

    default:
      return `**STANDARD SAFETY PROTOCOL:**
Maintain appropriate safety standards with proper warm-up procedures, injury prevention awareness, and progressive skill development.`
  }
}

/**
 * Generate dynamic prompt template based on request variables
 */
export function generateDynamicPromptTemplate(request: ContentGenerationRequest): DynamicPromptTemplate {
  const variables = createTemplateVariables(request)

  return {
    systemInstruction: generateSystemInstructionTemplate(variables),
    userPrompt: generateUserPromptTemplate(variables)
  }
}

/**
 * Generate comprehensive lesson content using AI with sports-specific knowledge
 */
export async function generateLessonContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const sportContext = getSportContext(request.sport)
  const { getCoachingContext } = await import('./ai-service')
  const coachingContext = getCoachingContext(request.creatorId, request.sport)

  try {
    // Generate dynamic prompt template
    const dynamicTemplate = generateDynamicPromptTemplate(request)

    // Use the dynamic template for AI generation
    const combinedPrompt = `${dynamicTemplate.systemInstruction}

${dynamicTemplate.userPrompt}`

    // Use the robust AI service with dynamic prompt
    const result = await generateWithRedundancy(combinedPrompt, coachingContext)

    // Parse and structure the AI response
    const structuredContent = parseAIResponse(result.text, request, sportContext)

    return structuredContent
  } catch (error) {
    console.error('Dynamic content generation failed:', error)
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
  } else if (sport.toLowerCase() === 'bjj' || sport.toLowerCase() === 'brazilian jiu-jitsu') {
    // BJJ skill extraction
    if (lowerTitle.includes('guard')) keySkills.push('Guard Retention', 'Guard Passing', 'Sweep Timing')
    if (lowerTitle.includes('submission')) keySkills.push('Submission Chains', 'Control Before Attack')
    if (lowerTitle.includes('position')) keySkills.push('Positional Control', 'Transition Timing')
    if (lowerTitle.includes('escape')) keySkills.push('Hip Movement', 'Frame Creation', 'Defensive Concepts')
    if (lowerTitle.includes('takedown')) keySkills.push('Wrestling Fundamentals', 'Level Changes')
    if (lowerTitle.includes('sparring') || lowerTitle.includes('rolling')) keySkills.push('Live Training', 'Pressure Testing')

    // BJJ techniques
    if (lowerTitle.includes('armbar')) techniques.push('Arm Isolation', 'Hip Positioning')
    if (lowerTitle.includes('triangle')) techniques.push('Angle Creation', 'Leg Positioning')
    if (lowerTitle.includes('choke')) techniques.push('Collar Control', 'Finishing Mechanics')
    if (lowerTitle.includes('sweep')) techniques.push('Off-Balancing', 'Leverage Points')
    if (lowerTitle.includes('kimura')) {
      keySkills.push('Shoulder Control', 'Grip Fighting')
      techniques.push('Figure-Four Grip', 'Shoulder Isolation', 'Lock Mechanics')
    }
    if (lowerTitle.includes('leg lock') || lowerTitle.includes('leglock') || lowerTitle.includes('heel hook') || lowerTitle.includes('ankle lock') || lowerTitle.includes('knee bar')) {
      keySkills.push('Leg Entanglement', 'Breaking Mechanics', 'Control Systems')
      techniques.push('Entry Systems', 'Finishing Angles', 'Safety Protocols', 'Counter Defense')
    }
  }

  // Default skills if none detected
  if (keySkills.length === 0) {
    if (sport.toLowerCase() === 'football' || sport.toLowerCase() === 'american football') {
      keySkills.push('Fundamentals and Form', 'Team Coordination', 'Situational Awareness')
    } else if (sport.toLowerCase() === 'soccer') {
      keySkills.push('Ball Control and Technique', 'Field Vision and Decision Making', 'Team Tactical Understanding')
    } else if (sport.toLowerCase() === 'bjj' || sport.toLowerCase() === 'brazilian jiu-jitsu') {
      keySkills.push('Technical Precision', 'Positional Control', 'Systematic Problem Solving')
    } else {
      keySkills.push('Technical Development', 'Tactical Understanding')
    }
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
 * Generate sport-specific persona for enhanced content generation
 */
function getSportSpecificPersona(sport: string, skillLevel: string, titleAnalysis: any): string {
  const basePersona = `You are an elite ${sport} coach with over 15 years of experience, specializing in a methodical and safety-first approach to instruction. Your persona is professional, knowledgeable, and highly detail-oriented.`

  switch (sport.toLowerCase()) {
    case 'bjj':
    case 'brazilian jiu-jitsu':
      return `${basePersona} You are an expert Brazilian Jiu-Jitsu coach with IBJJF competition experience and expertise in modern no-gi systems. When creating lesson plans, follow standard pedagogical principles for martial arts instruction, including warm-ups, technical breakdown, drilling, positional sparring, and cool-down. Always use correct BJJ terminology and emphasize safety protocols, especially for submissions. Your teaching methodology focuses on position before submission, systematic development, and building technique through repetition and live application.

**SPECIALIZED EXPERTISE FOR THIS LESSON:**
${titleAnalysis.techniques.length > 0 ? `Technique Focus: You have deep knowledge of ${titleAnalysis.techniques.join(', ')} and their applications` : ''}
${titleAnalysis.keySkills.includes('Leg Entanglement') ? 'Leg Lock Specialist: You prioritize safety and systematic progression in leg entanglement systems' : ''}
${skillLevel === 'advanced' ? 'Advanced Instruction: You provide competition-level details and tactical applications' : ''}
${skillLevel === 'beginner' ? 'Beginner-Friendly: You emphasize fundamentals and safety above all else' : ''}

**OUTPUT REQUIREMENTS:** You must provide well-structured, comprehensive, and technically accurate content that addresses the specific lesson topic with appropriate depth for the skill level.`

    case 'mma':
    case 'mixed martial arts':
      return `${basePersona} You are an expert MMA coach with professional fighter development experience. Your approach combines striking, grappling, and conditioning in an integrated fighting system. You emphasize fight IQ, tactical application, and real combat scenarios. When creating lesson plans, include proper warm-up protocols, technical instruction, live drilling, sparring applications, and recovery. Always address safety and injury prevention.

**OUTPUT REQUIREMENTS:** You must provide comprehensive technical breakdowns that integrate multiple martial arts disciplines with fight-specific applications.`

    case 'soccer':
    case 'football':
      return `${basePersona} You are an expert soccer coach with professional and youth development experience. Your methodology focuses on technical skill development, tactical understanding, and team coordination. You emphasize proper biomechanics, decision-making under pressure, and game-realistic training scenarios.

**OUTPUT REQUIREMENTS:** You must provide detailed technical instruction with tactical applications and team-oriented skill development.`

    default:
      return `${basePersona} You have extensive experience in ${sport} coaching at elite levels. Your methodology focuses on systematic skill development, proper technique, and performance optimization.

**OUTPUT REQUIREMENTS:** You must provide comprehensive, sport-specific content with appropriate technical depth.`
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
  const titleAnalysis = analyzeLessonTitle(title, sport)

  // Enhanced system instruction based on sport type
  const sportSpecificPersona = getSportSpecificPersona(sport, skillLevel, titleAnalysis)

  return `${sportSpecificPersona}

**CONTENT GENERATION REQUIREMENTS:**
Generate a comprehensive, detailed lesson writeup for "${title}" that includes:

1. **Lesson Overview Section** (200-300 words)
   - Welcome message in coaching voice
   - Specific explanation of what "${title}" entails
   - Clear learning objectives for ${skillLevel} level
   - Session roadmap and expectations

2. **Technical Breakdown Section** (400-600 words)
   - Fundamental principles specific to "${title}"
   - Biomechanical analysis and movement patterns
   - Key concepts and terminology
   - ${skillLevel}-appropriate technical depth

3. **Step-by-Step Instructions** (500-800 words)
   - Detailed technique breakdown
   - Progressive learning sequence
   - Common variations and applications
   - Troubleshooting and corrections

4. **Training Methodology Section** (300-400 words)
   - Structured practice progression
   - Drill sequences and repetition protocols
   - Live application methods
   - Skill assessment criteria

5. **Safety and Risk Management** (200-300 words)
   - Sport-specific safety protocols
   - Injury prevention strategies
   - Emergency procedures if applicable
   - Training intensity guidelines

6. **Expert Insights Section** (300-400 words)
   - Professional competition applications
   - Advanced tactical considerations
   - Mental approach and mindset
   - Elite performance secrets

**CRITICAL CONSTRAINTS:**
- Title Focus: Every section must directly address "${title}" - no generic content
- Skill Level: Content must be appropriate for ${skillLevel} practitioners
- Sport: All content must be ${sport}-specific using correct terminology
- Voice: Maintain ${coachingContext.coachName}'s coaching persona throughout
- Length: Minimum 2000 words total across all sections
- Structure: Use clear headings and bullet points for readability

**LESSON CONTEXT:**
Title Analysis: ${titleAnalysis.primaryFocus} (${titleAnalysis.trainingType})
Key Skills: ${titleAnalysis.keySkills.join(', ')}
Techniques: ${titleAnalysis.techniques.join(', ')}
Duration: ${request.duration || 30} minutes
Coaching Style: ${coachingContext.expertise.join(', ')}
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
 * Generate comprehensive sport-specific fallback content
 */
function generateSportSpecificFallbackContent(
  title: string,
  sport: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  const sportLower = sport.toLowerCase()

  if (sportLower === 'football' || sportLower === 'american football') {
    return generateAmericanFootballContent(title, titleAnalysis, sportContext, coachingContext, skillLevel)
  } else if (sportLower === 'soccer') {
    return generateSoccerContent(title, titleAnalysis, sportContext, coachingContext, skillLevel)
  } else if (sportLower === 'bjj' || sportLower === 'brazilian jiu-jitsu') {
    return generateBJJContent(title, titleAnalysis, sportContext, coachingContext, skillLevel)
  } else if (sportLower === 'mma' || sportLower === 'mixed martial arts') {
    return generateMMAContent(title, titleAnalysis, sportContext, coachingContext, skillLevel)
  } else {
    return generateGenericContent(title, titleAnalysis, sportContext, coachingContext, skillLevel)
  }
}

/**
 * Generate detailed American Football content
 */
function generateAmericanFootballContent(
  title: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  const isDrillFocused = titleAnalysis.primaryFocus === 'Effective Practice Methods'

  return `# ${title}

## Lesson Overview
Welcome to this comprehensive American Football lesson on "${title}". As ${coachingContext.coachName}, I'm bringing championship-level coaching experience to help you master ${titleAnalysis.primaryFocus.toLowerCase()}. This ${titleAnalysis.trainingType.toLowerCase()} session is specifically designed for ${skillLevel} players who are serious about elevating their game.

**This lesson will develop:**
${titleAnalysis.keySkills.map((skill: string) => `• **${skill}**: Essential for competitive football success`).join('\n')}

## Technical Breakdown: Championship-Level Fundamentals

${isDrillFocused ?
`**Practice Organization & Methodology:**
• **Structured Progression**: Build from individual skills to team concepts
• **Game-Speed Training**: Practice at the intensity you'll play at
• **Repetition with Purpose**: Every rep must have intention and focus
• **Film Study Integration**: Connect practice work to game situations

**Football-Specific Training Principles:**
• **Stance and Start**: Every play begins with proper pre-snap positioning
• **Leverage and Pad Level**: Win battles by getting lower than your opponent
• **Assignment Football**: Master your job before helping teammates
• **Situational Awareness**: Understand down, distance, field position impact` :
`**Core Football Mechanics:**
• **Stance and Alignment**: Base of all football skills - proper pre-snap positioning
• **Leverage Fundamentals**: Winning the battle of pad level and body position
• **Footwork Precision**: Every step must be purposeful and efficient
• **Hand Placement**: Control and separation through proper technique

**Position-Specific Excellence:**
• **Offensive Line**: Pass protection schemes, run blocking concepts
• **Skill Positions**: Route precision, ball security, YAC mentality
• **Defense**: Gap responsibility, coverage concepts, pursuit angles
• **Special Teams**: Phase assignments, coverage lanes, returner vision`}

## Key Fundamentals for ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Players

• **Preparation Equals Performance**: Film study and mental reps create muscle memory
• **Physical and Mental Toughness**: Developed through consistent challenging practice
• **Team-First Mentality**: Individual success serves team objectives
• **Communication and Leadership**: Vocal players make teammates better
• **Consistency Under Pressure**: Championship habits show in critical moments

## Practice Drills: Game-Tested Methods

${isDrillFocused ?
`1. **Fundamentals Station Work**: Stance, start, and basic movements (8-10 reps each)
2. **Progressive Skill Building**: Add complexity while maintaining technique quality
3. **Situational Drilling**: Down and distance specific scenarios
4. **Team Integration**: Combine individual skills into coordinated unit work
5. **Competition Periods**: Create game-like pressure and intensity
6. **Conditioning Through Football**: Build fitness through football-specific movements` :
`1. **Stance and Start Drill**: Perfect your pre-snap positioning and first step
2. **Leverage Battle**: Practice winning with proper pad level and body position
3. **Assignment Execution**: Run plays with focus on individual responsibility
4. **Pressure Situations**: Practice under game-like stress and time constraints`}

## Game Application: Championship Mindset

**Pre-Snap Excellence:**
• Read defensive alignment and make appropriate adjustments
• Communicate effectively with teammates using proper terminology
• Understand situational football - down, distance, field position, time

**During Play Execution:**
• Execute assignment first, then help teammates if possible
• Maintain technique under physical and mental pressure
• Pursue every play with championship effort and intensity

**Post-Play Analysis:**
• Quickly evaluate success/failure and make necessary adjustments
• Communicate observations with coaches and teammates
• Prepare mentally for next play with renewed focus

## Common Mistakes & Championship Corrections

• **Mistake**: Poor stance leads to slow starts → **Correction**: Weight distribution and ready position practice
• **Mistake**: Playing too high and losing leverage → **Correction**: Pad level emphasis in all drills
• **Mistake**: Mental errors and missed assignments → **Correction**: Increased film study and communication
• **Mistake**: Inconsistent effort and focus → **Correction**: Championship standard accountability

## Progression Tips: Path to Excellence

• **Master Your Fundamentals**: Perfect stance, start, and basic movements before advanced techniques
• **Study the Game**: Film work separates good players from great players
• **Physical Preparation**: Strength, speed, and conditioning built through purposeful training
• **Mental Development**: Understand schemes, opponent tendencies, and situational football
• **Leadership Growth**: Develop communication skills and accountability standards

## Safety Considerations: Smart Football

${sportContext.safetyConsiderations.slice(0, 4).map((safety: string) => `• ${safety}`).join('\n')}

## Championship Insights: Elite-Level Secrets

**From the Film Room:**
${sportContext.expertTips.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Remember**: ${coachingContext.voiceCharacteristics.catchphrases[0]}

*This lesson represents the systematic approach that builds championship-level football players and teams. Every rep matters, every detail counts, and every player has a role in team success.*`
}

/**
 * Generate detailed Soccer content
 */
function generateSoccerContent(
  title: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  const isDrillFocused = titleAnalysis.primaryFocus === 'Effective Practice Methods'

  return `# ${title}

## Lesson Overview
Welcome to this comprehensive soccer lesson on "${title}". As ${coachingContext.coachName}, I'll guide you through ${titleAnalysis.primaryFocus.toLowerCase()} using proven methodologies from elite-level soccer. This ${titleAnalysis.trainingType.toLowerCase()} session is designed for ${skillLevel} players committed to technical excellence.

**This session will develop:**
${titleAnalysis.keySkills.map((skill: string) => `• **${skill}**: Critical for modern soccer success`).join('\n')}

## Technical Breakdown: Modern Soccer Excellence

${isDrillFocused ?
`**Soccer Training Methodology:**
• **Progressive Overload**: Gradually increase difficulty while maintaining technical quality
• **Game-Like Conditions**: Train in situations that mirror match scenarios
• **Touch Frequency**: Maximum ball contact to accelerate learning
• **Decision Making**: Integrate cognitive elements into all technical work

**Essential Soccer Principles:**
• **First Touch Excellence**: Your first touch determines the quality of your next action
• **Vision and Scanning**: Look before you receive, scan constantly during possession
• **Body Shape**: Position your body to see maximum field and protect possession
• **Quick Decision Making**: Process information rapidly and execute with confidence` :
`**Core Soccer Mechanics:**
• **Ball Control Mastery**: Use all surfaces of foot for close control and direction
• **Passing Precision**: Weight, accuracy, and timing of distribution
• **Receiving Excellence**: First touch that creates time and space
• **Movement Patterns**: Create space through intelligent runs and positioning

**Tactical Understanding:**
• **Space Recognition**: Identify where space exists and how to exploit it
• **Pressing Triggers**: When to apply pressure and when to hold shape
• **Transition Moments**: Quick switches between attack and defense
• **Team Coordination**: Synchronize movements with teammates effectively`}

## Key Fundamentals for ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Players

• **Technique Over Power**: Perfect execution beats physical strength every time
• **Intelligence Over Speed**: Smart players create time through positioning and awareness
• **Consistency Over Flair**: Reliable performance wins matches and championships
• **Team Understanding**: Individual brilliance serves collective success
• **Mental Composure**: Maintain technical quality under physical and time pressure

## Practice Drills: Proven Training Methods

${isDrillFocused ?
`1. **Technical Circuits**: High-repetition skill work with both feet (15-20 minutes)
2. **Small-Sided Games**: 3v3, 4v4 situations for decision-making development
3. **Possession Squares**: Keep-away games with numerical advantages/disadvantages
4. **Finishing Sessions**: Varied shooting situations from different angles and distances
5. **Set Piece Practice**: Corner kicks, free kicks, throw-ins with game-like pressure
6. **Transition Training**: Quick switches from defense to attack and vice versa` :
`1. **Ball Mastery**: Individual technical work with cones and close control
2. **Passing Accuracy**: Short and long distribution with proper weight and timing
3. **1v1 Situations**: Attacking and defending in tight spaces
4. **Crossing and Finishing**: Service from wide areas and clinical completion`}

## Game Application: Match Intelligence

**Pre-Game Preparation:**
• Analyze opponent strengths and weaknesses through video study
• Understand your role within team tactical setup
• Visualize successful execution of key skills in match situations

**During Match Play:**
• Scan field constantly to make informed decisions
• Communicate with teammates using clear, concise instructions
• Adapt technique based on pressure, weather, and match conditions

**Mental Approach:**
• Stay composed under pressure from opponents and crowd
• Make quick decisions but execute with precision
• Support teammates through encouragement and tactical adjustments

## Common Mistakes & Elite Corrections

• **Mistake**: Looking down at ball instead of scanning → **Correction**: Practice peripheral vision training
• **Mistake**: Rushing technique under pressure → **Correction**: Pressure training with time constraints
• **Mistake**: Only using dominant foot → **Correction**: Dedicate specific time to weak foot development
• **Mistake**: Poor body positioning when receiving → **Correction**: Open body shape and awareness training

## Progression Tips: Path to Elite Performance

• **Master Both Feet**: Become equally comfortable with left and right foot
• **Increase Training Intensity**: Practice at match speed with match pressure
• **Study Elite Players**: Watch professional matches and analyze positioning
• **Seek Quality Feedback**: Work with experienced coaches for technical refinement
• **Mental Training**: Develop concentration and decision-making under pressure

## Safety Considerations: Injury Prevention

${sportContext.safetyConsiderations.slice(0, 4).map((safety: string) => `• ${safety}`).join('\n')}

## Elite Insights: Professional Secrets

**From Top-Level Soccer:**
${sportContext.expertTips.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Remember**: ${coachingContext.voiceCharacteristics.catchphrases[0]}

*This lesson embodies the systematic approach used by elite soccer programs worldwide. Technical excellence combined with tactical intelligence creates complete players.*`
}

/**
 * Generate detailed BJJ content
 */
function generateBJJContent(
  title: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  const isLegLockFocused = title.toLowerCase().includes('leg lock') || title.toLowerCase().includes('leglock') || title.toLowerCase().includes('heel hook') || title.toLowerCase().includes('ankle lock') || title.toLowerCase().includes('knee bar')
  const isAdvancedLevel = skillLevel.toLowerCase() === 'advanced'

  return `# ${title}

## Lesson Overview: ${isLegLockFocused ? 'Advanced Leg Lock System' : 'Elite BJJ Development'}

Welcome to this systematic Brazilian Jiu-Jitsu lesson on "${title}". As ${coachingContext.coachName}, I'll guide you through ${titleAnalysis.primaryFocus.toLowerCase()} using proven ${isLegLockFocused ? 'ADCC and no-gi competition' : 'IBJJF competition'} methodologies.

This ${titleAnalysis.trainingType.toLowerCase()} is specifically designed for ${skillLevel} practitioners ${isLegLockFocused ? 'ready to explore the modern leg entanglement game' : 'committed to technical excellence'}.

## Key Skills You'll Master

${titleAnalysis.keySkills.map((skill: string) => `• **${skill}**: ${isLegLockFocused ? 'Critical for safe and effective leg lock application' : 'Essential for BJJ mastery'}`).join('\n')}

${titleAnalysis.techniques.length > 0 ? `
## Specific Techniques You'll Master

${titleAnalysis.techniques.map((technique: string) => `• **${technique}**: ${isLegLockFocused ? 'Essential for leg entanglement success' : 'Key component of this technique'}`).join('\n')}` : ''}

## Technical Breakdown: ${isLegLockFocused ? 'The Science of Leg Entanglements' : 'The Science of BJJ'}

${isLegLockFocused ?
`### Leg Lock Fundamental Principles

• **Safety First**: Always prioritize safety - tap early and train smart with leg locks
• **Control Before Breaking**: Establish full control of the leg before applying breaking pressure
• **Systematic Entries**: Use proper entry systems rather than forcing leg attacks
• **Understanding Breaking Mechanics**: Know exactly how each leg lock works biomechanically
• **Respect the Danger**: Leg locks can cause serious injury - train with experienced partners only

### Advanced Leg Lock Concepts

• **Entry Systems**: Ashi garami, 50/50, saddle (4/11) positions and their applications
• **Breaking Mechanics**: Understand joint rotation, pressure points, and anatomical limitations
• **Control Hierarchy**: Establish positional control before attacking the submission
• **Defense Recognition**: Know when opponents are properly defended and when to transition
• **Injury Prevention**: Proper tapping protocols and training intensity management` :
`### Fundamental BJJ Principles

• **Position Before Submission**: Always secure dominant position before attacking
• **Leverage Over Strength**: Use proper body mechanics and angles efficiently
• **Base and Posture**: Maintain structural integrity in all positions
• **Systematic Approach**: Connect techniques in logical chains and sequences
• **Pressure and Control**: Apply intelligent pressure while maintaining mobility`}

### Core Concepts for ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Level

${isLegLockFocused ?
`• **Risk Assessment**: Understand when leg locks are high percentage vs when to abandon them
• **Entry Timing**: Recognize optimal moments for leg entanglement attempts
• **Positional Transitions**: Flow between different leg entanglement positions
• **Finishing Sequences**: Complete leg locks with proper technique and control
• **Counter-Defense**: Defend against leg attacks and counter with your own submissions` :
`• **Technical Precision**: Perfect execution beats strength and athleticism
• **Systematic Development**: Build skills methodically through proven progressions
• **Tactical Application**: Apply techniques in live rolling with proper timing
• **Problem Solving**: Adapt techniques to different body types and situations
• **Flow State**: Connect techniques naturally without forced transitions`}

${!isAdvancedLevel && !isLegLockFocused ? `
## Key Fundamentals

• **Basic Positioning**: Master fundamental positions and transitions
• **Grip Fighting**: Understand grip control and breaking opponent's grips
• **Base and Balance**: Maintain stability while creating instability in opponents
• **Breathing Control**: Stay calm and manage energy efficiently during training
• **Tap Early, Tap Often**: Develop training mindset that prioritizes long-term progress` : ''}

## Training Methodology: ${isLegLockFocused ? 'Progressive Leg Lock Development' : 'Systematic BJJ Training'}

${isLegLockFocused ?
`### Phase 1: Foundation Building (${isAdvancedLevel ? 'Advanced Safety Protocols' : 'Safety First'})

• Master basic leg entanglement positions without submission attempts
• Develop proprioception and awareness in leg entanglement situations
• Practice entry sequences slowly with cooperative training partners
• Study leg lock defense extensively before advancing to submissions

### Phase 2: Controlled Application (${isAdvancedLevel ? 'Competition Timing' : 'Technical Development'})

• Apply leg locks with maximum control and minimal breaking pressure
• Practice on training partners who understand leg lock tapping protocols
• Focus on positional control rather than quick submission attempts
• Develop finishing sequences with emphasis on partner safety

### Phase 3: ${isAdvancedLevel ? 'Competition Integration' : 'Advanced Development'}

${isAdvancedLevel ?
`• Integrate leg locks into live rolling with appropriate training partners
• Develop competition-level entries and finishing sequences
• Practice leg lock defense and counter-attacks extensively
• Study high-level competition footage and modern leg lock systems` :
`• Begin incorporating leg locks into live training situations
• Develop comfort with leg entanglement positions and escapes
• Practice finishing techniques with increased resistance
• Build systematic approach to leg lock chains and combinations`}` :
`### Progressive Training Approach

1. **Technical Drilling**: Master individual techniques through repetition
2. **Positional Sparring**: Practice specific positions and transitions
3. **Flow Training**: Connect techniques in continuous sequences
4. **Live Application**: Apply techniques in full resistance rolling
5. **Competition Simulation**: Practice under pressure and time constraints`}

## Safety Considerations: ${isLegLockFocused ? 'Critical Leg Lock Safety' : 'General BJJ Safety'}

${isLegLockFocused ?
`### MANDATORY Safety Protocols

• **Immediate Tapping**: Tap the moment you feel pressure or discomfort
• **Verbal Communication**: Use verbal taps when hands are trapped
• **Partner Selection**: Only practice with experienced, trustworthy training partners
• **Instructor Supervision**: Always practice leg locks under qualified instruction
• **Progressive Intensity**: Never apply leg locks at full intensity during training
• **Medical Awareness**: Understand injury risks and seek medical attention for pain

### Training Guidelines

• Start all leg lock practice with cooperative drilling only
• Never practice leg locks when tired or unfocused
• Stop immediately if either partner feels unsafe
• Focus on control and safety over speed or aggression
• Regular breaks to prevent fatigue-related injuries` :
`### General Training Safety

${sportContext.safetyConsiderations.slice(0, 4).map(safety => `• ${safety}`).join('\n')}`}

## Expert Insights: ${isLegLockFocused ? 'Modern Leg Lock Wisdom' : 'Competition-Tested Strategies'}

${isLegLockFocused ?
`### From Elite No-Gi Competitors

• "Control first, submission second - leg locks require patience and precision" - Competition Wisdom
• "The best leg lockers are also the best at defending leg locks" - ADCC Veterans
• "Leg locks are not about strength - they're about understanding mechanics and timing" - Modern BJJ
• "Safety in training leads to effectiveness in competition" - Professional Approach

### Advanced Tactical Concepts

• Use leg lock threats to create other submission opportunities
• Develop systematic approach to leg entanglement transitions
• Study opponent's defensive patterns and adapt entries accordingly
• Master both breaking mechanics and positional control equally` :
`### From World-Class Competitors

${sportContext.expertTips.slice(0, 3).map(tip => `• ${tip}`).join('\n')}

### Competition-Tested Strategies

• Focus on high-percentage techniques that work consistently
• Develop strong defensive foundation before advancing offensive skills
• Train with partners who challenge you appropriately for your level
• Compete regularly to test techniques under pressure`}

## Summary

**Remember**: ${coachingContext.voiceCharacteristics.catchphrases[0]}

${isLegLockFocused ?
`*This lesson embodies the modern approach to leg lock development used by elite no-gi competitors and ADCC medalists. Safe, systematic training leads to effective application.*` :
`*This lesson reflects the proven methodologies used by IBJJF World Champions and elite BJJ competitors worldwide. Systematic development creates lasting mastery.*`}`
}

/**
 * Generate detailed MMA content
 */
function generateMMAContent(
  title: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  return `# ${title}

## Lesson Overview
Welcome to this comprehensive MMA lesson on "${title}". As ${coachingContext.coachName}, I'll guide you through ${titleAnalysis.primaryFocus.toLowerCase()} using elite-level fight training methodologies. This ${titleAnalysis.trainingType.toLowerCase()} is designed for ${skillLevel} fighters preparing for serious competition.

**This session will develop:**
${titleAnalysis.keySkills.map((skill: string) => `• **${skill}**: Critical for MMA success`).join('\n')}

## Technical Breakdown: Complete Mixed Martial Arts

**Multi-Range Combat System:**
• **Striking Range**: Boxing, kickboxing, and muay thai fundamentals
• **Clinch Range**: Dirty boxing, pummeling, takedowns, and control
• **Ground Range**: Wrestling control, BJJ submissions, ground and pound
• **Transition Mastery**: Seamless movement between all combat ranges

**Fight-Specific Skills:**
• **Range Management**: Control distance and dictate where fights take place
• **Cardio Under Pressure**: Maintain technique while under physical stress
• **Adaptability**: Adjust strategy based on opponent reactions
• **Mental Toughness**: Perform under adversity and pressure

## Key Fundamentals for ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Fighters

• **Well-Rounded Development**: Train all aspects while specializing in strengths
• **Systematic Game Planning**: Prepare specific strategies for different opponents
• **Physical and Mental Conditioning**: Build fight-specific fitness and toughness
• **Defensive Fundamentals**: Master defense before focusing on offense
• **Competition Experience**: Regular sparring and competition testing

## Training Methodology: Professional Fight Preparation

1. **Technical Development**: Skill work in individual martial arts (30 minutes)
2. **Combination Training**: Chain techniques across different ranges (20 minutes)
3. **Situational Sparring**: Specific scenarios with controlled intensity (20 minutes)
4. **Conditioning Integration**: Build cardio through technical work (15 minutes)
5. **Live Sparring**: Full-contact training with proper safety equipment (20 minutes)
6. **Mental Preparation**: Visualization and pressure simulation (10 minutes)

## Fight Application: Competition Strategy

**Pre-Fight Preparation:**
• Study opponent video to identify strengths and weaknesses
• Develop specific game plans for different fight scenarios
• Practice entries and exits for your preferred ranges

**During Competition:**
• Implement game plan while adapting to opponent adjustments
• Manage energy expenditure across multiple rounds
• Stay composed under pressure and adversity

**Mental Approach:**
• Maintain confidence in training and preparation
• Make quick tactical adjustments based on what's working
• Control emotions and fight with intelligence

## Common Mistakes & Elite Corrections

• **Mistake**: Neglecting one aspect of MMA → **Correction**: Balanced training in all ranges
• **Mistake**: Poor cardio conditioning → **Correction**: Fight-specific conditioning protocols
• **Mistake**: Emotional fighting instead of strategic → **Correction**: Mental discipline training
• **Mistake**: Weak defensive fundamentals → **Correction**: Defense-first approach to training

## Progression Tips: Path to Professional Level

• **Master Individual Arts**: Develop solid base in boxing, wrestling, BJJ
• **Integrate Skills**: Learn to transition smoothly between different ranges
• **Regular Competition**: Test skills under pressure frequently
• **Study Elite Fighters**: Analyze UFC and other high-level competition
• **Professional Coaching**: Work with specialists in each martial art

## Safety Considerations: Smart Training

${sportContext.safetyConsiderations.slice(0, 4).map((safety: string) => `• ${safety}`).join('\n')}

## Championship Insights: Elite Fight Secrets

**From Professional Competition:**
${sportContext.expertTips.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Remember**: ${coachingContext.voiceCharacteristics.catchphrases[0]}

*This lesson embodies the comprehensive approach used by elite MMA training camps. Complete fighters combine technical skill with strategic intelligence.*`
}

/**
 * Generate generic content for other sports
 */
function generateGenericContent(
  title: string,
  titleAnalysis: any,
  sportContext: SportContext,
  coachingContext: CoachingContext,
  skillLevel: string
): string {
  return `# ${title}

## Lesson Overview
This ${skillLevel}-level lesson specifically focuses on ${titleAnalysis.primaryFocus} through "${title}". As ${coachingContext.coachName}, I've designed this ${titleAnalysis.trainingType} session to develop the core skills identified in this lesson: ${titleAnalysis.keySkills.join(', ')}.

**What You'll Master:**
${titleAnalysis.keySkills.map((skill: string) => `• ${skill}`).join('\n')}

## Technical Breakdown
The key to success in this area lies in understanding the fundamental mechanics and building consistent execution through deliberate practice.

**Core Principles:**
${sportContext.skillProgression[skillLevel as keyof typeof sportContext.skillProgression].slice(0, 3).map((skill: string) => `• **${skill}**: Focus on precise execution and consistent application`).join('\n')}

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

  // Generate sport-specific fallback content
  const fallbackWriteup = generateSportSpecificFallbackContent(title, sport, titleAnalysis, sportContext, coachingContext, skillLevel)

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
/**
 * Demonstrate dynamic template generation with example scenarios
 */
export function demonstrateDynamicTemplates(): void {
  console.log('=== DYNAMIC TEMPLATE DEMONSTRATION ===\n')

  // Scenario A: Rock Climbing
  const rockClimbingRequest: ContentGenerationRequest = {
    title: 'Lead Climbing',
    sport: 'Rock Climbing',
    technique: 'Lead Climbing',
    audienceLevel: 'intermediate',
    durationMinutes: 120,
    focus: 'technical',
    safetyLevel: 'high'
  }

  // Scenario B: Competitive Swimming
  const swimmingRequest: ContentGenerationRequest = {
    title: 'Freestyle Stroke',
    sport: 'Competitive Swimming',
    technique: 'Freestyle Stroke',
    audienceLevel: 'advanced',
    durationMinutes: 75,
    focus: 'technical',
    safetyLevel: 'medium'
  }

  // Scenario C: BJJ Leg Locks
  const bjjRequest: ContentGenerationRequest = {
    title: 'Leg Lock',
    sport: 'BJJ',
    technique: 'Leg Lock',
    audienceLevel: 'advanced',
    durationMinutes: 90,
    focus: 'technical',
    safetyLevel: 'high'
  }

  const scenarios = [
    { name: 'Rock Climbing', request: rockClimbingRequest },
    { name: 'Swimming', request: swimmingRequest },
    { name: 'BJJ', request: bjjRequest }
  ]

  scenarios.forEach(scenario => {
    console.log(`--- ${scenario.name.toUpperCase()} TEMPLATE ---`)
    const template = generateDynamicPromptTemplate(scenario.request)
    console.log('System Instruction:', template.systemInstruction.substring(0, 200) + '...')
    console.log('User Prompt:', template.userPrompt.substring(0, 200) + '...')
    console.log('\n')
  })
}

/**
 * Enhance existing content with additional details and structure
 */
export function enhanceExistingContent(
  existingContent: string,
  title: string,
  sport: string,
  skillLevel: string = 'intermediate'
): string {
  const sportContext = getSportContext(sport)
  const titleAnalysis = analyzeLessonTitle(title, sport)

  // Analyze what's already in the content
  const hasKeySkills = existingContent.toLowerCase().includes('key skills') || existingContent.toLowerCase().includes('skills you\'ll master')
  const hasTechnicalBreakdown = existingContent.toLowerCase().includes('technical breakdown') || existingContent.toLowerCase().includes('technical')
  const hasSafety = existingContent.toLowerCase().includes('safety')
  const hasExpertTips = existingContent.toLowerCase().includes('expert') || existingContent.toLowerCase().includes('tips')
  const hasCommonMistakes = existingContent.toLowerCase().includes('common mistakes') || existingContent.toLowerCase().includes('mistakes')

  let enhancedContent = existingContent

  // Add missing key skills section
  if (!hasKeySkills && titleAnalysis.keySkills.length > 0) {
    enhancedContent += `\n\n## Key Skills You'll Master\n\n${titleAnalysis.keySkills.map(skill => `• **${skill}**: Essential for ${title.toLowerCase()} development`).join('\n')}`
  }

  // Add missing technical breakdown
  if (!hasTechnicalBreakdown) {
    enhancedContent += `\n\n## Technical Breakdown\n\n### Fundamental Principles\n\n• **Progressive Development**: Build skills systematically through structured practice\n• **Technical Precision**: Focus on proper form and execution\n• **Contextual Application**: Understand when and how to apply techniques\n• **Safety First**: Maintain proper protocols throughout training`
  }

  // Add missing specific techniques section
  if (titleAnalysis.techniques.length > 0 && !existingContent.toLowerCase().includes('specific techniques')) {
    enhancedContent += `\n\n## Specific Techniques You'll Master\n\n${titleAnalysis.techniques.map(technique => `• **${technique}**: Key component for ${title.toLowerCase()} success`).join('\n')}`
  }

  // Add missing safety section
  if (!hasSafety) {
    const safetyPoints = sportContext.safetyConsiderations.slice(0, 4)
    enhancedContent += `\n\n## Safety Considerations\n\n${safetyPoints.map(safety => `• ${safety}`).join('\n')}`
  }

  // Add missing expert insights
  if (!hasExpertTips) {
    const expertTips = sportContext.expertTips.slice(0, 3)
    enhancedContent += `\n\n## Expert Insights\n\n${expertTips.map(tip => `• ${tip}`).join('\n')}`
  }

  // Add missing common mistakes section
  if (!hasCommonMistakes) {
    const commonMistakes = sportContext.commonMistakes.slice(0, 3)
    enhancedContent += `\n\n## Common Mistakes to Avoid\n\n${commonMistakes.map(mistake => `• ${mistake}`).join('\n')}`
  }

  // Add training progression if missing
  if (!existingContent.toLowerCase().includes('progression') && !existingContent.toLowerCase().includes('training')) {
    enhancedContent += `\n\n## Training Progression\n\n### ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Level Focus\n\n1. **Foundation Building**: Master basic movements and positions\n2. **Skill Development**: Build technical proficiency through repetition\n3. **Application Practice**: Apply skills in realistic scenarios\n4. **Performance Refinement**: Polish technique and timing`
  }

  return enhancedContent
}

/**
 * Generate dynamic enhancement prompt for AI-powered content improvement
 */
export function generateEnhancementPrompt(
  existingContent: string,
  title: string,
  sport: string,
  skillLevel: string = 'intermediate'
): string {
  const titleAnalysis = analyzeLessonTitle(title, sport)

  return `You are an expert ${sport} coach. Enhance and improve the following lesson content for "${title}" at the ${skillLevel} level.

EXISTING CONTENT:
${existingContent}

ENHANCEMENT REQUIREMENTS:
1. **Preserve all existing content** - Do not remove anything
2. **Add detailed explanations** where content seems brief or unclear
3. **Improve structure and formatting** with proper headers and bullet points
4. **Add missing technical details** specific to "${title}"
5. **Include progressive skill development** appropriate for ${skillLevel} level
6. **Enhance safety information** relevant to ${sport}
7. **Add practical application examples** and training scenarios

FOCUS AREAS TO ENHANCE:
- Key Skills: ${titleAnalysis.keySkills.join(', ')}
- Specific Techniques: ${titleAnalysis.techniques.join(', ')}
- Training Type: ${titleAnalysis.trainingType}

FORMATTING REQUIREMENTS:
- Use proper markdown headers (##, ###)
- Add blank lines between sections
- Use bullet points (•) for lists
- Bold important terms with **text**
- Keep professional, coaching tone

Make the content more comprehensive, detailed, and actionable while maintaining everything that's already there.`
}

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