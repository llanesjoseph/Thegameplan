import { getCurrentUser } from '@/lib/auth-server';
import { notFound } from 'next/navigation';
import { getCoachReviewStats } from '@/lib/data/reviews';
import { getCoachSubmissions } from '@/lib/data/submissions';
import VideoCritiqueAnalytics from './VideoCritiqueAnalytics';

export default async function CoachAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'coach') {
    return notFound();
  }

  // Fetch coach stats
  const stats = await getCoachReviewStats(user.uid);

  // Fetch recent submissions for the coach
  const { items: submissions } = await getCoachSubmissions(user.uid, undefined, 100);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Critique Analytics</h1>
        <p className="text-gray-600">
          Track your performance and review metrics
        </p>
      </div>

      <VideoCritiqueAnalytics
        coachId={user.uid}
        initialStats={stats}
        submissions={submissions}
      />
    </div>
  );
}