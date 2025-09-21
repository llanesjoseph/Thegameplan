import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

// Initialize the Gemini AI client
const getGeminiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  console.log('🔑 Gemini API Key check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.trim() === '') {
    console.error('❌ Gemini API key is missing or invalid')
    return null
  }
  return new GoogleGenerativeAI(apiKey)
}

// Initialize the OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  console.log('🔑 OpenAI API Key check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE' || apiKey.trim() === '') {
    console.error('❌ OpenAI API key is missing or invalid')
    return null
  }
  return new OpenAI({ apiKey })
}

// Vertex AI via Firebase Function (browser-compatible)
const callVertexAIAPI = async (question: string): Promise<string> => {
  const response = await fetch('https://us-central1-gameplan-787a2.cloudfunctions.net/aiCoaching', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'API call failed')
  }

  return data.response
}

export interface CoachingContext {
  sport: string
  coachName: string
  coachCredentials: string[]
  expertise: string[]
  personalityTraits: string[]
  voiceCharacteristics: {
    tone: string
    pace: string
    emphasis: string[]
    catchphrases: string[]
    speakingStyle: string
  }
  responseStyle: {
    greeting: string
    encouragement: string[]
    signatureClosing: string
    personalStoryIntros: string[]
  }
}

export const soccerCoachingContext: CoachingContext = {
  sport: 'Soccer',
  coachName: 'Jasmine Aikey',
  coachCredentials: [
    'College Cup Champion',
    'Pac-12 Midfielder of the Year',
    'All-America First Team',
    'Academic All-American',
    'Team Captain at Stanford University'
  ],
  expertise: [
    'Midfield play and positioning',
    'Vision and passing under pressure',
    'Set piece execution',
    'Tactical awareness and game reading',
    'Leadership and team communication',
    'Mental preparation and confidence building'
  ],
  personalityTraits: [
    'Encouraging and supportive',
    'Detail-oriented with technical advice',
    'Emphasizes fundamentals and consistency',
    'Draws from personal championship experience',
    'Focuses on both mental and physical aspects'
  ],
  voiceCharacteristics: {
    tone: 'Warm, confident, and encouraging with subtle intensity',
    pace: 'Measured and thoughtful, with emphasis on key points',
    emphasis: ['technique', 'consistency', 'championship mindset', 'trust your preparation'],
    catchphrases: [
      'Trust your preparation',
      'Champions are made in practice, revealed in games',
      'See it, feel it, play it',
      'Consistency beats perfection'
    ],
    speakingStyle: 'Direct but nurturing, uses personal anecdotes from championship experience'
  },
  responseStyle: {
    greeting: 'Great question!',
    encouragement: [
      'You\'ve got this!',
      'Trust your instincts',
      'Keep working - improvement is coming',
      'That\'s exactly the right mindset'
    ],
    signatureClosing: 'Keep pushing yourself - I believe in your potential!',
    personalStoryIntros: [
      'From my championship experience at Stanford...',
      'When I was playing at the highest level...',
      'During our College Cup run...',
      'As team captain, I learned that...'
    ]
  }
}

export const bjjCoachingContext: CoachingContext = {
  sport: 'Brazilian Jiu-Jitsu',
  coachName: 'Joseph Llanes',
  coachCredentials: [
    'IBJJF World Champion',
    '3rd Degree Black Belt',
    'Performance Training Specialist',
    'Elite Competitor',
    'Certified Instructor'
  ],
  expertise: [
    'Guard systems and retention',
    'Submission chains and setups',
    'Positional control and transitions',
    'Competition strategy and game planning',
    'Mental preparation for competition',
    'Performance training and conditioning'
  ],
  personalityTraits: [
    'Methodical and technical',
    'Emphasizes conceptual understanding',
    'Draws from competition experience',
    'Focuses on systematic development',
    'Patient and detail-oriented'
  ],
  voiceCharacteristics: {
    tone: 'Calm, methodical, and deeply analytical',
    pace: 'Deliberate and precise, pausing for emphasis',
    emphasis: ['technique over strength', 'systematic development', 'conceptual understanding'],
    catchphrases: [
      'Technique over strength',
      'Position before submission',
      'Train your mind like your body',
      'Small daily improvements'
    ],
    speakingStyle: 'Analytical and systematic, breaks down complex concepts into simple parts'
  },
  responseStyle: {
    greeting: 'Excellent question!',
    encouragement: [
      'Keep developing systematically',
      'Trust the process',
      'That\'s the right approach',
      'You\'re thinking like a champion'
    ],
    signatureClosing: 'Remember - it\'s not about being the strongest, it\'s about being the most technical!',
    personalStoryIntros: [
      'In my world championship match...',
      'From my competition experience...',
      'As a world champion, I learned...',
      'During my championship run...'
    ]
  }
}

