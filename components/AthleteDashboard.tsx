'use client'

import React from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'

const AthleteDashboard = () => {
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-playbookd-sky-blue rounded-full"></div>
              <div className="w-3 h-3 bg-playbookd-red rounded-full"></div>
              <Link href="/dashboard">
                <button 
                  type="button" 
                  className="rounded-lg inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-sky-blue disabled:opacity-50 px-4 py-2 text-sm gap-2 bg-playbookd-red text-white hover:bg-playbookd-red/90 font-medium"
                  aria-disabled="false"
                >
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-playbookd-cream py-12 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-primary font-bold text-playbookd-dark mb-4">
            Welcome to Your PlayBook, Merline!
          </h1>
          <p className="text-base text-playbookd-dark leading-relaxed">
            Your PlayBookd dashboard will help you keep track of your coaches, upcoming training 
            and events, and help you manage your progress, on all of the field.
          </p>
        </div>
      </div>

      {/* Athlete Profile Section */}
      <div className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h2 className="text-2xl font-primary font-bold text-playbookd-dark mb-6">Your Athlete Profile</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-primary font-semibold text-playbookd-dark mb-2">Sports of Interest</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm text-playbookd-dark">Soccer</span>
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-sm text-playbookd-dark">Basketball</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-primary font-semibold text-playbookd-dark mb-2">Your Progress Summary</h3>
                <ul className="text-sm text-playbookd-dark space-y-1">
                  <li>• You completed 5 training sessions. Let's go!</li>
                  <li>• You have 2 new training recommendations from Jasmine Aikey</li>
                </ul>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-8">
              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865655/Merline_Saintil-600x600_zr10ec.png"
                  alt="Merline Saintil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-sm font-primary font-semibold text-playbookd-dark">Merline Saintil</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <span className="text-xs text-gray-500">New York, NY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Coaches Section */}
      <div className="bg-playbookd-deep-sea py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-primary font-bold text-white text-center mb-12">Your Coaches</h2>
          
          <div className="flex justify-center items-center gap-16 mb-12">
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865686/2023_11_2_cilagt.jpg"
                alt="Jasmine Aikey"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-white"
              />
              <h3 className="text-white font-primary font-semibold">Jasmine Aikey</h3>
              <p className="text-white/80 text-sm">College Soccer Champion</p>
            </div>
            
            <div className="text-center">
              <img 
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865652/Alana-Beard-Headshot-500x_dv40hs.webp"
                alt="Alana Beard"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-white"
              />
              <h3 className="text-white font-primary font-semibold">Alana Beard</h3>
              <p className="text-white/80 text-sm">Professional Basketball</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-white/30 transition-colors">
              Request Coaching Session
            </button>
            <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-white/30 transition-colors">
              Ask A Question
            </button>
            <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-primary font-medium hover:bg-white/30 transition-colors">
              Browse Coaches
            </button>
          </div>
        </div>
      </div>

      {/* Personal Training Recommendations */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-primary font-bold text-playbookd-dark text-center mb-12">Your Personal Training Recommendations</h2>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold text-orange-500">4</div>
              <div className="flex items-center gap-4 flex-1">
                <img 
                  src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg"
                  alt="Training illustration"
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-primary font-semibold text-playbookd-dark">Footwork and Passing in Soccer</h3>
                </div>
                <button className="text-playbookd-green font-primary font-medium">Enroll</button>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold text-orange-500">5</div>
              <div className="flex items-center gap-4 flex-1">
                <img 
                  src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_2_zhtbzx.jpg"
                  alt="Training illustration"
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-primary font-semibold text-playbookd-dark">Soccer Drills for Beginners</h3>
                </div>
                <button className="text-playbookd-green font-primary font-medium">Enroll</button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-playbookd-green text-white px-8 py-3 rounded-lg font-primary font-semibold hover:bg-playbookd-green/90 transition-colors">
              Browse Training
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Gear */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-primary font-bold text-playbookd-dark">Your Recommended Gear</h2>
            <Link href="/gear" className="text-playbookd-sky-blue font-primary font-medium hover:underline">
              Shop All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="bg-gray-200 h-32 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-center text-sm text-gray-600">I'm a product</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="bg-gray-200 h-32 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-center text-sm text-gray-600">I'm a product</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="bg-gray-200 h-32 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-center text-sm text-gray-600">I'm a product</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AthleteDashboard
