// CoachingContext type (previously from deleted ai-service module)
export interface CoachingContext {
  coachName: string
  sport: string
  expertise: string[]
  voiceCharacteristics: {
    tone: string
    catchphrases: string[]
  }
  coachCredentials: string[]
}

// Professional lesson structure interface
export interface LessonStructure {
  title: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  duration: string
  objectives: string[]
  sections: LessonSection[]
  assessment: AssessmentCriteria
  resources: LessonResources
}

export interface LessonSection {
  id: string
  title: string
  type: 'introduction' | 'demonstration' | 'practice' | 'application' | 'review'
  duration: string
  content: SectionContent
}

export interface SectionContent {
  overview: string
  keyPoints: string[]
  demonstrations: Demonstration[]
  exercises: Exercise[]
  commonMistakes: CommonMistake[]
  progressionTips: string[]
}

export interface Demonstration {
  title: string
  description: string
  keyFocus: string[]
  visualCues: string[]
  timing: string
}

export interface Exercise {
  name: string
  description: string
  duration: string
  difficulty: string
  equipment: string[]
  instructions: string[]
  progressions: string[]
  safetyNotes: string[]
}

export interface CommonMistake {
  mistake: string
  why: string
  correction: string
  coachingCue: string
}

export interface AssessmentCriteria {
  skillChecks: SkillCheck[]
  progressMarkers: string[]
  masteryIndicators: string[]
}

export interface SkillCheck {
  skill: string
  criteria: string[]
  scoringGuide: string
}

export interface LessonResources {
  equipment: string[]
  setupRequirements: string[]
  additionalMaterials: string[]
  followUpSuggestions: string[]
}

// Intelligent lesson creation engine
export class LessonCreationEngine {

  /**
   * Analyze lesson topic for comprehensive structure
   */
  static analyzeLessonTopic(topic: string, sport: string): {
    complexity: string,
    skillAreas: string[],
    prerequisites: string[],
    learningObjectives: string[],
    keyComponents: string[]
  } {
    const topicLower = topic.toLowerCase()

    // Determine complexity level
    let complexity = 'intermediate'
    if (topicLower.includes('advanced') || topicLower.includes('mastering') || topicLower.includes('elite')) {
      complexity = 'advanced'
    } else if (topicLower.includes('basic') || topicLower.includes('introduction') || topicLower.includes('fundamental')) {
      complexity = 'beginner'
    }

    // Identify skill areas based on keywords
    const skillAreas: string[] = []
    const skillKeywords = {
      technical: ['technique', 'mechanics', 'form', 'execution'],
      tactical: ['timing', 'strategy', 'positioning', 'decision'],
      physical: ['strength', 'power', 'speed', 'conditioning'],
      mental: ['focus', 'confidence', 'pressure', 'mental']
    }

    Object.entries(skillKeywords).forEach(([area, keywords]) => {
      if (keywords.some(keyword => topicLower.includes(keyword))) {
        skillAreas.push(area)
      }
    })

    // Sport-specific analysis
    let prerequisites: string[] = []
    let learningObjectives: string[] = []
    let keyComponents: string[] = []

    if (sport.toLowerCase() === 'brazilian jiu-jitsu' || sport.toLowerCase() === 'bjj') {
      if (topicLower.includes('sweep')) {
        prerequisites = ['Basic guard retention', 'Hip movement fundamentals', 'Grip fighting basics']
        learningObjectives = [
          'Execute sweeps with proper timing and leverage',
          'Understand sweep mechanics and weight distribution',
          'Chain multiple sweep attempts fluidly',
          'Apply sweeps in live rolling scenarios'
        ]
        keyComponents = ['Setup and grips', 'Hip mechanics', 'Timing and leverage', 'Follow-through and control']
      }
    } else if (sport.toLowerCase() === 'soccer') {
      if (topicLower.includes('passing')) {
        prerequisites = ['Basic ball control', 'Proper stance and balance', 'Field awareness']
        learningObjectives = [
          'Achieve 85%+ passing accuracy in training',
          'Execute passes under pressure',
          'Vary passing weight and distance',
          'Read defensive positioning for pass selection'
        ]
        keyComponents = ['Technique fundamentals', 'Vision and decision making', 'Pressure application', 'Game integration']
      }
    }

    return { complexity, skillAreas, prerequisites, learningObjectives, keyComponents }
  }

