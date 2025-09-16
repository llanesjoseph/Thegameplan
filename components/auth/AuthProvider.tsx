'use client'

import { useState } from 'react'
import GoogleSignInButton from './GoogleSignInButton'
import EmailSignInButton from './EmailSignInButton'
import AppleSignInButton from './AppleSignInButton'
import { ClarityCard } from '@/components/ui/ClarityCard'
import { Users, Shield, Zap } from 'lucide-react'

interface AuthProviderProps {
  className?: string
  variant?: 'default' | 'compact'
  title?: string
  subtitle?: string
  showBenefits?: boolean
  returnUserPrompt?: boolean
}

export default function AuthProvider({ 
  className = '',
  variant = 'default',
  title = 'Sign in to Game Plan',
  subtitle = 'Join thousands of athletes training with elite coaches',
  showBenefits = true,
  returnUserPrompt = false
}: AuthProviderProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const benefits = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Elite Coaching",
      description: "Train with world-class athletes and coaches"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Personalized Training",
      description: "Get custom training plans for your goals"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Progress Tracking",
      description: "Monitor your improvement over time"
    }
  ]

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        {returnUserPrompt && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Returning user? Sign in with your preferred method
            </p>
          </div>
        )}
        <div className="space-y-3">
          <GoogleSignInButton size="md" variant="default" />
          <AppleSignInButton size="md" variant="default" />
          <EmailSignInButton size="md" variant="outline" />
        </div>
        {returnUserPrompt && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-600">
              New to Game Plan? Just sign in with any method above to get started
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <ClarityCard variant="glass" className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-cardinal rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {title}
          </h1>
          <p className="text-base text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Auth Methods */}
        <div className="space-y-4 mb-6">
          {selectedMethod === 'email' ? (
            <EmailSignInButton size="md" variant="default" />
          ) : (
            <>
              <GoogleSignInButton size="md" variant="default" />
              <AppleSignInButton size="md" variant="default" />
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-600">
                    or
                  </span>
                </div>
              </div>
              
              <EmailSignInButton size="md" variant="outline" />
            </>
          )}
        </div>

        {/* Benefits Section */}
        {showBenefits && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-600">
                  Why join Game Plan?
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-cardinal/10 rounded-full flex items-center justify-center text-cardinal">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Terms */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-cardinal hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-cardinal hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </ClarityCard>
    </div>
  )
}
