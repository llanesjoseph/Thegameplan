import { LessonStructure, LessonSection, Exercise, CommonMistake, Demonstration } from './lesson-creation-service'

export interface LongFormLessonConfig {
  includeDetailedExplanations: boolean
  includeCoachingInsights: boolean
  includeAssessmentRubrics: boolean
  includeProgressionPathways: boolean
  includeResourceLists: boolean
  wordTarget: 'comprehensive' | 'detailed' | 'extensive'
}

export class EnhancedLessonFormatter {

  /**
   * Generate comprehensive, long-form lesson plan with extensive detail
   */
  static formatLongFormLesson(lesson: LessonStructure, config: LongFormLessonConfig): string {
    const sections = [
      this.formatLongFormHeader(lesson, config),
      this.formatExtendedObjectives(lesson, config),
      this.formatDetailedTimeline(lesson, config),
      ...lesson.sections.map((section, index) => this.formatComprehensiveSection(section, index + 1, lesson, config)),
      this.formatExtensiveAssessment(lesson, config),
      this.formatComprehensiveResources(lesson, config),
      this.formatDevelopmentPathway(lesson, config),
      this.formatQualityAssurance(lesson, config)
    ]

    return sections.join('\n\n---\n\n')
  }

  /**
   * Format comprehensive lesson header with context and background
   */
  private static formatLongFormHeader(lesson: LessonStructure, config: LongFormLessonConfig): string {
    const contextualIntro = config.includeCoachingInsights
      ? this.generateContextualIntroduction(lesson)
      : ''

    return `# ${lesson.title}

## Lesson Overview

**Sport:** ${lesson.sport}
**Level:** ${this.formatLevel(lesson.level)}
**Duration:** ${lesson.duration}
**Focus:** ${this.generateFocusDescription(lesson)}
**Class Size:** ${this.recommendedClassSize(lesson)} (optimal for individual attention)
**Prerequisites:** ${this.generatePrerequisites(lesson)}

${contextualIntro}

### Training Philosophy and Approach

This comprehensive lesson integrates technical mastery with tactical application, ensuring participants not only learn techniques but understand the underlying principles that make them effective. The progression from cooperative learning to live application mirrors the natural learning curve while maintaining safety as the highest priority.

### Lesson Design Principles

**Progressive Skill Building:** Each phase builds systematically on the previous, ensuring solid foundations before advancing complexity.

**Multiple Learning Styles:** Visual demonstration, kinesthetic practice, and analytical explanation address different learning preferences.

**Individual Adaptation:** Techniques and progressions can be modified based on participant experience, body type, and learning pace.

**Safety Integration:** Safety protocols are woven throughout rather than treated as separate elements.`
  }

  /**
   * Format extended learning objectives with measurable outcomes
   */
  private static formatExtendedObjectives(lesson: LessonStructure, config: LongFormLessonConfig): string {
    const baseObjectives = lesson.objectives.map((obj, index) => {
      return `${index + 1}. **${this.extractObjectiveAction(obj)}** ${obj.toLowerCase()} with ${this.generateMeasurableStandard(obj)}`
    })

    const additionalObjectives = config.includeDetailedExplanations ? [
      `${baseObjectives.length + 1}. **Demonstrate tactical decision-making skills** by selecting appropriate techniques based on situational factors and opponent reactions in live training scenarios`,
      `${baseObjectives.length + 2}. **Integrate newly learned concepts** into existing skill sets while maintaining technical quality and safety standards throughout all training phases`
    ] : []

    const allObjectives = [...baseObjectives, ...additionalObjectives]

    return `## Learning Objectives

By the end of this comprehensive lesson, participants will be able to:

${allObjectives.join('\n')}

### Measurable Success Criteria

**Technical Proficiency Standards:**
• Demonstrate ${this.getTechnicalStandard(lesson)}% technical accuracy in cooperative drilling
• Execute techniques with proper form under progressive resistance
• Maintain safety protocols and partner communication throughout all phases

**Application Standards:**
• Successfully apply techniques in structured resistance scenarios
• Show measurable improvement from baseline to final assessment
• Demonstrate understanding of underlying principles through explanation or teaching

**Long-term Development Indicators:**
• Establish clear personal practice goals and development timeline
• Identify areas for continued focus and improvement
• Connect new skills with existing knowledge and experience`
  }

