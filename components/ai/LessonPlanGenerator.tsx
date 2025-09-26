'use client'

import React, { useState } from 'react'
import { Send, Bot, BookOpen, Clock, Users, Target, Download, Copy, RefreshCw } from 'lucide-react'

interface LessonPlanGeneratorProps {
  userId?: string
  userEmail?: string
  onClose?: () => void
}

const LessonPlanGenerator: React.FC<LessonPlanGeneratorProps> = ({
  userId,
  userEmail,
  onClose
}) => {
  const [formData, setFormData] = useState({
    sport: 'Brazilian Jiu-Jitsu',
    topic: '',
    level: 'Intermediate',
    duration: 45
  })
  const [generatedPlan, setGeneratedPlan] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')

  const sports = [
    'Brazilian Jiu-Jitsu',
    'Mixed Martial Arts (MMA)',
    'Boxing',
    'Wrestling',
    'Judo',
    'Muay Thai',
    'Karate',
    'Taekwondo',
    'Soccer',
    'Basketball',
    'Tennis',
    'Baseball',
    'Football',
    'Volleyball',
    'Swimming',
    'Track and Field'
  ]

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
  const durations = [30, 45, 60, 90, 120]

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a lesson topic')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `Create a lesson plan for ${formData.topic}`,
          requestType: 'lesson_plan',
          sport: formData.sport,
          topic: formData.topic,
          level: formData.level,
          duration: formData.duration,
          userId,
          userEmail
        }),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate lesson plan')
      }

      setGeneratedPlan(data.response)
    } catch (error) {
      console.error('Error generating lesson plan:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate lesson plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPlan)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([generatedPlan], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.sport}_${formData.topic.replace(/\s+/g, '_')}_Lesson_Plan.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Lesson Plan Generator</h2>
            <p className="text-gray-600 text-sm">Create detailed, professional lesson plans for any sport</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Form */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Sport
            </label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Skill Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {durations.map(duration => (
                <option key={duration} value={duration}>{duration} minutes</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Lesson Topic *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Guard Retention and Recovery, Shooting Accuracy, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.topic.trim()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                Generate Lesson Plan
              </>
            )}
          </button>
        </div>

        {/* Generated Plan */}
        {generatedPlan && (
          <div className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Generated Lesson Plan</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {generatedPlan}
              </pre>
            </div>
          </div>
        )}

        {/* Example Topics */}
        {!generatedPlan && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Example Lesson Topics:</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div>
                <strong>BJJ:</strong> Guard Retention, Submission Chains, Mount Escapes
              </div>
              <div>
                <strong>Boxing:</strong> Footwork Fundamentals, Counter-Punching, Body Work
              </div>
              <div>
                <strong>Soccer:</strong> Passing Accuracy, 1v1 Defending, Set Pieces
              </div>
              <div>
                <strong>MMA:</strong> Takedown Defense, Ground and Pound, Clinch Work
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LessonPlanGenerator
