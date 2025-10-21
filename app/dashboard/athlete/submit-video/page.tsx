import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import SubmissionForm from './SubmissionForm';
import { getTeamSkills } from '@/lib/data/video-critique';

async function getUserTeams(userId: string) {
  // For now, return a default team
  // TODO: Implement proper team fetching
  return [
    {
      id: 'default-team',
      name: 'My Team',
      sport: 'Basketball'
    }
  ];
}

export default async function SubmitVideoPage() {
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
      photoURL: decodedToken.picture,
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    redirect('/login');
  }

  // Fetch user's teams
  const teams = await getUserTeams(user.uid);

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              No Team Assigned
            </h2>
            <p className="text-yellow-800">
              You need to be part of a team to submit videos for review.
              Please contact your coach to be added to a team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch available skills for the first team
  const skills = await getTeamSkills(teams[0].id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Video for Review</h1>
          <p className="mt-2 text-gray-600">
            Upload a video of your performance to receive personalized feedback from your coach.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
              </div>
            </div>
          }
        >
          <SubmissionForm
            user={user}
            teams={teams}
            skills={skills}
          />
        </Suspense>
      </div>
    </div>
  );
}