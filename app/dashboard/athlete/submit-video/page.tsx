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
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Detect if page is loaded in iframe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embeddedParam = params.get('embedded') === 'true';
    const windowCheck = window.self !== window.top;
    setIsEmbedded(embeddedParam || windowCheck);
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (!user) return;

    // Simple loading complete - no data fetching needed
    setIsLoading(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className={`${isEmbedded ? 'p-4' : 'container mx-auto px-4 py-8'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`${isEmbedded ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>Submit Video for Review</h1>
          <p className="mt-2 text-gray-600">
            Upload a video of your performance to receive personalized feedback from your coach.
          </p>
        </div>

        <SubmissionForm user={user} />
      </div>
    </div>
  );
}