// Content Creation Assistant Context
export const contentCreationContext: CoachingContext = {
  sport: 'Content Creation',
  coachName: 'Creative AI Assistant',
  coachCredentials: [
    'Expert Content Strategist',
    'Sports Media Specialist',
    'Educational Content Designer',
    'Video Production Expert'
  ],
  expertise: [
    'Sports content strategy and planning',
    'Video script writing and structure',
    'Engaging lesson design',
    'Content optimization for different audiences',
    'Educational flow and pacing',
    'Interactive content creation'
  ],
  personalityTraits: [
    'Creative and innovative',
    'Detail-oriented with clear structure',
    'Focuses on audience engagement',
    'Emphasizes educational value',
    'Supportive and encouraging'
  ],
  voiceCharacteristics: {
    tone: 'Energetic and creative',
    pace: 'Dynamic with creative flair',
    emphasis: ['engagement', 'storytelling', 'educational value'],
    catchphrases: ['Let\'s create something amazing', 'Story first, technique second'],
    speakingStyle: 'Creative and inspiring with focus on audience connection'
  },
  responseStyle: {
    greeting: 'What a fantastic creative challenge!',
    encouragement: ['Your creativity is showing!', 'That\'s a brilliant approach'],
    signatureClosing: 'Now go create something amazing!',
    personalStoryIntros: ['In my content creation experience...']
  }
}

// Platform Assistant Context
export const platformAssistantContext: CoachingContext = {
  sport: 'Platform Navigation',
  coachName: 'Platform Assistant',
  coachCredentials: [
    'Platform Expert',
    'User Experience Specialist',
    'Technical Support Expert',
    'Training Platform Consultant'
  ],
  expertise: [
    'Platform navigation and features',
    'Account management and settings',
    'Content organization and discovery',
    'Technical troubleshooting',
    'Best practices for platform use',
    'Feature recommendations and tips'
  ],
  personalityTraits: [
    'Helpful and patient',
    'Clear and concise explanations',
    'Problem-solving focused',
    'User-friendly approach',
    'Comprehensive and thorough'
  ],
  voiceCharacteristics: {
    tone: 'Helpful and professional',
    pace: 'Clear and measured',
    emphasis: ['step-by-step', 'user-friendly', 'efficient'],
    catchphrases: ['Let me walk you through this', 'Here\'s the best way to...'],
    speakingStyle: 'Clear instructions with friendly guidance'
  },
  responseStyle: {
    greeting: 'Happy to help with that!',
    encouragement: ['You\'re getting the hang of it!', 'Perfect, you\'ve got it!'],
    signatureClosing: 'Feel free to reach out if you need any other help!',
    personalStoryIntros: ['From helping other users...', 'A common question I get...']
  }
}

// Creator-specific context registry (primary mapping)
export const creatorContextRegistry: Record<string, CoachingContext> = {
  'jasmine-aikey': soccerCoachingContext,
  'joseph-llanes': bjjCoachingContext,
  // Add more creators as they're added to the platform
}

// Multi-sport registry for scalable support (fallback mapping)
export const sportContextRegistry: Record<string, CoachingContext> = {
  soccer: soccerCoachingContext,
  football: soccerCoachingContext, // placeholder until a specific football context exists
  bjj: bjjCoachingContext,
  'brazilian jiu-jitsu': bjjCoachingContext,
  grappling: bjjCoachingContext,
  content: contentCreationContext,
  platform: platformAssistantContext,
}

// Get context by creator ID (primary method)
export function getCoachingContextByCreator(creatorId?: string): CoachingContext {
  if (!creatorId) return soccerCoachingContext
  const key = creatorId.toLowerCase().trim()
  return creatorContextRegistry[key] || soccerCoachingContext
}

// Get context by sport (fallback method)
export function getCoachingContextBySport(sport?: string): CoachingContext {
  if (!sport) return soccerCoachingContext
  const key = sport.toLowerCase().trim()
  return sportContextRegistry[key] || soccerCoachingContext
}

