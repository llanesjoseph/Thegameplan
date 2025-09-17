const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')

// Initialize Admin SDK once per instance
try { admin.app() } catch { admin.initializeApp() }
const db = admin.firestore()

// Configure CORS for your domain
const corsOptions = {
  origin: [
    'https://gameplan-787a2.web.app',
    'https://gameplan-787a2.firebaseapp.com',
    'https://gp.crucibleanalytics.dev',
    'https://cruciblegameplan.web.app',
    'https://your-custom-domain.com', // Replace with your actual domain
    /^https:\/\/.*\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/,
    /^https:\/\/.*\.crucibleanalytics\.dev$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}

const corsHandler = cors(corsOptions)

// Simple shared secret to restrict who can call this function
// Set this in Functions config: firebase functions:config:set admin.secret="YOUR_SECRET"
function requireSecret(req) {
  const supplied = req.get('x-admin-secret') || req.query.secret || (req.body && req.body.secret)
  const expected = (functions.config() && functions.config().admin && functions.config().admin.secret) || ''
  if (!expected || supplied !== expected) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
}

exports.setUserRole = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') { return res.status(405).send('Method Not Allowed') }
      requireSecret(req)

      const { uid, email, role } = req.body || {}
      if (!role || !['guest','user','creator','admin','superadmin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      let targetUid = uid
      if (!targetUid && email) {
        const rec = await admin.auth().getUserByEmail(email)
        targetUid = rec.uid
      }
      if (!targetUid) return res.status(400).json({ error: 'uid or email required' })

      await db.collection('users').doc(targetUid).set({ role, lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })

      return res.json({ ok: true, uid: targetUid, role })
    } catch (err) {
      const code = err.status || 500
      return res.status(code).json({ error: err.message || 'Internal error' })
    }
  })
})

// AI Coaching API Function
exports.aiCoaching = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') { 
        return res.status(405).json({ success: false, error: 'Method Not Allowed' })
      }

      // Parse request body with better error handling
      let body
      try {
        body = req.body
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        return res.status(400).json({ success: false, error: 'Invalid JSON in request body' })
      }
      
      const { question, userId, userEmail, sessionId, sport, creatorId, creatorName } = body

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, error: 'Question is required and must be a string' })
      }

      // Simple AI response for now (you can integrate with OpenAI/Gemini later)
      const response = {
        success: true,
        response: `Great question about "${question}"! This is a placeholder response. The AI coaching feature is being set up and will be available soon.`,
        provider: 'placeholder',
        model: 'placeholder',
        latencyMs: 0,
        sessionId: sessionId || 'temp-session',
        creatorContext: {
          name: creatorName || 'Coach',
          sport: sport || 'General',
          voiceCharacteristics: {}
        },
        safetyAnalysis: {
          riskLevel: 'low',
          isSafe: true
        },
        rateLimitRemaining: 9
      }

      return res.json(response)
    } catch (err) {
      console.error('AI Coaching API Error:', err)
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      })
    }
  })
})


