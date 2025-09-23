import { CoachingContext } from './ai-service'

// User progress tracking interface
export interface UserProgress {
  userId: string
  sport: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  focusAreas: string[]
  strengths: string[]
  weaknessesAreas: string[]
  recentQuestions: string[]
  practiceFrequency: 'daily' | 'weekly' | 'sporadic'
  goals: string[]
  lastAssessment: Date
}

// Comprehensive skill assessment
export interface SkillAssessment {
  technical: number // 1-10
  tactical: number // 1-10
  physical: number // 1-10
  mental: number // 1-10
  experience: number // 1-10
  areas: {
    needsWork: string[]
    developing: string[]
    strengths: string[]
  }
}

// Training recommendation system
export interface TrainingRecommendation {
  priority: 'high' | 'medium' | 'low'
  skillArea: string
  description: string
  exercises: Exercise[]
  timeFrame: string
  progressMarkers: string[]
}

export interface Exercise {
  name: string
  description: string
  duration: string
  repetitions?: string
  progression: string[]
  equipment: string[]
  safetyNotes: string[]
}

// Personalized coaching engine
export class PersonalizedCoachingEngine {

  /**
   * Analyze user's question to infer skill level and focus areas
   */
  static analyzeQuestionForPersonalization(question: string, context: CoachingContext): {
    inferredLevel: string,
    focusAreas: string[],
    questionType: string,
    urgency: string
  } {
    const q = question.toLowerCase()

    // Skill level inference
    let inferredLevel = 'intermediate' // default
    if (q.includes('beginner') || q.includes('start') || q.includes('learn') || q.includes('how to begin')) {
      inferredLevel = 'beginner'
    } else if (q.includes('advanced') || q.includes('elite') || q.includes('competition') || q.includes('master')) {
      inferredLevel = 'advanced'
    } else if (q.includes('professional') || q.includes('college') || q.includes('scholarship')) {
      inferredLevel = 'elite'
    }

    // Focus area detection
    const focusAreas: string[] = []

    // Technical skills
    if (q.includes('technique') || q.includes('form') || q.includes('mechanics')) {
      focusAreas.push('technical')
    }

    // Tactical understanding
    if (q.includes('strategy') || q.includes('tactics') || q.includes('positioning') || q.includes('decision')) {
      focusAreas.push('tactical')
    }

    // Physical conditioning
    if (q.includes('strength') || q.includes('fitness') || q.includes('speed') || q.includes('endurance')) {
      focusAreas.push('physical')
    }

    // Mental performance
    if (q.includes('mental') || q.includes('confidence') || q.includes('pressure') || q.includes('nerves')) {
      focusAreas.push('mental')
    }

    // Question type categorization
    let questionType = 'skill-development'
    if (q.includes('drill') || q.includes('practice') || q.includes('exercise')) {
      questionType = 'practice-focused'
    } else if (q.includes('game') || q.includes('match') || q.includes('competition')) {
      questionType = 'performance-focused'
    } else if (q.includes('injury') || q.includes('pain') || q.includes('prevent')) {
      questionType = 'safety-focused'
    }

    // Urgency assessment
    let urgency = 'normal'
    if (q.includes('urgent') || q.includes('emergency') || q.includes('pain') || q.includes('injury')) {
      urgency = 'high'
    } else if (q.includes('tomorrow') || q.includes('next week') || q.includes('soon')) {
      urgency = 'medium'
    }

    return { inferredLevel, focusAreas, questionType, urgency }
  }

  /**
   * Generate personalized training recommendations
   */
  static generatePersonalizedRecommendations(
    analysis: ReturnType<typeof PersonalizedCoachingEngine.analyzeQuestionForPersonalization>,
    context: CoachingContext
  ): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = []

