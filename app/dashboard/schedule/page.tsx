'use client'
import { useEffect, useState } from 'react'
import { db, auth } from '@/lib/firebase.client'
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { Calendar, Clock, Plus, Save, Send, Trash2, Search, User } from 'lucide-react'

type Slot = { day: string, start: string, end: string }

export default function UserSchedule() {
  const [uid, setUid] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([{ day: 'Mon', start: '17:00', end: '18:00' }])
  const [creatorUid, setCreatorUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      try {
        if (!user) await signInAnonymously(auth)
        const u = auth.currentUser!
        setUid(u.uid)
        const snap = await getDoc(doc(db, 'availability', u.uid))
        if (snap.exists()) setSlots(snap.data().slots || [])
      } catch (error: any) {
        console.warn('Failed to load availability:', error)
        if (error.code === 'failed-precondition' || error.message?.includes('offline')) {
          console.log('Working in offline mode')
        }
      }
    })
    return () => unsub()
  }, [])

  const saveAvailability = async () => {
    if (!uid) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'availability', uid), { uid, slots, updatedAt: new Date() }, { merge: true })
      alert('Availability saved successfully!')
    } catch (error: any) {
      console.error('Save availability error:', error)
      if (error.code === 'failed-precondition' || error.message?.includes('offline')) {
        alert('Unable to save - you appear to be offline. Please check your connection and try again.')
      } else {
        alert('Failed to save availability. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const proposeSession = async () => {
    if (!uid || !creatorUid || slots.length === 0) return
    setProposing(true)
    try {
      const first = slots[0]
      await addDoc(collection(db, 'sessions'), {
        userUid: uid,
        creatorUid,
        status: 'proposed',
        proposed: [{ ...first }],
        createdAt: serverTimestamp()
      })
      alert('Session proposed successfully!')
      setCreatorUid('')
    } catch (error: any) {
      console.error('Propose session error:', error)
      if (error.code === 'failed-precondition' || error.message?.includes('offline')) {
        alert('Unable to propose session - you appear to be offline. Please check your connection and try again.')
      } else {
        alert('Failed to propose session. Please try again.')
      }
    } finally {
      setProposing(false)
    }
  }

  const updateSlot = (i: number, patch: Partial<Slot>) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  const addSlot = () => {
    setSlots(prev => [...prev, { day: 'Tue', start: '17:00', end: '18:00' }])
  }

  const removeSlot = (i: number) => {
    if (slots.length > 1) {
      setSlots(prev => prev.filter((_, idx) => idx !== i))
    }
  }

  const searchCreators = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      // Search by email or display name
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'creator'),
        limit(10)
      )
      
      const snapshot = await getDocs(usersQuery)
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.includes(searchTerm)
        )
      
      setSearchResults(results)
    } catch (error) {
      console.warn('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const selectCreator = (creator: any) => {
    setCreatorUid(creator.id)
    setSearchQuery(creator.displayName || creator.email || creator.id)
    setSearchResults([])
  }

  const dayOptions = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-sky-blue to-black">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold font-heading uppercase tracking-wide mb-4" style={{ color: '#000000' }}>
              Set Your Schedule
            </h1>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#000000' }}>
              Let coaches know when you're available for training sessions
            </p>
          </div>

          {/* Single Column Layout */}
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Availability Section */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-black flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold font-heading" style={{ color: '#000000' }}>
                  Your Availability
                </h2>
              </div>
              
              <div className="space-y-3 mb-8">
                {slots.map((slot, i) => (
                  <div key={i} className="bg-white/60 rounded-xl p-4 border border-white/30 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[200px]">
                        <select
                          className="w-full bg-white/80 border border-white/50 rounded-lg px-4 py-2.5 font-medium focus:ring-2 focus:ring-sky-blue focus:border-transparent"
                          style={{ color: '#000000' }}
                          value={slot.day}
                          onChange={e => updateSlot(i, { day: e.target.value })}
                        >
                          {dayOptions.map(day => (
                            <option key={day.value} value={day.value} className="bg-white">
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          className="bg-white/80 border border-white/50 rounded-lg px-4 py-2.5 font-medium focus:ring-2 focus:ring-sky-blue focus:border-transparent"
                          style={{ color: '#000000' }}
                          value={slot.start}
                          onChange={e => updateSlot(i, { start: e.target.value })}
                        />
                        <span className="font-medium" style={{ color: '#000000' }}>to</span>
                        <input
                          type="time"
                          className="bg-white/80 border border-white/50 rounded-lg px-4 py-2.5 font-medium focus:ring-2 focus:ring-sky-blue focus:border-transparent"
                          style={{ color: '#000000' }}
                          value={slot.end}
                          onChange={e => updateSlot(i, { end: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        {slots.length > 1 && (
                          <button
                            onClick={() => removeSlot(i)}
                            className="p-2.5 hover:bg-red-500/10 rounded-lg transition-colors"
                            style={{ color: '#FF6B35' }}
                            title="Remove time slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={addSlot}
                  className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#91A6EB' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </button>

                <button
                  onClick={saveAvailability}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#20B2AA' }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>

            {/* Propose Session Section */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green to-black flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold font-heading" style={{ color: '#000000' }}>
                  Propose a Session
                </h2>
              </div>
              
              <div className="space-y-4 mb-6">
                {/* Creator Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5" style={{ color: '#000000' }} />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-white/80 border border-white/50 rounded-xl pl-12 pr-4 py-3.5 font-medium focus:ring-2 focus:ring-sky-blue focus:border-transparent"
                    placeholder="Search coaches by name, email, or ID..."
                    style={{ color: '#000000' }}
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      searchCreators(e.target.value)
                    }}
                  />
                  {searching && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#20B2AA', borderTopColor: 'transparent' }}></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-white/80 rounded-xl border border-white/50 max-h-48 overflow-y-auto shadow-lg">
                    {searchResults.map((creator, index) => (
                      <button
                        key={creator.id}
                        onClick={() => selectCreator(creator)}
                        className="w-full px-4 py-3 text-left hover:bg-white/60 transition-colors border-b border-white/20 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-blue to-black rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: '#000000' }}>
                              {creator.displayName || creator.email || 'Unknown Creator'}
                            </div>
                            <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>
                              {creator.email && creator.displayName ? creator.email : creator.id}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <div className="text-center py-4" style={{ color: '#000000', opacity: 0.7 }}>
                    <p>No coaches found matching "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try entering their ID manually below</p>
                  </div>
                )}

                {/* Manual Creator ID Input */}
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-white/80 border border-white/50 rounded-xl px-4 py-3.5 font-medium focus:ring-2 focus:ring-sky-blue focus:border-transparent"
                    placeholder="Or enter coach ID directly..."
                    style={{ color: '#000000' }}
                    value={creatorUid}
                    onChange={e => setCreatorUid(e.target.value)}
                  />
                </div>
                
                {/* Selected Time Slot Preview */}
                {slots.length > 0 && creatorUid && (
                  <div className="bg-gradient-to-r from-sky-blue/10 to-black/10 rounded-xl p-4 border border-sky-blue/20 shadow-sm">
                    <div className="flex items-center justify-center gap-6" style={{ color: '#000000' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: '#91A6EB' }} />
                        <span className="font-semibold">{dayOptions.find(d => d.value === slots[0].day)?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" style={{ color: '#20B2AA' }} />
                        <span className="font-semibold">{slots[0].start} - {slots[0].end}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <button
                  onClick={proposeSession}
                  disabled={!creatorUid || slots.length === 0 || proposing}
                  className="px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all text-lg shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#20B2AA' }}
                >
                  {proposing ? 'Proposing Session...' : 'Propose Session'}
                </button>

                {!creatorUid && (
                  <p className="mt-3 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Search for a coach above to get started
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