// Smart context resolver - tries creator first, then sport
export function getCoachingContext(creatorId?: string, sport?: string): CoachingContext {
  // Priority 1: Try to get context by creator ID
  if (creatorId) {
    const creatorContext = creatorContextRegistry[creatorId.toLowerCase().trim()]
    if (creatorContext) {
      return creatorContext
    }
  }

  // Priority 2: Fall back to sport-based context
  if (sport) {
    return getCoachingContextBySport(sport)
  }

  // Default: Return Jasmine's context
  return soccerCoachingContext
}

export const generateCoachingPrompt = (question: string, context: CoachingContext): string => {
  // Random elements for variety but keep them minimal
  const randomCatchphrase = context.voiceCharacteristics.catchphrases[Math.floor(Math.random() * context.voiceCharacteristics.catchphrases.length)]

  return `You are ${context.coachName}, an elite ${context.sport.toLowerCase()} coach. You must answer this question with specific, technical soccer advice.

**QUESTION:** "${question}"

**CRITICAL INSTRUCTIONS:**
- FOCUS ONLY on the specific skill/technique asked about
- Give concrete, actionable soccer advice
- Include technical details specific to soccer
- Voice: ${context.voiceCharacteristics.tone}
- Draw from your expertise: ${context.expertise.join(', ')}

**REQUIRED RESPONSE STRUCTURE:**
1. **Technical Breakdown**: Explain the specific soccer technique/skill being asked about
2. **Key Fundamentals**: 3-4 core technical points (use **bold** for emphasis)
3. **Practice Drills**: 2-3 specific soccer exercises they can do immediately
4. **Game Application**: How to apply this in match situations
5. **Pro Tip**: One advanced insight from your playing experience

**SOCCER-SPECIFIC REQUIREMENTS:**
- Use proper soccer terminology (e.g., "scanning", "check runs", "switch play", "press resistant")
- Reference field positions, timing, and spatial awareness
- Include physical and mental aspects of the technique
- Make it actionable for immediate practice

**FORMATTING:**
- Use **bold** for key soccer concepts
- Use bullet points (-) for drill steps
- Use numbered lists (1.) for sequences
- Keep paragraphs short and focused
- Include your catchphrase "${randomCatchphrase}" naturally if it fits

Write 200-300 words. Be direct, technical, and soccer-focused. Every sentence should relate to the specific question asked.`
}

// Vertex AI Response (Enterprise-grade) - Browser compatible via API route
export const getVertexAIResponse = async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
  console.log('🔸 Starting Vertex AI request via API route...')
  try {
    const response = await callVertexAIAPI(question)
    console.log('✅ Vertex AI API response received')
    return response
  } catch (error) {
    console.error('❌ Vertex AI API error:', error)
    throw error
  }
}

// Gemini AI Response (Direct API)
export const getGeminiAIResponse = async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
  console.log('🤖 Starting Gemini AI request...')
  const client = getGeminiClient()
  
  if (!client) {
    console.error('❌ Gemini client not initialized - API key issue')
    throw new Error('Gemini API not configured - check your API key')
  }

  try {
    console.log('🔧 Creating Gemini model...')
    const model = client.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    })
    const prompt = generateCoachingPrompt(question, context)
    console.log('📝 Generating content with prompt length:', prompt.length)
    
    const result = await model.generateContent(prompt)
    console.log('✅ Got result from Gemini')
    const response = await result.response
    const text = response.text()
    
    if (!text || text.trim().length === 0) {
      console.error('❌ Empty response from Gemini')
      throw new Error('Empty response from Gemini')
    }
    
    console.log('✅ Gemini response length:', text.trim().length)
    return text.trim()
  } catch (error) {
    console.error('❌ Gemini API error details:', error)
    throw error
  }
}

// OpenAI Response (GPT-4)
export const getOpenAIResponse = async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
  console.log('🤖 Starting OpenAI request...')
  const client = getOpenAIClient()
  
  if (!client) {
    console.error('❌ OpenAI client not initialized - API key issue')
    throw new Error('OpenAI API not configured - check your API key')
  }

  try {
    console.log('🔧 Creating OpenAI completion...')
    const prompt = generateCoachingPrompt(question, context)
    console.log('📝 Generating content with prompt length:', prompt.length)
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are ${context.coachName}, an elite ${context.sport.toLowerCase()} coach and former player. Respond authentically in character with encouraging, technical advice.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9
    })
    
    console.log('✅ Got result from OpenAI')
    const text = completion.choices[0]?.message?.content
    
    if (!text || text.trim().length === 0) {
      console.error('❌ Empty response from OpenAI')
      throw new Error('Empty response from OpenAI')
    }
    
    console.log('✅ OpenAI response length:', text.trim().length)
    return text.trim()
  } catch (error) {
    console.error('❌ OpenAI API error details:', error)
    throw error
  }
}

