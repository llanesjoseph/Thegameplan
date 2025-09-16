'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import { ArrowLeft, Clock, User, MessageSquare, CheckCircle, Calendar, ChevronDown, ChevronUp, Mail, CalendarDays, Send } from 'lucide-react'

import { CoachingRequest } from '@/lib/types'

export default function CreatorRequests() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [items, setItems] = useState<CoachingRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [schedulingCard, setSchedulingCard] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [schedulingMessage, setSchedulingMessage] = useState('')

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading) return
    
    if (user && (role === 'creator' || role === 'superadmin' || role === 'admin')) {
      loadCreatorRequests()
    } else {
      setLoadingRequests(false)
    }
  }, [user?.uid, role, loading])

  const loadCreatorRequests = async () => {
    if (!user?.uid) {
      console.log('No user UID, cannot load creator requests')
      setLoadingRequests(false)
      return
    }
    
    setLoadingRequests(true)
    console.log('Starting to load creator requests for user:', user.uid)
    
    try {
      // Use a more efficient approach with compound queries
      const requestsData: CoachingRequest[] = []
      
      // Query 1: Get requests targeting this creator specifically
      const targetedQuery = query(
        collection(db, 'coaching_requests'), 
        where('targetCreatorUid', '==', user.uid)
      )
      const targetedSnap = await getDocs(targetedQuery)
      console.log('📋 Targeted requests found:', targetedSnap.docs.length)
      
      targetedSnap.docs.forEach(d => {
        const data = d.data()
        requestsData.push({ 
          id: d.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as CoachingRequest)
      })
      
      // Query 2: Get open requests (no target creator)
      const openQuery = query(
        collection(db, 'coaching_requests'), 
        where('targetCreatorUid', '==', null)
      )
      const openSnap = await getDocs(openQuery)
      console.log('🔓 Open requests found:', openSnap.docs.length)
      
      openSnap.docs.forEach(d => {
        const data = d.data()
        requestsData.push({ 
          id: d.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as CoachingRequest)
      })
      
      // Sort by creation date (newest first)
      const sortedRequests = requestsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      console.log('✅ Total requests loaded:', sortedRequests.length)
      setItems(sortedRequests)
      
    } catch (error: any) {
      console.error('Error loading creator requests:', error)
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      
      // Show user-friendly error
      if (error?.code === 'permission-denied') {
        console.error('Permission denied - user may not have creator role or security rules issue')
      }
    } finally {
      setLoadingRequests(false)
    }
  }

  const claim = async (id: string) => {
    if (!user?.uid) return
    
    try {
      console.log('🎯 Accepting request:', id, 'by creator:', user.uid)
      
      // Find the request to get user details for notification
      const request = items.find(r => r.id === id)
      if (!request) {
        console.error('Request not found:', id)
        return
      }

      // Update the coaching request
      await updateDoc(doc(db, 'coaching_requests', id), { 
        targetCreatorUid: user.uid, 
        targetCreatorName: user.displayName || user.email || 'Unknown Creator',
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      // Create notification for the user who requested coaching
      if (request.userId) {
        try {
          await addDoc(collection(db, 'notifications', request.userId, 'messages'), {
            type: 'coaching_accepted',
            title: 'Coaching Request Accepted!',
            message: `Great news! ${user.displayName || user.email || 'A creator'} has accepted your coaching request for "${request.title}". They will be in touch soon!`,
            requestId: id,
            creatorUid: user.uid,
            creatorName: user.displayName || user.email || 'Unknown Creator',
            read: false,
            createdAt: serverTimestamp()
          })
          console.log('✅ Notification sent to user:', request.userId)
        } catch (notifError) {
          console.error('❌ Error sending notification:', notifError)
          // Don't fail the whole operation if notification fails
        }
      }

      // Update local state
      setItems(prev => prev.map(i => i.id === id ? { 
        ...i, 
        targetCreatorUid: user.uid, 
        targetCreatorName: user.displayName || user.email || 'Unknown Creator',
        status: 'accepted' 
      } : i))

      console.log('✅ Request accepted successfully')
      
    } catch (error) {
      console.error('❌ Error claiming request:', error)
      alert('Failed to accept request. Please try again.')
    }
  }

  const complete = async (id: string) => {
    try {
      console.log('✅ Completing request:', id)
      
      // Find the request to get user details for notification
      const request = items.find(r => r.id === id)
      if (!request) {
        console.error('Request not found:', id)
        return
      }

      // Update the coaching request
      await updateDoc(doc(db, 'coaching_requests', id), { 
        status: 'completed',
        completedAt: serverTimestamp()
      })

      // Create notification for the user who requested coaching
      if (request.userId) {
        try {
          await addDoc(collection(db, 'notifications', request.userId, 'messages'), {
            type: 'coaching_completed',
            title: 'Coaching Session Completed!',
            message: `Your coaching session for "${request.title}" has been completed by ${user?.displayName || user?.email || 'your coach'}. We hope it was helpful!`,
            requestId: id,
            creatorUid: user?.uid,
            creatorName: user?.displayName || user?.email || 'Unknown Creator',
            read: false,
            createdAt: serverTimestamp()
          })
          console.log('✅ Completion notification sent to user:', request.userId)
        } catch (notifError) {
          console.error('❌ Error sending completion notification:', notifError)
        }
      }

      // Update local state
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed' } : i))
      console.log('✅ Request completed successfully')
      
    } catch (error) {
      console.error('❌ Error completing request:', error)
      alert('Failed to mark request as complete. Please try again.')
    }
  }

  const scheduleSession = async (id: string) => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time.')
      return
    }

    try {
      console.log('📅 Scheduling session for request:', id)
      
      const request = items.find(r => r.id === id)
      if (!request) {
        console.error('Request not found:', id)
        return
      }

      // Update the coaching request with scheduled time
      await updateDoc(doc(db, 'coaching_requests', id), {
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        schedulingMessage: schedulingMessage,
        status: 'scheduled',
        scheduledAt: serverTimestamp(),
        scheduledBy: user?.uid
      })

      // Create notification for the user
      if (request.userId) {
        try {
          await addDoc(collection(db, 'notifications', request.userId, 'messages'), {
            type: 'session_scheduled',
            title: 'Coaching Session Scheduled!',
            message: `Great news! ${user?.displayName || user?.email || 'Your coach'} has scheduled your coaching session for "${request.title}" on ${selectedDate} at ${selectedTime}. ${schedulingMessage ? `Message: ${schedulingMessage}` : ''}`,
            requestId: id,
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            creatorUid: user?.uid,
            creatorName: user?.displayName || user?.email || 'Unknown Creator',
            read: false,
            createdAt: serverTimestamp()
          })
          console.log('✅ Scheduling notification sent to user:', request.userId)
        } catch (notifError) {
          console.error('❌ Error sending scheduling notification:', notifError)
        }
      }

      // Update local state
      setItems(prev => prev.map(i => i.id === id ? { 
        ...i, 
        status: 'scheduled',
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        schedulingMessage: schedulingMessage
      } : i))

      // Reset scheduling state
      setSchedulingCard(null)
      setSelectedDate('')
      setSelectedTime('')
      setSchedulingMessage('')
      
      console.log('✅ Session scheduled successfully')
      
    } catch (error) {
      console.error('❌ Error scheduling session:', error)
      alert('Failed to schedule session. Please try again.')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Loading...</p>
            <p className="text-slate-400 text-sm mt-1">Checking your access permissions</p>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-12 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-cardinal/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to access creator coaching requests.</p>
            <Link 
              href="/dashboard" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-cardinal to-cardinal-dark hover:from-cardinal-dark hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-cardinal/20"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!['creator', 'superadmin', 'admin'].includes(role || '')) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-12 max-w-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Creator Access Required</h1>
            <p className="text-gray-600 mb-6">This page is only available to creators. Your current role: <span className="text-cardinal">{role || 'Not set'}</span></p>
            <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg text-left">
              <p className="text-sm text-gray-500 mb-2">Debug Info:</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>User ID: {user?.uid}</p>
                <p>Email: {user?.email}</p>
                <p>Role: {role}</p>
                <p>Loading: {loading.toString()}</p>
              </div>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cardinal to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Coaching Requests
              </h1>
              <p className="text-slate-600">Manage and respond to student coaching requests</p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!loadingRequests && items.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-gray-600 text-sm">Total Requests</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-600">{items.filter(r => r.status === 'new' || r.status === 'pending').length}</div>
              <div className="text-gray-600 text-sm">Awaiting Response</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{items.filter(r => r.status === 'accepted').length}</div>
              <div className="text-gray-600 text-sm">Accepted</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-cardinal">{items.filter(r => r.status === 'scheduled').length}</div>
              <div className="text-gray-600 text-sm">Scheduled</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{items.filter(r => r.status === 'completed').length}</div>
              <div className="text-gray-600 text-sm">Completed</div>
            </div>
          </div>
        )}

        {loadingRequests ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cardinal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-900 font-medium">Loading coaching requests...</p>
              <p className="text-gray-600 text-sm mt-1">Fetching the latest requests from students</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-cardinal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No coaching requests yet</h3>
              <p className="text-gray-600 mb-6">New coaching requests from students will appear here</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-gray-600 text-sm">Students can request coaching through your lessons and profile pages. Keep creating great content to attract more requests!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(r => {
              const isExpanded = expandedCard === r.id
              const statusColors = {
                new: { bg: 'bg-cardinal/10', text: 'text-red-400', border: 'border-cardinal/30' },
                pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
                accepted: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
                scheduled: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
                completed: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' }
              }
              const colors = statusColors[r.status as keyof typeof statusColors] || statusColors.new
              
              return (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-slate-300">
                  {/* Main card content */}
                  <div className="flex items-center justify-between">
                    {/* Left - Title, requester, and basic info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MessageSquare className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {r.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {r.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{r.userName || r.userEmail || 'Anonymous'}</span>
                          </div>
                          <span>•</span>
                          <span>{r.sport}</span>
                          <span>•</span>
                          <span>{r.skillLevel}</span>
                          <span>•</span>
                          <span className="capitalize">{r.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right - Timing and actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-xs text-gray-600 text-right hidden sm:block">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{r.preferredTime}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{r.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {(!r.targetCreatorUid && (r.status === 'new' || r.status === 'pending')) && (
                        <button 
                          className="px-4 py-2 bg-cardinal hover:bg-cardinal-dark text-white rounded-lg transition-colors text-sm font-medium" 
                          onClick={() => claim(r.id)}
                        >
                          Accept
                        </button>
                      )}
                      {r.targetCreatorUid === user?.uid && r.status === 'accepted' && (
                        <>
                          <button 
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1" 
                            onClick={() => setSchedulingCard(schedulingCard === r.id ? null : r.id)}
                          >
                            <CalendarDays className="w-3 h-3" />
                            Schedule
                          </button>
                          <button 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium" 
                            onClick={() => complete(r.id)}
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {r.targetCreatorUid === user?.uid && r.status === 'scheduled' && (
                        <button 
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium" 
                          onClick={() => complete(r.id)}
                        >
                          Complete
                        </button>
                      )}
                      
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        onClick={() => setExpandedCard(isExpanded ? null : r.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Scheduling Interface */}
                  {schedulingCard === r.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <CalendarDays className="w-5 h-5 text-cardinal" />
                          <h4 className="text-gray-900 font-medium">Schedule Coaching Session</h4>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-cardinal focus:outline-none focus:ring-2 focus:ring-cardinal/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                            <select
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-cardinal focus:outline-none focus:ring-2 focus:ring-cardinal/20"
                            >
                              <option value="">Select time</option>
                              <option value="09:00">9:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="13:00">1:00 PM</option>
                              <option value="14:00">2:00 PM</option>
                              <option value="15:00">3:00 PM</option>
                              <option value="16:00">4:00 PM</option>
                              <option value="17:00">5:00 PM</option>
                              <option value="18:00">6:00 PM</option>
                              <option value="19:00">7:00 PM</option>
                              <option value="20:00">8:00 PM</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                          <textarea
                            value={schedulingMessage}
                            onChange={(e) => setSchedulingMessage(e.target.value)}
                            placeholder="Add any notes about the session (meeting link, location, preparation, etc.)"
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-cardinal focus:outline-none focus:ring-2 focus:ring-cardinal/20 resize-none"
                          />
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => scheduleSession(r.id)}
                            disabled={!selectedDate || !selectedTime}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cardinal hover:from-cyan-700 hover:to-cardinal-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send Schedule
                          </button>
                          <button
                            onClick={() => setSchedulingCard(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Description preview */}
                  {!isExpanded && schedulingCard !== r.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {r.description.length > 150 ? r.description.substring(0, 150) + '...' : r.description}
                      </p>
                      {r.fileUrl && (
                        <div className="mt-2">
                          <span className="text-cardinal text-xs">📎 Has attachment</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Full description */}
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed">{r.description}</p>
                      </div>
                      
                      {/* Contact and session info */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-red-400" />
                            Contact Info
                          </h5>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div><span className="text-gray-600">Name:</span> {r.userName || 'Not provided'}</div>
                            <div><span className="text-gray-600">Email:</span> {r.userEmail || 'Not provided'}</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Session Details
                          </h5>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div><span className="text-gray-600">Preferred Time:</span> {r.preferredTime}</div>
                            <div><span className="text-gray-600">Requested:</span> {r.createdAt.toLocaleDateString()}</div>
                            {(r as any).scheduledDate && (r as any).scheduledTime && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <CalendarDays className="w-3 h-3 text-cardinal" />
                                  <span className="text-cardinal font-medium">Scheduled:</span>
                                </div>
                                <div className="text-gray-900 font-medium">
                                  {new Date((r as any).scheduledDate).toLocaleDateString()} at {(r as any).scheduledTime}
                                </div>
                                {(r as any).schedulingMessage && (
                                  <div className="text-gray-600 text-xs mt-1">
                                    {(r as any).schedulingMessage}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Attachment */}
                      {r.fileUrl && (
                        <div className="mt-4">
                          <a 
                            href={r.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-cardinal hover:text-cardinal-dark text-sm transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200"
                          >
                            📎 View Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}


