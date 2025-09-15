const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')

// Initialize Admin SDK once per instance
try { admin.app() } catch { admin.initializeApp() }
const db = admin.firestore()

// Configure CORS for your domain
const corsOptions = {
  origin: [
    'https://your_project_id.web.app',
    'https://your_project_id.firebaseapp.com',
    'https://your-custom-domain.com', // Replace with your actual domain
    /^https:\/\/.*\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/
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


