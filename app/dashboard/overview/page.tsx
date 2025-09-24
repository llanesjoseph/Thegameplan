'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import {
  Users,
  ArrowRight,
  ShoppingBag,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  User,
  Crown,
  Award,
  Shield,
  BookOpen
} from 'lucide-react'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'

// Sport-specific data based on user profile
const getSportData = (sport: string) => {
  const sportData = {
    'Brazilian Jiu-Jitsu (BJJ)': {
      icon: MMAGlovesIcon,
      title: 'Brazilian Jiu-Jitsu',
      recommendations: [
        {
          title: 'Guard Fundamentals',
          description: 'Master the basic guard positions and sweeps',
          image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Guard+Training',
          duration: '45 min'
        },
        {
          title: 'Submission Setups',
          description: 'Learn effective submission chains',
          image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Submissions',
          duration: '35 min'
        },
        {
          title: 'Positional Control',
          description: 'Develop dominant position control',
          image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Control',
          duration: '40 min'
        }
      ],
      gear: [
        { name: 'BJJ Gi', price: '$89.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=BJJ+Gi', tag: 'Essential' },
        { name: 'Grappling Dummy', price: '$129.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Dummy', tag: 'Training' },
        { name: 'Mouth Guard', price: '$19.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Guard', tag: 'Safety' },
        { name: 'BJJ Belt', price: '$24.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Belt', tag: 'Rank' },
        { name: 'Rash Guard', price: '$39.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Rash+Guard', tag: 'Comfort' }
      ]
    },
    'Mixed Martial Arts (MMA)': {
      icon: MMAGlovesIcon,
      title: 'Mixed Martial Arts',
      recommendations: [
        {
          title: 'Striking Fundamentals',
          description: 'Build solid boxing and kickboxing foundation',
          image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Striking',
          duration: '50 min'
        },
        {
          title: 'Ground Game Basics',
          description: 'Essential grappling for MMA',
          image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Ground+Game',
          duration: '45 min'
        },
        {
          title: 'Takedown Defense',
          description: 'Defensive wrestling techniques',
          image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Takedowns',
          duration: '35 min'
        }
      ],
      gear: [
        { name: 'MMA Gloves', price: '$49.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Gloves', tag: 'Essential' },
        { name: 'Shin Guards', price: '$59.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Shin+Guards', tag: 'Protection' },
        { name: 'Heavy Bag', price: '$199.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Heavy+Bag', tag: 'Training' },
        { name: 'Fight Shorts', price: '$34.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Shorts', tag: 'Apparel' },
        { name: 'Hand Wraps', price: '$12.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Wraps', tag: 'Safety' }
      ]
    },
    'Soccer': {
      icon: SoccerIcon,
      title: 'Soccer',
      recommendations: [
        {
          title: 'Ball Control Drills',
          description: 'Master first touch and dribbling skills',
          image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Ball+Control',
          duration: '40 min'
        },
        {
          title: 'Passing & Vision',
          description: 'Improve passing accuracy and field awareness',
          image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Passing',
          duration: '35 min'
        },
        {
          title: 'Finishing Practice',
          description: 'Score more goals with better technique',
          image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Finishing',
          duration: '30 min'
        }
      ],
      gear: [
        { name: 'Soccer Cleats', price: '$89.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Cleats', tag: 'Essential' },
        { name: 'Soccer Ball', price: '$29.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Ball', tag: 'Essential' },
        { name: 'Shin Guards', price: '$19.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Shin+Guards', tag: 'Safety' },
        { name: 'Training Cones', price: '$15.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Cones', tag: 'Training' },
        { name: 'Water Bottle', price: '$12.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Water', tag: 'Hydration' }
      ]
    },
    'Basketball': {
      icon: BasketballIcon,
      title: 'Basketball',
      recommendations: [
        {
          title: 'Shooting Form',
          description: 'Perfect your shooting mechanics',
          image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Shooting',
          duration: '45 min'
        },
        {
          title: 'Dribbling Skills',
          description: 'Improve ball handling and control',
          image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Dribbling',
          duration: '40 min'
        },
        {
          title: 'Defensive Stance',
          description: 'Master defensive positioning and footwork',
          image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Defense',
          duration: '35 min'
        }
      ],
      gear: [
        { name: 'Basketball Shoes', price: '$129.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Shoes', tag: 'Essential' },
        { name: 'Basketball', price: '$39.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Basketball', tag: 'Essential' },
        { name: 'Shooting Sleeve', price: '$24.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Sleeve', tag: 'Performance' },
        { name: 'Training Shorts', price: '$34.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Shorts', tag: 'Apparel' },
        { name: 'Sweat Towel', price: '$9.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Towel', tag: 'Comfort' }
      ]
    },
    'Football': {
      icon: FootballIcon,
      title: 'Football',
      recommendations: [
        {
          title: 'Throwing Mechanics',
          description: 'Perfect your passing technique',
          image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Throwing',
          duration: '50 min'
        },
        {
          title: 'Route Running',
          description: 'Master precise route execution',
          image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Routes',
          duration: '45 min'
        },
        {
          title: 'Tackling Form',
          description: 'Safe and effective tackling technique',
          image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Tackling',
          duration: '40 min'
        }
      ],
      gear: [
        { name: 'Football Cleats', price: '$99.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Cleats', tag: 'Essential' },
        { name: 'Helmet', price: '$199.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Helmet', tag: 'Safety' },
        { name: 'Shoulder Pads', price: '$149.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Pads', tag: 'Safety' },
        { name: 'Football', price: '$29.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Football', tag: 'Essential' },
        { name: 'Mouthguard', price: '$14.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Guard', tag: 'Safety' }
      ]
    }
  }

  // Default fallback for unknown sports
  return sportData[sport as keyof typeof sportData] || {
    icon: SoccerIcon, // Default to soccer icon
    title: sport || 'General Training',
    recommendations: [
      {
        title: 'Conditioning Basics',
        description: 'Build your athletic foundation',
        image: 'https://via.placeholder.com/300x200/91A6EB/ffffff?text=Conditioning',
        duration: '30 min'
      },
      {
        title: 'Flexibility Training',
        description: 'Improve mobility and prevent injury',
        image: 'https://via.placeholder.com/300x200/5A2C59/ffffff?text=Flexibility',
        duration: '25 min'
      },
      {
        title: 'Mental Preparation',
        description: 'Develop a winning mindset',
        image: 'https://via.placeholder.com/300x200/FF6B35/ffffff?text=Mental+Game',
        duration: '20 min'
      }
    ],
    gear: [
      { name: 'Training Shoes', price: '$79.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Shoes', tag: 'Essential' },
      { name: 'Water Bottle', price: '$24.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Water', tag: 'Hydration' },
      { name: 'Resistance Bands', price: '$19.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Bands', tag: 'Training' },
      { name: 'Yoga Mat', price: '$39.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Mat', tag: 'Recovery' },
      { name: 'Foam Roller', price: '$29.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Roller', tag: 'Recovery' }
    ]
  }
}

