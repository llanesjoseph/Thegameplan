import { useCallback } from 'react'
import { AnalyticsService } from '@/lib/analytics'
import { useAuth } from '@/hooks/use-auth'

export function useAnalytics() {
  const { user } = useAuth()

  const trackView = useCallback(async (lessonId: string, creatorUid: string) => {
    if (!user?.uid) return
    await AnalyticsService.trackLessonView(lessonId, user.uid, creatorUid)
  }, [user?.uid])

  const trackCompletion = useCallback(async (
    lessonId: string, 
    creatorUid: string, 
    watchTimeSeconds: number
  ) => {
    if (!user?.uid) return
    await AnalyticsService.trackLessonCompletion(lessonId, user.uid, creatorUid, watchTimeSeconds)
  }, [user?.uid])

  const trackEngagement = useCallback(async (
    lessonId: string, 
    creatorUid: string, 
    type: 'like' | 'comment' | 'share'
  ) => {
    if (!user?.uid) return
    await AnalyticsService.trackEngagement(lessonId, creatorUid, type)
  }, [user?.uid])

  return {
    trackView,
    trackCompletion,
    trackEngagement
  }
}