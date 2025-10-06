/**
 * Message Audit Logging System
 *
 * Records all messages for safety, accountability, and compliance
 * Provides immutable audit trail with content moderation
 */

import { adminDb } from './firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

export interface MessageAuditLog {
  // Message Identity
  messageId: string
  conversationId: string // Unique ID for athlete-coach pair

  // Participants
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  recipientRole: string

  // Content
  content: string
  contentLength: number

  // Metadata
  timestamp: Timestamp
  clientIP?: string
  userAgent?: string

  // Safety Flags
  flagged: boolean
  flaggedReasons: string[]
  moderationScore?: {
    toxicity: number
    profanity: number
    threat: number
    inappropriate: number
  }

  // Read Status
  read: boolean
  readAt?: Timestamp

  // Audit Metadata
  auditCreatedAt: Timestamp
  retentionUntil: Timestamp // Messages retained for 7 years for legal compliance
}

export interface MessageReport {
  reportId: string
  messageId: string
  reportedBy: string
  reportedByRole: string
  reportReason: string
  reportDetails: string
  reportedAt: Timestamp
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: Timestamp
  actionTaken?: string
}

/**
 * Log a message to the audit trail
 */
export async function logMessage(data: {
  messageId: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  recipientRole: string
  content: string
  clientIP?: string
  userAgent?: string
}): Promise<void> {
  try {
    const now = Timestamp.now()
    const retentionYears = 7 // Legal compliance: retain for 7 years
    const retentionUntil = new Date()
    retentionUntil.setFullYear(retentionUntil.getFullYear() + retentionYears)

    // Create conversation ID (sorted to ensure consistency)
    const participants = [data.senderId, data.recipientId].sort()
    const conversationId = `${participants[0]}_${participants[1]}`

    // Run content moderation
    const moderationResult = await moderateContent(data.content)

    const auditLog: MessageAuditLog = {
      messageId: data.messageId,
      conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      recipientRole: data.recipientRole,
      content: data.content,
      contentLength: data.content.length,
      timestamp: now,
      clientIP: data.clientIP,
      userAgent: data.userAgent,
      flagged: moderationResult.flagged,
      flaggedReasons: moderationResult.reasons,
      moderationScore: moderationResult.score,
      read: false,
      auditCreatedAt: now,
      retentionUntil: Timestamp.fromDate(retentionUntil)
    }

    // Store in audit collection (immutable)
    await adminDb.collection('message_audit_logs').doc(data.messageId).set(auditLog)

    // If flagged, create alert for admins
    if (moderationResult.flagged) {
      await createModerationAlert(auditLog, moderationResult)
    }

    console.log(`✅ Message audit logged: ${data.messageId}`)
  } catch (error) {
    console.error('❌ Error logging message audit:', error)
    // Don't throw - logging failure shouldn't block message sending
  }
}

/**
 * Update message read status in audit log
 */