// Placeholder coaches - will be replaced with assigned coaches when available
const placeholderCoaches = [
  {
    name: 'Coach Assignment Pending',
    specialty: 'Awaiting your first coach assignment',
    image: 'https://via.placeholder.com/120x120/91A6EB/ffffff?text=?',
    isPlaceholder: true
  },
  {
    name: 'Additional Coach Slot',
    specialty: 'Available for specialized training',
    image: 'https://via.placeholder.com/120x120/5A2C59/ffffff?text=?',
    isPlaceholder: true
  },
  {
    name: 'Mentor Coach Slot',
    specialty: 'Advanced guidance when ready',
    image: 'https://via.placeholder.com/120x120/FF6B35/ffffff?text=?',
    isPlaceholder: true
  },
  {
    name: 'Specialist Coach Slot',
    specialty: 'Sport-specific expertise',
    image: 'https://via.placeholder.com/120x120/20B2AA/ffffff?text=?',
    isPlaceholder: true
  }
]

export default function DashboardOverview() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [gearIndex, setGearIndex] = useState(0)

  // Load user profile for sport-specific content
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserProfile(userDoc.data())
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    loadUserProfile()
  }, [user])

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-plum mx-auto"></div>
          <p className="mt-2 text-dark/70">Loading your PlayBook...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2 text-dark">Sign In Required</h1>
          <p className="text-dark/70 mb-4">Please sign in to access your PlayBook.</p>
          <Link href="/dashboard" className="bg-deep-plum text-white px-6 py-2 rounded-lg hover:opacity-90">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Athlete'
  const sportData = getSportData(userProfile?.sport)
  const gear = sportData.gear
  const visibleGear = gear.slice(gearIndex, gearIndex + 5)

  const nextGear = () => {
    setGearIndex((prev) => (prev + 1) % Math.max(1, gear.length - 4))
  }

  const prevGear = () => {
    setGearIndex((prev) => (prev - 1 + Math.max(1, gear.length - 4)) % Math.max(1, gear.length - 4))
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      {/* Header Section */}
      <div className="text-center py-12 px-6">
        <h1 className="text-3xl font-bold mb-4 font-heading uppercase tracking-wide" style={{ color: '#5A2C59' }}>
          Welcome to Your PlayBook, {firstName}!
        </h1>
        <p className="text-lg" style={{ color: '#5A2C59' }}>
          Your PlayBook dashboard will help you keep track of your coaches, upcoming training
          and events, and help you manage your progress, on an off the field.
        </p>

        {/* Progress Summary */}
        <div className="flex justify-center items-center gap-8 mt-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center">
              <sportData.icon className="w-8 h-8" style={{ color: '#5A2C59' }} />
            </div>
            <p className="font-semibold" style={{ color: '#5A2C59' }}>Sport</p>
            <p className="text-sm" style={{ color: '#5A2C59' }}>{sportData.title}</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center">
              <BookOpen className="w-8 h-8" style={{ color: '#91A6EB' }} />
            </div>
            <p className="font-semibold" style={{ color: '#5A2C59' }}>Progress</p>
          </div>

          <div style={{ color: '#5A2C59' }} className="text-left max-w-sm">
            <h3 className="font-semibold mb-2 font-heading">Your Progress Summary</h3>
            <ul className="text-sm space-y-1">
              <li>• You completed 0 training sessions. Let's go!</li>
              <li>• You have 2 new training recommendations from Jasmine Aikey</li>
              <li>• You have 1 upcoming live session.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Your Coaches Section */}
      <div style={{ backgroundColor: '#91A6EB' }} className="py-12 px-6">
        <h2 className="text-2xl font-bold text-center text-white mb-8 font-heading uppercase tracking-wide">Your Coaches</h2>

        <div className="flex justify-center gap-6 mb-8">
          {placeholderCoaches.map((coach, index) => (
            <div key={index} className="text-center">
              <div className="w-24 h-24 rounded-full mb-3 mx-auto overflow-hidden border-4 border-white/30">
                <img
                  src={coach.image}
                  alt={coach.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-white text-sm">{coach.name}</h3>
              <p className="text-white/80 text-xs">{coach.specialty}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
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

      {/* Personal Training Recommendations */}
      <div className="py-12 px-6">
        <h2 className="text-2xl font-bold text-center mb-8 font-heading uppercase tracking-wide" style={{ color: '#5A2C59' }}>
          Your Personal Training Recommendations
        </h2>

        <div className="flex justify-center gap-6 mb-8">
          {sportData.recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
              <img
                src={rec.image}
                alt={rec.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bold mb-2" style={{ color: '#5A2C59' }}>{rec.title}</h3>
                <p className="text-sm mb-4" style={{ color: '#5A2C59' }}>
                  {rec.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#91A6EB' }}>
                    {rec.duration}
                  </span>
                  <button
                    style={{ backgroundColor: '#FF6B35' }}
                    className="px-4 py-2 rounded text-white text-sm font-semibold hover:opacity-90"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/lessons">
            <button
              style={{ backgroundColor: '#20B2AA' }}
              className="px-8 py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Training
            </button>
          </Link>
        </div>
      </div>

      {/* Recommended Gear Section */}
      <div className="py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-heading uppercase tracking-wide" style={{ color: '#5A2C59' }}>
            Your Recommended Gear
          </h2>
          <Link
            href="/gear"
            className="text-sm font-semibold"
            style={{ color: '#FF6B35' }}
          >
            Shop All
          </Link>
        </div>

        <div className="relative">
          <div className="flex justify-center gap-4 mb-6">
            {visibleGear.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden w-48">
                <div className="relative">
                  {item.tag && (
                    <span
                      style={{ backgroundColor: item.tag === 'Best Seller' ? '#FF6B35' : '#20B2AA' }}
                      className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded"
                    >
                      {item.tag}
                    </span>
                  )}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-2" style={{ color: '#5A2C59' }}>
                    {item.name}
                  </h3>
                  <p className="font-bold mb-3" style={{ color: '#5A2C59' }}>
                    {item.price}
                  </p>
                  <button
                    style={{ backgroundColor: '#FF6B35' }}
                    className="w-full py-2 rounded text-white text-sm font-semibold hover:opacity-90"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          {gear.length > 5 && (
            <>
              <button
                onClick={prevGear}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronLeft className="w-6 h-6" style={{ color: '#5A2C59' }} />
              </button>
              <button
                onClick={nextGear}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronRight className="w-6 h-6" style={{ color: '#5A2C59' }} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}