  /**
   * Format detailed lesson timeline with comprehensive phase descriptions
   */
  private static formatDetailedTimeline(lesson: LessonStructure, config: LongFormLessonConfig): string {
    const timelineTable = `| Phase | Duration | Primary Focus | Secondary Elements |
|-------|----------|---------------|-------------------|
${lesson.sections.map(section =>
  `| ${this.formatSectionType(section.type)} | ${section.duration} | ${this.extractPrimaryFocus(section)} | ${this.generateSecondaryElements(section)} |`
).join('\n')}`

    const phaseOverview = config.includeDetailedExplanations
      ? this.generatePhaseOverview(lesson)
      : ''

    return `## Lesson Timeline

${timelineTable}

**Total Duration:** ${lesson.duration}

### Training Progression Philosophy

${phaseOverview}

The lesson structure follows proven pedagogical principles, moving from simple to complex, cooperative to competitive, and individual skill to integrated application. Each phase serves multiple purposes, building not only technical skills but also tactical awareness, safety consciousness, and long-term learning habits.`
  }

  /**
   * Format comprehensive section with extensive detail
   */
  private static formatComprehensiveSection(
    section: LessonSection,
    phaseNumber: number,
    lesson: LessonStructure,
    config: LongFormLessonConfig
  ): string {
    const sectionHeader = `## Phase ${phaseNumber}: ${section.title} (${section.duration})`

    const overviewSection = `### Overview and Purpose

${this.expandSectionOverview(section, config)}

${config.includeCoachingInsights ? this.generateCoachingInsights(section, lesson) : ''}`

    const detailedContent = this.formatDetailedSectionContent(section, config)

    const practicalApplication = config.includeDetailedExplanations
      ? this.generatePracticalApplicationGuidance(section)
      : ''

    return `${sectionHeader}

${overviewSection}

${detailedContent}

${practicalApplication}`
  }

  /**
   * Format detailed section content with comprehensive breakdowns
   */
  private static formatDetailedSectionContent(section: LessonSection, config: LongFormLessonConfig): string {
    let content = `### Key Teaching Points

${section.content.keyPoints.map(point => `• **${this.extractKeywordFromPoint(point)}** - ${this.expandTeachingPoint(point, config)}`).join('\n')}`

    // Add demonstrations with extensive detail
    if (section.content.demonstrations && section.content.demonstrations.length > 0) {
      content += `\n\n### Detailed Instruction and Demonstration\n\n`
      content += section.content.demonstrations.map(demo => this.formatComprehensiveDemo(demo, config)).join('\n\n')
    }

    // Add exercises with comprehensive breakdowns
    if (section.content.exercises && section.content.exercises.length > 0) {
      content += `\n\n### Structured Training Activities\n\n`
      content += section.content.exercises.map((exercise, index) => this.formatComprehensiveExercise(exercise, index + 1, config)).join('\n\n')
    }

    // Add detailed mistake analysis
    if (section.content.commonMistakes && section.content.commonMistakes.length > 0) {
      content += `\n\n### Common Challenges and Solutions\n\n`
      content += section.content.commonMistakes.map(mistake => this.formatDetailedMistakeAnalysis(mistake, config)).join('\n\n')
    }

    // Add progression guidance
    if (section.content.progressionTips && section.content.progressionTips.length > 0) {
      content += `\n\n### Progression and Adaptation Strategies\n\n`
      content += section.content.progressionTips.map(tip => `• **${this.extractProgressionFocus(tip)}:** ${this.expandProgressionTip(tip, config)}`).join('\n')
    }

    return content
  }

