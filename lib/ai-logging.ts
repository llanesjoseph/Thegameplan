import { db } from './firebase.client'
import { collection, addDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { AIProvider, SubscriptionTier } from '../types'

export interface AILogEntry {
  id?: string
  userId: string
  userEmail: string
  sessionId: string
  timestamp: Timestamp | Date
  
  // Request data
  question: string
  questionHash: string // SHA-256 hash for privacy
  sport?: string
  coachContext?: string
  
  // Response data
  aiResponse: string
  responseHash: string // SHA-256 hash for privacy
  provider: AIProvider
  responseLength: number
  providerModel?: string
  providerLatencyMs?: number
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  usedCache?: boolean
  
  // Metadata
  ipAddress?: string
  userAgent?: string
  location?: string
  
  // Legal/Safety flags
  contentFlags?: string[]
  riskLevel: 'low' | 'medium' | 'high'
  reviewRequired: boolean
  
  // Liability protection
  disclaimerShown: boolean
  userConsent: boolean
  termsVersion: string
}

export interface AISession {
  id?: string
  userId: string
  userEmail: string
  sessionId: string
  startTime: Timestamp | Date
  endTime?: Timestamp | Date
  totalQuestions: number
  totalTokensUsed?: number
  userSubscriptionLevel: SubscriptionTier
  
  // Legal compliance
  disclaimerAccepted: boolean
  consentTimestamp: Timestamp | Date
  termsVersion: string
  privacyPolicyVersion: string
}

// Hash function for privacy (client-side hashing)
async function hashContent(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Server-side fallback - return a simple hash
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

// Content safety analysis
function analyzeContentSafety(question: string, response: string): {
  flags: string[]
  riskLevel: 'low' | 'medium' | 'high'
  reviewRequired: boolean
} {
  const flags: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  let reviewRequired = false
  
  const combinedText = `${question} ${response}`.toLowerCase()
  
  // Check for injury-related content
  if (combinedText.includes('injury') || combinedText.includes('pain') || 
      combinedText.includes('hurt') || combinedText.includes('medical')) {
    flags.push('injury_related')
    riskLevel = 'medium'
  }
  
  // Check for medical advice
  if (combinedText.includes('doctor') || combinedText.includes('treatment') ||
      combinedText.includes('diagnosis') || combinedText.includes('medication')) {
    flags.push('medical_advice')
    riskLevel = 'high'
    reviewRequired = true
  }
  
  // Check for inappropriate content
  const inappropriateTerms = ['violence', 'illegal', 'dangerous', 'harmful']
  for (const term of inappropriateTerms) {
    if (combinedText.includes(term)) {
      flags.push('inappropriate_content')
      riskLevel = 'high'
      reviewRequired = true
      break
    }
  }
  
  // Check for coaching boundary issues
  if (combinedText.includes('personal') && (combinedText.includes('problem') || combinedText.includes('issue'))) {
    flags.push('personal_counseling')
    riskLevel = 'medium'
  }
  
  return { flags, riskLevel, reviewRequired }
}

// Create AI session
export async function createAISession(
  userId: string, 
  userEmail: string, 
  userSubscriptionLevel: SubscriptionTier,
  disclaimerAccepted: boolean,
  termsVersion: string,
  privacyPolicyVersion: string
): Promise<string> {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const sessionData: AISession = {
      userId,
      userEmail,
      sessionId,
      startTime: Timestamp.now(),
      totalQuestions: 0,
      userSubscriptionLevel,
      disclaimerAccepted,
      consentTimestamp: Timestamp.now(),
      termsVersion,
      privacyPolicyVersion
    }
    
    await addDoc(collection(db, 'ai_sessions'), sessionData)
    return sessionId
  } catch (error) {
    console.error('Error creating AI session:', error)
    throw error
  }
}

// Log AI interaction
export async function logAIInteraction(
  userId: string,
  userEmail: string,
  sessionId: string,
  question: string,
  aiResponse: string,
  provider: AIProvider,
  sport?: string,
  coachContext?: string,
  disclaimerShown: boolean = true,
  userConsent: boolean = true,
  termsVersion: string = '1.0',
  metrics?: {
    model?: string
    latencyMs?: number
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    usedCache?: boolean
  }
): Promise<void> {
  try {
    // Hash sensitive content for privacy
    const questionHash = await hashContent(question)
    const responseHash = await hashContent(aiResponse)
    
    // Analyze content safety
    const safety = analyzeContentSafety(question, aiResponse)
    
    // Get client metadata
    let ipAddress = ''
    let userAgent = ''
    let location = ''
    
    if (typeof window !== 'undefined') {
      userAgent = navigator.userAgent
      
      // Get IP and location (optional, requires additional service)
      try {
        const geoResponse = await fetch('https://ipapi.co/json/')
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          ipAddress = geoData.ip || ''
          location = `${geoData.city || ''}, ${geoData.country_name || ''}`
        }
      } catch (e) {
        // Geo lookup failed, continue without location
      }
    }
    
    const logEntry: AILogEntry = {
      userId,
      userEmail,
      sessionId,
      timestamp: Timestamp.now(),
      
      // Request data
      question,
      questionHash,
      sport,
      coachContext,
      
      // Response data
      aiResponse,
      responseHash,
      provider,
      responseLength: aiResponse.length,
      providerModel: metrics?.model,
      providerLatencyMs: metrics?.latencyMs,
      promptTokens: metrics?.promptTokens,
      completionTokens: metrics?.completionTokens,
      totalTokens: metrics?.totalTokens,
      usedCache: metrics?.usedCache,
      
      // Metadata
      ipAddress,
      userAgent,
      location,
      
      // Safety analysis
      contentFlags: safety.flags,
      riskLevel: safety.riskLevel,
      reviewRequired: safety.reviewRequired,
      
      // Legal compliance
      disclaimerShown,
      userConsent,
      termsVersion
    }
    
    // Store the log entry
    await addDoc(collection(db, 'ai_interaction_logs'), logEntry)
    
    // Update session question count
    await updateSessionQuestionCount(sessionId)
    
    // If high risk or review required, flag for admin review
    if (safety.reviewRequired || safety.riskLevel === 'high') {
      await flagForReview(logEntry)
    }
    
  } catch (error) {
    console.error('Error logging AI interaction:', error)
    // Don't throw - we don't want logging failures to break the user experience
    // Instead, log to console and optionally send to error tracking service
  }
}

