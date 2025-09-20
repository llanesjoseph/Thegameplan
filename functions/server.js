const express = require('express')
const cors = require('cors')
const app = express()

// Configure CORS for your domain
const corsOptions = {
  origin: [
    'https://gameplan-787a2.web.app',
    'https://gameplan-787a2.firebaseapp.com',
    'https://gp.crucibleanalytics.dev',
    'https://cruciblegameplan.web.app',
    /^https:\/\/.*\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/,
    /^https:\/\/.*\.crucibleanalytics\.dev$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}

app.use(cors(corsOptions))
app.use(express.json())

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'AI Coaching API', timestamp: new Date().toISOString() })
})

// AI Coaching endpoint
app.post('/api/ai-coaching', async (req, res) => {
  try {
    const { question, userId, userEmail, sessionId, sport, creatorId, creatorName } = req.body

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required and must be a string' })
    }

    // Intelligent fallback response for AI coaching
    function getIntelligentFallbackResponse(question, context) {
      const q = question.toLowerCase();

      if (q.includes('confidence') || q.includes('mental') || q.includes('pressure')) {
        return `Great question! Let me give you a focused approach to improvement.\n\n**Key fundamentals:**\n- **Master the basics first** - Build from solid foundations\n- **Practice with purpose** - Every touch should have intention\n- **Mental preparation** - Visualize before you play\n\n**Training approach:**\n1. **Consistency over perfection** - 100 decent reps beat 10 perfect ones\n2. **Game-like pressure** - Add time constraints to drills\n3. **Video study** - Watch yourself and pros in similar situations\n\n**Mindset:** Focus on process over outcome. Trust your preparation and stay confident in pressure moments.\n\n**Next step:** Break this down into specific skills and create a structured practice plan. Champions are made in practice, revealed in games.\n\nWhat specific aspect would you like me to dive deeper into?`;
      }

      if (q.includes('technique') || q.includes('skill') || q.includes('touch') || q.includes('passing')) {
        return `**Technical Excellence Blueprint:**\n\n**Foundation Work:**\n- Start with stationary repetitions\n- Focus on proper body positioning\n- Master the basics before adding complexity\n\n**Progressive Training:**\n1. **Slow and controlled** - Perfect form first\n2. **Add movement** - Dynamic situations\n3. **Game pressure** - Time and space constraints\n\n**Key Points:**\n- Quality over quantity in every rep\n- Use both feet equally\n- Practice under fatigue\n- Video analysis for feedback\n\n**Remember:** Champions are made in practice, revealed in games. Trust your preparation and stay focused on the process.\n\nWhat specific technical aspect would you like to work on next?`;
      }

      if (q.includes('tactical') || q.includes('strategy') || q.includes('decision') || q.includes('read')) {
        return `**Game Intelligence Development:**\n\n**Tactical Awareness:**\n- **See it, feel it, play it** - Anticipate before reacting\n- Study the game from multiple positions\n- Understand spacing and timing\n\n**Decision Making:**\n1. **Pre-scan** - Know your options before receiving\n2. **Quick processing** - Trust your first instinct\n3. **Execute with conviction** - Commit to your choice\n\n**Study Methods:**\n- Watch professional games with purpose\n- Analyze successful players in your position\n- Practice scenarios repeatedly\n\n**Mindset:** Trust your preparation. The more you understand the game, the simpler it becomes.\n\nWhat specific tactical situation would you like to improve?`;
      }

      return `**Training Excellence Approach:**\n\n**Core Principles:**\n- **Consistency beats perfection** - Focus on steady improvement\n- **Trust your preparation** - Mental strength comes from practice\n- **Process over outcome** - Control what you can control\n\n**Development Framework:**\n1. **Technical mastery** - Build solid fundamentals\n2. **Tactical understanding** - Read the game better\n3. **Mental resilience** - Stay confident under pressure\n\n**Next Steps:**\n- Break down your question into specific skills\n- Create focused practice sessions\n- Track your progress systematically\n\n**Remember:** Champions are made in practice, revealed in games. Every rep matters.\n\nWhat specific area would you like to focus on first?`;
    }

    const context = {
      coachName: creatorName || 'Jasmine Aikey',
      sport: sport || 'Soccer'
    };

    const aiResponse = getIntelligentFallbackResponse(question, context);

    const response = {
      success: true,
      response: aiResponse,
      provider: 'fallback',
      model: 'none',
      latencyMs: 0,
      sessionId: sessionId || 'temp-session',
      creatorContext: {
        name: context.coachName,
        sport: context.sport,
        voiceCharacteristics: {
          tone: "Warm, confident, and encouraging with subtle intensity",
          pace: "Measured and thoughtful, with emphasis on key points",
          emphasis: ["technique", "consistency", "championship mindset", "trust your preparation"],
          catchphrases: ["Trust your preparation", "Champions are made in practice, revealed in games", "See it, feel it, play it", "Consistency beats perfection"],
          speakingStyle: "Direct but nurturing, uses personal anecdotes from championship experience"
        }
      },
      safetyAnalysis: {
        riskLevel: 'low',
        isSafe: true
      },
      rateLimitRemaining: 9,
      voiceResponse: {
        available: false,
        message: "Voice responses coming soon!"
      }
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

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`AI Coaching API listening on port ${port}`)
})