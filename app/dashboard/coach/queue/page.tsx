import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import CoachQueueClient from './CoachQueueClient';
import { getCoachQueue } from '@/lib/data/video-critique';

async function getCoachTeam(coachUid: string) {
  // For now, return a default team
  // TODO: Implement proper team fetching for coach
  return {
    id: 'default-team',
    name: 'My Team',
    sport: 'Basketball'
  };
}

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

  // Get coach's team
  const team = await getCoachTeam(user.uid);

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              No Team Assigned
            </h2>
            <p className="text-yellow-800">
              You need to be assigned to a team to review video submissions.
              Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch initial submissions for the team
  const initialData = await getCoachQueue(team.id, { limit: 20 });

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
            teamId={team.id}
            coachId={user.uid}
            coachName={user.displayName}
          />
        </Suspense>
      </div>
    </div>
  );
}