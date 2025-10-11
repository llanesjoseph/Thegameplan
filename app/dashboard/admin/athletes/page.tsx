'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import {
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react'

interface AthleteData {
  id: string
  displayName?: string
  email?: string
  role: string
  createdAt?: any
  lastActive?: any
  videosWatched?: number
  totalWatchTime?: number
  completionRate?: number
  subscriptionStatus?: 'active' | 'inactive' | 'trial'
}

export default function Athletes() {
  const [athletes, setAthletes] = useState<AthleteData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeAthletes: 0,
    averageWatchTime: 0,
    averageCompletion: 0
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        setLoading(true)

        // Get all athletes (users with role 'athlete' or 'user')
        const athletesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['athlete', 'user'])
        )
        const athletesSnapshot = await getDocs(athletesQuery)

        // Calculate stats for each athlete
        const athletesData = athletesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
            lastActive: data.lastActive,
            videosWatched: data.videosWatched || 0,
            totalWatchTime: data.totalWatchTime || 0,
            completionRate: data.completionRate || 0,
            subscriptionStatus: data.subscriptionStatus || 'inactive'
          }
        })

        setAthletes(athletesData)

        // Calculate active athletes (active in last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const activeAthletes = athletesData.filter((athlete) => {
          if (!athlete.lastActive) return false
          const lastActiveDate = athlete.lastActive.toDate ? athlete.lastActive.toDate() : new Date(athlete.lastActive)
          return lastActiveDate >= thirtyDaysAgo
        }).length

        // Calculate averages
        const totalWatchTime = athletesData.reduce((sum, a) => sum + (a.totalWatchTime || 0), 0)
        const totalCompletion = athletesData.reduce((sum, a) => sum + (a.completionRate || 0), 0)

        setStats({
          totalAthletes: athletesData.length,
          activeAthletes,
          averageWatchTime: athletesData.length > 0 ? totalWatchTime / athletesData.length : 0,
          averageCompletion: athletesData.length > 0 ? totalCompletion / athletesData.length : 0
        })
      } catch (error) {
        console.error('Error loading athletes:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && (role === 'superadmin' || role === 'admin')) {
      loadAthletes()
    }
  }, [user, role])

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      athlete.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' || athlete.subscriptionStatus === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { bg: '#20B2AA', label: 'Active' },
      trial: { bg: '#91A6EB', label: 'Trial' },
      inactive: { bg: '#666', label: 'Inactive' }
    }
    const config = configs[status as keyof typeof configs] || configs.inactive
    return (
      <span
        className="px-3 py-1 rounded-full text-xs text-white"
        style={{ backgroundColor: config.bg }}
      >
        {config.label}
      </span>
    )
  }

  const formatDate = (date: any) => {
    if (!date) return 'Never'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString()
  }

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
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading athletes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Athletes" subtitle="Manage athlete accounts and progress" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#91A6EB' }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#91A6EB' }}>
              {stats.totalAthletes}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Athletes</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#20B2AA' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#20B2AA' }}>
              {stats.activeAthletes}
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Active (30d)</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#FF6B35' }}>
              {stats.averageWatchTime.toFixed(1)}h
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Avg Watch Time</div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#000000' }}>
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl mb-2" style={{ color: '#000000' }}>
              {stats.averageCompletion.toFixed(0)}%
            </div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Avg Completion</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search athletes by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Athletes Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                <tr>
                  <th className="text-left p-4" style={{ color: '#000000' }}>Athlete</th>
                  <th className="text-center p-4" style={{ color: '#000000' }}>Status</th>
                  <th className="text-center p-4" style={{ color: '#000000' }}>Videos Watched</th>
                  <th className="text-center p-4" style={{ color: '#000000' }}>Watch Time</th>
                  <th className="text-center p-4" style={{ color: '#000000' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((athlete) => (
                  <tr key={athlete.id} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <div style={{ color: '#000000' }}>{athlete.displayName || 'No name'}</div>
                        <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{athlete.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(athlete.subscriptionStatus || 'inactive')}
                    </td>
                    <td className="p-4 text-center">
                      <div style={{ color: '#000000' }}>{athlete.videosWatched || 0}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div style={{ color: '#000000' }}>{(athlete.totalWatchTime || 0).toFixed(1)}h</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                        {formatDate(athlete.lastActive)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
