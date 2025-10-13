import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

/**
 * POST /api/coach/suggest-content
 *
 * Intelligently suggests content for lesson creation by:
 * 1. First checking coach's existing resources/drills (seed data)
 * 2. Then checking platform-wide public content
 * 3. Finally leveraging external APIs if no content found
 *
 * Request body:
 * {
 *   sport: string,
 *   topic: string,
 *   level: 'beginner' | 'intermediate' | 'advanced',
 *   contentType: 'drill' | 'resource' | 'video' | 'text'
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Parse request body
    const { sport, topic, level, contentType } = await request.json()

    if (!sport || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: sport, topic' },
        { status: 400 }
      )
    }

    const suggestions: any = {
      myContent: [],
      platformContent: [],
      aiGenerated: [],
      externalLinks: []
    }

    // 3. PHASE 1: Check coach's own existing content (SEED DATA)
    console.log(`🔍 Searching coach's existing content for: ${sport} - ${topic}`)

    try {
      // Search in coach's resources
      const myResourcesQuery = adminDb
        .collection('resources')
        .where('creatorUid', '==', uid)
        .where('sport', '==', sport.toLowerCase())
        .limit(5)

      const myResources = await myResourcesQuery.get()

      suggestions.myContent = myResources.docs.map(doc => ({
        id: doc.id,
        type: 'resource',
        source: 'my_content',
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      console.log(`✅ Found ${suggestions.myContent.length} of coach's own resources`)

      // Search in coach's previous lessons for similar sections
      const myLessonsQuery = adminDb
        .collection('content')
        .where('creatorUid', '==', uid)
        .where('sport', '==', sport.toLowerCase())
        .where('status', '==', 'published')
        .limit(10)

      const myLessons = await myLessonsQuery.get()

      // Extract relevant sections from previous lessons
      myLessons.docs.forEach(doc => {
        const lessonData = doc.data()
        if (lessonData.sections && Array.isArray(lessonData.sections)) {
          // Filter sections matching content type
          const relevantSections = lessonData.sections.filter((section: any) => {
            if (contentType && section.type !== contentType) return false
            // Check if section content mentions the topic
            const contentLower = (section.content || '').toLowerCase()
            const topicLower = topic.toLowerCase()
            return contentLower.includes(topicLower) ||
                   (section.title || '').toLowerCase().includes(topicLower)
          })

          relevantSections.forEach((section: any) => {
            suggestions.myContent.push({
              type: section.type,
              source: 'previous_lesson',
              lessonId: doc.id,
              lessonTitle: lessonData.title,
              title: section.title,
              content: section.content,
              duration: section.duration,
              videoUrl: section.videoUrl,
              videoSource: section.videoSource
            })
          })
        }
      })

      console.log(`✅ Found ${suggestions.myContent.length} total items from coach's existing content`)

    } catch (error) {
      console.error('Error fetching coach content:', error)
    }

    // 4. PHASE 2: Check platform-wide public content
    console.log(`🌍 Searching platform-wide public content...`)

    try {
      const publicContentQuery = adminDb
        .collection('content')
        .where('sport', '==', sport.toLowerCase())
        .where('visibility', '==', 'public')
        .where('status', '==', 'published')
        .limit(10)

      const publicContent = await publicContentQuery.get()

      publicContent.docs.forEach(doc => {
        const lessonData = doc.data()
        if (lessonData.sections && Array.isArray(lessonData.sections)) {
          const relevantSections = lessonData.sections.filter((section: any) => {
            if (contentType && section.type !== contentType) return false
            const contentLower = (section.content || '').toLowerCase()
            const topicLower = topic.toLowerCase()
            return contentLower.includes(topicLower) ||
                   (section.title || '').toLowerCase().includes(topicLower)
          })

          relevantSections.forEach((section: any) => {
            suggestions.platformContent.push({
              type: section.type,
              source: 'platform',
              creatorUid: lessonData.creatorUid,
              creatorName: lessonData.creatorName || 'Coach',
              lessonId: doc.id,
              lessonTitle: lessonData.title,
              title: section.title,
              content: section.content,
              duration: section.duration,
              videoUrl: section.videoUrl,
              videoSource: section.videoSource
            })
          })
        }
      })

      console.log(`✅ Found ${suggestions.platformContent.length} items from platform content`)

    } catch (error) {
      console.error('Error fetching platform content:', error)
    }

    // 5. PHASE 3: Generate sport-specific AI suggestions
    console.log(`🤖 Generating AI suggestions for ${sport} - ${topic}...`)

    const aiSuggestions = generateContentSuggestions(sport, topic, level, contentType)
    suggestions.aiGenerated = aiSuggestions

    // 6. PHASE 4: Add external resource links
    console.log(`🔗 Adding external resource links...`)

    const externalLinks = getExternalResourceLinks(sport, topic)
    suggestions.externalLinks = externalLinks

    // 7. Return prioritized suggestions
    return NextResponse.json({
      success: true,
      sport,
      topic,
      level,
      contentType,
      suggestions: {
        myContent: suggestions.myContent.slice(0, 5), // Limit to top 5
        platformContent: suggestions.platformContent.slice(0, 5), // Limit to top 5
        aiGenerated: suggestions.aiGenerated,
        externalLinks: suggestions.externalLinks
      },
      counts: {
        myContent: suggestions.myContent.length,
        platformContent: suggestions.platformContent.length,
        aiGenerated: suggestions.aiGenerated.length,
        externalLinks: suggestions.externalLinks.length,
        total: suggestions.myContent.length + suggestions.platformContent.length + suggestions.aiGenerated.length + suggestions.externalLinks.length
      }
    })

  } catch (error: any) {
    console.error('Error suggesting content:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate AI-powered content suggestions based on sport and topic
 */
