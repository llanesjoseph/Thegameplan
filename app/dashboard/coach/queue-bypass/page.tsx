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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Video Review Queue
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {activeReviews.length} video{activeReviews.length !== 1 ? 's' : ''} awaiting review
                {completedReviews.length > 0 && (
                  <span className="ml-2 text-gray-500">
                    • {completedReviews.length} completed
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{activeReviews.length}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{completedReviews.length}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Quick Start Guide</h3>
                <p className="text-blue-800 leading-relaxed">
                  Click <strong className="bg-blue-100 px-2 py-1 rounded">Start Review</strong> to claim a submission. 
                  The athlete will immediately see the status change to <strong className="bg-blue-100 px-2 py-1 rounded">In Review</strong>. 
                  Use <strong className="bg-blue-100 px-2 py-1 rounded">Open Review</strong> to access the full review interface.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Reviews Section */}
        {activeReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Reviews ({activeReviews.length})
            </h2>
            <div className={`grid gap-6 ${isEmbedded ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {activeReviews.map((submission) => {
                console.log('[COACH-QUEUE] Rendering submission:', submission.id, 'thumbnailUrl:', submission.thumbnailUrl);
                return (
                <div key={submission.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                  <div className="p-6">
                    {/* Header with status badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {submission.athleteName || 'Athlete'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {submission.videoFileName || 'video.mp4'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'awaiting_coach' ? 'bg-yellow-100 text-yellow-800' :
                          submission.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                          submission.status === 'in_review' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status === 'awaiting_coach' ? 'Awaiting' :
                           submission.status === 'claimed' ? 'Claimed' :
                           submission.status === 'in_review' ? 'In Review' :
                           submission.status}
                        </span>
                      </div>
                    </div>

                    {/* Thumbnail and content */}
                    <div className="flex gap-4 mb-4">
                      {/* Enhanced Thumbnail */}
                      <div className="w-40 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden relative shadow-md group-hover:shadow-lg transition-shadow">
                        {submission.thumbnailUrl ? (
                          <>
                            <img 
                              src={submission.thumbnailUrl} 
                              alt="Video thumbnail" 
                              className="w-full h-full object-cover absolute inset-0 z-10"
                              style={{ display: 'block' }}
                              onError={(e) => {
                                console.warn('[COACH-QUEUE] Thumbnail failed to load:', submission.thumbnailUrl);
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              onLoad={(e) => {
                                console.log('[COACH-QUEUE] Thumbnail loaded successfully:', submission.thumbnailUrl);
                                console.log('[COACH-QUEUE] Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                              }}
                            />
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 absolute inset-0 z-0" style={{ display: 'none' }}>
                              <Play className="w-8 h-8 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Play className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-700 ml-1" />
                          </div>
                        </div>
                      </div>

                      {/* Context */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-medium text-gray-900">Context:</span> {submission.athleteContext || 'No context provided'}
                          </p>
                        </div>

                        {/* Enhanced Metadata */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{submission.videoDuration ? `${Math.round(submission.videoDuration)}s` : 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{submission.videoFileSize ?
                                `${(submission.videoFileSize / 1024 / 1024).toFixed(1)}MB` :
                                'Unknown'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Submitted {formatTimeAgo(submission.submittedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        ID: {submission.id}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            // Auto-claim and then open review
                            handleClaim(submission.id);
                            window.location.href = `/dashboard/coach/review/${submission.id}?embedded=true`;
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Start Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced All Caught Up Message */}
        {activeReviews.length === 0 && completedReviews.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-12 text-center border border-green-100">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">All caught up!</h3>
            <p className="text-gray-600 text-lg">No pending video submissions at the moment.</p>
            <div className="mt-6 p-4 bg-white bg-opacity-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <strong>Great job!</strong> You're staying on top of your athlete reviews. 
                New submissions will appear here when athletes submit videos.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Completed Reviews Section */}
        {completedReviews.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowCompletedReviews(!showCompletedReviews)}
              className="flex items-center justify-between w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md mb-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Completed Reviews
                  </h2>
                  <p className="text-sm text-gray-600">
                    {completedReviews.length} review{completedReviews.length !== 1 ? 's' : ''} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {showCompletedReviews ? 'Hide' : 'Show'}
                </span>
                {showCompletedReviews ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
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
                        <div key={submission.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                          <div className="p-6">
                            {/* Header with status badge */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {submission.athleteName || 'Athlete'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {submission.videoFileName || 'video.mp4'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                              </div>
                            </div>

                            {/* Thumbnail and content */}
                            <div className="flex gap-4 mb-4">
                              {/* Enhanced Thumbnail */}
                              <div className="w-40 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden relative shadow-md group-hover:shadow-lg transition-shadow">
                                {submission.thumbnailUrl ? (
                                  <>
                                    <img 
                                      src={submission.thumbnailUrl} 
                                      alt="Video thumbnail" 
                                      className="w-full h-full object-cover absolute inset-0 z-10"
                                      style={{ display: 'block' }}
                                      onError={(e) => {
                                        console.warn('[COACH-QUEUE] Thumbnail failed to load:', submission.thumbnailUrl);
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                      onLoad={(e) => {
                                        console.log('[COACH-QUEUE] Thumbnail loaded successfully:', submission.thumbnailUrl);
                                        console.log('[COACH-QUEUE] Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                                      }}
                                    />
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 absolute inset-0 z-0" style={{ display: 'none' }}>
                                      <Play className="w-8 h-8 text-gray-400" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <Play className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                {/* Play overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-gray-700 ml-1" />
                                  </div>
                                </div>
                              </div>

                              {/* Context */}
                              <div className="flex-1">
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-medium text-gray-900">Context:</span> {submission.athleteContext || 'No context provided'}
                                  </p>
                                </div>

                                {/* Enhanced Metadata */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">{submission.videoDuration ? `${Math.round(submission.videoDuration)}s` : 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">{submission.videoFileSize ?
                                        `${(submission.videoFileSize / 1024 / 1024).toFixed(1)}MB` :
                                        'Unknown'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>Submitted {formatTimeAgo(submission.submittedAt)}</span>
                                    {submission.reviewedAt && (
                                      <span className="ml-4 flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        Reviewed {formatTimeAgo(submission.reviewedAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="text-xs text-gray-400">
                                ID: {submission.id}
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => window.location.href = `/dashboard/coach/review/${submission.id}?embedded=true`}
                                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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