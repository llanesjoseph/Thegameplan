/**
 * Firebase Cloud Functions Entry Point
 *
 * This file exports both HTTP functions and Firestore triggers.
 * - HTTP functions: aiCoaching (existing)
 * - Firestore triggers: onLessonPublished, onAthleteAssigned, onLessonCompleted
 */

const functions = require('firebase-functions')
const cors = require('cors')

// Simple CORS setup
const corsHandler = cors({ origin: true })

// ============================================================================
// HTTP FUNCTION: AI Coaching (Existing)
// ============================================================================

exports.aiCoaching = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' })
      }

      const { question } = req.body || {}

      if (!question) {
        return res.status(400).json({ success: false, error: 'Question is required' })
      }

      // Enhanced AI response with more robust coaching content
      const coachingAdvice = generateCoachingResponse(question)
      const response = {
        success: true,
        response: coachingAdvice.mainAdvice,
        actionableSteps: coachingAdvice.steps,
        focusAreas: coachingAdvice.focusAreas,
        provider: 'enhanced-coaching',
        sessionId: generateSessionId(),
        timestamp: new Date().toISOString(),
        questionCategory: coachingAdvice.category
      }

      return res.json(response)
    } catch (err) {
      console.error('Error:', err)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
})

// Helper function to generate coaching responses
function generateCoachingResponse(question) {
  const lowerQuestion = question.toLowerCase()

  // Categorize the question
  let category = 'general'
  if (lowerQuestion.includes('performance') || lowerQuestion.includes('improve')) {
    category = 'performance'
  } else if (lowerQuestion.includes('confidence') || lowerQuestion.includes('mental')) {
    category = 'mental'
  } else if (lowerQuestion.includes('practice') || lowerQuestion.includes('training')) {
    category = 'training'
  } else if (lowerQuestion.includes('team') || lowerQuestion.includes('communication')) {
    category = 'teamwork'
  }

  const responses = {
    performance: {
      mainAdvice: `Great question about "${question}"! Performance improvement comes from consistent, deliberate practice combined with smart recovery. Focus on breaking down your performance into measurable components and work on each systematically.`,
      steps: [
        'Identify your top 3 performance metrics to track',
        'Set specific, measurable goals for each metric',
        'Create a daily practice routine focusing on weak areas',
        'Record and analyze your performance data weekly',
        'Adjust your training based on data insights'
      ],
      focusAreas: ['Technical Skills', 'Physical Conditioning', 'Mental Preparation', 'Recovery & Nutrition']
    },
    mental: {
      mainAdvice: `Excellent question about "${question}"! Mental strength is the foundation of peak performance. Confidence is built through preparation, visualization, and positive self-talk.`,
      steps: [
        'Develop a pre-performance routine that calms your mind',
        'Practice visualization of successful outcomes daily',
        'Create positive affirmations specific to your sport',
        'Learn breathing techniques for pressure situations',
        'Build confidence through small, achievable wins'
      ],
      focusAreas: ['Mindfulness', 'Visualization', 'Self-Talk', 'Pressure Management']
    },
    training: {
      mainAdvice: `Smart question about "${question}"! Effective training is about quality over quantity. Structure your practice to maximize skill development while preventing burnout.`,
      steps: [
        'Design training sessions with specific objectives',
        'Balance skill work with conditioning',
        'Include deliberate practice of weak areas',
        'Schedule adequate rest and recovery time',
        'Track training intensity and adjust accordingly'
      ],
      focusAreas: ['Skill Development', 'Conditioning', 'Recovery', 'Progressive Overload']
    },
    teamwork: {
      mainAdvice: `Important question about "${question}"! Great teams are built on trust, communication, and shared goals. Individual excellence supports team success.`,
      steps: [
        'Develop clear communication protocols with teammates',
        'Understand and embrace your role within the team',
        'Practice active listening and constructive feedback',
        'Support teammates through encouragement and accountability',
        'Align personal goals with team objectives'
      ],
      focusAreas: ['Communication', 'Leadership', 'Trust Building', 'Collective Goals']
    },
    general: {
      mainAdvice: `Great question about "${question}"! Success in any endeavor comes from consistent effort, smart preparation, and continuous learning. Focus on the process, and results will follow.`,
      steps: [
        'Set clear, specific goals with deadlines',
        'Break down big goals into daily actionable steps',
        'Create systems and routines that support your goals',
        'Regularly review and adjust your approach',
        'Celebrate progress and learn from setbacks'
      ],
      focusAreas: ['Goal Setting', 'Process Focus', 'Consistency', 'Continuous Improvement']
    }
  }

  return responses[category] || responses.general
}

// Helper function to generate unique session IDs
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// ============================================================================
// FIRESTORE TRIGGERS: Coach-Athlete Data Flow
// ============================================================================

// Import and export Firestore triggers (v2 API)
const firestoreTriggers = require('./firestore-triggers-v2')

exports.onLessonPublished = firestoreTriggers.onLessonPublished
exports.onAthleteAssigned = firestoreTriggers.onAthleteAssigned
exports.onLessonCompleted = firestoreTriggers.onLessonCompleted
exports.syncAthleteData = firestoreTriggers.syncAthleteData

// ============================================================================
// ROLE ENFORCEMENT: Bulletproof invitation-based role management
// ============================================================================

const roleEnforcement = require('./role-enforcement')

// Real-time enforcement on user document changes
exports.enforceInvitationRole = roleEnforcement.enforceInvitationRole

// Daily scheduled check for role consistency
exports.dailyRoleConsistencyCheck = roleEnforcement.dailyRoleConsistencyCheck

// Manual enforcement endpoint (admin only)
exports.manualRoleEnforcement = roleEnforcement.manualRoleEnforcement