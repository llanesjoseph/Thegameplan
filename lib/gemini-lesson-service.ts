// Robust Gemini API-based lesson generation with structured prompts and JSON schemas
import { EnhancedAILessonPrompts, EnhancedLessonConfig } from './enhanced-ai-lesson-prompts'

export interface LessonPlanStructure {
  title: string
  objective: string
  duration: string
  sport: string
  level: string
  parts: LessonPart[]
}

export interface LessonPart {
  partTitle: string
  description: string
  duration: string
  sections: LessonSection[]
}

export interface LessonSection {
  sectionTitle: string
  content: ContentBlock[]
}

export interface ContentBlock {
  type: 'paragraph' | 'list_item' | 'heading' | 'exercise' | 'safety_note' | 'technique_step' | 'coaching_cue' | 'common_mistake'
  text: string
  level?: number // for headings (1-4)
  duration?: string // for exercises and technique steps
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export class GeminiLessonService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

  /**
   * Generate ultra-detailed masterclass lesson using enhanced AI prompts
   */
  static async generateMasterclassLesson(
    topic: string,
    sport: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    duration: string = '45 minutes',
    detailedInstructions?: string,
    config?: EnhancedLessonConfig
  ): Promise<LessonPlanStructure> {
    const enhancedConfig = config || EnhancedAILessonPrompts.getDefaultEnhancedConfig()

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables')
    }

