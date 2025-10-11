'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Video,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface ScheduleEvent {
  id: string
  title: string
  type: 'training' | 'meeting' | 'evaluation' | 'competition'
  date: Date
  startTime: string
  endTime: string
  location?: string
  isVirtual: boolean
  participants: string[]
  notes?: string
}

export default function AssistantSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading schedule
    setTimeout(() => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      setEvents([
        {
          id: '1',
          title: 'Team Training Session',
          type: 'training',
          date: today,
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          location: 'Main Field',
          isVirtual: false,
          participants: ['John Smith', 'Sarah Johnson', 'Mike Davis'],
          notes: 'Focus on conditioning drills'
        },
        {
          id: '2',
          title: 'Video Analysis Review',
          type: 'meeting',
          date: today,
          startTime: '2:00 PM',
          endTime: '3:00 PM',
          isVirtual: true,
          participants: ['Sarah Johnson'],
          notes: 'Review last game performance'
        },
        {
          id: '3',
          title: 'Athlete Evaluation',
          type: 'evaluation',
          date: tomorrow,
          startTime: '9:00 AM',
          endTime: '10:30 AM',
          location: 'Training Center',
          isVirtual: false,
          participants: ['Mike Davis'],
          notes: 'Quarterly performance assessment'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-blue-100 text-blue-800'
      case 'meeting':
        return 'bg-purple-100 text-purple-800'
      case 'evaluation':
        return 'bg-green-100 text-green-800'
      case 'competition':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const todayEvents = events.filter(event =>
    event.date.toDateString() === new Date().toDateString()
  )

  const upcomingEvents = events.filter(event =>
    event.date > new Date()
  ).slice(0, 5)

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
        <h1 className="text-3xl text-gray-900">Schedule Management</h1>
        <p className="text-gray-600 mt-2">Manage training sessions, meetings, and athlete appointments</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Events</p>
                <p className="text-2xl">{todayEvents.length}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl">{events.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Athletes Scheduled</p>
                <p className="text-2xl">12</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Virtual Sessions</p>
                <p className="text-2xl">3</p>
              </div>
              <Video className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">
                  {selectedDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="text-sm text-gray-600 text-center">
                Selected: {selectedDate?.toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No events scheduled for today</p>
                </div>
              ) : (
                todayEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                          {event.isVirtual && (
                            <Badge variant="outline">
                              <Video className="w-3 h-3 mr-1" />
                              Virtual
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {event.participants.join(', ')}
                          </div>
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-500 mt-2">{event.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next 5 scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl">{event.date.getDate()}</p>
                    <p className="text-sm text-gray-600">
                      {event.date.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.startTime}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.participants.length} participants
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventTypeColor(event.type)}>
                    {event.type}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}