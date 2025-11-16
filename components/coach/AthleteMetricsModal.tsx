'use client'

import { X, TrendingUp, CheckCircle, Clock, Video } from 'lucide-react'

interface AthleteMetricsModalProps {
  isOpen: boolean
  onClose: () => void
  athlete: {
    name: string
    imageUrl?: string
  }
  metrics: {
    submissions: number
    videosAwaiting: number
    lastActivity?: string
    lessons?: number
    lessonsCompleted?: number
    lessonsUnfinished?: number
  } | null
  isLoading: boolean
}

export default function AthleteMetricsModal({
  isOpen,
  onClose,
  athlete,
  metrics,
  isLoading
}: AthleteMetricsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-cream via-cream to-sky-blue/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/80 hover:bg-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: '#000000' }} />
          </button>

          {/* Profile Image */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-gray-100">
              {athlete.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.imageUrl}
                  alt={athlete.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                  <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-6 px-6">
          <h2
            className="text-2xl font-bold text-center mb-6"
            style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
          >
            {athlete.name}
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 rounded-full border-4 border-black border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-gray-600" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                Loading metrics...
              </p>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              {/* Video Submissions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-5 h-5" style={{ color: '#FC0105' }} />
                      <h3
                        className="text-sm font-bold"
                        style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        Video Submissions
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                          Awaiting Review
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                        >
                          {metrics.videosAwaiting}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                          Total Submissions
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                        >
                          {metrics.submissions}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons Progress */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" style={{ color: '#00A651' }} />
                      <h3
                        className="text-sm font-bold"
                        style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        Training Progress
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: '#00A651', fontFamily: '"Open Sans", sans-serif' }}
                        >
                          {metrics.lessonsCompleted ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                          <Clock className="w-3 h-3" />
                          Unfinished
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                        >
                          {metrics.lessonsUnfinished ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Activity */}
              {metrics.lastActivity && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                    Last Active: {new Date(metrics.lastActivity).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p style={{ fontFamily: '"Open Sans", sans-serif' }}>No metrics available</p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
