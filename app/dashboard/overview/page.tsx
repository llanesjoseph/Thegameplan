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
  X
} from 'lucide-react'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'

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
  }>({
    displayName: '',
    location: '',
    sports: [],
    bio: ''
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
            bio: userData.bio || ''
          })
        } else {
          // Initialize with default data
          const defaultProfile = {
            displayName: user.displayName || '',
            location: 'New York, NY',
            sports: ['Soccer', 'Basketball'],
            bio: ''
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-heading" style={{ color: '#000000' }}>
              Your Athlete Profile
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white transition-colors"
              style={{ color: '#000000' }}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Sports and Progress */}
            <div className="space-y-6">
              {/* Sports Selection */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#000000' }}>
                  Sports
                </label>
                <div className="flex gap-4">
                  {['Soccer', 'Basketball', 'Football', 'Brazilian Jiu-Jitsu (BJJ)'].map((sport) => {
                    const SportIcon = getSportIcon(sport)
                    const isSelected = editForm.sports.includes(sport)

                    return (
                      <button
                        key={sport}
                        onClick={() => {
                          if (!isEditing) return
                          const newSports = isSelected
                            ? editForm.sports.filter(s => s !== sport)
                            : [...editForm.sports, sport]
                          setEditForm({ ...editForm, sports: newSports })
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-sky-blue/20 to-black/10 border-2 border-sky-blue'
                            : 'bg-white/60 border-2 border-white/50'
                        } ${isEditing ? 'hover:bg-white cursor-pointer' : 'cursor-default'}`}
                      >
                        <SportIcon className="w-8 h-8" style={{ color: isSelected ? '#91A6EB' : '#666' }} />
                        <span className="text-xs font-medium" style={{ color: '#000000' }}>
                          {sport === 'Brazilian Jiu-Jitsu (BJJ)' ? 'BJJ' : sport}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="bg-white/80 rounded-xl p-6">
                <h3 className="font-bold mb-4" style={{ color: '#000000' }}>
                  Your Progress Summary
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    You completed {progressData.completedSessions} training sessions. Let's go!
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    You have {progressData.newRecommendations} new training recommendations from Jasmine Aikey.
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    You have {progressData.upcomingSessions} upcoming live session.
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Side - Profile Details */}
            <div className="space-y-6">
              {/* Profile Photo and Basic Info */}
              <div className="bg-white/80 rounded-xl p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-sky-blue to-black flex items-center justify-center text-white text-2xl font-bold">
                  {(editForm.displayName || firstName).charAt(0)}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="w-full text-center text-xl font-bold border border-gray-300 rounded-lg p-2"
                      style={{ color: '#000000' }}
                      placeholder="Your Name"
                    />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full text-center border border-gray-300 rounded-lg p-2"
                      style={{ color: '#666' }}
                      placeholder="Location"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 h-24 resize-none"
                      style={{ color: '#000000' }}
                      placeholder="Tell us about yourself..."
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Profile
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                      {editForm.displayName || firstName}
                    </h3>
                    <p style={{ color: '#666' }}>
                      {editForm.location}
                    </p>
                    {editForm.bio && (
                      <p className="mt-4 text-sm" style={{ color: '#000000' }}>
                        {editForm.bio}
                      </p>
                    )}
                  </div>
                )}
              </div>
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

          <Link href="/dashboard/coaching">
            <button
              style={{ backgroundColor: '#20B2AA' }}
              className="px-8 py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Request Coaching
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}