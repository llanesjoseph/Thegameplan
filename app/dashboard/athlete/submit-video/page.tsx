'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SubmissionForm from './SubmissionForm';

export default function SubmitVideoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (!user) return;

    // Fetch user's teams and skills
    const fetchData = async () => {
      try {
        // For now, use a default team
        // TODO: Implement proper team fetching from Firestore
        const userTeams = [
          {
            id: 'default-team',
            name: 'My Team',
            sport: 'Basketball'
          }
        ];
        setTeams(userTeams);

        // Fetch skills for the team
        const { getTeamSkills } = await import('@/lib/data/video-critique');
        const teamSkills = await getTeamSkills(userTeams[0].id);
        setSkills(teamSkills);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard/athlete"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
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

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Video for Review</h1>
          <p className="mt-2 text-gray-600">
            Upload a video of your performance to receive personalized feedback from your coach.
          </p>
        </div>

        <SubmissionForm
          user={user}
          teams={teams}
          skills={skills}
        />
      </div>
    </div>
  );
}