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
   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
   {/* Tabs */}
   <div className="border-b border-gray-200">
    <nav className="flex space-x-8 px-6" aria-label="Tabs">
     <button
      onClick={() => setActiveTab('signups')}
      className={`py-4 px-1 border-b-2  text-sm ${
       activeTab === 'signups'
        ? 'border-sky-blue text-sky-blue'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
     >
      <div className="flex items-center gap-2">
       <Users className="w-4 h-4" />
       Recent Signups ({signups.length})
      </div>
     </button>
     <button
      onClick={() => setActiveTab('notifications')}
      className={`py-4 px-1 border-b-2  text-sm ${
       activeTab === 'notifications'
        ? 'border-sky-blue text-sky-blue'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <h3 className="text-lg  text-gray-900">Recent User Signups</h3>

      {signups.length === 0 ? (
       <p className="text-gray-500">No signups yet.</p>
      ) : (
       <div className="space-y-3">
        {signups.map((signup) => (
         <div
          key={signup.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
         >
          <div className="flex items-center gap-4">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            signup.isSuperadmin ? 'bg-black text-white' : 'bg-sky-blue text-white'
           }`}>
            <Users className="w-5 h-5" />
           </div>
           <div>
            <div className="flex items-center gap-2">
             <h4 className=" text-gray-900">
              {signup.displayName || 'Anonymous'}
             </h4>
             {signup.isSuperadmin && (
              <span className="px-2 py-1 text-xs bg-black text-white rounded-full">
               Superadmin
              </span>
             )}
            </div>
            <p className="text-sm text-gray-500">{signup.email}</p>
           </div>
          </div>

          <div className="text-right">
           <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            {formatTimestamp(signup.timestamp)}
           </div>
           <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs  ${
            signup.signUpMethod === 'google'
             ? 'bg-blue-100 text-blue-800'
             : 'bg-green-100 text-green-800'
           }`}>
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
      <h3 className="text-lg  text-gray-900">Admin Notifications</h3>

      {notifications.length === 0 ? (
       <p className="text-gray-500">No notifications.</p>
      ) : (
       <div className="space-y-3">
        {notifications.map((notification) => (
         <div
          key={notification.id}
          className={`p-4 border rounded-lg ${
           notification.read
            ? 'border-gray-200 bg-gray-50'
            : 'border-sky-blue bg-sky-blue/5'
          }`}
         >
          <div className="flex items-start justify-between">
           <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
             <h4 className={` ${
              notification.read ? 'text-gray-700' : 'text-gray-900'
             }`}>
              {notification.title}
             </h4>
             {!notification.read && (
              <span className="w-2 h-2 bg-sky-blue rounded-full"></span>
             )}
            </div>
            <p className={`text-sm mb-2 ${
             notification.read ? 'text-gray-500' : 'text-gray-700'
            }`}>
             {notification.message}
            </p>
            <div className="text-xs text-gray-400">
             {formatTimestamp(notification.timestamp)}
            </div>
           </div>

           {!notification.read && (
            <button
             onClick={() => markNotificationAsRead(notification.id)}
             className="ml-4 p-2 text-gray-400 hover:text-sky-blue"
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