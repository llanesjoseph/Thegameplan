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

        // Get all content (lessons and videos)
        const contentSnapshot = await getDocs(collection(db, 'content'))

        // Calculate stats for each coach
        const coachesData = await Promise.all(
          coachesSnapshot.docs.map(async (coachDoc) => {
            const coachData = coachDoc.data()
            const coachId = coachDoc.id

            // Get coach's content (lessons and videos)
            const coachContent = contentSnapshot.docs.filter(
              (contentDoc) => contentDoc.data().creatorUid === coachId
            )

            const videoCount = coachContent.length
            const totalViews = coachContent.reduce(
              (sum, contentDoc) => sum + (contentDoc.data().viewCount || contentDoc.data().views || 0),
              0
            )

            // Calculate average rating
            const ratings = coachContent
              .map((c) => c.data().averageRating || c.data().rating)
              .filter((r) => r !== undefined && r > 0)
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
        const totalVideos = contentSnapshot.size
        const totalViews = contentSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().viewCount || doc.data().views || 0),
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

  const adminTools: Resource[] = [
    {
      id: '11',
      title: 'Success Stories',
      description: 'Manage and publish case studies of top-performing coaches',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/success-stories'
    },
    {
      id: '12',
      title: 'Monthly Tips Newsletter',
      description: 'Create and send monthly best practices to all coaches',
      type: 'document',
      url: '/dashboard/admin/coaches-locker-room/monthly-tips'
    },
    {
      id: '13',
      title: 'Coach Forum/Chat',
      description: 'Moderate and manage coach community discussions',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/forum'
    },
    {
      id: '14',
      title: 'Coach Announcements',
      description: 'Send announcements via email or direct message to all coaches',
      type: 'guide',
      url: '/dashboard/admin/coaches-locker-room/announcements'
    }
  ]

  if (role !== 'superadmin' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
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
            <div className="text-4xl mb-2" style={{ color: '#20B2AA' }}>
              {stats.totalCoaches}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Coaches</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#91A6EB' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#91A6EB' }}>
              {stats.activeCoaches}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active Coaches</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#FF6B35' }}>
              {stats.totalVideos}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Videos</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#000000' }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#000000' }}>
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</div>
          </div>
        </div>

        {/* Admin Tools for Coach Management */}
        <div className="mb-12">
          <h2 className="text-2xl mb-6" style={{ color: '#000000' }}>Admin Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminTools.map((tool) => (
              <a key={tool.id} href={tool.url} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-2xl transition-all hover:scale-105">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#20B2AA' }}>
                  {tool.type === 'guide' && <MessageSquare className="w-6 h-6 text-white" />}
                  {tool.type === 'document' && <FileText className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>{tool.title}</h3>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{tool.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Coaches List */}
        <div>
          <h2 className="text-2xl mb-6" style={{ color: '#000000' }}>All Coaches</h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                  <tr>
                    <th className="text-left p-4" style={{ color: '#000000' }}>Coach</th>
                    <th className="text-center p-4" style={{ color: '#000000' }}>Videos</th>
                    <th className="text-center p-4" style={{ color: '#000000' }}>Total Views</th>
                    <th className="text-center p-4" style={{ color: '#000000' }}>Avg Rating</th>
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