// Legacy function for backward compatibility
export const getAIResponse = getGeminiAIResponse

// Smart AI-like coaching responses (when APIs are unavailable)
export const getIntelligentFallbackResponse = (question: string, context: CoachingContext): string => {
  const lowerQuestion = question.toLowerCase()
  
  // BJJ-specific responses for Joseph Llanes
  if (context.sport === 'Brazilian Jiu-Jitsu') {
    // Guard retention and pressure responses
    if (lowerQuestion.includes('guard') || lowerQuestion.includes('retention') || lowerQuestion.includes('pressure')) {
      return `Excellent question about guard retention! As an IBJJF World Champion, this was fundamental to my game.

**Core principles:**
• **Frame management** - Use your frames to create distance and prevent pressure
• **Hip movement** - Constant hip escape and repositioning is key
• **Grip fighting** - Control their grips before they control yours
• **Angle creation** - Never stay square, always work to angles

**Training drill:** Practice the "shrimp escape" 100 times daily. Master this movement and you'll never be stuck under pressure.

**Competition mindset:** In my championship matches, I treated guard retention like a chess game - think 2-3 moves ahead. When they press, I'm already planning my escape route.

Remember, a good guard is proactive, not reactive. Stay calm under pressure and trust your technique!`
    }
    
    // Submission chains
    if (lowerQuestion.includes('submission') || lowerQuestion.includes('finish') || lowerQuestion.includes('chain')) {
      return `Great question about submission chains! This was a game-changer in my competition career.

**Chain concepts:**
• **Always have a backup** - If the armbar fails, the triangle should be right there
• **Use their reactions** - When they defend the choke, attack the arm
• **Control the position first** - Secure your position before hunting submissions
• **Flow over force** - Smooth transitions beat muscling through defenses

**My favorite chain:** Collar choke → armbar → triangle → back to choke. Practice this sequence until it's automatic.

**Championship insight:** In my world championship match, I hit 7 different submission attempts in one sequence. The finish came because I never stopped flowing between threats.

**Training tip:** Practice submission chains slowly first. Speed comes naturally once the pathways are memorized.

Submissions are about timing and opportunity, not strength!`
    }
    
    // Position and transitions
    if (lowerQuestion.includes('position') || lowerQuestion.includes('transition') || lowerQuestion.includes('pass') || lowerQuestion.includes('sweep')) {
      return `Perfect timing for this question! Positional control was the foundation of my championship game.

**Position hierarchy:**
1. **Mount/Back control** - Highest control positions
2. **Side control/Knee on belly** - Strong control positions  
3. **Half guard/Closed guard** - Neutral positions
4. **Open guard variations** - Active positions

**Transition principles:**
• **Weight distribution** - Control their center of gravity
• **Base and posture** - Maintain yours while breaking theirs
• **Timing** - Move when they're off-balance or distracted
• **Connection points** - Always have 2-3 points of contact

**Competition strategy:** I always fought to improve position before attempting submissions. Position before submission was my motto.

**Training focus:** Spend 70% of your time on positions, 30% on submissions. Master the positions and the submissions will come naturally.

Remember: it's not about being the strongest, it's about being the most technical!`
    }
    
    // Mental game and competition
    if (lowerQuestion.includes('mental') || lowerQuestion.includes('competition') || lowerQuestion.includes('nerves') || lowerQuestion.includes('strategy')) {
      return `Excellent question about the mental game! This was crucial for my world championship run.

**Pre-competition preparation:**
• **Visualization** - I'd mentally rehearse my entire match strategy
• **Breathing techniques** - Controlled breathing to manage nerves
• **Game planning** - Study opponent tendencies and prepare counters
• **Positive self-talk** - Replace doubt with confidence

**During the match:**
1. **Stay present** - Focus on the current position, not the score
2. **Trust your training** - Your body knows what to do
3. **Adapt constantly** - Be ready to change your game plan
4. **Control the pace** - Dictate the rhythm of the match

**Championship mindset:** In my world championship match, I focused on one position at a time. The title was just the result of executing countless small techniques perfectly.

**Training for competition:** Simulate competition pressure in training. Train tired, train with distractions, train when you don't want to.

Mental strength is like physical strength - it requires consistent training!`
    }
    
    // Default BJJ response
    return `Thanks for your question! As an IBJJF World Champion and 3rd degree black belt, I've learned that Brazilian Jiu-Jitsu success comes from systematic development.

**My coaching philosophy:**
• **Technical precision** - Perfect technique beats strength every time
• **Conceptual understanding** - Learn the why, not just the how
• **Systematic approach** - Build your game from solid foundations
• **Competition testing** - Test your skills under pressure

**Key development areas:**
1. **Positional control** - Master the fundamentals first
2. **Submission chains** - Learn to flow between attacks
3. **Guard systems** - Develop both offensive and defensive guards
4. **Mental preparation** - Train your mind like your body

**Championship insight:** My world championship came from years of methodical development. Focus on small daily improvements rather than dramatic changes.

What specific aspect of your BJJ game would you like to work on? I'm here to help you develop systematically!`
  }
  
  // Soccer-specific responses for Jasmine (existing code)

  // Reading passes and vision - improved keyword matching
  if (lowerQuestion.includes('reading') || lowerQuestion.includes('read') ||
      lowerQuestion.includes('anticipat') || lowerQuestion.includes('vision') ||
      lowerQuestion.includes('scanning') || lowerQuestion.includes('see the field') ||
      (lowerQuestion.includes('pass') && (lowerQuestion.includes('better') || lowerQuestion.includes('improve'))) ||
      lowerQuestion.includes('awareness')) {
    return `Excellent question about reading passes! This was fundamental to my midfield success at Stanford.

**Technical breakdown:**
**Scanning** is everything - You need to know what's around you before the ball comes. I'd scan 5-6 times during each possession cycle.

**Key fundamentals:**
• **Check your shoulders** - Quick glances left and right every 2-3 seconds
• **Body positioning** - Receive on your back foot to see maximum field area
• **Peripheral vision** - Train your eyes to catch movement without turning head
• **Pattern recognition** - Learn common passing sequences and player tendencies

**Practice drills:**
1. **360° drill** - Receive pass, call out how many teammates you can see before controlling
2. **Color cone drill** - Set up different colored cones, call out colors while receiving passes
3. **Mirror passing** - Partner stands behind you calling out directions during passing practice

**Game application:**
During matches, I'd position myself to see both the ball carrier and potential targets. The key is anticipating where the pass is going 1-2 seconds before it's played.

**Pro tip:** Watch the passer's hips and plant foot, not their eyes. Eyes lie, but body mechanics don't. The plant foot always points toward the target area.

**Trust your preparation** - the more you practice scanning, the more automatic it becomes in pressure situations!`
  }

  // Passing and accuracy responses
  if (lowerQuestion.includes('passing') || lowerQuestion.includes('accuracy')) {
    return `Passing accuracy comes down to fundamentals and consistent practice.

**Key technique points:**
• **Plant foot positioning** - 6-8 inches beside the ball, pointed toward target
• **Inside foot contact** - Ankle locked, low follow through
• **Vision training** - Look up before receiving, scan constantly

**Practice drill:** Set up cones 15 yards apart. Hit 50 passes daily focusing on cone accuracy. Start stationary, add movement.

**Mental game:** Trust your first instinct. Hesitation kills accuracy. See it, feel it, play it.

Even pros only hit 85% of passes. Consistency beats perfection!`
  }
  
  // Shooting and finishing
  if (lowerQuestion.includes('shooting') || lowerQuestion.includes('finish') || lowerQuestion.includes('goal')) {
    return `Finishing is technique plus mindset. Both matter equally.

**Technical basics:**
• **First touch** - Control into space, away from defenders
• **Body positioning** - Open to goal, stay balanced
• **Shot selection** - Pick your spot, don't just blast it

**Practice routine:**
Set up scenarios from different angles. 20 shots daily from box left, center, right. Placement over power.

**Mental game:** Visualize the ball in the net before you even receive the pass. Confidence is everything.

**Key insight:** Stop trying to place every shot perfectly. Focus on good technique with conviction. Trust your preparation!`
  }
  
  // Dribbling and 1v1 situations
  if (lowerQuestion.includes('dribbl') || lowerQuestion.includes('1v1') || lowerQuestion.includes('beat') || lowerQuestion.includes('defender')) {
    return `Perfect timing for this question! During my championship run at Stanford, 1v1 situations were game-changers.

**Core principles:**
• **Change of pace** - Approach at moderate speed, then explode past the defender
• **Body feints** - Sell the fake with your entire body, not just your feet
• **Close control** - Keep the ball within playing distance (1-2 feet max)

**My go-to moves:**
1. **Step-over + cut** - Simple but deadly when timed right
2. **Inside-outside** - Quick touch inside, then push outside with same foot
3. **Stop-and-go** - Slow down to make defender commit, then accelerate

**Mental preparation:** I always studied defenders in warm-ups. Are they right-footed? Do they dive in or stay patient? Use this intel.

**Training tip:** Practice with tennis balls to improve your first touch and close control. If you can dribble a tennis ball smoothly, a soccer ball will feel massive!

Confidence comes from repetition. Master 2-3 moves perfectly rather than knowing 10 poorly.`
  }
  
  // Position-specific advice
  if (lowerQuestion.includes('midfield') || lowerQuestion.includes('center') || lowerQuestion.includes('position')) {
    return `Ah, midfield questions - my specialty! As a Pac-12 Midfielder of the Year and team captain, I lived and breathed the center of the field.

**Key responsibilities:**
• **Be the link** - Connect defense to attack seamlessly
• **Constant communication** - You see the whole field, use your voice
• **Box-to-box presence** - Defend when needed, attack when the moment's right

**Positioning secrets:**
Always maintain triangles with your teammates. Never be directly behind or in front of another midfielder. Create passing angles constantly.

**Game management:** In tight games, I focused on:
1. Tempo control - Speed up when we needed momentum, slow down to manage leads
2. Pressing triggers - Coordinate when the team presses together
3. Transition moments - Win the ball back immediately after losing it

**Championship insight:** The best midfielders aren't always the most skilled - they're the smartest. Read the game, anticipate what happens next, and always have your head up.

Your fitness will be tested more than any other position. Embrace it - that's your competitive advantage!`
  }
  
  // Default comprehensive response
  return `Great question! Let me give you a focused approach to improvement.

**Key fundamentals:**
- **Master the basics first** - Build from solid foundations
- **Practice with purpose** - Every touch should have intention
- **Mental preparation** - Visualize before you play

**Training approach:**
1. **Consistency over perfection** - 100 decent reps beat 10 perfect ones
2. **Game-like pressure** - Add time constraints to drills
3. **Video study** - Watch yourself and pros in similar situations

**Mindset:** Focus on process over outcome. Trust your preparation and stay confident in pressure moments.

**Next step:** Break this down into specific skills and create a structured practice plan. Champions are made in practice, revealed in games.

What specific aspect would you like me to dive deeper into?`
}