function generateContentSuggestions(
  sport: string,
  topic: string,
  level: string,
  contentType?: string
): any[] {
  const suggestions = []

  // Only generate drill suggestions if requested or not specified
  if (!contentType || contentType === 'drill') {
    suggestions.push({
      type: 'drill',
      source: 'ai_generated',
      title: `${topic} - Progressive Drill`,
      content: generateDrillContent(sport, topic, level),
      suggested: true
    })
  }

  if (!contentType || contentType === 'text') {
    suggestions.push({
      type: 'text',
      source: 'ai_generated',
      title: `${topic} - Technical Breakdown`,
      content: generateTechnicalContent(sport, topic, level),
      suggested: true
    })
  }

  return suggestions
}

/**
 * Generate sport-specific drill content
 */
function generateDrillContent(sport: string, topic: string, level: string): string {
  const sportLower = sport.toLowerCase()
  const levelText = level === 'beginner' ? 'introductory' : level === 'advanced' ? 'competition-level' : 'intermediate'

  const drillTemplates: Record<string, string> = {
    'football': `**${levelText.toUpperCase()} ${topic.toUpperCase()} DRILL**\n\n**Setup:**\n- Mark out 10-yard grid\n- ${level === 'beginner' ? '4-6' : '6-10'} players per group\n- Cones at key positions\n\n**Execution:**\n1. Start in proper stance\n2. Execute ${topic} technique on coach's signal\n3. Focus on footwork and body positioning\n4. Increase speed progressively\n\n**Coaching Points:**\n- Maintain low center of gravity\n- Explode through contact point\n- Keep eyes on target\n- Reset quickly between reps`,

    'soccer': `**${levelText.toUpperCase()} ${topic.toUpperCase()} DRILL**\n\n**Setup:**\n- Grid: ${level === 'beginner' ? '15x15 yards' : '20x20 yards'}\n- ${level === 'beginner' ? '4-6' : '6-8'} players\n- 1 ball per pair\n\n**Execution:**\n1. Start with ball at feet\n2. Practice ${topic} technique with light pressure\n3. Progress to live defenders\n4. Focus on timing and ball control\n\n**Coaching Points:**\n- First touch is crucial\n- Keep head up for awareness\n- Use both feet\n- Increase tempo as comfort grows`,

    'basketball': `**${levelText.toUpperCase()} ${topic.toUpperCase()} DRILL**\n\n**Setup:**\n- Half court or full court\n- ${level === 'beginner' ? '2-4' : '4-8'} players\n- 2-3 basketballs\n\n**Execution:**\n1. Start at designated spot\n2. Execute ${topic} with proper form\n3. Add defensive pressure ${level !== 'beginner' ? 'immediately' : 'after mastering basics'}\n4. Finish with shot or pass\n\n**Coaching Points:**\n- Triple threat position\n- Protect the ball\n- Use pivots effectively\n- Read the defense`,

    'baseball': `**${levelText.toUpperCase()} ${topic.toUpperCase()} DRILL**\n\n**Setup:**\n- ${level === 'beginner' ? 'Tee or soft toss' : 'Live pitching'}\n- ${level === 'beginner' ? '3-5' : '6-10'} reps per round\n- Multiple stations if possible\n\n**Execution:**\n1. Proper batting stance\n2. Load and stride timing\n3. Execute ${topic} through contact zone\n4. Follow through completely\n\n**Coaching Points:**\n- Weight transfer is key\n- Keep back elbow up\n- Rotate hips before hands\n- Track ball all the way`
  }

  return drillTemplates[sportLower] || `**${levelText.toUpperCase()} ${topic.toUpperCase()} DRILL**\n\n**Setup:**\n- Appropriate space for ${sport}\n- ${level === 'beginner' ? '4-6' : '6-10'} athletes\n- Required equipment\n\n**Execution:**\n1. Demonstrate ${topic} technique\n2. Practice with progressive resistance\n3. Add game-like conditions\n4. Monitor form and provide feedback\n\n**Coaching Points:**\n- Focus on fundamentals\n- Build complexity gradually\n- Provide immediate feedback\n- Adjust based on athlete readiness`
}

