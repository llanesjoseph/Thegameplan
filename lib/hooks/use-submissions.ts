import { useState, useCallback, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import {
  getSubmissions,
  getMySubmissions,
  getCoachQueue,
  listenToCoachQueue,
} from '@/lib/data/video-critique';
import {
  Submission,
  SubmissionListFilters,
  PaginationParams,
} from '@/types/video-critique';
import { useAuth } from '@/hooks/use-auth';

interface UseSubmissionsOptions {
  filters?: SubmissionListFilters;
  pagination?: PaginationParams;
  realtime?: boolean;
  type?: 'all' | 'mine' | 'queue';
}

/**
 * Hook to fetch and manage multiple submissions
 */
export function useSubmissions(options: UseSubmissionsOptions = {}) {
  const { user } = useAuth();
  const [realtimeSubmissions, setRealtimeSubmissions] = useState<Submission[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Build SWR key based on options
  const swrKey = useMemo(() => {
    if (!user) return null;

    const keyParts = ['submissions'];

    if (options.type === 'mine') {
      keyParts.push('mine', user.uid);
    } else if (options.type === 'queue') {
      keyParts.push('queue');
      // TODO: Get team ID from user context
      keyParts.push('team-placeholder');
    } else {
      keyParts.push('all');
    }

    if (options.filters) {
      keyParts.push(JSON.stringify(options.filters));
    }

    if (options.pagination) {
      keyParts.push(JSON.stringify(options.pagination));
    }

    return keyParts.join('-');
  }, [user, options.type, options.filters, options.pagination]);

  // Fetcher function
  const fetcher = useCallback(async () => {
    if (!user) return { items: [], hasMore: false };

    switch (options.type) {
      case 'mine':
        return getMySubmissions(user.uid, options.pagination);

      case 'queue':
        // TODO: Get team ID from user context
        const teamId = 'team-placeholder';
        return getCoachQueue(teamId, options.pagination);

      default:
        return getSubmissions(options.filters, options.pagination);
    }
  }, [user, options.type, options.filters, options.pagination]);

  // SWR for data fetching and caching
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: options.realtime ? 0 : undefined, // Disable polling if using real-time
    }
  );

  // Set up real-time listener for coach queue
  useEffect(() => {
    if (!user || !options.realtime || options.type !== 'queue') return;

    setIsListening(true);
    // TODO: Get team ID from user context
    const teamId = 'team-placeholder';

    const unsubscribe = listenToCoachQueue(teamId, (submissions) => {
      setRealtimeSubmissions(submissions);
      // Update SWR cache with real-time data
      mutate({ items: submissions, hasMore: false }, false);
    });

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [user, options.realtime, options.type, mutate]);

  // Load more for pagination
  const loadMore = useCallback(async () => {
    if (!data?.hasMore || !data.lastDoc) return;

    const newPagination: PaginationParams = {
      ...options.pagination,
      startAfter: data.lastDoc,
    };

    const result = await fetcher();

    // Merge with existing items
    mutate(
      {
        items: [...(data.items || []), ...result.items],
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
      },
      false
    );
  }, [data, options.pagination, fetcher, mutate]);

  // Filter submissions client-side (useful for real-time filtering)
  const filterSubmissions = useCallback(
    (submissions: Submission[], filters: SubmissionListFilters) => {
      let filtered = [...submissions];

      if (filters.status) {
        filtered = filtered.filter((s) => s.status === filters.status);
      }

      if (filters.athleteUid) {
        filtered = filtered.filter((s) => s.athleteUid === filters.athleteUid);
      }

      if (filters.coachUid) {
        filtered = filtered.filter((s) => s.claimedBy === filters.coachUid);
      }

      if (filters.slaBreach !== undefined) {
        filtered = filtered.filter((s) => s.slaBreach === filters.slaBreach);
      }

      return filtered;
    },
    []
  );

  // Determine which submissions to use
  const submissions = useMemo(() => {
    if (options.realtime && realtimeSubmissions.length > 0) {
      return realtimeSubmissions;
    }
    return data?.items || [];
  }, [options.realtime, realtimeSubmissions, data]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const awaiting = submissions.filter((s) => s.status === 'awaiting_coach').length;
    const claimed = submissions.filter((s) => s.status === 'claimed').length;
    const inReview = submissions.filter((s) => s.status === 'in_review').length;
    const complete = submissions.filter((s) => s.status === 'complete').length;
    const breached = submissions.filter((s) => s.slaBreach).length;

    return {
      total,
      awaiting,
      claimed,
      inReview,
      complete,
      breached,
    };
  }, [submissions]);

  return {
    submissions,
    loading: isLoading && submissions.length === 0,
    error,
    hasMore: data?.hasMore || false,
    isListening,
    stats,
    loadMore,
    refresh: mutate,
    filterSubmissions,
  };
}