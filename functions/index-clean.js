const functions = require('firebase-functions')
const cors = require('cors')

// Simple CORS setup
const corsHandler = cors({ origin: true })

// Simple AI Coaching Function
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

      // Simple AI response
      const response = {
        success: true,
        response: `Great question about "${question}"! Here's my coaching advice: Focus on consistency over perfection. Champions are made in practice, revealed in games. Trust your preparation and break this down into specific, actionable steps you can practice daily.`,
        provider: 'simple',
        sessionId: 'test-session'
      }

      return res.json(response)
    } catch (err) {
      console.error('Error:', err)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
})