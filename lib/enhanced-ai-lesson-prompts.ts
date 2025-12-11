// Enhanced AI lesson generation with ultra-detailed prompts for comprehensive content

export interface EnhancedLessonConfig {
  wordTargetMinimum: number // minimum words for entire lesson
  includeCompetitionApplication: boolean
  includePhysiologyExplanations: boolean
  includeTroubleshootingGuides: boolean
  includeAdvancedVariations: boolean
  includeRecoveryProtocols: boolean
  includeMentalTrainingAspects: boolean
  detailLevel: 'comprehensive' | 'expert' | 'masterclass'
}

export class EnhancedAILessonPrompts {

  /**
   * Generate ultra-detailed system instruction for maximum lesson depth
   */
  static createMasterCoachSystemInstruction(
    sport: string,
    level: string,
    config: EnhancedLessonConfig
  ): string {
    const baseInstruction = `You are THE definitive expert in ${sport} - a legendary master coach with 30+ years at the highest levels of the sport. You've trained multiple world champions, Olympic medalists, and have written the definitive technical manuals that other coaches study. You are known for creating the most detailed, comprehensive lesson plans in the industry.

Your mission: Create an EXCEPTIONALLY DETAILED, COMPREHENSIVE lesson plan that rivals graduate-level sports science curriculum combined with championship-level coaching expertise. This should be a masterpiece of instructional design that other elite coaches would pay thousands to access.

═══ EXTREME DETAIL REQUIREMENTS ═══

LESSON STRUCTURE - Each of 4 parts must be extraordinarily detailed:
• "Comprehensive Warm-Up & Technical Introduction" (10-15 minutes)
• "Master-Level Technical Instruction & Biomechanical Analysis" (25-35 minutes)
• "Progressive Mastery Development & Advanced Drilling" (20-30 minutes)
• "Competition Application & Recovery Integration" (8-12 minutes)

TECHNICAL DEPTH REQUIREMENTS (MANDATORY):
🔬 BIOMECHANICAL ANALYSIS:
• Detailed joint-by-joint movement analysis
• Specific muscle activation patterns and timing
• Force vectors and leverage optimization
• Movement efficiency and energy transfer principles
• Anatomical considerations for body type variations

🎯 STEP-BY-STEP BREAKDOWN:
• Minimum 6-8 detailed technical steps for primary techniques
• Each step must include body position, timing, and execution details
• Multiple execution angles and setups
• Transition points and flow integration
• Specific grip variations, pressure points, and leverage adjustments

⚠️ COMPREHENSIVE ERROR ANALYSIS:
• 5-7 common mistakes with detailed explanations
• Root cause analysis for each mistake
• Specific correction methods and coaching cues
• Progressive drills to fix each mistake
• Prevention strategies for avoiding errors

🏃 PROGRESSIVE DEVELOPMENT:
• 4-6 skill progression levels from basic to advanced
• Specific success criteria for each level
• Individual adaptation guidelines
• Assessment protocols and benchmarks
• Prerequisite skills and mobility requirements

${config.includeCompetitionApplication ? `
🏆 COMPETITION APPLICATION:
• Specific rule set applications and scoring opportunities
• Tactical timing and situational usage
• Pressure testing protocols
• Competition-specific drilling sequences
• Mental game integration for competitive scenarios
` : ''}

${config.includePhysiologyExplanations ? `
🧬 PHYSIOLOGICAL INTEGRATION:
• Energy system demands and training adaptations
• Specific strength and conditioning requirements
• Injury prevention and prehabilitation protocols
• Recovery optimization strategies
• Fatigue management during training
` : ''}

${config.includeMentalTrainingAspects ? `
🧠 MENTAL PERFORMANCE ELEMENTS:
• Visualization and mental rehearsal protocols
• Confidence building and pressure management
• Focus and attention training
• Decision-making skill development
• Competitive mindset cultivation
` : ''}

CONTENT QUALITY MANDATES:
• Every technique step: 40+ words minimum with specific details
• Every exercise: Include sets, reps, timing, intensity, and progression
• Every coaching cue: Actionable and specific to body mechanics
• Every safety note: Detailed with prevention and response protocols
• Every section: Connect to broader skill development and competitive application

INSTRUCTIONAL EXCELLENCE STANDARDS:
🎓 PEDAGOGICAL DEPTH:
• Multiple learning style accommodations (visual, kinesthetic, analytical)
• Individual adaptation guidelines for different body types
• Modification protocols for various skill levels
• Assessment rubrics and progress tracking methods
• Effective demonstration strategies and angles

🛡️ SAFETY INTEGRATION:
• Detailed warm-up and injury prevention protocols
• Risk assessment and mitigation strategies
• Emergency response procedures
• Equipment safety and inspection protocols
• Partner protection and communication systems

🔄 SKILL INTEGRATION:
• Connection to previously learned techniques
• Setup combinations and chain development
• Defensive and counter-application awareness
• Flow integration with existing skill sets
• Advanced variation development pathways

TARGET LENGTH: Minimum ${config.wordTargetMinimum} words for complete lesson plan
DETAIL LEVEL: ${config.detailLevel} - exceed professional coaching certification standards

ULTRA-COMPREHENSIVE REQUIREMENTS:
🎯 CONTENT DEPTH MANDATES:
• Every technique explanation: MINIMUM 80-120 words with biomechanical details
• Every exercise description: 60-100 words including setup, execution, variations, and safety
• Every coaching cue: 40-60 words with specific application and timing
• Every common mistake: 50-80 words with root cause analysis and correction protocol
• Every safety protocol: 40-60 words with prevention and response procedures

📚 INSTRUCTIONAL COMPLETENESS:
• Include detailed "instructor notes" for each major section
• Provide multiple teaching angles and demonstration perspectives
• Add specific timing for every drill, exercise, and technique component
• Include modification options for different body types and skill levels
• Detail equipment requirements and space considerations

🔬 SCIENTIFIC INTEGRATION:
• Explain biomechanical principles behind each technique
• Include muscle activation patterns and joint kinematics
• Reference movement efficiency and energy transfer concepts
• Connect to motor learning and skill acquisition principles
• Add physiological demands and training adaptations

🏆 PROFESSIONAL STANDARDS:
• Content must be suitable for coaching certification programs
• Include assessment rubrics and progress tracking methods
• Provide troubleshooting guides for common teaching challenges
• Reference competition rules and scoring implications where applicable
• Add mental game and tactical development elements

FORMATTING REQUIREMENTS:
• Use clear headers, subheaders, and bullet points
• Include timing allocations for every activity
• Add safety reminders throughout each section
• Use professional coaching terminology
• Structure content for easy scanning and reference

Generate content so detailed and comprehensive that it could serve as a complete instructional manual for the technique, suitable for training other coaches and suitable for academic study. The lesson plan should be comprehensive enough to teach from without any additional resources.`

    return baseInstruction
  }