    const systemInstruction = EnhancedAILessonPrompts.createMasterCoachSystemInstruction(sport, level, enhancedConfig)
    const userPrompt = EnhancedAILessonPrompts.createComprehensiveLessonPrompt(
      topic, sport, level, duration, detailedInstructions || '', enhancedConfig
    )
    const responseSchema = EnhancedAILessonPrompts.createEnhancedResponseSchema(enhancedConfig)

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{
          text: systemInstruction
        }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, // Higher for more creative and comprehensive content
        maxOutputTokens: 10000, // Maximum possible for ultra-comprehensive content
        topP: 0.98, // Higher for more diverse content
        topK: 64 // Higher for more vocabulary diversity
      }
    }

    try {
      console.log('🔄 Making API request to Gemini with payload size:', JSON.stringify(payload).length, 'characters')
      console.log('🔑 API Key present:', !!apiKey)
      console.log('📊 Request config:', {
        maxOutputTokens: payload.generationConfig.maxOutputTokens,
        temperature: payload.generationConfig.temperature,
        responseType: payload.generationConfig.responseMimeType
      })

      const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('📡 API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Gemini API error response:', errorText)
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('📋 API Response structure:', {
        hasCandidates: !!result.candidates,
        candidatesLength: result.candidates?.length || 0,
        hasContent: !!(result.candidates?.[0]?.content),
        hasTextParts: !!(result.candidates?.[0]?.content?.parts?.[0]?.text)
      })

      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        console.error('❌ Invalid API response structure:', result)
        throw new Error('Invalid response from Gemini API - missing expected data structure')
      }

      const rawText = result.candidates[0].content.parts[0].text
      console.log('📝 Raw response text length:', rawText.length)

      try {
        const lessonPlan = JSON.parse(rawText)
        console.log('✅ Successfully parsed JSON response')
        return lessonPlan as LessonPlanStructure
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError)
        console.error('📄 Raw response text (first 500 chars):', rawText.substring(0, 500))
        throw new Error(`Failed to parse API response as JSON: ${parseError}`)
      }

    } catch (error) {
      console.error('❌ Complete error in generateMasterclassLesson:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      throw new Error(`Failed to generate masterclass lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate expert-level lesson with comprehensive detail
   */
  static async generateExpertLesson(
    topic: string,
    sport: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    duration: string = '45 minutes',
    detailedInstructions?: string
  ): Promise<LessonPlanStructure> {
    return this.generateMasterclassLesson(
      topic, sport, level, duration, detailedInstructions,
      EnhancedAILessonPrompts.getExpertLevelConfig()
    )
  }

  /**
   * Generate comprehensive lesson with good detail
   */
  static async generateComprehensiveLesson(
    topic: string,
    sport: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    duration: string = '45 minutes',
    detailedInstructions?: string
  ): Promise<LessonPlanStructure> {
    return this.generateMasterclassLesson(
      topic, sport, level, duration, detailedInstructions,
      EnhancedAILessonPrompts.getComprehensiveConfig()
    )
  }

  /**
   * Generate comprehensive lesson plan using Gemini API with structured prompts
   */
  static async generateLessonPlan(
    topic: string,
    sport: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    duration: string = '45 minutes',
    detailedInstructions?: string
  ): Promise<LessonPlanStructure> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables')
    }

    const systemInstruction = this.createSystemInstruction(sport, level)
    const responseSchema = this.createResponseSchema()

    let userPrompt = `Create a detailed lesson plan for: ${topic} - ${sport} - ${level} level - ${duration} duration`

    if (detailedInstructions) {
      userPrompt += `\n\nDETAILED TECHNIQUE INSTRUCTIONS PROVIDED BY THE INSTRUCTOR:\n${detailedInstructions}\n\nUse these detailed instructions as the foundation for the lesson plan. Include all the specific technical details, steps, variations, and coaching points provided. Do not use generic content - build the lesson around these specific instructions.`
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{
          text: systemInstruction
        }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
        maxOutputTokens: 4000
      }
    }

    try {
      const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid response from Gemini API')
      }

      const lessonPlan = JSON.parse(result.candidates[0].content.parts[0].text)
      return lessonPlan as LessonPlanStructure

    } catch (error) {
      console.error('Error generating lesson plan with Gemini:', error)
      throw new Error(`Failed to generate lesson plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create detailed system instruction for the AI coach persona
   */
  private static createSystemInstruction(sport: string, level: string): string {
    return `You are an elite-level professional ${sport} coach with 20+ years of experience training world champions, Olympic athletes, and competitors at the highest levels. You have authored multiple technical manuals, coached national teams, and are recognized as one of the foremost authorities in ${sport} instruction and methodology.

Your task is to create an exceptionally detailed, comprehensive lesson plan for ${level}-level ${sport} athletes that rivals the quality of content found in professional coaching certifications and elite training programs.

MANDATORY REQUIREMENTS FOR ELITE-LEVEL CONTENT:

1. LESSON STRUCTURE (4 parts with extensive detail):
   - "Warm-Up & Introduction" (8-10 minutes): Include specific movement patterns, injury prevention protocols, mental preparation
   - "Technical Instruction & Demonstration" (18-25 minutes): Detailed biomechanical breakdowns, multiple variations, troubleshooting
   - "Progressive Practice & Drilling" (15-20 minutes): Structured skill progression, partner drills, resistance training
   - "Live Application & Cool-Down" (5-8 minutes): Competition scenarios, recovery protocols, session review

2. TECHNICAL DEPTH REQUIREMENTS:
   - Provide step-by-step biomechanical analysis
   - Include specific grip positions, body angles, and timing sequences
   - Detail multiple variations and adaptations
   - Explain the "why" behind each technique element
   - Include troubleshooting for 3-5 common execution errors
   - Provide specific coaching cues for each major technique component

3. PROGRESSIVE SKILL DEVELOPMENT:
   - Break complex techniques into 4-6 progressive steps
   - Include prerequisite skills and mobility requirements
   - Provide specific drilling sequences with rep counts and time intervals
   - Detail partner cooperation levels (passive, active, resistant)
   - Include assessment criteria for advancement

4. SPORT-SPECIFIC EXPERTISE FOR ${sport}:
   - Use precise technical terminology
   - Reference competition rules and scoring implications
   - Include equipment specifications and setup requirements
   - Detail safety protocols and injury prevention measures
   - Mention training methodologies specific to elite ${sport} development

5. PRACTICAL IMPLEMENTATION:
   - Specify exact timing for each drill and exercise
   - Include class size considerations and space requirements
   - Provide modification options for different skill levels
   - Detail instructor positioning and demonstration angles
   - Include specific success metrics and assessment criteria

6. ELITE COACHING ELEMENTS:
   - Include psychological and tactical considerations
   - Reference biomechanical principles and movement efficiency
   - Provide troubleshooting guides for common teaching challenges
   - Include progressive difficulty variations
   - Detail how this lesson connects to broader skill development

CONTENT QUALITY STANDARDS:
- Every technique must include at least 3-4 detailed steps
- Every exercise must specify duration, repetitions, and intensity
- Every section must include specific coaching points and common mistakes
- Safety considerations must be detailed and sport-specific
- Content must be actionable enough for an instructor to teach immediately

Generate content that demonstrates deep technical expertise and coaching experience - the kind of detailed instruction that separates elite coaches from amateur instructors.`
  }

  /**
   * Create detailed JSON response schema for structured lesson plans
   */
  private static createResponseSchema() {
    return {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Complete lesson title"
        },
        "objective": {
          "type": "string",
          "description": "Main learning objective for the entire lesson"
        },
        "duration": {
          "type": "string",
          "description": "Total lesson duration"
        },
        "sport": {
          "type": "string",
          "description": "Sport being taught"
        },
        "level": {
          "type": "string",
          "description": "Skill level (beginner, intermediate, advanced)"
        },
        "parts": {
          "type": "array",
          "minItems": 4,
          "maxItems": 4,
          "items": {
            "type": "object",
            "properties": {
              "partTitle": {
                "type": "string",
                "description": "Title of this lesson part"
              },
              "description": {
                "type": "string",
                "description": "Brief description of this part's purpose"
              },
              "duration": {
                "type": "string",
                "description": "Duration for this part"
              },
              "sections": {
                "type": "array",
                "minItems": 3,
                "maxItems": 6,
                "items": {
                  "type": "object",
                  "properties": {
                    "sectionTitle": {
                      "type": "string",
                      "description": "Descriptive title of this section (e.g., 'Technical Breakdown', 'Progressive Drills', 'Common Mistakes')"
                    },
                    "content": {
                      "type": "array",
                      "minItems": 5,
                      "maxItems": 15,
                      "items": {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": ["paragraph", "list_item", "heading", "exercise", "safety_note", "technique_step", "coaching_cue", "common_mistake"],
                            "description": "Type of content block - use technique_step for detailed steps, coaching_cue for specific instructions"
                          },
                          "text": {
                            "type": "string",
                            "minLength": 20,
                            "description": "Detailed content text - must be specific and actionable. For exercises include reps/timing. For techniques include step-by-step details."
                          },
                          "level": {
                            "type": "number",
                            "minimum": 1,
                            "maximum": 4,
                            "description": "Heading level (1-4, only for heading type)"
                          },
                          "duration": {
                            "type": "string",
                            "description": "Time duration for exercises (e.g., '2 minutes', '5 reps', '30 seconds')"
                          },
                          "difficulty": {
                            "type": "string",
                            "enum": ["beginner", "intermediate", "advanced"],
                            "description": "Difficulty level for this specific element"
                          }
                        },
                        "required": ["type", "text"]
                      }
                    }
                  },
                  "required": ["sectionTitle", "content"]
                }
              }
            },
            "required": ["partTitle", "description", "duration", "sections"]
          }
        }
      },
      "required": ["title", "objective", "duration", "sport", "level", "parts"]
    }
  }

  /**
   * Convert structured lesson plan to professionally formatted content
   */
  static formatLessonAsMarkdown(lesson: LessonPlanStructure): string {
    let markdown = ''

    // Professional header with clear visual hierarchy
    markdown += `═══════════════════════════════════════════════════════════════════\n`
    markdown += `🥋 ${lesson.title.toUpperCase()}\n`
    markdown += `═══════════════════════════════════════════════════════════════════\n\n`

    // Lesson info box
    markdown += `┌─────────────────────────────────────────────────────────────────┐\n`
    markdown += `│ 🏆 SPORT: ${lesson.sport.padEnd(20)} │ 📊 LEVEL: ${lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1).padEnd(15)} │\n`
    markdown += `│ ⏱️  DURATION: ${lesson.duration.padEnd(15)} │ 👥 CLASS TYPE: Training Session │\n`
    markdown += `└─────────────────────────────────────────────────────────────────┘\n\n`

    // Objective section
    markdown += `🎯 LESSON OBJECTIVE:\n`
    markdown += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    markdown += `${lesson.objective}\n\n\n`

    // Process each part with professional formatting
    lesson.parts.forEach((part, partIndex) => {
      const partIcons = ['🔥', '🎓', '💪', '⚡']
      const icon = partIcons[partIndex] || '📚'

      // Part header
      markdown += `${icon} ${part.partTitle.toUpperCase()}\n`
      markdown += `${'═'.repeat(part.partTitle.length + 4)}\n\n`

      // Duration in a box
      markdown += `┌─ ⏲️  DURATION: ${part.duration} ─┐\n`
      markdown += `└${'─'.repeat(part.duration.length + 16)}┘\n\n`

      // Description
      markdown += `📝 OVERVIEW:\n${part.description}\n\n`

      // Process sections
      part.sections.forEach((section, sectionIndex) => {
        markdown += `▼ ${section.sectionTitle}\n`
        markdown += `${'─'.repeat(section.sectionTitle.length + 2)}\n`

        let listItems: string[] = []
        let exercises: string[] = []
        let safetyNotes: string[] = []

        // Collect content by type
        section.content.forEach((block) => {
          switch (block.type) {
            case 'heading':
              markdown += `\n▶️ ${block.text}\n`
              break
            case 'paragraph':
              if (block.text.includes('**Instructor\'s Detailed Technique Notes:**')) {
                markdown += `\n📚 INSTRUCTOR'S DETAILED TECHNIQUE NOTES:\n`
                markdown += `┌${'─'.repeat(60)}┐\n`
                const notes = block.text.replace('**Instructor\'s Detailed Technique Notes:**\n', '')
                const noteLines = notes.split('\n')
                noteLines.forEach(line => {
                  if (line.trim()) {
                    // Word wrap for better formatting
                    const wrapped = line.match(/.{1,55}/g) || [line]
                    wrapped.forEach(wrappedLine => {
                      markdown += `│ ${wrappedLine.padEnd(55)} │\n`
                    })
                  }
                })
                markdown += `└${'─'.repeat(60)}┘\n\n`
              } else {
                markdown += `${block.text}\n\n`
              }
              break
            case 'technique_step':
              markdown += `\n🔧 TECHNIQUE STEP:\n`
              markdown += `┌${'─'.repeat(55)}┐\n`
              const stepLines = block.text.match(/.{1,50}/g) || [block.text]
              stepLines.forEach(line => {
                markdown += `│ ${line.padEnd(50)} │\n`
              })
              if (block.duration) {
                markdown += `│ ⏱️  Duration: ${block.duration.padEnd(38)} │\n`
              }
              markdown += `└${'─'.repeat(55)}┘\n\n`
              break
            case 'coaching_cue':
              markdown += `\n💡 COACHING CUE:\n`
              markdown += `┌${'─'.repeat(50)}┐\n`
              markdown += `│ 💡 ${block.text.padEnd(45)} │\n`
              markdown += `└${'─'.repeat(50)}┘\n\n`
              break
            case 'common_mistake':
              markdown += `\n❌ COMMON MISTAKE:\n`
              markdown += `┌${'─'.repeat(50)}┐\n`
              markdown += `│ ❌ ${block.text.padEnd(45)} │\n`
              markdown += `└${'─'.repeat(50)}┘\n\n`
              break
            case 'list_item':
              listItems.push(block.text)
              break
            case 'exercise':
              exercises.push(block.text)
              break
            case 'safety_note':
              safetyNotes.push(block.text)
              break
          }
        })

        // Format list items
        if (listItems.length > 0) {
          markdown += `\n📋 KEY POINTS:\n`
          listItems.forEach((item, index) => {
            markdown += `   ${index + 1}. ${item}\n`
          })
          markdown += `\n`
        }

        // Format exercises
        exercises.forEach(exercise => {
          markdown += `\n🏋️ EXERCISE:\n`
          markdown += `┌${'─'.repeat(50)}┐\n`
          markdown += `│ ${exercise.padEnd(48)} │\n`
          markdown += `└${'─'.repeat(50)}┘\n\n`
        })

        // Format safety notes
        safetyNotes.forEach(note => {
          markdown += `\n⚠️  SAFETY NOTE:\n`
          markdown += `┌${'─'.repeat(50)}┐\n`
          markdown += `│ ⚠️  ${note.padEnd(45)} │\n`
          markdown += `└${'─'.repeat(50)}┘\n\n`
        })
      })

      // Professional separator between parts
      if (partIndex < lesson.parts.length - 1) {
        markdown += `\n${'▼'.repeat(20)} NEXT SECTION ${'▼'.repeat(20)}\n\n`
      }
    })

    // Professional footer
    markdown += `\n═══════════════════════════════════════════════════════════════════\n`
    markdown += `📝 LESSON PLAN COMPLETE\n`
    markdown += `═══════════════════════════════════════════════════════════════════\n\n`

    markdown += `┌─────────────────────────────────────────────────────────────────┐\n`
    markdown += `│ ✅ This lesson plan was created with AI assistance              │\n`
    markdown += `│ ⚠️  Always consult qualified instructors for safety verification │\n`
    markdown += `│ 🏆 Train Smart. Train Safe. Train Hard.                        │\n`
    markdown += `└─────────────────────────────────────────────────────────────────┘\n\n`

    return markdown
  }

  /**
   * Fallback method for when API is unavailable
   */
  static generateFallbackLesson(topic: string, sport: string, level: string, duration: string, detailedInstructions?: string): LessonPlanStructure {
    // Create a much more comprehensive fallback lesson
    return {
      title: `${topic} - Professional ${sport} Training Session`,
      objective: `Master the technical, tactical, and competitive applications of ${topic.toLowerCase()} through comprehensive instruction, progressive drilling, and live application. This session focuses on developing both fundamental mechanics and advanced competition-ready skills, with emphasis on biomechanical efficiency, timing development, and tactical integration. Students will progress from isolated movement patterns to full-speed competitive application while maintaining safety and technical precision throughout all training phases.`,
      duration: duration,
      sport: sport,
      level: level,
      parts: [
        {
          partTitle: "Comprehensive Warm-Up & Technical Introduction",
          description: "Systematically prepare athletes physically and mentally while introducing core technical concepts that will be developed throughout the session",
          duration: "12 minutes",
          sections: [
            {
              sectionTitle: "Dynamic Movement Preparation",
              content: [
                { type: "paragraph", text: `Welcome to today's comprehensive training session focused on ${topic}. This lesson integrates cutting-edge coaching methodology with time-tested techniques to develop both technical mastery and competitive application. Our approach emphasizes progressive skill development, biomechanical efficiency, and tactical awareness essential for elite performance.` },
                { type: "exercise", text: "Joint mobility sequence - 2 minutes of shoulder circles, hip circles, spinal rotation, and ankle rolls to prepare major joints for training demands", duration: "2 minutes" },
                { type: "exercise", text: "Dynamic warm-up progression - High knees, butt kicks, leg swings, arm circles, and torso twists to elevate heart rate and activate movement patterns", duration: "3 minutes" },
                { type: "exercise", text: "Sport-specific movement patterns - Practice fundamental stances, footwork, and basic positions relevant to today's techniques", duration: "2 minutes" },
                { type: "safety_note", text: "Monitor individual readiness and modify intensity based on any injuries or limitations. Ensure all participants complete full range of motion without pain or restriction." }
              ]
            },
            {
              sectionTitle: "Technical Framework Introduction",
              content: [
                { type: "paragraph", text: `Today's focus on ${topic} represents a crucial element in developing competitive advantage through superior technique and tactical timing. Understanding the biomechanical principles and strategic applications will elevate your performance significantly.` },
                { type: "technique_step", text: "Core principle overview: Establish the fundamental body mechanics, leverage points, and timing concepts that make this technique effective against resistance", duration: "2 minutes" },
                { type: "coaching_cue", text: "Key teaching point: Success in this technique depends on proper setup, precise timing, and maintaining leverage throughout the movement sequence" },
                { type: "list_item", text: "Equipment check and partner assignments for optimal learning environment" },
                { type: "list_item", text: "Safety protocols specific to today's training content and intensity levels" },
                ...(detailedInstructions ? [{ type: "paragraph" as const, text: `**Master Instructor's Technical Analysis:**\n${detailedInstructions}\n\nThis detailed breakdown will serve as our foundation for developing championship-level proficiency in these techniques.` }] : [])
              ]
            }
          ]
        },
        {
          partTitle: "Master-Level Technical Instruction & Biomechanical Analysis",
          description: "Comprehensive technical breakdown with detailed demonstration, biomechanical analysis, and systematic skill development progression",
          duration: "25 minutes",
          sections: [
            {
              sectionTitle: "Fundamental Biomechanical Principles",
              content: [
                { type: "paragraph", text: "Understanding the scientific foundation behind elite technique execution requires analysis of leverage systems, force vectors, and movement efficiency. These principles separate amateur execution from championship-level performance and form the foundation for all advanced applications." },
                { type: "technique_step", text: "Body positioning and structural alignment: Analyze the kinetic chain from ground contact through force transfer, emphasizing optimal joint angles, muscle activation patterns, and center of gravity positioning for maximum mechanical advantage" },
                { type: "technique_step", text: "Timing and rhythm integration: Develop understanding of temporal sequencing, acceleration patterns, and coordination between upper and lower body systems to create fluid, efficient movement that maximizes power output while minimizing energy expenditure" },
                { type: "technique_step", text: "Leverage optimization and pressure application: Master the physics of force multiplication through proper fulcrum positioning, resistance point identification, and progressive loading patterns that create overwhelming mechanical advantage" }
              ]
            },
            {
              sectionTitle: "Step-by-Step Technical Breakdown",
              content: [
                { type: "technique_step", text: "Initial setup and positioning: Establish optimal base position with specific attention to foot placement, hip alignment, and hand positioning. Focus on creating a stable platform that allows for explosive movement initiation while maintaining defensive readiness", duration: "3 minutes" },
                { type: "technique_step", text: "Entry sequence and timing recognition: Develop sensitivity to opponent movement patterns and learn to identify optimal entry windows. Practice reading defensive reactions and adjusting approach based on resistance levels and positional changes", duration: "4 minutes" },
                { type: "technique_step", text: "Execution phase and force application: Master the precise movement sequence including grip adjustments, hip drive, and lever arm positioning. Emphasize smooth acceleration through the technique while maintaining structural integrity and technical precision", duration: "4 minutes" },
                { type: "technique_step", text: "Follow-through and position consolidation: Complete the technique with proper finishing mechanics, immediate position control, and transition readiness. Focus on maintaining advantage and preparing for next-phase tactical options", duration: "3 minutes" },
                { type: "coaching_cue", text: "Critical teaching point: Each phase must be mastered individually before combining into fluid execution - quality over speed in all development phases" }
              ]
            },
            {
              sectionTitle: "Common Technical Errors and Corrections",
              content: [
                { type: "common_mistake", text: "Premature technique initiation without proper setup leads to ineffective execution and vulnerability to counters. Root cause: rushing the process due to impatience or competitive pressure. Correction: emphasize setup quality and timing recognition through controlled drilling", duration: "2 minutes" },
                { type: "common_mistake", text: "Loss of structural integrity during execution compromises power transfer and technique effectiveness. Root cause: inadequate strength foundation or poor body awareness. Correction: strength-specific conditioning and isolated movement pattern practice", duration: "2 minutes" },
                { type: "common_mistake", text: "Incomplete follow-through resulting in positional disadvantage or technique failure. Root cause: focus on initiation rather than completion. Correction: emphasize finishing mechanics and position consolidation in all drilling", duration: "2 minutes" },
                { type: "coaching_cue", text: "Error correction protocol: identify root cause, isolate problematic movement phase, drill corrective pattern, then reintegrate into full technique sequence" }
              ]
            }
          ]
        },
        {
          partTitle: "Progressive Mastery Development & Competition Preparation",
          description: "Systematic skill development through graduated drilling progressions designed to build technical proficiency, tactical awareness, and competitive readiness",
          duration: "20 minutes",
          sections: [
            {
              sectionTitle: "Isolation and Movement Pattern Development",
              content: [
                { type: "paragraph", text: "Develop perfect technique through controlled, isolated practice that emphasizes quality movement patterns, proper mechanics, and muscle memory development. This foundation phase is critical for long-term technical excellence and injury prevention." },
                { type: "exercise", text: "Solo movement drilling: Practice the complete technique sequence in slow motion, focusing on precise body positioning, smooth transitions, and proper breathing patterns. Execute 10-15 repetitions with perfect form, emphasizing control over speed", duration: "4 minutes", difficulty: "beginner" },
                { type: "exercise", text: "Mirror drilling with partner: Work with cooperative partner to practice setup, entry, and execution phases while partner provides positional feedback and resistance markers. Focus on timing, spacing, and leverage development", duration: "4 minutes", difficulty: "intermediate" },
                { type: "coaching_cue", text: "Quality checkpoint: Every repetition must meet technical standards before progressing to next phase - prioritize precision over quantity in all drilling" },
                { type: "safety_note", text: "Monitor technique quality constantly and stop practice if form degrades due to fatigue. Maintain communication with partner throughout all drilling phases" }
              ]
            },
            {
              sectionTitle: "Progressive Resistance and Speed Development",
              content: [
                { type: "paragraph", text: "Systematically increase challenge levels to develop technique effectiveness under realistic training conditions while maintaining safety and technical standards. This phase bridges the gap between isolated practice and live application." },
                { type: "exercise", text: "Graduated resistance drilling: Partner provides 25% resistance initially, progressing to 50% and 75% as technique quality permits. Focus on maintaining mechanical advantage and smooth execution under increasing pressure", duration: "5 minutes", difficulty: "intermediate" },
                { type: "exercise", text: "Speed and timing development: Practice technique at varying speeds from slow-motion to full-speed execution, emphasizing consistent mechanics and timing recognition throughout all tempo variations", duration: "4 minutes", difficulty: "advanced" },
                { type: "exercise", text: "Competition simulation: Execute techniques under time pressure and varying resistance levels to simulate competitive conditions, focusing on decision-making speed and technical precision under stress" },
                { type: "coaching_cue", text: "Technical proficiency standards: Maintain 80% success rate at each resistance level before progressing. Focus on consistent mechanics rather than force or speed" },
                { type: "safety_note", text: "Progressive loading protocol: increase resistance gradually and never exceed partner's comfort level. Stop immediately if technique breaks down due to excessive resistance" }
              ]
            },
            {
              sectionTitle: "Integration and Flow Development",
              content: [
                { type: "paragraph", text: "Connect today's techniques with existing skill sets and develop seamless transitions that enhance overall tactical effectiveness. This integration phase develops the ability to use techniques naturally within broader strategic frameworks." },
                { type: "exercise", text: "Combination drilling: Practice linking today's technique with 2-3 follow-up options, developing smooth transitions and maintaining positional advantage throughout sequence combinations", duration: "3 minutes", difficulty: "advanced" },
                { type: "coaching_cue", text: "Flow development key: Every technique should connect naturally to next tactical option - avoid isolated technique practice that doesn't integrate with broader game strategy" }
              ]
            }
          ]
        },
        {
          partTitle: "Competition Application & Recovery Integration",
          description: "Test skills under realistic competitive pressure while implementing comprehensive recovery protocols for optimal adaptation and injury prevention",
          duration: "8 minutes",
          sections: [
            {
              sectionTitle: "Live Application and Performance Testing",
              content: [
                { type: "paragraph", text: "Apply newly developed skills in realistic competitive scenarios that test technical proficiency, tactical awareness, and decision-making under pressure. This phase validates learning objectives and identifies areas for continued development." },
                { type: "exercise", text: "Controlled competition scenarios: Execute today's techniques in structured sparring with specific objectives and success criteria. Focus on timing recognition, technique selection, and successful execution under realistic resistance", duration: "4 minutes", difficulty: "advanced" },
                { type: "coaching_cue", text: "Performance standards: Successful technique application in 60% of appropriate opportunities with maintenance of technical quality and safety protocols throughout all live training" },
                { type: "coaching_cue", text: "Competition readiness indicator: ability to execute techniques naturally without conscious thought process - technique becomes instinctive response to tactical opportunity" },
                { type: "safety_note", text: "Live application safety protocol: maintain communication, respect partner limits, and stop immediately if safety concerns arise. Focus on controlled intensity appropriate for skill development" }
              ]
            },
            {
              sectionTitle: "Recovery and Lesson Integration",
              content: [
                { type: "paragraph", text: "Implement comprehensive recovery protocols while consolidating learning objectives and establishing development pathways for continued progress. This phase optimizes adaptation and prepares athletes for ongoing skill development." },
                { type: "exercise", text: "Active recovery sequence: Systematic cool-down including gentle stretching, breathing exercises, and movement quality restoration to promote recovery and prevent post-training stiffness", duration: "2 minutes" },
                { type: "paragraph", text: "Lesson review and goal setting: Identify key learning achievements, areas for improvement, and specific practice objectives for upcoming training sessions. Connect today's techniques to broader skill development progression and competitive preparation." },
                { type: "coaching_cue", text: "Development pathway: Each session should build systematically toward long-term technical mastery and competitive readiness - establish clear connections between today's work and future development goals" },
                { type: "list_item", text: "Individual feedback and personalized development recommendations" },
                { type: "list_item", text: "Practice assignment for skill maintenance between sessions" },
                { type: "list_item", text: "Preview of next session content and preparation requirements" }
              ]
            }
          ]
        }
      ]
    }
  }
}