  /**
   * Generate comprehensive lesson structure
   */
  static generateLessonStructure(
    topic: string,
    sport: string,
    context: CoachingContext,
    duration: string = '60 minutes'
  ): LessonStructure {
    const analysis = this.analyzeLessonTopic(topic, sport)

    // Create main lesson sections
    const sections: LessonSection[] = [
      this.createIntroductionSection(topic, analysis),
      this.createDemonstrationSection(topic, analysis, context),
      this.createPracticeSection(topic, analysis, context),
      this.createApplicationSection(topic, analysis),
      this.createReviewSection(topic, analysis)
    ]

    // Generate assessment criteria
    const assessment: AssessmentCriteria = {
      skillChecks: analysis.learningObjectives.map(obj => ({
        skill: obj,
        criteria: this.generateSkillCriteria(obj, analysis.complexity),
        scoringGuide: this.generateScoringGuide(analysis.complexity)
      })),
      progressMarkers: this.generateProgressMarkers(topic, analysis),
      masteryIndicators: this.generateMasteryIndicators(topic, analysis)
    }

    // Create resource requirements
    const resources: LessonResources = {
      equipment: this.generateEquipmentList(topic, sport),
      setupRequirements: this.generateSetupRequirements(topic, sport),
      additionalMaterials: ['Video recording device for analysis', 'Whiteboard for diagrams'],
      followUpSuggestions: this.generateFollowUpSuggestions(topic, analysis)
    }

    return {
      title: topic,
      sport: sport,
      level: analysis.complexity as any,
      duration: duration,
      objectives: analysis.learningObjectives,
      sections: sections,
      assessment: assessment,
      resources: resources
    }
  }

  /**
   * Create introduction section
   */
  private static createIntroductionSection(topic: string, analysis: any): LessonSection {
    return {
      id: 'introduction',
      title: 'Lesson Introduction & Objectives',
      type: 'introduction',
      duration: '10 minutes',
      content: {
        overview: `Welcome to today's lesson on ${topic}. This is an ${analysis.complexity}-level session focusing on ${analysis.skillAreas.join(', ')} development.`,
        keyPoints: [
          `Review prerequisites: ${analysis.prerequisites.join(', ')}`,
          'Establish lesson objectives and success criteria',
          'Safety briefing and injury prevention',
          'Mental preparation and focus setting'
        ],
        demonstrations: [],
        exercises: [],
        commonMistakes: [],
        progressionTips: [
          'Start with assessment of current skill level',
          'Set individual goals within the lesson framework',
          'Emphasize quality over quantity in all exercises'
        ]
      }
    }
  }

  /**
   * Create demonstration section
   */
  private static createDemonstrationSection(topic: string, analysis: any, context: CoachingContext): LessonSection {
    // Generate up to 3 key demonstrations to avoid repetition
    const maxDemos = Math.min(3, analysis.keyComponents.length)
    const demonstrations: Demonstration[] = analysis.keyComponents.slice(0, maxDemos).map((component: string, index: number) => ({
      title: `${component} Breakdown`,
      description: `Step-by-step instruction focusing on ${component.toLowerCase()} fundamentals`,
      keyFocus: this.generateDemonstrationFocus(component, topic),
      visualCues: this.generateVisualCues(component, topic),
      timing: `${4 + index * 2} minutes`
    }))

    return {
      id: 'demonstration',
      title: 'Technical Demonstration & Breakdown',
      type: 'demonstration',
      duration: '15 minutes',
      content: {
        overview: `Comprehensive technical breakdown of ${topic} with detailed demonstrations and explanation of mechanics.`,
        keyPoints: [
          'Step-by-step technical breakdown',
          'Common timing patterns and cues',
          'Leverage points and weight distribution',
          'Integration with existing skills'
        ],
        demonstrations: demonstrations,
        exercises: [],
        commonMistakes: [],
        progressionTips: [
          'Demonstrate at slow speed first, then build to full speed',
          'Use multiple angles for visual learners',
          'Encourage questions throughout demonstration'
        ]
      }
    }
  }