    // Technical skill recommendations
    if (analysis.focusAreas.includes('technical')) {
      if (context.sport === 'Soccer') {
        recommendations.push({
          priority: 'high',
          skillArea: 'Ball Control',
          description: 'Master your first touch and close control for better decision-making',
          exercises: [
            {
              name: 'Wall Pass Mastery',
              description: 'One-touch passing against a wall to improve first touch',
              duration: '15 minutes',
              repetitions: '100 touches',
              progression: ['Stationary', 'Moving', 'Under pressure', 'Both feet'],
              equipment: ['Soccer ball', 'Wall or rebounder'],
              safetyNotes: ['Warm up properly', 'Start slow, build speed', 'Use proper technique']
            },
            {
              name: 'Cone Control Circuit',
              description: 'Dribbling through cones with various touches',
              duration: '10 minutes',
              repetitions: '5 circuits',
              progression: ['Inside foot only', 'Outside foot only', 'Both feet', 'Sole touches'],
              equipment: ['Soccer ball', '8-10 cones'],
              safetyNotes: ['Keep head up', 'Control pace', 'Focus on precision']
            }
          ],
          timeFrame: '2-4 weeks for noticeable improvement',
          progressMarkers: ['Consistent first touch', 'Increased touch frequency', 'Better decision speed']
        })
      } else if (context.sport === 'Brazilian Jiu-Jitsu') {
        recommendations.push({
          priority: 'high',
          skillArea: 'Position Control',
          description: 'Develop systematic position control and transitions',
          exercises: [
            {
              name: 'Shrimp Mobility Ladder',
              description: 'Hip escape movement pattern for guard retention',
              duration: '10 minutes',
              repetitions: '20 movements down mat',
              progression: ['Slow and controlled', 'Increase speed', 'Add resistance', 'Competition pace'],
              equipment: ['Mat space'],
              safetyNotes: ['Proper hip mechanics', 'No rushing', 'Listen to your body']
            }
          ],
          timeFrame: '3-6 weeks for muscle memory',
          progressMarkers: ['Smooth hip movement', 'Automatic responses', 'Increased retention time']
        })
      }
    }

    // Mental performance recommendations
    if (analysis.focusAreas.includes('mental')) {
      recommendations.push({
        priority: 'medium',
        skillArea: 'Mental Preparation',
        description: 'Build confidence and pressure management skills',
        exercises: [
          {
            name: 'Visualization Training',
            description: 'Mental rehearsal of successful performance',
            duration: '10 minutes',
            repetitions: 'Daily',
            progression: ['Simple scenarios', 'Complex situations', 'Pressure moments', 'Competition simulation'],
            equipment: ['Quiet space', 'Optional: headphones'],
            safetyNotes: ['Stay relaxed', 'Use positive imagery only', 'Be specific in visualization']
          },
          {
            name: 'Pressure Breathing',
            description: 'Controlled breathing for stress management',
            duration: '5 minutes',
            repetitions: '3 times daily',
            progression: ['Basic 4-7-8 breathing', 'Extended holds', 'Movement integration', 'Game application'],
            equipment: ['None'],
            safetyNotes: ['Never force breathing', 'Stop if dizzy', 'Practice regularly']
          }
        ],
        timeFrame: '4-6 weeks for habit formation',
        progressMarkers: ['Calmer under pressure', 'Consistent performance', 'Better focus']
      })
    }

    return recommendations
  }

  /**
   * Create personalized coaching addendum
   */
  static generatePersonalizedAddendum(
    question: string,
    context: CoachingContext,
    baseResponse: string
  ): string {
    const analysis = this.analyzeQuestionForPersonalization(question, context)
    const recommendations = this.generatePersonalizedRecommendations(analysis, context)

    let addendum = `\n\n---\n\n## 🎯 Personalized Training Plan\n\n`

    // Add skill level guidance
    addendum += `**Your Profile:** ${analysis.inferredLevel.charAt(0).toUpperCase() + analysis.inferredLevel.slice(1)} level athlete\n\n`

    // Add priority focus areas
    if (analysis.focusAreas.length > 0) {
      addendum += `**Priority Areas:** ${analysis.focusAreas.map(area => area.charAt(0).toUpperCase() + area.slice(1)).join(', ')}\n\n`
    }

    // Add immediate action items
    addendum += `## 📋 This Week's Action Items\n\n`

    if (recommendations.length > 0) {
      const highPriority = recommendations.filter(r => r.priority === 'high')[0]
      if (highPriority && highPriority.exercises.length > 0) {
        const exercise = highPriority.exercises[0]
        addendum += `**Daily Practice:** ${exercise.name}\n`
        addendum += `• **Time:** ${exercise.duration}\n`
        addendum += `• **Focus:** ${exercise.description}\n`
        addendum += `• **Equipment:** ${exercise.equipment.join(', ')}\n\n`
      }
    }

    // Add progression tracking
    addendum += `## 📈 Track Your Progress\n\n`
    addendum += `**Week 1-2 Goals:**\n`
    addendum += `• Focus on technique over speed\n`
    addendum += `• Establish consistent practice routine\n`
    addendum += `• Master basic movements\n\n`

    addendum += `**Week 3-4 Goals:**\n`
    addendum += `• Increase intensity and speed\n`
    addendum += `• Add complexity to exercises\n`
    addendum += `• Practice under light pressure\n\n`

    // Add motivation based on context
    const motivation = context.responseStyle.encouragement[Math.floor(Math.random() * context.responseStyle.encouragement.length)]
    addendum += `## 💪 Your Coach's Note\n\n`
    addendum += `${motivation} Remember, every champion was once a beginner who refused to give up. Your commitment to asking the right questions shows you have the mindset for success.\n\n`

    // Add safety reminder
    if (analysis.urgency === 'high' || analysis.questionType === 'safety-focused') {
      addendum += `## ⚠️ Safety Reminder\n\n`
      addendum += `**Listen to your body** - Any pain or discomfort means stop immediately. Proper progression prevents injuries. When in doubt, consult a qualified coach or medical professional.\n\n`
    }

    // Add next steps
    addendum += `## 🚀 Next Steps\n\n`
    addendum += `1. **Start Today:** Begin with the daily practice above\n`
    addendum += `2. **Track Progress:** Keep notes on what works\n`
    addendum += `3. **Ask Questions:** Come back with specific challenges\n`
    addendum += `4. **Stay Consistent:** Small daily improvements lead to big results\n\n`

    addendum += `Keep pushing yourself - ${context.responseStyle.signatureClosing}`

    return addendum
  }

  /**
   * Enhance any AI response with personalization
   */
  static enhanceResponseWithPersonalization(
    question: string,
    context: CoachingContext,
    baseResponse: string
  ): string {
    // For questions that benefit from personalization
    const analysis = this.analyzeQuestionForPersonalization(question, context)

    // Only add personalization for sports questions that aren't already comprehensive
    if (analysis.focusAreas.length > 0 && baseResponse.length < 1500) {
      return baseResponse + this.generatePersonalizedAddendum(question, context, baseResponse)
    }

    return baseResponse
  }
}

