import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface AIAssistRequest {
  text: string
  action: 'transform' | 'polish'
  context: string // 'summary' | 'nextSteps' | 'strength' | 'improvement'
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const body: AIAssistRequest = await request.json()
    const { text, action, context } = body

    if (!text || !action || !context) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get Anthropic API key from environment
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Build prompt based on action and context
    let systemPrompt = ''
    let userPrompt = ''

    if (action === 'transform') {
      // Transform rough notes into polished responses
      if (context === 'summary') {
        systemPrompt = 'You are a professional athletic coach assistant helping transform rough notes into clear, constructive feedback for athletes. Your tone should be encouraging, specific, and actionable.'
        userPrompt = `Transform these rough coaching notes into a well-structured summary feedback for an athlete. Keep the original meaning and key points, but make it more professional, clear, and encouraging:\n\n${text}\n\nProvide only the transformed feedback without any preamble or explanation.`
      } else if (context === 'nextSteps') {
        systemPrompt = 'You are a professional athletic coach assistant helping create clear action plans for athletes.'
        userPrompt = `Transform these rough notes into clear, specific next steps for an athlete. Make them actionable and encouraging:\n\n${text}\n\nProvide only the next steps without any preamble or explanation.`
      } else if (context === 'strength') {
        systemPrompt = 'You are a professional athletic coach assistant helping identify and articulate athlete strengths.'
        userPrompt = `Transform these rough notes into a clear strength statement for an athlete. Be specific and encouraging:\n\n${text}\n\nProvide only the strength statement (one concise sentence) without any preamble.`
      } else if (context === 'improvement') {
        systemPrompt = 'You are a professional athletic coach assistant helping identify areas for improvement constructively.'
        userPrompt = `Transform these rough notes into a constructive area for improvement. Be specific but encouraging:\n\n${text}\n\nProvide only the improvement area (one concise sentence) without any preamble.`
      }
    } else if (action === 'polish') {
      // Polish existing text
      if (context === 'summary') {
        systemPrompt = 'You are a professional athletic coach assistant helping polish feedback to be more clear, professional, and impactful while maintaining the original message.'
        userPrompt = `Polish this coaching feedback to make it more clear, professional, and impactful. Keep the same meaning and key points:\n\n${text}\n\nProvide only the polished version without any preamble or explanation.`
      } else if (context === 'nextSteps') {
        systemPrompt = 'You are a professional athletic coach assistant helping polish action plans to be more clear and actionable.'
        userPrompt = `Polish these next steps to make them more clear, specific, and actionable:\n\n${text}\n\nProvide only the polished version without any preamble or explanation.`
      } else if (context === 'strength') {
        systemPrompt = 'You are a professional athletic coach assistant helping polish strength statements.'
        userPrompt = `Polish this strength statement to be more impactful and specific:\n\n${text}\n\nProvide only the polished version (one concise sentence) without any preamble.`
      } else if (context === 'improvement') {
        systemPrompt = 'You are a professional athletic coach assistant helping polish improvement areas constructively.'
        userPrompt = `Polish this area for improvement to be more constructive and specific:\n\n${text}\n\nProvide only the polished version (one concise sentence) without any preamble.`
      }
    }

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}))
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 500 }
      )
    }

    const anthropicData = await anthropicResponse.json()
    const generatedText = anthropicData.content[0].text

    return NextResponse.json({
      success: true,
      text: generatedText
    })

  } catch (error: any) {
    console.error('Error in AI assist:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    )
  }
}
