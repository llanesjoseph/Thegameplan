/**
 * Athlete Mental Health Safety Module
 *
 * Detects and responds to mental health crises including:
 * - Self-harm indicators
 * - Suicidal ideation
 * - Severe distress
 *
 * Version: 1.5.0
 * Team: Safety-Core
 */

import { logger } from './logger'

export interface MentalHealthSafetyCheck {
  isCrisis: boolean
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  detectedPatterns: string[]
  shouldBlock: boolean
  safetyResponse: string
  requiresHumanReview: boolean
  hotlineInfo?: {
    primary: string
    url: string
  }
}

// High-risk patterns for suicidal ideation
const CRITICAL_PATTERNS = [
  // Direct suicide statements
  /\b(want to|going to|plan to|thinking about|considering)\s+(kill|end|hurt)\s+(myself|my life)\b/i,
  /\b(suicide|suicidal|end it all|don'?t want to live|no reason to live)\b/i,
  /\b(better off dead|want to die|wish I (was|were) dead)\b/i,

  // Self-harm patterns
  /\b(cutting|burning|hurting) myself\b/i,
  /\b(self.?harm|self.?injury)\b/i,

  // Planning indicators
  /\b(have a plan|planned it out|know how I'?ll|method)\s+(to die|to end|for suicide)\b/i,
  /\b(goodbye|final message|last time|won'?t see me again)\b/i
]

// Medium-risk patterns for distress
const HIGH_RISK_PATTERNS = [
  /\b(can'?t take it anymore|can'?t go on|giving up)\b/i,
  /\b(hopeless|worthless|pointless|no point)\b/i,
  /\b(everyone would be better without me|burden to everyone)\b/i,
  /\b(severe depression|major depression|clinical depression)\b/i
]

// Low-risk patterns for mental health discussion
const MEDIUM_RISK_PATTERNS = [
  /\b(depressed|anxious|anxiety|struggling|overwhelmed)\b/i,
  /\b(mental health|therapy|counseling|medication)\b/i,
  /\b(panic attack|anxiety attack|stress)\b/i
]

/**
 * Analyze text for mental health crisis indicators
 */
export function analyzeMentalHealthSafety(text: string): MentalHealthSafetyCheck {
  const lowerText = text.toLowerCase()
  const detectedPatterns: string[] = []

  // Check for critical patterns (suicidal ideation, self-harm)
  const hasCriticalPattern = CRITICAL_PATTERNS.some(pattern => {
    if (pattern.test(text)) {
      detectedPatterns.push('critical_crisis_language')
      return true
    }
    return false
  })

  if (hasCriticalPattern) {
    logger.warn('[MentalHealthSafety] CRITICAL: Detected suicidal ideation or self-harm language', {
      patterns: detectedPatterns
    })

    return {
      isCrisis: true,
      riskLevel: 'critical',
      detectedPatterns,
      shouldBlock: true,
      requiresHumanReview: true,
      safetyResponse: getCrisisResponse(),
      hotlineInfo: {
        primary: '988 Suicide and Crisis Lifeline',
        url: 'https://findahelpline.com'
      }
    }
  }

  // Check for high-risk patterns (severe distress)
  const hasHighRiskPattern = HIGH_RISK_PATTERNS.some(pattern => {
    if (pattern.test(text)) {
      detectedPatterns.push('severe_distress')
      return true
    }
    return false
  })

  if (hasHighRiskPattern) {
    logger.warn('[MentalHealthSafety] HIGH RISK: Detected severe distress language', {
      patterns: detectedPatterns
    })

    return {
      isCrisis: true,
      riskLevel: 'high',
      detectedPatterns,
      shouldBlock: true,
      requiresHumanReview: true,
      safetyResponse: getHighRiskResponse(),
      hotlineInfo: {
        primary: '988 Suicide and Crisis Lifeline',
        url: 'https://findahelpline.com'
      }
    }
  }

  // Check for medium-risk patterns (mental health discussion)
  const hasMediumRiskPattern = MEDIUM_RISK_PATTERNS.some(pattern => {
    if (pattern.test(text)) {
      detectedPatterns.push('mental_health_mention')
      return true
    }
    return false
  })

  if (hasMediumRiskPattern) {
    logger.info('[MentalHealthSafety] MEDIUM: Detected mental health discussion', {
      patterns: detectedPatterns
    })

    return {
      isCrisis: false,
      riskLevel: 'medium',
      detectedPatterns,
      shouldBlock: false,
      requiresHumanReview: false,
      safetyResponse: getSupportiveResponse()
    }
  }

  // No risk detected
  return {
    isCrisis: false,
    riskLevel: 'none',
    detectedPatterns: [],
    shouldBlock: false,
    requiresHumanReview: false,
    safetyResponse: ''
  }
}

/**
 * Get crisis response for critical situations
 */
function getCrisisResponse(): string {
  return `**⚠️ URGENT: If you're experiencing a mental health crisis, please reach out for immediate help.**

**🆘 Crisis Resources:**
- **988 Suicide and Crisis Lifeline**: Call or text **988** (US)
- **Crisis Text Line**: Text **HOME** to **741741**
- **International**: Visit [Find A Helpline](https://findahelpline.com)
- **Emergency**: Call **911** if you're in immediate danger

---

I'm an AI assistant designed to help with sports training, not mental health crises. Your safety and wellbeing are the top priority.

**What you can do right now:**
1. **Reach out** to a crisis counselor at 988 (available 24/7)
2. **Talk to someone** you trust - coach, family member, friend
3. **Go to a safe place** if you're in immediate danger

You are not alone. These resources are staffed by trained professionals who care and want to help.`
}

/**
 * Get response for high-risk distress
 */
function getHighRiskResponse(): string {
  return `**💙 Your wellbeing matters.**

It sounds like you're going through a really difficult time. While I can help with training questions, I'm not equipped to provide the mental health support you need right now.

**Professional Support Available:**
- **988 Suicide and Crisis Lifeline**: Call or text **988** for confidential support
- **Crisis Text Line**: Text **HOME** to **741741**
- **Talk to your coach**: They care about your overall wellbeing, not just athletics
- **Find resources**: [Find A Helpline](https://findahelpline.com)

---

Please consider reaching out to someone who can provide proper support. Your mental health is just as important as your physical training.`
}

/**
 * Get supportive response for mental health discussions
 */
function getSupportiveResponse(): string {
  return `**💙 Mental health is an important part of athletic performance.**

I notice you mentioned mental health. While I can help with training techniques and sports questions, I'm not qualified to provide mental health advice or therapy.

**If you're struggling:**
- Talk to a mental health professional
- Reach out to your coach about how you're feeling
- Consider these resources: [Find A Helpline](https://findahelpline.com)

**For athletic mental preparation**, I can help with:
- Focus and concentration techniques
- Pre-competition routines
- Goal setting strategies
- Building confidence in your training

How can I help with your sports training today?`
}

/**
 * Log mental health safety event for review
 */
export async function logMentalHealthEvent(
  userId: string,
  messageContent: string,
  safetyCheck: MentalHealthSafetyCheck
): Promise<void> {
  if (!safetyCheck.requiresHumanReview) return

  try {
    logger.error('[MentalHealthSafety] REQUIRES HUMAN REVIEW', {
      userId,
      riskLevel: safetyCheck.riskLevel,
      patterns: safetyCheck.detectedPatterns,
      timestamp: new Date().toISOString()
    })

    // In production, you would:
    // 1. Store in a secure database table for review
    // 2. Notify safety team via alert system
    // 3. Potentially contact user's emergency contacts if critical

  } catch (error) {
    logger.error('[MentalHealthSafety] Failed to log event', { error })
  }
}
