'use client';

import { useState, useEffect } from 'react';
// Removed direct Firestore imports - now using secure APIs
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'next/navigation';
import { Play, Clock, User, FileText, ChevronDown, ChevronUp, Archive, CheckCircle } from 'lucide-react';

export default function QueueBypassPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embedded') === 'true';
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedReviews, setShowCompletedReviews] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSubmissions = async () => {
      try {
        setLoading(true)
        const token = await user.getIdToken()
        const response = await fetch('/api/coach/submissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[COACH-QUEUE] API Response:', data)
          console.log('[COACH-QUEUE] Awaiting coach:', data.awaitingCoach?.length || 0)
          console.log('[COACH-QUEUE] Completed by coach:', data.completedByCoach?.length || 0)
          console.log('[COACH-QUEUE] Total submissions:', data.submissions?.length || 0)
          
          const allSubmissions = [...(data.awaitingCoach || []), ...(data.completedByCoach || [])]
          
          // Sort by createdAt
          allSubmissions.sort((a: any, b: any) => {
            const aTime = new Date(a.createdAt).getTime()
            const bTime = new Date(b.createdAt).getTime()
            return bTime - aTime // Newest first
          })
          
          setSubmissions(allSubmissions)
          console.log('[COACH-QUEUE] Final submissions loaded:', allSubmissions.length)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to load submissions:', response.status, errorData)
          setSubmissions([])
        }
      } catch (error) {
        console.error('Error loading submissions:', error)
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [user]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  // Separate active and completed reviews
  console.log('[COACH-QUEUE] All submission statuses:', submissions.map(s => s.status))
  console.log('[COACH-QUEUE] Sample submission:', submissions[0])
  
  const activeReviews = submissions.filter(submission => {
    // Include submissions that are awaiting review or in progress
    const isActive = submission.status === 'awaiting_coach' || 
                     submission.status === 'uploading' || 
                     submission.status === 'awaiting_review' ||
                     submission.status === 'claimed' ||
                     submission.status === 'in_review'
    console.log(`[COACH-QUEUE] Submission ${submission.id}: status=${submission.status}, isActive=${isActive}`)
    return isActive
  });
  
  const completedReviews = submissions.filter(submission => 
    (submission.status === 'complete' || submission.status === 'reviewed') && 
    submission.claimedBy === user?.uid
  );

  console.log('[COACH-QUEUE] Active reviews count:', activeReviews.length)
  console.log('[COACH-QUEUE] Completed reviews count:', completedReviews.length)

  // Group completed reviews by athlete
  const groupedCompletedReviews = completedReviews.reduce((groups: any, submission: any) => {
    const athleteName = submission.athleteName || 'Unknown Athlete';
    if (!groups[athleteName]) {
      groups[athleteName] = [];
    }
    groups[athleteName].push(submission);
    return groups;
  }, {});

  const handleClaim = async (submissionId: string) => {
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const resp = await fetch(`/api/submissions/${submissionId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to claim submission');
      }
      
      console.log('[COACH-QUEUE] Successfully claimed submission:', submissionId)
    } catch (error) {
      console.error('Error claiming submission:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isEmbedded ? 'h-full' : 'min-h-screen'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? 'h-full overflow-y-auto w-full' : 'container mx-auto px-4 py-8'}`} style={{ backgroundColor: isEmbedded ? 'white' : undefined }}>
      <div className={`${isEmbedded ? 'w-full max-w-7xl mx-auto px-6' : 'max-w-7xl mx-auto'}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Review Queue</h1>
          <p className="mt-2 text-gray-600">
            {activeReviews.length} video{activeReviews.length !== 1 ? 's' : ''} awaiting review
            {completedReviews.length > 0 && (
              <span className="ml-2 text-gray-500">
                • {completedReviews.length} completed
              </span>
            )}
          </p>
          <div className="mt-3 p-3 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            Tip: Click <strong>Start Review</strong> to claim the submission. The athlete will immediately see the status change to <strong>In Review</strong>.
          </div>
        </div>

        {/* Active Reviews Section */}
        {activeReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Reviews ({activeReviews.length})
            </h2>
            <div className={`grid gap-6 ${isEmbedded ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {activeReviews.map((submission) => (
                <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Thumbnail */}
                        <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {submission.thumbnailUrl ? (
                            <img 
                              src={submission.thumbnailUrl} 
                              alt="Video thumbnail" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to play icon if thumbnail fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Play className={`w-8 h-8 text-gray-400 ${submission.thumbnailUrl ? 'hidden' : ''}`} />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">
                              {submission.athleteName || 'Athlete'}
                            </h3>
                            <span className="text-sm text-gray-500">
                              • {submission.videoFileName || 'video.mp4'}
                            </span>
                          </div>

                          {/* Context */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <strong>Context:</strong> {submission.athleteContext || 'No context provided'}
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {submission.videoDuration ? `${Math.round(submission.videoDuration)}s` : 'Unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {submission.videoFileSize ?
                                `${(submission.videoFileSize / 1024 / 1024).toFixed(1)}MB` :
                                'Unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Submitted {formatTimeAgo(submission.submittedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-xs text-gray-500">ID: {submission.id}</span>
                        <span className="text-xs text-gray-500">Status: {submission.status}</span>
                        <button
                          onClick={() => handleClaim(submission.id)}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Start Review
                        </button>
                        <button
                          onClick={() => window.location.href = `/dashboard/coach/review/${submission.id}?embedded=true`}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Open Review Page
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Caught Up Message */}
        {activeReviews.length === 0 && completedReviews.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending video submissions at the moment.</p>
          </div>
        )}

        {/* Completed Reviews Section */}
        {completedReviews.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowCompletedReviews(!showCompletedReviews)}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-4"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Completed Reviews ({completedReviews.length})
                </h2>
              </div>
              {showCompletedReviews ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showCompletedReviews && (
              <div className="space-y-6">
                {Object.entries(groupedCompletedReviews).map(([athleteName, athleteReviews]: [string, any]) => (
                  <div key={athleteName} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {athleteName} ({athleteReviews.length} reviews)
                    </h3>
                    <div className={`grid gap-6 ${isEmbedded ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                      {athleteReviews.map((submission: any) => (
                        <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                          <div className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                {/* Thumbnail */}
                                <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                  {submission.thumbnailUrl ? (
                                    <img 
                                      src={submission.thumbnailUrl} 
                                      alt="Video thumbnail" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to play icon if thumbnail fails to load
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <Play className={`w-8 h-8 text-gray-400 ${submission.thumbnailUrl ? 'hidden' : ''}`} />
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-semibold text-gray-900">
                                      {submission.athleteName || 'Athlete'}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                      • {submission.videoFileName || 'video.mp4'}
                                    </span>
                                  </div>

                                  {/* Context */}
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      <strong>Context:</strong> {submission.athleteContext || 'No context provided'}
                                    </p>
                                  </div>

                                  {/* Metadata */}
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {submission.videoDuration ? `${Math.round(submission.videoDuration)}s` : 'Unknown'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <FileText className="w-4 h-4" />
                                      {submission.videoFileSize ?
                                        `${(submission.videoFileSize / 1024 / 1024).toFixed(1)}MB` :
                                        'Unknown'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      Submitted {formatTimeAgo(submission.submittedAt)}
                                    </div>
                                    {submission.reviewedAt && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        Reviewed {formatTimeAgo(submission.reviewedAt)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action */}
                              <div className="flex flex-col items-end space-y-2">
                                <span className="text-xs text-gray-500">ID: {submission.id}</span>
                                <span className="text-xs text-gray-500">Status: {submission.status}</span>
                                <button
                                  onClick={() => window.location.href = `/dashboard/coach/review/${submission.id}?embedded=true`}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  View Review
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}