'use client'

import { useState, useEffect } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import {
  GraduationCap,
  Video,
  FileText,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Link as LinkIcon,
  Upload,
  ArrowLeft
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

export default function EditLessonPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'
  const lessonId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentObjective, setCurrentObjective] = useState('')
  const [currentTag, setCurrentTag] = useState('')

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

  // Load lesson data
  useEffect(() => {
    if (user && lessonId) {
      loadLesson()
    }
  }, [user, lessonId])

  const loadLesson = async () => {
    setLoading(true)
    try {
      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch(`/api/coach/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load lesson')
      }

      const data = await response.json()
      const lessonData = data.lesson

      setLesson({
        title: lessonData.title || '',
        sport: lessonData.sport || '',
        level: lessonData.level || '',
        duration: lessonData.duration || 60,
        objectives: lessonData.objectives || [],
        sections: lessonData.sections || [],
        tags: lessonData.tags || [],
        visibility: lessonData.visibility || 'athletes_only'
      })
    } catch (error) {
      console.error('Error loading lesson:', error)
      alert('Failed to load lesson')
      router.back()
    } finally {
      setLoading(false)
    }
  }

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

  // Save lesson
  const handleSave = async () => {
    if (!lesson.title || !lesson.sport || !lesson.level) {
      alert('Please fill in all required fields (Title, Sport, Level)')
      return
    }

    setSaving(true)
    try {
      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch(`/api/coach/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lesson)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update lesson')
      }

      alert('Lesson updated successfully!')

      // Redirect to lesson library
      if (embedded) {
        router.push('/dashboard/coach/lessons/library?embedded=true')
      } else {
        router.push('/dashboard/coach/lessons/library')
      }
    } catch (error: any) {
      console.error('Error updating lesson:', error)
      alert(`Error: ${error.message}`)
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

  if (loading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
        {!embedded && <AppHeader title="Edit Lesson" subtitle="Update your training content" />}
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Edit Lesson" subtitle="Update your training content" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Edit Lesson</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Update your training content
            </p>
          </div>
        )}

        {/* Step 1: Lesson Details */}
        <div className="bg-white rounded-xl border-2 border-black p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">1</div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Lesson Details
              </h2>
              <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Basic information about your lesson
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Lesson Title <span style={{ color: '#FC0105' }}>*</span>
              </label>
              <input
                type="text"
                value={lesson.title}
                onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Ankle Locks Fundamentals"
                className="w-full px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              />
            </div>

            {/* Sport, Level, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  Sport <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <select
                  value={lesson.sport}
                  onChange={(e) => setLesson(prev => ({ ...prev, sport: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                >
                  <option value="">Select sport...</option>
                  <option value="BJJ">Brazilian Jiu-Jitsu</option>
                  <option value="MMA">Mixed Martial Arts</option>
                  <option value="Boxing">Boxing</option>
                  <option value="Wrestling">Wrestling</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  Skill Level <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <select
                  value={lesson.level}
                  onChange={(e) => setLesson(prev => ({ ...prev, level: e.target.value as any }))}
                  className="w-full px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                >
                  <option value="">Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lesson.duration}
                    onChange={(e) => setLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="5"
                    max="240"
                    className="flex-1 px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                  />
                  <span className="text-sm font-bold" style={{ color: '#666' }}>min</span>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Who can see this lesson?
              </label>
              <select
                value={lesson.visibility}
                onChange={(e) => setLesson(prev => ({ ...prev, visibility: e.target.value as any }))}
                className="w-full px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              >
                <option value="athletes_only">My Athletes Only</option>
                <option value="specific_athletes">Specific Athletes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Learning Goals */}
        <div className="bg-white rounded-xl border-2 border-black p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">2</div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Learning Goals
              </h2>
              <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                What will athletes learn from this lesson?
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Objectives */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Learning Objectives
              </label>
              <p className="text-xs mb-3" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Add specific skills or knowledge athletes will gain
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  placeholder="e.g., Master proper ankle lock positioning"
                  className="flex-1 px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                />
                <button
                  onClick={addObjective}
                  className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-bold"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.objectives.map((obj, idx) => (
                  <div key={idx} className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-gray-100 border-2 border-gray-300">
                    <span className="text-sm font-semibold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>{obj}</span>
                    <button onClick={() => removeObjective(idx)} className="hover:bg-red-100 rounded-full p-1">
                      <Trash2 className="w-3 h-3" style={{ color: '#FC0105' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Tags (Optional)
              </label>
              <p className="text-xs mb-3" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Help organize and categorize this lesson
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g., submissions, fundamentals"
                  className="flex-1 px-4 py-2.5 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-bold"
                  style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((tag, idx) => (
                  <div key={idx} className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-gray-100 border-2 border-gray-300">
                    <span className="text-sm font-semibold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>{tag}</span>
                    <button onClick={() => removeTag(idx)} className="hover:bg-red-100 rounded-full p-1">
                      <Trash2 className="w-3 h-3" style={{ color: '#FC0105' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Lesson Content */}
        <div className="bg-white rounded-xl border-2 border-black p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">3</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Lesson Content
              </h2>
              <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Build your lesson with text, videos, drills, and reflections
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addSection('text')}
                className="px-4 py-2 text-xs font-bold rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              >
                + Text
              </button>
              <button
                onClick={() => addSection('video')}
                className="px-4 py-2 text-xs font-bold rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              >
                + Video
              </button>
              <button
                onClick={() => addSection('drill')}
                className="px-4 py-2 text-xs font-bold rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              >
                + Drill
              </button>
              <button
                onClick={() => addSection('reflection')}
                className="px-4 py-2 text-xs font-bold rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              >
                + Reflection
              </button>
            </div>
          </div>

          {lesson.sections.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: '#666', opacity: 0.3 }} />
              <p className="text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                No content yet
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                Click the buttons above to start building your lesson
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lesson.sections.map((section, idx) => (
                <div key={section.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold px-2 py-1 bg-black text-white rounded">
                        {idx + 1}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                        {section.type}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={idx === lesson.sections.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1 hover:bg-red-100 rounded"
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
                    placeholder="Section title (e.g., Warm-Up Drills)"
                    className="w-full px-3 py-2 mb-3 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-semibold"
                  />

                  {/* Video Section */}
                  {section.type === 'video' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          value={section.videoSource || ''}
                          onChange={(e) => updateSection(section.id, { videoSource: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                          className="px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      {section.videoSource && section.videoSource !== 'direct' && (
                        <input
                          type="url"
                          value={section.videoUrl || ''}
                          onChange={(e) => updateSection(section.id, { videoUrl: e.target.value })}
                          placeholder={`Paste ${section.videoSource} URL here`}
                          className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      )}
                      {section.videoSource === 'direct' && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.5 }} />
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
                      section.type === 'text' ? 'Detailed explanation and instructions...' :
                      section.type === 'video' ? 'Description of what athletes will learn from this video...' :
                      section.type === 'drill' ? 'Step-by-step drill instructions...' :
                      'Reflection questions or key takeaways...'
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
            className="flex-1 px-6 py-3.5 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: '\"Open Sans\", sans-serif' }}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3.5 bg-white border-2 border-black text-black rounded-lg font-bold hover:bg-gray-50 transition-colors"
            style={{ fontFamily: '\"Open Sans\", sans-serif' }}
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  )
}
