'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react'

interface CoachingRequest {
  id: string
  athleteName: string
  athleteId: string
  subject: string
  message: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export default function AssistantRequestsPage() {
  const [requests, setRequests] = useState<CoachingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    // Simulate loading requests
    setTimeout(() => {
      setRequests([
        {
          id: '1',
          athleteName: 'John Smith',
          athleteId: 'athlete1',
          subject: 'Form Check Request',
          message: 'Need help with my squat form. Video attached.',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          athleteName: 'Sarah Johnson',
          athleteId: 'athlete2',
          subject: 'Training Schedule Question',
          message: 'Can we adjust my Thursday session?',
          status: 'in-progress',
          priority: 'medium',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return ''
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return ''
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Coaching Requests</h1>
        <p className="text-gray-600 mt-2">Manage and respond to athlete coaching requests</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No requests found</h3>
              <p className="text-gray-600 mt-2">No coaching requests match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{request.subject}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{request.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {request.athleteName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">
                      Respond
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}