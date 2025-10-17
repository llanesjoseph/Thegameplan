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
  BookOpen,
  Users,
  User as UserIcon,
  X
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
  const [aiTopic, setAiTopic] = useState('')
  const [aiSport, setAiSport] = useState('')
  const [aiLevel, setAiLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('')
  const [currentObjective, setCurrentObjective] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [showContentSuggestionsModal, setShowContentSuggestionsModal] = useState(false)
  const [contentSuggestions, setContentSuggestions] = useState<any>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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

  // Browse existing content suggestions
  const browseExistingContent = async () => {
    if (!lesson.sport) {
      alert('Please select a sport first')
      return
    }

    if (!user) {
      alert('Please log in to browse content')
      return
    }

    setLoadingSuggestions(true)
    setShowContentSuggestionsModal(true)

    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/suggest-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sport: lesson.sport,
          topic: lesson.title || 'training',
          level: lesson.level || 'intermediate',
          contentType: undefined // Get all types
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch content suggestions')
      }

      const data = await response.json()
      setContentSuggestions(data.suggestions)
    } catch (error: any) {
      console.error('Error fetching content suggestions:', error)
      alert(error instanceof Error ? error.message : 'Failed to fetch content suggestions')
      setShowContentSuggestionsModal(false)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Insert suggested content as a new section
  const insertSuggestedContent = (suggestion: any) => {
    const newSection: LessonSection = {
      id: `section-${Date.now()}`,
      title: suggestion.title || '',
      type: suggestion.type || 'text',
      content: suggestion.content || '',
      order: lesson.sections.length,
      duration: suggestion.duration || 0,
      videoUrl: suggestion.videoUrl,
      videoSource: suggestion.videoSource
    }

    setLesson(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))

    setShowContentSuggestionsModal(false)
    alert('Content added to your lesson!')
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

      const token = await user.getIdToken()

      const response = await fetch('/api/coach/lessons/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lesson)
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

        {/* Content Suggestions Modal */}
        {showContentSuggestionsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-medium" style={{ color: '#000000' }}>Browse Existing Content</h2>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      {lesson.sport ? `${lesson.sport.charAt(0).toUpperCase() + lesson.sport.slice(1)} training content` : 'Training content'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContentSuggestionsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loadingSuggestions}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                  <p style={{ color: '#000000', opacity: 0.7 }}>Searching for relevant content...</p>
                </div>
              ) : contentSuggestions ? (
                <div className="space-y-6">
                  {/* My Content Section */}
                  {contentSuggestions.myContent && contentSuggestions.myContent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                          Your Previous Content ({contentSuggestions.myContent.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {contentSuggestions.myContent.map((item: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full font-medium capitalize">
                                    {item.type}
                                  </span>
                                  {item.source === 'previous_lesson' && (
                                    <span className="text-xs text-blue-600">From: {item.lessonTitle}</span>
                                  )}
                                </div>
                                <h4 className="font-medium mb-1" style={{ color: '#000000' }}>{item.title}</h4>
                                <p className="text-sm line-clamp-2" style={{ color: '#000000', opacity: 0.7 }}>
                                  {item.content?.substring(0, 150)}...
                                </p>
                              </div>
                              <button
                                onClick={() => insertSuggestedContent(item)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                Insert
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Content Section */}
                  {contentSuggestions.platformContent && contentSuggestions.platformContent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                          From Other Coaches ({contentSuggestions.platformContent.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {contentSuggestions.platformContent.map((item: any, idx: number) => (
                          <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full font-medium capitalize">
                                    {item.type}
                                  </span>
                                  <span className="text-xs text-purple-600">By: {item.creatorName}</span>
                                </div>
                                <h4 className="font-medium mb-1" style={{ color: '#000000' }}>{item.title}</h4>
                                <p className="text-sm line-clamp-2" style={{ color: '#000000', opacity: 0.7 }}>
                                  {item.content?.substring(0, 150)}...
                                </p>
                              </div>
                              <button
                                onClick={() => insertSuggestedContent(item)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                Insert
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Generated Suggestions */}
                  {contentSuggestions.aiGenerated && contentSuggestions.aiGenerated.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                          AI Suggestions ({contentSuggestions.aiGenerated.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {contentSuggestions.aiGenerated.map((item: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 hover:from-purple-100 hover:to-blue-100 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full font-medium capitalize">
                                    {item.type}
                                  </span>
                                  <span className="text-xs text-purple-600">AI Generated</span>
                                </div>
                                <h4 className="font-medium mb-1" style={{ color: '#000000' }}>{item.title}</h4>
                                <p className="text-sm line-clamp-2" style={{ color: '#000000', opacity: 0.7 }}>
                                  {item.content?.substring(0, 150)}...
                                </p>
                              </div>
                              <button
                                onClick={() => insertSuggestedContent(item)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                              >
                                Insert
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External Resources */}
                  {contentSuggestions.externalLinks && contentSuggestions.externalLinks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <LinkIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: '#000000' }}>
                          External Resources ({contentSuggestions.externalLinks.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {contentSuggestions.externalLinks.map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors block"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-medium mb-1 flex items-center gap-2" style={{ color: '#000000' }}>
                                  {link.title}
                                  <ChevronRight className="w-4 h-4" />
                                </h4>
                                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                                  {link.description}
                                </p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!contentSuggestions.myContent || contentSuggestions.myContent.length === 0) &&
                   (!contentSuggestions.platformContent || contentSuggestions.platformContent.length === 0) &&
                   (!contentSuggestions.aiGenerated || contentSuggestions.aiGenerated.length === 0) &&
                   (!contentSuggestions.externalLinks || contentSuggestions.externalLinks.length === 0) && (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                      <p className="text-lg mb-2" style={{ color: '#000000', opacity: 0.5 }}>No content found</p>
                      <p className="text-sm" style={{ color: '#000000', opacity: 0.4 }}>
                        Try creating content manually or use AI generation
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
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
                      <option value="public">Public</option>
                      <option value="specific_athletes">Specific Athletes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium" style={{ color: '#000000' }}>
                  Learning Objectives
                </h2>
                <button
                  onClick={suggestObjectives}
                  disabled={generating || !lesson.sport || !lesson.level}
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-4 h-4" />
                  AI Suggest
                </button>
              </div>

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

            {/* Lesson Content */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <h2 className="text-xl font-medium mb-4" style={{ color: '#000000' }}>
                Lesson Content
              </h2>

              {/* Browse Existing Content Button */}
              <button
                onClick={browseExistingContent}
                disabled={!lesson.sport}
                className="w-full mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
              >
                <BookOpen className="w-6 h-6" />
                <div className="text-left flex-1">
                  <h3 className="font-medium text-base">Browse Existing Content</h3>
                  <p className="text-xs text-white/80">Use previous lessons or get AI suggestions</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Section Type Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => addSection('text')}
                  className="bg-gradient-to-br from-sky-blue/20 to-sky-blue/10 border-2 border-sky-blue/30 rounded-xl p-4 hover:from-sky-blue/30 hover:to-sky-blue/20 transition-all hover:scale-105"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                  <h3 className="text-sm font-medium" style={{ color: '#000000' }}>Text</h3>
                </button>

                <button
                  onClick={() => addSection('video')}
                  className="bg-gradient-to-br from-teal/20 to-teal/10 border-2 border-teal/30 rounded-xl p-4 hover:from-teal/30 hover:to-teal/20 transition-all hover:scale-105"
                >
                  <Video className="w-8 h-8 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                  <h3 className="text-sm font-medium" style={{ color: '#000000' }}>Video</h3>
                </button>

                <button
                  onClick={() => addSection('drill')}
                  className="bg-gradient-to-br from-orange/20 to-orange/10 border-2 border-orange/30 rounded-xl p-4 hover:from-orange/30 hover:to-orange/20 transition-all hover:scale-105"
                >
                  <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                  <h3 className="text-sm font-medium" style={{ color: '#000000' }}>Drill</h3>
                </button>

                <button
                  onClick={() => addSection('reflection')}
                  className="bg-gradient-to-br from-black/10 to-black/5 border-2 border-black/20 rounded-xl p-4 hover:from-black/20 hover:to-black/10 transition-all hover:scale-105"
                >
                  <Lightbulb className="w-8 h-8 mx-auto mb-2" style={{ color: '#000000' }} />
                  <h3 className="text-sm font-medium" style={{ color: '#000000' }}>Reflection</h3>
                </button>
              </div>

              {/* Sections List */}
              {lesson.sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                  <p className="text-lg mb-2" style={{ color: '#000000', opacity: 0.5 }}>No content sections yet</p>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.4 }}>
                    Click a section type above to start building
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
                            AI
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={idx === 0}
                            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={idx === lesson.sections.length - 1}
                            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(section.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Section Title */}
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title"
                        className="w-full px-4 py-3 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium"
                      />

                      {/* Video Section */}
                      {section.type === 'video' && (
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={section.videoSource || ''}
                              onChange={(e) => updateSection(section.id, { videoSource: e.target.value as any })}
                              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              <option value="">Video source...</option>
                              <option value="youtube">YouTube</option>
                              <option value="vimeo">Vimeo</option>
                            </select>
                            <input
                              type="number"
                              value={section.duration || 0}
                              onChange={(e) => updateSection(section.id, { duration: parseInt(e.target.value) || 0 })}
                              placeholder="Duration (min)"
                              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          {section.videoSource && (
                            <input
                              type="url"
                              value={section.videoUrl || ''}
                              onChange={(e) => updateSection(section.id, { videoUrl: e.target.value })}
                              placeholder={`Paste ${section.videoSource} URL`}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          )}
                          {renderVideoPreview(section)}
                        </div>
                      )}

                      {/* Content */}
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder={
                          section.type === 'text' ? 'Write detailed explanations and instructions...' :
                          section.type === 'video' ? 'Describe what athletes will learn from this video...' :
                          section.type === 'drill' ? 'Step-by-step drill instructions...' :
                          'Reflection questions or key takeaways...'
                        }
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving || !lesson.title || !lesson.sport || !lesson.level}
                className="flex-1 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-lg shadow-lg"
              >
                <Save className="w-6 h-6" />
                {saving ? 'Saving...' : 'Save Lesson'}
              </button>
              <button
                onClick={() => {
                  if (lesson.title || lesson.sections.length > 0) {
                    if (confirm('Are you sure? Your changes will be lost.')) {
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

                  {/* Sections Preview */}
                  {lesson.sections.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium" style={{ color: '#000000' }}>Lesson Content</h4>
                      {lesson.sections.map((section, idx) => (
                        <div key={section.id} className="border-l-4 border-gray-300 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                              {section.type}
                            </span>
                          </div>
                          {section.title && (
                            <h5 className="font-medium mb-2" style={{ color: '#000000' }}>
                              {section.title}
                            </h5>
                          )}
                          {section.content && (
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#000000', opacity: 0.7 }}>
                              {section.content.length > 200 ? `${section.content.substring(0, 200)}...` : section.content}
                            </p>
                          )}
                          {section.type === 'video' && section.videoUrl && (
                            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video embedded
                            </div>
                          )}
                        </div>
                      ))}
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
