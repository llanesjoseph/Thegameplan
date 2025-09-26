'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import {
 Users,
 ArrowRight,
 Video,
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
 BookOpen,
 MessageCircle,
 BarChart3,
 Clock,
 Eye
} from 'lucide-react'
import { WhistleIcon } from '@/components/icons/WhistleIcon'
import { TeachingIcon } from '@/components/icons/TeachingIcon'
import { MedalIcon } from '@/components/icons/MedalIcon'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'

// Sport-specific data for coaches
const getCoachSportData = (sport: string) => {
 const sportData = {
  'Brazilian Jiu-Jitsu (BJJ)': {
   icon: MMAGlovesIcon,
   title: 'Brazilian Jiu-Jitsu Coach',
   specialties: [
    {
     title: 'Guard Instruction',
     description: 'Teaching fundamental guard positions and transitions',
     students: 24,
     avgRating: 4.8
    },
    {
     title: 'Competition Prep',
     description: 'Preparing athletes for tournaments',
     students: 12,
     avgRating: 4.9
    },
    {
     title: 'White Belt Program',
     description: 'Comprehensive beginner curriculum',
     students: 38,
     avgRating: 4.7
    }
   ],
   coachingTools: [
    { name: 'Training Mats', price: '$299.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Mats', tag: 'Essential' },
    { name: 'Video Camera', price: '$399.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Camera', tag: 'Recording' },
    { name: 'Technique Charts', price: '$49.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Charts', tag: 'Teaching' },
    { name: 'Timer System', price: '$89.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Timer', tag: 'Training' },
    { name: 'Coaching Clipboard', price: '$24.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Clipboard', tag: 'Planning' }
   ]
  },
  'Mixed Martial Arts (MMA)': {
   icon: MMAGlovesIcon,
   title: 'MMA Coach',
   specialties: [
    {
     title: 'Striking Fundamentals',
     description: 'Boxing and kickboxing instruction',
     students: 32,
     avgRating: 4.9
    },
    {
     title: 'Grappling Integration',
     description: 'MMA-specific ground game',
     students: 28,
     avgRating: 4.8
    },
    {
     title: 'Fight Strategy',
     description: 'Game planning and cage tactics',
     students: 15,
     avgRating: 5.0
    }
   ],
   coachingTools: [
    { name: 'Heavy Bags', price: '$249.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Heavy+Bag', tag: 'Equipment' },
    { name: 'Focus Mitts', price: '$59.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Mitts', tag: 'Striking' },
    { name: 'Grappling Dummy', price: '$199.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Dummy', tag: 'Grappling' },
    { name: 'Round Timer', price: '$79.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Timer', tag: 'Training' },
    { name: 'Coaching Whistle', price: '$12.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Whistle', tag: 'Communication' }
   ]
  }
 }

 // Add more sports as needed
 return sportData[sport as keyof typeof sportData] || {
  icon: SoccerIcon,
  title: 'Coach',
  specialties: [
   {
    title: 'Skill Development',
    description: 'Building fundamental techniques',
    students: 20,
    avgRating: 4.8
   },
   {
    title: 'Team Strategy',
    description: 'Game planning and tactics',
    students: 15,
    avgRating: 4.7
   },
   {
    title: 'Mental Training',
    description: 'Psychology and mindset coaching',
    students: 12,
    avgRating: 4.9
   }
  ],
  coachingTools: [
   { name: 'Training Cones', price: '$29.99', image: 'https://via.placeholder.com/200x200/91A6EB/ffffff?text=Cones', tag: 'Training' },
   { name: 'Clipboard', price: '$19.99', image: 'https://via.placeholder.com/200x200/5A2C59/ffffff?text=Clipboard', tag: 'Planning' },
   { name: 'Stopwatch', price: '$39.99', image: 'https://via.placeholder.com/200x200/FF6B35/ffffff?text=Timer', tag: 'Timing' },
   { name: 'Whistle', price: '$9.99', image: 'https://via.placeholder.com/200x200/20B2AA/ffffff?text=Whistle', tag: 'Communication' },
   { name: 'Water Bottles', price: '$24.99', image: 'https://via.placeholder.com/200x200/E8E6D8/5A2C59?text=Water', tag: 'Hydration' }
  ]
 }
}