  /**
   * Create ultra-detailed prompt for specific lesson generation
   */
  static createComprehensiveLessonPrompt(
    topic: string,
    sport: string,
    level: string,
    duration: string,
    detailedInstructions: string,
    config: EnhancedLessonConfig
  ): string {
    let prompt = `Create the most comprehensive, detailed professional lesson plan ever developed for:

TOPIC: ${topic}
SPORT: ${sport}
LEVEL: ${level}
DURATION: ${duration}
TARGET DETAIL LEVEL: ${config.detailLevel.toUpperCase()}

You have been provided with instructor-specific technique details. Use these as your foundation and expand them into a complete masterclass-level lesson plan:`

    if (detailedInstructions) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTOR'S DETAILED TECHNIQUE BREAKDOWN (EXPAND AND ENHANCE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${detailedInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY EXPANSION REQUIREMENTS:

🔬 TECHNICAL ANALYSIS EXPANSION:
• Take each technique element above and expand into detailed biomechanical analysis
• Add specific muscle groups, joint actions, and force application details
• Include timing sequences, breathing patterns, and energy transfer principles
• Provide multiple execution variations and body type adaptations

🎯 STEP-BY-STEP ENHANCEMENT:
• Break down each technique into 6-8 detailed execution steps
• Each step must be 50+ words with specific positioning and timing details
• Include common errors and corrections for each step
• Add specific coaching cues and teaching progression for each element

🏋️ DRILLING INTEGRATION:
• Create specific drilling sequences for each technique element
• Include progression from isolated movement to full-speed application
• Design partner drilling with graduated resistance levels
• Add specific timing, repetition, and intensity protocols

⚠️ COMPREHENSIVE TROUBLESHOOTING:
• Analyze each technique element for 3-4 potential execution errors
• Provide detailed explanation of why each error occurs
• Include specific correction methods and coaching interventions
• Design remedial drills to address each common mistake

🏆 APPLICATION DEVELOPMENT:
• Show how to apply these techniques in live training scenarios
• Include setup opportunities and timing recognition
• Add competition-specific applications and rule considerations
• Provide chain development and combination opportunities`
    }

    prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPREHENSIVE LESSON PLAN REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1: COMPREHENSIVE WARM-UP & TECHNICAL INTRODUCTION (10-15 minutes)
🔥 Requirements:
• Detailed sport-specific warm-up sequence with exact timing and progressions
• Technical introduction including biomechanical principles and movement patterns
• Mental preparation and lesson objective setting
• Equipment check and safety briefing with specific protocols
• Base-level skill assessment and individual adaptation planning

PART 2: MASTER-LEVEL TECHNICAL INSTRUCTION & BIOMECHANICAL ANALYSIS (25-35 minutes)
🎓 Requirements:
• Complete biomechanical breakdown with joint-by-joint analysis
• Step-by-step technique instruction with minimum 6-8 detailed steps
• Multiple demonstration angles and execution variations
• Detailed common mistakes analysis with correction methods
• Specific coaching cues and teaching progressions
• Scientific explanation of movement principles and effectiveness

PART 3: PROGRESSIVE MASTERY DEVELOPMENT & ADVANCED DRILLING (20-30 minutes)
💪 Requirements:
• Structured drilling progression from cooperative to resistant
• Specific partner exercises with timing, reps, and intensity protocols
• Individual skill development with personalized modification options
• Progressive difficulty challenges with clear advancement criteria
• Integration drills connecting to broader skill sets
• Quality control checkpoints and assessment protocols

PART 4: COMPETITION APPLICATION & RECOVERY INTEGRATION (8-12 minutes)
⚡ Requirements:
• Live application scenarios with realistic pressure and timing
• Competition-specific rule applications and tactical considerations
• Recovery and cool-down protocols with injury prevention focus
• Lesson review and individual goal setting for continued development
• Assessment of learning objectives and skill acquisition
• Next-phase training recommendations and practice assignments

CONTENT DEPTH STANDARDS:
• Each technique step: MINIMUM 50 words with precise execution details
• Each exercise: Include exact timing, repetitions, intensity, and safety protocols
• Each coaching cue: Specific to biomechanics with clear implementation guidance
• Each common mistake: Detailed analysis with root cause and correction method
• Each safety note: Comprehensive with prevention and emergency response protocols

EXPERTISE DEMONSTRATION:
• Use precise technical terminology and sport-specific language
• Reference biomechanical principles and movement science
• Include psychological and tactical development elements
• Demonstrate deep understanding of skill acquisition and motor learning
• Show connection to competitive application and elite performance standards

Your lesson plan should be so detailed and comprehensive that it could serve as:
• A complete instructional manual for other coaches
• Graduate-level curriculum for sports science study
• Professional certification training material
• The definitive guide for this specific technique/skill

Generate content that demonstrates master-level coaching expertise and creates immediate, actionable value for serious athletes and instructors.`

    if (config.includeAdvancedVariations) {
      prompt += `

🔄 ADVANCED VARIATIONS REQUIRED:
• Include 3-4 advanced technique variations for experienced practitioners
• Detail setup differences and application scenarios for each variation
• Provide progression pathways from basic to advanced executions
• Include troubleshooting for advanced technique elements`
    }

    if (config.includeTroubleshootingGuides) {
      prompt += `

🛠️ COMPREHENSIVE TROUBLESHOOTING REQUIRED:
• Create detailed troubleshooting guides for 5-7 common teaching challenges
• Include diagnostic methods for identifying technical problems
• Provide step-by-step correction protocols with specific drills
• Add prevention strategies to avoid common issues`
    }

    if (config.includeRecoveryProtocols) {
      prompt += `

🏥 RECOVERY AND INJURY PREVENTION REQUIRED:
• Include specific warm-up and cool-down protocols
• Detail injury prevention strategies specific to this technique
• Provide recovery optimization between training sessions
• Include load management and fatigue monitoring guidance`
    }

    // Add ultra-comprehensive structure template
    prompt += `

🔥🔥🔥 ULTRA-COMPREHENSIVE LESSON STRUCTURE TEMPLATE 🔥🔥🔥

Your lesson plan must follow this professional structure with extensive detail:

═══════════════════════════════════════════════════════════════
🏆 PROFESSIONAL HEADER SECTION
═══════════════════════════════════════════════════════════════
Create a formatted header box containing:
• Sport and specific focus area
• Skill level and duration
• Class type and participant count
• Equipment and space requirements

═══════════════════════════════════════════════════════════════
🎯 COMPREHENSIVE LESSON OBJECTIVE (150+ words)
═══════════════════════════════════════════════════════════════
• Detailed explanation of why this topic is crucial for development
• Competition relevance and real-world application scenarios
• Connection to broader skill progression and athletic development
• Specific, measurable learning outcomes for the session
• Prerequisites and foundational skills needed

═══════════════════════════════════════════════════════════════
🔥 DYNAMIC WARM-UP & INTRODUCTION (10-15 minutes)
═══════════════════════════════════════════════════════════════
• 6-8 specific dynamic exercises with timing and repetitions
• Sport-specific mobility patterns and movement preparation
• Mental focus activation and lesson preparation cues
• Partner activation drills relevant to today's techniques
• Equipment check and comprehensive safety briefing
• Connection explanation: how warm-up prepares for lesson content

═══════════════════════════════════════════════════════════════
🎓 TECHNICAL INSTRUCTION & DEMONSTRATION (20-30 minutes)
═══════════════════════════════════════════════════════════════
• Core biomechanical principles with scientific explanation
• 3-5 technique variations with step-by-step breakdowns (8-10 steps each)
• Multiple demonstration angles and teaching perspectives
• Detailed instructor teaching cues with specific language
• 6-8 common mistakes with root cause analysis and corrections
• Body mechanics, leverage, timing, and energy efficiency principles

═══════════════════════════════════════════════════════════════
💪 PROGRESSIVE PRACTICE & DRILLING (15-25 minutes)
═══════════════════════════════════════════════════════════════
• Isolation drills: specific movements, timing, and repetition protocols
• Cooperative drilling: partner exercises with graduated resistance
• Progressive resistance: increasing challenge and speed development
• Situational practice: realistic application scenarios
• Quality control checkpoints and technique assessment
• Comprehensive safety protocols and injury prevention measures

═══════════════════════════════════════════════════════════════
⚡ LIVE APPLICATION & INTEGRATION (8-12 minutes)
═══════════════════════════════════════════════════════════════
• Controlled sparring with specific objectives and rules
• Competition-style application and pressure testing
• Integration with existing skills and flow development
• Cool-down protocols with recovery and injury prevention
• Immediate feedback and performance analysis

═══════════════════════════════════════════════════════════════
📝 LESSON REVIEW & REFLECTION (5 minutes)
═══════════════════════════════════════════════════════════════
• Key learning reinforcement and objective assessment
• Guided reflection questions for skill integration
• Individual goal setting for continued development
• Connection to next phase of skill progression
• Training recommendations for skill maintenance

═══════════════════════════════════════════════════════════════
🛡️ SAFETY & DEVELOPMENT REMINDER
═══════════════════════════════════════════════════════════════
• Safe training practices and injury prevention
• Progressive development timeline and expectations
• Recovery protocols and training frequency recommendations

CONTENT REQUIREMENTS FOR EACH SECTION:
• Minimum 100-150 words per major section
• Specific timing for every activity and drill
• Detailed safety considerations throughout
• Professional coaching terminology and language
• Assessment criteria and progress indicators
• Modification options for different skill levels`

    return prompt
  }

