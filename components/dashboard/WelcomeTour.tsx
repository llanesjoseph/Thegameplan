'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface TourStep {
  id: number
  title: string
  description: string
  target?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "Welcome to Your Dashboard! 🎉",
    description: "This is your command center where you'll track progress, access lessons, and connect with coaches.",
    position: 'center'
  },
  {
    id: 2,
    title: "Quick Actions",
    description: "These cards give you instant access to your most important features. Click any card to get started!",
    target: '[data-tour="quick-actions"]',
    position: 'bottom'
  },
  {
    id: 3,
    title: "Your Recent Activity",
    description: "Stay updated with your latest achievements, completed lessons, and coaching interactions.",
    target: '[data-tour="recent-activity"]',
    position: 'top'
  },
  {
    id: 4,
    title: "Personalized Recommendations",
    description: "We'll suggest relevant content and next steps based on your goals and progress.",
    target: '[data-tour="recommendations"]',
    position: 'top'
  },
  {
    id: 5,
    title: "Navigation Menu",
    description: "Use the sidebar to explore all features. Your menu adapts based on your role and permissions.",
    target: '[data-tour="sidebar"]',
    position: 'right'
  }
]

interface WelcomeTourProps {
  onComplete: () => void
}

export default function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Show tour if welcome parameter is present
    if (searchParams.get('welcome') === 'true') {
      setIsVisible(true)
      // Remove the welcome parameter from URL
      const newUrl = window.location.pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router])

  const currentStepData = tourSteps.find(step => step.id === currentStep)!

  const nextStep = () => {
    if (currentStep < tourSteps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    setIsVisible(false)
    onComplete()
    // Store that user has seen the tour
    localStorage.setItem('dashboard-tour-completed', 'true')
  }

  const skipTour = () => {
    completeTour()
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      
      {/* Tour Tooltip */}
      <div className={`
        fixed z-50 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-6
        ${currentStepData.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''}
        ${currentStepData.position === 'top' ? 'top-4 left-1/2 transform -translate-x-1/2' : ''}
        ${currentStepData.position === 'bottom' ? 'bottom-4 left-1/2 transform -translate-x-1/2' : ''}
        ${currentStepData.position === 'left' ? 'left-4 top-1/2 transform -translate-y-1/2' : ''}
        ${currentStepData.position === 'right' ? 'right-4 top-1/2 transform -translate-y-1/2' : ''}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-clarity-accent rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{currentStepData.title}</h3>
              <p className="text-xs text-gray-500">Step {currentStep} of {tourSteps.length}</p>
            </div>
          </div>
          <button
            onClick={skipTour}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {currentStepData.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round((currentStep / tourSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-clarity-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / tourSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${currentStep === 1 
                ? 'opacity-50 cursor-not-allowed text-gray-400' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={skipTour}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-clarity-accent text-white rounded-lg text-sm font-medium hover:bg-clarity-accent/90 transition-colors"
            >
              {currentStep === tourSteps.length ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlight Target Element */}
      {currentStepData.target && (
        <style jsx global>{`
          ${currentStepData.target} {
            position: relative;
            z-index: 51;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            transition: all 0.3s ease;
          }
        `}</style>
      )}
    </>
  )
}