  /**
   * Create practice section
   */
  private static createPracticeSection(topic: string, analysis: any, context: CoachingContext): LessonSection {
    const exercises: Exercise[] = [
      {
        name: 'Isolation Drill',
        description: `Practice the core movement of ${topic} in isolation to build muscle memory`,
        duration: '8 minutes',
        difficulty: 'Progressive',
        equipment: this.generateEquipmentList(topic, context.sport).slice(0, 3),
        instructions: [
          'Start with slow, controlled movements',
          'Focus on proper positioning and setup',
          'Gradually increase speed while maintaining form',
          'Practice both sides equally'
        ],
        progressions: [
          'Static positioning practice',
          'Slow motion execution',
          'Normal speed with resistance',
          'Add complexity or combinations'
        ],
        safetyNotes: [
          'Maintain proper warm-up throughout',
          'Stop if any pain or discomfort occurs',
          'Focus on control over power'
        ]
      },
      {
        name: 'Partner Integration Drill',
        description: `Apply ${topic} concepts with partner resistance and realistic scenarios`,
        duration: '10 minutes',
        difficulty: 'Intermediate',
        equipment: ['Training partner', 'Mats/appropriate surface'],
        instructions: [
          'Partner provides graduated resistance',
          'Focus on timing and reaction',
          'Switch roles every 2 minutes',
          'Communicate throughout the drill'
        ],
        progressions: [
          'Cooperative partner resistance',
          'Light active resistance',
          'Moderate resistance with counters',
          'Full resistance application'
        ],
        safetyNotes: [
          'Establish clear communication signals',
          'Start light and progress gradually',
          'Respect partner safety at all times'
        ]
      }
    ]

    return {
      id: 'practice',
      title: 'Structured Practice & Skill Development',
      type: 'practice',
      duration: '25 minutes',
      content: {
        overview: `Guided practice session with progressive exercises to develop ${topic} proficiency.`,
        keyPoints: [
          'Progressive skill development approach',
          'Individual feedback and corrections',
          'Partner work and realistic application',
          'Quality control and refinement'
        ],
        demonstrations: [],
        exercises: exercises,
        commonMistakes: this.generateCommonMistakes(topic, context.sport),
        progressionTips: [
          'Master each level before progressing',
          'Focus on consistency over speed',
          'Video record for immediate feedback',
          'Track improvement metrics'
        ]
      }
    }
  }

  /**
   * Create application section
   */
  private static createApplicationSection(topic: string, analysis: any): LessonSection {
    return {
      id: 'application',
      title: 'Live Application & Testing',
      type: 'application',
      duration: '8 minutes',
      content: {
        overview: `Apply ${topic} skills in realistic, game-like scenarios with appropriate pressure and decision-making.`,
        keyPoints: [
          'Realistic scenario application',
          'Decision-making under pressure',
          'Integration with existing skills',
          'Performance under fatigue'
        ],
        demonstrations: [],
        exercises: [
          {
            name: 'Scenario Application',
            description: `Use ${topic} in realistic competitive scenarios`,
            duration: '8 minutes',
            difficulty: 'Advanced',
            equipment: ['Full training setup'],
            instructions: [
              'Apply skills in live scenarios',
              'Focus on timing and decision-making',
              'Adapt to changing conditions',
              'Maintain technique under pressure'
            ],
            progressions: [
              'Controlled scenario practice',
              'Light pressure application',
              'Moderate resistance testing',
              'Full competition simulation'
            ],
            safetyNotes: [
              'Maintain safety protocols',
              'Scale intensity appropriately',
              'Monitor fatigue levels'
            ]
          }
        ],
        commonMistakes: [],
        progressionTips: [
          'Start with high success rates',
          'Gradually increase pressure',
          'Focus on adaptation and problem-solving'
        ]
      }
    }
  }

  /**
   * Create review section
   */
  private static createReviewSection(topic: string, analysis: any): LessonSection {
    return {
      id: 'review',
      title: 'Review, Assessment & Next Steps',
      type: 'review',
      duration: '2 minutes',
      content: {
        overview: `Comprehensive review of ${topic} learning objectives with individual assessment and development planning.`,
        keyPoints: [
          'Learning objective assessment',
          'Individual progress evaluation',
          'Key takeaways identification',
          'Next lesson preparation'
        ],
        demonstrations: [],
        exercises: [],
        commonMistakes: [],
        progressionTips: [
          'Identify 2-3 key improvements made',
          'Set specific practice goals for next session',
          'Review common mistakes to avoid',
          'Plan progressive development pathway'
        ]
      }
    }
  }

  // Helper methods for generating specific content
  private static generateSkillCriteria(objective: string, complexity: string): string[] {
    const basecriteria = [
      'Demonstrates proper form and technique',
      'Shows understanding of timing principles',
      'Applies skill consistently in practice'
    ]

    if (complexity === 'advanced') {
      basecriteria.push(
        'Adapts technique to different scenarios',
        'Maintains effectiveness under pressure',
        'Demonstrates teaching ability to others'
      )
    }

    return basecriteria
  }