  /**
   * Format comprehensive demonstration with extensive teaching detail
   */
  private static formatComprehensiveDemo(demo: Demonstration, config: LongFormLessonConfig): string {
    const basicDemo = `#### ${demo.title}

**Duration and Structure:** ${demo.timing}

**Comprehensive Description:** ${this.expandDemoDescription(demo.description, config)}

**Primary Teaching Focus:**
${demo.keyFocus.map(focus => `• **${this.extractFocusKeyword(focus)}:** ${this.expandFocusPoint(focus, config)}`).join('\n')}

**Student Observation and Learning Points:**
${demo.visualCues.map(cue => `• **${this.extractCueKeyword(cue)}:** ${this.expandVisualCue(cue, config)}`).join('\n')}`

    if (config.includeCoachingInsights) {
      return `${basicDemo}

**Instructional Methodology:**
• **Multiple angles:** Demonstrate from different perspectives to ensure all participants can observe key details
• **Speed variation:** Show technique at different speeds to highlight timing and flow elements
• **Interactive elements:** Encourage questions and provide immediate clarification during demonstration
• **Individual attention:** Monitor participant understanding and provide personalized observation guidance

**Common Teaching Challenges:**
• **Visual obstruction:** Ensure all participants have clear sight lines; reposition as needed
• **Information overload:** Balance comprehensive detail with digestible information chunks
• **Engagement maintenance:** Keep all participants actively involved in observation and analysis
• **Question management:** Address questions without disrupting flow while ensuring understanding`
    }

    return basicDemo
  }

  /**
   * Format comprehensive exercise with detailed instruction
   */
  private static formatComprehensiveExercise(exercise: Exercise, exerciseNumber: number, config: LongFormLessonConfig): string {
    const basicExercise = `#### Exercise ${exerciseNumber}: ${exercise.name}

**Duration and Intensity:** ${exercise.duration}
**Skill Level:** ${exercise.difficulty}

**Comprehensive Description:** ${this.expandExerciseDescription(exercise.description, config)}

**Equipment and Setup Requirements:**
${exercise.equipment.map(item => `• ${this.expandEquipmentItem(item, config)}`).join('\n')}

**Detailed Execution Instructions:**
${exercise.instructions.map((instruction, index) => `${index + 1}. **${this.extractInstructionAction(instruction)}:** ${this.expandInstruction(instruction, config)}`).join('\n')}

**Progressive Development Stages:**
${exercise.progressions.map((progression, index) => `**Stage ${index + 1}:** ${this.expandProgression(progression, config)}`).join('\n')}

**Safety Protocols and Considerations:**
${exercise.safetyNotes.map(note => `• **${this.extractSafetyFocus(note)}:** ${this.expandSafetyNote(note, config)}`).join('\n')}`

    if (config.includeCoachingInsights) {
      return `${basicExercise}

**Coaching Focus Points:**
• **Individual observation:** Monitor each participant for proper technique and safety
• **Immediate feedback:** Provide real-time corrections and encouragement
• **Adaptation guidance:** Help participants modify exercise based on their capabilities
• **Progress tracking:** Note individual improvement and areas needing additional attention

**Quality Control Standards:**
• **Technical accuracy:** Maintain form standards throughout all repetitions
• **Safety compliance:** Ensure all safety protocols are consistently followed
• **Progressive challenge:** Increase difficulty only when current level is mastered
• **Partner cooperation:** Facilitate effective partner communication and mutual learning

**Troubleshooting Common Issues:**
• **Technique breakdown:** Reduce intensity and refocus on fundamental elements
• **Safety concerns:** Immediately address any unsafe practices or behaviors
• **Partner mismatch:** Adjust pairings for optimal learning and safety
• **Equipment problems:** Have backup options ready for equipment failures or shortages`
    }

    return basicExercise
  }

