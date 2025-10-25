'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Video, Clock, Trash2, ArrowLeft } from 'lucide-react'

export default function AthleteReviewsPageV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'
  const { user, loading: authLoading } = useAuth()
  
  // State - ALL declared at top level
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Fetch submissions - BULLETPROOF version with no early returns
  useEffect(() => {
    // Declare ALL variables at the top
    let mounted = true
    let abortController: AbortController | null = null

    const fetchData = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          console.log('[REVIEWS-V4] Waiting for auth...')
          return
        }

        // Handle no user case
        if (!user) {
          console.log('[REVIEWS-V4] No user, redirecting to login')
          router.push('/login')
          return
        }

        console.log('[REVIEWS-V4] Fetching submissions...')

        // Create abort controller
        abortController = new AbortController()

        const token = await user.getIdToken()
        const response = await fetch(`/api/submissions?athleteUid=${user.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        })

        if (!mounted) return

        if (response.ok) {
          const data = await response.json()
          console.log('[REVIEWS-V4] Got submissions:', data.submissions?.length || 0)
          setSubmissions(data.submissions || [])
        } else {
          setError('Failed to load submissions')
        }
      } catch (err: any) {
        if (!mounted) return
        if (err.name === 'AbortError') {
          console.log('[REVIEWS-V4] Request aborted')
          return
        }
        console.error('[REVIEWS-V4] Fetch error:', err)
        setError('Failed to load submissions')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup - ALWAYS return this
    return () => {
      mounted = false
      if (abortController) {
        abortController.abort()
      }
    }
  }, [user, authLoading, router])

  // Handle delete submission
  const handleDelete = async (submissionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return
    
    setDeletingId(submissionId)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/submissions/${submissionId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove from local state
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
        setShowDeleteConfirm(null)
        console.log('[REVIEWS-V3] Submission deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('[REVIEWS-V3] Delete error:', err)
      alert('Failed to delete submission')
    } finally {
      setDeletingId(null)
    }
  }

  // Redirect if no user (but not if embedded)
  if (!user && !isEmbedded) {
    router.push('/login')
    return null
  }

  if (authLoading || isLoading) {
    return (
      <div className={isEmbedded ? "w-full h-full" : "container mx-auto px-4 py-8"}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={isEmbedded ? "w-full h-full" : "container mx-auto px-4 py-8"}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={isEmbedded ? "w-full h-full" : "container mx-auto px-4 py-8"}>
      <div className={isEmbedded ? "w-full h-full" : "max-w-6xl mx-auto"}>
        {/* Header - hide back button when embedded */}
        <div className="mb-8">
          {!isEmbedded && (
            <Link
              href="/dashboard/athlete"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          )}
          <h1 className="text-3xl font-bold text-gray-900">My Video Reviews</h1>
          <p className="mt-2 text-gray-600">
            Track your submitted videos and coach feedback
          </p>
        </div>

        {/* Submit Video Button */}
        <div className="mb-6">
          <Link
            href="/dashboard/athlete/get-feedback"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Video className="w-5 h-5 mr-2" />
            Submit New Video
          </Link>
        </div>

        {/* Empty state */}
        {submissions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No video submissions yet
            </h3>
            <p className="text-gray-600 mb-6">
              Submit your first video to get personalized feedback from your coach
            </p>
            <Link
              href="/dashboard/athlete/get-feedback"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Submit Video
            </Link>
          </div>
        )}

        {/* Submissions grid - smaller compact cards */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {submissions.map((submission: any) => {
              const isDeletable = ['pending', 'draft', 'awaiting_coach', 'complete'].includes(submission.status)
              console.log(`[REVIEWS-V3] Submission: status=${submission.status}, isDeletable=${isDeletable}`)
              return (
                <div
                  key={submission.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group"
                >
                  <Link
                    href={isEmbedded ? `/dashboard/athlete/reviews/${submission.id}?embedded=true` : `/dashboard/athlete/reviews/${submission.id}`}
                    className="block cursor-pointer"
                  >
                    {/* Smaller Thumbnail */}
                    <div className="aspect-video bg-gray-100 relative">
                      {submission.thumbnailUrl ? (
                        <img
                          src={submission.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {e.currentTarget.style.display = 'none'}}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Status badge overlay */}
                      <div className="absolute top-1 left-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium shadow-sm ${
                          submission.status === 'complete' ? 'bg-green-500 text-white' :
                          submission.status === 'in_review' || submission.status === 'claimed' ? 'bg-blue-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {submission.status === 'complete' ? '✓' :
                           submission.status === 'in_review' || submission.status === 'claimed' ? '⏳' :
                           '⏱'}
                        </span>
                      </div>
                    </div>

                    {/* Compact Content */}
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1 text-sm">
                        {submission.skillName || submission.videoFileName || 'Video Submission'}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.createdAt || Date.now()).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </Link>

                  {/* Delete button - always visible for debugging */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log(`[REVIEWS-V3] Delete clicked, isDeletable: ${isDeletable}`)
                      if (isDeletable) {
                        setShowDeleteConfirm(submission.id)
                      } else {
                        alert(`Cannot delete submission in status: ${submission.status}`)
                      }
                    }}
                    className={`absolute top-1 right-1 p-1.5 rounded-md transition-all shadow-sm z-10 ${
                      isDeletable 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                    disabled={deletingId === submission.id}
                    title={isDeletable ? "Delete submission" : `Cannot delete (status: ${submission.status})`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Delete confirmation modal */}
                  {showDeleteConfirm === submission.id && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Submission?</h2>
                        <p className="text-gray-600 mb-6">
                          This will permanently delete <strong>{submission.skillName || 'this video'}</strong> and all associated data. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowDeleteConfirm(null)
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={deletingId === submission.id}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => handleDelete(submission.id, e)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={deletingId === submission.id}
                          >
                            {deletingId === submission.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}