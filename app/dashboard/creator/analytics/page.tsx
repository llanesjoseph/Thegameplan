'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { AnalyticsService } from '@/lib/analytics'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Star, 
  MessageSquare,
  Calendar,
  Target,
  Award
} from 'lucide-react'

interface ContentStats {
  id: string
  title: string
  views: number
  viewDuration: number
  completionRate: number
  engagement: number
  createdAt: Date
}

interface AudienceStats {
  totalFollowers: number
  activeViewers: number
  averageEngagement: number
  topEngagement: number
  monthlyGrowth: number
}

export default function CreatorAnalytics() {
  const [contentStats, setContentStats] = useState<ContentStats[]>([])
  const [audienceStats, setAudienceStats] = useState<AudienceStats>({
    totalFollowers: 0,
    activeViewers: 0,
    averageEngagement: 0,
    topEngagement: 0,
    monthlyGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()

  const loadAnalytics = useCallback(async () => {
    if (!user?.uid) return
    
    try {
      setLoading(true)
      
      // Load real analytics data using the AnalyticsService
      const [creatorAnalytics, lessonAnalytics] = await Promise.all([
        AnalyticsService.getCreatorAnalytics(user.uid),
        AnalyticsService.getCreatorLessonAnalytics(user.uid)
      ])
      
      // Update content count for creator
      await AnalyticsService.updateCreatorContentCount(user.uid)
      
      // Set lesson analytics data
      setContentStats(lessonAnalytics)
      
      // Set audience stats from real creator analytics
      if (creatorAnalytics) {
        setAudienceStats({
          totalFollowers: creatorAnalytics.totalFollowers,
          activeViewers: creatorAnalytics.activeViewers,
          averageEngagement: creatorAnalytics.averageEngagement,
          topEngagement: creatorAnalytics.topEngagement,
          monthlyGrowth: creatorAnalytics.monthlyGrowth
        })
      } else {
        // Set zero values if no analytics exist yet
        setAudienceStats({
          totalFollowers: 0,
          activeViewers: 0,
          averageEngagement: 0,
          topEngagement: 0,
          monthlyGrowth: 0
        })
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Set zero values on error to prevent empty state flickering
      setContentStats([])
      setAudienceStats({
        totalFollowers: 0,
        activeViewers: 0,
        averageEngagement: 0,
        topEngagement: 0,
        monthlyGrowth: 0
      })
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    if (user?.uid && (role === 'creator' || role === 'superadmin')) {
      loadAnalytics()
    } else if (!roleLoading && role && role !== 'creator' && role !== 'superadmin') {
      setLoading(false)
    }
  }, [user?.uid, role, roleLoading, loadAnalytics])

  // Show loading until we know the role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cardinal mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied for non-creators (but allow superadmins)
  if (role !== 'creator' && role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Access Denied</h1>
          <p className="text-gray-600">This page is only available to creators.</p>
        </div>
      </div>
    )
  }

  // Show loading for analytics data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cardinal mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Analytics</h1>
          <p className="text-gray-600">
            Track your content performance and audience engagement
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-cardinal text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : 
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cardinal" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {audienceStats.totalFollowers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Followers</div>
            <div className="text-xs text-green-600 mt-1">
              +{audienceStats.monthlyGrowth}% this month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {audienceStats.activeViewers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Active Viewers</div>
            <div className="text-xs text-cardinal mt-1">Last 30 days</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {audienceStats.averageEngagement}%
            </div>
            <div className="text-sm text-gray-600">Avg Engagement</div>
            <div className="text-xs text-purple-600 mt-1">Per lesson</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {audienceStats.topEngagement}%
            </div>
            <div className="text-sm text-gray-600">Engagement Rate</div>
            <div className="text-xs text-orange-600 mt-1">Top performing</div>
          </div>
        </div>

        {/* Content Performance */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Content Performance</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {contentStats.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
                <p className="text-gray-600">Create your first lesson to see analytics here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">Content</th>
                      <th className="text-center p-4 font-medium text-gray-900">Views</th>
                      <th className="text-center p-4 font-medium text-gray-900">View Duration</th>
                      <th className="text-center p-4 font-medium text-gray-900">Completion</th>
                      <th className="text-center p-4 font-medium text-gray-900">Engagement</th>
                      <th className="text-center p-4 font-medium text-gray-900">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentStats.map((content, index) => (
                      <tr key={content.id} className="border-t border-gray-100">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{content.title}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-medium text-gray-900">{content.views.toLocaleString()}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-medium text-gray-900">{content.viewDuration.toFixed(1)}m</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-medium text-gray-900">{content.completionRate.toFixed(1)}%</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-medium text-gray-900">{content.engagement.toFixed(1)}%</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-sm text-gray-600">
                            {content.createdAt.toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Growth Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Growth Insights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Audience Growth
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Growth</span>
                  <span className="font-medium text-green-600">+{audienceStats.monthlyGrowth}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-medium text-gray-900">{audienceStats.topEngagement}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Retention</span>
                  <span className="font-medium text-cardinal">{audienceStats.topEngagement > 0 ? `${Math.floor(audienceStats.topEngagement * 0.85)}%` : '0%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cardinal" />
                Content Strategy
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Best Performing</span>
                  <span className="font-medium text-gray-900">
                    {contentStats.length > 0 ? contentStats[0]?.title || 'None yet' : 'None yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Optimal Length</span>
                  <span className="font-medium text-purple-600">{contentStats.length > 0 ? 'Based on data' : 'No data yet'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Publish Frequency</span>
                  <span className="font-medium text-green-600">{contentStats.length > 0 ? 'Based on data' : 'No data yet'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recommendations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-cardinal p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Content Timing</h3>
              <p className="text-gray-600 text-sm mb-4">
                {audienceStats.totalFollowers > 0 ? 'Analyze your audience data to find optimal posting times.' : 'Start creating content to gather audience insights.'}
              </p>
              <div className="text-xs text-cardinal">Publish during these times for maximum engagement</div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-green-500 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Content Length</h3>
              <p className="text-gray-600 text-sm mb-4">
                {contentStats.length > 0 ? 'Analyze your content performance to optimize length.' : 'Create content to discover optimal lengths.'}
              </p>
              <div className="text-xs text-green-600">Focus on this optimal length range</div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-purple-500 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Engagement Boost</h3>
              <p className="text-gray-600 text-sm mb-4">
                {audienceStats.averageEngagement > 0 ? 'Add interactive elements to boost engagement.' : 'Start engaging with your audience to build analytics.'}
              </p>
              <div className="text-xs text-purple-600">Add quizzes and challenges to your content</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}