  /**
   * Format extensive assessment section with detailed rubrics
   */
  private static formatExtensiveAssessment(lesson: LessonStructure, config: LongFormLessonConfig): string {
    let assessmentContent = `## Comprehensive Assessment & Evaluation Framework

### Multi-Dimensional Assessment Approach

This assessment system evaluates participants across multiple dimensions to provide comprehensive feedback and establish clear development pathways.`

    // Technical assessment
    assessmentContent += `\n\n### Technical Proficiency Assessment

${lesson.assessment.skillChecks.map(check => this.formatDetailedSkillCheck(check, config)).join('\n\n')}`

    // Tactical assessment
    if (config.includeAssessmentRubrics) {
      assessmentContent += `\n\n### Tactical Application Assessment

**Decision Making Quality:**
• **Excellent (90-100%):** Consistently chooses appropriate techniques based on situational factors and opponent positioning
• **Proficient (80-89%):** Generally makes good tactical decisions with occasional guidance needed
• **Developing (70-79%):** Shows understanding of concepts but requires practice for consistent application
• **Needs Improvement (Below 70%):** Requires significant coaching for appropriate tactical choices

**Adaptation Ability:**
• **Excellent:** Quickly modifies approach based on resistance and changing circumstances
• **Proficient:** Adapts techniques with coaching support and demonstrates learning ability
• **Developing:** Shows capacity for adaptation but requires guided practice for consistency
• **Needs Improvement:** Struggles with adaptation and requires individual instruction focus`
    }

    // Progress markers
    assessmentContent += `\n\n### Progress Markers and Development Indicators

**Immediate Progress Markers:**
${lesson.assessment.progressMarkers.map(marker => `• ${this.expandProgressMarker(marker, config)}`).join('\n')}

**Mastery Indicators:**
${lesson.assessment.masteryIndicators.map(indicator => `• ${this.expandMasteryIndicator(indicator, config)}`).join('\n')}`

    // Long-term assessment if configured
    if (config.includeProgressionPathways) {
      assessmentContent += `\n\n### Long-term Development Timeline

**Week 1-2 Post-Lesson:**
• Technical consistency: 70%+ success rate in cooperative drilling
• Concept understanding: Ability to explain core principles to others
• Safety standards: Independent training with appropriate control

**Month 1 Post-Lesson:**
• Resistance handling: Successful application against 25-50% resistance
• Integration progress: Natural inclusion in regular training sessions
• Teaching ability: Can guide newer students through basic elements

**Month 2-3 Post-Lesson:**
• Advanced application: Success against 75%+ resistance from experienced partners
• Chain development: Smooth transitions between multiple technique options
• Competition readiness: Techniques suitable for tournament application

**6 Months Post-Lesson:**
• Expert application: Reliable technique execution under full resistance
• Teaching proficiency: Able to instruct techniques to others effectively
• Innovation capability: Personal adaptations and variations developed
• Advanced integration: Techniques become natural part of personal game`
    }

    return assessmentContent
  }

  /**
   * Format comprehensive resources section
   */
  private static formatComprehensiveResources(lesson: LessonStructure, config: LongFormLessonConfig): string {
    let resourceContent = `## Comprehensive Resources & Requirements

### Essential Equipment and Facility Requirements

**Individual Participant Equipment:**
${lesson.resources.equipment.map(item => `• ${this.expandEquipmentRequirement(item, config)}`).join('\n')}

**Facility and Environmental Requirements:**
${lesson.resources.setupRequirements.map(req => `• ${this.expandSetupRequirement(req, config)}`).join('\n')}

**Instructional Support Materials:**
${lesson.resources.additionalMaterials.map(material => `• ${this.expandAdditionalMaterial(material, config)}`).join('\n')}`

    if (config.includeResourceLists) {
      resourceContent += `\n\n### Safety and Emergency Protocols

**Immediate Response Procedures:**
• **Injury assessment:** Protocol for evaluating and responding to training injuries
• **Emergency contacts:** List of emergency services and participant emergency contacts
• **Medical considerations:** Awareness of participant medical conditions or limitations
• **Communication systems:** Clear methods for stopping training if safety concerns arise

**Risk Management Elements:**
• **Participant screening:** Assessment of physical readiness and injury history
• **Intensity progression:** Systematic increase in training intensity with safety monitoring
• **Environmental safety:** Regular checking of training area for hazards or problems
• **Equipment inspection:** Regular assessment of mat conditions and safety equipment`
    }

    return resourceContent
  }

