'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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
  Link2,
  Image
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
  thumbnailFile?: File | null // Uploaded thumbnail image
  thumbnailUrl?: string // URL to thumbnail image
}

function CreateLessonPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [polishing, setPolishing] = useState(false)
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
    videoFile: null,
    thumbnailFile: null,
    thumbnailUrl: ''
  })

  const [videoFileName, setVideoFileName] = useState('')
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [showVideoScrubber, setShowVideoScrubber] = useState(false)
  const [scrubbedThumbnail, setScrubbedThumbnail] = useState<string | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

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

  // Handle thumbnail file selection
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or WebP)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        alert('Image file is too large. Maximum size is 5MB.')
        return
      }

      setLesson(prev => ({ ...prev, thumbnailFile: file }))
      setThumbnailFileName(file.name)
    }
  }

  // Remove thumbnail file
  const removeThumbnailFile = () => {
    setLesson(prev => ({ ...prev, thumbnailFile: null }))
    setThumbnailFileName('')
  }

  // Capture thumbnail from video at current time
  const captureThumbnailFromVideo = () => {
    const video = videoPreviewRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setScrubbedThumbnail(thumbnailDataUrl)

      // Convert data URL to blob and then to File
      fetch(thumbnailDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'video-thumbnail.jpg', { type: 'image/jpeg' })
          setLesson(prev => ({ ...prev, thumbnailFile: file }))
          setThumbnailFileName('video-thumbnail.jpg')
          setShowVideoScrubber(false)
        })
    }
  }

  // Handle video scrubber slider change
  const handleVideoScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoPreviewRef.current
    if (!video) return

    const time = parseFloat(e.target.value)
    video.currentTime = time
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

  // Upload thumbnail to Firebase Storage
  const uploadThumbnailToStorage = async (thumbnailFile: File, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a unique file path
        const timestamp = Date.now()
        const sanitizedFileName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storageRef = ref(storage, `lesson-thumbnails/${userId}/${timestamp}_${sanitizedFileName}`)

        // Create upload task
        const uploadTask = uploadBytesResumable(storageRef, thumbnailFile)

        // Monitor upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking for thumbnail is less critical
          },
          (error) => {
            console.error('Thumbnail upload error:', error)
            reject(new Error(`Upload failed: ${error.message}`))
          },
          async () => {
            // Upload completed successfully, get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            } catch (error) {
              console.error('Error getting download URL:', error)
              reject(new Error('Failed to get download URL'))
            }
          }
        )
      } catch (error) {
        console.error('Error setting up upload:', error)
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
      let uploadedThumbnailUrl = lesson.thumbnailUrl || ''

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

      // Upload thumbnail file if present
      if (lesson.thumbnailFile) {
        try {
          uploadedThumbnailUrl = await uploadThumbnailToStorage(lesson.thumbnailFile, user.uid)
          console.log('Thumbnail uploaded successfully:', uploadedThumbnailUrl)
        } catch (uploadError: any) {
          console.error('Thumbnail upload failed:', uploadError)
          alert(`Failed to upload thumbnail: ${uploadError.message}. Please try again or continue without the thumbnail.`)
          setSaving(false)
          return
        }
      }

      const token = await user.getIdToken()

      // Prepare lesson data with video URL and thumbnail URL (either from upload or URL input)
      const lessonData = {
        ...lesson,
        videoUrl: uploadedVideoUrl,
        thumbnailUrl: uploadedThumbnailUrl,
        videoFile: undefined, // Remove file object before sending
        thumbnailFile: undefined // Remove file object before sending
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
        {/* AI Generation Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>AI Lesson Generator</h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6, fontFamily: '"Open Sans", sans-serif' }}>Powered by advanced AI</p>
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

              <p className="mb-6 text-sm leading-relaxed" style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>
                Fill in the details below and our AI will create a complete lesson plan with sections, objectives, and training content.
              </p>

              <div className="space-y-4 mb-6">
                {/* Sport Selection */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Sport <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiSport}
                    onChange={(e) => setAiSport(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
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
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Skill Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
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
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Lesson Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., Proper Batting Stance and Swing Mechanics"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                    disabled={generating}
                  />
                </div>

                {/* Detailed Description (Optional) */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Add any specific requirements, drills, key focus points, or teaching methods you want to include..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                    disabled={generating}
                  />
                  <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.5, fontFamily: '"Open Sans", sans-serif' }}>
                    The more details you provide, the better the AI-generated lesson will be
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAIGenerate}
                  disabled={generating || !aiSport || !aiLevel || !aiTopic.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: generating ? '#666' : '#000' }}
                  onMouseEnter={(e) => !generating && (e.currentTarget.style.backgroundColor = '#FC0105')}
                  onMouseLeave={(e) => !generating && (e.currentTarget.style.backgroundColor = '#000')}
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
                  className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Scrubber Modal */}
        {showVideoScrubber && lesson.videoFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Select Video Thumbnail</h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6, fontFamily: '"Open Sans", sans-serif' }}>Scrub through the video to find the perfect frame</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoScrubber(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Video Player */}
              <div className="space-y-4 mb-6">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoPreviewRef}
                    src={URL.createObjectURL(lesson.videoFile)}
                    className="w-full h-auto"
                    controls
                    style={{ maxHeight: '400px' }}
                  />
                </div>

                {/* Scrubber Slider */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Scrub Timeline
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={videoPreviewRef.current?.duration || 0}
                    step="0.1"
                    onChange={handleVideoScrub}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      accentColor: '#000000'
                    }}
                  />
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.6, fontFamily: '"Open Sans", sans-serif' }}>
                    Drag the slider or use the video controls to find your desired thumbnail frame
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={captureThumbnailFromVideo}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#000' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FC0105'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
                >
                  <Image className="w-5 h-5" />
                  Use This Frame
                </button>
                <button
                  onClick={() => setShowVideoScrubber(false)}
                  className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
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
              className="w-full bg-black text-white rounded-xl p-4 hover:bg-red-600 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
              style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#000' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FC0105'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000'}
            >
              <Sparkles className="w-6 h-6" />
              <div className="text-left">
                <h3 className="font-bold text-base" style={{ fontFamily: '"Open Sans", sans-serif' }}>Generate with AI</h3>
                <p className="text-xs text-white/80" style={{ fontFamily: '"Open Sans", sans-serif' }}>Let AI create a complete lesson in seconds</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto" />
            </button>

            {/* Basic Information */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Lesson Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Advanced Pitching Mechanics"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
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
              <h2 className="text-xl font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
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
              <h2 className="text-xl font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
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
                    <div className="space-y-3">
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

                      {/* Select Thumbnail from Video Button */}
                      <button
                        onClick={() => setShowVideoScrubber(true)}
                        className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-bold"
                        style={{ fontFamily: '"Open Sans", sans-serif' }}
                        type="button"
                      >
                        <Image className="w-5 h-5" />
                        Select Thumbnail from Video
                      </button>
                    </div>
                  )}

                  <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.5 }}>
                    Note: Video files will be uploaded to cloud storage when you save the lesson
                  </p>
                </div>
              </div>
            </div>

            {/* Thumbnail Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                <Image className="w-6 h-6" style={{ color: '#FC0105' }} />
                Lesson Thumbnail (Optional)
              </h2>

              <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.6, fontFamily: '"Open Sans", sans-serif' }}>
                Add a custom thumbnail image for your lesson. This is especially useful for lessons without videos.
              </p>

              <div className="space-y-4">
                {/* Thumbnail File Upload */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Upload Thumbnail Image
                  </label>

                  {!lesson.thumbnailFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        <Image className="w-10 h-10 mb-2" style={{ color: '#000000', opacity: 0.4 }} />
                        <p className="text-sm" style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>
                          <span className="font-bold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5, fontFamily: '"Open Sans", sans-serif' }}>
                          JPEG, PNG, or WebP (max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleThumbnailFileChange}
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Image className="w-6 h-6 text-red-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>{thumbnailFileName}</p>
                            <p className="text-xs" style={{ color: '#000000', opacity: 0.6, fontFamily: '"Open Sans", sans-serif' }}>
                              {lesson.thumbnailFile && `${(lesson.thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeThumbnailFile}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                          type="button"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>

                      {/* Thumbnail Preview */}
                      {lesson.thumbnailFile && (
                        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                          <img
                            src={URL.createObjectURL(lesson.thumbnailFile)}
                            alt="Thumbnail preview"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.5, fontFamily: '"Open Sans", sans-serif' }}>
                    Recommended size: 1280x720 pixels (16:9 aspect ratio)
                  </p>
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Lesson Content
                </h2>
                <button
                  type="button"
                  onClick={async () => {
                    if (!lesson.content.trim() || polishing) return
                    setPolishing(true)
                    try {
                      const res = await fetch('/api/ai/polish-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: lesson.content,
                          sport: lesson.sport || undefined
                        })
                      })
                      const data = await res.json()
                      if (res.ok && data?.polishedText) {
                        setLesson(prev => ({ ...prev, content: data.polishedText }))
                      } else {
                        console.error('AI polish failed:', data)
                        alert('AI polish failed. Please try again in a moment.')
                      }
                    } catch (err) {
                      console.error('AI polish error:', err)
                      alert('Unable to reach AI polish service right now.')
                    } finally {
                      setPolishing(false)
                    }
                  }}
                  disabled={polishing || !lesson.content.trim()}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3" />
                  {polishing ? 'Polishing…' : 'AI Polish'}
                </button>
              </div>

              <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.6 }}>
                Write your lesson content using Markdown formatting. You can include headings, lists, bold/italic text, and more. Use
                {' '}<span className="font-semibold">AI Polish</span> to clean up spelling, grammar, and formatting without changing your ideas.
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
                  const hasChanges = !!(lesson.title || lesson.content)
                  if (hasChanges && !confirm('Are you sure? Your changes will be lost.')) {
                    return
                  }

                  if (embedded) {
                    // When inside locker-room iframe, go back to the lessons library view
                    router.push('/dashboard/coach/lessons/library?embedded=true')
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
