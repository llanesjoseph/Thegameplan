import { notFound } from 'next/navigation';
import { getSubmission } from '@/lib/data/submissions';
import { getReviewBySubmission } from '@/lib/data/reviews';
import { getRubricBySkill } from '@/lib/data/rubrics';
import { getCurrentUser } from '@/lib/auth-server';
import ReviewDetail from './ReviewDetail';

interface PageProps {
  params: {
    submissionId: string;
  };
}

export default async function AthleteReviewPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return notFound();
  }

  // Fetch submission
  const submission = await getSubmission(params.submissionId);

  if (!submission) {
    return notFound();
  }

  // Verify athlete owns this submission
  if (submission.athleteUid !== user.uid) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-600 mt-2">
            You do not have permission to view this review.
          </p>
        </div>
      </div>
    );
  }

  // Fetch review
  const review = await getReviewBySubmission(params.submissionId);

  if (!review) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Review Not Available</h3>
          <p className="text-yellow-600 mt-2">
            Your submission has not been reviewed yet. Please check back later.
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Status: <strong>{submission.status}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Check if review is published
  if (review.status !== 'published') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold">Review In Progress</h3>
          <p className="text-blue-600 mt-2">
            Your coach is still working on your review. Please check back soon!
          </p>
        </div>
      </div>
    );
  }

  // Fetch rubric
  const rubric = await getRubricBySkill(submission.skillId);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Review</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Skill: <strong>{submission.skillName}</strong></span>
          <span>•</span>
          <span>Reviewed by: <strong>{review.coachName}</strong></span>
          <span>•</span>
          <span>
            Published: <strong>
              {review.publishedAt ? new Date(review.publishedAt as any).toLocaleDateString() : 'N/A'}
            </strong>
          </span>
        </div>
      </div>

      <ReviewDetail
        submission={submission}
        review={review}
        rubric={rubric}
        athleteId={user.uid}
      />
    </div>
  );
}