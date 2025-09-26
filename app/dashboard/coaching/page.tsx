'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore'
import {
 Users,
 Search,
 Filter,
 TrendingUp,
 Calendar,
 Clock,
 Target,
 Star,
 Award,
 Activity,
 MessageCircle,
 Video,
 FileText,
 BarChart3,
 PieChart,
 ChevronRight,
 Plus,
 Edit,
 Eye,
 Settings
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'

// Mock athletes data with comprehensive information
const mockAthletes = [
 {
  id: 1,
  name: 'Sarah Johnson',
  sport: 'Soccer',
  position: 'Midfielder',
  level: 'Intermediate',
  age: 16,
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b3?w=150&h=150&fit=crop&crop=face',
  joinDate: '2024-01-15',
  lastSession: '2024-09-20',
  totalSessions: 24,
  progressScore: 85,
  improvements: ['Ball Control', 'Passing Accuracy', 'Decision Making'],
  currentGoals: ['Improve shooting accuracy', 'Master tactical awareness'],
  upcomingSessions: 2,
  performance: {
   consistency: 88,
   technique: 82,
   fitness: 90,
   mental: 85
  },
  recentActivities: [
   { type: 'session', date: '2024-09-20', description: 'Individual Training - Ball Control' },
   { type: 'goal', date: '2024-09-18', description: 'Achieved: 85% passing accuracy' },
   { type: 'assessment', date: '2024-09-15', description: 'Monthly progress evaluation' }
  ]
 },
 {
  id: 2,
  name: 'Mike Chen',
  sport: 'Basketball',
  position: 'Point Guard',
  level: 'Beginner',
  age: 14,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  joinDate: '2024-02-20',
  lastSession: '2024-09-19',
  totalSessions: 18,
  progressScore: 92,
  improvements: ['Dribbling', 'Free Throws', 'Court Vision'],
  currentGoals: ['Consistent free throw shooting', 'Master pick and roll'],
  upcomingSessions: 1,
  performance: {
   consistency: 85,
   technique: 88,
   fitness: 87,
   mental: 90
  },
  recentActivities: [
   { type: 'session', date: '2024-09-19', description: 'Group Training - Fundamentals' },
   { type: 'achievement', date: '2024-09-17', description: 'Scored personal best: 15 points' },
   { type: 'session', date: '2024-09-14', description: 'Individual Training - Shooting' }
  ]
 },
 {
  id: 3,
  name: 'Emma Davis',
  sport: 'Soccer',
  position: 'Forward',
  level: 'Advanced',
  age: 17,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  joinDate: '2023-11-10',
  lastSession: '2024-09-21',
  totalSessions: 45,
  progressScore: 78,
  improvements: ['Finishing', 'Off-ball Movement', 'Leadership'],
  currentGoals: ['Improve weak foot shooting', 'Develop playmaking skills'],
  upcomingSessions: 3,
  performance: {
   consistency: 92,
   technique: 89,
   fitness: 85,
   mental: 88
  },
  recentActivities: [
   { type: 'session', date: '2024-09-21', description: 'Individual Training - Finishing' },
   { type: 'goal', date: '2024-09-19', description: 'Completed: 50 successful crosses' },
   { type: 'assessment', date: '2024-09-16', description: 'Tactical awareness evaluation' }
  ]
 },
 {
  id: 4,
  name: 'Alex Rivera',
  sport: 'Basketball',
  position: 'Center',
  level: 'Intermediate',
  age: 15,
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  joinDate: '2024-03-05',
  lastSession: '2024-09-18',
  totalSessions: 21,
  progressScore: 88,
  improvements: ['Post Moves', 'Rebounding', 'Defense'],
  currentGoals: ['Master hook shot', 'Improve mobility'],
  upcomingSessions: 1,
  performance: {
   consistency: 87,
   technique: 86,
   fitness: 82,
   mental: 89
  },
  recentActivities: [
   { type: 'session', date: '2024-09-18', description: 'Individual Training - Post Play' },
   { type: 'achievement', date: '2024-09-16', description: 'Personal record: 12 rebounds' },
   { type: 'session', date: '2024-09-13', description: 'Group Session - Defense' }
  ]
 }
]

interface AthleteStats {
 totalAthletes: number
 activeSessions: number
 avgProgressScore: number
 upcomingSessionsTotal: number
}

export default function AthleteManagementPage() {
 const { user } = useAuth()
 const { role, loading } = useEnhancedRole()
 const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'analytics'>('overview')
 const [searchTerm, setSearchTerm] = useState('')
 const [sportFilter, setSportFilter] = useState('all')
 const [levelFilter, setLevelFilter] = useState('all')
 const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
 const [showAthleteDetail, setShowAthleteDetail] = useState(false)

 // Calculate stats
 const stats: AthleteStats = {
  totalAthletes: mockAthletes.length,
  activeSessions: mockAthletes.reduce((sum, athlete) => sum + athlete.upcomingSessions, 0),
  avgProgressScore: Math.round(mockAthletes.reduce((sum, athlete) => sum + athlete.progressScore, 0) / mockAthletes.length),
  upcomingSessionsTotal: mockAthletes.reduce((sum, athlete) => sum + athlete.upcomingSessions, 0)
 }

 // Filter athletes
 const filteredAthletes = mockAthletes.filter(athlete => {
  const matchesSearch = searchTerm === '' ||
   athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   athlete.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
   athlete.position.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesSport = sportFilter === 'all' || athlete.sport.toLowerCase() === sportFilter.toLowerCase()
  const matchesLevel = levelFilter === 'all' || athlete.level.toLowerCase() === levelFilter.toLowerCase()

  return matchesSearch && matchesSport && matchesLevel
 })

 const handleAthleteClick = (athlete: any) => {
  setSelectedAthlete(athlete)
  setShowAthleteDetail(true)
 }

 const getProgressColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-100'
  if (score >= 80) return 'text-blue-600 bg-blue-100'
  if (score >= 70) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
 }

 const getLevelBadgeColor = (level: string) => {
  switch (level.toLowerCase()) {
   case 'beginner': return 'bg-green-100 text-green-700'
   case 'intermediate': return 'bg-blue-100 text-blue-700'
   case 'advanced': return 'bg-purple-100 text-purple-700'
   default: return 'bg-gray-100 text-gray-700'
  }
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
     <p className="mt-4 text-brand-grey">Loading athlete management...</p>
    </div>
   </div>
  )
 }

 if (!user) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Sign In Required</h1>
     <p className="text-brand-grey mb-6">Please sign in to access athlete management.</p>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader />
   <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Header */}
    <div className="text-center mb-8">
     <h1 className="text-4xl font-heading uppercase tracking-wide mb-2" style={{ color: '#000000' }}>
      Manage Athletes
     </h1>
     <p className="text-lg" style={{ color: '#000000' }}>
      Track progress, schedule sessions, and develop your athletes' potential
     </p>
    </div>

    {/* Tab Navigation */}
    <div className="flex gap-1 mb-8 bg-white/80 rounded-xl p-1 shadow-lg border border-white/50">
     <button
      onClick={() => setActiveTab('overview')}
      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
       activeTab === 'overview'
        ? 'text-white shadow-lg'
        : 'hover:opacity-80'
      }`}
      style={activeTab === 'overview' ? { backgroundColor: '#000000' } : { color: '#000000' }}
     >
      <BarChart3 className="w-5 h-5 inline mr-2" />
      Overview
     </button>
     <button
      onClick={() => setActiveTab('athletes')}
      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
       activeTab === 'athletes'
        ? 'text-white shadow-lg'
        : 'hover:opacity-80'
      }`}
      style={activeTab === 'athletes' ? { backgroundColor: '#000000' } : { color: '#000000' }}
     >
      <Users className="w-5 h-5 inline mr-2" />
      Athletes ({mockAthletes.length})
     </button>
     <button
      onClick={() => setActiveTab('analytics')}
      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
       activeTab === 'analytics'
        ? 'text-white shadow-lg'
        : 'hover:opacity-80'
      }`}
      style={activeTab === 'analytics' ? { backgroundColor: '#000000' } : { color: '#000000' }}
     >
      <PieChart className="w-5 h-5 inline mr-2" />
      Analytics
     </button>
    </div>

    {/* Overview Tab */}
    {activeTab === 'overview' && (
     <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm font-medium text-gray-600">Total Athletes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAthletes}</p>
         </div>
         <div className="p-3 bg-blue-100 rounded-full">
          <Users className="w-6 h-6 text-blue-600" />
         </div>
        </div>
       </div>

       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm font-medium text-gray-600">Active Sessions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
         </div>
         <div className="p-3 bg-green-100 rounded-full">
          <Calendar className="w-6 h-6 text-green-600" />
         </div>
        </div>
       </div>

       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm font-medium text-gray-600">Avg Progress</p>
          <p className="text-3xl font-bold text-gray-900">{stats.avgProgressScore}%</p>
         </div>
         <div className="p-3 bg-purple-100 rounded-full">
          <TrendingUp className="w-6 h-6 text-purple-600" />
         </div>
        </div>
       </div>

       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessionsTotal}</p>
         </div>
         <div className="p-3 bg-orange-100 rounded-full">
          <Clock className="w-6 h-6 text-orange-600" />
         </div>
        </div>
       </div>
      </div>

      {/* Recent Activity & Top Performers */}
      <div className="grid lg:grid-cols-2 gap-8">
       {/* Recent Activity */}
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
         <Activity className="w-5 h-5" />
         Recent Activity
        </h3>
        <div className="space-y-4">
         {mockAthletes.slice(0, 5).map((athlete) => (
          <div key={athlete.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
           <img src={athlete.avatar} alt={athlete.name} className="w-10 h-10 rounded-full" />
           <div className="flex-1">
            <p className="font-medium text-gray-900">{athlete.name}</p>
            <p className="text-sm text-gray-600">{athlete.recentActivities[0]?.description}</p>
           </div>
           <span className="text-xs text-gray-500">{athlete.recentActivities[0]?.date}</span>
          </div>
         ))}
        </div>
       </div>

       {/* Top Performers */}
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
         <Award className="w-5 h-5" />
         Top Performers
        </h3>
        <div className="space-y-4">
         {mockAthletes
          .sort((a, b) => b.progressScore - a.progressScore)
          .slice(0, 5)
          .map((athlete, index) => (
           <div key={athlete.id} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold">
             {index + 1}
            </div>
            <img src={athlete.avatar} alt={athlete.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
             <p className="font-medium text-gray-900">{athlete.name}</p>
             <p className="text-sm text-gray-600">{athlete.sport} • {athlete.level}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(athlete.progressScore)}`}>
             {athlete.progressScore}%
            </div>
           </div>
          ))}
        </div>
       </div>
      </div>
     </div>
    )}

    {/* Athletes Tab */}
    {activeTab === 'athletes' && (
     <div className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
         <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
           type="text"
           placeholder="Search athletes by name, sport, or position..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
         </div>
        </div>
        <div className="flex gap-4">
         <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
          <option value="all">All Sports</option>
          <option value="soccer">Soccer</option>
          <option value="basketball">Basketball</option>
          <option value="football">Football</option>
         </select>
         <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
         </select>
        </div>
        <Link href="/dashboard/overview">
         <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Schedule Session
         </button>
        </Link>
       </div>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
       {filteredAthletes.map((athlete) => (
        <div key={athlete.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-shadow">
         <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
           <img src={athlete.avatar} alt={athlete.name} className="w-12 h-12 rounded-full border-2 border-gray-200" />
           <div>
            <h3 className="font-semibold text-gray-900">{athlete.name}</h3>
            <p className="text-sm text-gray-600">{athlete.sport} • {athlete.position}</p>
           </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(athlete.level)}`}>
           {athlete.level}
          </div>
         </div>

         <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
           <span className="text-sm text-gray-600">Progress Score</span>
           <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(athlete.progressScore)}`}>
            {athlete.progressScore}%
           </div>
          </div>

          <div className="flex justify-between items-center">
           <span className="text-sm text-gray-600">Total Sessions</span>
           <span className="text-sm font-medium text-gray-900">{athlete.totalSessions}</span>
          </div>

          <div className="flex justify-between items-center">
           <span className="text-sm text-gray-600">Upcoming</span>
           <span className="text-sm font-medium text-gray-900">{athlete.upcomingSessions} sessions</span>
          </div>
         </div>

         <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Recent Improvements</p>
          <div className="flex flex-wrap gap-1">
           {athlete.improvements.slice(0, 2).map((improvement, index) => (
            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
             {improvement}
            </span>
           ))}
           {athlete.improvements.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
             +{athlete.improvements.length - 2}
            </span>
           )}
          </div>
         </div>

         <div className="flex gap-2">
          <button
           onClick={() => handleAthleteClick(athlete)}
           className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
          >
           <Eye className="w-4 h-4" />
           View Details
          </button>
          <button className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
           <Edit className="w-4 h-4" />
          </button>
         </div>
        </div>
       ))}
      </div>

      {filteredAthletes.length === 0 && (
       <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No athletes found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
       </div>
      )}
     </div>
    )}

    {/* Analytics Tab */}
    {activeTab === 'analytics' && (
     <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
       {/* Performance Distribution */}
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Distribution</h3>
        <div className="space-y-4">
         <div className="flex justify-between items-center">
          <span className="text-sm">Advanced (90%+)</span>
          <div className="flex items-center gap-2">
           <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
           </div>
           <span className="text-sm font-medium">25%</span>
          </div>
         </div>
         <div className="flex justify-between items-center">
          <span className="text-sm">Intermediate (70-89%)</span>
          <div className="flex items-center gap-2">
           <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
           </div>
           <span className="text-sm font-medium">50%</span>
          </div>
         </div>
         <div className="flex justify-between items-center">
          <span className="text-sm">Developing (50-69%)</span>
          <div className="flex items-center gap-2">
           <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
           </div>
           <span className="text-sm font-medium">25%</span>
          </div>
         </div>
        </div>
       </div>

       {/* Sport Distribution */}
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <h3 className="text-lg font-semibold mb-4">Athletes by Sport</h3>
        <div className="space-y-4">
         <div className="flex justify-between items-center">
          <span className="text-sm">Soccer</span>
          <div className="flex items-center gap-2">
           <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '50%' }}></div>
           </div>
           <span className="text-sm font-medium">50%</span>
          </div>
         </div>
         <div className="flex justify-between items-center">
          <span className="text-sm">Basketball</span>
          <div className="flex items-center gap-2">
           <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '50%' }}></div>
           </div>
           <span className="text-sm font-medium">50%</span>
          </div>
         </div>
        </div>
       </div>
      </div>

      {/* Progress Trends */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <h3 className="text-lg font-semibold mb-4">Monthly Progress Trends</h3>
       <div className="h-64 flex items-end gap-4 justify-center">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
         <div key={month} className="flex flex-col items-center gap-2">
          <div
           className="bg-blue-500 rounded-t-lg min-h-8"
           style={{ height: `${Math.random() * 200 + 50}px`, width: '40px' }}
          ></div>
          <span className="text-xs text-gray-600">{month}</span>
         </div>
        ))}
       </div>
      </div>
     </div>
    )}

    {/* Athlete Detail Modal */}
    {showAthleteDetail && selectedAthlete && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       <div className="p-6 border-b">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
          <img src={selectedAthlete.avatar} alt={selectedAthlete.name} className="w-16 h-16 rounded-full" />
          <div>
           <h2 className="text-2xl font-bold">{selectedAthlete.name}</h2>
           <p className="text-gray-600">{selectedAthlete.sport} • {selectedAthlete.position} • {selectedAthlete.level}</p>
          </div>
         </div>
         <button
          onClick={() => setShowAthleteDetail(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
         >
          ✕
         </button>
        </div>
       </div>

       <div className="p-6 space-y-6">
        {/* Performance Metrics */}
        <div>
         <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(selectedAthlete.performance).map(([key, value]) => (
           <div key={key} className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 capitalize">{key}</p>
            <p className="text-2xl font-bold">{value as number}%</p>
           </div>
          ))}
         </div>
        </div>

        {/* Current Goals */}
        <div>
         <h3 className="text-lg font-semibold mb-4">Current Goals</h3>
         <div className="space-y-2">
          {selectedAthlete.currentGoals.map((goal: string, index: number) => (
           <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
            <span>{goal}</span>
           </div>
          ))}
         </div>
        </div>

        {/* Recent Activity */}
        <div>
         <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
         <div className="space-y-3">
          {selectedAthlete.recentActivities.map((activity: any, index: number) => (
           <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
             <p className="font-medium">{activity.description}</p>
             <p className="text-sm text-gray-600">{activity.date}</p>
            </div>
           </div>
          ))}
         </div>
        </div>
       </div>
      </div>
     </div>
    )}
   </div>
  </main>
 )
}