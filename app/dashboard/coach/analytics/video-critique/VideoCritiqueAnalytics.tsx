'use client';

import { Card } from '@/components/ui/card';
import { Submission } from '@/types/video-critique';
import { TrendingUp, Clock, Star, CheckCircle } from 'lucide-react';

interface VideoCritiqueAnalyticsProps {
  coachId: string;
  initialStats: {
    totalReviews: number;
    averageSatisfaction: number;
    averageTurnaroundHours: number;
    reviewsThisWeek: number;
    reviewsThisMonth: number;
  };
  submissions: Submission[];
}

export default function VideoCritiqueAnalytics({
  coachId,
  initialStats,
  submissions,
}: VideoCritiqueAnalyticsProps) {
  const stats = [
    {
      label: 'Total Reviews',
      value: initialStats.totalReviews,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Avg. Satisfaction',
      value: `${initialStats.averageSatisfaction.toFixed(1)}/5`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Avg. Turnaround',
      value: `${initialStats.averageTurnaroundHours}h`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'This Week',
      value: initialStats.reviewsThisWeek,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // Calculate additional metrics
  const completedSubmissions = submissions.filter(s => s.status === 'complete').length;
  const inProgressSubmissions = submissions.filter(
    s => s.status === 'claimed' || s.status === 'in_review'
  ).length;
  const slaBreachCount = submissions.filter(s => s.slaBreach).length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedSubmissions}</p>
          <p className="text-xs text-gray-500 mt-1">Total completed reviews</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{inProgressSubmissions}</p>
          <p className="text-xs text-gray-500 mt-1">Currently reviewing</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">SLA Breaches</h3>
          <p className="text-2xl font-bold text-red-600">{slaBreachCount}</p>
          <p className="text-xs text-gray-500 mt-1">Submissions past deadline</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No submissions yet</p>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 10).map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{submission.athleteName}</p>
                  <p className="text-sm text-gray-600">{submission.skillName}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'complete'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'claimed' || submission.status === 'in_review'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {submission.status.replace('_', ' ')}
                  </span>
                  {submission.slaBreach && (
                    <p className="text-xs text-red-600 mt-1">SLA breach</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
