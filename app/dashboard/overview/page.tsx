'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, where, writeBatch } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
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
 Plus,
 Send,
 AlertCircle,
 Loader2
} from 'lucide-react'
import { SoccerIcon } from '@/components/icons/SoccerIcon'
import { BasketballIcon } from '@/components/icons/BasketballIcon'
import { FootballIcon } from '@/components/icons/FootballIcon'
import { MMAGlovesIcon } from '@/components/icons/MMAGlovesIcon'
import ImageUploader from '@/components/ImageUploader'
import AppHeader from '@/components/ui/AppHeader'

// Session interface for TypeScript
interface SessionData {
  id: string
  coachId: string
  coachName: string
  athleteId: string
  athleteName: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  sessionType: string
  status: string
  createdAt: Date | any
  updatedAt: Date | any
  timestamp?: number
  active?: boolean
  version?: number
}

// Mock athletes data (you can replace with real data later)
const mockAthletes = [
 {
  id: 1,
  name: 'Sarah Johnson',
  specialty: 'Soccer - Intermediate',
  image: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b3?w=150&h=150&fit=crop&crop=face',
  progress: 'Improving'
 },
 {
  id: 2,
  name: 'Mike Chen',
  specialty: 'Basketball - Beginner',
  image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  progress: 'Excellent'
 },
 {
  id: 3,
  name: 'Emma Davis',
  specialty: 'Soccer - Advanced',
  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  progress: 'Steady'
 },
 {
  id: 4,
  name: 'Alex Rivera',
  specialty: 'Basketball - Intermediate',
  image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  progress: 'Great'
 }
]

