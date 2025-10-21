'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, BookOpen, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function UpcomingActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Placeholder for fetching upcoming activities
    // In a real implementation, this would fetch from Firestore:
    // - Coach's scheduled events
    // - Assigned lessons
    // - Pending video reviews
    // - Scheduled 1-on-1 sessions

    setLoading(false)
    setActivities([])
  }, [user?.uid])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#000000' }}>
            Upcoming Events
          </h2>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No upcoming events</p>
            <p className="text-gray-400 text-xs mt-1">
              Check your coach's schedule for new sessions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity / Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#000000' }}>
            Your Progress
          </h2>
          <CheckCircle className="w-5 h-5 text-gray-400" />
        </div>

        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No completed lessons yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Start a lesson to track your progress
          </p>
        </div>

        {/* Progress Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#7B92C4' }}>0</p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#5A9B9B' }}>0</p>
              <p className="text-xs text-gray-600 mt-1">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#FF6B35' }}>0</p>
              <p className="text-xs text-gray-600 mt-1">Days Streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
