import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import SubmissionPlayer from './SubmissionPlayer';
import { getSubmission } from '@/lib/data/video-critique';

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
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
      displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      photoURL: decodedToken.picture,
      // TODO: Get role from custom claims
      role: 'athlete' as string,
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    redirect('/login');
  }

  // Fetch submission
  const submission = await getSubmission(params.id);

  if (!submission) {
    notFound();
  }

  // Check access permissions
  const canAccess =
    submission.athleteUid === user.uid || // Athlete owns it
    submission.claimedBy === user.uid || // Coach claimed it
    user.role === 'coach' || // Any coach (for now)
    user.role === 'superadmin'; // Superadmin

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-800">
              You don't have permission to view this submission.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="aspect-video bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          }
        >
          <SubmissionPlayer
            submission={submission}
            currentUser={user}
          />
        </Suspense>
      </div>
    </div>
  );
}