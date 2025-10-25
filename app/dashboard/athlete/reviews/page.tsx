'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Video, Clock, Trash2, ArrowLeft } from 'lucide-react'

export default function AthleteReviewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'
  const { user, loading: authLoading } = useAuth()

  // ALL state declared at top level - NO CONDITIONALS
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // ABSOLUTELY BULLETPROOF useEffect - no early returns, no conditionals
  useEffect(() => {
    // Declare ALL variables at the very top
    let isMounted = true
    let abortController: AbortController | null = null

    // Only execute if we have the required dependencies
    if (!isMounted) return

    const fetchData = async () => {
      try {
        // Check auth loading state
        if (authLoading) {
          console.log('Auth still loading...')
          if (isMounted) {
            setIsLoading(true)
            setError(null)
          }
          return
        }

        // Check user authentication
        if (!user) {
          if (!isEmbedded) {
            console.log('No user found, redirecting to login')
            if (isMounted) {
              router.push('/login')
              setError(null)
            }
          } else {
            console.log('No user found in embedded mode')
            if (isMounted) {
              setIsLoading(false)
              setError(null)
            }
          }
          return
        }

        console.log('Fetching submissions for athlete...')

        // Create abort controller
        abortController = new AbortController()
        if (!isMounted) return

        const token = await user.getIdToken()
        if (!isMounted) return

        console.log('Making API request with auth token...')
        const response = await fetch(`/api/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        })

        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          console.log('API response successful:', data)
          console.log('Loaded', data.submissions?.length || 0, 'submissions')
          if (isMounted) {
            setSubmissions(data.submissions || [])
            setError(null)
          }
        } else {
          const errorText = await response.text()
          console.error('API error response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
          if (isMounted) {
            setError(`Failed to load submissions (${response.status})`)
          }
        }
      } catch (err: any) {
        if (!isMounted) return
        if (err.name === 'AbortError') {
          console.log('Request cancelled')
          return
        }
        console.error('Failed to load submissions:', err)
        if (isMounted) {
          setError('Failed to load submissions')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
      if (abortController) {
        abortController.abort()
      }
    }
  }, [user, authLoading, router, isEmbedded])

  // Safe delete handler
  const handleDelete = useCallback(async (submissionId: string) => {
    if (!user) {
      console.error('No user available for delete')
      return
    }

    console.log('Starting delete process for submission:', submissionId)
    setDeletingId(submissionId)

    try {
      console.log('Getting auth token...')
      const token = await user.getIdToken()
      console.log('Making delete API call...')

      const response = await fetch(`/api/submissions/${submissionId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete API response:', {
        status: response.status,
        statusText: response.statusText
      })

      if (response.ok) {
        // Remove from local state
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
        setShowDeleteConfirm(null)
        console.log('Submission deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Delete failed:', response.status, errorData)
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(`Failed to delete: ${err.message || 'Network error'}`)
    } finally {
      setDeletingId(null)
    }
  }, [user])

  // Handle loading state
  if (authLoading || isLoading) {
    return (
      <div className={isEmbedded ? "w-full h-full" : "container mx-auto px-4 py-8"}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
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
        {/* Header */}
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
          <button
            onClick={() => {
              console.log('Submit New Video clicked, isEmbedded:', isEmbedded)
              if (isEmbedded) {
                // In iframe, use window.parent to navigate
                window.parent.postMessage({ type: 'NAVIGATE_TO_GET_FEEDBACK' }, '*')
              } else {
                // Direct navigation
                router.push('/dashboard/athlete/get-feedback')
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Video className="w-5 h-5 mr-2" />
            Submit New Video
          </button>
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

        {/* Submissions grid */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {submissions.map((submission: any) => {
              const isDeletable = ['pending', 'draft', 'awaiting_coach', 'complete'].includes(submission.status)

              return (
                <div
                  key={submission.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative"
                >
                  <Link
                    href={`/dashboard/athlete/reviews/${submission.id}${isEmbedded ? '?embedded=true' : ''}`}
                    className="block"
                  >
                    {/* Thumbnail */}
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

                      {/* Status badge */}
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

                    {/* Content */}
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

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (isDeletable) {
                        setShowDeleteConfirm(submission.id)
                      } else {
                        alert(`Cannot delete submission in status: ${submission.status}`)
                      }
                    }}
                    className={`absolute top-1 right-1 p-1.5 rounded-md transition-all shadow-sm ${
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Submission?</h2>
                        <p className="text-gray-600 mb-6">
                          This will permanently delete <strong>{submission.skillName || 'this video'}</strong> and all associated data. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={deletingId === submission.id}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(submission.id)}
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