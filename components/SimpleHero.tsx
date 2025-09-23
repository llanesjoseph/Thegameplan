'use client'

import React from 'react'
import Link from 'next/link'
import ClarityButton from './ui/NexusButton'
import HeaderAuthButton from './auth/HeaderAuthButton'

const SimpleHero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="clarity-container">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Headline */}
          <div className="mb-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-clarity-text-primary mb-6 leading-tight">
              Your AI Coach for{' '}
              <span className="clarity-gradient-text">Athletic Excellence</span>
            </h1>

            <p className="text-xl text-clarity-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Get personalized training insights, adaptive learning paths, and intelligent coaching
              that evolves with your performance. Join thousands of athletes achieving their goals.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/subscribe">
              <ClarityButton variant="primary" size="lg" className="px-8 py-4 text-lg">
                Get Started
              </ClarityButton>
            </Link>
            <HeaderAuthButton />
          </div>

        </div>
      </div>
    </div>
  )
}

export default SimpleHero
