import { db } from './firebase.client'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'

export interface TrendingLesson {
  id: string
  title: string
  sport: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  creatorName: string
  engagementScore: number
  views: number
  likes: number
  comments: number
  tags: string[]
  createdAt: any
  thumbnailUrl?: string
  videoUrl?: string
  duration?: string
}

/**
 * Calculate engagement score based on views, likes, comments and recency
 * Higher score = more engaging content
 */
function calculateEngagementScore(lesson: any): number {
  const views = lesson.views || 0
  const likes = lesson.likes || 0
  const comments = lesson.comments || 0
  const daysAgo = lesson.createdAt ?
    Math.max(1, (Date.now() - lesson.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 30

  // Engagement formula: (likes * 10 + comments * 20 + views) / days_ago
  // Recent content gets boost, highly engaged content gets priority
  const engagementScore = (likes * 10 + comments * 20 + views) / Math.sqrt(daysAgo)

  return Math.round(engagementScore * 100) / 100
}

/**
 * Get the most trending lesson across all sports
 * This finds the most interactive content regardless of user's sport preference
 */
export async function getTrendingLesson(): Promise<TrendingLesson | null> {
  try {
    console.log('🔥 Fetching trending lesson...')

    // Get recent lessons from the last 30 days with activity
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('status', '==', 'active'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50) // Get recent lessons to analyze
    )

    const snapshot = await getDocs(lessonsQuery)
    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    if (lessons.length === 0) {
      console.log('📭 No lessons found, returning sample data')
      return getSampleTrendingLesson()
    }

    // Calculate engagement scores and find the most trending
    const lessonsWithScores = lessons.map(lesson => ({
      ...lesson,
      engagementScore: calculateEngagementScore(lesson)
    }))

    // Sort by engagement score (highest first)
    lessonsWithScores.sort((a, b) => b.engagementScore - a.engagementScore)

    const topLesson = lessonsWithScores[0]

    console.log(`🎯 Trending lesson found: "${topLesson.title}" (${topLesson.sport}) - Score: ${topLesson.engagementScore}`)

    return {
      id: topLesson.id,
      title: topLesson.title || 'Trending Training',
      sport: topLesson.sport || 'Multi-Sport',
      difficulty: topLesson.difficulty || 'intermediate',
      description: topLesson.description || 'Highly engaging content from our community',
      creatorName: topLesson.creatorName || 'Athleap Coach',
      engagementScore: topLesson.engagementScore,
      views: topLesson.views || 0,
      likes: topLesson.likes || 0,
      comments: topLesson.comments || 0,
      tags: topLesson.tags || [],
      createdAt: topLesson.createdAt,
      thumbnailUrl: topLesson.thumbnailUrl,
      videoUrl: topLesson.videoUrl,
      duration: topLesson.duration
    }
  } catch (error) {
    console.error('❌ Error fetching trending lesson:', error)
    // Return sample data for demonstration when database is empty
    return getSampleTrendingLesson()
  }
}

/**
 * Sample trending lesson for when database is empty
 * This helps demonstrate the trending functionality
 */
function getSampleTrendingLesson(): TrendingLesson {
  const sampleLessons = [
    {
      id: 'sample-1',
      title: 'Universal Athletic Fundamentals',
      sport: 'Multi-Sport',
      difficulty: 'beginner' as const,
      description: 'Core movement patterns that translate across all sports',
      creatorName: 'Athleap Team',
      engagementScore: 95.7,
      views: 1247,
      likes: 89,
      comments: 23,
      tags: ['fundamentals', 'movement', 'cross-training'],
      createdAt: new Date(),
      duration: '12:30'
    },
    {
      id: 'sample-2',
      title: 'Mental Game Mastery',
      sport: 'Psychology',
      difficulty: 'intermediate' as const,
      description: 'Psychological techniques used by elite athletes across disciplines',
      creatorName: 'Dr. Performance',
      engagementScore: 87.3,
      views: 892,
      likes: 67,
      comments: 31,
      tags: ['mental', 'performance', 'mindset'],
      createdAt: new Date(),
      duration: '18:45'
    },
    {
      id: 'sample-3',
      title: 'Recovery & Regeneration',
      sport: 'Wellness',
      difficulty: 'beginner' as const,
      description: 'Science-backed recovery methods every athlete should know',
      creatorName: 'Recovery Coach',
      engagementScore: 78.9,
      views: 654,
      likes: 45,
      comments: 18,
      tags: ['recovery', 'wellness', 'performance'],
      createdAt: new Date(),
      duration: '15:20'
    }
  ]

  // Return a random sample lesson
  return sampleLessons[Math.floor(Math.random() * sampleLessons.length)]
}

/**
 * Get multiple trending lessons for a trending feed
 */
export async function getTrendingLessons(count: number = 5): Promise<TrendingLesson[]> {
  try {
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('status', '==', 'active'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const snapshot = await getDocs(lessonsQuery)
    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    const lessonsWithScores = lessons
      .map(lesson => ({
        ...lesson,
        engagementScore: calculateEngagementScore(lesson)
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, count)

    return lessonsWithScores.map(lesson => ({
      id: lesson.id,
      title: lesson.title || 'Training Content',
      sport: lesson.sport || 'Multi-Sport',
      difficulty: lesson.difficulty || 'intermediate',
      description: lesson.description || 'Popular content from our community',
      creatorName: lesson.creatorName || 'Athleap Coach',
      engagementScore: lesson.engagementScore,
      views: lesson.views || 0,
      likes: lesson.likes || 0,
      comments: lesson.comments || 0,
      tags: lesson.tags || [],
      createdAt: lesson.createdAt,
      thumbnailUrl: lesson.thumbnailUrl,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration
    }))
  } catch (error) {
    console.error('❌ Error fetching trending lessons:', error)
    return []
  }
}