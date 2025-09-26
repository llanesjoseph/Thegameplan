'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Users,
  ArrowRight,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Play,
  User,
  Edit2,
  Save,
  X,
  Facebook,
  Instagram,
  Twitter,
  Plus
} from 'lucide-react'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'
import ImageUploader from '@/components/ImageUploader'

// Mock coaches data (you can replace with real data later)
const mockCoaches = [
  {
    id: 1,
    name: 'Olivia Walker',
    specialty: 'Professional Basketball Player',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b3?w=150&h=150&fit=crop&crop=face',
    rating: 4.9
  },
  {
    id: 2,
    name: 'Dan Mitchell',
    specialty: 'College Soccer Champion',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 4.8
  },
  {
    id: 3,
    name: 'Noah Patterson',
    specialty: 'College Basketball Champion',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.9
  },
  {
    id: 4,
    name: 'Tess Anderson',
    specialty: 'Professional Soccer Player',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 5.0
  }
]

export default function UnifiedDashboard() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    displayName: string
    location: string
    sports: string[]
    bio: string
    profileImageUrl: string
  }>({
    displayName: '',
    location: '',
    sports: [],
    bio: '',
    profileImageUrl: ''
  })

  // Progress summary data
  const [progressData, setProgressData] = useState({
    completedSessions: 10,
    newRecommendations: 2,
    upcomingSessions: 1
  })

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUserProfile(userData)
          setEditForm({
            displayName: userData.displayName || user.displayName || '',
            location: userData.location || 'New York, NY',
            sports: userData.sports || ['Soccer', 'Basketball'],
            bio: userData.bio || '',
            profileImageUrl: userData.profileImageUrl || ''
          })
        } else {
          // Initialize with default data
          const defaultProfile = {
            displayName: user.displayName || '',
            location: 'New York, NY',
            sports: ['Soccer', 'Basketball'],
            bio: '',
            profileImageUrl: ''
          }
          setUserProfile(defaultProfile)
          setEditForm(defaultProfile)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user?.uid) return

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        ...editForm,
        updatedAt: new Date()
      }, { merge: true })

      setUserProfile({ ...userProfile, ...editForm })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'Soccer':
        return SoccerIcon
      case 'Basketball':
        return BasketballIcon
      case 'Football':
        return FootballIcon
      case 'Brazilian Jiu-Jitsu (BJJ)':
      case 'Mixed Martial Arts (MMA)':
        return MMAGlovesIcon
      case 'Tennis':
        return Target // Tennis racket representation
      case 'Baseball':
        return Trophy // Baseball representation
      case 'Track & Field':
        return TrendingUp // Running/performance representation
      default:
        return SoccerIcon
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-black">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const firstName = user?.displayName?.split(' ')[0] || 'Athlete'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      {/* Header */}
      <header className="bg-white px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-wider">
            PLAYBOOKD
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <Link href="/contributors" className="text-black hover:text-blue-600 font-medium">
              Browse Coaches
            </Link>
            <div className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium">
              Athlete
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                J
              </div>
              <span className="font-medium text-black">Joseph</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Header Section */}
      <div className="text-center py-12 px-6">
        <h1 className="text-4xl font-bold mb-4 font-heading" style={{ color: '#000000' }}>
          Welcome to Your PlayBook, {firstName}!
        </h1>
        <p className="text-lg max-w-3xl mx-auto" style={{ color: '#000000' }}>
          Your PLAYBOOKD dashboard will help you keep track of your coaches, upcoming training
          and events, and help you manage your progress, on an off the field.
        </p>
      </div>

      {/* Your Athlete Profile Section */}
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-heading mb-8" style={{ color: '#000000' }}>
            Your Athlete Profile
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Side - Sports and Progress */}
            <div className="md:col-span-2 space-y-6">
              {/* Sports of Interest */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                  Sports of Interest
                </h3>
                <div className="flex flex-wrap gap-2">
                  {editForm.sports.map((sport) => {
                    const SportIcon = getSportIcon(sport)
                    return (
                      <div key={sport} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        <SportIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {sport}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                  Your Progress Summary
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                  <li>• You completed {progressData.completedSessions} training sessions. Let's go!</li>
                  <li>• You have {progressData.newRecommendations} new training recommendations from Jasmine Aikey.</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Profile Details */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {editForm.profileImageUrl ? (
                  <div className="w-32 h-32 mb-4 rounded-full overflow-hidden">
                    <img
                      src={editForm.profileImageUrl}
                      alt={editForm.displayName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 mb-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-2xl font-bold">
                    {(editForm.displayName || firstName).charAt(0)}
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                {editForm.displayName || firstName}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {editForm.location}
              </p>

              {isEditing && (
                <div className="w-full space-y-4">
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full text-center border border-gray-300 rounded-lg p-2"
                    placeholder="Your Name"
                  />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full text-center border border-gray-300 rounded-lg p-2"
                    placeholder="Location"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save Profile
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Your Coaches Section */}
      <div className="py-12 px-6" style={{ backgroundColor: '#91A6EB' }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8 font-heading">
            Your Coaches
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {mockCoaches.map((coach) => (
              <div key={coach.id} className="text-center">
                <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-white/20">
                  <img
                    src={coach.image}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">
                  {coach.name}
                </h3>
                <p className="text-white/80 text-xs">
                  {coach.specialty}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/coaching">
              <button className="px-6 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                Request Coaching Session
              </button>
            </Link>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Ask A Question
            </button>
            <Link href="/contributors">
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                Browse Coaches
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Your Schedule Section */}
      <div className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-heading mb-8 text-center" style={{ color: '#000000' }}>
            Your Schedule & Availability
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Calendar className="w-5 h-5" />
                Upcoming Sessions
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-900">Soccer Training with Jasmine Aikey</h4>
                    <p className="text-sm text-blue-700">Today, 3:00 PM - 4:00 PM</p>
                  </div>
                  <div className="text-blue-600">
                    <Play className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Available Slot</h4>
                    <p className="text-sm text-gray-700">Tomorrow, 5:00 PM - 6:00 PM</p>
                  </div>
                  <button className="text-green-600 hover:text-green-700">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Schedule */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Calendar className="w-5 h-5" />
                Set Your Availability
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Preferred Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <button
                        key={day}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      defaultValue="17:00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      defaultValue="18:00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Training Recommendations Section */}
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-heading mb-8 text-center" style={{ color: '#000000' }}>
            Your Personal Training Recommendations
          </h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" style={{ color: '#000000' }}>
                  Footwork and Passing in Soccer
                </h3>
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                Ended
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" style={{ color: '#000000' }}>
                  Soccer Drills for Beginners
                </h3>
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                Ended
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
              Browse Training
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Gear Section */}
      <div className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-heading" style={{ color: '#000000' }}>
              Your Recommended Gear
            </h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Shop All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-sm text-gray-600">I'm a product</p>
            </div>

            <div className="bg-white rounded-lg p-4 text-center">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-sm text-gray-600">I'm a product</p>
            </div>

            <div className="bg-white rounded-lg p-4 text-center">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <p className="text-sm text-gray-600">I'm a product</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/contributors" className="text-gray-600 hover:text-gray-900 font-medium">
                Coaches
              </Link>
              <Link href="/lessons" className="text-gray-600 hover:text-gray-900 font-medium">
                Lessons
              </Link>
              <Link href="/gear" className="text-gray-600 hover:text-gray-900 font-medium">
                Gear
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}