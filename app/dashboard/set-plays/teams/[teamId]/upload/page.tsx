'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { ArrowLeft, Upload, X, Loader2, Video, Image, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Team, PlayCreateInput, PlayMedia } from '@/types/set-plays'
import { uploadService } from '@/lib/upload-service'

export default function UploadPlayPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const teamId = params.teamId as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] = useState<'coach' | 'assistant' | 'team'>('team')
  const [media, setMedia] = useState<PlayMedia[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user && teamId) {
      fetchTeam()
    }
  }, [user, teamId])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()
      if (!token) throw new Error('No auth token available')

      const response = await fetch(`/api/set-plays/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setTeam(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch team')
      }
    } catch (err: any) {
      console.error('Error fetching team:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = `${Date.now()}-${i}`

      try {
        setUploadingFiles(prev => new Set(prev).add(fileId))

        // Determine media type
        let mediaType: 'video' | 'image' | 'pdf' | 'diagram' = 'image'
        if (file.type.startsWith('video/')) {
          mediaType = 'video'
        } else if (file.type === 'application/pdf') {
          mediaType = 'pdf'
        } else if (file.type.startsWith('image/')) {
          mediaType = file.name.toLowerCase().includes('diagram') ? 'diagram' : 'image'
        }

        // Upload to Firebase Storage
        const uploadPath = `teams/${teamId}/plays/${Date.now()}-${file.name}`

        let downloadURL: string = ''

        await uploadService.startUpload({
          file,
          path: uploadPath,
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`)
          },
          onStateChange: (state) => {
            if (state === 'paused') {
              console.log('Upload paused')
            }
          },
          onSuccess: (url) => {
            downloadURL = url
          }
        })

        // Add to media array
        const newMedia: PlayMedia = {
          type: mediaType,
          url: downloadURL,
          thumbnailUrl: downloadURL, // For images/videos, use the same URL as thumbnail
          size: file.size,
          mimeType: file.type
        }

        setMedia(prev => [...prev, newMedia])
        setUploadingFiles(prev => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })

      } catch (err) {
        console.error('Upload failed:', err)
        setUploadingFiles(prev => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })
        alert(`Failed to upload ${file.name}`)
      }
    }

    // Reset file input
    e.target.value = ''
  }

  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Please enter a play title')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const token = await user?.getIdToken()
      if (!token) throw new Error('No auth token available')

      const playData: PlayCreateInput = {
        teamId,
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim(),
        tags,
        visibility,
        media
      }

      const response = await fetch(`/api/set-plays/teams/${teamId}/plays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playData)
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Play created successfully:', data.data)
        router.push(`/dashboard/set-plays/teams/${teamId}`)
      } else {
        throw new Error(data.error || 'Failed to create play')
      }
    } catch (err: any) {
      console.error('Error creating play:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader title="Loading..." subtitle="Please wait" />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#20B2AA' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader
        title={`Upload Play • ${team?.name}`}
        subtitle="Add a new play to your playbook"
      />

      <main className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Back Button */}
        <Link href={`/dashboard/set-plays/teams/${teamId}`}>
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Play Library</span>
          </button>
        </Link>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Play Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Corner Kick Formation A"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the play..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Coaching Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes for coaches..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-[#20B2AA] text-white rounded-lg hover:bg-[#1a9891] transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1 bg-[#20B2AA]/10 text-[#20B2AA] rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Who can view this play?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="team"
                  checked={visibility === 'team'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-4 h-4 text-[#20B2AA] focus:ring-[#20B2AA]"
                />
                <span>Whole Team (coaches, assistants, and athletes)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="assistant"
                  checked={visibility === 'assistant'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-4 h-4 text-[#20B2AA] focus:ring-[#20B2AA]"
                />
                <span>Coaches & Assistants Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="coach"
                  checked={visibility === 'coach'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-4 h-4 text-[#20B2AA] focus:ring-[#20B2AA]"
                />
                <span>Coach Only</span>
              </label>
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Media (Videos, Images, PDFs)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="video/*,image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  Videos, images, or PDF files
                </span>
              </label>
            </div>

            {/* Uploading Files */}
            {uploadingFiles.size > 0 && (
              <div className="mt-4 space-y-2">
                {Array.from(uploadingFiles).map(fileId => (
                  <div key={fileId} className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Media Preview */}
            {media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {media.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.type === 'video' && <Video className="w-8 h-8 text-gray-400" />}
                      {(item.type === 'image' || item.type === 'diagram') && (
                        item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-8 h-8 text-gray-400" />
                        )
                      )}
                      {item.type === 'pdf' && <FileText className="w-8 h-8 text-gray-400" />}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || uploadingFiles.size > 0}
              className="flex-1 flex items-center justify-center gap-2 bg-[#20B2AA] hover:bg-[#1a9891] text-white px-6 py-3 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Play...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Create Play</span>
                </>
              )}
            </button>
            <Link href={`/dashboard/set-plays/teams/${teamId}`}>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
