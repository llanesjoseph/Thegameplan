// Re-export all submission-related functions from video-critique
export {
  createSubmission,
  getSubmission,
  getSubmissions,
  updateSubmission,
  claimSubmission,
  getCoachQueue,
  getMySubmissions,
  listenToSubmission,
  listenToCoachQueue,
} from './video-critique';

// Additional helper function for coach submissions
export async function getCoachSubmissions(
  coachUid: string,
  pagination?: any,
  limit?: number
) {
  const { getSubmissions } = await import('./video-critique');
  return getSubmissions(
    { coachUid },
    { ...pagination, limit: limit || 20 }
  );
}
