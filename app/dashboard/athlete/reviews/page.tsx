'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Video, Clock, CheckCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';

export default function AthleteReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

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
        // BYPASS INDEX REQUIREMENT: Fetch all submissions and filter client-side
        const { collection, getDocs, query } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase.client');

        // Get ALL submissions (no where clauses = no index needed)
        const q = query(collection(db, 'submissions'));
        const querySnapshot = await getDocs(q);

        // Filter for this athlete's submissions in JavaScript
        const mySubmissions: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.athleteUid === user.uid) {
            mySubmissions.push({
              id: doc.id,
              ...data
            });
          }
        });

        // Fallback: also surface pending feedback_requests for this athlete
        if (mySubmissions.length === 0) {
          try {
            // IMPORTANT: use where('athleteId','==',uid) so Firestore rules allow the query
            const frSnapshot = await getDocs(
              query(collection(db, 'feedback_requests'))
            );
            frSnapshot.forEach((doc) => {
              const data = doc.data() as any;
              if (data.athleteId === user.uid) {
                mySubmissions.push({
                  id: `fr_${doc.id}`,
                  athleteUid: data.athleteId,
                  skillName: data.title || 'Video Feedback Request',
                  status: data.status || 'awaiting_review',
                  submittedAt: data.createdAt,
                  createdAt: data.createdAt,
                  thumbnailUrl: null,
                  notes: data.context || '',
                });
              }
            });
          } catch (frErr) {
            console.warn('Could not load feedback_requests fallback:', frErr);
          }
        }

        // Sort by createdAt (newest first)
        mySubmissions.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });

        setSubmissions(mySubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
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

        {/* Submissions Grid */}
        {!showSubmitForm && submissions.length > 0 && (
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