// Safety and injury prevention system
export class SafetyCoachingSystem {

  /**
   * Detect potential safety concerns in questions
   */
  static analyzeSafetyConcerns(question: string): {
    hasConcerns: boolean,
    riskLevel: 'low' | 'medium' | 'high',
    concerns: string[],
    recommendations: string[]
  } {
    const q = question.toLowerCase()
    const concerns: string[] = []
    const recommendations: string[] = []

    // Pain and injury keywords
    if (q.includes('pain') || q.includes('hurt') || q.includes('injury') || q.includes('sore')) {
      concerns.push('Pain or injury mentioned')
      recommendations.push('Consult a medical professional for persistent pain')
      recommendations.push('Stop activity if pain worsens')
    }

    // Overtraining indicators
    if (q.includes('tired') || q.includes('exhausted') || q.includes('everyday') || q.includes('constantly')) {
      concerns.push('Potential overtraining')
      recommendations.push('Include rest days in your training')
      recommendations.push('Listen to your body and adjust intensity')
    }

    // Technique safety
    if (q.includes('fast') || q.includes('maximum') || q.includes('intense') || q.includes('hard as possible')) {
      concerns.push('High intensity approach mentioned')
      recommendations.push('Build intensity gradually')
      recommendations.push('Master technique before increasing speed/power')
    }

    const riskLevel = concerns.length === 0 ? 'low' : concerns.length === 1 ? 'medium' : 'high'

    return {
      hasConcerns: concerns.length > 0,
      riskLevel,
      concerns,
      recommendations
    }
  }

  /**
   * Generate safety addendum for responses
   */
  static generateSafetyAddendum(question: string, context: CoachingContext): string {
    const safety = this.analyzeSafetyConcerns(question)

    if (!safety.hasConcerns) {
      return `\n\n## ⚡ Safety Notes\n\n• Always warm up before training\n• Progress gradually to avoid injury\n• Stay hydrated and listen to your body\n• If you feel pain, stop and assess`
    }

    let addendum = `\n\n## ⚠️ Important Safety Considerations\n\n`

    if (safety.concerns.length > 0) {
      addendum += `**Potential concerns identified:**\n`
      safety.concerns.forEach(concern => {
        addendum += `• ${concern}\n`
      })
      addendum += `\n`
    }

    if (safety.recommendations.length > 0) {
      addendum += `**Safety recommendations:**\n`
      safety.recommendations.forEach(rec => {
        addendum += `• ${rec}\n`
      })
      addendum += `\n`
    }

    addendum += `**Remember:** This advice is for educational purposes. For any pain, injury, or health concerns, please consult qualified medical professionals.`

    return addendum
  }
}

// Export the enhanced coaching engine
export { PersonalizedCoachingEngine as default }