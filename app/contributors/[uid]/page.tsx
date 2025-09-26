'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Star, 
  Target,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react'
import Link from 'next/link'

export default function ContributorProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  
  // For now, we'll use Jasmine Aikey as the default profile
  // Later, this can be dynamic based on the uid
  const coach = {
    name: "JASMINE AIKEY",
    title: "Elite soccer player at Stanford University, PAC-12 Champion and Midfielder of the Year",
    bio: "Playing soccer with your feet is one thing, but playing soccer with your heart is another.",
    photoURL: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
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
  }

  const trainingContent = [
    { id: '1', title: 'Footwork and Passing in Soccer', status: 'Ended' },
    { id: '2', title: 'Soccer Drills for Beginners', status: 'Ended' }
  ]

  return (
    <div className="pt-16">
      {/* Personal Training Recommendations Section */}
      <div className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Personal Training Recommendations</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Footwork and Passing in Soccer</h3>
                <p className="text-sm text-gray-600">Guided</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Soccer Drills for Beginners</h3>
                <p className="text-sm text-gray-600">Guided</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-colors">
              Browse Training
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Gear Section */}
      <div className="bg-white py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Recommended Gear</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div 
                className="w-full h-32 bg-cover bg-center rounded-lg mb-4"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')`
                }}
              ></div>
              <p className="text-sm text-gray-600">Soccer Cleats</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div 
                className="w-full h-32 bg-cover bg-center rounded-lg mb-4"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1588117472013-59bb13edafec?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')`
                }}
              ></div>
              <p className="text-sm text-gray-600">Training Cap</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div 
                className="w-full h-32 bg-cover bg-center rounded-lg mb-4"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')`
                }}
              ></div>
              <p className="text-sm text-gray-600">Athletic Wear</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-blue-800 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Profile Hero Section */}
      <div className="bg-blue-800 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{coach.name}</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">{coach.title}</p>
          
          {/* Profile Image */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-white">
            <img 
              src={coach.photoURL} 
              alt={coach.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Sports Action Images Section */}
      <div className="grid md:grid-cols-2 gap-0">
        <div 
          className="h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`
          }}
        ></div>
        <div 
          className="h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`
          }}
        ></div>
      </div>

      {/* Quote and Social Section */}
      <div className="bg-red-600 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xl text-white mb-6 italic">"{coach.bio}"</p>
              <div className="flex gap-4">
                <a href={coach.socialLinks.facebook} className="text-white hover:text-red-200 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href={coach.socialLinks.twitter} className="text-white hover:text-red-200 transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href={coach.socialLinks.linkedin} className="text-white hover:text-red-200 transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href={coach.socialLinks.instagram} className="text-white hover:text-red-200 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-6 text-center">
              <div className="text-white mb-2">🎥 HIGHLIGHTS</div>
              <div className="text-sm text-red-100">Video highlights section</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ask Me About Section */}
      <div className="bg-yellow-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ask Me About Soccer</h2>
              <p className="text-gray-700 mb-6">
                I can answer questions about my athletic journey, techniques and mental preparation.
              </p>
              <button className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors">
                Ask Question
              </button>
            </div>
            <div 
              className="h-64 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Training Library Section */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{coach.name.split(' ')[0]}'s Training Library</h2>
          </div>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            {trainingContent.map((content) => (
              <div key={content.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{content.title}</h3>
                  <p className="text-sm text-gray-600">{content.status}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Claim Profile Section - For when Jasmine wants to take over */}
      <div className="bg-white py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">Are you Jasmine Aikey?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Claim this profile to manage your content and connect with athletes.
            </p>
            <Link href="/become-coach" className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-block">
              Claim This Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