export default function UnifiedDashboard() {
 const { user, loading: authLoading } = useAuth()
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

 // Coach invitation form state
 const [invitationForm, setInvitationForm] = useState({
  email: '',
  name: '',
  sport: '',
  customMessage: ''
 })
 const [invitationLoading, setInvitationLoading] = useState(false)
 const [invitationStatus, setInvitationStatus] = useState<{
  type: 'success' | 'error' | null
  message: string
 }>({ type: null, message: '' })

 // Progress summary data
 const [progressData, setProgressData] = useState({
  completedSessions: 10,
  newRecommendations: 2,
  upcomingSessions: 1
 })

 // Handle coach invitation submission
 const handleCoachInvitation = async (e: React.FormEvent) => {
  e.preventDefault()
  setInvitationLoading(true)
  setInvitationStatus({ type: null, message: '' })

  try {
   // Validate form
   if (!invitationForm.email || !invitationForm.name || !invitationForm.sport) {
    setInvitationStatus({
     type: 'error',
     message: 'Please fill in all required fields (email, name, and sport)'
    })
    return
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   if (!emailRegex.test(invitationForm.email)) {
    setInvitationStatus({
     type: 'error',
     message: 'Please enter a valid email address'
    })
    return
   }

   // Send invitation
   const response = await fetch('/api/coach-ingestion/generate-link', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     organizationName: `${userProfile?.displayName || user?.displayName || 'GamePlan'} Coaching Network`,
     sport: invitationForm.sport,
     description: `Join as a ${invitationForm.sport} coach`,
     customMessage: invitationForm.customMessage || `Hi ${invitationForm.name}, I'd like to invite you to join our coaching platform!`,
     sendEmail: true,
     recipientEmail: invitationForm.email,
     recipientName: invitationForm.name,
     expiresInDays: 30,
     maxUses: 1,
     autoApprove: false
    })
   })

   const data = await response.json()

   if (response.ok && data.success) {
    setInvitationStatus({
     type: 'success',
     message: `Invitation sent successfully to ${invitationForm.name}! They will receive an email with onboarding instructions.`
    })

    // Reset form
    setInvitationForm({
     email: '',
     name: '',
     sport: '',
     customMessage: ''
    })
   } else {
    throw new Error(data.error || 'Failed to send invitation')
   }

  } catch (error) {
   console.error('Error sending coach invitation:', error)
   setInvitationStatus({
    type: 'error',
    message: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.'
   })
  } finally {
   setInvitationLoading(false)
  }
 }

 const router = useRouter()

 // Availability state
 const [selectedDays, setSelectedDays] = useState<string[]>([])
 const [startTime, setStartTime] = useState('17:00')
 const [endTime, setEndTime] = useState('18:00')
 const [showScheduleModal, setShowScheduleModal] = useState(false)
 const [saving, setSaving] = useState(false)

 // Schedule session form state
 const [scheduleForm, setScheduleForm] = useState({
  athleteId: '',
  date: '',
  startTime: '',
  endTime: '',
  sessionType: 'Individual Training'
 })
 const [isScheduling, setIsScheduling] = useState(false)
 const [scheduledSessions, setScheduledSessions] = useState<SessionData[]>([])
 const [scheduleError, setScheduleError] = useState('')

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

    // Load scheduled sessions
    console.log('Loading sessions for user:', user.uid)
    await loadScheduledSessions()
   } catch (error) {
    console.error('Error loading user data:', error)
   } finally {
    setLoading(false)
   }
  }

  if (user?.uid) {
   loadUserData()
  }
 }, [user])

 // Additional effect to refresh sessions when page becomes visible
 useEffect(() => {
  const handleVisibilityChange = () => {
   if (!document.hidden && user?.uid) {
    console.log('Page became visible, refreshing sessions')
    loadScheduledSessions()
   }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
 }, [user])

 const loadScheduledSessions = async () => {
  if (!user?.uid) {
   console.log('No user UID available for loading sessions')
   return
  }

  console.log('Loading sessions for user:', user.uid)

  try {
   // Try with ordering first
   const sessionsQuery = query(
    collection(db, 'users', user.uid, 'sessions'),
    where('active', '==', true),
    orderBy('timestamp', 'desc')
   )
   const snapshot = await getDocs(sessionsQuery)
   const sessions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Ensure date consistency
    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
   })) as SessionData[]

   console.log('Loaded sessions with order:', sessions)
   setScheduledSessions(sessions)
  } catch (error) {
   console.error('Error loading scheduled sessions with order:', error)

   // Fallback: Try without ordering
   try {
    const fallbackQuery = query(
     collection(db, 'users', user.uid, 'sessions'),
     where('active', '==', true)
    )
    const fallbackSnapshot = await getDocs(fallbackQuery)
    const fallbackSessions = fallbackSnapshot.docs.map(doc => ({
     id: doc.id,
     ...doc.data(),
     createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
     updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
    })) as SessionData[]

    // Sort manually by timestamp
    fallbackSessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    console.log('Loaded sessions (fallback):', fallbackSessions)
    setScheduledSessions(fallbackSessions)
   } catch (fallbackError) {
    console.error('Error loading scheduled sessions (fallback):', fallbackError)

    // Final fallback: Load all sessions without any filters
    try {
     const finalQuery = collection(db, 'users', user.uid, 'sessions')
     const finalSnapshot = await getDocs(finalQuery)
     const finalSessions = finalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
     })) as SessionData[]

     console.log('Loaded sessions (final fallback):', finalSessions)
     setScheduledSessions(finalSessions)
    } catch (finalError) {
     console.error('Error loading sessions (final fallback):', finalError)
     setScheduledSessions([])
    }
   }
  }
 }


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


 const handleDayToggle = (day: string) => {
  setSelectedDays(prev =>
   prev.includes(day)
    ? prev.filter(d => d !== day)
    : [...prev, day]
  )
 }

 const handleSaveAvailability = async () => {
  if (!user?.uid) return
  setSaving(true)
  try {
   await setDoc(doc(db, 'users', user.uid), {
    availability: {
     days: selectedDays,
     startTime,
     endTime,
     updatedAt: new Date()
    }
   }, { merge: true })
   alert('Availability saved successfully!')
  } catch (error) {
   console.error('Error saving availability:', error)
   alert('Failed to save availability')
  } finally {
   setSaving(false)
  }
 }

 const handleAthleteClick = (athleteId: number) => {
  router.push(`/dashboard/athletes/${athleteId}`)
 }

 const handleTrainingClick = (trainingId: string) => {
  router.push(`/training/${trainingId}`)
 }

 const handleProductClick = (productId: string) => {
  router.push(`/shop/product/${productId}`)
 }

 const handleSessionStart = (sessionId: string) => {
  router.push(`/dashboard/sessions/${sessionId}`)
 }

 const handleBookSlot = () => {
  // Reset form when opening modal
  setScheduleForm({
   athleteId: '',
   date: '',
   startTime: '',
   endTime: '',
   sessionType: 'Individual Training'
  })
  setScheduleError('')
  setShowScheduleModal(true)
 }

 const handleScheduleSession = async () => {
  if (!user?.uid) return

  setScheduleError('')

  // Validate form
  if (!scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime || !scheduleForm.athleteId) {
   setScheduleError('Please fill in all required fields')
   return
  }

  // Validate time logic
  if (scheduleForm.startTime >= scheduleForm.endTime) {
   setScheduleError('End time must be after start time')
   return
  }

  setIsScheduling(true)
  try {
   const sessionId = `session_${user.uid}_${Date.now()}`
   const selectedAthlete = mockAthletes.find(a => a.id.toString() === scheduleForm.athleteId)

   if (!selectedAthlete) {
    throw new Error('Selected athlete not found')
   }

   // Create consistent session document with all required fields for persistence
   const sessionData = {
    id: sessionId,
    coachId: user.uid,
    coachName: user.displayName || 'Coach',
    athleteId: scheduleForm.athleteId,
    athleteName: selectedAthlete.name,
    title: `${scheduleForm.sessionType} with ${selectedAthlete.name}`,
    description: `${scheduleForm.sessionType} session`,
    date: scheduleForm.date,
    startTime: scheduleForm.startTime,
    endTime: scheduleForm.endTime,
    sessionType: scheduleForm.sessionType,
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Additional fields for robust querying and persistence
    timestamp: Date.now(),
    active: true,
    version: 1
   }

   // Use batch write for atomic operation - ensures both saves succeed or both fail
   const batch = writeBatch(db)

   // Save to global sessions collection
   const globalSessionRef = doc(db, 'sessions', sessionId)
   batch.set(globalSessionRef, sessionData)

   // Save to user's sessions subcollection with same structure
   const userSessionRef = doc(db, 'users', user.uid, 'sessions', sessionId)
   batch.set(userSessionRef, sessionData)

   // Commit the batch
   await batch.commit()

   console.log('Session saved successfully:', sessionData)
   console.log('Session saved to path:', `users/${user.uid}/sessions/${sessionId}`)

   setShowScheduleModal(false)
   alert('Session scheduled successfully!')

   // Reset form
   setScheduleForm({
    athleteId: '',
    date: '',
    startTime: '',
    endTime: '',
    sessionType: 'Individual Training'
   })

   // Reload sessions to show the new one
   await loadScheduledSessions()
  } catch (error) {
   console.error('Error scheduling session:', error)
   setScheduleError(`Failed to schedule session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
   setIsScheduling(false)
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

 // Show loading state while auth is initializing
 if (authLoading || !user) {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-4"></div>
     <p className="text-dark">Loading...</p>
    </div>
   </div>
  )
 }

 const firstName = user?.displayName?.split(' ')[0] || 'Athlete'

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   {/* Add Sports World Font */}
   <style jsx global>{`
    @font-face {
     font-family: 'Sports World';
     src: url('/fonts/sports-world-regular.ttf') format('truetype');
     font-weight: normal;
     font-style: normal;
     font-display: swap;
    }
   `}</style>

   <AppHeader />

   {/* Header Section */}
   <div className="text-center py-12 px-6">
    <h1 className="text-4xl mb-4 font-heading" style={{ color: '#000000' }}>
     Welcome to Your Coach Dashboard, {firstName}!
    </h1>
    <p className="text-lg max-w-3xl mx-auto" style={{ color: '#000000' }}>
     Your PLAYBOOKD coach dashboard will help you manage your athletes, create training content,
     schedule sessions, and track your coaching impact.
    </p>
   </div>

   {/* Your Coach Profile Section */}
   <div className="py-12 px-6">
    <div className="max-w-6xl mx-auto">
     <h2 className="text-2xl font-heading mb-8" style={{ color: '#000000' }}>
      Your Coach Profile
     </h2>

     <div className="grid md:grid-cols-3 gap-8">
      {/* Left Side - Sports and Progress */}
      <div className="md:col-span-2 space-y-6">
       {/* Coaching Specialties */}
       <div>
        <h3 className="text-lg  mb-4" style={{ color: '#000000' }}>
         Coaching Specialties
        </h3>
        <div className="flex flex-wrap gap-2">
         {editForm.sports.map((sport) => {
          const SportIcon = getSportIcon(sport)
          return (
           <div key={sport} className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            <SportIcon className="w-4 h-4" />
            <span className="text-sm ">
             {sport}
            </span>
           </div>
          )
         })}
        </div>
       </div>

       {/* Coaching Impact */}
       <div>
        <h3 className="text-lg  mb-4" style={{ color: '#000000' }}>
         Your Coaching Impact
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
         <li>• You've coached {progressData.completedSessions} training sessions with athletes</li>
         <li>• You have {progressData.newRecommendations} new athlete requests pending review</li>
         <li>• Your coaching rating: ⭐ 4.9/5 from 15 reviews</li>
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
         <div className="w-32 h-32 mb-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-2xl">
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

       <h3 className="text-xl mb-2" style={{ color: '#000000' }}>
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

   {/* Your Athletes Section */}
   <div className="py-12 px-6" style={{ backgroundColor: '#91A6EB' }}>
    <div className="max-w-6xl mx-auto text-center">
     <h2 className="text-2xl text-white mb-8 font-heading">
      Your Athletes
     </h2>

     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {mockAthletes.map((athlete) => (
       <button
        key={athlete.id}
        onClick={() => handleAthleteClick(athlete.id)}
        className="text-center hover:bg-white/10 rounded-lg p-3 transition-colors"
       >
        <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-white/20 hover:border-white/40 transition-colors">
         <img
          src={athlete.image}
          alt={athlete.name}
          className="w-full h-full object-cover"
         />
        </div>
        <h3 className="text-white  text-sm mb-1">
         {athlete.name}
        </h3>
        <p className="text-white/80 text-xs">
         {athlete.specialty}
        </p>
        <p className="text-green-300 text-xs mt-1">
         Progress: {athlete.progress}
        </p>
       </button>
      ))}
     </div>

     <div className="flex gap-4 justify-center">
      <Link href="/dashboard/creator">
       <button className="px-6 py-2 bg-purple-600 text-white rounded-lg  hover:bg-purple-700 transition-colors">
        🏟️ Enter Locker Room
       </button>
      </Link>
      <button
       onClick={() => setShowScheduleModal(true)}
       className="px-6 py-2 bg-blue-600 text-white rounded-lg  hover:bg-blue-700 transition-colors"
      >
       Schedule Session
      </button>
      <Link href="/dashboard/coaching">
       <button className="px-6 py-2 bg-green-600 text-white rounded-lg  hover:bg-green-700 transition-colors">
        Manage Athletes
       </button>
      </Link>
     </div>
    </div>
   </div>

   {/* Your Schedule Section */}
   <div className="py-12 px-6 bg-gray-50">
    <div className="max-w-6xl mx-auto">
     <h2 className="text-2xl font-heading mb-8 text-center" style={{ color: '#000000' }}>
      Your Schedule & Availability
     </h2>

     <div className="grid md:grid-cols-2 gap-8">
      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
       <h3 className="text-lg  mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
        <Calendar className="w-5 h-5" />
        Upcoming Sessions
       </h3>
       <div className="space-y-4">
        {scheduledSessions.length > 0 ? (
         scheduledSessions.slice(0, 3).map((session) => (
          <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
           <div>
            <h4 className=" text-blue-900">
             {session.title || `${session.sessionType} with ${session.athleteName}`}
            </h4>
            <p className="text-sm text-blue-700">
             {session.date ? new Date(session.date).toLocaleDateString() : 'Date TBD'} - {session.startTime || 'TBD'} to {session.endTime || 'TBD'}
            </p>
            <p className="text-xs text-blue-600">
             Status: {session.status || 'scheduled'}
            </p>
           </div>
           <button
            onClick={() => handleSessionStart(session.id)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
           >
            <Play className="w-5 h-5" />
           </button>
          </div>
         ))
        ) : (
         <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No scheduled sessions yet</p>
          <p className="text-xs mt-1">Click "Schedule Session" to book your first session</p>
         </div>
        )}

        {/* Always show the option to add new session */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
         <div>
          <h4 className=" text-gray-900">Schedule New Session</h4>
          <p className="text-sm text-gray-700">Add a new training session</p>
         </div>
         <button
          onClick={handleBookSlot}
          className="text-green-600 hover:text-green-700 transition-colors"
         >
          <Plus className="w-5 h-5" />
         </button>
        </div>
       </div>
      </div>

      {/* Quick Schedule */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
       <h3 className="text-lg  mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
        <Calendar className="w-5 h-5" />
        Set Your Availability
       </h3>
       <div className="space-y-4">
        <div>
         <label className="block text-sm  mb-2" style={{ color: '#000000' }}>
          Preferred Days
         </label>
         <div className="flex flex-wrap gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
           <button
            key={day}
            onClick={() => handleDayToggle(day)}
            className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
             selectedDays.includes(day)
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 hover:bg-blue-50 hover:border-blue-300'
            }`}
           >
            {day}
           </button>
          ))}
         </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-sm  mb-2" style={{ color: '#000000' }}>
           Start Time
          </label>
          <input
           type="time"
           value={startTime}
           onChange={(e) => setStartTime(e.target.value)}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
         </div>
         <div>
          <label className="block text-sm  mb-2" style={{ color: '#000000' }}>
           End Time
          </label>
          <input
           type="time"
           value={endTime}
           onChange={(e) => setEndTime(e.target.value)}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
         </div>
        </div>
        <button
         onClick={handleSaveAvailability}
         disabled={saving}
         className={`w-full py-2 px-4 rounded-lg transition-colors ${
          saving
           ? 'bg-gray-400 cursor-not-allowed'
           : 'bg-blue-600 hover:bg-blue-700'
         } text-white`}
        >
         {saving ? 'Saving...' : 'Save Availability'}
        </button>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Coach Invitation Status Section */}
   <div id="coach-invitations" className="py-8 px-6">
    <div className="max-w-6xl mx-auto">
     <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
       <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-blue-600" />
       </div>
       <div>
        <h3 className="text-lg font-semibold text-blue-900">Coach Invitation Status</h3>
        <p className="text-blue-700 text-sm">Your onboarding invitation was completed successfully</p>
       </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
       <div className="bg-white rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Invitation Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
         <div><strong>Status:</strong> <span className="text-green-600">Active Coach</span></div>
         <div><strong>Organization:</strong> GamePlan Platform</div>
         <div><strong>Sport:</strong> {userProfile?.sports?.[0] || 'Not specified'}</div>
        </div>
       </div>
       <div className="bg-white rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Invite Other Coaches</h4>
        <form onSubmit={handleCoachInvitation} className="space-y-3">
         <div>
          <input
           type="email"
           placeholder="Coach Email Address *"
           value={invitationForm.email}
           onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
           className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           required
           disabled={invitationLoading}
          />
         </div>
         <div>
          <input
           type="text"
           placeholder="Coach Name *"
           value={invitationForm.name}
           onChange={(e) => setInvitationForm(prev => ({ ...prev, name: e.target.value }))}
           className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           required
           disabled={invitationLoading}
          />
         </div>
         <div>
          <select
           value={invitationForm.sport}
           onChange={(e) => setInvitationForm(prev => ({ ...prev, sport: e.target.value }))}
           className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           required
           disabled={invitationLoading}
          >
           <option value="">Select Sport *</option>
           <option value="Brazilian Jiu-Jitsu">Brazilian Jiu-Jitsu</option>
           <option value="Mixed Martial Arts">Mixed Martial Arts</option>
           <option value="Boxing">Boxing</option>
           <option value="Wrestling">Wrestling</option>
           <option value="Soccer">Soccer</option>
           <option value="American Football">American Football</option>
           <option value="Basketball">Basketball</option>
           <option value="Tennis">Tennis</option>
           <option value="Golf">Golf</option>
           <option value="Swimming">Swimming</option>
           <option value="Track & Field">Track & Field</option>
           <option value="Volleyball">Volleyball</option>
           <option value="Baseball">Baseball</option>
           <option value="Hockey">Hockey</option>
           <option value="Gymnastics">Gymnastics</option>
          </select>
         </div>
         <div>
          <textarea
           placeholder="Custom message (optional)"
           value={invitationForm.customMessage}
           onChange={(e) => setInvitationForm(prev => ({ ...prev, customMessage: e.target.value }))}
           className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           rows={2}
           disabled={invitationLoading}
          />
         </div>

         {/* Status Messages */}
         {invitationStatus.type && (
          <div className={`p-3 rounded-md text-sm ${
           invitationStatus.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
           <div className="flex items-center gap-2">
            {invitationStatus.type === 'success' ? (
             <CheckCircle className="w-4 h-4" />
            ) : (
             <AlertCircle className="w-4 h-4" />
            )}
            {invitationStatus.message}
           </div>
          </div>
         )}

         <button
          type="submit"
          disabled={invitationLoading}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
         >
          {invitationLoading ? (
           <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
           </>
          ) : (
           <>
            <Send className="w-4 h-4" />
            Send Invitation
           </>
          )}
         </button>
        </form>
       </div>
      </div>

      <div className="grid md:grid-cols-1 gap-4 mt-6">
       <div className="bg-white rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Additional Actions</h4>
        <div className="space-y-2">
         <button
          onClick={() => window.open('/coach-onboard/test-' + Date.now(), '_blank')}
          className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
         >
          🧪 Test Onboarding Flow
         </button>
         <button
          onClick={() => window.open('/dashboard/coach/profile', '_self')}
          className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
         >
          ✏️ Update Profile
         </button>
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Personal Training Recommendations Section */}
   <div className="py-12 px-6">
    <div className="max-w-6xl mx-auto">
     <h2 className="text-2xl font-heading mb-8 text-center" style={{ color: '#000000' }}>
      Your Personal Training Recommendations
     </h2>

     <div className="space-y-6">
      <button
       onClick={() => handleTrainingClick('footwork-passing')}
       className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full"
      >
       <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
        <Play className="w-8 h-8 text-red-600" />
       </div>
       <div className="flex-1 text-left">
        <h3 className=" text-lg" style={{ color: '#000000' }}>
         Footwork and Passing in Soccer
        </h3>
       </div>
       <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm ">
        Ended
       </div>
      </button>

      <button
       onClick={() => handleTrainingClick('soccer-drills-beginners')}
       className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full"
      >
       <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
        <Play className="w-8 h-8 text-red-600" />
       </div>
       <div className="flex-1 text-left">
        <h3 className=" text-lg" style={{ color: '#000000' }}>
         Soccer Drills for Beginners
        </h3>
       </div>
       <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm ">
        Ended
       </div>
      </button>
     </div>

     <div className="text-center mt-8">
      <button
       onClick={() => router.push('/training')}
       className="px-6 py-2 bg-green-600 text-white rounded-lg  hover:bg-green-700 transition-colors"
      >
       Browse Training
      </button>
     </div>
    </div>
   </div>

   {/* Recommended Gear Section */}
   <div className="py-12 px-6 bg-gray-50">
    <div className="max-w-6xl mx-auto">
     <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
       Your Recommended Gear
      </h2>
      <button className="text-blue-600 hover:text-blue-700 ">
       Shop All →
      </button>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
       onClick={() => handleProductClick('product-1')}
       className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
      >
       <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-gray-500">Product Image</span>
       </div>
       <p className="text-sm text-gray-600">Training Soccer Ball</p>
      </button>

      <button
       onClick={() => handleProductClick('product-2')}
       className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
      >
       <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-gray-500">Product Image</span>
       </div>
       <p className="text-sm text-gray-600">Basketball Hoop</p>
      </button>

      <button
       onClick={() => handleProductClick('product-3')}
       className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
      >
       <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-gray-500">Product Image</span>
       </div>
       <p className="text-sm text-gray-600">Athletic Shoes</p>
      </button>
     </div>
    </div>
   </div>

   {/* Footer */}
   <footer className="bg-white py-8 border-t">
    <div className="max-w-7xl mx-auto px-4">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
       <Link href="/contributors" className="text-gray-600 hover:text-gray-900 ">
        Coaches
       </Link>
       <Link href="/lessons" className="text-gray-600 hover:text-gray-900 ">
        Lessons
       </Link>
       <Link href="/gear" className="text-gray-600 hover:text-gray-900 ">
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

   {/* Schedule Session Modal */}
   {showScheduleModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
       <h3 className="text-lg ">Schedule New Session</h3>
       <button
        onClick={() => {
         setShowScheduleModal(false)
         setScheduleError('')
        }}
        className="text-gray-400 hover:text-gray-600"
       >
        <X className="w-5 h-5" />
       </button>
      </div>

      {scheduleError && (
       <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
        {scheduleError}
       </div>
      )}

      <div className="space-y-4">
       <div>
        <label className="block text-sm  mb-2">Select Athlete <span className="text-red-500">*</span></label>
        <select
         value={scheduleForm.athleteId}
         onChange={(e) => setScheduleForm({ ...scheduleForm, athleteId: e.target.value })}
         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
         required
        >
         <option value="">Select an athlete</option>
         {mockAthletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
           {athlete.name}
          </option>
         ))}
        </select>
       </div>

       <div>
        <label className="block text-sm  mb-2">Date <span className="text-red-500">*</span></label>
        <input
         type="date"
         value={scheduleForm.date}
         onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
         required
        />
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm  mb-2">Start Time <span className="text-red-500">*</span></label>
         <input
          type="time"
          value={scheduleForm.startTime}
          onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
         />
        </div>
        <div>
         <label className="block text-sm  mb-2">End Time <span className="text-red-500">*</span></label>
         <input
          type="time"
          value={scheduleForm.endTime}
          onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
         />
        </div>
       </div>

       <div>
        <label className="block text-sm  mb-2">Session Type</label>
        <select
         value={scheduleForm.sessionType}
         onChange={(e) => setScheduleForm({ ...scheduleForm, sessionType: e.target.value })}
         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
         <option value="Individual Training">Individual Training</option>
         <option value="Group Session">Group Session</option>
         <option value="Video Call">Video Call</option>
         <option value="Assessment">Assessment</option>
        </select>
       </div>
      </div>

      <div className="flex gap-3 mt-6">
       <button
        onClick={() => {
         setShowScheduleModal(false)
         setScheduleError('')
        }}
        className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
       >
        Cancel
       </button>
       <button
        onClick={handleScheduleSession}
        disabled={isScheduling}
        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
         isScheduling
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
        }`}
       >
        {isScheduling ? 'Scheduling...' : 'Schedule Session'}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}