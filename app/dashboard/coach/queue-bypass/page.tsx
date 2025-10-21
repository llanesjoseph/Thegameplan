'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { useAuth } from '@/hooks/use-auth';
import { Play, Clock, User, FileText } from 'lucide-react';

export default function QueueBypassPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to ALL submissions without filters to avoid index requirements
    // We'll filter in JavaScript instead
    const q = query(
      collection(db, 'submissions')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSubs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter in JavaScript to avoid index requirements
      const awaitingCoach = allSubs.filter((sub: any) =>
        sub.status === 'awaiting_coach' || sub.status === 'uploading'
      );
      // Sort by createdAt in JavaScript
      awaitingCoach.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Newest first
      });
      setSubmissions(awaitingCoach);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleClaim = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'in_review',
        claimedBy: user?.uid,
        claimedAt: new Date()
      });
    } catch (error) {
      console.error('Error claiming submission:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Review Queue</h1>
          <p className="mt-2 text-gray-600">
            {submissions.length} video{submissions.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending video submissions at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Thumbnail */}
                      <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-400" />
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
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleClaim(submission.id)}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Start Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}