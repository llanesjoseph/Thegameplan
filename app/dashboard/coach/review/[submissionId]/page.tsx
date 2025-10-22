import { notFound } from 'next/navigation';
import { getSubmission } from '@/lib/data/submissions';
import { getRubricBySkill } from '@/lib/data/rubrics';
import { getReviewBySubmission } from '@/lib/data/reviews';
import { getCurrentUser } from '@/lib/auth-server';
import ReviewForm from './ReviewForm';
import { adminDb } from '@/lib/firebase.admin';

interface PageProps {
  params: {
    submissionId: string;
  };
}

export default async function CoachReviewPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return notFound();
  }

  // Fetch submission details
  const submission = await getSubmission(params.submissionId);

  if (!submission) {
    return notFound();
  }

  // Auto-claim: if unclaimed and this coach is the assigned coach, claim server-side
  if (!submission.claimedBy && submission.coachId === user.uid) {
    try {
      await adminDb
        .collection('submissions')
        .doc(params.submissionId)
        .update({
          claimedBy: user.uid,
          claimedByName: user.displayName || user.email || 'Coach',
          claimedAt: new Date(),
          status: 'claimed',
          updatedAt: new Date(),
        });
      // Reflect claimed state locally
      (submission as any).claimedBy = user.uid;
      (submission as any).claimedByName = user.displayName || user.email || 'Coach';
      (submission as any).status = 'claimed';
    } catch (e) {
      // Ignore claim failure; page will still render access message below if not claimed
      console.warn('Auto-claim failed:', e);
    }
  }

  // Verify coach has claimed this submission
  if (submission.claimedBy !== user.uid) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-600 mt-2">
            You have not claimed this submission. Please claim it from the queue first.
          </p>
        </div>
      </div>
    );
  }

  // Fetch rubric for the skill (if skillId exists)
  let rubric = null;
  if (submission.skillId) {
    rubric = await getRubricBySkill(submission.skillId);
  }

  // Check if review already exists (draft or published)
  const existingReview = await getReviewBySubmission(params.submissionId);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Review Submission</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Athlete: <strong>{submission.athleteName}</strong></span>
          <span>•</span>
          <span>Skill: <strong>{submission.skillName}</strong></span>
          <span>•</span>
          <span>Submitted: <strong>{new Date(submission.submittedAt as any).toLocaleDateString()}</strong></span>
          {submission.slaDeadline && (
            <>
              <span>•</span>
              <span className={submission.slaBreach ? 'text-red-600 font-semibold' : ''}>
                SLA: <strong>{new Date(submission.slaDeadline as any).toLocaleDateString()}</strong>
                {submission.slaBreach && ' (BREACHED)'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Athlete Context */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Athlete Context</h3>
        <p className="text-gray-700 mb-2">{submission.athleteContext}</p>
        {submission.athleteGoals && (
          <>
            <h4 className="font-semibold mt-3 mb-1">Goals:</h4>
            <p className="text-gray-700">{submission.athleteGoals}</p>
          </>
        )}
        {submission.specificQuestions && (
          <>
            <h4 className="font-semibold mt-3 mb-1">Specific Questions:</h4>
            <p className="text-gray-700">{submission.specificQuestions}</p>
          </>
        )}
      </div>

      {/* Review Form */}
      <ReviewForm
        submission={submission}
        rubric={rubric}
        existingReview={existingReview}
        coachId={user.uid}
        coachName={user.displayName || 'Coach'}
        coachPhotoUrl={user.photoURL || undefined}
      />
    </div>
  );
}