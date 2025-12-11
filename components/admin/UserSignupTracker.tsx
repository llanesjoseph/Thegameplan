'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase.client'
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { Users, Mail, Calendar, CheckCircle, Eye } from 'lucide-react'

interface UserSignup {
 id: string
 uid: string
 email: string
 displayName: string
 signUpMethod: 'google' | 'email'
 timestamp: any
 userAgent?: string
 referrer?: string
 isSuperadmin: boolean
}

interface AdminNotification {
 id: string
 type: string
 title: string
 message: string
 userData: {
  uid: string
  email: string
  displayName: string
  signUpMethod: string
 }
 timestamp: any
 read: boolean
 priority: string
}

export default function UserSignupTracker() {
 const [signups, setSignups] = useState<UserSignup[]>([])
 const [notifications, setNotifications] = useState<AdminNotification[]>([])
 const [loading, setLoading] = useState(true)
 const [activeTab, setActiveTab] = useState<'signups' | 'notifications'>('signups')

 useEffect(() => {
  // Listen to recent signups
  const signupsQuery = query(
   collection(db, 'userSignups'),
   orderBy('timestamp', 'desc'),
   limit(20)
  )

  const unsubSignups = onSnapshot(signupsQuery, (snapshot) => {
   const signupData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   } as UserSignup))
   setSignups(signupData)
   setLoading(false)
  }, (error) => {
   console.warn('Failed to load signups:', error)
   setLoading(false)
  })

  // Listen to admin notifications
  const notificationsQuery = query(
   collection(db, 'adminNotifications'),
   orderBy('timestamp', 'desc'),
   limit(10)
  )

  const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
   const notificationData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   } as AdminNotification))
   setNotifications(notificationData)
  }, (error) => {
   console.warn('Failed to load notifications:', error)
  })

  return () => {
   unsubSignups()
   unsubNotifications()
  }
 }, [])

 const markNotificationAsRead = async (notificationId: string) => {
  try {
   await updateDoc(doc(db, 'adminNotifications', notificationId), {
    read: true
   })
  } catch (error) {
   console.error('Error marking notification as read:', error)
  }
 }

 const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Unknown'
  try {
   return timestamp.toDate().toLocaleString()
  } catch {
   return 'Unknown'
  }
 }

 if (loading) {
  return (
   <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
    <div className="animate-pulse space-y-4">
     <div className="h-6 bg-gray-200 rounded w-1/4"></div>
     <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
   {/* Tabs */}
   <div className="border-b border-gray-300/50">
    <nav className="flex space-x-8 px-6" aria-label="Tabs">
     <button
      onClick={() => setActiveTab('signups')}
      className={`py-4 px-1 border-b-2 text-sm transition-colors ${
       activeTab === 'signups'
        ? 'border-black text-black'
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
      }`}
     >
      <div className="flex items-center gap-2">
       <Users className="w-4 h-4" />
       Recent Signups ({signups.length})
      </div>
     </button>
     <button
      onClick={() => setActiveTab('notifications')}
      className={`py-4 px-1 border-b-2 text-sm transition-colors ${
       activeTab === 'notifications'
        ? 'border-black text-black'
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
      }`}
     >
      <div className="flex items-center gap-2">
       <Mail className="w-4 h-4" />
       Notifications ({notifications.filter(n => !n.read).length})
      </div>
     </button>
    </nav>
   </div>

   <div className="p-6">
    {activeTab === 'signups' && (
     <div className="space-y-4">
      <h3 className="text-xl" style={{ color: '#000000' }}>Recent User Signups</h3>

      {signups.length === 0 ? (
       <p style={{ color: '#000000', opacity: 0.6 }}>No signups yet.</p>
      ) : (
       <div className="space-y-3">
        {signups.map((signup) => (
         <div
          key={signup.id}
          className="flex items-center justify-between p-4 border border-gray-300/50 rounded-xl hover:shadow-md transition-all"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
         >
          <div className="flex items-center gap-4">
           <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: signup.isSuperadmin ? '#000000' : '#91A6EB' }}
           >
            <Users className="w-6 h-6 text-white" />
           </div>
           <div>
            <div className="flex items-center gap-2">
             <h4 className="font-semibold" style={{ color: '#000000' }}>
              {signup.displayName || 'Anonymous'}
             </h4>
             {signup.isSuperadmin && (
              <span className="px-3 py-1 text-xs bg-black text-white rounded-full">
               Superadmin
              </span>
             )}
            </div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{signup.email}</p>
           </div>
          </div>

          <div className="text-right">
           <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000', opacity: 0.6 }}>
            <Calendar className="w-4 h-4" />
            {formatTimestamp(signup.timestamp)}
           </div>
           <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs"
            style={{
             backgroundColor: signup.signUpMethod === 'google' ? '#91A6EB' : '#20B2AA',
             color: '#ffffff'
            }}
           >
            {signup.signUpMethod === 'google' ? '🔵' : '📧'} {signup.signUpMethod}
           </div>
          </div>
         </div>
        ))}
       </div>
      )}
     </div>
    )}

    {activeTab === 'notifications' && (
     <div className="space-y-4">
      <h3 className="text-xl" style={{ color: '#000000' }}>Admin Notifications</h3>

      {notifications.length === 0 ? (
       <p style={{ color: '#000000', opacity: 0.6 }}>No notifications.</p>
      ) : (
       <div className="space-y-3">
        {notifications.map((notification) => (
         <div
          key={notification.id}
          className={`p-4 border rounded-xl transition-all ${
           notification.read
            ? 'border-gray-300/50 bg-white/30'
            : 'border-gray-400 bg-white/60 shadow-md'
          }`}
         >
          <div className="flex items-start justify-between">
           <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
             <h4 className="font-semibold" style={{ color: notification.read ? '#666666' : '#000000' }}>
              {notification.title}
             </h4>
             {!notification.read && (
              <span className="w-2 h-2 bg-black rounded-full"></span>
             )}
            </div>
            <p className="text-sm mb-2" style={{ color: notification.read ? '#888888' : '#000000', opacity: notification.read ? 0.8 : 1 }}>
             {notification.message}
            </p>
            <div className="text-xs" style={{ color: '#000000', opacity: 0.4 }}>
             {formatTimestamp(notification.timestamp)}
            </div>
           </div>

           {!notification.read && (
            <button
             onClick={() => markNotificationAsRead(notification.id)}
             className="ml-4 p-2 hover:bg-black/10 rounded-lg transition-colors"
             style={{ color: '#000000', opacity: 0.6 }}
             title="Mark as read"
            >
             <CheckCircle className="w-4 h-4" />
            </button>
           )}
          </div>
         </div>
        ))}
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 )
}