  /**
   * Format development pathway section
   */
  private static formatDevelopmentPathway(lesson: LessonStructure, config: LongFormLessonConfig): string {
    if (!config.includeProgressionPathways) {
      return this.formatBasicFollowUp(lesson)
    }

    return `## Long-term Development Pathway and Continued Learning

### Recommended Practice Schedule

**Daily Skill Maintenance (15-20 minutes):**
• **Technical drilling:** 10 minutes of cooperative practice focusing on precision
• **Visualization:** 5 minutes of mental rehearsal and concept review
• **Problem identification:** Brief assessment of areas needing additional work

**Weekly Development Sessions (45-60 minutes, 2-3 times per week):**
• **Progressive resistance:** Practice with gradually increasing resistance levels
• **Chain integration:** Work on connecting primary techniques with complementary skills
• **Live application:** Use techniques during regular training sessions
• **Video analysis:** Review personal practice sessions for technical refinement

**Monthly Assessment and Goal Setting (30 minutes):**
• **Progress evaluation:** Assessment of technical improvement and consistency
• **Goal adjustment:** Modification of training objectives based on progress
• **Advanced technique introduction:** Addition of new elements when ready
• **Training partnership evaluation:** Assessment of practice partner effectiveness

### Advanced Learning Opportunities

**Workshop and Seminar Participation:**
• **Specialization seminars:** Advanced workshops focusing on specific technical systems
• **Competition preparation:** Tournament-focused training with rule-specific applications
• **Instructor development:** Teaching methodology workshops for sharing knowledge with others
• **Cross-training integration:** Application to related martial arts and combat sports

**Video Study and Analysis:**
• **Elite competitor analysis:** Study of world-class athletes using similar techniques
• **Personal training review:** Regular analysis of personal training footage for improvement
• **Technique variation research:** Investigation of different applications and setups
• **Defense study:** Understanding defensive concepts to improve offensive strategies

### Community and Support Resources

**Training Partner Networks:**
• **Skill-appropriate partners:** Connection with training partners at similar levels
• **Mentor relationships:** Pairing with advanced practitioners for guidance
• **Teaching opportunities:** Connections with newer students for instruction practice
• **Competition partners:** Training relationships focused on tournament preparation

**Online Learning Communities:**
• **Technical discussion forums:** Platforms for asking questions and sharing insights
• **Video sharing groups:** Communities for sharing training footage and receiving feedback
• **Competition analysis:** Groups focused on studying high-level competition footage
• **Instructor resources:** Access to teaching materials and development tools`
  }

