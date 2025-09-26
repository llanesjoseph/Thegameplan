'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
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
 Globe,
 Crown,
 Shield,
 Database,
 Server
} from 'lucide-react'

interface SystemStats {
 totalUsers: number
 totalCreators: number
 totalAdmins: number
 totalContent: number
 totalViews: number
 averageWatchTime: number
 monthlyGrowth: number
 activeUsers: number
 contentPublished: number
 systemHealth: number
 uptime: number
 storageUsed: number
 storageLimit: number
}

interface RevenueStats {
 monthlyRevenue: number
 totalRevenue: number
 subscriptionRevenue: number
 creatorRevenue: number
 averageRevenuePerUser: number
 churnRate: number
 lifetimeValue: number
}

interface PerformanceMetrics {
 averageResponseTime: number
 errorRate: number
 concurrentUsers: number
 bandwidthUsage: number
 databaseQueries: number
 cacheHitRate: number
}

export default function SuperadminAnalytics() {
 const [systemStats, setSystemStats] = useState<SystemStats>({
  totalUsers: 0,
  totalCreators: 0,
  totalAdmins: 0,
  totalContent: 0,
  totalViews: 0,
  averageWatchTime: 0,
  monthlyGrowth: 0,
  activeUsers: 0,
  contentPublished: 0,
  systemHealth: 0,
  uptime: 0,
  storageUsed: 0,
  storageLimit: 0
 })
 
 const [revenueStats, setRevenueStats] = useState<RevenueStats>({
  monthlyRevenue: 0,
  totalRevenue: 0,
  subscriptionRevenue: 0,
  creatorRevenue: 0,
  averageRevenuePerUser: 0,
  churnRate: 0,
  lifetimeValue: 0
 })
 
 const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
  averageResponseTime: 0,
  errorRate: 0,
  concurrentUsers: 0,
  bandwidthUsage: 0,
  databaseQueries: 0,
  cacheHitRate: 0
 })
 
 const [loading, setLoading] = useState(true)
 const [timeRange, setTimeRange] = useState('30d')
 
 const { user } = useAuth()
 const { role } = useEnhancedRole()

 useEffect(() => {
  if (user && role === 'superadmin') {
   loadAnalytics()
  }
 }, [user, role, timeRange])

 const loadAnalytics = async () => {
  try {
   setLoading(true)
   
   // Load system statistics
   const usersQuery = query(collection(db, 'users'))
   const creatorsQuery = query(collection(db, 'creators'))
   const contentQuery = query(collection(db, 'content'))
   
   const [usersSnapshot, creatorsSnapshot, contentSnapshot] = await Promise.all([
    getDocs(usersQuery),
    getDocs(creatorsQuery),
    getDocs(contentQuery)
   ])
   
   const totalUsers = usersSnapshot.size
   const totalCreators = creatorsSnapshot.size
   const totalContent = contentSnapshot.size
   
   // Calculate mock stats (replace with real calculations when available)
   const totalViews = totalContent * 150
   const averageWatchTime = 8.5
   const monthlyGrowth = 15
   const activeUsers = Math.floor(totalUsers * 0.7)
   const contentPublished = Math.floor(totalContent * 0.8)
   const totalAdmins = Math.floor(totalUsers * 0.02) // 2% admin ratio
   
   setSystemStats({
    totalUsers,
    totalCreators,
    totalAdmins,
    totalContent,
    totalViews,
    averageWatchTime,
    monthlyGrowth,
    activeUsers,
    contentPublished,
    systemHealth: 98.5,
    uptime: 99.9,
    storageUsed: 45.2,
    storageLimit: 100
   })
   
   // Mock revenue stats
   setRevenueStats({
    monthlyRevenue: 125000,
    totalRevenue: 1250000,
    subscriptionRevenue: 98000,
    creatorRevenue: 27000,
    averageRevenuePerUser: 12.50,
    churnRate: 3.2,
    lifetimeValue: 156.25
   })
   
   // Mock performance metrics
   setPerformanceMetrics({
    averageResponseTime: 245,
    errorRate: 0.15,
    concurrentUsers: 1250,
    bandwidthUsage: 67.8,
    databaseQueries: 45000,
    cacheHitRate: 89.2
   })
   
  } catch (error) {
   console.error('Error loading analytics:', error)
  } finally {
   setLoading(false)
  }
 }

 if (role !== 'superadmin') {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Access Denied</h1>
     <p className="text-brand-grey">This page is only available to super administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
     <p className="mt-4 text-brand-grey">Loading system analytics...</p>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen py-16">
   <div className="max-w-7xl mx-auto px-6">
    {/* Header */}
    <div className="mb-12">
     <h1 className="text-4xl mb-4">System Analytics</h1>
     <p className="text-xl text-brand-grey">
      Comprehensive system-wide insights and performance metrics for platform management
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
          ? 'bg-red-600 text-white'
          : 'bg-white/10 text-brand-grey hover:bg-white/20'
        }`}
       >
        {range === '7d' ? '7 Days' : 
         range === '30d' ? '30 Days' :
         range === '90d' ? '90 Days' : '1 Year'}
       </button>
      ))}
     </div>
    </div>

    {/* System Health Overview */}
    <div className="grid md:grid-cols-4 gap-6 mb-12">
     <div className="card text-center">
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Server className="w-6 h-6 text-green-600" />
      </div>
      <div className="text-3xl text-green-400 mb-2">
       {systemStats.systemHealth}%
      </div>
      <div className="text-sm text-brand-grey">System Health</div>
      <div className="text-xs text-green-400 mt-1">Optimal</div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Clock className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-3xl text-blue-400 mb-2">
       {systemStats.uptime}%
      </div>
      <div className="text-sm text-brand-grey">Uptime</div>
      <div className="text-xs text-blue-400 mt-1">Last 30 days</div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Database className="w-6 h-6 text-purple-600" />
      </div>
      <div className="text-3xl text-purple-400 mb-2">
       {systemStats.storageUsed}GB
      </div>
      <div className="text-sm text-brand-grey">Storage Used</div>
      <div className="text-xs text-purple-400 mt-1">
       {systemStats.storageUsed}/{systemStats.storageLimit}GB
      </div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Users className="w-6 h-6 text-orange-600" />
      </div>
      <div className="text-3xl text-orange-400 mb-2">
       {performanceMetrics.concurrentUsers.toLocaleString()}
      </div>
      <div className="text-sm text-brand-grey">Concurrent Users</div>
      <div className="text-xs text-orange-400 mt-1">Peak today</div>
     </div>
    </div>

    {/* Key Metrics */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
     <div className="card text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Users className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-3xl text-blue-400 mb-2">
       {systemStats.totalUsers.toLocaleString()}
      </div>
      <div className="text-sm text-brand-grey">Total Athletes</div>
      <div className="text-xs text-green-400 mt-1">
       +{systemStats.monthlyGrowth}% this month
      </div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Star className="w-6 h-6 text-purple-600" />
      </div>
      <div className="text-3xl text-purple-400 mb-2">
       {systemStats.totalCreators.toLocaleString()}
      </div>
      <div className="text-sm text-brand-grey">Active Coaches</div>
      <div className="text-xs text-purple-400 mt-1">Coaches</div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Shield className="w-6 h-6 text-red-600" />
      </div>
      <div className="text-3xl text-red-400 mb-2">
       {systemStats.totalAdmins.toLocaleString()}
      </div>
      <div className="text-sm text-brand-grey">Administrators</div>
      <div className="text-xs text-red-400 mt-1">Platform admins</div>
     </div>

     <div className="card text-center">
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <Video className="w-6 h-6 text-green-600" />
      </div>
      <div className="text-3xl text-green-400 mb-2">
       {systemStats.totalContent.toLocaleString()}
      </div>
      <div className="text-sm text-brand-grey">Total Content</div>
      <div className="text-xs text-green-400 mt-1">
       {systemStats.contentPublished} published
      </div>
     </div>
    </div>

    {/* Revenue Metrics */}
    <div className="mb-12">
     <h2 className="text-2xl font-semibold mb-6">Revenue Analytics</h2>
     <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card text-center">
       <div className="text-3xl text-green-400 mb-2">
        ${(revenueStats.monthlyRevenue / 1000).toFixed(1)}k
       </div>
       <div className="text-sm text-brand-grey">Monthly Revenue</div>
       <div className="text-xs text-green-400 mt-1">Current month</div>
      </div>

      <div className="card text-center">
       <div className="text-3xl text-blue-400 mb-2">
        ${(revenueStats.totalRevenue / 1000000).toFixed(1)}M
       </div>
       <div className="text-sm text-brand-grey">Total Revenue</div>
       <div className="text-xs text-blue-400 mt-1">All time</div>
      </div>

      <div className="card text-center">
       <div className="text-3xl text-purple-400 mb-2">
        ${revenueStats.averageRevenuePerUser.toFixed(2)}
       </div>
       <div className="text-sm text-brand-grey">ARPU</div>
       <div className="text-xs text-purple-400 mt-1">Per user/month</div>
      </div>

      <div className="card text-center">
       <div className="text-3xl text-orange-400 mb-2">
        {revenueStats.churnRate}%
       </div>
       <div className="text-sm text-brand-grey">Churn Rate</div>
       <div className="text-xs text-orange-400 mt-1">Monthly</div>
      </div>
     </div>
    </div>

    {/* Performance Metrics */}
    <div className="mb-12">
     <h2 className="text-2xl font-semibold mb-6">Performance Metrics</h2>
     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card">
       <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        Response Time
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Average</span>
         <span className="font-medium text-blue-400">{performanceMetrics.averageResponseTime}ms</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">95th Percentile</span>
         <span className="font-medium text-blue-400">450ms</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">99th Percentile</span>
         <span className="font-medium text-blue-400">850ms</span>
        </div>
       </div>
      </div>

      <div className="card">
       <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-green-400" />
        System Performance
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Error Rate</span>
         <span className="font-medium text-green-400">{performanceMetrics.errorRate}%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Cache Hit Rate</span>
         <span className="font-medium text-green-400">{performanceMetrics.cacheHitRate}%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Database Queries</span>
         <span className="font-medium text-green-400">{performanceMetrics.databaseQueries.toLocaleString()}/min</span>
        </div>
       </div>
      </div>

      <div className="card">
       <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-400" />
        Resource Usage
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Bandwidth</span>
         <span className="font-medium text-purple-400">{performanceMetrics.bandwidthUsage}%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">CPU Usage</span>
         <span className="font-medium text-purple-400">67%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Memory Usage</span>
         <span className="font-medium text-purple-400">78%</span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* System Insights */}
    <div>
     <h2 className="text-2xl font-semibold mb-6">System Insights</h2>
     <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
       <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Growth Trends
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">User Growth</span>
         <span className="font-medium text-green-400">+{systemStats.monthlyGrowth}%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Content Growth</span>
         <span className="font-medium text-blue-400">+25%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Revenue Growth</span>
         <span className="font-medium text-purple-400">+18%</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Creator Growth</span>
         <span className="font-medium text-orange-400">+12%</span>
        </div>
       </div>
      </div>

      <div className="card">
       <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-red-400" />
        Platform Health
       </h3>
       <div className="space-y-4">
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">System Status</span>
         <span className="font-medium text-green-400">Healthy</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Security Score</span>
         <span className="font-medium text-blue-400">92/100</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">Performance Score</span>
         <span className="font-medium text-purple-400">88/100</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-brand-grey">User Satisfaction</span>
         <span className="font-medium text-orange-400">4.7/5.0</span>
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>
  </main>
 )
}
