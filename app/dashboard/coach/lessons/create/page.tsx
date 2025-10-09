'use client'

import { useState } from 'react'
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
  Upload
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

export default function CreateLessonPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

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
      const response = await fetch('/api/coach/lessons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lesson,
          coachId: user?.uid,
          coachName: user?.displayName || 'Unknown Coach'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lesson')
      }

      const data = await response.json()
      alert('Lesson created successfully!')

      // Redirect to lesson library
      if (embedded) {
        router.push('/dashboard/coach/lessons/library?embedded=true')
      } else {
        router.push('/dashboard/coach/lessons/library')
      }
    } catch (error: any) {
      console.error('Error creating lesson:', error)
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

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Create Lesson" subtitle="Build comprehensive training content for your athletes" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Create Lesson</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Build comprehensive training content for your athletes
            </p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <h2 className="text-xl font-heading mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
            <FileText className="w-5 h-5" />
            Basic Information
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                Lesson Title *
              </label>
              <input
                type="text"
                value={lesson.title}
                onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Advanced Pitching Mechanics"
                className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Sport and Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Sport *
                </label>
                <select
                  value={lesson.sport}
                  onChange={(e) => setLesson(prev => ({ ...prev, sport: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select sport...</option>
                  <option value="baseball">Baseball</option>
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="soccer">Soccer</option>
                  <option value="softball">Softball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Skill Level *
                </label>
                <select
                  value={lesson.level}
                  onChange={(e) => setLesson(prev => ({ ...prev, level: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={lesson.duration}
                  onChange={(e) => setLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  min="5"
                  max="240"
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                Learning Objectives
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  placeholder="Add an objective and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={addObjective}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.objectives.map((obj, idx) => (
                  <div key={idx} className="bg-sky-blue/10 px-3 py-1 rounded-full flex items-center gap-2" style={{ borderColor: '#91A6EB', border: '1px solid' }}>
                    <span className="text-sm">{obj}</span>
                    <button onClick={() => removeObjective(idx)} className="hover:bg-red-100 rounded-full p-1">
                      <Trash2 className="w-3 h-3" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags for organization (e.g., pitching, mechanics)"
                  className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((tag, idx) => (
                  <div key={idx} className="bg-teal/10 px-3 py-1 rounded-full flex items-center gap-2" style={{ borderColor: '#20B2AA', border: '1px solid' }}>
                    <span className="text-sm">{tag}</span>
                    <button onClick={() => removeTag(idx)} className="hover:bg-red-100 rounded-full p-1">
                      <Trash2 className="w-3 h-3" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                Visibility
              </label>
              <select
                value={lesson.visibility}
                onChange={(e) => setLesson(prev => ({ ...prev, visibility: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="athletes_only">My Athletes Only</option>
                <option value="public">Public (Anyone can view)</option>
                <option value="specific_athletes">Specific Athletes (Choose later)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lesson Sections */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading flex items-center gap-2" style={{ color: '#000000' }}>
              <Video className="w-5 h-5" />
              Lesson Sections
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => addSection('text')}
                className="px-3 py-1 text-sm bg-sky-blue/20 rounded-lg hover:bg-sky-blue/30 transition-colors"
                style={{ color: '#000000' }}
              >
                + Text
              </button>
              <button
                onClick={() => addSection('video')}
                className="px-3 py-1 text-sm bg-teal/20 rounded-lg hover:bg-teal/30 transition-colors"
                style={{ color: '#000000' }}
              >
                + Video
              </button>
              <button
                onClick={() => addSection('drill')}
                className="px-3 py-1 text-sm bg-orange/20 rounded-lg hover:bg-orange/30 transition-colors"
                style={{ color: '#000000' }}
              >
                + Drill
              </button>
              <button
                onClick={() => addSection('reflection')}
                className="px-3 py-1 text-sm bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
                style={{ color: '#000000' }}
              >
                + Reflection
              </button>
            </div>
          </div>

          {lesson.sections.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#000000', opacity: 0.5 }}>
              <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ opacity: 0.3 }} />
              <p className="text-lg">No sections yet. Add sections to build your lesson.</p>
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
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || !lesson.title || !lesson.sport || !lesson.level}
            className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Lesson'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  )
}