  /**
   * Create enhanced JSON schema for more detailed lesson structure
   */
  static createEnhancedResponseSchema(config: EnhancedLessonConfig) {
    const minSections = config.detailLevel === 'masterclass' ? 6 :
                       config.detailLevel === 'expert' ? 5 : 4
    const maxSections = config.detailLevel === 'masterclass' ? 10 :
                       config.detailLevel === 'expert' ? 8 : 6
    const minContentBlocks = config.detailLevel === 'masterclass' ? 15 :
                             config.detailLevel === 'expert' ? 12 : 10
    const maxContentBlocks = config.detailLevel === 'masterclass' ? 30 :
                             config.detailLevel === 'expert' ? 25 : 20

    return {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 10,
          "description": "Comprehensive and descriptive lesson title"
        },
        "objective": {
          "type": "string",
          "minLength": 50,
          "description": "Detailed learning objective with measurable outcomes and skill development goals"
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
                "minLength": 10,
                "description": "Descriptive title of this lesson part with clear focus indication"
              },
              "description": {
                "type": "string",
                "minLength": 40,
                "description": "Comprehensive description of this part's purpose, methodology, and learning outcomes"
              },
              "duration": {
                "type": "string",
                "description": "Duration for this part"
              },
              "sections": {
                "type": "array",
                "minItems": minSections,
                "maxItems": maxSections,
                "items": {
                  "type": "object",
                  "properties": {
                    "sectionTitle": {
                      "type": "string",
                      "minLength": 8,
                      "description": "Specific and descriptive section title (e.g., 'Biomechanical Analysis', 'Progressive Drilling Sequence', 'Advanced Troubleshooting')"
                    },
                    "content": {
                      "type": "array",
                      "minItems": minContentBlocks,
                      "maxItems": maxContentBlocks,
                      "items": {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": ["paragraph", "list_item", "heading", "exercise", "safety_note", "technique_step", "coaching_cue", "common_mistake", "biomechanical_analysis", "progression_drill", "assessment_criteria"],
                            "description": "Type of content - use technique_step for detailed execution steps, biomechanical_analysis for scientific explanation"
                          },
                          "text": {
                            "type": "string",
                            "minLength": 80,
                            "description": "ULTRA-DETAILED content text - minimum 80 words. For techniques include precise biomechanical execution details. For exercises include exact timing/reps/progressions. For analysis include scientific principles and practical application."
                          },
                          "level": {
                            "type": "number",
                            "minimum": 1,
                            "maximum": 4,
                            "description": "Heading level (1-4, only for heading type)"
                          },
                          "duration": {
                            "type": "string",
                            "description": "Specific time duration for exercises (e.g., '3 minutes', '8-10 reps', '45 seconds')"
                          },
                          "difficulty": {
                            "type": "string",
                            "enum": ["beginner", "intermediate", "advanced", "expert"],
                            "description": "Specific difficulty level for this element"
                          },
                          "intensity": {
                            "type": "string",
                            "enum": ["low", "moderate", "high", "variable"],
                            "description": "Training intensity level for exercises and drills"
                          },
                          "focus_area": {
                            "type": "string",
                            "description": "Primary focus area (e.g., 'hip mechanics', 'grip positioning', 'timing development')"
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
   * Default configuration for ultra-detailed lessons
   */
  static getDefaultEnhancedConfig(): EnhancedLessonConfig {
    return {
      wordTargetMinimum: 8000, // Significantly increased for ultra-comprehensive content
      includeCompetitionApplication: true,
      includePhysiologyExplanations: true,
      includeTroubleshootingGuides: true,
      includeAdvancedVariations: true,
      includeRecoveryProtocols: true,
      includeMentalTrainingAspects: true,
      detailLevel: 'masterclass'
    }
  }

  /**
   * Configuration for expert-level lessons
   */
  static getExpertLevelConfig(): EnhancedLessonConfig {
    return {
      wordTargetMinimum: 6000, // Increased for more comprehensive content
      includeCompetitionApplication: true,
      includePhysiologyExplanations: true,
      includeTroubleshootingGuides: true,
      includeAdvancedVariations: true,
      includeRecoveryProtocols: true,
      includeMentalTrainingAspects: true,
      detailLevel: 'expert'
    }
  }

  /**
   * Configuration for comprehensive lessons
   */
  static getComprehensiveConfig(): EnhancedLessonConfig {
    return {
      wordTargetMinimum: 4500, // Increased significantly
      includeCompetitionApplication: true,
      includePhysiologyExplanations: true,
      includeTroubleshootingGuides: true,
      includeAdvancedVariations: true,
      includeRecoveryProtocols: true,
      includeMentalTrainingAspects: false,
      detailLevel: 'comprehensive'
    }
  }
}