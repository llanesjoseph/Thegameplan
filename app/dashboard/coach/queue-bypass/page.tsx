'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'next/navigation';
import { Play, Clock, User, FileText, ChevronDown, ChevronUp, Archive, CheckCircle } from 'lucide-react';

export default function QueueBypassPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embedded') === 'true';
  
  // ALL state declared at top level
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedReviews, setShowCompletedReviews] = useState(false);

  // BULLETPROOF useEffect - no early returns
  useEffect(() => {
    let isMounted = true;

    const loadSubmissions = async () => {
      try {
        if (!user) {
          console.log('[COACH-QUEUE] No user, skipping load');
          if (isMounted) {
            setSubmissions([]);
            setLoading(false);
          }
          return;
        }

        console.log('[COACH-QUEUE] Loading submissions for coach...');
        if (isMounted) setLoading(true);

        const token = await user.getIdToken();
        const response = await fetch('/api/coach/submissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          console.log('[COACH-QUEUE] API Response:', data);
          console.log('[COACH-QUEUE] Awaiting coach:', data.awaitingCoach?.length || 0);
          console.log('[COACH-QUEUE] Completed by coach:', data.completedByCoach?.length || 0);
          console.log('[COACH-QUEUE] Total submissions:', data.submissions?.length || 0);
          
          const allSubmissions = [...(data.awaitingCoach || []), ...(data.completedByCoach || [])];
          
          // Sort by createdAt
          allSubmissions.sort((a: any, b: any) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime; // Newest first
          });
          
          if (isMounted) {
            setSubmissions(allSubmissions);
            console.log('[COACH-QUEUE] Final submissions loaded:', allSubmissions.length);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to load submissions:', response.status, errorData);
          if (isMounted) setSubmissions([]);
        }
      } catch (error) {
        console.error('Error loading submissions:', error);
        if (isMounted) setSubmissions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSubmissions();

    return () => {
      isMounted = false;
    };
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
  console.log('[COACH-QUEUE] All submission statuses:', submissions.map(s => s.status));
  console.log('[COACH-QUEUE] Sample submission:', submissions[0]);
  
  const activeReviews = submissions.filter(submission => {
    const isActive = submission.status === 'awaiting_coach' || 
                     submission.status === 'uploading' || 
                     submission.status === 'awaiting_review' ||
                     submission.status === 'claimed' ||
                     submission.status === 'in_review';
    console.log(`[COACH-QUEUE] Submission ${submission.id}: status=${submission.status}, isActive=${isActive}`);
    return isActive;
  });
  
  const completedReviews = submissions.filter(submission => 
    (submission.status === 'complete' || submission.status === 'reviewed') && 
    submission.claimedBy === user?.uid
  );

  console.log('[COACH-QUEUE] Active reviews count:', activeReviews.length);
  console.log('[COACH-QUEUE] Completed reviews count:', completedReviews.length);

  const handleClaimAndReview = async (submissionId: string) => {
    if (!user) return;

    try {
      console.log('[COACH-QUEUE] Claiming submission:', submissionId);
      
      // Navigate directly to review page
      window.location.href = `/dashboard/coach/review/${submissionId}${isEmbedded ? '?embedded=true' : ''}`;
    } catch (error) {
      console.error('[COACH-QUEUE] Error claiming submission:', error);
      alert('Failed to claim submission. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Review Queue</h1>
          <p className="text-gray-600">{activeReviews.length} videos awaiting review</p>
        </div>

        {/* Active Reviews */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Active Reviews ({activeReviews.length})
          </h2>
          
          {activeReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No videos awaiting review at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeReviews.map((submission: any) => (
                <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-200 relative">
                    {submission.thumbnailUrl ? (
                      <img
                        src={submission.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          console.log('[COACH-QUEUE] Thumbnail loaded successfully:', submission.thumbnailUrl);
                        }}
                        onError={(e) => {
                          console.error('[COACH-QUEUE] Thumbnail load failed:', submission.thumbnailUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        submission.status === 'awaiting_coach' ? 'bg-yellow-500 text-white' :
                        submission.status === 'claimed' || submission.status === 'in_review' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {submission.status === 'awaiting_coach' ? 'New' :
                         submission.status === 'claimed' ? 'Claimed' :
                         submission.status === 'in_review' ? 'In Review' :
                         submission.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                      {submission.skillName || submission.videoFileName || 'Video Submission'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <User className="w-4 h-4" />
                      <span>{submission.athleteName || 'Athlete'}</span>
                    </div>

                    {submission.athleteContext && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {submission.athleteContext}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(submission.createdAt)}
                      </span>
                      {submission.videoFileSize && (
                        <span>{(submission.videoFileSize / (1024 * 1024)).toFixed(1)} MB</span>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleClaimAndReview(submission.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Reviews (Collapsible) */}
        {completedReviews.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompletedReviews(!showCompletedReviews)}
              className="flex items-center justify-between w-full bg-white rounded-lg shadow p-4 mb-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedReviews.map((submission: any) => (
                  <div key={submission.id} className="bg-white rounded-lg shadow overflow-hidden opacity-75">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-200 relative">
                      {submission.thumbnailUrl ? (
                        <img
                          src={submission.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                          Complete
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                        {submission.skillName || submission.videoFileName || 'Video Submission'}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <User className="w-4 h-4" />
                        <span>{submission.athleteName || 'Athlete'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(submission.createdAt)}
                        </span>
                      </div>
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
