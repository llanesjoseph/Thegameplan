'use client'

import { useState, useEffect, Suspense} from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  GraduationCap,
  Video,
  FileText,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Eye,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Wand2,
  Lightbulb,
  AlertCircle,
  Zap,
  Edit3,
  ChevronRight,
  CheckCircle2,
  Target,
  BookOpen
} from 'lucide-react'

interface LessonSection {
  id: string
  title: string
  type: 'text' | 'video' | 'drill' | 'reflection'
  content: string
  videoUrl?: string
  videoSource?: 'youtube' | 'vimeo' | 'direct'
  duration?: number
  order: number
}

interface LessonForm {
  title: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced' | ''
  duration: number
  objectives: string[]
  sections: LessonSection[]
  tags: string[]
  visibility: 'public' | 'athletes_only' | 'specific_athletes'
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
  const [currentObjective, setCurrentObjective] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [creationMethod, setCreationMethod] = useState<'choose' | 'ai' | 'manual'>('choose')

  const [lesson, setLesson] = useState<LessonForm>({
    title: '',
    sport: '',
    level: '',
    duration: 60,
    objectives: [],
    sections: [],
    tags: [],
    visibility: 'athletes_only'
  })

  // Add a new section
  const addSection = (type: LessonSection['type']) => {
    const newSection: LessonSection = {
      id: `section-${Date.now()}`,
      title: '',
      type,
      content: '',
      order: lesson.sections.length,
      duration: 0
    }
    setLesson(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  // Update section
  const updateSection = (sectionId: string, updates: Partial<LessonSection>) => {
    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }))
  }

  // Delete section
  const deleteSection = (sectionId: string) => {
    setLesson(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
        .map((s, idx) => ({ ...s, order: idx }))
    }))
  }

  // Move section up/down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = lesson.sections.findIndex(s => s.id === sectionId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= lesson.sections.length) return

    const newSections = [...lesson.sections]
    const temp = newSections[currentIndex]
    newSections[currentIndex] = newSections[newIndex]
    newSections[newIndex] = temp

    // Update order numbers
    const reorderedSections = newSections.map((s, idx) => ({ ...s, order: idx }))
    setLesson(prev => ({ ...prev, sections: reorderedSections }))
  }

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

  // Generate lesson with AI
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert('Please describe what lesson you want to create')
      return
    }

    if (!user) {
      alert('Please log in to generate lessons')
      return
    }

    setGenerating(true)
    try {
      // Get Firebase ID token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/generate-lesson-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          sport: lesson.sport || 'general',
          level: lesson.level || 'intermediate',
          coachId: user.uid
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
          sections: (data.lesson.sections || []).map((s: any, idx: number) => ({
            id: `section-${Date.now()}-${idx}`,
            title: s.title || '',
            type: s.type || 'text',
            content: s.content || '',
            order: idx,
            duration: s.duration || 0,
            videoUrl: s.videoUrl,
            videoSource: s.videoSource
          }))
        }))

        setShowAIModal(false)
        setAiPrompt('')
        setCreationMethod('manual') // Switch to manual mode so they can edit
        alert('AI lesson generated! Review and edit as needed before saving.')
      }
    } catch (error: any) {
      console.error('Error generating lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate lesson. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Quick-fill objectives with AI suggestions
  const suggestObjectives = async () => {
    if (!lesson.sport || !lesson.level) {
      alert('Please select sport and skill level first')
      return
    }

    if (!user) {
      alert('Please log in to use AI suggestions')
      return
    }

    setGenerating(true)
    try {
      // Get Firebase ID token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/generate-lesson-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType: 'objectives',
          sport: lesson.sport,
          level: lesson.level,
          topic: lesson.title || 'general training'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate suggestions')
      }

      const data = await response.json()
      if (data.objectives) {
        setLesson(prev => ({
          ...prev,
          objectives: [...prev.objectives, ...data.objectives]
        }))
      }
    } catch (error: any) {
      console.error('Error suggesting objectives:', error)
      alert(error instanceof Error ? error.message : 'Failed to suggest objectives. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // AI-enhance a section
  const enhanceSection = async (sectionId: string) => {
    const section = lesson.sections.find(s => s.id === sectionId)
    if (!section) return

    if (!user) {
      alert('Please log in to use AI enhancement')
      return
    }

    setGenerating(true)
    try {
      // Get Firebase ID token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/generate-lesson-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType: section.type,
          sport: lesson.sport,
          level: lesson.level,
          topic: section.title || lesson.title,
          existingContent: section.content
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to enhance section')
      }

      const data = await response.json()
      if (data.content) {
        updateSection(sectionId, { content: data.content })
        alert('Section enhanced with AI!')
      }
    } catch (error: any) {
      console.error('Error enhancing section:', error)
      alert(error instanceof Error ? error.message : 'Failed to enhance section. Please try again.')
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
      // Get Firebase ID token for authentication
      if (!user) {
        alert('You must be logged in to create a lesson')
        return
      }

      const token = await user.getIdToken()

      const response = await fetch('/api/coach/lessons/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lesson) // Send only lesson data, backend will add creatorUid
      })

      if (!response.ok) {
        const error = await response.json()
        // Handle validation errors
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
    }
  }

  // Extract video ID from URL
  const extractVideoId = (url: string, source: 'youtube' | 'vimeo'): string | null => {
    if (source === 'youtube') {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
      return match ? match[1] : null
    } else if (source === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/i)
      return match ? match[1] : null
    }
    return null
  }

  // Render video preview
  const renderVideoPreview = (section: LessonSection) => {
    if (!section.videoUrl) return null

    if (section.videoSource === 'youtube') {
      const videoId = extractVideoId(section.videoUrl, 'youtube')
      if (videoId) {
        return (
          <div className="mt-2 aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
              title="YouTube Preview"
            />
          </div>
        )
      }
    } else if (section.videoSource === 'vimeo') {
      const videoId = extractVideoId(section.videoUrl, 'vimeo')
      if (videoId) {
        return (
          <div className="mt-2 aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              className="w-full h-full"
              allowFullScreen
              title="Vimeo Preview"
            />
          </div>
        )
      }
    }

    return null
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

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
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

        {/* Choice Screen - Choose how to create */}
        {creationMethod === 'choose' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl mb-3" style={{ color: '#000000' }}>
                How would you like to create your lesson?
              </h2>
              <p className="text-base sm:text-lg" style={{ color: '#000000', opacity: 0.6 }}>
                Choose the method that works best for you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* AI Generation Option */}
              <button
                onClick={() => setShowAIModal(true)}
                className="group bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium mb-3">AI Generate</h3>
                  <p className="text-white/90 mb-6 text-sm leading-relaxed">
                    Describe what you want to teach, and our AI will create a complete lesson with sections, objectives, and content. Perfect for getting started quickly.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="w-5 h-5" />
                    Fast & Recommended
                    <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Manual Creation Option */}
              <button
                onClick={() => setCreationMethod('manual')}
                className="group bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-left relative overflow-hidden hover:border-black"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-black/10 rounded-xl flex items-center justify-center mb-4">
                    <Edit3 className="w-8 h-8" style={{ color: '#000000' }} />
                  </div>
                  <h3 className="text-2xl font-medium mb-3" style={{ color: '#000000' }}>Build Manually</h3>
                  <p className="mb-6 text-sm leading-relaxed" style={{ color: '#000000', opacity: 0.7 }}>
                    Create your lesson from scratch with complete control over every detail. Build it your way, section by section.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#000000' }}>
                    <Target className="w-5 h-5" />
                    Full Control
                    <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Tips */}
            <div className="max-w-4xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#000000' }}>Pro Tip</h4>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                    Start with AI generation to get a solid foundation, then switch to manual editing to refine the details. You can always enhance individual sections with AI later!
                  </p>
                </div>
              </div>
            </div>
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
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <p className="mb-4 text-sm leading-relaxed" style={{ color: '#000000', opacity: 0.7 }}>
                Describe the lesson you want to create in detail. Include the topic, key concepts, and what you want athletes to learn. The more specific you are, the better the AI can generate your lesson.
              </p>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Create a beginner baseball lesson about proper batting stance and swing mechanics. Include warm-up drills, step-by-step technique breakdown with key focus points, common mistakes to avoid, and practice exercises that athletes can do at home."
                rows={8}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 mb-6 text-sm"
                disabled={generating}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAIGenerate}
                  disabled={generating || !aiPrompt.trim()}
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

        {/* Manual Creation Form */}
        {creationMethod === 'manual' && (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-5 h-5 ${lesson.title && lesson.sport && lesson.level ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span style={{ color: '#000000', opacity: lesson.title && lesson.sport && lesson.level ? 1 : 0.5 }}>
                    Basic Info
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ opacity: 0.3 }} />
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-5 h-5 ${lesson.objectives.length > 0 ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span style={{ color: '#000000', opacity: lesson.objectives.length > 0 ? 1 : 0.5 }}>
                    Learning Goals
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ opacity: 0.3 }} />
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-5 h-5 ${lesson.sections.length > 0 ? 'text-green-500' : 'text-gray-300'}`}
                  />
                  <span style={{ color: '#000000', opacity: lesson.sections.length > 0 ? 1 : 0.5 }}>
                    Content
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-medium">
                    1
                  </div>
                  <div>
                    <h2 className="text-xl font-medium" style={{ color: '#000000' }}>
                      Basic Information
                    </h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Start with the essentials
                    </p>
                  </div>
                </div>
              </div>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Who can view this lesson?
                  </label>
                  <select
                    value={lesson.visibility}
                    onChange={(e) => setLesson(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="athletes_only">My Athletes Only</option>
                    <option value="public">Public (Anyone can view)</option>
                    <option value="specific_athletes">Specific Athletes (Choose later)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Learning Goals */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-medium">
                    2
                  </div>
                  <div>
                    <h2 className="text-xl font-medium" style={{ color: '#000000' }}>
                      Learning Goals
                    </h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      What will athletes learn?
                    </p>
                  </div>
                </div>
                <button
                  onClick={suggestObjectives}
                  disabled={generating || !lesson.sport || !lesson.level}
                  className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-4 h-4" />
                  AI Suggest
                </button>
              </div>

              <div className="space-y-4">
                {/* Objectives */}
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentObjective}
                      onChange={(e) => setCurrentObjective(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                      placeholder="Type an objective and press Enter (e.g., Master proper batting stance)"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                    <button
                      onClick={addObjective}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  {lesson.objectives.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <Target className="w-12 h-12 mx-auto mb-3" style={{ color: '#000000', opacity: 0.3 }} />
                      <p className="text-sm" style={{ color: '#000000', opacity: 0.5 }}>
                        No objectives yet. Add at least one learning objective.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lesson.objectives.map((obj, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-4 py-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-sm">{obj}</span>
                          </div>
                          <button onClick={() => removeObjective(idx)} className="hover:bg-red-100 rounded-full p-2 transition-colors">
                            <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Tags (Optional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tags for organization (e.g., pitching, mechanics)"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                    <button
                      onClick={addTag}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, idx) => (
                      <div key={idx} className="bg-teal/20 px-3 py-2 rounded-full flex items-center gap-2 border border-teal/30">
                        <span className="text-sm">{tag}</span>
                        <button onClick={() => removeTag(idx)} className="hover:bg-red-100 rounded-full p-1">
                          <Trash2 className="w-3 h-3" style={{ color: '#FF6B35' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Lesson Content */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-medium">
                    3
                  </div>
                  <div>
                    <h2 className="text-xl font-medium" style={{ color: '#000000' }}>
                      Lesson Content
                    </h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      Build your lesson section by section
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Type Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => addSection('text')}
                  className="group bg-gradient-to-br from-sky-blue/20 to-sky-blue/10 border-2 border-sky-blue/30 rounded-xl p-4 hover:from-sky-blue/30 hover:to-sky-blue/20 transition-all hover:scale-105"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                  <h3 className="text-sm font-medium mb-1" style={{ color: '#000000' }}>Text</h3>
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Instructions & explanations</p>
                </button>

                <button
                  onClick={() => addSection('video')}
                  className="group bg-gradient-to-br from-teal/20 to-teal/10 border-2 border-teal/30 rounded-xl p-4 hover:from-teal/30 hover:to-teal/20 transition-all hover:scale-105"
                >
                  <Video className="w-8 h-8 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                  <h3 className="text-sm font-medium mb-1" style={{ color: '#000000' }}>Video</h3>
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Demonstrations & tutorials</p>
                </button>

                <button
                  onClick={() => addSection('drill')}
                  className="group bg-gradient-to-br from-orange/20 to-orange/10 border-2 border-orange/30 rounded-xl p-4 hover:from-orange/30 hover:to-orange/20 transition-all hover:scale-105"
                >
                  <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                  <h3 className="text-sm font-medium mb-1" style={{ color: '#000000' }}>Drill</h3>
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Practice exercises</p>
                </button>

                <button
                  onClick={() => addSection('reflection')}
                  className="group bg-gradient-to-br from-black/10 to-black/5 border-2 border-black/20 rounded-xl p-4 hover:from-black/20 hover:to-black/10 transition-all hover:scale-105"
                >
                  <Lightbulb className="w-8 h-8 mx-auto mb-2" style={{ color: '#000000' }} />
                  <h3 className="text-sm font-medium mb-1" style={{ color: '#000000' }}>Reflection</h3>
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Questions & takeaways</p>
                </button>
              </div>

              {lesson.sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                  <p className="text-lg mb-2" style={{ color: '#000000', opacity: 0.5 }}>No content sections yet</p>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.4 }}>
                    Click a section type above to start building your lesson
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lesson.sections.map((section, idx) => (
                    <div key={section.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm px-3 py-1.5 bg-black text-white rounded-lg font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg capitalize font-medium">
                            {section.type}
                          </span>
                          <button
                            onClick={() => enhanceSection(section.id)}
                            disabled={generating || !lesson.sport || !lesson.level}
                            className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="Enhance with AI"
                          >
                            <Wand2 className="w-3 h-3" />
                            AI Enhance
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={idx === 0}
                            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={idx === lesson.sections.length - 1}
                            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(section.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete section"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                          </button>
                        </div>
                      </div>

                      {/* Section Title */}
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title (e.g., Warm-Up Drills, Proper Form Technique)"
                        className="w-full px-4 py-3 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium"
                      />

                      {/* Video Section */}
                      {section.type === 'video' && (
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                              value={section.videoSource || ''}
                              onChange={(e) => updateSection(section.id, { videoSource: e.target.value as any })}
                              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              <option value="">Video source...</option>
                              <option value="youtube">YouTube</option>
                              <option value="vimeo">Vimeo</option>
                              <option value="direct">Direct Upload</option>
                            </select>
                            <input
                              type="number"
                              value={section.duration || 0}
                              onChange={(e) => updateSection(section.id, { duration: parseInt(e.target.value) || 0 })}
                              placeholder="Duration (min)"
                              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          {section.videoSource && section.videoSource !== 'direct' && (
                            <input
                              type="url"
                              value={section.videoUrl || ''}
                              onChange={(e) => updateSection(section.id, { videoUrl: e.target.value })}
                              placeholder={`Paste ${section.videoSource} URL here`}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          )}
                          {section.videoSource === 'direct' && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.5 }} />
                              <p className="text-sm" style={{ opacity: 0.7 }}>Video upload coming soon</p>
                            </div>
                          )}
                          {renderVideoPreview(section)}
                        </div>
                      )}

                      {/* Content */}
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder={
                          section.type === 'text' ? 'Write detailed explanations, instructions, and key points athletes should know...' :
                          section.type === 'video' ? 'Describe what athletes will learn from this video. Add any important notes to watch for...' :
                          section.type === 'drill' ? 'Step-by-step instructions for the drill: setup, execution, key coaching points, and common mistakes...' :
                          'Add reflection questions or key takeaways. What should athletes think about? What did they learn?'
                        }
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !lesson.title || !lesson.sport || !lesson.level}
                className="flex-1 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-lg shadow-lg"
              >
                <Save className="w-6 h-6" />
                {saving ? 'Saving Lesson...' : 'Save Lesson'}
              </button>
              <button
                onClick={() => {
                  if (lesson.title || lesson.sections.length > 0) {
                    if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                      router.back()
                    }
                  } else {
                    router.back()
                  }
                }}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Quick Link to AI Generation */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowAIModal(true)
                }}
                className="text-sm text-purple-600 hover:text-purple-700 underline flex items-center gap-1 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                Want to start over with AI generation instead?
              </button>
            </div>
          </div>
        )}
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
