/**
 * Retrieval Service - RAG System for Coach Q&A
 *
 * Retrieves relevant lesson content from Fire

store based on the question.
 * Implements semantic search, reranking, and source citation.
 */

import { adminDb } from './firebase.admin'
import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface RetrievedChunk {
  chunk_id: string
  text: string
  label: string
  source_type: 'lesson' | 'qa_archive' | 'session_history'
  source_id: string
  metadata: {
    sport?: string
    topic?: string
    difficulty?: string
    coach_id?: string
    created_at?: any
  }
  relevance_score: number
}

export interface RetrievalOptions {
  coach_id: string
  sport?: string
  max_chunks?: number
  min_relevance?: number
}

// ============================================================================
// KEYWORD-BASED RETRIEVAL (Phase 1 - No Vector Embeddings Yet)
// ============================================================================

/**
 * Extract keywords from question for basic relevance scoring
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'how', 'what', 'when', 'where', 'why', 'do', 'does', 'i', 'you', 'can', 'should'])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

/**
 * Calculate simple relevance score based on keyword overlap
 */
function calculateRelevance(questionKeywords: string[], contentText: string): number {
  const contentLower = contentText.toLowerCase()
  let matches = 0
  let totalWeight = 0

  questionKeywords.forEach((keyword, index) => {
    // Earlier keywords in question are more important
    const weight = 1 / (index + 1)
    totalWeight += weight

    if (contentLower.includes(keyword)) {
      matches += weight
    }
  })

  return totalWeight > 0 ? matches / totalWeight : 0
}

// ============================================================================
// MAIN RETRIEVAL FUNCTION
// ============================================================================

/**
 * Retrieve relevant content from coach lessons
 *
 * Phase 1: Keyword-based retrieval with Firestore filtering
 * Phase 2 (Future): Vector embeddings + semantic search
 */
export async function retrieveRelevantContent(
  question: string,
  options: RetrievalOptions
): Promise<RetrievedChunk[]> {
  const { coach_id, sport, max_chunks = 5, min_relevance = 0.2 } = options

  try {
    logger.info('[Retrieval] Starting content retrieval', { coach_id, sport })

    // Extract keywords from question
    const keywords = extractKeywords(question)
    logger.info('[Retrieval] Extracted keywords', { keywords })

    // Query Firestore for coach lessons
    let lessonsQuery = adminDb.collection('lessons')
      .where('userId', '==', coach_id)
      .where('status', '==', 'active')
      .where('isPublic', '==', true)

    if (sport) {
      lessonsQuery = lessonsQuery.where('sport', '==', sport)
    }

    const lessonsSnapshot = await lessonsQuery.get()

    if (lessonsSnapshot.empty) {
      logger.warn('[Retrieval] No lessons found', { coach_id, sport })
      return []
    }

    logger.info('[Retrieval] Found lessons', { count: lessonsSnapshot.size })

    // Score and rank lessons
    const scoredChunks: RetrievedChunk[] = []

    lessonsSnapshot.forEach(doc => {
      const lesson = doc.data()

      // Build searchable text from lesson
      const searchText = [
        lesson.title || '',
        lesson.content?.description || '',
        lesson.content?.keyTakeaways?.join(' ') || '',
        ...(lesson.content?.steps || []).map((step: any) => step.instruction || ''),
        lesson.tags?.join(' ') || ''
      ].join(' ')

      // Calculate relevance
      const relevance = calculateRelevance(keywords, searchText)

      if (relevance >= min_relevance) {
        scoredChunks.push({
          chunk_id: `LESSON_${doc.id}`,
          text: searchText.slice(0, 1000), // Limit chunk size
          label: lesson.title || 'Untitled Lesson',
          source_type: 'lesson',
          source_id: doc.id,
          metadata: {
            sport: lesson.sport,
            topic: lesson.title,
            difficulty: lesson.difficulty,
            coach_id: lesson.userId,
            created_at: lesson.createdAt
          },
          relevance_score: relevance
        })
      }
    })

    // Sort by relevance and take top chunks
    scoredChunks.sort((a, b) => b.relevance_score - a.relevance_score)
    const topChunks = scoredChunks.slice(0, max_chunks)

    logger.info('[Retrieval] Retrieved chunks', {
      total: scoredChunks.length,
      returned: topChunks.length,
      top_scores: topChunks.map(c => c.relevance_score)
    })

    return topChunks

  } catch (error) {
    logger.error('[Retrieval] Error retrieving content', { error })
    throw new Error(`Retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// RERANKING (Cross-Encoder Style)
// ============================================================================

/**
 * Rerank retrieved chunks using more sophisticated relevance scoring
 *
 * Phase 1: Enhanced keyword matching + metadata boost
 * Phase 2 (Future): Use cross-encoder model for semantic reranking
 */
export function rerankChunks(
  question: string,
  chunks: RetrievedChunk[],
  boost_recency = true
): RetrievedChunk[] {
  const questionLower = question.toLowerCase()
  const keywords = extractKeywords(question)

  const reranked = chunks.map(chunk => {
    let score = chunk.relevance_score

    // Boost for exact phrase matches
    if (chunk.text.toLowerCase().includes(questionLower)) {
      score += 0.3
    }

    // Boost for metadata relevance
    if (chunk.metadata.topic && questionLower.includes(chunk.metadata.topic.toLowerCase())) {
      score += 0.15
    }

    // Boost for recency (if enabled)
    if (boost_recency && chunk.metadata.created_at) {
      const ageInDays = (Date.now() - chunk.metadata.created_at.toMillis()) / (1000 * 60 * 60 * 24)
      if (ageInDays < 30) score += 0.1
      else if (ageInDays < 90) score += 0.05
    }

    return { ...chunk, relevance_score: Math.min(score, 1.0) }
  })

  reranked.sort((a, b) => b.relevance_score - a.relevance_score)

  logger.info('[Rerank] Reranked chunks', {
    before: chunks.map(c => c.relevance_score),
    after: reranked.map(c => c.relevance_score)
  })

  return reranked
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

export interface ConfidenceScores {
  coverage: number    // How well sources cover the question
  recency: number     // How recent the sources are
  overall: number     // Combined confidence
}

/**
 * Calculate confidence scores for retrieved content
 */
export function calculateConfidence(
  question: string,
  chunks: RetrievedChunk[]
): ConfidenceScores {
  if (chunks.length === 0) {
    return { coverage: 0, recency: 0, overall: 0 }
  }

  // Coverage: Average relevance of top chunks
  const coverage = chunks.reduce((sum, c) => sum + c.relevance_score, 0) / chunks.length

  // Recency: How recent are the sources
  const now = Date.now()
  const recencyScores = chunks.map(chunk => {
    if (!chunk.metadata.created_at) return 0.5 // Default for unknown age

    const ageInDays = (now - chunk.metadata.created_at.toMillis()) / (1000 * 60 * 60 * 24)
    if (ageInDays < 30) return 1.0
    if (ageInDays < 90) return 0.8
    if (ageInDays < 180) return 0.6
    if (ageInDays < 365) return 0.4
    return 0.2
  })
  const recency = recencyScores.reduce((sum, s) => sum + s, 0) / recencyScores.length

  // Overall: Weighted combination
  const overall = (coverage * 0.7) + (recency * 0.3)

  return { coverage, recency, overall }
}
