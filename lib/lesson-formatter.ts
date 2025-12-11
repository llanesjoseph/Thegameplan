import { LessonStructure, LessonSection, Exercise, CommonMistake, Demonstration } from './lesson-creation-service'

export class LessonFormatter {

  /**
   * Format complete lesson structure as professional document
   */
  static formatCompleteLesson(lesson: LessonStructure): string {
    return `# ${lesson.title}

${this.formatLessonHeader(lesson)}

${this.formatLearningObjectives(lesson.objectives)}

${this.formatPrerequisites(lesson)}

${this.formatLessonOverview(lesson)}

${lesson.sections.map(section => this.formatSection(section)).join('\n\n---\n\n')}

${this.formatAssessment(lesson)}

${this.formatResources(lesson)}

${this.formatNextSteps(lesson)}

---

*Created with AI assistance for structured lesson planning. Always consult qualified instructors for safety and technique verification.*`
  }

  /**
   * Format lesson header with key information
   */
  private static formatLessonHeader(lesson: LessonStructure): string {
    return `
## Lesson Overview

**Sport:** ${lesson.sport}
**Level:** ${lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
**Duration:** ${lesson.duration}
**Focus Areas:** Technical, Tactical, Application
**Class Size:** 4-12 participants (optimal)
`
  }

  /**
   * Format learning objectives
   */
  private static formatLearningObjectives(objectives: string[]): string {
    return `
## Learning Objectives

By the end of this lesson, participants will be able to:

${objectives.map((obj, index) => `${index + 1}. ${obj}`).join('\n')}
`
  }

  /**
   * Format prerequisites
   */
  private static formatPrerequisites(lesson: LessonStructure): string {
    return `
## Prerequisites & Preparation

**Before this lesson, participants should:**
• Have basic understanding of fundamental movements
• Be physically warmed up and prepared for training
• Have appropriate training attire and equipment
• Be mentally focused and ready to learn

**Instructor Preparation:**
• Review lesson plan and key teaching points
• Prepare equipment and training space
• Have backup exercises for different skill levels
• Plan individual modification strategies
`
  }

  /**
   * Format lesson overview with timeline
   */
  private static formatLessonOverview(lesson: LessonStructure): string {
    return `
## Lesson Timeline

${lesson.sections.map(section =>
  `**${this.formatSectionType(section.type)}** (${section.duration}) - ${section.title}`
).join('\n')}

**Total Duration:** ${lesson.duration}
`
  }

  /**
   * Format individual lesson section
   */
  private static formatSection(section: LessonSection): string {
    let sectionContent = `## ${section.title}

**Duration:** ${section.duration}
**Type:** ${this.formatSectionType(section.type)}

### Overview
${section.content.overview}

### Key Teaching Points
${section.content.keyPoints.map(point => `• ${point}`).join('\n')}
`

    // Add demonstrations if present
    if (section.content.demonstrations && section.content.demonstrations.length > 0) {
      sectionContent += `\n### Demonstrations\n\n`
      sectionContent += section.content.demonstrations.map(demo => this.formatDemonstration(demo)).join('\n\n')
    }

    // Add exercises if present
    if (section.content.exercises && section.content.exercises.length > 0) {
      sectionContent += `\n### Exercises\n\n`
      sectionContent += section.content.exercises.map(exercise => this.formatExercise(exercise)).join('\n\n')
    }

    // Add common mistakes if present
    if (section.content.commonMistakes && section.content.commonMistakes.length > 0) {
      sectionContent += `\n### Common Mistakes to Address\n\n`
      sectionContent += section.content.commonMistakes.map(mistake => this.formatCommonMistake(mistake)).join('\n\n')
    }

    // Add progression tips if present
    if (section.content.progressionTips && section.content.progressionTips.length > 0) {
      sectionContent += `\n### Progression Tips\n\n`
      sectionContent += section.content.progressionTips.map(tip => `• ${tip}`).join('\n')
    }

    return sectionContent
  }

  /**
   * Format demonstration
   */
  private static formatDemonstration(demo: Demonstration): string {
    return `#### ${demo.title}
**Duration:** ${demo.timing}

**Description:** ${demo.description}

**Teaching Focus:**
${demo.keyFocus.map(focus => `• ${focus}`).join('\n')}

**Student Observation Points:**
${demo.visualCues.map(cue => `• ${cue}`).join('\n')}`
  }

  /**
   * Format exercise with professional structure
   */
  private static formatExercise(exercise: Exercise): string {
    return `#### ${exercise.name}

**Duration:** ${exercise.duration}
**Difficulty:** ${exercise.difficulty}

**Description:** ${exercise.description}

**Equipment Needed:**
${exercise.equipment.map(item => `• ${item}`).join('\n')}

**Step-by-Step Instructions:**
${exercise.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

**Progressive Stages:**
${exercise.progressions.map((progression, index) => `Stage ${index + 1}: ${progression}`).join('\n')}

**Safety Notes:**
${exercise.safetyNotes.map(note => `• ${note}`).join('\n')}`
  }