  /**
   * Format quality assurance section
   */
  private static formatQualityAssurance(lesson: LessonStructure, config: LongFormLessonConfig): string {
    if (!config.includeCoachingInsights) {
      return ''
    }

    return `## Quality Assurance and Continuous Improvement

### Lesson Effectiveness Monitoring

**Participant Feedback Systems:**
• **Immediate post-lesson assessment:** Brief evaluation of lesson quality and learning effectiveness
• **Follow-up surveys:** Longer-term assessment of skill retention and application success
• **Suggestion integration:** Regular incorporation of participant feedback into lesson improvements
• **Learning outcome tracking:** Long-term monitoring of participant skill development and progress

**Instructor Development and Standards:**
• **Continuing education:** Regular participation in advanced instructor training and certification
• **Technique refinement:** Ongoing personal skill development to maintain teaching quality
• **Pedagogical improvement:** Enhancement of teaching methods and communication effectiveness
• **Safety certification:** Maintenance of current safety training and first aid qualifications

### Lesson Adaptation and Customization

**Individual Learning Differences:**
• **Learning style accommodation:** Adaptation of instruction methods for different learning preferences
• **Physical limitation modifications:** Technique adjustments for participants with injuries or physical restrictions
• **Experience level scaling:** Appropriate challenge levels for participants with varying backgrounds
• **Cultural sensitivity:** Awareness and accommodation of diverse cultural backgrounds and expectations

**Environmental Adaptations:**
• **Space limitations:** Modification of exercises and activities based on available training area
• **Equipment variations:** Alternative approaches when standard equipment is unavailable
• **Time constraints:** Efficient lesson modifications when full duration is not available
• **Group size adjustments:** Scaling activities appropriately for different class sizes

---

*This comprehensive lesson framework represents the integration of advanced technical knowledge with proven educational methodology. The detailed structure ensures both immediate learning success and long-term skill development while maintaining the highest safety standards throughout all training phases.*

*The extensive format provides instructors with the depth necessary for expert-level instruction while giving participants clear understanding of expectations, progressions, and development pathways for continued growth.*`
  }

  // Helper methods for content expansion

  private static expandSectionOverview(section: LessonSection, config: LongFormLessonConfig): string {
    const baseOverview = section.content.overview

    if (!config.includeDetailedExplanations) {
      return baseOverview
    }

    // Add expanded context and reasoning
    return `${baseOverview}

This phase serves multiple critical functions beyond its primary objective. It builds foundational understanding while preparing participants for the next level of complexity. The activities are designed to address different learning styles and physical capabilities, ensuring all participants can engage effectively regardless of their background or experience level.

The structured approach allows for individual attention and modification while maintaining group cohesion and learning momentum. Safety protocols are integrated throughout rather than treated as separate elements, creating habits that will serve participants throughout their training journey.`
  }

  private static generateCoachingInsights(section: LessonSection, lesson: LessonStructure): string {
    return `### Coaching Insights and Best Practices

**Key Teaching Challenges:**
• **Individual variation:** Participants will progress at different rates; maintain patience and provide individual guidance
• **Safety balance:** Challenge participants appropriately while maintaining absolute safety standards
• **Engagement maintenance:** Keep all participants actively involved even when focusing on individual corrections
• **Energy management:** Monitor group energy and adjust activities to maintain optimal learning conditions

**Expert Instruction Tips:**
• **Multiple demonstrations:** Show techniques from different angles and at various speeds for comprehensive understanding
• **Progressive complexity:** Build skills systematically rather than jumping to advanced applications
• **Immediate feedback:** Provide real-time corrections and encouragement to accelerate learning
• **Individual adaptation:** Modify techniques based on participant body type, experience, and learning style`
  }

  private static getTechnicalStandard(lesson: LessonStructure): number {
    // Return appropriate technical standard based on lesson level
    switch (lesson.level.toLowerCase()) {
      case 'beginner': return 70
      case 'intermediate': return 80
      case 'advanced': return 85
      default: return 75
    }
  }

  // Additional helper methods would continue here...
  // (Implementation of remaining helper methods following the same detailed pattern)

  private static formatLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  private static generateFocusDescription(lesson: LessonStructure): string {
    return `Technical mastery and practical application of ${lesson.title.toLowerCase()}`
  }

  private static recommendedClassSize(lesson: LessonStructure): string {
    return "8-12 participants"
  }

  private static generatePrerequisites(lesson: LessonStructure): string {
    return "Basic understanding of fundamental movements and safety protocols"
  }

  private static generateContextualIntroduction(lesson: LessonStructure): string {
    return `### Training Philosophy and Context

This lesson integrates championship-level technical knowledge with proven educational methodology, designed to bridge the gap between basic instruction and elite-level application.`
  }

