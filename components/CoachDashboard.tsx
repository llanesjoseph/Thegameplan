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
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

interface CoachProfile {
  name: string
  title: string
  bio: string
  photoURL?: string
  specialties: string[]
  achievements: string[]
  socialLinks: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
  }
}

interface Athlete {
  id: string
  name: string
  sport: string
  level: string
  photoURL?: string
}

interface TrainingContent {
  id: string
  title: string
  type: 'video' | 'drill' | 'plan'
  status: 'published' | 'draft'
}

interface CoachDashboardProps {
  coach?: CoachProfile
  athletes?: Athlete[]
  trainingContent?: TrainingContent[]
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coach = {
    name: "JASMINE AIKEY",
    title: "Elite soccer player at Stanford University, PAC-12 Champion and Midfielder of the Year",
    bio: "Playing soccer with your feet is one thing, but playing soccer with your heart is another.",
    photoURL: "/api/placeholder/150/150",
    specialties: ["Soccer", "Fitness"],
    achievements: [
      "PAC-12 Champion",
      "Midfielder of the Year",
      "Stanford University Elite Player"
    ],
    socialLinks: {
      facebook: "#",
      twitter: "#",
      linkedin: "#",
      instagram: "#"
    }
  },
  athletes = [
    { id: '1', name: 'Sarah Johnson', sport: 'Soccer', level: 'Beginner', photoURL: '/api/placeholder/60/60' },
    { id: '2', name: 'Mike Chen', sport: 'Soccer', level: 'Intermediate', photoURL: '/api/placeholder/60/60' },
    { id: '3', name: 'Emma Davis', sport: 'Soccer', level: 'Advanced', photoURL: '/api/placeholder/60/60' }
  ],
  trainingContent = [
    { id: '1', title: 'Footwork and Passing in Soccer', type: 'video', status: 'published' },
    { id: '2', title: 'Soccer Drills for Beginners', type: 'drill', status: 'published' },
    { id: '3', title: 'Advanced Ball Control', type: 'video', status: 'draft' }
  ]
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'content' | 'schedule'>('overview')

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
              <span className="text-gray-400">Product Image</span>
            </div>
            <p className="text-sm text-gray-600">I'm a product</p>
          </PlayBookdCard>
          
          <PlayBookdCard className="text-center">
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Product Image</span>
            </div>
            <p className="text-sm text-gray-600">I'm a product</p>
          </PlayBookdCard>
          
          <PlayBookdCard className="text-center">
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Product Image</span>
            </div>
            <p className="text-sm text-gray-600">I'm a product</p>
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

      {/* Coach Profile Hero Section */}
      <PlayBookdSection variant="blue" className="py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{coach.name}</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">{coach.title}</p>
          
          {/* Profile Image */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-white">
            {coach.photoURL ? (
              <img 
                src={coach.photoURL} 
                alt={coach.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-playbookd-deep-sea text-4xl font-bold">
                {coach.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </PlayBookdSection>

      {/* Sports Action Images Section */}
      <PlayBookdSection variant="white" className="py-0">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Sports Action Image 1</span>
          </div>
          <div className="h-64 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500">Sports Action Image 2</span>
          </div>
        </div>
      </PlayBookdSection>

      {/* Quote and Social Section */}
      <PlayBookdSection variant="red" className="py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xl text-white mb-6 italic">"{coach.bio}"</p>
            <div className="flex gap-4">
              {coach.socialLinks.facebook && (
                <a href={coach.socialLinks.facebook} className="text-white hover:text-red-200 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {coach.socialLinks.twitter && (
                <a href={coach.socialLinks.twitter} className="text-white hover:text-red-200 transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {coach.socialLinks.linkedin && (
                <a href={coach.socialLinks.linkedin} className="text-white hover:text-red-200 transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {coach.socialLinks.instagram && (
                <a href={coach.socialLinks.instagram} className="text-white hover:text-red-200 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <div className="text-white mb-2">🎥 HIGHLIGHTS</div>
            <div className="text-sm text-red-100">Video highlights section</div>
          </div>
        </div>
      </PlayBookdSection>

      {/* Ask Me About Section */}
      <PlayBookdSection variant="cream" className="py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-playbookd-dark mb-4">Ask Me About Soccer</h2>
            <p className="text-playbookd-dark/80 mb-6">
              I can answer questions about my athletic journey, techniques and mental preparation.
            </p>
            <button className="bg-playbookd-deep-sea text-white px-6 py-3 rounded-lg font-semibold hover:bg-playbookd-deep-sea/90 transition-colors">
              Ask Question
            </button>
          </div>
          <div className="h-64 bg-playbookd-red rounded-lg flex items-center justify-center">
            <span className="text-white">Action Photo</span>
          </div>
        </div>
      </PlayBookdSection>

      {/* Training Library Section */}
      <PlayBookdSection variant="white" className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-playbookd-dark mb-4">{coach.name.split(' ')[0]}'s Training Library</h2>
        </div>
        
        <div className="space-y-6">
          {trainingContent.map((content) => (
            <div key={content.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-playbookd-red rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-playbookd-dark">{content.title}</h3>
                <p className="text-sm text-gray-600 capitalize">{content.status}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </PlayBookdSection>
    </PlayBookdLayout>
  )
}

export default CoachDashboard
