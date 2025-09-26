'use client'

import { useEffect, useState } from 'react'
import { db, auth } from '@/lib/firebase.client'
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { 
 Calendar, 
 Clock, 
 Plus, 
 Download, 
 Edit, 
 Trash2, 
 Users, 
 Video,
 MapPin,
 ChevronLeft,
 ChevronRight,
 ExternalLink
} from 'lucide-react'

type Event = {
 id?: string
 title: string
 description: string
 date: string
 startTime: string
 endTime: string
 type: 'coaching' | 'lesson' | 'meeting' | 'personal'
 location?: string
 attendees?: string[]
 creatorUid: string
 status: 'scheduled' | 'confirmed' | 'cancelled'
 createdAt: Date
}

type CalendarDay = {
 date: Date
 isCurrentMonth: boolean
 isToday: boolean
 events: Event[]
}

export default function CreatorSchedule() {
 const [uid, setUid] = useState<string | null>(null)
 const [events, setEvents] = useState<Event[]>([])
 const [selectedDate, setSelectedDate] = useState<Date>(new Date())
 const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
 const [showEventForm, setShowEventForm] = useState(false)
 const [editingEvent, setEditingEvent] = useState<Event | null>(null)
 const [formData, setFormData] = useState<Partial<Event>>({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '10:00',
  type: 'coaching',
  location: '',
  status: 'scheduled'
 })

 useEffect(() => {
  const unsub = onAuthStateChanged(auth, async user => {
   if (!user) await signInAnonymously(auth)
   const me = auth.currentUser!
   setUid(me.uid)
   await loadEvents(me.uid)
  })
  return () => unsub()
 }, [])

 const loadEvents = async (userId: string) => {
  try {
   const q = query(collection(db, 'events'), where('creatorUid', '==', userId))
   const snapshot = await getDocs(q)
   const eventsData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
   })) as Event[]
   setEvents(eventsData)
  } catch (error) {
   console.error('Failed to load events:', error)
  }
 }

 const saveEvent = async () => {
  if (!uid || !formData.title || !formData.date) return

  try {
   const eventData = {
    ...formData,
    creatorUid: uid,
    createdAt: new Date(),
    attendees: formData.attendees || []
   } as Event

   if (editingEvent?.id) {
    await updateDoc(doc(db, 'events', editingEvent.id), eventData)
    setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e))
   } else {
    const docRef = await addDoc(collection(db, 'events'), eventData)
    setEvents(prev => [...prev, { ...eventData, id: docRef.id }])
   }

   setShowEventForm(false)
   setEditingEvent(null)
   setFormData({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'coaching',
    location: '',
    status: 'scheduled'
   })
  } catch (error) {
   console.error('Failed to save event:', error)
  }
 }

 const deleteEvent = async (eventId: string) => {
  if (!confirm('Are you sure you want to delete this event?')) return
  
  try {
   await deleteDoc(doc(db, 'events', eventId))
   setEvents(prev => prev.filter(e => e.id !== eventId))
  } catch (error) {
   console.error('Failed to delete event:', error)
  }
 }

 const generateICS = () => {
  const icsContent = [
   'BEGIN:VCALENDAR',
   'VERSION:2.0',
   'PRODID:-//Game Plan//Creator Schedule//EN',
   'CALSCALE:GREGORIAN',
   'METHOD:PUBLISH',
   ...events.map(event => [
    'BEGIN:VEVENT',
    `UID:${event.id}@gameplan.com`,
    `DTSTART:${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`,
    `DTEND:${event.date.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    event.location ? `LOCATION:${event.location}` : '',
    `STATUS:${event.status.toUpperCase()}`,
    'END:VEVENT'
   ].filter(Boolean)).flat(),
   'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'creator-schedule.ics'
  link.click()
  window.URL.revokeObjectURL(url)
 }

 const getDaysInMonth = (date: Date): CalendarDay[] => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days: CalendarDay[] = []
  const today = new Date()
  
  for (let i = 0; i < 42; i++) {
   const currentDate = new Date(startDate)
   currentDate.setDate(startDate.getDate() + i)
   
   const dayEvents = events.filter(event => 
    event.date === currentDate.toISOString().split('T')[0]
   )
   
   days.push({
    date: currentDate,
    isCurrentMonth: currentDate.getMonth() === month,
    isToday: currentDate.toDateString() === today.toDateString(),
    events: dayEvents
   })
  }
  
  return days
 }

 const getSelectedDateEvents = () => {
  const dateStr = selectedDate.toISOString().split('T')[0]
  return events.filter(event => event.date === dateStr)
 }

 const getEventTypeColor = (type: Event['type']) => {
  switch (type) {
   case 'coaching': return 'bg-cardinal'
   case 'lesson': return 'bg-green-500'
   case 'meeting': return 'bg-purple-500'
   case 'personal': return 'bg-gray-500'
   default: return 'bg-gray-500'
  }
 }

 const getEventTypeIcon = (type: Event['type']) => {
  switch (type) {
   case 'coaching': return Users
   case 'lesson': return Video
   case 'meeting': return Calendar
   case 'personal': return Clock
   default: return Calendar
  }
 }

 const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
 }

 const navigateMonth = (direction: 'prev' | 'next') => {
  setCurrentMonth(prev => {
   const newDate = new Date(prev)
   newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
   return newDate
  })
 }

 const days = getDaysInMonth(currentMonth)
 const selectedDateEvents = getSelectedDateEvents()

 return (
  <div className="min-h-screen bg-gray-50 p-6">
   <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
     <div>
      <h1 className="text-2xl text-gray-900">Creator Schedule</h1>
      <p className="text-gray-600">Manage your coaching sessions, lessons, and events</p>
     </div>
     <div className="flex gap-3">
      <button
       onClick={generateICS}
       className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
       <Download className="w-4 h-4" />
       Export Calendar
      </button>
      <button
       onClick={() => setShowEventForm(true)}
       className="flex items-center gap-2 px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark transition-colors"
      >
       <Plus className="w-4 h-4" />
       Add Event
      </button>
     </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
     {/* Calendar Section */}
     <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
       <h2 className="text-lg  text-gray-900">
        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
       </h2>
       <div className="flex gap-2">
        <button
         onClick={() => navigateMonth('prev')}
         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
         <ChevronLeft className="w-4 h-4" />
        </button>
        <button
         onClick={() => navigateMonth('next')}
         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
         <ChevronRight className="w-4 h-4" />
        </button>
       </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
       {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center text-sm  text-gray-500">
         {day}
        </div>
       ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
       {days.map((day, index) => (
        <button
         key={index}
         onClick={() => setSelectedDate(day.date)}
         className={`p-2 min-h-[60px] text-sm rounded-lg transition-all duration-200 relative ${
          !day.isCurrentMonth
           ? 'text-gray-300 hover:bg-gray-50'
           : day.isToday
           ? 'bg-red-100 text-red-900 '
           : selectedDate.toDateString() === day.date.toDateString()
           ? 'bg-cardinal text-white'
           : 'hover:bg-gray-100 text-gray-900'
         }`}
        >
         <div className="flex flex-col items-center">
          <span>{day.date.getDate()}</span>
          {day.events.length > 0 && (
           <div className="flex gap-1 mt-1">
            {day.events.slice(0, 3).map((event, i) => (
             <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`}
             />
            ))}
            {day.events.length > 3 && (
             <span className="text-xs">+{day.events.length - 3}</span>
            )}
           </div>
          )}
         </div>
        </button>
       ))}
      </div>
     </div>

     {/* Agenda Section */}
     <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
       <h2 className="text-lg  text-gray-900">
        Agenda - {selectedDate.toLocaleDateString('en-US', { 
         weekday: 'long', 
         month: 'long', 
         day: 'numeric' 
        })}
       </h2>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
       {selectedDateEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
         <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
         <p>No events scheduled for this day</p>
         <button
          onClick={() => {
           setFormData(prev => ({ ...prev, date: selectedDate.toISOString().split('T')[0] }))
           setShowEventForm(true)
          }}
          className="mt-2 text-cardinal hover:text-cardinal-dark text-sm"
         >
          Add your first event
         </button>
        </div>
       ) : (
        selectedDateEvents
         .sort((a, b) => a.startTime.localeCompare(b.startTime))
         .map(event => {
          const IconComponent = getEventTypeIcon(event.type)
          return (
           <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
             <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
               <div className={`p-1.5 rounded-lg ${getEventTypeColor(event.type)}`}>
                <IconComponent className="w-4 h-4 text-white" />
               </div>
               <h3 className=" text-gray-900">{event.title}</h3>
               <span className={`px-2 py-1 rounded-full text-xs  ${
                event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
               }`}>
                {event.status}
               </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
               <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
               </div>
               {event.location && (
                <div className="flex items-center gap-1">
                 <MapPin className="w-4 h-4" />
                 {event.location}
                </div>
               )}
              </div>
              {event.description && (
               <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              )}
              {event.attendees && event.attendees.length > 0 && (
               <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
               </div>
              )}
             </div>
             <div className="flex gap-2">
              <button
               onClick={() => {
                setEditingEvent(event)
                setFormData(event)
                setShowEventForm(true)
               }}
               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
               <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
               onClick={() => deleteEvent(event.id!)}
               className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
               <Trash2 className="w-4 h-4 text-red-600" />
              </button>
             </div>
            </div>
           </div>
          )
         })
       )}
      </div>
     </div>
    </div>

    {/* Event Form Modal */}
    {showEventForm && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
       <h3 className="text-lg  text-gray-900 mb-4">
        {editingEvent ? 'Edit Event' : 'Add New Event'}
       </h3>
       
       <div className="space-y-4">
        <div>
         <label className="block text-sm  text-gray-700 mb-1">Title</label>
         <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          placeholder="Event title"
         />
        </div>

        <div>
         <label className="block text-sm  text-gray-700 mb-1">Description</label>
         <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          rows={3}
          placeholder="Event description"
         />
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-sm  text-gray-700 mb-1">Date</label>
          <input
           type="date"
           value={formData.date}
           onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          />
         </div>
         <div>
          <label className="block text-sm  text-gray-700 mb-1">Type</label>
          <select
           value={formData.type}
           onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          >
           <option value="coaching">Coaching</option>
           <option value="lesson">Lesson</option>
           <option value="meeting">Meeting</option>
           <option value="personal">Personal</option>
          </select>
         </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-sm  text-gray-700 mb-1">Start Time</label>
          <input
           type="time"
           value={formData.startTime}
           onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          />
         </div>
         <div>
          <label className="block text-sm  text-gray-700 mb-1">End Time</label>
          <input
           type="time"
           value={formData.endTime}
           onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          />
         </div>
        </div>

        <div>
         <label className="block text-sm  text-gray-700 mb-1">Location (optional)</label>
         <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
          placeholder="Meeting location or video link"
         />
        </div>
       </div>

       <div className="flex gap-3 mt-6">
        <button
         onClick={() => {
          setShowEventForm(false)
          setEditingEvent(null)
          setFormData({
           title: '',
           description: '',
           date: new Date().toISOString().split('T')[0],
           startTime: '09:00',
           endTime: '10:00',
           type: 'coaching',
           location: '',
           status: 'scheduled'
          })
         }}
         className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
         Cancel
        </button>
        <button
         onClick={saveEvent}
         className="flex-1 px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark transition-colors"
        >
         {editingEvent ? 'Update' : 'Create'} Event
        </button>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 )
}