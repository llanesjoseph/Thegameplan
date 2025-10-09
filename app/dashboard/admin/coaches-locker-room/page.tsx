'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, where, orderBy, doc, updateDoc } from 'firebase/firestore'
import {
  Target,
  Users,
  Video,
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  Download,
  Upload,
  BookOpen
} from 'lucide-react'

interface CoachData {
  id: string
  displayName?: string
  email?: string
  role: string
  createdAt?: any
  videoCount?: number
  totalViews?: number
  averageRating?: number
}

interface Resource {
  id: string
  title: string
  description: string
  type: 'guide' | 'template' | 'video' | 'document'
  url: string
}

export default function CoachesLockerRoom() {
  const [coaches, setCoaches] = useState<CoachData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCoaches: 0,
    activeCoaches: 0,
    totalVideos: 0,
    totalViews: 0
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    const loadCoachData = async () => {
      try {
        setLoading(true)

        // Get all coaches
        const coachesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['coach', 'creator'])
        )
        const coachesSnapshot = await getDocs(coachesQuery)

        // Get all videos
        const videosSnapshot = await getDocs(collection(db, 'videos'))

        // Calculate stats for each coach
        const coachesData = await Promise.all(
          coachesSnapshot.docs.map(async (coachDoc) => {
            const coachData = coachDoc.data()
            const coachId = coachDoc.id

            // Get coach's videos
            const coachVideos = videosSnapshot.docs.filter(
              (videoDoc) => videoDoc.data().creatorId === coachId
            )

            const videoCount = coachVideos.length
            const totalViews = coachVideos.reduce(
              (sum, videoDoc) => sum + (videoDoc.data().views || 0),
              0
            )

            // Calculate average rating
            const ratings = coachVideos
              .map((v) => v.data().rating)
              .filter((r) => r !== undefined)
            const averageRating =
              ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                : 0

            return {
              id: coachId,
              displayName: coachData.displayName,
              email: coachData.email,
              role: coachData.role,
              createdAt: coachData.createdAt,
              videoCount,
              totalViews,
              averageRating
            }
          })
        )

        setCoaches(coachesData)

        // Calculate overall stats
        const totalVideos = videosSnapshot.size
        const totalViews = videosSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().views || 0),
          0
        )
        const activeCoaches = coachesData.filter((c) => c.videoCount > 0).length

        setStats({
          totalCoaches: coachesData.length,
          activeCoaches,
          totalVideos,
          totalViews
        })
      } catch (error) {
        console.error('Error loading coach data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && (role === 'superadmin' || role === 'admin')) {
      loadCoachData()
    }
  }, [user, role])

  const gettingStartedResources: Resource[] = [
    {
      id: '1',
      title: 'Quick Start Guide',
      description: '5-step process to go from signup to first video',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/quick-start-guide'
    },
    {
      id: '2',
      title: 'Platform Walkthrough',
      description: 'Interactive tour of all coach features',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/platform-walkthrough'
    },
    {
      id: '3',
      title: 'Equipment Setup Guide',
      description: 'Recommended cameras, mics, lighting for quality videos',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/equipment-setup'
    },
    {
      id: '4',
      title: 'First Video Checklist',
      description: 'Essential elements for your debut content',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/first-video-checklist'
    }
  ]

  const contentCreationResources: Resource[] = [
    {
      id: '5',
      title: 'Video Best Practices',
      description: 'Engagement tips, ideal length, pacing, structure',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/video-best-practices'
    },
    {
      id: '6',
      title: 'Content Templates',
      description: 'Pre-built outlines for drills, technique, mental game',
      type: 'template',
      url: '/dashboard/admin/coaches-locker-room/content-templates'
    },
    {
      id: '7',
      title: 'Scripting Guide',
      description: 'How to plan and script effective training videos',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/scripting-guide'
    },
    {
      id: '8',
      title: 'Editing Resources',
      description: 'Free/affordable editing tools and tutorials',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/editing-resources'
    },
    {
      id: '9',
      title: 'Thumbnail Design Guide',
      description: 'Creating eye-catching video thumbnails',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/thumbnail-design'
    }
  ]

  const communityResources: Resource[] = [
    {
      id: '10',
      title: 'Coach Directory',
      description: 'Browse other coaches for inspiration',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/coach-directory'
    },
    {
      id: '11',
      title: 'Success Stories',
      description: 'Case studies of top-performing coaches',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/success-stories'
    },
    {
      id: '12',
      title: 'Monthly Tips Newsletter',
      description: 'Best practices from the community',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/monthly-tips'
    },
    {
      id: '13',
      title: 'Coach Forum/Chat',
      description: 'Connect with other coaches',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/forum'
    }
  ]

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
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading coach resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Coaches Locker Room" subtitle="Manage coach resources and tools" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#20B2AA' }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-heading mb-2" style={{ color: '#20B2AA' }}>
              {stats.totalCoaches}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Coaches</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#91A6EB' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>
              {stats.activeCoaches}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Coaches</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>
              {stats.totalVideos}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Videos</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#000000' }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-heading mb-2" style={{ color: '#000000' }}>
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</div>
          </div>
        </div>

        {/* Coach Announcements */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading">Coach Announcements</h2>
              <a
                href="/dashboard/admin/coaches-locker-room/announcements"
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Manage Announcements
              </a>
            </div>
            <p className="opacity-90">Send important updates, tips, and news to all coaches via email or direct message.</p>
          </div>
        </div>

        {/* Getting Started Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>🚀 Getting Started</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gettingStartedResources.map((resource) => (
              <a key={resource.id} href={resource.url} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#20B2AA' }}>
                  {resource.type === 'guide' && <BookOpen className="w-6 h-6 text-white" />}
                  {resource.type === 'template' && <FileText className="w-6 h-6 text-white" />}
                  {resource.type === 'video' && <Video className="w-6 h-6 text-white" />}
                  {resource.type === 'document' && <FileText className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>{resource.title}</h3>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{resource.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Content Creation Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>🎬 Content Creation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentCreationResources.map((resource) => (
              <a key={resource.id} href={resource.url} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#91A6EB' }}>
                  {resource.type === 'guide' && <BookOpen className="w-6 h-6 text-white" />}
                  {resource.type === 'template' && <FileText className="w-6 h-6 text-white" />}
                  {resource.type === 'video' && <Video className="w-6 h-6 text-white" />}
                  {resource.type === 'document' && <FileText className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>{resource.title}</h3>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{resource.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Community Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>🤝 Community</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityResources.map((resource) => (
              <a key={resource.id} href={resource.url} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#FF6B35' }}>
                  {resource.type === 'guide' && <BookOpen className="w-6 h-6 text-white" />}
                  {resource.type === 'template' && <FileText className="w-6 h-6 text-white" />}
                  {resource.type === 'video' && <Video className="w-6 h-6 text-white" />}
                  {resource.type === 'document' && <FileText className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>{resource.title}</h3>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{resource.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Coaches List */}
        <div>
          <h2 className="text-2xl font-heading mb-6" style={{ color: '#000000' }}>All Coaches</h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                  <tr>
                    <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Coach</th>
                    <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Videos</th>
                    <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Total Views</th>
                    <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {coaches.map((coach) => (
                    <tr key={coach.id} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div style={{ color: '#000000' }}>{coach.displayName || 'No name'}</div>
                          <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{coach.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: '#000000' }}>{coach.videoCount || 0}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div style={{ color: '#000000' }}>{(coach.totalViews || 0).toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4" style={{ color: '#FF6B35', fill: '#FF6B35' }} />
                          <span style={{ color: '#000000' }}>{(coach.averageRating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
