'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore'
import {
 BarChart3,
 TrendingUp,
 Users,
 Eye,
 Clock,
 Star,
 Video,
 Calendar,
 Target,
 Award,
 Activity,
 Zap,
 Globe
} from 'lucide-react'

interface SystemStats {
 totalUsers: number
 totalCreators: number
 totalContent: number
 totalViews: number
 averageWatchTime: number
 monthlyGrowth: number
 activeUsers: number
 contentPublished: number
}

interface TopContent {
 id: string
 title: string
 creatorName: string
 views: number
 watchTime: number
 completionRate: number
}

interface TopCreators {
 uid: string
 name: string
 followers: number
 contentCount: number
 totalViews: number
 averageRating: number
}

export default function AdminAnalytics() {
 const [systemStats, setSystemStats] = useState<SystemStats>({
  totalUsers: 0,
  totalCreators: 0,
  totalContent: 0,
  totalViews: 0,
  averageWatchTime: 0,
  monthlyGrowth: 0,
  activeUsers: 0,
  contentPublished: 0
 })
 const [topContent, setTopContent] = useState<TopContent[]>([])
 const [topCreators, setTopCreators] = useState<TopCreators[]>([])
 const [loading, setLoading] = useState(true)
 const [timeRange, setTimeRange] = useState('30d')

 const { user } = useAuth()
 const { role } = useEnhancedRole()

 const loadAnalytics = useCallback(async () => {
  try {
   setLoading(true)

   console.log('📊 Loading real analytics data from Firebase')

   // Get total users (all users with role 'athlete' or any user)
   const usersSnapshot = await getDocs(collection(db, 'users'))
   const totalUsers = usersSnapshot.size

   // Get total creators (users with role 'coach' or 'creator')
   const creatorsQuery = query(
    collection(db, 'users'),
    where('role', 'in', ['coach', 'creator'])
   )
   const creatorsSnapshot = await getDocs(creatorsQuery)
   const totalCreators = creatorsSnapshot.size

   // Get total content/videos
   const videosSnapshot = await getDocs(collection(db, 'videos'))
   const totalContent = videosSnapshot.size

   // Count published content
   const publishedVideos = videosSnapshot.docs.filter(doc =>
    doc.data().status === 'published' || doc.data().published === true
   )
   const contentPublished = publishedVideos.length

   // Calculate total views from videos
   let totalViews = 0
   let totalWatchTimeMinutes = 0
   let totalCompletions = 0

   videosSnapshot.docs.forEach(doc => {
    const data = doc.data()
    totalViews += data.views || 0
    totalWatchTimeMinutes += data.totalWatchTime || 0
    totalCompletions += data.completions || 0
   })

   // Convert watch time to hours
   const averageWatchTime = totalWatchTimeMinutes / 60 || 0

   // Calculate active users (users who have activity in last 30 days)
   const thirtyDaysAgo = new Date()
   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

   const activeUsersQuery = query(
    collection(db, 'users'),
    where('lastActive', '>=', thirtyDaysAgo)
   )
   const activeUsersSnapshot = await getDocs(activeUsersQuery)
   const activeUsers = activeUsersSnapshot.size

   // Calculate monthly growth (compare current month to previous)
   const now = new Date()
   const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
   const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

   const thisMonthQuery = query(
    collection(db, 'users'),
    where('createdAt', '>=', firstDayThisMonth)
   )
   const lastMonthQuery = query(
    collection(db, 'users'),
    where('createdAt', '>=', firstDayLastMonth),
    where('createdAt', '<', firstDayThisMonth)
   )

   const thisMonthSnapshot = await getDocs(thisMonthQuery)
   const lastMonthSnapshot = await getDocs(lastMonthQuery)

   const monthlyGrowth = lastMonthSnapshot.size > 0
    ? Math.round(((thisMonthSnapshot.size - lastMonthSnapshot.size) / lastMonthSnapshot.size) * 100)
    : 0

   setSystemStats({
    totalUsers,
    totalCreators,
    totalContent,
    totalViews,
    averageWatchTime,
    monthlyGrowth,
    activeUsers,
    contentPublished
   })

   // Get top content (videos sorted by views)
   const topContentQuery = query(
    collection(db, 'videos'),
    orderBy('views', 'desc'),
    limit(3)
   )
   const topContentSnapshot = await getDocs(topContentQuery)

   const topContentData: TopContent[] = await Promise.all(
    topContentSnapshot.docs.map(async (doc) => {
     const data = doc.data()

     // Get creator name
     let creatorName = 'Unknown'
     if (data.creatorId) {
      const creatorDoc = await getDocs(
       query(collection(db, 'users'), where('uid', '==', data.creatorId))
      )
      if (!creatorDoc.empty) {
       creatorName = creatorDoc.docs[0].data().displayName || 'Unknown'
      }
     }

     return {
      id: doc.id,
      title: data.title || 'Untitled',
      creatorName,
      views: data.views || 0,
      watchTime: (data.totalWatchTime || 0) / 60, // Convert to hours
      completionRate: data.views > 0 ? Math.round(((data.completions || 0) / data.views) * 100) : 0
     }
    })
   )
   setTopContent(topContentData)

   // Get top creators (coaches with most content and views)
   const creatorsData = await Promise.all(
    creatorsSnapshot.docs.map(async (doc) => {
     const userData = doc.data()
     const uid = doc.id

     // Get creator's videos
     const creatorVideosQuery = query(
      collection(db, 'videos'),
      where('creatorId', '==', uid)
     )
     const creatorVideosSnapshot = await getDocs(creatorVideosQuery)

     // Calculate total views for this creator
     let creatorTotalViews = 0
     let totalRating = 0
     let ratingCount = 0

     creatorVideosSnapshot.docs.forEach(videoDoc => {
      const videoData = videoDoc.data()
      creatorTotalViews += videoData.views || 0
      if (videoData.rating) {
       totalRating += videoData.rating
       ratingCount++
      }
     })

     return {
      uid,
      name: userData.displayName || userData.email?.split('@')[0] || 'Unknown',
      followers: userData.followers || 0,
      contentCount: creatorVideosSnapshot.size,
      totalViews: creatorTotalViews,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0
     }
    })
   )

   // Sort by total views and take top 3
   const sortedCreators = creatorsData
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 3)

   setTopCreators(sortedCreators)

  } catch (error) {
   console.error('Error loading analytics:', error)
  } finally {
   setLoading(false)
  }
 }, [timeRange])

 useEffect(() => {
  if (user && (role === 'superadmin' || role === 'admin')) {
   loadAnalytics()
  }
 }, [user, role, loadAnalytics])

 if (role !== 'superadmin' && role !== 'admin') {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
     <h1 className="text-2xl mb-4 font-heading" style={{ color: '#000000' }}>Access Denied</h1>
     <p style={{ color: '#000000', opacity: 0.7 }}>This page is only available to administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading analytics...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="System Analytics" subtitle="Comprehensive insights into platform performance and user engagement" />
   <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Time Range Selector */}
    <div className="mb-8">
     <div className="flex gap-2">
      {['7d', '30d', '90d', '1y'].map((range) => (
       <button
        key={range}
        onClick={() => setTimeRange(range)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
         timeRange === range
          ? 'bg-black text-white'
          : 'bg-white/90 backdrop-blur-sm border border-white/50 hover:bg-white'
        }`}
        style={timeRange !== range ? { color: '#000000' } : {}}
       >
        {range === '7d' ? '7 Days' :
         range === '30d' ? '30 Days' :
         range === '90d' ? '90 Days' : '1 Year'}
       </button>
      ))}
     </div>
    </div>

    {/* Key Metrics */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#91A6EB' }}>
       <Users className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>
       {systemStats.totalUsers.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Athletes</div>
      <div className="text-xs mt-1" style={{ color: '#20B2AA' }}>
       +{systemStats.monthlyGrowth}% this month
      </div>
     </div>

     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
       <Star className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>
       {systemStats.totalCreators.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Creators</div>
      <div className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>Coaches</div>
     </div>

     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#20B2AA' }}>
       <Video className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#20B2AA' }}>
       {systemStats.totalContent.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Content</div>
      <div className="text-xs mt-1" style={{ color: '#20B2AA' }}>
       {systemStats.contentPublished} published
      </div>
     </div>

     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#000000' }}>
       <Eye className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#000000' }}>
       {systemStats.totalViews.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</div>
      <div className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>All time</div>
     </div>
    </div>

    {/* Engagement Metrics */}
    <div className="grid md:grid-cols-3 gap-6 mb-12">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#91A6EB' }}>
       <Clock className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>
       {systemStats.averageWatchTime.toFixed(1)}h
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Avg Watch Time</div>
      <div className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>Per session</div>
     </div>

     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#20B2AA' }}>
       <Activity className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#20B2AA' }}>
       {systemStats.activeUsers.toLocaleString()}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Athletes</div>
      <div className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>Last 30 days</div>
     </div>

     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
       <Zap className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>
       {systemStats.monthlyGrowth}%
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Monthly Growth</div>
      <div className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>User acquisition</div>
     </div>
    </div>

    {/* Top Performing Content */}
    <div className="mb-12">
     <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>Top Performing Content</h2>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
         <tr>
          <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Content</th>
          <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Creator</th>
          <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Views</th>
          <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Watch Time</th>
          <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Completion</th>
         </tr>
        </thead>
        <tbody>
         {topContent.map((content, index) => (
          <tr key={content.id} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
           <td className="p-4">
            <div style={{ color: '#000000' }}>{content.title}</div>
           </td>
           <td className="p-4">
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{content.creatorName}</div>
           </td>
           <td className="p-4 text-center">
            <div style={{ color: '#000000' }}>{content.views.toLocaleString()}</div>
           </td>
           <td className="p-4 text-center">
            <div style={{ color: '#000000' }}>{content.watchTime.toFixed(1)}h</div>
           </td>
           <td className="p-4 text-center">
            <div style={{ color: '#000000' }}>{content.completionRate}%</div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>
    </div>

    {/* Top Creators */}
    <div className="mb-12">
     <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>Top Creators</h2>
     <div className="grid md:grid-cols-3 gap-6">
      {topCreators.map((creator) => (
       <div key={creator.uid} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center gap-3 mb-4">
         <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
          <Star className="w-6 h-6 text-white" />
         </div>
         <div>
          <h3 className="font-semibold" style={{ color: '#000000' }}>{creator.name}</h3>
          <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{creator.followers} followers</div>
         </div>
        </div>

        <div className="space-y-3">
         <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Content</span>
          <span style={{ color: '#000000' }}>{creator.contentCount}</span>
         </div>
         <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</span>
          <span style={{ color: '#000000' }}>{creator.totalViews.toLocaleString()}</span>
         </div>
         <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Rating</span>
          <span style={{ color: '#000000' }}>{creator.averageRating}/5.0</span>
         </div>
        </div>
       </div>
      ))}
     </div>
    </div>

    {/* Platform Insights */}
    <div>
     <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>Platform Insights</h2>
     <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
        <TrendingUp className="w-5 h-5" style={{ color: '#20B2AA' }} />
        Growth Trends
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>User Growth</span>
         <span className="font-semibold" style={{ color: '#20B2AA' }}>+{systemStats.monthlyGrowth}%</span>
        </div>
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>Content Growth</span>
         <span className="font-semibold" style={{ color: '#91A6EB' }}>+25%</span>
        </div>
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>Engagement Rate</span>
         <span className="font-semibold" style={{ color: '#FF6B35' }}>78%</span>
        </div>
       </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
        <Target className="w-5 h-5" style={{ color: '#91A6EB' }} />
        Performance Metrics
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>Avg Session Duration</span>
         <span className="font-semibold" style={{ color: '#91A6EB' }}>{systemStats.averageWatchTime.toFixed(1)}h</span>
        </div>
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>Content Completion</span>
         <span className="font-semibold" style={{ color: '#20B2AA' }}>85%</span>
        </div>
        <div className="flex justify-between items-center">
         <span style={{ color: '#000000', opacity: 0.7 }}>User Retention</span>
         <span className="font-semibold" style={{ color: '#FF6B35' }}>72%</span>
        </div>
       </div>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}
