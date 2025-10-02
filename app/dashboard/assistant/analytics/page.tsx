'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Trophy,
  Target,
  Clock,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  athleteMetrics: {
    totalAthletes: number
    activeAthletes: number
    averageProgress: number
    completionRate: number
  }
  sessionMetrics: {
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    averageDuration: string
  }
  performanceMetrics: {
    improvementRate: number
    goalAchievement: number
    topPerformers: Array<{ name: string; score: number }>
  }
}

export default function AssistantAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        athleteMetrics: {
          totalAthletes: 24,
          activeAthletes: 21,
          averageProgress: 68,
          completionRate: 87
        },
        sessionMetrics: {
          totalSessions: 156,
          completedSessions: 142,
          cancelledSessions: 14,
          averageDuration: '1h 15m'
        },
        performanceMetrics: {
          improvementRate: 23,
          goalAchievement: 78,
          topPerformers: [
            { name: 'John Smith', score: 95 },
            { name: 'Sarah Johnson', score: 92 },
            { name: 'Mike Davis', score: 88 }
          ]
        }
      })
      setLoading(false)
    }, 1000)
  }, [timeRange])

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track performance metrics and athlete progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={setTimeRange} className="mb-6">
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Athletes</p>
                <p className="text-2xl font-bold">{analyticsData.athleteMetrics.activeAthletes}</p>
                <p className="text-xs text-green-600 mt-1">
                  +12% from last month
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData.athleteMetrics.completionRate}%</p>
                <p className="text-xs text-green-600 mt-1">
                  +5% from last month
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">{analyticsData.athleteMetrics.averageProgress}%</p>
                <p className="text-xs text-green-600 mt-1">
                  +8% from last month
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">{analyticsData.sessionMetrics.totalSessions}</p>
                <p className="text-xs text-green-600 mt-1">
                  +18% from last month
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Session Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Session Analytics</CardTitle>
            <CardDescription>Training session breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-gray-600">
                    {analyticsData.sessionMetrics.completedSessions} sessions
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(analyticsData.sessionMetrics.completedSessions / analyticsData.sessionMetrics.totalSessions) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cancelled</span>
                  <span className="text-sm text-gray-600">
                    {analyticsData.sessionMetrics.cancelledSessions} sessions
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{
                      width: `${(analyticsData.sessionMetrics.cancelledSessions / analyticsData.sessionMetrics.totalSessions) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Duration</span>
                  <span className="font-semibold">{analyticsData.sessionMetrics.averageDuration}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Athlete improvement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-semibold">Improvement Rate</p>
                    <p className="text-sm text-gray-600">Average across all athletes</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  +{analyticsData.performanceMetrics.improvementRate}%
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-semibold">Goal Achievement</p>
                    <p className="text-sm text-gray-600">Athletes meeting targets</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {analyticsData.performanceMetrics.goalAchievement}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Athletes with highest performance scores this {timeRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.performanceMetrics.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{performer.name}</p>
                    <p className="text-sm text-gray-600">Performance Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{performer.score}</p>
                    <p className="text-xs text-green-600">+{Math.floor(Math.random() * 10 + 5)}% this month</p>
                  </div>
                  {index === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">John Smith achieved personal best</p>
                <p className="text-sm text-gray-600">Completed advanced training module with 95% score</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">New training session scheduled</p>
                <p className="text-sm text-gray-600">Group session for intermediate athletes tomorrow at 10 AM</p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">Weekly report generated</p>
                <p className="text-sm text-gray-600">All athlete progress reports have been compiled</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}