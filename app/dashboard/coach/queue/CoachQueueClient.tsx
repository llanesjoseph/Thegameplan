'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { listenToCoachQueue, claimSubmission } from '@/lib/data/video-critique';
import { Submission, SubmissionStatus } from '@/types/video-critique';
import toast from 'react-hot-toast';

interface CoachQueueClientProps {
  initialSubmissions: Submission[];
  teamId: string;
  coachId: string;
  coachName: string;
}

type FilterType = 'all' | 'awaiting' | 'claimed' | 'complete';
type SortType = 'newest' | 'oldest' | 'deadline';

export default function CoachQueueClient({
  initialSubmissions,
  teamId,
  coachId,
  coachName,
}: CoachQueueClientProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('deadline');
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Set up real-time listener
  useEffect(() => {
    const unsubscribe = listenToCoachQueue(teamId, (updatedSubmissions) => {
      setSubmissions(updatedSubmissions);
    });

    return () => unsubscribe();
  }, [teamId]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    switch (filter) {
      case 'awaiting':
        filtered = filtered.filter((s) => s.status === 'awaiting_coach');
        break;
      case 'claimed':
        filtered = filtered.filter((s) => s.status === 'claimed' && s.claimedBy === coachId);
        break;
      case 'complete':
        filtered = filtered.filter((s) => s.status === 'complete');
        break;
    }

    // Sort submissions
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const bDate = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          return bDate.getTime() - aDate.getTime();
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const bDate = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          return aDate.getTime() - bDate.getTime();
        });
        break;
      case 'deadline':
        filtered.sort((a, b) => {
          if (!a.slaDeadline || !b.slaDeadline) return 0;
          const aDate = a.slaDeadline instanceof Date ? a.slaDeadline : a.slaDeadline.toDate();
          const bDate = b.slaDeadline instanceof Date ? b.slaDeadline : b.slaDeadline.toDate();
          return aDate.getTime() - bDate.getTime();
        });
        break;
    }

    return filtered;
  }, [submissions, filter, sortBy, coachId]);

  // Handle claiming a submission
  const handleClaim = useCallback(
    async (submissionId: string) => {
      setClaimingId(submissionId);
      try {
        await claimSubmission(submissionId, coachId, coachName);
        toast.success('Submission claimed successfully!');
        router.push(`/dashboard/submissions/${submissionId}`);
      } catch (error: any) {
        console.error('Error claiming submission:', error);
        toast.error(error.message || 'Failed to claim submission');
      } finally {
        setClaimingId(null);
      }
    },
    [coachId, coachName, router]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: submissions.length,
      awaiting: submissions.filter((s) => s.status === 'awaiting_coach').length,
      claimed: submissions.filter((s) => s.status === 'claimed' && s.claimedBy === coachId).length,
      complete: submissions.filter((s) => s.status === 'complete').length,
      urgent: submissions.filter((s) => {
        if (!s.slaDeadline) return false;
        const deadline = s.slaDeadline instanceof Date ? s.slaDeadline : s.slaDeadline.toDate();
        return differenceInHours(deadline, new Date()) < 12;
      }).length,
    };
  }, [submissions, coachId]);

  // Format date for display
  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true });
  };

  // Get SLA status
  const getSLAStatus = (submission: Submission) => {
    if (!submission.slaDeadline) return null;

    const deadline = submission.slaDeadline instanceof Date
      ? submission.slaDeadline
      : submission.slaDeadline.toDate();

    const hoursRemaining = differenceInHours(deadline, new Date());

    if (hoursRemaining < 0) {
      return { status: 'breached', text: 'SLA Breached', className: 'bg-red-100 text-red-800' };
    } else if (hoursRemaining < 12) {
      return { status: 'urgent', text: `${hoursRemaining}h remaining`, className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'ok', text: `${hoursRemaining}h remaining`, className: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.awaiting}</div>
          <div className="text-sm text-gray-500">Awaiting</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.claimed}</div>
          <div className="text-sm text-gray-500">My Claims</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className="text-sm text-gray-500">Urgent</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('awaiting')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'awaiting'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Awaiting
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'claimed'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Claims
            </button>
            <button
              onClick={() => setFilter('complete')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'complete'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complete
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="deadline">SLA Deadline</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No submissions found</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const slaStatus = getSLAStatus(submission);
            const isClaimed = submission.status === 'claimed';
            const isMySubmission = submission.claimedBy === coachId;

            return (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {submission.thumbnailUrl ? (
                        <img
                          src={submission.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-32 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.skillName}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              {submission.athletePhotoUrl ? (
                                <img
                                  src={submission.athletePhotoUrl}
                                  alt={submission.athleteName}
                                  className="w-5 h-5 rounded-full mr-1"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-300 mr-1" />
                              )}
                              {submission.athleteName}
                            </div>
                            <span className="text-sm text-gray-500">
                              Submitted {formatDate(submission.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {submission.athleteContext}
                          </p>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {/* SLA Status */}
                          {slaStatus && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${slaStatus.className}`}
                            >
                              {slaStatus.text}
                            </span>
                          )}

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              submission.status === 'awaiting_coach'
                                ? 'bg-blue-100 text-blue-800'
                                : submission.status === 'claimed'
                                ? 'bg-indigo-100 text-indigo-800'
                                : submission.status === 'complete'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {submission.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center space-x-3">
                        {submission.status === 'awaiting_coach' ? (
                          <button
                            onClick={() => handleClaim(submission.id)}
                            disabled={claimingId === submission.id}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {claimingId === submission.id ? 'Claiming...' : 'Claim & Review'}
                          </button>
                        ) : isMySubmission ? (
                          <button
                            onClick={() => router.push(`/dashboard/submissions/${submission.id}`)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                          >
                            Continue Review
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/dashboard/submissions/${submission.id}`)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                          >
                            View Submission
                          </button>
                        )}

                        {isClaimed && submission.claimedByName && (
                          <span className="text-sm text-gray-500">
                            Claimed by {submission.claimedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}