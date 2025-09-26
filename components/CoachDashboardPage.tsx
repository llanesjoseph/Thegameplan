'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CoachDashboardPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-lg font-primary font-bold text-black tracking-wide">
                PLAYBOOKD
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-playbookd-sky-blue rounded-full"></div>
                <div className="w-3 h-3 bg-playbookd-red rounded-full"></div>
              </div>
              <Link href="/contributors">
                <button className="bg-playbookd-sky-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-playbookd-sky-blue/90 transition-colors">
                  Browse Coaches
                </button>
              </Link>
              <Link href="/become-coach">
                <button className="bg-playbookd-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-playbookd-red/90 transition-colors">
                  Coach
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-playbookd-sky-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                  J
                </div>
                <span className="text-sm font-medium text-playbookd-dark">Joseph</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-playbookd-cream py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-primary font-bold text-playbookd-dark mb-4">
            Welcome to Your Coach Dashboard, Joseph!
          </h1>
          <p className="text-base text-playbookd-dark leading-relaxed">
            Your PLAYBOOKD coach dashboard will help you manage your athletes, create training 
            content, schedule sessions, and track your coaching impact.
          </p>
        </div>
      </div>

      {/* Coach Profile Section */}
      <div className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h2 className="text-2xl font-primary font-bold text-playbookd-dark mb-6">Your Coach Profile</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-primary font-semibold text-playbookd-dark mb-2">Coaching Specialties</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Soccer</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Football</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-primary font-semibold text-playbookd-dark mb-2">Your Coaching Impact</h3>
                <ul className="text-sm text-playbookd-dark space-y-1">
                  <li>• You've coached 10 training sessions with athletes</li>
                  <li>• You have 2 new athlete requests pending review</li>
                  <li>• Your coaching rating: 4.85 from 15 reviews</li>
                </ul>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl font-bold text-gray-600">
                  J
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-sm font-primary font-semibold text-playbookd-dark">Joseph Llanes</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <span className="text-xs text-gray-500">San Francisco</span>
                </div>
                <Link href="/dashboard/profile">
                  <button className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-playbookd-sky-blue hover:underline">
                    Edit Profile
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Athletes Section */}
      <div className="bg-playbookd-sky-blue py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-primary font-bold text-white text-center mb-12">Your Athletes</h2>
          
          <div className="grid grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-playbookd-sky-blue font-bold text-lg">SJ</span>
              </div>
              <h3 className="text-white font-primary font-semibold text-sm">Sarah Johnson</h3>
              <p className="text-white/80 text-xs">Basketball • Beginner</p>
              <p className="text-white/80 text-xs">Progress: Improving</p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865655/Merline_Saintil-600x600_zr10ec.png"
                alt="Alex Chen"
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white"
              />
              <h3 className="text-white font-primary font-semibold text-sm">Alex Chen</h3>
              <p className="text-white/80 text-xs">Basketball • Beginner</p>
              <p className="text-white/80 text-xs">Progress: Excellent</p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865652/Alana-Beard-Headshot-500x_dv40hs.webp"
                alt="Emma Davis"
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white"
              />
              <h3 className="text-white font-primary font-semibold text-sm">Emma Davis</h3>
              <p className="text-white/80 text-xs">Soccer • Beginner</p>
              <p className="text-white/80 text-xs">Progress: Steady</p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865686/2023_11_2_cilagt.jpg"
                alt="Ana Rivera"
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white"
              />
              <h3 className="text-white font-primary font-semibold text-sm">Ana Rivera</h3>
              <p className="text-white/80 text-xs">Basketball • Beginner</p>
              <p className="text-white/80 text-xs">Progress: Great</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/dashboard/creator">
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-purple-700 transition-colors">
                Create Training Content
              </button>
            </Link>
            <Link href="/dashboard/schedule">
              <button className="bg-playbookd-sky-blue text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-playbookd-sky-blue/90 transition-colors border border-white/20">
                Schedule Session
              </button>
            </Link>
            <Link href="/dashboard/coaching">
              <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-white/30 transition-colors">
                Manage Athletes
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Schedule & Availability Section */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-primary font-bold text-playbookd-dark text-center mb-12">Your Schedule & Availability</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upcoming Sessions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-playbookd-sky-blue rounded"></div>
                <h3 className="font-primary font-semibold text-playbookd-dark">Upcoming Sessions</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Soccer Training with Jasmine Aikey</p>
                    <p className="text-xs text-gray-600">Today, 3:00 PM - 4:00 PM</p>
                  </div>
                  <Link href="/lesson/jasmine-aikey-soccer-training">
                    <button className="text-playbookd-sky-blue text-xs hover:underline">▷</button>
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Available Slot</p>
                    <p className="text-xs text-gray-600">Tomorrow, 5:00 PM - 6:00 PM</p>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/schedule')}
                    className="text-playbookd-sky-blue text-xs hover:underline cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Set Availability */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-playbookd-sky-blue rounded"></div>
                <h3 className="font-primary font-semibold text-playbookd-dark">Set Your Availability</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Preferred Days</p>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center p-1 border rounded text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Time</p>
                  <div className="flex items-center gap-2">
                    <input type="time" defaultValue="05:00" className="text-sm border rounded px-2 py-1" />
                    <span className="text-xs">PM</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Time</p>
                  <div className="flex items-center gap-2">
                    <input type="time" defaultValue="06:00" className="text-sm border rounded px-2 py-1" />
                    <span className="text-xs">PM</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  // Handle save availability logic here
                  alert('Availability saved successfully!')
                }}
                className="w-full bg-playbookd-sky-blue text-white py-2 rounded-lg text-sm font-medium hover:bg-playbookd-sky-blue/90 transition-colors"
              >
                Save Availability
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Training Recommendations */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-primary font-bold text-playbookd-dark text-center mb-8">Your Personal Training Recommendations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xs">▷</span>
              </div>
              <div className="flex-1">
                <h3 className="font-primary font-semibold text-playbookd-dark text-sm">Footwork and Passing in Soccer</h3>
              </div>
              <Link href="/lessons/footwork-passing-soccer">
                <button className="text-playbookd-green font-primary font-medium text-sm hover:underline">
                  Enroll
                </button>
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xs">▷</span>
              </div>
              <div className="flex-1">
                <h3 className="font-primary font-semibold text-playbookd-dark text-sm">Soccer Drills for Beginners</h3>
              </div>
              <Link href="/lessons/soccer-drills-beginners">
                <button className="text-playbookd-green font-primary font-medium text-sm hover:underline">
                  Enroll
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoachDashboardPage
