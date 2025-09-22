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
  return `# ${title}

## Lesson Overview
Welcome to this systematic Brazilian Jiu-Jitsu lesson on "${title}". As ${coachingContext.coachName}, I'll guide you through ${titleAnalysis.primaryFocus.toLowerCase()} using proven IBJJF competition methodologies. This ${titleAnalysis.trainingType.toLowerCase()} is designed for ${skillLevel} practitioners committed to technical excellence.

**This session will develop:**
${titleAnalysis.keySkills.map((skill: string) => `• **${skill}**: Essential for BJJ mastery`).join('\n')}

## Technical Breakdown: The Science of BJJ

**Fundamental Principles:**
• **Position Before Submission**: Always secure dominant position before attacking
• **Leverage Over Strength**: Use proper body mechanics and angles efficiently
• **Base and Posture**: Maintain structural integrity in all positions
• **Systematic Approach**: Connect techniques in logical chains and sequences

**Core BJJ Concepts:**
• **Hip Movement**: Master shrimping, bridging, and hip escapes for all situations
• **Pressure and Weight Distribution**: Apply effective pressure while maintaining mobility
• **Timing and Patience**: Recognize optimal moments for transitions and attacks
• **Problem Solving**: Develop systematic solutions for defensive situations

## Key Fundamentals for ${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} Practitioners

• **Technical Precision**: Perfect execution beats strength and athleticism
• **Conceptual Understanding**: Learn the why behind every movement
• **Systematic Development**: Build skills on solid foundational principles
• **Mental Chess**: Think multiple moves ahead during live training
• **Consistent Training**: Small daily improvements compound over time

## Practice Methodology: Proven Training Structure

1. **Solo Movement**: Hip escapes, bridges, technical stand-ups (10 minutes)
2. **Static Drilling**: Position work with progressive resistance (15 minutes)
3. **Flow Rolling**: Light resistance to develop timing and transitions (10 minutes)
4. **Positional Sparring**: Start from specific positions, work problems (15 minutes)
5. **Submission Chains**: Connect related attacks with smooth transitions (10 minutes)
6. **Live Training**: Full resistance rolling with specific goals (15 minutes)

## Competition Application: Testing Under Pressure

**Pre-Competition Preparation:**
• Develop specific game plans for different opponent types
• Practice competition rules and scoring scenarios
• Build mental toughness through pressure training

**During Live Training:**
• Start exchanges from positions relevant to your game
• Practice escaping bad positions with composure
• Develop signature techniques that work under pressure

**Mental Approach:**
• Stay calm under pressure and stick to systematic approach
• Use opponent's reactions to set up subsequent techniques
• Maintain breathing control during intense exchanges

## Common Mistakes & Technical Corrections

• **Mistake**: Using strength instead of technique → **Correction**: Focus on leverage and proper angles
• **Mistake**: Rushing submissions from poor positions → **Correction**: Secure position first, then attack
• **Mistake**: Poor hip movement and escapes → **Correction**: Daily solo movement practice
• **Mistake**: Holding breath during rolling → **Correction**: Conscious breathing practice

## Progression Tips: Path to Black Belt Excellence

• **Master Fundamental Positions**: Mount, guard, side control, back control
• **Develop Systematic Game**: Connect techniques that work together
• **Study High-Level Competition**: Analyze IBJJF world championship footage
• **Train Consistently**: Regular training beats sporadic intense sessions
• **Keep Training Journal**: Document techniques and insights for review

## Safety Considerations: Injury Prevention

${sportContext.safetyConsiderations.slice(0, 4).map((safety: string) => `• ${safety}`).join('\n')}

## Black Belt Insights: Championship Secrets

**From Elite Competition:**
${sportContext.expertTips.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Remember**: ${coachingContext.voiceCharacteristics.catchphrases[0]}

*This lesson represents the methodical approach that develops world-class Brazilian Jiu-Jitsu practitioners. Technique conquers strength, patience creates opportunity.*`
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