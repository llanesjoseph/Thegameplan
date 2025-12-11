'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Video, Clock, User, ChevronRight, AlertCircle } from 'lucide-react'

interface VideoSubmission {
  id: string
  athleteId: string
  athleteName: string
  athleteEmail?: string
  videoUrl: string
  thumbnailUrl?: string
  title?: string
  description?: string
  status: string
  createdAt: string
  submittedAt?: string
}

export default function CoachQueuePage() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === 'true'
  const athleteId = searchParams.get('athleteId')

  const [submissions, setSubmissions] = useState<VideoSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!user || authLoading) return

      try {
        setLoading(true)
        setError(null)

        const token = await user.getIdToken()
        const response = await fetch('/api/coach/submissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load submissions')
        }

        const data = await response.json()

        if (data.success) {
          // Get submissions awaiting coach review
          let pending = data.awaitingCoach || []

          // Filter by athleteId if provided (when embedded in athlete roster modal)
          if (athleteId) {
            pending = pending.filter((sub: VideoSubmission) => sub.athleteId === athleteId)
            console.log(`[Coach Queue] Filtered to ${pending.length} submissions for athlete ${athleteId}`)
          }

          setSubmissions(pending)
          console.log(`[Coach Queue] Loaded ${pending.length} pending submissions`)
        } else {
          throw new Error(data.error || 'Failed to load submissions')
        }
      } catch (err: any) {
        console.error('Error loading submissions:', err)
        setError(err.message || 'Failed to load video submissions')
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [user, authLoading, athleteId])

  // Show loading spinner
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>Loading video queue...</p>
        </div>
      </div>
    )
  }

  // Check access using role attached to the authenticated user
  const appRole = (user as any)?.role as string | undefined
  const isCoachLikeRole = appRole === 'coach' || appRole === 'creator' || appRole === 'admin' || appRole === 'superadmin'

  if (!user || !isCoachLikeRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center border rounded-xl p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FC0105' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Access Denied</h1>
          <p className="mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>This area is for coaches only.</p>
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 inline-block" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Hide when embedded */}
      {!isEmbedded && (
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Video Review Queue
              </h1>
              <Link
                href="/dashboard/coach"
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-bold"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                Back to Dashboard
              </Link>
            </div>
            <p style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              Review and provide feedback on athlete video submissions
            </p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={isEmbedded ? "px-4 py-4" : "px-4 sm:px-6 lg:px-8 py-8"}>
        <div className={isEmbedded ? "w-full" : "max-w-6xl mx-auto"}>
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6" style={{ color: '#FC0105' }} />
                <div>
                  <h3 className="font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Error Loading Queue</h3>
                  <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Queue Stats */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
                  {submissions.length}
                </h2>
                <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Videos Awaiting Review
                </p>
              </div>
              <Video className="w-12 h-12" style={{ color: '#FC0105', opacity: 0.5 }} />
            </div>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Video className="w-20 h-20 mx-auto mb-4" style={{ color: '#666', opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                No Videos Awaiting Review
              </h3>
              <p className="text-sm mb-6" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                All caught up! Check back later for new submissions.
              </p>
              <Link
                href="/dashboard/coach"
                className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors inline-block font-bold"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/dashboard/coach/review/${submission.id}`}
                  className="block bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-all hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Athlete Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-5 h-5" style={{ color: '#000000' }} />
                        <h3 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {submission.athleteName || 'Unknown Athlete'}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontFamily: '"Open Sans", sans-serif'
                          }}
                        >
                          PENDING REVIEW
                        </span>
                      </div>

                      {/* Submission Details */}
                      {submission.title && (
                        <p className="text-base font-semibold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {submission.title}
                        </p>
                      )}
                      {submission.description && (
                        <p className="text-sm mb-3" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          {submission.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Submitted {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0 ml-4">
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" style={{ color: '#000000' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
