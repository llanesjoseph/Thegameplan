'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Mic,
  MessageCircle,
  Trophy,
  Target,
  Users,
  Heart,
  Brain,
  ChevronRight,
  CheckCircle,
  Star,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react'

interface VoiceCaptureData {
  coachingPhilosophy: string
  communicationStyle: string
  motivationApproach: string
  keyStories: string[]
  catchphrases: string[]
  currentContext: string
  technicalFocus: string
  careerHighlights: string
  specificExamples: string[]
  personalityTraits: string[]
}

interface Question {
  key: keyof VoiceCaptureData
  label: string
  placeholder: string
  type: 'textarea' | 'text' | 'select' | 'phrase-array' | 'story-array' | 'example-array'
  options?: string[]
}

interface Step {
  title: string
  description: string
  questions: Question[]
}

interface StreamlinedVoiceCaptureProps {
  onComplete: (data: any) => void
  onProgress: (progress: number) => void
  existingProfile?: any
}

export default function StreamlinedVoiceCapture({ onComplete, onProgress, existingProfile }: StreamlinedVoiceCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'quick' | 'detailed' | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<VoiceCaptureData>({
    // Core essentials for authentic AI voice
    coachingPhilosophy: '',
    communicationStyle: '',
    motivationApproach: '',
    keyStories: [],
    catchphrases: [],

    // Quick additions
    currentContext: '',
    technicalFocus: '',

    // Detailed (if they choose detailed mode)
    careerHighlights: '',
    specificExamples: [],
    personalityTraits: []
  })

  const quickModeSteps: Step[] = [
    {
      title: "Your Coaching Voice",
      description: "Help us understand how you communicate",
      questions: [
        { key: 'coachingPhilosophy', label: 'Core Coaching Philosophy', placeholder: 'In 2-3 sentences, what do you believe about coaching?', type: 'textarea' },
        { key: 'communicationStyle', label: 'Communication Style', placeholder: 'How would you describe your communication style?', type: 'select', options: ['Direct & Clear', 'Encouraging & Supportive', 'Analytical & Technical', 'Passionate & Intense', 'Calm & Measured'] }
      ]
    },
    {
      title: "Your Stories & Phrases",
      description: "What makes your coaching unique",
      questions: [
        { key: 'keyStories', label: 'Share 1-2 Key Stories', placeholder: 'Brief stories you often tell athletes (teaching moments, experiences, etc.)', type: 'story-array' },
        { key: 'catchphrases', label: 'Favorite Sayings', placeholder: 'Phrases you use often with athletes', type: 'phrase-array' }
      ]
    },
    {
      title: "Current Context",
      description: "Your current coaching situation",
      questions: [
        { key: 'currentContext', label: 'Current Team/Situation', placeholder: 'Brief description of your current coaching context', type: 'textarea' },
        { key: 'technicalFocus', label: 'Technical Focus Areas', placeholder: 'What do you focus on most in training?', type: 'text' }
      ]
    }
  ]

  const detailedModeSteps: Step[] = [
    ...quickModeSteps,
    {
      title: "Career Highlights",
      description: "Your defining moments",
      questions: [
        { key: 'careerHighlights', label: 'Career Defining Moments', placeholder: 'Key achievements, setbacks, and breakthroughs that shaped you', type: 'textarea' }
      ]
    },
    {
      title: "Specific Examples",
      description: "Real coaching scenarios",
      questions: [
        { key: 'specificExamples', label: 'Coaching Examples', placeholder: 'Specific ways you handle common coaching situations', type: 'example-array' }
      ]
    }
  ]

  const currentSteps = captureMode === 'quick' ? quickModeSteps : detailedModeSteps

  if (!captureMode) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl text-gray-900">Choose Your Voice Capture Experience</h2>
          <p className="text-gray-600">
            Both options create high-quality AI coaching. Choose based on your time preference.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setCaptureMode('quick')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-blue-600" />
                <CardTitle>Quick Capture</CardTitle>
              </div>
              <CardDescription>5-7 minutes • High-quality voice capture</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Core coaching philosophy & style</li>
                <li>✓ Key phrases & communication patterns</li>
                <li>✓ 1-2 signature stories</li>
                <li>✓ Current coaching context</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm font-medium">
                  Perfect for getting started quickly with authentic AI responses
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-green-500 transition-colors" onClick={() => setCaptureMode('detailed')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-green-600" />
                <CardTitle>Detailed Capture</CardTitle>
              </div>
              <CardDescription>12-15 minutes • Maximum voice authenticity</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Everything in Quick Capture</li>
                <li>✓ Career highlights & defining moments</li>
                <li>✓ Multiple coaching scenarios & examples</li>
                <li>✓ Deeper personality & technical details</li>
              </ul>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  Creates the most personalized and nuanced AI coaching voice
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            You can always come back and add more details later to enhance your AI voice
          </p>
        </div>
      </div>
    )
  }

  const currentStepData = currentSteps[currentStep]
  const progress = ((currentStep + 1) / currentSteps.length) * 100

  const updateData = (key: keyof VoiceCaptureData, value: string | string[]) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const addToArray = (key: keyof VoiceCaptureData, value: string) => {
    if (!value.trim()) return
    setData(prev => ({
      ...prev,
      [key]: [...((prev[key] as string[]) || []), value.trim()]
    }))
  }

  const removeFromArray = (key: keyof VoiceCaptureData, index: number) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index)
    }))
  }

  const nextStep = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
      onProgress(progress)
    } else {
      // Add capture mode and quality indicators to the data
      const finalData = {
        ...data,
        captureMode,
        completeness: captureMode === 'quick' ? 'standard' : 'comprehensive',
        capturedAt: new Date().toISOString()
      }
      onComplete(finalData)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      onProgress(((currentStep) / currentSteps.length) * 100)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-sm">
            {captureMode === 'quick' ? '⚡ Quick Capture' : '📚 Detailed Capture'}
          </Badge>
        </div>
        <h1 className="text-2xl text-gray-900">{currentStepData.title}</h1>
        <p className="text-gray-600">{currentStepData.description}</p>
        <Progress value={progress} className="w-full max-w-md mx-auto" />
        <p className="text-sm text-gray-500">
          Step {currentStep + 1} of {currentSteps.length}
        </p>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {currentStepData.questions.map((question, index) => (
            <QuestionRenderer
              key={question.key}
              question={question}
              value={data[question.key]}
              onChange={(value) => updateData(question.key, value)}
              onAddToArray={(value) => addToArray(question.key, value)}
              onRemoveFromArray={(index) => removeFromArray(question.key, index)}
            />
          ))}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <div className="flex items-center gap-3">
              {currentStep === currentSteps.length - 1 && (
                <Button variant="outline" onClick={() => setCaptureMode(null)}>
                  Switch Mode
                </Button>
              )}
              <Button onClick={nextStep}>
                {currentStep === currentSteps.length - 1 ? '✓ Complete Voice Capture' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode-specific encouragement */}
      {captureMode === 'quick' && currentStep === currentSteps.length - 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 Almost Done!</h3>
          <p className="text-blue-800 text-sm">
            You're building a great foundation for authentic AI coaching. You can always return to add more details and enhance your voice further.
          </p>
        </div>
      )}
    </div>
  )
}

