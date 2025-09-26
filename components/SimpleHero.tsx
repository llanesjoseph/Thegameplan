'use client'

import React from 'react'
import Link from 'next/link'
import { Target, Zap, TrendingUp } from 'lucide-react'
import ClarityButton from './ui/NexusButton'
import ClarityCard from './ui/NexusCard'

const SimpleHero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-clarity-background pt-16">
      <div className="clarity-container">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Headline */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-accent/10 border border-clarity-accent/20 rounded-full text-clarity-accent text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Sports Performance
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-primary font-bold text-playbookd-dark mb-6 leading-tight">
              Your AI Coach for{' '}
              <span className="text-playbookd-red">Athletic Excellence</span>
            </h1>
            
            <p className="text-xl text-playbookd-dark/80 mb-8 max-w-3xl mx-auto leading-relaxed font-body">
              PlayBookd blends the power of AI with the thrill of sports, creating unforgettable fan experiences and 
              coaching next-generation athletes. Whether you're in the stands or on the field, this is the future of the game.
            </p>
          </div>

          {/* Key Features - Minimal */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-playbookd-sky-blue/10 border border-playbookd-sky-blue/30 rounded-full text-playbookd-deep-sea text-sm font-primary">
              <Target className="w-4 h-4 text-playbookd-sky-blue" />
              Personalized Training
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-playbookd-green/10 border border-playbookd-green/30 rounded-full text-playbookd-deep-sea text-sm font-primary">
              <TrendingUp className="w-4 h-4 text-playbookd-green" />
              Performance Analytics
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-playbookd-cream/20 border border-playbookd-cream/50 rounded-full text-playbookd-dark text-sm font-primary">
              <Zap className="w-4 h-4 text-playbookd-dark" />
              AI-Driven Insights
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/onboarding">
              <button className="btn-playbookd-primary px-8 py-4 text-lg">
                Start Free Trial
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-playbookd-outline px-8 py-4 text-lg">
                Sign In
              </button>
            </Link>
          </div>

          {/* Simple Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-playbookd-red font-primary">50K+</span>
              <span className="text-sm text-playbookd-dark/70 font-body">Active Athletes</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-playbookd-dark/20"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-playbookd-red font-primary">95%</span>
              <span className="text-sm text-playbookd-dark/70 font-body">Success Rate</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-playbookd-dark/20"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-playbookd-red font-primary">4.9★</span>
              <span className="text-sm text-playbookd-dark/70 font-body">User Rating</span>
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