/**
 * Generate technical instruction content
 */
function generateTechnicalContent(sport: string, topic: string, level: string): string {
  return `**Technical Overview: ${topic}**\n\n**Key Fundamentals:**\n- Proper body positioning for ${topic}\n- Timing and rhythm specific to ${sport}\n- Common mistakes to avoid\n- Progressive development path\n\n**For ${level} Athletes:**\n${level === 'beginner' ?
    'Start with slow, controlled movements. Master the basics before adding speed or complexity.' :
    level === 'advanced' ?
    'Refine technique under pressure. Focus on consistency and competition application.' :
    'Build on fundamentals with increased speed and complexity. Add decision-making elements.'
  }\n\n**Practice Tips:**\n- Daily repetitions recommended\n- Film yourself to analyze form\n- Ask for coach feedback\n- Be patient with progress`
}

/**
 * Get curated external resource links based on sport and topic
 */
function getExternalResourceLinks(sport: string, topic: string): any[] {
  const sportLower = sport.toLowerCase()
  const topicLower = topic.toLowerCase()

  // Map sports to trusted training resource sites
  const resourceMap: Record<string, any[]> = {
    'football': [
      {
        title: `${topic} Drills - USA Football`,
        url: `https://usafootball.com/search/?q=${encodeURIComponent(topic)}`,
        description: 'Official USA Football training resources'
      },
      {
        title: `${topic} Training - NFL Play Football`,
        url: `https://playfootball.nfl.com/search?query=${encodeURIComponent(topic)}`,
        description: 'NFL coaching resources and drills'
      }
    ],
    'soccer': [
      {
        title: `${topic} Drills - US Soccer`,
        url: `https://learning.ussoccer.com/search?query=${encodeURIComponent(topic)}`,
        description: 'US Soccer coaching education'
      },
      {
        title: `${topic} Training - The Coaches Voice`,
        url: `https://www.thecoachesvoice.com/search/?q=${encodeURIComponent(topic)}`,
        description: 'Professional soccer tactics and training'
      }
    ],
    'basketball': [
      {
        title: `${topic} Drills - USA Basketball`,
        url: `https://www.usab.com/youth/search?q=${encodeURIComponent(topic)}`,
        description: 'USA Basketball coaching resources'
      },
      {
        title: `${topic} Training - Basketball HQ`,
        url: `https://basketballhq.com/?s=${encodeURIComponent(topic)}`,
        description: 'Basketball drills and training'
      }
    ],
    'baseball': [
      {
        title: `${topic} Drills - USA Baseball`,
        url: `https://www.usabaseball.com/search?query=${encodeURIComponent(topic)}`,
        description: 'USA Baseball coaching resources'
      },
      {
        title: `${topic} Training - Baseball Drills`,
        url: `https://www.baseballdrills.com/search?q=${encodeURIComponent(topic)}`,
        description: 'Comprehensive baseball training drills'
      }
    ]
  }

  return resourceMap[sportLower] || []
}