// Alternative AI providers (for redundancy)
export const alternativeAIProviders = {
  // Smart fallback system when APIs are unavailable
  fallback: async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
    // Simulate thinking time like a real AI
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    return getIntelligentFallbackResponse(question, context)
  },
  
  openai: async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
    return getOpenAIResponse(question, context)
  },
  
  claude: async (question: string): Promise<string> => {
    // Placeholder for Anthropic Claude integration
    throw new Error('Claude not implemented yet')
  }
}

// Robust AI service with fallback chain: Vertex AI → OpenAI → Gemini → Intelligent Fallback  
export const getRobustAIResponse = async (question: string, context: CoachingContext = soccerCoachingContext): Promise<{ response: string, provider: 'vertex' | 'openai' | 'gemini' | 'fallback' }> => {
  console.log('🚀 Starting robust AI request with fallback chain')
  const providers = [
    { name: 'vertex' as const, fn: () => getVertexAIResponse(question, context) },
    { name: 'openai' as const, fn: () => getOpenAIResponse(question, context) },
    { name: 'gemini' as const, fn: () => getGeminiAIResponse(question, context) },
    { name: 'fallback' as const, fn: () => alternativeAIProviders.fallback(question, context) },
  ]
  
  for (const { name, fn } of providers) {
    try {
      console.log(`🔄 Trying ${name} AI provider...`)
      const response = await fn()
      console.log(`✅ ${name} AI provider succeeded`)
      return { response, provider: name }
    } catch (error) {
      console.warn(`❌ ${name} AI provider failed, trying next...`, error)
    }
  }
  
  // This should never happen now that we have intelligent fallback
  throw new Error('All AI providers failed including fallback')
}

// Legacy function for backward compatibility
export const getRobustAIResponseLegacy = async (question: string, context: CoachingContext = soccerCoachingContext): Promise<string> => {
  const result = await getRobustAIResponse(question, context)
  return result.response
}