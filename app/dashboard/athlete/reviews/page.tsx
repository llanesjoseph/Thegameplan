import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase.admin';
import Link from 'next/link';
import { Video, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';

async function getMySubmissions(userId: string) {
  // Import dynamically to avoid issues
  const { getMySubmissions } = await import('@/lib/data/video-critique');
  return getMySubmissions(userId);
}

export default async function AthleteReviewsPage() {
  // Get auth token from cookies
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    const decodedToken = await auth.verifyIdToken(token);
    user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'Athlete',
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    redirect('/login');
  }

  // Fetch user's submissions
  const { items: submissions } = await getMySubmissions(user.uid);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Video Reviews</h1>
          <p className="mt-2 text-gray-600">
            Track your submitted videos and coach feedback
          </p>
        </div>

        {/* Empty State */}
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
              href="/dashboard/athlete/submit-video"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Submit Video
            </Link>
          </div>
        )}

        {/* Submissions Grid */}
        {submissions.length > 0 && (
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
                          Reviewed {formatDate(submission.reviewedAt)}
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
        {submissions.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/athlete/submit-video"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-5 h-5 mr-2" />
              Submit Another Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
