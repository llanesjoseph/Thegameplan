'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Video, MessageSquare, BookOpen, Home } from 'lucide-react';

export default function SimpleAthleteDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const tools = [
    {
      title: 'Get Feedback',
      description: 'Upload a video for coach review',
      icon: Video,
      href: '/dashboard/athlete/get-feedback',
      color: 'bg-blue-600',
    },
    {
      title: 'Ask Coach AI',
      description: 'Get instant coaching advice',
      icon: MessageSquare,
      href: '#',
      color: 'bg-green-600',
      disabled: true,
    },
    {
      title: 'My Lessons',
      description: 'View your training materials',
      icon: BookOpen,
      href: '#',
      color: 'bg-purple-600',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Home className="w-6 h-6 text-gray-600 mr-3" />
              <h1 className="text-xl font-semibold">Athlete Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.displayName || user?.email}
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            What would you like to do today?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose from the tools below to get started
          </p>
        </div>

        {/* Tool Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.title}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${
                  tool.disabled ? 'opacity-60' : 'hover:shadow-lg transition-shadow cursor-pointer'
                }`}
                onClick={() => !tool.disabled && router.push(tool.href)}
              >
                <div className={`h-2 ${tool.color}`}></div>
                <div className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${tool.color} bg-opacity-10 mb-4`}>
                    <Icon className={`w-6 h-6 ${tool.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>
                  {!tool.disabled ? (
                    <button className="text-blue-600 font-medium hover:text-blue-700">
                      Get Started →
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">Coming Soon</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Message Area */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            💡 Quick Tip
          </h3>
          <p className="text-green-700">
            Use "Get Feedback" to upload videos of your performance. Your coach will review them
            and provide personalized feedback to help you improve!
          </p>
        </div>
      </div>
    </div>
  );
}