  private static extractObjectiveAction(objective: string): string {
    const actionWords = objective.match(/^(\w+)/)?.[0] || 'Master'
    return actionWords.charAt(0).toUpperCase() + actionWords.slice(1)
  }

  private static generateMeasurableStandard(objective: string): string {
    return "measurable proficiency and consistent application"
  }

  private static formatSectionType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')
  }

  private static extractPrimaryFocus(section: LessonSection): string {
    return section.content.overview.split('.')[0] || section.title
  }

  private static generateSecondaryElements(section: LessonSection): string {
    return "Individual feedback, safety monitoring, skill assessment"
  }

  private static generatePhaseOverview(lesson: LessonStructure): string {
    return "Each phase builds systematically on the previous, ensuring solid foundations before advancing complexity."
  }

  private static extractKeywordFromPoint(point: string): string {
    return point.split(' ')[0] || 'Focus'
  }

  private static expandTeachingPoint(point: string, config: LongFormLessonConfig): string {
    return config.includeDetailedExplanations
      ? `${point} This element is crucial for developing proper technique and maintaining safety throughout the learning process.`
      : point
  }

  private static formatBasicFollowUp(lesson: LessonStructure): string {
    return `## Follow-up and Next Steps

### Continued Development
${lesson.resources.followUpSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}`
  }

  // Placeholder implementations for remaining helper methods
  private static generatePracticalApplicationGuidance(section: LessonSection): string { return '' }
  private static expandDemoDescription(description: string, config: LongFormLessonConfig): string { return description }
  private static extractFocusKeyword(focus: string): string { return focus.split(' ')[0] || 'Focus' }
  private static expandFocusPoint(focus: string, config: LongFormLessonConfig): string { return focus }
  private static extractCueKeyword(cue: string): string { return cue.split(' ')[0] || 'Observe' }
  private static expandVisualCue(cue: string, config: LongFormLessonConfig): string { return cue }
  private static expandExerciseDescription(description: string, config: LongFormLessonConfig): string { return description }
  private static expandEquipmentItem(item: string, config: LongFormLessonConfig): string { return item }
  private static extractInstructionAction(instruction: string): string { return instruction.split(' ')[0] || 'Step' }
  private static expandInstruction(instruction: string, config: LongFormLessonConfig): string { return instruction }
  private static expandProgression(progression: string, config: LongFormLessonConfig): string { return progression }
  private static extractSafetyFocus(note: string): string { return note.split(' ')[0] || 'Safety' }
  private static expandSafetyNote(note: string, config: LongFormLessonConfig): string { return note }
  private static formatDetailedSkillCheck(check: any, config: LongFormLessonConfig): string { return `#### ${check.skill}\n${check.criteria.map((c: string) => `• ${c}`).join('\n')}` }
  private static expandProgressMarker(marker: string, config: LongFormLessonConfig): string { return marker }
  private static expandMasteryIndicator(indicator: string, config: LongFormLessonConfig): string { return indicator }
  private static expandEquipmentRequirement(item: string, config: LongFormLessonConfig): string { return item }
  private static expandSetupRequirement(req: string, config: LongFormLessonConfig): string { return req }
  private static expandAdditionalMaterial(material: string, config: LongFormLessonConfig): string { return material }
  private static formatDetailedMistakeAnalysis(mistake: CommonMistake, config: LongFormLessonConfig): string {
    return `#### ${mistake.mistake}\n\n**Why this happens:** ${mistake.why}\n\n**Correction method:** ${mistake.correction}\n\n**Coaching cue:** "${mistake.coachingCue}"`
  }
  private static extractProgressionFocus(tip: string): string { return tip.split(' ')[0] || 'Focus' }
  private static expandProgressionTip(tip: string, config: LongFormLessonConfig): string { return tip }
}