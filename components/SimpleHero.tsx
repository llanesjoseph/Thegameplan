'use client'

import React from 'react'
import Link from 'next/link'
import { Target, Zap, TrendingUp } from 'lucide-react'
import ClarityButton from './ui/NexusButton'
import ClarityCard from './ui/NexusCard'
import HeaderAuthButton from './auth/HeaderAuthButton'

const SimpleHero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="clarity-container">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Headline */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-accent/10 border border-clarity-accent/20 rounded-full text-clarity-accent text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Sports Performance
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-clarity-text-primary mb-6 leading-tight">
              Your AI Coach for{' '}
              <span className="clarity-gradient-text">Athletic Excellence</span>
            </h1>
            
            <p className="text-xl text-clarity-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Get personalized training insights, adaptive learning paths, and intelligent coaching 
              that evolves with your performance. Join thousands of athletes achieving their goals.
            </p>
          </div>

          {/* Key Features - Minimal */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-surface border border-clarity-text-secondary/20 rounded-full text-clarity-text-primary text-sm">
              <Target className="w-4 h-4 text-clarity-accent" />
              Personalized Training
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-surface border border-clarity-text-secondary/20 rounded-full text-clarity-text-primary text-sm">
              <TrendingUp className="w-4 h-4 text-clarity-accent" />
              Performance Analytics
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-surface border border-clarity-text-secondary/20 rounded-full text-clarity-text-primary text-sm">
              <Zap className="w-4 h-4 text-clarity-accent" />
              AI-Driven Insights
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/subscribe">
              <ClarityButton variant="primary" size="lg" className="px-8 py-4 text-lg">
                Get Started
              </ClarityButton>
            </Link>
            <HeaderAuthButton />
          </div>

          {/* Simple Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div className="flex flex-col">
              <span className="text-sm text-clarity-text-secondary">Trusted by athletes worldwide</span>
            </div>
          </div>

          {/* Optional: Simple Feature Preview */}
          <div className="mt-20">
            <ClarityCard variant="glass" className="max-w-2xl mx-auto p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-clarity-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-clarity-text-primary mb-3">
                  Intelligent Performance Tracking
                </h3>
                <p className="text-clarity-text-secondary">
                  Our AI analyzes your training data, identifies patterns, and provides 
                  personalized recommendations to optimize your athletic performance.
                </p>
              </div>
            </ClarityCard>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SimpleHero