export default function CoachOverview() {
 const { user } = useAuth()
 const { role, loading } = useEnhancedRole()
 const [coachProfile, setCoachProfile] = useState<any>(null)
 const [profileLoading, setProfileLoading] = useState(true)
 const [toolIndex, setToolIndex] = useState(0)
 const [stats, setStats] = useState({ athletes: 0, lessons: 0, sessions: 0 })

 // Load coach profile and stats
 useEffect(() => {
  const loadCoachData = async () => {
   if (!user?.uid) return

   try {
    // Load coach profile
    const coachDoc = await getDoc(doc(db, 'coaches', user.uid))
    if (coachDoc.exists()) {
     setCoachProfile(coachDoc.data())
    }

    // Load basic stats (you can enhance this with real queries)
    setStats({
     athletes: 23, // Mock data - replace with real queries
     lessons: 45,
     sessions: 12
    })
   } catch (error) {
    console.error('Error loading coach data:', error)
   } finally {
    setProfileLoading(false)
   }
  }

  loadCoachData()
 }, [user])

 if (loading || profileLoading) {
  return (
   <div className="flex items-center justify-center min-h-96">
    <div className="text-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
     <p className="mt-2 text-dark/70">Loading your Coaching Dashboard...</p>
    </div>
   </div>
  )
 }

 if (!user) {
  return (
   <div className="flex items-center justify-center min-h-96">
    <div className="text-center">
     <h1 className="text-xl  mb-2 text-dark">Sign In Required</h1>
     <p className="text-dark/70 mb-4">Please sign in to access your coaching dashboard.</p>
     <Link href="/dashboard" className="bg-black text-white px-6 py-2 rounded-lg hover:opacity-90">
      Sign In
     </Link>
    </div>
   </div>
  )
 }

 const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Coach'
 const sportData = getCoachSportData(coachProfile?.sport || 'General')
 const tools = sportData.coachingTools
 const visibleTools = tools.slice(toolIndex, toolIndex + 5)

 const nextTools = () => {
  setToolIndex((prev) => (prev + 1) % Math.max(1, tools.length - 4))
 }

 const prevTools = () => {
  setToolIndex((prev) => (prev - 1 + Math.max(1, tools.length - 4)) % Math.max(1, tools.length - 4))
 }

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   {/* Header Section */}
   <div className="text-center py-12 px-6">
    <h1 className="text-3xl mb-4 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Welcome to Your Coaching Hub, {firstName}!
    </h1>
    <p className="text-lg" style={{ color: '#000000' }}>
     Your coaching dashboard will help you manage your athletes, track their progress,
     and deliver exceptional training experiences.
    </p>

    {/* Coaching Stats Summary */}
    <div className="flex justify-center items-center gap-8 mt-8">
     <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center">
       <sportData.icon className="w-8 h-8" style={{ color: '#000000' }} />
      </div>
      <p className="" style={{ color: '#000000' }}>Sport</p>
      <p className="text-sm" style={{ color: '#000000' }}>{sportData.title}</p>
     </div>

     <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center">
       <Users className="w-8 h-8" style={{ color: '#91A6EB' }} />
      </div>
      <p className="" style={{ color: '#000000' }}>Athletes</p>
      <p className="text-sm" style={{ color: '#000000' }}>{stats.athletes} Active</p>
     </div>

     <div style={{ color: '#000000' }} className="text-left max-w-sm">
      <h3 className=" mb-2 font-heading">Your Coaching Summary</h3>
      <ul className="text-sm space-y-1">
       <li>• You have {stats.athletes} active athletes training with you</li>
       <li>• {stats.lessons} lessons created and shared</li>
       <li>• {stats.sessions} live sessions scheduled this month</li>
      </ul>
     </div>
    </div>
   </div>

   {/* Your Athletes Section */}
   <div style={{ backgroundColor: '#91A6EB' }} className="py-12 px-6">
    <h2 className="text-2xl text-center text-white mb-8 font-heading uppercase tracking-wide">Your Athletes</h2>

    <div className="flex justify-center gap-6 mb-8">
     {[
      { name: 'Sarah Johnson', level: 'Intermediate', progress: '85%' },
      { name: 'Mike Chen', level: 'Beginner', progress: '60%' },
      { name: 'Alex Rivera', level: 'Advanced', progress: '92%' },
      { name: 'Emma Davis', level: 'Intermediate', progress: '78%' }
     ].map((athlete, index) => (
      <div key={index} className="text-center">
       <div className="w-24 h-24 rounded-full mb-3 mx-auto overflow-hidden border-4 border-white/30 bg-white/20 flex items-center justify-center">
        <User className="w-12 h-12 text-white/70" />
       </div>
       <h3 className=" text-white text-sm">{athlete.name}</h3>
       <p className="text-white/80 text-xs">{athlete.level} • {athlete.progress}</p>
      </div>
     ))}
    </div>

    <div className="text-center">
     <Link href="/dashboard/creator/requests">
      <button
       style={{ backgroundColor: '#20B2AA' }}
       className="px-8 py-3 rounded-full text-white  hover:opacity-90 transition-opacity"
      >
       View All Athletes
      </button>
     </Link>
    </div>
   </div>

   {/* Your Specialties Section */}
   <div className="py-12 px-6">
    <h2 className="text-2xl text-center mb-8 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Your Coaching Specialties
    </h2>

    <div className="flex justify-center gap-6 mb-8">
     {sportData.specialties.map((specialty, index) => (
      <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
       <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
         <MedalIcon className="w-6 h-6" style={{ color: '#91A6EB' }} />
         <h3 className="" style={{ color: '#000000' }}>{specialty.title}</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: '#000000' }}>
         {specialty.description}
        </p>
        <div className="flex justify-between items-center text-xs" style={{ color: '#91A6EB' }}>
         <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {specialty.students} Students
         </span>
         <span className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {specialty.avgRating}/5.0
         </span>
        </div>
        <button
         style={{ backgroundColor: '#FF6B35' }}
         className="w-full mt-4 py-2 rounded text-white text-sm  hover:opacity-90"
        >
         View Details
        </button>
       </div>
      </div>
     ))}
    </div>

    <div className="text-center">
     <Link href="/dashboard/creator">
      <button
       style={{ backgroundColor: '#20B2AA' }}
       className="px-8 py-3 rounded-full text-white  hover:opacity-90 transition-opacity"
      >
       Create New Content
      </button>
     </Link>
    </div>
   </div>

   {/* Coaching Tools Section */}
   <div className="py-12 px-6">
    <div className="flex justify-between items-center mb-8">
     <h2 className="text-2xl font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
      Your Coaching Tools
     </h2>
     <Link
      href="/gear"
      className="text-sm "
      style={{ color: '#FF6B35' }}
     >
      Shop All
     </Link>
    </div>

    <div className="relative">
     <div className="flex justify-center gap-4 mb-6">
      {visibleTools.map((tool, index) => (
       <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden w-48">
        <div className="relative">
         {tool.tag && (
          <span
           style={{ backgroundColor: tool.tag === 'Essential' ? '#FF6B35' : '#20B2AA' }}
           className="absolute top-2 left-2 px-2 py-1 text-xs text-white rounded"
          >
           {tool.tag}
          </span>
         )}
         <img
          src={tool.image}
          alt={tool.name}
          className="w-full h-32 object-cover"
         />
        </div>
        <div className="p-4">
         <h3 className=" text-sm mb-2" style={{ color: '#000000' }}>
          {tool.name}
         </h3>
         <p className=" mb-3" style={{ color: '#000000' }}>
          {tool.price}
         </p>
         <button
          style={{ backgroundColor: '#FF6B35' }}
          className="w-full py-2 rounded text-white text-sm  hover:opacity-90"
         >
          Add to Cart
         </button>
        </div>
       </div>
      ))}
     </div>

     {/* Navigation arrows */}
     {tools.length > 5 && (
      <>
       <button
        onClick={prevTools}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
       >
        <ChevronLeft className="w-6 h-6" style={{ color: '#000000' }} />
       </button>
       <button
        onClick={nextTools}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
       >
        <ChevronRight className="w-6 h-6" style={{ color: '#000000' }} />
       </button>
      </>
     )}
    </div>
   </div>
  </div>
 )
}