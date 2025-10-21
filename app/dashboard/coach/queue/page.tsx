import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import CoachQueueClient from './CoachQueueClient';
import { getSubmissions } from '@/lib/data/video-critique';

export default async function CoachQueuePage() {
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
      displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'Coach',
      photoURL: decodedToken.picture,
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    redirect('/login');
  }

  // Fetch initial submissions for this coach
  const initialData = await getSubmissions(
    { coachId: user.uid, status: 'awaiting_coach' },
    { limit: 20 }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Review Queue</h1>
          <p className="mt-2 text-gray-600">
            Review and provide feedback on athlete video submissions
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-16 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <CoachQueueClient
            initialSubmissions={initialData.items}
            coachId={user.uid}
            coachName={user.displayName}
          />
        </Suspense>
      </div>
    </div>
  );
}