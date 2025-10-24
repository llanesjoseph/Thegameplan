'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Video, Clock, CheckCircle, AlertCircle, Eye, ArrowLeft, ChevronDown, ChevronUp, Archive, Edit } from 'lucide-react';

export default function AthleteReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletedReviews, setShowCompletedReviews] = useState(false);

  // Detect if page is loaded in iframe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embeddedParam = params.get('embedded') === 'true';
    const windowCheck = window.self !== window.top;
    setIsEmbedded(embeddedParam || windowCheck);
    setJustSubmitted(params.get('submitted') === '1');
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (!user) return;

    // Fetch submissions WITHOUT INDEXES - fetch all and filter in JavaScript
    const fetchSubmissions = async () => {
      try {
        // Use secure API to prevent React errors
        const token = await user.getIdToken();
        const response = await fetch('/api/submissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let mySubmissions: any[] = [];
        if (response.ok) {
          const data = await response.json();
          console.log('[ATHLETE-REVIEWS] API Response:', data);
          mySubmissions = data.submissions || [];
          console.log('[ATHLETE-REVIEWS] Loaded submissions:', mySubmissions.length);
        } else {
          console.warn('[ATHLETE-REVIEWS] API fetch failed, continuing with empty submissions');
          mySubmissions = [];
        }

        // Fallback removed - using server-side API only to avoid permission errors

        // Sort by createdAt (newest first) with error handling
        try {
        mySubmissions.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });
        } catch (sortError) {
          console.warn('[ATHLETE-REVIEWS] Sort error, using original order:', sortError);
        }

        setSubmissions(mySubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to load reviews. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, loading, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review':
      case 'claimed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'awaiting_coach':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5" />;
      case 'in_review':
      case 'claimed':
        return <Eye className="w-5 h-5" />;
      case 'awaiting_coach':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

  // Safe data processing function
  const safeSubmission = (submission: any) => {
    if (!submission || typeof submission !== 'object') return null;
    return {
      id: submission.id || 'unknown',
      status: submission.status || 'unknown',
      athleteName: submission.athleteName || 'Unknown',
      athleteContext: submission.athleteContext || submission.context || '',
      videoFileName: submission.videoFileName || 'video.mp4',
      thumbnailUrl: submission.thumbnailUrl || null,
      videoDuration: submission.videoDuration || 0,
      videoFileSize: submission.videoFileSize || 0,
      createdAt: submission.createdAt || new Date().toISOString(),
      submittedAt: submission.submittedAt || submission.createdAt || new Date().toISOString(),
      reviewedAt: submission.reviewedAt || null,
      claimedBy: submission.claimedBy || null,
      claimedByName: submission.claimedByName || null,
    };
  };

  // Separate active and completed reviews with safe data processing
  let activeReviews: any[] = [];
  let completedReviews: any[] = [];
  
  try {
    const safeSubmissions = submissions.map(safeSubmission).filter((submission): submission is NonNullable<typeof submission> => submission !== null);
    
    activeReviews = safeSubmissions.filter(submission => 
      submission && submission.status !== 'complete' && submission.status !== 'reviewed'
    );
    
    completedReviews = safeSubmissions.filter(submission => 
      submission && (submission.status === 'complete' || submission.status === 'reviewed')
    );
  } catch (filterError) {
    console.error('[ATHLETE-REVIEWS] Filter error:', filterError);
    activeReviews = [];
    completedReviews = [];
  }

  // Group completed reviews by athlete (if multiple athletes) with error handling
  let groupedCompletedReviews: any = {};
  try {
    groupedCompletedReviews = completedReviews.reduce((groups: any, submission: any) => {
      if (!submission) return groups;
      const athleteName = submission.athleteName || 'You';
      if (!groups[athleteName]) {
        groups[athleteName] = [];
      }
      groups[athleteName].push(submission);
      return groups;
    }, {});
  } catch (groupError) {
    console.error('[ATHLETE-REVIEWS] Group error:', groupError);
    groupedCompletedReviews = {};
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reviews</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Retry fetch
                if (user) {
                  const fetchSubmissions = async () => {
                    try {
                      const token = await user.getIdToken();
                      const response = await fetch('/api/submissions', {
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setSubmissions(data.submissions || []);
                      }
                    } catch (err) {
                      setError('Failed to load reviews. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  fetchSubmissions();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? 'p-4' : 'container mx-auto px-4 py-8'}`}>
      <div className="max-w-6xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`${isEmbedded ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
                {showSubmitForm ? 'Submit Video for Review' : 'My Video Reviews'}
              </h1>
              <p className="mt-2 text-gray-600">
                {showSubmitForm
                  ? 'Upload a video of your performance to receive personalized feedback from your coach'
                  : 'Track your submitted videos and coach feedback'
                }
              </p>
            </div>
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showSubmitForm ? (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  View Reviews
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Submit Video
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {justSubmitted && (
          <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50 text-green-800">
            ✅ Your video was submitted successfully. Your coach has been notified.
          </div>
        )}

        {/* Submit Form View - Using the new Get Feedback system that copies coach lesson upload pattern */}
        {showSubmitForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
            <iframe
              src="/dashboard/athlete/get-feedback?embedded=true"
              className="w-full h-full border-0"
              title="Get Feedback"
            />
          </div>
        )}

        {/* Reviews List View */}
        {!showSubmitForm && submissions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No video submissions yet
            </h3>
            <p className="text-gray-600 mb-6">
              Submit your first video to get personalized feedback from your coach
            </p>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Submit Video
            </button>
          </div>
        )}

        {/* Active Reviews Section */}
        {!showSubmitForm && activeReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Reviews ({activeReviews.length})
            </h2>
            <div className="grid gap-4">
              {activeReviews.map((submission: any) => {
                // Safe property access to prevent React errors
                const safeSubmission = {
                  id: submission?.id || 'unknown',
                  skillName: submission?.skillName || submission?.videoFileName || 'Video Submission',
                  status: submission?.status || 'unknown',
                  submittedAt: submission?.submittedAt || submission?.createdAt || new Date().toISOString(),
                  reviewedAt: submission?.reviewedAt || null,
                  claimedBy: submission?.claimedBy || null,
                  notes: submission?.notes || submission?.athleteContext || '',
                  thumbnailUrl: submission?.thumbnailUrl || null,
                };

                return (
                  <Link
                    key={safeSubmission.id}
                    href={`/dashboard/athlete/reviews/${safeSubmission.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {safeSubmission.skillName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              safeSubmission.status
                            )}`}
                          >
                            {getStatusIcon(safeSubmission.status)}
                            {formatStatus(safeSubmission.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted {formatDate(safeSubmission.submittedAt)}
                          </span>

                          {safeSubmission.reviewedAt && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Reviewed {formatTimeAgo(safeSubmission.reviewedAt)}
                            </span>
                          )}

                          {safeSubmission.claimedBy && !safeSubmission.reviewedAt && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Eye className="w-4 h-4" />
                              Coach reviewing...
                            </span>
                          )}
                        </div>

                        {safeSubmission.notes && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {safeSubmission.notes}
                          </p>
                        )}
                      </div>

                      {safeSubmission.thumbnailUrl && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={safeSubmission.thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-32 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              console.warn('[ATHLETE-REVIEWS] Thumbnail failed to load:', safeSubmission.thumbnailUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Reviews Section */}
        {!showSubmitForm && completedReviews.length > 0 && (
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
                    <div className="grid gap-4">
                      {athleteReviews.map((submission: any) => {
                        // Safe property access to prevent React errors
                        const safeSubmission = {
                          id: submission?.id || 'unknown',
                          skillName: submission?.skillName || submission?.videoFileName || 'Video Submission',
                          status: submission?.status || 'unknown',
                          submittedAt: submission?.submittedAt || submission?.createdAt || new Date().toISOString(),
                          reviewedAt: submission?.reviewedAt || null,
                          notes: submission?.notes || submission?.athleteContext || '',
                          thumbnailUrl: submission?.thumbnailUrl || null,
                        };

                        return (
                          <div
                            key={safeSubmission.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {safeSubmission.skillName}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                      safeSubmission.status
                                    )}`}
                                  >
                                    {getStatusIcon(safeSubmission.status)}
                                    {formatStatus(safeSubmission.status)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Submitted {formatDate(safeSubmission.submittedAt)}
                                  </span>

                                  {safeSubmission.reviewedAt && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Reviewed {formatTimeAgo(safeSubmission.reviewedAt)}
                                    </span>
                                  )}
                                </div>

                                {safeSubmission.notes && (
                                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                    {safeSubmission.notes}
                                  </p>
                                )}
                              </div>

                              {safeSubmission.thumbnailUrl && (
                                <div className="ml-4 flex-shrink-0">
                                  <img
                                    src={safeSubmission.thumbnailUrl}
                                    alt="Video thumbnail"
                                    className="w-32 h-20 object-cover rounded-lg"
                                    onError={(e) => {
                                      console.warn('[ATHLETE-REVIEWS] Thumbnail failed to load:', safeSubmission.thumbnailUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                              <Link
                                href={`/dashboard/athlete/reviews/${safeSubmission.id}`}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Review
                              </Link>
                              <button
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  console.log('Edit review:', safeSubmission.id);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legacy Submissions Grid - Fallback for old structure */}
        {!showSubmitForm && activeReviews.length === 0 && completedReviews.length === 0 && submissions.length > 0 && (
          <div className="grid gap-4">
            {submissions.map((submission: any) => (
              <Link
                key={submission.id}
                href={`/dashboard/athlete/reviews/${submission.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.skillName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {getStatusIcon(submission.status)}
                        {formatStatus(submission.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Submitted {formatDate(submission.submittedAt)}
                      </span>

                      {submission.reviewedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Reviewed {formatTimeAgo(submission.reviewedAt)}
                        </span>
                      )}

                      {submission.claimedBy && !submission.reviewedAt && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Eye className="w-4 h-4" />
                          Coach reviewing...
                        </span>
                      )}
                    </div>

                    {submission.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {submission.notes}
                      </p>
                    )}
                  </div>

                  {submission.thumbnailUrl && (
                    <div className="ml-4 flex-shrink-0">
                      <img
                        src={submission.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Action */}
        {!showSubmitForm && submissions.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowSubmitForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Submit Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
