'use client'

import { useState, useEffect, Suspense} from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { storage } from '@/lib/firebase.client'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { SPORTS } from '@/lib/constants/sports'
import {
  GraduationCap,
  Save,
  Eye,
  Sparkles,
  Wand2,
  Lightbulb,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  X,
  Video,
  Upload,
  Link2
} from 'lucide-react'

interface LessonForm {
  title: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced' | ''
  duration: number
  objectives: string[]
  content: string // Single long-form content field
  tags: string[]
  visibility: 'public' | 'athletes_only' | 'specific_athletes'
  videoUrl?: string // YouTube, Vimeo, or other video links
  videoFile?: File | null // Uploaded video file
}

function CreateLessonPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiSport, setAiSport] = useState('')
  const [aiLevel, setAiLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('')
  const [currentObjective, setCurrentObjective] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [lesson, setLesson] = useState<LessonForm>({
    title: '',
    sport: '',
    level: '',
    duration: 60,
    objectives: [],
    content: '', // Single long-form content field
    tags: [],
    visibility: 'athletes_only',
    videoUrl: '',
    videoFile: null
  })

  const [videoFileName, setVideoFileName] = useState('')

  // Add objective
  const addObjective = () => {
    if (currentObjective.trim()) {
      setLesson(prev => ({
        ...prev,
        objectives: [...prev.objectives, currentObjective.trim()]
      }))
      setCurrentObjective('')
    }
  }

  // Remove objective
  const removeObjective = (index: number) => {
    setLesson(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, idx) => idx !== index)
    }))
  }

  // Add tag
  const addTag = () => {
    if (currentTag.trim()) {
      setLesson(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  // Remove tag
  const removeTag = (index: number) => {
    setLesson(prev => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== index)
    }))
  }

  // Handle video file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, MOV, AVI, or WebM)')
        return
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024 // 500MB in bytes
      if (file.size > maxSize) {
        alert('Video file is too large. Maximum size is 500MB.')
        return
      }

      setLesson(prev => ({ ...prev, videoFile: file }))
      setVideoFileName(file.name)
    }
  }

  // Remove video file
  const removeVideoFile = () => {
    setLesson(prev => ({ ...prev, videoFile: null }))
    setVideoFileName('')
  }

  // Upload video to Firebase Storage
  const uploadVideoToStorage = async (videoFile: File, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a unique file path
        const timestamp = Date.now()
        const sanitizedFileName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storageRef = ref(storage, `lesson-videos/${userId}/${timestamp}_${sanitizedFileName}`)

        // Create upload task
        const uploadTask = uploadBytesResumable(storageRef, videoFile)

        // Monitor upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(Math.round(progress))
          },
          (error) => {
            console.error('Video upload error:', error)
            setUploadingVideo(false)
            setUploadProgress(0)
            reject(new Error(`Upload failed: ${error.message}`))
          },
          async () => {
            // Upload completed successfully, get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              setUploadingVideo(false)
              setUploadProgress(0)
              resolve(downloadURL)
            } catch (error) {
              console.error('Error getting download URL:', error)
              setUploadingVideo(false)
              setUploadProgress(0)
              reject(new Error('Failed to get download URL'))
            }
          }
        )
      } catch (error) {
        console.error('Error setting up upload:', error)
        setUploadingVideo(false)
        setUploadProgress(0)
        reject(error)
      }
    })
  }

  // Generate lesson with AI
  const handleAIGenerate = async () => {
    if (!aiSport) {
      alert('Please select a sport')
      return
    }

    if (!aiLevel) {
      alert('Please select a skill level')
      return
    }

    if (!aiTopic.trim()) {
      alert('Please enter a topic for your lesson')
      return
    }

    if (!user) {
      alert('Please log in to generate lessons')
      return
    }

    setGenerating(true)
    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/generate-lesson-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          sport: aiSport,
          level: aiLevel,
          duration: '45 minutes',
          detailedInstructions: aiPrompt.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate lesson')
      }

      const data = await response.json()

      // Parse and populate the form with AI-generated content
      if (data.lesson) {
        setLesson(prev => ({
          ...prev,
          title: data.lesson.title || prev.title,
          sport: data.lesson.sport || prev.sport,
          level: data.lesson.level || prev.level,
          duration: data.lesson.duration || prev.duration,
          objectives: data.lesson.objectives || prev.objectives,
          tags: data.lesson.tags || prev.tags,
          content: data.lesson.content || prev.content // Single long-form content
        }))

        setShowAIModal(false)
        setAiPrompt('')
        setAiTopic('')
        setAiSport('')
        setAiLevel('')
        alert('AI lesson generated! Review and edit as needed before saving.')
      }
    } catch (error: any) {
      console.error('Error generating lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate lesson. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Save lesson
  const handleSave = async () => {
    if (!lesson.title || !lesson.sport || !lesson.level) {
      alert('Please fill in all required fields (Title, Sport, Level)')
      return
    }

    setSaving(true)
    try {
      if (!user) {
        alert('You must be logged in to create a lesson')
        return
      }

      let uploadedVideoUrl = lesson.videoUrl || ''

      // Upload video file if present
      if (lesson.videoFile) {
        setUploadingVideo(true)
        try {
          uploadedVideoUrl = await uploadVideoToStorage(lesson.videoFile, user.uid)
          console.log('Video uploaded successfully:', uploadedVideoUrl)
        } catch (uploadError: any) {
          console.error('Video upload failed:', uploadError)
          alert(`Failed to upload video: ${uploadError.message}. Please try again or continue without the video.`)
          setSaving(false)
          return
        }
      }

      const token = await user.getIdToken()

      // Prepare lesson data with video URL (either from upload or URL input)
      const lessonData = {
        ...lesson,
        videoUrl: uploadedVideoUrl,
        videoFile: undefined // Remove file object before sending
      }

      const response = await fetch('/api/coach/lessons/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          alert(`Validation Error:\n\n${error.details.join('\n')}`)
        } else {
          throw new Error(error.error || 'Failed to create lesson')
        }
        return
      }

      const data = await response.json()
      alert('✅ Lesson created successfully!')

      // Redirect to lesson library
      if (embedded) {
        router.push('/dashboard/coach/lessons/library?embedded=true')
      } else {
        router.push('/dashboard/coach/lessons/library')
      }
    } catch (error: any) {
      console.error('Error creating lesson:', error)
      alert(`Error creating lesson: ${error.message}`)
    } finally {
      setSaving(false)
      setUploadingVideo(false)
      setUploadProgress(0)
    }
  }

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[CreateLesson] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])

  // Auto-populate sport from coach profile
  useEffect(() => {
    const loadCoachProfile = async () => {
      if (!user || authLoading || lesson.sport) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/coach-profile/get', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.sport) {
            setLesson(prev => ({ ...prev, sport: data.data.sport }))
            setAiSport(data.data.sport)
            console.log(`✅ Auto-populated sport: ${data.data.sport}`)
          }
        }
      } catch (error) {
        console.error('Failed to load coach profile:', error)
      }
    }

    loadCoachProfile()
  }, [user, authLoading, lesson.sport])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && <AppHeader title="Create Lesson" subtitle="Build comprehensive training content for your athletes" />}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        {/* Header for embedded mode */}
        {embedded && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl font-medium" style={{ color: '#000000' }}>Create Lesson</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Build comprehensive training content for your athletes
            </p>
          </div>
        )}

        {/* AI Generation Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-medium" style={{ color: '#000000' }}>AI Lesson Generator</h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>Powered by advanced AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={generating}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="mb-6 text-sm leading-relaxed" style={{ color: '#000000', opacity: 0.7 }}>
                Fill in the details below and our AI will create a complete lesson plan with sections, objectives, and training content.
              </p>

              <div className="space-y-4 mb-6">
                {/* Sport Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Sport <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiSport}
                    onChange={(e) => setAiSport(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={generating}
                  >
                    <option value="">Select sport...</option>
                    {SPORTS.map((sport) => (
                      <option key={sport} value={sport.toLowerCase().replace(/\s+/g, '_')}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skill Level Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Skill Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={generating}
                  >
                    <option value="">Select level...</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Lesson Topic */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Lesson Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Proper Batting Stance and Swing Mechanics"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={generating}
                  />
                </div>

                {/* Detailed Description (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Add any specific requirements, drills, key focus points, or teaching methods you want to include..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                    disabled={generating}
                  />
                  <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.5 }}>
                    The more details you provide, the better the AI-generated lesson will be
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAIGenerate}
                  disabled={generating || !aiSport || !aiLevel || !aiTopic.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {generating ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Lesson
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={generating}
                  className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Layout: Form + Live Preview */}
        <div className="grid lg:grid-cols-[1fr,500px] gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="space-y-6">
            {/* AI Generate Button - Prominent at top */}
            <button
              onClick={() => setShowAIModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-4 hover:from-purple-700 hover:to-blue-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              <div className="text-left">
                <h3 className="font-medium text-base">Generate with AI</h3>
                <p className="text-xs text-white/80">Let AI create a complete lesson in seconds</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto" />
            </button>

            {/* Basic Information */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4" style={{ color: '#000000' }}>
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Lesson Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Advanced Pitching Mechanics"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Sport and Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Sport <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={lesson.sport}
                      onChange={(e) => setLesson(prev => ({ ...prev, sport: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select sport...</option>
                      <option value="baseball">Baseball</option>
                      <option value="basketball">Basketball</option>
                      <option value="bjj">Brazilian Jiu-Jitsu (BJJ)</option>
                      <option value="football">Football</option>
                      <option value="soccer">Soccer</option>
                      <option value="softball">Softball</option>
                      <option value="volleyball">Volleyball</option>
                      <option value="wrestling">Wrestling</option>
                      <option value="mma">MMA</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Skill Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={lesson.level}
                      onChange={(e) => setLesson(prev => ({ ...prev, level: e.target.value as any }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select level...</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Duration and Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={lesson.duration}
                      onChange={(e) => setLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                      min="5"
                      max="240"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Visibility
                    </label>
                    <select
                      value={lesson.visibility}
                      onChange={(e) => setLesson(prev => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="athletes_only">My Athletes Only</option>
                      <option value="specific_athletes">Specific Athletes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4" style={{ color: '#000000' }}>
                Learning Objectives
              </h2>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentObjective}
                    onChange={(e) => setCurrentObjective(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                    placeholder="Type an objective and press Enter"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                  <button
                    onClick={addObjective}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {lesson.objectives.length > 0 && (
                  <div className="space-y-2">
                    {lesson.objectives.map((obj, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm">{obj}</span>
                        </div>
                        <button onClick={() => removeObjective(idx)} className="hover:bg-red-100 rounded-full p-2 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4" style={{ color: '#000000' }}>
                Tags (Optional)
              </h2>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags for organization"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {lesson.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, idx) => (
                      <div key={idx} className="bg-teal/20 px-3 py-2 rounded-full flex items-center gap-2 border border-teal/30">
                        <span className="text-sm">{tag}</span>
                        <button onClick={() => removeTag(idx)} className="hover:bg-red-100 rounded-full p-1">
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
                <Video className="w-6 h-6" style={{ color: '#FF6B35' }} />
                Video (Optional)
              </h2>

              <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.6 }}>
                Add a video to your lesson. You can either paste a video link (YouTube, Vimeo, etc.) or upload a video file.
              </p>

              <div className="space-y-4">
                {/* Video URL Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Video Link (YouTube, Vimeo, etc.)
                    </div>
                  </label>
                  <input
                    type="url"
                    value={lesson.videoUrl}
                    onChange={(e) => setLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>
                    Paste a YouTube, Vimeo, or other video URL
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm" style={{ color: '#000000', opacity: 0.5 }}>OR</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Video File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Video File
                    </div>
                  </label>

                  {!lesson.videoFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        <Upload className="w-10 h-10 mb-2" style={{ color: '#000000', opacity: 0.4 }} />
                        <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>
                          MP4, MOV, AVI, or WebM (max 500MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                        onChange={handleVideoFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="w-6 h-6 text-orange-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#000000' }}>{videoFileName}</p>
                          <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                            {lesson.videoFile && `${(lesson.videoFile.size / (1024 * 1024)).toFixed(2)} MB`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeVideoFile}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.5 }}>
                    Note: Video files will be uploaded to cloud storage when you save the lesson
                  </p>
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4" style={{ color: '#000000' }}>
                Lesson Content
              </h2>

              <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.6 }}>
                Write your lesson content using Markdown formatting. You can include headings, lists, bold/italic text, and more.
              </p>

              <textarea
                value={lesson.content}
                onChange={(e) => setLesson(prev => ({ ...prev, content: e.target.value }))}
                placeholder="# Introduction

Start writing your lesson content here...

## Section 1

Write detailed explanations, instructions, and guidance for your athletes."
                rows={20}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y font-mono text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <div className="flex-1">
                <button
                  onClick={handleSave}
                  disabled={saving || uploadingVideo || !lesson.title || !lesson.sport || !lesson.level}
                  className="w-full px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-lg shadow-lg"
                >
                  <Save className="w-6 h-6" />
                  {uploadingVideo ? `Uploading Video... ${uploadProgress}%` : saving ? 'Saving...' : 'Save Lesson'}
                </button>
                {uploadingVideo && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (lesson.title || lesson.content) {
                    if (confirm('Are you sure? Your changes will be lost.')) {
                      router.back()
                    }
                  } else {
                    router.back()
                  }
                }}
                disabled={saving || uploadingVideo}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE PREVIEW */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                  <Eye className="w-5 h-5" style={{ color: '#20B2AA' }} />
                  <h3 className="text-lg font-medium" style={{ color: '#000000' }}>Live Preview</h3>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {/* Title Preview */}
                  {lesson.title ? (
                    <div>
                      <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                        {lesson.title}
                      </h1>
                      <div className="flex items-center gap-3 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                        {lesson.sport && <span className="capitalize">{lesson.sport}</span>}
                        {lesson.level && <span className="capitalize">{lesson.level}</span>}
                        {lesson.duration && <span>{lesson.duration} min</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: '#000000', opacity: 0.4 }}>
                      <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Start creating to see preview</p>
                    </div>
                  )}

                  {/* Objectives Preview */}
                  {lesson.objectives.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium mb-2" style={{ color: '#000000' }}>Learning Objectives</h4>
                      <ul className="space-y-1">
                        {lesson.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags Preview */}
                  {lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lesson.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-3 py-1 bg-teal/20 text-teal-800 rounded-full border border-teal/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content Preview */}
                  {lesson.content && (
                    <div className="space-y-4">
                      <h4 className="font-medium" style={{ color: '#000000' }}>Lesson Content</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#000000', opacity: 0.7 }}>
                          {lesson.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CreateLessonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <CreateLessonPageContent />
    </Suspense>
  )
}
