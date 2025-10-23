'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Play, User, Clock, Eye, Tag } from 'lucide-react'
import Link from 'next/link'

interface LessonPreviewData {
  id: string
  title: string
  description: string
  sport: string
  level: string
  duration: number
  tags: string[]
  createdAt: any
  views: number
  creatorName: string
  isPreview: boolean
  requiresAuth: boolean
}

interface LessonPreviewProps {
  lessonId: string
}

export default function LessonPreview({ lessonId }: LessonPreviewProps) {
  const { user } = useAuth()
  const [lesson, setLesson] = useState<LessonPreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLessonPreview()
  }, [lessonId])

  const fetchLessonPreview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lessons/${lessonId}/preview`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load lesson preview')
      }

      const data = await response.json()
      setLesson(data.lesson)
    } catch (error) {
      console.error('Error fetching lesson preview:', error)
      setError(error instanceof Error ? error.message : 'Failed to load lesson preview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson preview...</p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Preview Not Available</h2>
            <p className="text-red-600 mb-4">{error || 'This lesson is not available for preview.'}</p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In to Access
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              AthLeap
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Preview Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Lesson Preview</h3>
              <p className="text-blue-600 text-sm">
                This is a preview of the lesson. Sign in to access the full content, videos, and training materials.
              </p>
            </div>
          </div>
        </div>

        {/* Lesson Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{lesson.creatorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{lesson.views} views</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {lesson.level}
              </span>
            </div>
          </div>

          {lesson.description && (
            <p className="text-gray-700 mb-4">{lesson.description}</p>
          )}

          {lesson.tags && lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {lesson.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Sport: <span className="font-medium">{lesson.sport}</span>
              </div>
              <div className="text-sm text-gray-500">
                Created: {lesson.createdAt ? new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Content Available</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This lesson includes video content, detailed instructions, and training materials. 
              Sign in to access the complete learning experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Lock className="w-4 h-4" />
                Sign In to Access Full Lesson
              </Link>
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        {/* Related Lessons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">More Training Available</h3>
          <p className="text-gray-600 mb-4">
            Join AthLeap to access hundreds of training lessons from professional coaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/coaches" 
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Coaches
            </Link>
            <Link 
              href="/lessons" 
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse All Lessons
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
