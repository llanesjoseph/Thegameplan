'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Trophy, Star, Target, ArrowRight, BookOpen, Video, MessageSquare } from 'lucide-react'

interface LessonCompletionCelebrationProps {
  isOpen: boolean
  onClose: () => void
  lessonTitle: string
  totalCompleted: number
  onViewCompletedLessons: () => void
  onRequestVideoReview: () => void
  onAskCoach: () => void
}

export default function LessonCompletionCelebration({
  isOpen,
  onClose,
  lessonTitle,
  totalCompleted,
  onViewCompletedLessons,
  onRequestVideoReview,
  onAskCoach
}: LessonCompletionCelebrationProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Celebration Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
          {/* Confetti Animation */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Lesson Complete! 🎉</h2>
            <p className="text-green-100 text-lg">Great job on "{lessonTitle}"</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showContent && (
            <div className="space-y-6 animate-fadeInUp">
              {/* Achievement Stats */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Total Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{totalCompleted}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Streak</p>
                    <p className="text-2xl font-bold text-green-600">🔥</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Progress</p>
                    <p className="text-2xl font-bold text-purple-600">+1</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  What's Next?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onViewCompletedLessons()
                      onClose()
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="flex-1 text-left">View All Completed Lessons</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onRequestVideoReview()
                      onClose()
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Video className="w-5 h-5" />
                    <span className="flex-1 text-left">Request Video Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onAskCoach()
                      onClose()
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="flex-1 text-left">Ask Your Coach</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-center text-gray-700 font-medium">
                  💪 Keep up the momentum! Every lesson brings you closer to your goals.
                </p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continue Training
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }

        .animate-confetti {
          animation: confetti 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
