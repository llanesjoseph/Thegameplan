'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Trophy,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Activity
} from 'lucide-react'

interface Athlete {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  status: 'active' | 'inactive' | 'injured'
  joinDate: string
  lastActivity: string
  progress: number
  nextSession?: string
  notes?: string
}

export default function AssistantAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    // Simulate loading athletes
    setTimeout(() => {
      setAthletes([
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          sport: 'Basketball',
          level: 'advanced',
          status: 'active',
          joinDate: '2023-09-15',
          lastActivity: '2024-01-18',
          progress: 85,
          nextSession: '2024-01-20'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          phone: '(555) 234-5678',
          sport: 'Soccer',
          level: 'intermediate',
          status: 'active',
          joinDate: '2023-10-20',
          lastActivity: '2024-01-17',
          progress: 72,
          nextSession: '2024-01-19'
        },
        {
          id: '3',
          name: 'Mike Davis',
          email: 'mike.d@example.com',
          phone: '(555) 345-6789',
          sport: 'Tennis',
          level: 'elite',
          status: 'injured',
          joinDate: '2023-08-10',
          lastActivity: '2024-01-10',
          progress: 90,
          notes: 'Recovering from shoulder injury'
        },
        {
          id: '4',
          name: 'Emily Chen',
          email: 'emily.c@example.com',
          phone: '(555) 456-7890',
          sport: 'Swimming',
          level: 'beginner',
          status: 'active',
          joinDate: '2024-01-05',
          lastActivity: '2024-01-18',
          progress: 25,
          nextSession: '2024-01-21'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-gray-100 text-gray-800'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800'
      case 'advanced':
        return 'bg-purple-100 text-purple-800'
      case 'elite':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'injured':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          athlete.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          athlete.sport.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || athlete.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Athlete Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage athlete progress and training</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Athletes</p>
                <p className="text-2xl font-bold">{athletes.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {athletes.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(athletes.reduce((sum, a) => sum + a.progress, 0) / athletes.length)}%
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
                <p className="text-sm text-gray-600">Elite Athletes</p>
                <p className="text-2xl font-bold">
                  {athletes.filter(a => a.level === 'elite').length}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="injured">Injured</option>
              </select>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Athlete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAthletes.map((athlete) => (
          <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={athlete.avatar} />
                    <AvatarFallback>
                      {athlete.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{athlete.name}</CardTitle>
                    <CardDescription>{athlete.sport}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getLevelColor(athlete.level)}>
                    {athlete.level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(athlete.status)}
                    <span className="text-sm text-gray-600">{athlete.status}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {athlete.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {athlete.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(athlete.joinDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600">{athlete.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${athlete.progress}%` }}
                    />
                  </div>
                </div>

                {athlete.nextSession && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Next session: {new Date(athlete.nextSession).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {athlete.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-red-600">{athlete.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button size="sm" className="flex-1">
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}