export async function logMessageRead(messageId: string): Promise<void> {
  try {
    await adminDb.collection('message_audit_logs').doc(messageId).update({
      read: true,
      readAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating message read status in audit:', error)
  }
}

/**
 * Content moderation using keyword detection
 */
async function moderateContent(content: string): Promise<{
  flagged: boolean
  reasons: string[]
  score: {
    toxicity: number
    profanity: number
    threat: number
    inappropriate: number
  }
}> {
  const contentLower = content.toLowerCase()
  const reasons: string[] = []
  let toxicity = 0
  let profanity = 0
  let threat = 0
  let inappropriate = 0

  // Profanity detection
  const profanityWords = ['fuck', 'shit', 'bitch', 'damn', 'ass', 'bastard']
  if (profanityWords.some(word => contentLower.includes(word))) {
    reasons.push('profanity')
    profanity = 0.8
  }

  // Threat detection
  const threatWords = ['kill', 'hurt', 'harm', 'attack', 'destroy', 'murder', 'weapon']
  if (threatWords.some(word => contentLower.includes(word))) {
    reasons.push('potential_threat')
    threat = 0.9
  }

  // Inappropriate content (sexual/romantic with minors)
  const inappropriateWords = ['sexy', 'hot', 'beautiful', 'attractive', 'date', 'relationship', 'love you']
  if (inappropriateWords.some(word => contentLower.includes(word))) {
    reasons.push('potentially_inappropriate')
    inappropriate = 0.7
  }

  // Bullying/harassment
  const bullyingWords = ['stupid', 'worthless', 'loser', 'idiot', 'useless', 'hate you']
  if (bullyingWords.some(word => contentLower.includes(word))) {
    reasons.push('potential_bullying')
    toxicity = 0.8
  }

  // Contact info sharing (potential grooming)
  const contactPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /@[A-Za-z0-9_]+/, // Social media handles
  ]
  if (contactPatterns.some(pattern => pattern.test(content))) {
    reasons.push('contact_info_sharing')
    inappropriate = Math.max(inappropriate, 0.6)
  }

  const flagged = reasons.length > 0

  return {
    flagged,
    reasons,
    score: {
      toxicity,
      profanity,
      threat,
      inappropriate
    }
  }
}

/**
 * Create moderation alert for flagged content
 */
async function createModerationAlert(
  auditLog: MessageAuditLog,
  moderationResult: { flagged: boolean; reasons: string[]; score: any }
): Promise<void> {
  try {
    await adminDb.collection('moderation_alerts').add({
      messageId: auditLog.messageId,
      conversationId: auditLog.conversationId,
      senderId: auditLog.senderId,
      senderName: auditLog.senderName,
      senderRole: auditLog.senderRole,
      recipientId: auditLog.recipientId,
      recipientName: auditLog.recipientName,
      recipientRole: auditLog.recipientRole,
      content: auditLog.content,
      flaggedReasons: moderationResult.reasons,
      moderationScore: moderationResult.score,
      severity: calculateSeverity(moderationResult.score),
      status: 'pending_review',
      createdAt: Timestamp.now(),
      reviewedBy: null,
      reviewedAt: null,
      actionTaken: null
    })

    console.log(`🚨 Moderation alert created for message: ${auditLog.messageId}`)
  } catch (error) {
    console.error('Error creating moderation alert:', error)
  }
}

/**
 * Calculate severity level for moderation
 */
function calculateSeverity(score: {
  toxicity: number
  profanity: number
  threat: number
  inappropriate: number
}): 'low' | 'medium' | 'high' | 'critical' {
  const maxScore = Math.max(score.toxicity, score.profanity, score.threat, score.inappropriate)

  if (score.threat > 0.7) return 'critical'
  if (maxScore > 0.8) return 'high'
  if (maxScore > 0.5) return 'medium'
  return 'low'
}

/**
 * Report a message
 */
export async function reportMessage(data: {
  messageId: string
  reportedBy: string
  reportedByRole: string
  reportReason: string
  reportDetails: string
}): Promise<string> {
  try {
    const reportDoc = await adminDb.collection('message_reports').add({
      messageId: data.messageId,
      reportedBy: data.reportedBy,
      reportedByRole: data.reportedByRole,
      reportReason: data.reportReason,
      reportDetails: data.reportDetails,
      reportedAt: Timestamp.now(),
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      actionTaken: null
    })

    // Also create a moderation alert
    const messageAudit = await adminDb.collection('message_audit_logs').doc(data.messageId).get()
    if (messageAudit.exists) {
      const auditData = messageAudit.data() as MessageAuditLog
      await adminDb.collection('moderation_alerts').add({
        messageId: data.messageId,
        conversationId: auditData.conversationId,
        senderId: auditData.senderId,
        senderName: auditData.senderName,
        senderRole: auditData.senderRole,
        recipientId: auditData.recipientId,
        recipientName: auditData.recipientName,
        recipientRole: auditData.recipientRole,
        content: auditData.content,
        flaggedReasons: ['user_reported'],
        moderationScore: auditData.moderationScore,
        severity: 'high', // User reports are high severity
        status: 'pending_review',
        reportId: reportDoc.id,
        createdAt: Timestamp.now(),
        reviewedBy: null,
        reviewedAt: null,
        actionTaken: null
      })
    }

    console.log(`📢 Message reported: ${data.messageId} by ${data.reportedBy}`)
    return reportDoc.id
  } catch (error) {
    console.error('Error reporting message:', error)
    throw new Error('Failed to report message')
  }
}

/**
 * Get conversation history for audit purposes
 */
export async function getConversationAudit(
  userId1: string,
  userId2: string,
  limit: number = 100
): Promise<MessageAuditLog[]> {
  try {
    const participants = [userId1, userId2].sort()
    const conversationId = `${participants[0]}_${participants[1]}`

    const snapshot = await adminDb
      .collection('message_audit_logs')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => doc.data() as MessageAuditLog)
  } catch (error) {
    console.error('Error fetching conversation audit:', error)
    return []
  }
}

/**
 * Get all flagged messages for admin review
 */
export async function getFlaggedMessages(limit: number = 50): Promise<MessageAuditLog[]> {
  try {
    const snapshot = await adminDb
      .collection('message_audit_logs')
      .where('flagged', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => doc.data() as MessageAuditLog)
  } catch (error) {
    console.error('Error fetching flagged messages:', error)
    return []
  }
}

/**
 * Get moderation alerts
 */
export async function getModerationAlerts(
  status?: 'pending_review' | 'reviewed' | 'action_taken' | 'dismissed'
): Promise<any[]> {
  try {
    let query = adminDb.collection('moderation_alerts').orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', '==', status) as any
    }

    const snapshot = await query.limit(100).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching moderation alerts:', error)
    return []
  }
}