// Update session question count
async function updateSessionQuestionCount(sessionId: string): Promise<void> {
  try {
    const sessionsRef = collection(db, 'ai_sessions')
    const q = query(sessionsRef, where('sessionId', '==', sessionId))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const currentCount = doc.data().totalQuestions || 0
      await updateDoc(doc.ref, { 
        totalQuestions: currentCount + 1,
        lastActivity: Timestamp.now()
      })
    }
  } catch (error) {
    console.error('Error updating session count:', error)
  }
}

// Flag content for admin review
async function flagForReview(logEntry: AILogEntry): Promise<void> {
  try {
    const flagData = {
      logEntryId: logEntry.id,
      userId: logEntry.userId,
      userEmail: logEntry.userEmail,
      sessionId: logEntry.sessionId,
      flaggedAt: Timestamp.now(),
      contentFlags: logEntry.contentFlags,
      riskLevel: logEntry.riskLevel,
      reason: 'Automated content analysis',
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
      action: null // 'approved', 'flagged', 'user_warned', 'account_suspended'
    }
    
    await addDoc(collection(db, 'ai_content_flags'), flagData)
    
    // Optional: Send notification to admins (implement your notification system)
    console.warn('AI content flagged for review:', {
      userId: logEntry.userId,
      flags: logEntry.contentFlags,
      riskLevel: logEntry.riskLevel
    })
    
  } catch (error) {
    console.error('Error flagging content for review:', error)
  }
}

// Get user's AI interaction history (for user dashboard)
export async function getUserAIHistory(
  userId: string, 
  limitCount: number = 50
): Promise<AILogEntry[]> {
  try {
    const logsRef = collection(db, 'ai_interaction_logs')
    const q = query(
      logsRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AILogEntry[]
    
  } catch (error) {
    console.error('Error getting user AI history:', error)
    return []
  }
}

// Get flagged content for admin review
export async function getFlaggedContent(): Promise<Array<{ id: string; [key: string]: unknown }>> {
  try {
    const flagsRef = collection(db, 'ai_content_flags')
    const q = query(
      flagsRef,
      where('reviewed', '==', false),
      orderBy('flaggedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
  } catch (error) {
    console.error('Error getting flagged content:', error)
    return []
  }
}

// Legal compliance utilities
export const LEGAL_DISCLAIMERS = {
  general: `This AI coaching advice is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers and certified coaches for personalized guidance. Use this information at your own risk.`,
  
  injury: `IMPORTANT: If you are experiencing pain or injury, stop the activity immediately and consult a healthcare professional. This AI system cannot diagnose injuries or provide medical treatment advice.`,
  
  liability: `By using this AI coaching service, you acknowledge that athletic activities carry inherent risks of injury. You assume all risks and release the service provider from any liability for injuries or damages that may occur.`
}

export const CURRENT_TERMS_VERSION = '1.0'
export const CURRENT_PRIVACY_VERSION = '1.0'

// Check if user needs to accept updated terms
export async function checkUserLegalCompliance(userId: string): Promise<{
  needsTermsUpdate: boolean
  needsPrivacyUpdate: boolean
  lastSession?: AISession
}> {
  try {
    const sessionsRef = collection(db, 'ai_sessions')
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return {
        needsTermsUpdate: true,
        needsPrivacyUpdate: true
      }
    }
    
    const lastSession = snapshot.docs[0].data() as AISession
    
    return {
      needsTermsUpdate: lastSession.termsVersion !== CURRENT_TERMS_VERSION,
      needsPrivacyUpdate: lastSession.privacyPolicyVersion !== CURRENT_PRIVACY_VERSION,
      lastSession
    }
    
  } catch (error) {
    console.error('Error checking legal compliance:', error)
    return {
      needsTermsUpdate: true,
      needsPrivacyUpdate: true
    }
  }
}