  private static generateScoringGuide(complexity: string): string {
    const guides = {
      beginner: 'Score 1-3: 1=Needs significant work, 2=Developing, 3=Proficient',
      intermediate: 'Score 1-4: 1=Needs work, 2=Developing, 3=Proficient, 4=Advanced',
      advanced: 'Score 1-5: 1=Needs work, 2=Developing, 3=Proficient, 4=Advanced, 5=Expert'
    }
    return guides[complexity as keyof typeof guides] || guides.intermediate
  }

  private static generateProgressMarkers(topic: string, analysis: any): string[] {
    return [
      `Can execute ${topic} with proper form 8/10 attempts`,
      'Demonstrates understanding of timing principles',
      'Successfully applies technique under light pressure',
      'Shows improvement from baseline assessment'
    ]
  }

  private static generateMasteryIndicators(topic: string, analysis: any): string[] {
    return [
      `Executes ${topic} fluidly in live scenarios`,
      'Adapts technique to different situations',
      'Teaches technique effectively to others',
      'Integrates seamlessly with existing skill set'
    ]
  }

  private static generateEquipmentList(topic: string, sport: string): string[] {
    const sportEquipment: { [key: string]: string[] } = {
      'brazilian jiu-jitsu': ['Training mats (minimum 1m x 1m per pair)', 'Gi or no-gi training attire', 'Water bottles', 'Towels', 'Timer/stopwatch'],
      'bjj': ['Training mats (minimum 1m x 1m per pair)', 'Gi or no-gi training attire', 'Water bottles', 'Towels', 'Timer/stopwatch'],
      'soccer': ['Soccer balls (1 per 2 players)', 'Training cones (12-16)', 'Goals or target markers', 'Pinnies/bibs for teams', 'Water bottles'],
      'basketball': ['Basketballs (1 per 2 players)', 'Training cones', 'Court markings/tape', 'Water bottles', 'Stopwatch']
    }

    return sportEquipment[sport.toLowerCase()] || ['Sport-specific training equipment', 'Water bottles', 'First aid kit', 'Timer/stopwatch']
  }

  private static generateSetupRequirements(topic: string, sport: string): string[] {
    return [
      'Adequate training space for all participants',
      'Proper safety equipment and first aid available',
      'Clear visual and audio demonstration area',
      'Video recording capability for analysis'
    ]
  }

  private static generateFollowUpSuggestions(topic: string, analysis: any): string[] {
    return [
      `Practice ${topic} fundamentals daily for 10-15 minutes`,
      'Video record practice sessions for self-analysis',
      'Seek feedback from training partners',
      'Progress to next skill level when mastery achieved'
    ]
  }

  private static generateDemonstrationFocus(component: string, topic: string): string[] {
    return [
      `${component} positioning and body mechanics`,
      `Timing cues and movement rhythm`,
      `Key leverage points and pressure application`,
      `Common errors and how to avoid them`
    ]
  }

  private static generateVisualCues(component: string, topic: string): string[] {
    return [
      `Watch instructor's ${component.toLowerCase()} alignment`,
      `Observe smooth, controlled execution`,
      `Note breathing pattern and tension points`,
      `Follow step-by-step progression carefully`
    ]
  }

  private static generateCommonMistakes(topic: string, sport: string): CommonMistake[] {
    // Sport-specific common mistakes
    if (sport.toLowerCase() === 'brazilian jiu-jitsu' && topic.toLowerCase().includes('sweep')) {
      return [
        {
          mistake: 'Attempting sweep without proper grips',
          why: 'Reduces leverage and control over opponent',
          correction: 'Establish strong grips before initiating sweep',
          coachingCue: 'Grips first, then sweep - never rush the setup'
        },
        {
          mistake: 'Using only arm strength for sweep',
          why: 'Inefficient and easily defended',
          correction: 'Use hip movement and leverage, not arm strength',
          coachingCue: 'Hips drive the sweep, arms just guide'
        },
        {
          mistake: 'Poor timing - sweeping when opponent is stable',
          why: 'Opponent can easily counter or resist',
          correction: 'Wait for opponent movement or create off-balance',
          coachingCue: 'Feel their weight shift, then sweep'
        }
      ]
    }

    // Default common mistakes
    return [
      {
        mistake: 'Rushing through technique',
        why: 'Reduces accuracy and effectiveness',
        correction: 'Focus on controlled, deliberate movements',
        coachingCue: 'Slow is smooth, smooth is fast'
      },
      {
        mistake: 'Inconsistent practice habits',
        why: 'Prevents muscle memory development',
        correction: 'Establish regular, focused practice routine',
        coachingCue: 'Consistency beats intensity'
      }
    ]
  }
}