  /**
   * Format common mistake with correction
   */
  private static formatCommonMistake(mistake: CommonMistake): string {
    return `#### ${mistake.mistake}

**Why this happens:** ${mistake.why}

**Correction method:** ${mistake.correction}

**Coaching cue:** "${mistake.coachingCue}"`
  }

  /**
   * Format assessment section
   */
  private static formatAssessment(lesson: LessonStructure): string {
    return `
## Assessment & Evaluation

### Skill Checks
${lesson.assessment.skillChecks.map(check => `
#### ${check.skill}
**Criteria:**
${check.criteria.map(criterion => `• ${criterion}`).join('\n')}

**Scoring:** ${check.scoringGuide}
`).join('\n')}

### Progress Markers
${lesson.assessment.progressMarkers.map(marker => `• ${marker}`).join('\n')}

### Mastery Indicators
${lesson.assessment.masteryIndicators.map(indicator => `• ${indicator}`).join('\n')}
`
  }

  /**
   * Format resources section
   */
  private static formatResources(lesson: LessonStructure): string {
    return `
## Resources & Equipment

### Required Equipment
${lesson.resources.equipment.map(item => `• ${item}`).join('\n')}

### Setup Requirements
${lesson.resources.setupRequirements.map(req => `• ${req}`).join('\n')}

### Additional Materials
${lesson.resources.additionalMaterials.map(material => `• ${material}`).join('\n')}
`
  }

  /**
   * Format next steps section
   */
  private static formatNextSteps(lesson: LessonStructure): string {
    return `
## Next Steps & Follow-Up

### For Students
${lesson.resources.followUpSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}

### For Instructors
• Review lesson effectiveness and student progress
• Identify students needing additional support
• Plan modifications for next lesson
• Update individual student development plans

### Homework/Practice Assignment
• Practice core movements for 15 minutes daily
• Video record practice sessions for self-analysis
• Identify one area for focused improvement
• Prepare questions for next lesson
`
  }

  /**
   * Helper methods for formatting
   */
  private static getSectionIcon(type: string): string {
    const icons = {
      introduction: '🎯',
      demonstration: '🎬',
      practice: '🏃‍♂️',
      application: '⚡',
      review: '📋'
    }
    return icons[type as keyof typeof icons] || '📚'
  }

  private static formatSectionType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  /**
   * Generate lesson summary for quick reference
   */
  static generateQuickReference(lesson: LessonStructure): string {
    return `# Quick Reference: ${lesson.title}

## Key Points
${lesson.objectives.map(obj => `• ${obj}`).join('\n')}

## Timeline
${lesson.sections.map(section => `**${section.duration}** - ${section.title}`).join('\n')}

## Equipment
${lesson.resources.equipment.slice(0, 5).join(', ')}

## Success Criteria
${lesson.assessment.progressMarkers.slice(0, 3).join('\n')}`
  }

  /**
   * Format for different output types
   */
  static formatForOutputType(lesson: LessonStructure, outputType: 'full' | 'summary' | 'instructor' | 'student'): string {
    switch (outputType) {
      case 'full':
        return this.formatCompleteLesson(lesson)
      case 'summary':
        return this.generateQuickReference(lesson)
      case 'instructor':
        return this.formatInstructorVersion(lesson)
      case 'student':
        return this.formatStudentVersion(lesson)
      default:
        return this.formatCompleteLesson(lesson)
    }
  }

  private static formatInstructorVersion(lesson: LessonStructure): string {
    return `# Instructor Guide: ${lesson.title}

${this.formatLessonHeader(lesson)}

## Teaching Sequence
${lesson.sections.map(section => `
### ${section.title} (${section.duration})
${section.content.keyPoints.map(point => `• ${point}`).join('\n')}
`).join('\n')}

## Critical Teaching Points
• Focus on safety throughout all exercises
• Provide individual feedback and modifications
• Monitor student fatigue and adjust intensity
• Encourage questions and clarification

## Assessment Strategy
${lesson.assessment.skillChecks.map(check => `• ${check.skill}: ${check.criteria[0]}`).join('\n')}`
  }

  private static formatStudentVersion(lesson: LessonStructure): string {
    return `# Student Handout: ${lesson.title}

## What You'll Learn
${lesson.objectives.map(obj => `• ${obj}`).join('\n')}

## What to Bring
${lesson.resources.equipment.filter(item => !item.includes('instructor') && !item.includes('setup')).join('\n')}

## Practice Goals
${lesson.assessment.progressMarkers.map(marker => `• ${marker}`).join('\n')}

## Homework
${lesson.resources.followUpSuggestions.map(suggestion => `• ${suggestion}`).join('\n')}`
  }
}