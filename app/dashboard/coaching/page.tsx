'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db, storage } from '@/lib/firebase.client'
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { 
  MessageSquare, 
  Video, 
  FileText, 
  Upload, 
  Star, 
  Calendar, 
  Clock,
  User,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'

import { CoachingRequest } from '@/lib/types'

interface Creator {
  uid: string
  displayName: string
  specialties: string[]
  averageRating: number
  location: string
  bio: string
}

export default function CoachingPage() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [activeTab, setActiveTab] = useState<'request' | 'browse' | 'history'>('request')
  const [requestType, setRequestType] = useState<'one_on_one' | 'file_review' | 'group_session'>('one_on_one')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: 'Soccer',
    skillLevel: 'Intermediate',
    preferredTime: 'Weekend',
    targetCreatorUid: '',
    urgency: 'Normal'
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<CoachingRequest[]>([])
  const [availableCreators, setAvailableCreators] = useState<Creator[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated, loading coaching data for:', user.uid)
      loadUserRequests()
      loadAvailableCreators()
    } else if (!loading && !user) {
      console.log('User not authenticated, skipping Firebase calls')
    }
  }, [user, loading])

  const loadUserRequests = async () => {
    if (!user?.uid) {
      console.log('No user ID available, skipping requests load')
      return
    }
    
    try {
      console.log('Loading coaching requests for user:', user.uid)
      console.log('User auth state:', { uid: user.uid, email: user.email })
      
      const requestsQuery = query(
        collection(db, 'coaching_requests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(requestsQuery)
      const requestsData: CoachingRequest[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        requestsData.push({
          id: doc.id,
          type: data.type || 'one_on_one',
          status: data.status || 'new',
          title: data.title || '',
          description: data.description || '',
          sport: data.sport || '',
          skillLevel: data.skillLevel || '',
          preferredTime: data.preferredTime || '',
          targetCreatorUid: data.targetCreatorUid,
          targetCreatorName: data.targetCreatorName,
          fileUrl: data.fileUrl,
          createdAt: data.createdAt?.toDate() || new Date(),
          scheduledAt: data.scheduledAt?.toDate()
        })
      })
      
      console.log('Successfully loaded coaching requests:', requestsData.length)
      setRequests(requestsData)
    } catch (error: any) {
      console.error('Error loading coaching requests:')
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      console.error('Full error:', error)
      
      if (error?.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules for coaching_requests collection')
      }
    }
  }

  const loadAvailableCreators = async () => {
    try {
      console.log('Loading available creators...')
      const creatorsQuery = query(collection(db, 'creators_index'))
      const snapshot = await getDocs(creatorsQuery)
      const creatorsData: Creator[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        creatorsData.push({
          uid: doc.id,
          displayName: data.displayName || 'Unknown Creator',
          specialties: data.specialties || [],
          averageRating: data.averageRating || 4.5,
          location: data.location || 'Not specified',
          bio: data.bio || ''
        })
      })
      
      console.log('Successfully loaded creators:', creatorsData.length)
      setAvailableCreators(creatorsData)
    } catch (error: any) {
      console.error('Error loading creators:')
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      console.error('Full error:', error)
      
      if (error?.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules for creators_index collection')
      }
    }
  }

  const handleSubmit = async () => {
    if (!user?.uid) return
    
    setSubmitting(true)
    
    try {
      let fileUrl: string | undefined
      
      if (file && requestType === 'file_review') {
        const fileRef = ref(storage, `coaching-files/${user.uid}/${Date.now()}-${file.name}`)
        await uploadBytes(fileRef, file)
        fileUrl = await getDownloadURL(fileRef)
      }
      
      await addDoc(collection(db, 'coaching_requests'), {
        userId: user.uid,
        userEmail: user.email,
        type: requestType,
        title: formData.title,
        description: formData.description,
        sport: formData.sport,
        skillLevel: formData.skillLevel,
        preferredTime: formData.preferredTime,
        targetCreatorUid: formData.targetCreatorUid || null,
        urgency: formData.urgency,
        fileUrl: fileUrl || null,
        status: 'new',
        createdAt: serverTimestamp()
      })
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        sport: 'Soccer',
        skillLevel: 'Intermediate',
        preferredTime: 'Weekend',
        targetCreatorUid: '',
        urgency: 'Normal'
      })
      setFile(null)
      
      // Reload requests
      await loadUserRequests()
      
      // Switch to history tab
      setActiveTab('history')
      
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'accepted': return 'bg-green-100 text-green-700'
      case 'scheduled': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'scheduled': return <Calendar className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-brand-grey">Loading coaching dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-brand-grey mb-6">Please sign in to access coaching features.</p>
        </div>
      </div>
    )
  }

  const filteredCreators = availableCreators.filter(creator => {
    const matchesSearch = searchTerm === '' || 
      creator.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      creator.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialty = specialtyFilter === 'all' || 
      creator.specialties.some(s => s.toLowerCase().includes(specialtyFilter.toLowerCase()))
    
    return matchesSearch && matchesSpecialty
  })

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Coaching Dashboard</h1>
          <p className="text-lg text-slate-600">Get personalized coaching to accelerate your progress</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'request' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            New Request
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'browse' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Browse Coaches
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            My Requests ({requests.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'request' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Request Coaching</h2>
            
            {/* Coaching Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Coaching Type</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setRequestType('one_on_one')}
                  className={`p-6 rounded-xl border-2 transition-colors ${
                    requestType === 'one_on_one' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Video className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 mb-2">1-on-1 Session</h4>
                  <p className="text-sm text-slate-600">Live video coaching session</p>
                </button>
                
                <button
                  onClick={() => setRequestType('file_review')}
                  className={`p-6 rounded-xl border-2 transition-colors ${
                    requestType === 'file_review' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 mb-2">File Review</h4>
                  <p className="text-sm text-slate-600">Get feedback on your videos</p>
                </button>
                
                <button
                  onClick={() => setRequestType('group_session')}
                  className={`p-6 rounded-xl border-2 transition-colors ${
                    requestType === 'group_session' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <User className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 mb-2">Group Session</h4>
                  <p className="text-sm text-slate-600">Join a group coaching session</p>
                </button>
              </div>
            </div>

            {/* Request Form */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                    placeholder="e.g., Improve my shooting technique"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sport *
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                  >
                    <option value="Soccer">Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skill Level *
                  </label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, skillLevel: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-3"
                  rows={4}
                  placeholder="Describe what you want to work on, your current challenges, and specific goals..."
                />
              </div>

              {requestType === 'file_review' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload File
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                    <input
                      type="file"
                      accept="video/*,image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    <div className="text-sm text-slate-500 mt-2">
                      Upload videos, images, or documents for review (Max 50MB)
                    </div>
                  </div>
                  {file && (
                    <div className="text-sm text-green-600 mt-2">
                      Selected: {file.name}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  * Required fields
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.title || !formData.description}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search coaches by name, specialty, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="w-full md:w-48 border border-slate-300 rounded-lg p-3"
                  >
                    <option value="all">All Specialties</option>
                    <option value="youth">Youth Development</option>
                    <option value="tactical">Tactical Awareness</option>
                    <option value="shooting">Shooting Technique</option>
                    <option value="mental">Mental Game</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coaches Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div key={creator.uid} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {creator.displayName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{creator.displayName}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        {creator.averageRating}/5.0
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Target className="w-4 h-4" />
                      {creator.location}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {creator.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {specialty}
                        </span>
                      ))}
                      {creator.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{creator.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, targetCreatorUid: creator.uid }))
                      setActiveTab('request')
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Request Coaching
                  </button>
                </div>
              ))}
            </div>

            {filteredCreators.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No coaches found</h3>
                <p className="text-slate-600">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No coaching requests yet</h3>
                <p className="text-slate-600 mb-6">Get started by submitting your first coaching request</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{request.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{request.sport} • {request.skillLevel}</span>
                          <span>{request.type.replace('_', ' ')}</span>
                          <span>{request.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </div>
                    </div>
                    
                    <p className="text-slate-700 mb-4 line-clamp-2">{request.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-600">
                        <span>Time: {request.preferredTime}</span>
                        {request.targetCreatorName && (
                          <span>Coach: {request.targetCreatorName}</span>
                        )}
                      </div>
                      
                      {request.scheduledAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Calendar className="w-4 h-4" />
                          Scheduled: {request.scheduledAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons for Accepted/Completed Requests */}
                    {(request.status === 'accepted' || request.status === 'completed') && request.targetCreatorUid && (
                      <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                        <Link 
                          href={`/lessons?coach=${request.targetCreatorUid}`}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          View Coach's Lessons
                        </Link>
                        <Link 
                          href={`/contributors/${request.targetCreatorUid}`}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          View Profile
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}