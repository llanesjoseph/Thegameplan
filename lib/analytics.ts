import { db } from '@/lib/firebase.client'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { LessonAnalytics, CreatorAnalytics, UserAnalytics, Lesson } from '@/lib/types'

export class AnalyticsService {
  // Track lesson view
  static async trackLessonView(lessonId: string, userId: string, creatorUid: string) {
    try {
      const batch = writeBatch(db)
      
      // Update lesson view count
      const lessonRef = doc(db, 'content', lessonId)
      batch.update(lessonRef, {
        views: increment(1),
        updatedAt: serverTimestamp()
      })
      
      // Update lesson analytics
      const analyticsRef = doc(db, 'lessonAnalytics', lessonId)
      const analyticsDoc = await getDoc(analyticsRef)
      
      if (analyticsDoc.exists()) {
        batch.update(analyticsRef, {
          views: increment(1),
          uniqueViews: increment(1), // This would need deduplication logic
          updatedAt: serverTimestamp()
        })
      } else {
        batch.set(analyticsRef, {
          id: lessonId,
          lessonId,
          creatorUid,
          views: 1,
          uniqueViews: 1,
          totalViewTime: 0,
          averageViewDuration: 0,
          completionRate: 0,
          engagementScore: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          monthlyGrowth: 0,
          peakViewTime: '00:00',
          userRetentionRate: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      
      // Update creator analytics
      const creatorAnalyticsRef = doc(db, 'creatorAnalytics', creatorUid)
      const creatorDoc = await getDoc(creatorAnalyticsRef)
      
      if (creatorDoc.exists()) {
        batch.update(creatorAnalyticsRef, {
          totalViews: increment(1),
          activeViewers: increment(1),
          updatedAt: serverTimestamp()
        })
      } else {
        batch.set(creatorAnalyticsRef, {
          id: creatorUid,
          creatorUid,
          totalFollowers: 0,
          activeViewers: 1,
          totalViews: 1,
          totalViewTime: 0,
          averageEngagement: 0,
          topEngagement: 0,
          monthlyGrowth: 0,
          contentCount: 0,
          revenueGenerated: 0,
          topPerformingContent: [],
          audienceRetention: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      
      await batch.commit()
    } catch (error) {
      console.error('Error tracking lesson view:', error)
    }
  }

  // Track lesson completion
  static async trackLessonCompletion(
    lessonId: string, 
    userId: string, 
    creatorUid: string, 
    watchTimeSeconds: number
  ) {
    try {
      const batch = writeBatch(db)
      
      // Update lesson analytics
      const analyticsRef = doc(db, 'lessonAnalytics', lessonId)
      batch.update(analyticsRef, {
        totalViewTime: increment(watchTimeSeconds),
        completionRate: increment(1), // This would need proper calculation
        engagementScore: increment(5), // Points for completion
        updatedAt: serverTimestamp()
      })
      
      // Update user analytics
      const userAnalyticsRef = doc(db, 'userAnalytics', userId)
      const userDoc = await getDoc(userAnalyticsRef)
      
      if (userDoc.exists()) {
        batch.update(userAnalyticsRef, {
          totalWatchTime: increment(watchTimeSeconds),
          lessonsCompleted: increment(1),
          updatedAt: serverTimestamp()
        })
      } else {
        batch.set(userAnalyticsRef, {
          id: userId,
          userId,
          totalWatchTime: watchTimeSeconds,
          lessonsCompleted: 1,
          averageEngagement: 0,
          favoriteContent: [],
          skillProgression: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      
      await batch.commit()
    } catch (error) {
      console.error('Error tracking lesson completion:', error)
    }
  }

  // Track engagement (likes, comments, shares)
  static async trackEngagement(
    lessonId: string, 
    creatorUid: string, 
    type: 'like' | 'comment' | 'share'
  ) {
    try {
      const analyticsRef = doc(db, 'lessonAnalytics', lessonId)
      const updateData: any = {
        engagementScore: increment(type === 'like' ? 1 : type === 'comment' ? 3 : 2),
        updatedAt: serverTimestamp()
      }
      
      updateData[`${type}s`] = increment(1)
      
      await updateDoc(analyticsRef, updateData)
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  // Get creator analytics
  static async getCreatorAnalytics(creatorUid: string): Promise<CreatorAnalytics | null> {
    try {
      // Get creator's overall analytics
      const creatorAnalyticsRef = doc(db, 'creatorAnalytics', creatorUid)
      const creatorDoc = await getDoc(creatorAnalyticsRef)
      
      let creatorAnalytics: CreatorAnalytics | null = null
      
      if (creatorDoc.exists()) {
        const data = creatorDoc.data()
        creatorAnalytics = {
          id: data.id,
          creatorUid: data.creatorUid,
          totalFollowers: data.totalFollowers || 0,
          activeViewers: data.activeViewers || 0,
          totalViews: data.totalViews || 0,
          totalViewTime: data.totalViewTime || 0,
          averageEngagement: data.averageEngagement || 0,
          topEngagement: data.topEngagement || 0,
          monthlyGrowth: data.monthlyGrowth || 0,
          contentCount: data.contentCount || 0,
          revenueGenerated: data.revenueGenerated || 0,
          topPerformingContent: data.topPerformingContent || [],
          audienceRetention: data.audienceRetention || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        }
      } else {
        // Initialize creator analytics if doesn't exist with zero values
        const initialData = {
          id: creatorUid,
          creatorUid,
          totalFollowers: 0,
          activeViewers: 0,
          totalViews: 0,
          totalViewTime: 0,
          averageEngagement: 0,
          topEngagement: 0,
          monthlyGrowth: 0,
          contentCount: 0,
          revenueGenerated: 0,
          topPerformingContent: [],
          audienceRetention: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        await setDoc(creatorAnalyticsRef, initialData)
        creatorAnalytics = {
          ...initialData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as CreatorAnalytics
      }
      
      return creatorAnalytics
    } catch (error) {
      console.error('Error getting creator analytics:', error)
      return null
    }
  }

  // Get lesson analytics for a creator
  static async getCreatorLessonAnalytics(creatorUid: string): Promise<any[]> {
    try {
      // Get creator's content
      const contentQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', creatorUid),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      
      const contentSnapshot = await getDocs(contentQuery)
      const lessonAnalytics: any[] = []
      
      for (const contentDoc of contentSnapshot.docs) {
        const contentData = contentDoc.data()
        
        // Get analytics for this lesson
        const analyticsRef = doc(db, 'lessonAnalytics', contentDoc.id)
        const analyticsDoc = await getDoc(analyticsRef)
        
        let analytics = null
        if (analyticsDoc.exists()) {
          analytics = analyticsDoc.data()
        } else {
          // Initialize with zero values if no analytics exist
          const initialData = {
            id: contentDoc.id,
            lessonId: contentDoc.id,
            creatorUid,
            views: 0,
            uniqueViews: 0,
            totalViewTime: 0,
            averageViewDuration: 0,
            completionRate: 0,
            engagementScore: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            monthlyGrowth: 0,
            peakViewTime: '00:00',
            userRetentionRate: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
          
          await setDoc(analyticsRef, initialData)
          analytics = initialData
        }
        
        lessonAnalytics.push({
          id: contentDoc.id,
          title: contentData.title || 'Untitled',
          views: analytics.views || 0,
          viewDuration: analytics.averageViewDuration || 0,
          completionRate: analytics.completionRate || 0,
          engagement: analytics.engagementScore || 0,
          createdAt: contentData.createdAt?.toDate() || new Date()
        })
      }
      
      return lessonAnalytics
    } catch (error) {
      console.error('Error getting creator lesson analytics:', error)
      return []
    }
  }

  // Update content count for creator
  static async updateCreatorContentCount(creatorUid: string) {
    try {
      const contentQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', creatorUid),
        where('status', '==', 'published')
      )
      
      const snapshot = await getDocs(contentQuery)
      const contentCount = snapshot.size
      
      const creatorAnalyticsRef = doc(db, 'creatorAnalytics', creatorUid)
      await updateDoc(creatorAnalyticsRef, {
        contentCount,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating creator content count:', error)
    }
  }
}