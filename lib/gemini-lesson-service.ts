// Robust Gemini API-based lesson generation with structured prompts and JSON schemas

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
  type: 'paragraph' | 'list_item' | 'heading' | 'exercise' | 'safety_note'
  text: string
  level?: number // for headings (1-4)
}

export class GeminiLessonService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

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
    return {
      title: topic,
      objective: `Develop fundamental skills and understanding of ${topic.toLowerCase()}`,
      duration: duration,
      sport: sport,
      level: level,
      parts: [
        {
          partTitle: "Warm-Up & Introduction",
          description: "Prepare students physically and mentally for the lesson",
          duration: "8 minutes",
          sections: [
            {
              sectionTitle: "Overview",
              content: [
                { type: "paragraph", text: detailedInstructions
                  ? `Welcome to today's lesson on ${topic}. This session will incorporate the detailed technique instructions provided.`
                  : `Welcome to today's lesson on ${topic}. This session will focus on developing your understanding and practical application of key concepts.` },
                { type: "list_item", text: "Dynamic warm-up exercises" },
                { type: "list_item", text: "Introduction to lesson objectives" },
                { type: "list_item", text: "Safety briefing and equipment check" },
                ...(detailedInstructions ? [{ type: "paragraph" as const, text: `**Instructor's Detailed Technique Notes:**\n${detailedInstructions}` }] : [])
              ]
            }
          ]
        },
        {
          partTitle: "Technical Instruction & Demonstration",
          description: "Detailed breakdown of techniques and concepts",
          duration: "18 minutes",
          sections: [
            {
              sectionTitle: "Core Principles",
              content: [
                { type: "paragraph", text: "Understanding the fundamental principles behind effective technique execution." },
                { type: "list_item", text: "Proper body positioning and alignment" },
                { type: "list_item", text: "Timing and rhythm of movement" },
                { type: "list_item", text: "Key leverage points and pressure application" }
              ]
            }
          ]
        },
        {
          partTitle: "Progressive Practice & Drilling",
          description: "Structured practice with progressive difficulty",
          duration: "15 minutes",
          sections: [
            {
              sectionTitle: "Practice Drills",
              content: [
                { type: "paragraph", text: "Step-by-step practice progression to build muscle memory and understanding." },
                { type: "exercise", text: "Isolation drill - Practice core movement slowly with focus on form" },
                { type: "exercise", text: "Progressive resistance - Add light resistance and increase speed" },
                { type: "safety_note", text: "Stop immediately if any pain or discomfort occurs" }
              ]
            }
          ]
        },
        {
          partTitle: "Live Application & Cool-Down",
          description: "Apply skills in realistic scenarios and wind down",
          duration: "4 minutes",
          sections: [
            {
              sectionTitle: "Application",
              content: [
                { type: "paragraph", text: "Put the skills into practice with controlled application and feedback." },
                { type: "list_item", text: "Controlled sparring or application" },
                { type: "list_item", text: "Cool-down stretching" },
                { type: "list_item", text: "Lesson review and questions" }
              ]
            }
          ]
        }
      ]
    }
  }
}