interface QuestionRendererProps {
  question: Question
  value: string | string[]
  onChange: (value: string | string[]) => void
  onAddToArray: (value: string) => void
  onRemoveFromArray: (index: number) => void
}

const QuestionRenderer = ({ question, value, onChange, onAddToArray, onRemoveFromArray }: QuestionRendererProps) => {
  const [tempValue, setTempValue] = useState('')

  switch (question.type) {
    case 'textarea':
      return (
        <div>
          <Label>{question.label}</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={3}
            className="mt-2"
          />
        </div>
      )

    case 'text':
      return (
        <div>
          <Label>{question.label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="mt-2"
          />
        </div>
      )

    case 'select':
      return (
        <div>
          <Label>{question.label}</Label>
          <select
            className="w-full p-2 border rounded-md mt-2"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Choose...</option>
            {question.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )

    case 'phrase-array':
      return (
        <div>
          <Label>{question.label}</Label>
          <p className="text-sm text-gray-600 mb-2">{question.placeholder}</p>
          <div className="flex gap-2">
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="Enter a phrase..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onAddToArray(tempValue)
                  setTempValue('')
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                onAddToArray(tempValue)
                setTempValue('')
              }}
              variant="outline"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(Array.isArray(value) ? value : []).map((phrase: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onRemoveFromArray(index)}
              >
                {phrase} ×
              </Badge>
            ))}
          </div>
        </div>
      )

    case 'story-array':
    case 'example-array':
      return (
        <div>
          <Label>{question.label}</Label>
          <p className="text-sm text-gray-600 mb-2">{question.placeholder}</p>
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Share your story or example..."
            rows={3}
          />
          <Button
            type="button"
            onClick={() => {
              if (tempValue.trim()) {
                onAddToArray(tempValue)
                setTempValue('')
              }
            }}
            className="mt-2"
            variant="outline"
          >
            Add {question.type === 'story-array' ? 'Story' : 'Example'}
          </Button>
          <div className="space-y-2 mt-3">
            {(Array.isArray(value) ? value : []).map((item: string, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{item}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveFromArray(index)}
                  className="mt-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}