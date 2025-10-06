'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Trophy,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Star,
  BookOpen,
  AlertCircle
} from 'lucide-react'

interface AthleteProfile {
  id: string
  uid: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  status: string
  createdAt: Date
  athleticProfile: {
    primarySport: string
    secondarySports: string[]
    skillLevel: string
    trainingGoals: string
    achievements: string
    availability: Array<{
      day: string
      timeSlots: string
    }>
    learningStyle: string
    specialNotes: string
  }
}

interface AthleteProfileCardProps {
  athlete: AthleteProfile
  onMessage?: () => void
  onSchedule?: () => void
  expanded?: boolean
}

export default function AthleteProfileCard({
  athlete,
  onMessage,
  onSchedule,
  expanded: initialExpanded = false
}: AthleteProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)

  const getSkillLevelColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'advanced':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'elite':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getLearningStyleIcon = (style: string) => {
    switch(style) {
      case 'visual':
        return '👁️'
      case 'hands-on':
        return '🤲'
      case 'analytical':
        return '🧠'
      case 'collaborative':
        return '👥'
      default:
        return '📚'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {athlete.firstName[0]}{athlete.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{athlete.displayName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>{athlete.athleticProfile.primarySport}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSkillLevelColor(athlete.athleticProfile.skillLevel)}`}>
                  {athlete.athleticProfile.skillLevel}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-gray-100"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Learning Style</span>
          </div>
          <p className="text-gray-900 flex items-center gap-1">
            <span>{getLearningStyleIcon(athlete.athleticProfile.learningStyle)}</span>
            <span className="capitalize">{athlete.athleticProfile.learningStyle.replace('-', ' ')}</span>
          </p>
        </div>

        {/* Training Goals Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
            <Target className="w-4 h-4" />
            Training Goals
          </div>
          <p className="text-gray-700 text-sm line-clamp-2">
            {athlete.athleticProfile.trainingGoals}
          </p>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Secondary Sports */}
            {athlete.athleticProfile.secondarySports && athlete.athleticProfile.secondarySports.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Other Sports/Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {athlete.athleticProfile.secondarySports.map((sport, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {athlete.athleticProfile.achievements && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Achievements
                </h4>
                <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                  {athlete.athleticProfile.achievements}
                </p>
              </div>
            )}

            {/* Full Training Goals */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" />
                Complete Training Goals
              </h4>
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                {athlete.athleticProfile.trainingGoals}
              </p>
            </div>

            {/* Availability */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Training Availability
              </h4>
              <div className="space-y-1">
                {athlete.athleticProfile.availability && athlete.athleticProfile.availability.length > 0 ? (
                  athlete.athleticProfile.availability.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                      <span className="font-medium capitalize">{slot.day}</span>
                      <span className="text-gray-600">{slot.timeSlots || 'Flexible'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No availability specified</p>
                )}
              </div>
            </div>

            {/* Special Notes */}
            {athlete.athleticProfile.specialNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Special Notes
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-gray-700 text-sm">
                    {athlete.athleticProfile.specialNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {onMessage && (
                <Button onClick={onMessage} className="flex-1">
                  Send Message
                </Button>
              )}
              {onSchedule && (
                <Button onClick={onSchedule} variant="outline" className="flex-1">
                  Schedule Session
                </Button>
              )}
            </div>

            {/* Member Since */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Member since {new Date(athlete.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}