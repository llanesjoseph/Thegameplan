import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/user/legal-compliance
 * Check user's legal compliance status for AI assistant
 * SECURITY: Only allows users to access their own compliance data
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Check for latest AI session
    const sessionsRef = adminDb.collection('ai_sessions')
    const q = sessionsRef
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc')
      .limit(1)
    
    const snapshot = await q.get()
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: {
          needsTermsUpdate: true,
          needsPrivacyUpdate: true,
          lastSession: null
        }
      })
    }
    
    const lastSessionDoc = snapshot.docs[0]
    const sessionData = lastSessionDoc.data()
    const lastSession = {
      id: lastSessionDoc.id,
      ...sessionData,
      startTime: sessionData.startTime?.toDate?.()?.toISOString() || null,
      consentTimestamp: sessionData.consentTimestamp?.toDate?.()?.toISOString() || null,
    }
    
    const CURRENT_TERMS_VERSION = '1.0'
    const CURRENT_PRIVACY_VERSION = '1.0'
    
    return NextResponse.json({
      success: true,
      data: {
        needsTermsUpdate: sessionData.termsVersion !== CURRENT_TERMS_VERSION,
        needsPrivacyUpdate: sessionData.privacyPolicyVersion !== CURRENT_PRIVACY_VERSION,
        lastSession
      }
    })
    
  } catch (error: any) {
    console.error('[LEGAL-COMPLIANCE-API] Error checking legal compliance:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check legal compliance',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
