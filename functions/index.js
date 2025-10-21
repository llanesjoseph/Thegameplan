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

  // WORD LIMIT ENFORCEMENT: Keep responses concise (300 words max for initial, 350 for follow-ups)
  // Each response is now significantly shortened to meet requirements
  const responses = {
    performance: {
      mainAdvice: `Regarding "${question.substring(0, 50)}..." - Performance improves through deliberate practice and smart recovery. Break down skills into measurable components and work on each systematically. Focus on quality reps over quantity.`,
      steps: [
        'Track your top 3 performance metrics',
        'Set specific weekly goals',
        'Practice weak areas daily for 20 minutes',
        'Review performance data weekly'
      ],
      focusAreas: ['Technical Skills', 'Conditioning', 'Recovery']
    },
    mental: {
      mainAdvice: `About "${question.substring(0, 50)}..." - Mental strength drives peak performance. Build confidence through preparation, visualization, and positive self-talk. Control what you can control.`,
      steps: [
        'Create a 5-minute pre-performance routine',
        'Visualize success for 10 minutes daily',
        'Use 3 positive affirmations before competing',
        'Practice box breathing under pressure'
      ],
      focusAreas: ['Mindfulness', 'Visualization', 'Self-Talk']
    },
    training: {
      mainAdvice: `On "${question.substring(0, 50)}..." - Quality beats quantity in training. Structure practice with specific objectives. Balance skill work with conditioning and recovery.`,
      steps: [
        'Set one clear goal per session',
        'Spend 60% on skills, 40% on conditioning',
        'Focus on weak areas first when fresh',
        'Take full rest days weekly'
      ],
      focusAreas: ['Skill Development', 'Conditioning', 'Recovery']
    },
    teamwork: {
      mainAdvice: `Regarding "${question.substring(0, 50)}..." - Teams thrive on trust and communication. Support teammates while maintaining personal excellence. Lead by example.`,
      steps: [
        'Communicate clearly with teammates',
        'Know and own your role',
        'Give constructive feedback',
        'Support team goals first'
      ],
      focusAreas: ['Communication', 'Leadership', 'Trust']
    },
    general: {
      mainAdvice: `About "${question.substring(0, 50)}..." - Success comes from consistent effort and smart preparation. Focus on the process, and results follow.`,
      steps: [
        'Set specific goals with deadlines',
        'Create daily actionable steps',
        'Build supportive routines',
        'Review and adjust weekly'
      ],
      focusAreas: ['Goal Setting', 'Consistency', 'Process']
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