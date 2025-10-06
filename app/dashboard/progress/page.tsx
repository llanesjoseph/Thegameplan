'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import {
 TrendingUp,
 Target,
 Trophy,
 Calendar,
 BarChart3,
 CheckCircle,
 Clock,
 ArrowRight,
 Star,
 Award,
 Zap
} from 'lucide-react'
import { MedalIcon } from '@/components/icons/MedalIcon'
import { StopwatchIcon } from '@/components/icons/StopwatchIcon'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'
import AppHeader from '@/components/ui/AppHeader'

export default function ProgressDashboard() {
 const { user } = useAuth()
 const { role, loading: roleLoading } = useEnhancedRole()
 const router = useRouter()
 const [userProfile, setUserProfile] = useState<any>(null)
 const [progressStats, setProgressStats] = useState({
  completedSessions: 5,
  totalHours: 23,
  currentStreak: 7,
  skillLevel: 'Intermediate',
  nextGoal: 'Advanced Guard Techniques'
 })
 const [recentActivities, setRecentActivities] = useState([
  { id: 1, title: 'Guard Fundamentals', completion: 85, date: '2 days ago', type: 'lesson' },
  { id: 2, title: 'Live Sparring Session', completion: 100, date: '3 days ago', type: 'session' },
  { id: 3, title: 'Submission Setups', completion: 60, date: '1 week ago', type: 'lesson' },
  { id: 4, title: 'Competition Prep', completion: 40, date: '1 week ago', type: 'program' }
 ])

 // Redirect coaches to their coach dashboard
 useEffect(() => {
  if (!roleLoading && (role === 'coach' || role === 'creator' || role === 'assistant')) {
   router.replace('/dashboard/creator')
  }
 }, [role, roleLoading, router])

 useEffect(() => {
  const loadUserData = async () => {
   if (!user?.uid) return

   try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
     setUserProfile(userDoc.data())
    }
   } catch (error) {
    console.error('Error loading user data:', error)
   }
  }

  loadUserData()
 }, [user])

 const getSportIcon = (sport: string) => {
  switch (sport) {
   case 'Brazilian Jiu-Jitsu (BJJ)':
   case 'Mixed Martial Arts (MMA)':
    return MMAGlovesIcon
   case 'Soccer':
    return SoccerIcon
   case 'Basketball':
    return BasketballIcon
   case 'Football':
    return FootballIcon
   default:
    return TrendingUp
  }
 }

 const SportIcon = getSportIcon(userProfile?.sport)

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   <AppHeader />
   {/* Header Section */}
   <div className="text-center py-12 px-6">
    <h1 className="text-3xl mb-4 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Your Athletic Progress
    </h1>
    <p className="text-lg mb-8" style={{ color: '#000000' }}>
     Track your training journey and celebrate your achievements
    </p>

    {/* Progress Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
     <div className="bg-white/80 rounded-xl p-6 text-center shadow-lg">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-sky-blue to-black flex items-center justify-center">
       <CheckCircle className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-2xl font-heading" style={{ color: '#000000' }}>
       {progressStats.completedSessions}
      </h3>
      <p className="text-sm" style={{ color: '#000000' }}>Sessions Complete</p>
     </div>

     <div className="bg-white/80 rounded-xl p-6 text-center shadow-lg">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange to-black flex items-center justify-center">
       <StopwatchIcon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-2xl font-heading" style={{ color: '#000000' }}>
       {progressStats.totalHours}
      </h3>
      <p className="text-sm" style={{ color: '#000000' }}>Hours Trained</p>
     </div>

     <div className="bg-white/80 rounded-xl p-6 text-center shadow-lg">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-green to-black flex items-center justify-center">
       <Zap className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-2xl font-heading" style={{ color: '#000000' }}>
       {progressStats.currentStreak}
      </h3>
      <p className="text-sm" style={{ color: '#000000' }}>Day Streak</p>
     </div>

     <div className="bg-white/80 rounded-xl p-6 text-center shadow-lg">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-black to-sky-blue flex items-center justify-center">
       <SportIcon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-heading" style={{ color: '#000000' }}>
       {progressStats.skillLevel}
      </h3>
      <p className="text-sm" style={{ color: '#000000' }}>Current Level</p>
     </div>
    </div>
   </div>

   {/* Recent Activity Section */}
   <div className="py-12 px-6">
    <h2 className="text-2xl text-center mb-8 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Recent Training Activity
    </h2>

    <div className="max-w-4xl mx-auto space-y-4">
     {recentActivities.map((activity) => (
      <div key={activity.id} className="bg-white rounded-lg p-6 shadow-lg flex items-center justify-between">
       <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-blue to-black flex items-center justify-center">
         {activity.type === 'lesson' && <Target className="w-6 h-6 text-white" />}
         {activity.type === 'session' && <Trophy className="w-6 h-6 text-white" />}
         {activity.type === 'program' && <BarChart3 className="w-6 h-6 text-white" />}
        </div>

        <div>
         <h3 className=" text-lg" style={{ color: '#000000' }}>
          {activity.title}
         </h3>
         <p className="text-sm" style={{ color: '#000000' }}>
          {activity.date}
         </p>
        </div>
       </div>

       <div className="flex items-center gap-4">
        <div className="text-center">
         <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
            style={{
             borderColor: activity.completion === 100 ? '#20B2AA' : '#91A6EB',
             backgroundColor: activity.completion === 100 ? '#20B2AA20' : '#91A6EB20'
            }}>
          <span className="" style={{ color: activity.completion === 100 ? '#20B2AA' : '#91A6EB' }}>
           {activity.completion}%
          </span>
         </div>
        </div>

        <ArrowRight className="w-5 h-5" style={{ color: '#000000' }} />
       </div>
      </div>
     ))}
    </div>
   </div>

   {/* Goals & Next Steps Section */}
   <div className="py-12 px-6">
    <div className="max-w-4xl mx-auto text-center">
     <h2 className="text-2xl mb-8 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
      Your Next Goal
     </h2>

     <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-black/5">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#91A6EB' }}>
       <Award className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-xl mb-4 font-heading" style={{ color: '#000000' }}>
       {progressStats.nextGoal}
      </h3>

      <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
       Continue your training to unlock advanced techniques and take your skills to the next level.
      </p>

      <div className="flex gap-4 justify-center">
       <Link href="/lessons">
        <button
         style={{ backgroundColor: '#20B2AA' }}
         className="px-6 py-3 rounded-full text-white  hover:opacity-90 transition-opacity shadow-lg"
        >
         Continue Training
        </button>
       </Link>

       <Link href="/dashboard/coaching">
        <button
         className="px-6 py-3 rounded-full  border-2 hover:bg-black/5 transition-all shadow-lg"
         style={{ color: '#000000', borderColor: '#000000' }}
        >
         Get Coaching Help
        </button>
       </Link>
      </div>
     </div>
    </div>
   </div>

   {/* Achievement Badges Section */}
   <div className="py-12 px-6">
    <h2 className="text-2xl text-center mb-8 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Recent Achievements
    </h2>

    <div className="flex justify-center gap-6">
     {[
      { title: '7-Day Streak', icon: Zap, earned: true, color: '#FF6B35' },
      { title: 'First Lesson', icon: Star, earned: true, color: '#20B2AA' },
      { title: '5 Sessions', icon: MedalIcon, earned: true, color: '#91A6EB' },
      { title: '20 Hour Mark', icon: StopwatchIcon, earned: false, color: '#E8E6D8' }
     ].map((badge, index) => (
      <div key={index} className={`text-center ${badge.earned ? 'opacity-100' : 'opacity-40'}`}>
       <div
        className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg"
        style={{ backgroundColor: badge.color }}
       >
        <badge.icon className="w-8 h-8" style={{ color: badge.earned ? 'white' : '#000000' }} />
       </div>
       <p className="text-sm " style={{ color: '#000000' }}>
        {badge.title}
       </p>
      </div>
     ))}
    </div>
   </div>
  </div>
 )
}