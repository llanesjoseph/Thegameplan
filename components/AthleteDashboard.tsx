'use client'

import React, { useState } from 'react'
import PlayBookdLayout from './PlayBookdLayout'
import PlayBookdSection from './PlayBookdSection'
import PlayBookdCard from './PlayBookdCard'
import { 
  Calendar, 
  Users, 
  Video, 
  MessageSquare, 
  Star,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Play,
  Award,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'

interface AthleteProfile {
  name: string
  sport: string
  level: string
  photoURL?: string
  goals: string[]
  achievements: string[]
}

interface Coach {
  id: string
  name: string
  sport: string
  rating: number
  photoURL?: string
}

interface TrainingSession {
  id: string
  title: string
  coach: string
  date: string
  time: string
  status: 'upcoming' | 'completed'
}

interface AthleteDashboardProps {
  athlete?: AthleteProfile
  coaches?: Coach[]
  sessions?: TrainingSession[]
}

const AthleteDashboard: React.FC<AthleteDashboardProps> = ({
  athlete = {
    name: "MERLINE SANTOS",
    sport: "Soccer",
    level: "Intermediate",
    photoURL: "/api/placeholder/150/150",
    goals: ["Improve ball control", "Increase speed", "Master passing techniques"],
    achievements: [
      "Completed 15 training sessions",
      "Improved fitness by 25%",
      "Mastered basic footwork"
    ]
  },
  coaches = [
    { id: '1', name: 'Jasmine Aikey', sport: 'Soccer', rating: 4.9, photoURL: '/api/placeholder/60/60' },
    { id: '2', name: 'Alana Beard', sport: 'Basketball', rating: 4.8, photoURL: '/api/placeholder/60/60' },
    { id: '3', name: 'Mike Johnson', sport: 'Soccer', rating: 4.7, photoURL: '/api/placeholder/60/60' }
  ],
  sessions = [
    { id: '1', title: 'Soccer Training Session', coach: 'Jasmine Aikey', date: 'Today', time: '3:00 PM - 4:00 PM', status: 'upcoming' },
    { id: '2', title: 'Footwork and Passing', coach: 'Jasmine Aikey', date: 'Yesterday', time: '2:00 PM - 3:00 PM', status: 'completed' }
  ]
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'coaches' | 'progress' | 'schedule'>('overview')

  return (
    <PlayBookdLayout>
      {/* Personal Training Recommendations Section */}
      <PlayBookdSection variant="white" className="py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-playbookd-dark mb-4">Your Personal Training Recommendations</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-playbookd-red rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-playbookd-dark">Footwork and Passing in Soccer</h3>
              <p className="text-sm text-gray-600">Guided</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-playbookd-red rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-playbookd-dark">Soccer Drills for Beginners</h3>
              <p className="text-sm text-gray-600">Guided</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="bg-playbookd-green text-white px-6 py-2 rounded-full font-semibold hover:bg-playbookd-green/90 transition-colors">
            Browse Training
          </button>
        </div>
      </PlayBookdSection>

      {/* Recommended Gear Section */}
      <PlayBookdSection variant="white" className="py-8 border-t border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-playbookd-dark mb-4">Your Recommended Gear</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <PlayBookdCard className="text-center">
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Soccer Cleats</span>
            </div>
            <p className="text-sm text-gray-600">Professional Soccer Cleats</p>
          </PlayBookdCard>
          
          <PlayBookdCard className="text-center">
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Training Ball</span>
            </div>
            <p className="text-sm text-gray-600">Official Training Soccer Ball</p>
          </PlayBookdCard>
          
          <PlayBookdCard className="text-center">
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Shin Guards</span>
            </div>
            <p className="text-sm text-gray-600">Protective Shin Guards</p>
          </PlayBookdCard>
        </div>

        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-playbookd-deep-sea rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </PlayBookdSection>

      {/* Athlete Profile Hero Section */}
      <PlayBookdSection variant="blue" className="py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome to Your PlayBook, {athlete.name}!</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Your PlayBookd dashboard will help you track your progress, upcoming training and events, and help you manage your progress, so all of the best.
          </p>
          
          {/* Profile Section */}
          <div className="bg-playbookd-cream rounded-xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-playbookd-dark mb-4">Your Athlete Profile</h3>
                <div className="space-y-2 text-playbookd-dark">
                  <p><strong>Sports of Interest:</strong></p>
                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-playbookd-sky-blue text-white rounded-full text-sm">{athlete.sport}</span>
                  </div>
                  <p><strong>Your Progress Summary:</strong></p>
                  <ul className="text-sm space-y-1">
                    {athlete.achievements.map((achievement, index) => (
                      <li key={index}>• {achievement}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                  {athlete.photoURL ? (
                    <img 
                      src={athlete.photoURL} 
                      alt={athlete.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-playbookd-sky-blue flex items-center justify-center text-white text-4xl font-bold">
                      {athlete.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-playbookd-dark font-semibold">{athlete.name}</p>
                <p className="text-playbookd-dark/70">{athlete.level} Level</p>
                <button className="btn-playbookd-outline mt-4">Edit Profile</button>
              </div>
            </div>
          </div>
        </div>
      </PlayBookdSection>

      {/* Your Coaches Section */}
      <PlayBookdSection variant="blue" className="py-12">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">Your Coaches</h2>
        <div className="flex gap-8 justify-center flex-wrap">
          {coaches.slice(0, 3).map((coach) => (
            <div key={coach.id} className="flex flex-col items-center text-white">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white mb-4">
                {coach.photoURL ? (
                  <img 
                    src={coach.photoURL} 
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-playbookd-cream flex items-center justify-center text-playbookd-dark font-bold text-lg">
                    {coach.name.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="font-semibold mb-1">{coach.name}</h4>
              <p className="text-sm text-blue-100 mb-1">{coach.sport} Coach</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current text-yellow-400" />
                <span className="text-sm">{coach.rating}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4 justify-center">
          <button className="bg-playbookd-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-playbookd-red/90 transition-colors">
            Schedule Session
          </button>
          <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors">
            Ask a Question
          </button>
          <button className="text-white underline underline-offset-4">
            Manage Athletes
          </button>
        </div>
      </PlayBookdSection>

      {/* Your Schedule & Availability */}
      <PlayBookdSection variant="cream" className="py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-playbookd-dark mb-6">Your Schedule & Availability</h2>
            <PlayBookdCard>
              <h3 className="font-semibold text-playbookd-dark mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {sessions.filter(s => s.status === 'upcoming').map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-playbookd-deep-sea" />
                    <div className="flex-1">
                      <p className="font-medium text-playbookd-dark">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.date}, {session.time}</p>
                      <p className="text-sm text-playbookd-deep-sea">with {session.coach}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PlayBookdCard>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-playbookd-dark mb-6">Set Your Availability</h2>
            <PlayBookdCard>
              <form>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold text-playbookd-dark">Preferred Days</label>
                  <div className="grid grid-cols-7 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        className="p-2 text-xs border border-gray-300 rounded hover:bg-playbookd-deep-sea hover:text-white transition-colors"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 font-semibold text-playbookd-dark">Start Time</label>
                    <input type="time" className="input-playbookd w-full" defaultValue="17:00" />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-playbookd-dark">End Time</label>
                    <input type="time" className="input-playbookd w-full" defaultValue="18:00" />
                  </div>
                </div>
                <button type="submit" className="btn-playbookd-primary w-full">Save Availability</button>
              </form>
            </PlayBookdCard>
          </div>
        </div>
      </PlayBookdSection>

      {/* Your Personal Training Recommendations */}
      <PlayBookdSection variant="white" className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-playbookd-dark mb-4">Your Personal Training Recommendations</h2>
        </div>
        
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-playbookd-red rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-playbookd-dark">Footwork and Passing in Soccer</h3>
              <p className="text-sm text-gray-600">Ended</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-playbookd-red rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-playbookd-dark">Soccer Drills for Beginners</h3>
              <p className="text-sm text-gray-600">Ended</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </PlayBookdSection>

      {/* Athlete Management Tabs */}
      <PlayBookdSection variant="white" className="py-8 border-t border-gray-200">
        <div className="mb-8">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex-1 ${
                activeTab === 'overview'
                  ? 'bg-playbookd-deep-sea text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex-1 ${
                activeTab === 'coaches'
                  ? 'bg-playbookd-deep-sea text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Coaches
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex-1 ${
                activeTab === 'progress'
                  ? 'bg-playbookd-deep-sea text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex-1 ${
                activeTab === 'schedule'
                  ? 'bg-playbookd-deep-sea text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Schedule
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              <PlayBookdCard>
                <h3 className="text-xl font-semibold text-playbookd-dark mb-4">Training Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions Completed</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Coaches</span>
                    <span className="font-semibold">{coaches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skills Learned</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress Level</span>
                    <span className="font-semibold">{athlete.level}</span>
                  </div>
                </div>
              </PlayBookdCard>

              <PlayBookdCard>
                <h3 className="text-xl font-semibold text-playbookd-dark mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-playbookd-deep-sea/10 rounded-lg text-left hover:bg-playbookd-deep-sea/20 transition-colors">
                    <Calendar className="w-5 h-5 text-playbookd-deep-sea" />
                    <span className="text-playbookd-dark">Schedule Training</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-playbookd-green/10 rounded-lg text-left hover:bg-playbookd-green/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-playbookd-green" />
                    <span className="text-playbookd-dark">Browse Lessons</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-playbookd-red/10 rounded-lg text-left hover:bg-playbookd-red/20 transition-colors">
                    <MessageSquare className="w-5 h-5 text-playbookd-red" />
                    <span className="text-playbookd-dark">Message Coach</span>
                  </button>
                </div>
              </PlayBookdCard>
            </div>
          )}

          {activeTab === 'coaches' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-playbookd-dark">Your Coaches</h3>
                <button className="bg-playbookd-deep-sea text-white px-4 py-2 rounded-lg font-semibold hover:bg-playbookd-deep-sea/90 transition-colors">
                  Find New Coach
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coaches.map((coach) => (
                  <PlayBookdCard key={coach.id} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-playbookd-sky-blue/20">
                      {coach.photoURL ? (
                        <img 
                          src={coach.photoURL} 
                          alt={coach.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-playbookd-deep-sea font-bold">
                          {coach.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-playbookd-dark mb-1">{coach.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{coach.sport} Coach</p>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="text-sm font-medium">{coach.rating}</span>
                    </div>
                    <button className="btn-playbookd-outline text-sm px-4 py-2">
                      Message
                    </button>
                  </PlayBookdCard>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h3 className="text-xl font-semibold text-playbookd-dark mb-6">Your Progress</h3>
              <div className="space-y-6">
                <PlayBookdCard>
                  <h4 className="font-semibold text-playbookd-dark mb-4">Goals & Achievements</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-playbookd-dark mb-3">Current Goals</h5>
                      <div className="space-y-2">
                        {athlete.goals.map((goal, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-playbookd-red" />
                            <span className="text-sm text-playbookd-dark">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-playbookd-dark mb-3">Achievements</h5>
                      <div className="space-y-2">
                        {athlete.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-playbookd-green" />
                            <span className="text-sm text-playbookd-dark">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PlayBookdCard>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-xl font-semibold text-playbookd-dark mb-6">Training Schedule</h3>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <PlayBookdCard key={session.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          session.status === 'upcoming' ? 'bg-playbookd-green/20' : 'bg-gray-100'
                        }`}>
                          <Calendar className={`w-6 h-6 ${
                            session.status === 'upcoming' ? 'text-playbookd-green' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-playbookd-dark">{session.title}</h4>
                          <p className="text-sm text-gray-600">with {session.coach}</p>
                          <p className="text-sm text-gray-500">{session.date} • {session.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'upcoming' 
                          ? 'bg-playbookd-green/20 text-playbookd-green' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </PlayBookdCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </PlayBookdSection>
    </PlayBookdLayout>
  )
}

export default AthleteDashboard
