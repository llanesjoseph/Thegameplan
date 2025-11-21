import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/ensemble-service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text: string | undefined = body?.text
    const sport: string | undefined = body?.sport

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `
You are an expert writing assistant for professional sports coaches.

GOAL:
- Polish the coach's lesson content to be clear, concise, and grammatically correct.

CRITICAL RULES:
- Preserve the ORIGINAL meaning, structure, and drills.
- Keep any existing Markdown structure (headings, lists, bold/italic) but fix spacing and punctuation.
- Use a confident, supportive coaching tone.
${sport ? `- Assume the sport is ${sport}. Use accurate terminology for this sport.` : ''}

RETURN:
- Only the polished lesson content in Markdown. Do NOT add introductions, disclaimers, or extra sections.
`

    const userPrompt = `Polish the following lesson content. Fix grammar, spelling, and formatting, but DO NOT change the drills or concepts:

---
${text}
---
`

    const polished = await callOpenAI(systemPrompt, userPrompt, 0.2, 'gpt-4o')

    return NextResponse.json({
      polishedText: polished
    })
  } catch (error) {
    logger.error('[API] ai/polish-text failed', { error })
    return NextResponse.json(
      { error: 'Failed to polish text' },
      { status: 500 }
    )
  }
}


