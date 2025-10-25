'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Video, Clock, CheckCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';

/**
 * SIMPLIFIED Athlete Reviews Page
 * Removed all complex logic that was causing React error #310
 */
export default function AthleteReviewsPageV2() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submissions - SIMPLE version with no conditional hooks
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // Wait for auth to load
      if (authLoading) {
        console.log('[REVIEWS-V2] Waiting for auth...');
        return;
      }

      // Redirect if no user
      if (!user) {
        console.log('[REVIEWS-V2] No user, redirecting to login');
        router.push('/login');
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
  }, [user, authLoading, router]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/athlete"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
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

        {/* Submissions list */}
        {submissions.length > 0 && (
          <div className="grid gap-4">
            {submissions.map((submission: any) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {submission.skillName || submission.videoFileName || 'Video Submission'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(submission.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'complete' ? 'bg-green-100 text-green-800' :
                        submission.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status || 'pending'}
                      </span>
                    </div>
                    {submission.athleteContext && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {submission.athleteContext}
                      </p>
                    )}
                  </div>
                  {submission.thumbnailUrl && (
                    <img
                      src={submission.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-32 h-20 object-cover rounded-lg ml-4"
                      onError={(e) => {e.currentTarget.style.display = 'none'}}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

