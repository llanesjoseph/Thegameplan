'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Video, Clock, CheckCircle, AlertCircle, Eye, ArrowLeft, Trash2 } from 'lucide-react';

/**
 * SIMPLIFIED Athlete Reviews Page
 * Removed all complex logic that was causing React error #310
 * NOW SUPPORTS IFRAME EMBEDDING with ?embedded=true
 */
export default function AthleteReviewsPageV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embedded') === 'true';
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch submissions - SIMPLE version with no conditional hooks
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // Wait for auth to load
      if (authLoading) {
        console.log('[REVIEWS-V2] Waiting for auth...');
        return;
      }

      // Redirect if no user (but not if embedded - let parent handle auth)
      if (!user && !isEmbedded) {
        console.log('[REVIEWS-V2] No user, redirecting to login');
        router.push('/login');
        return;
      }
      
      // If embedded and no user, just show loading
      if (!user) {
        return;
      }

      console.log('[REVIEWS-V2] Fetching submissions for:', user.uid);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/submissions?athleteUid=${user.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          console.log('[REVIEWS-V2] Got submissions:', data.submissions?.length || 0);
          setSubmissions(data.submissions || []);
        } else {
          console.error('[REVIEWS-V2] API error:', response.status);
          setError('Failed to load submissions');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[REVIEWS-V2] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, router, isEmbedded]);

  // Handle delete submission
  const handleDelete = async (submissionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    setDeletingId(submissionId);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/submissions/${submissionId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to delete submission');
      }

      // Remove from local state
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      alert(error.message || 'Failed to delete submission. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Main content
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

        {/* Command Palette Style List */}
        {submissions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {submissions.map((submission: any) => {
              const isDeletable = ['pending', 'draft', 'awaiting_coach'].includes(submission.status);
              return (
                <div key={submission.id} className="relative">
                  <Link
                    href={isEmbedded ? `/dashboard/athlete/reviews/${submission.id}?embedded=true` : `/dashboard/athlete/reviews/${submission.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Thumbnail "Profile Pic" */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                      {submission.thumbnailUrl ? (
                        <img
                          src={submission.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {e.currentTarget.style.display = 'none'}}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {submission.skillName || submission.videoFileName || 'Video Submission'}
                        </h3>
                        
                        {/* Completion/Status Badge */}
                        {submission.status === 'complete' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Complete
                          </span>
                        ) : submission.status === 'in_review' || submission.status === 'claimed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            In Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {submission.athleteContext && (
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                          {submission.athleteContext}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Video Submission
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(submission.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <svg
                      className="h-5 w-5 flex-none text-gray-400 group-hover:text-gray-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>

                  {/* Delete button - only show for deletable submissions */}
                  {isDeletable && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDeleteConfirm(submission.id);
                      }}
                      className="absolute top-4 right-12 p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-md transition-colors border border-gray-200 opacity-0 group-hover:opacity-100"
                      disabled={deletingId === submission.id}
                      title="Delete submission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

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
                              e.preventDefault();
                              e.stopPropagation();
                              setShowDeleteConfirm(null);
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

