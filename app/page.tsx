'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Trophy, Users, BookOpen, Zap, CheckCircle, Star } from 'lucide-react'
import ClarityButton from '@/components/ui/NexusButton'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-cream/95 border-b border-sky-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758004832/0cfb867d-daad-453a-bce5-7f861c04e1c1_i0k0z8.png"
                alt="Game Plan"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className="text-xl font-bold tracking-tight text-deep-plum">
                GAME PLAN
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-dark hover:text-sky-blue transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-dark hover:text-sky-blue transition-colors">
                Benefits
              </a>
              <a href="#testimonials" className="text-dark hover:text-sky-blue transition-colors">
                Testimonials
              </a>
            </div>

            {/* CTA Button */}
            <Link href="/dashboard">
              <ClarityButton variant="primary" size="md">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </ClarityButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-blue/10 text-sky-blue px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              Elite Coaching Platform
            </div>

            {/* Hero Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-dark mb-6 leading-tight">
              Master Your Sport with
              <span className="block text-sky-blue">Game Plan</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl text-dark/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate platform for athletes, coaches, and sports enthusiasts.
              Create, learn, and excel with professional-grade training content.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/dashboard">
                <ClarityButton variant="primary" size="lg" className="w-full sm:w-auto">
                  Start Training Now
                  <ArrowRight className="w-5 h-5" />
                </ClarityButton>
              </Link>
              <ClarityButton variant="secondary" size="lg" className="w-full sm:w-auto">
                Watch Demo
              </ClarityButton>
            </div>

            {/* Hero Image/Video Placeholder */}
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-sky-blue/20">
                <div className="aspect-video bg-gradient-to-br from-sky-blue/20 to-green/20 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 text-sky-blue mx-auto mb-4" />
                    <p className="text-dark/60 text-lg">Platform Preview Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-dark mb-6">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-dark/70 max-w-2xl mx-auto">
              Professional tools and resources designed for athletes, coaches, and sports organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-cream rounded-2xl p-8 border border-sky-blue/20 hover:border-sky-blue/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-sky-blue/20 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-sky-blue" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">AI-Powered Lesson Creation</h3>
              <p className="text-dark/70 mb-6">
                Generate professional lesson plans with our advanced AI that understands sports pedagogy and coaching methodologies.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Elite coaching expertise
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Custom technique breakdowns
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Progressive skill development
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-cream rounded-2xl p-8 border border-sky-blue/20 hover:border-sky-blue/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-orange/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-orange" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Multi-Sport Platform</h3>
              <p className="text-dark/70 mb-6">
                Support for all sports with specialized coaching tools, techniques, and training methodologies for every discipline.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  BJJ, Soccer, Basketball & more
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Sport-specific terminology
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Competition preparation
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-cream rounded-2xl p-8 border border-sky-blue/20 hover:border-sky-blue/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-green" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Professional Analytics</h3>
              <p className="text-dark/70 mb-6">
                Track progress, analyze performance, and optimize training with comprehensive analytics and reporting tools.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Performance tracking
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Progress visualization
                </li>
                <li className="flex items-center gap-2 text-dark/70">
                  <CheckCircle className="w-4 h-4 text-green" />
                  Data-driven insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-dark mb-6">
                Why Choose Game Plan?
              </h2>
              <p className="text-xl text-dark/70 mb-8">
                Join thousands of athletes and coaches who trust Game Plan for their training and development needs.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-sky-blue/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Trophy className="w-4 h-4 text-sky-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark mb-2">Elite-Level Expertise</h3>
                    <p className="text-dark/70">
                      Access coaching methodologies used by world champions and Olympic athletes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-4 h-4 text-orange" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark mb-2">Instant Results</h3>
                    <p className="text-dark/70">
                      Generate professional lesson plans in seconds, not hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark mb-2">Community Driven</h3>
                    <p className="text-dark/70">
                      Learn from and collaborate with a global community of coaches and athletes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-sky-blue/20">
                <div className="aspect-square bg-gradient-to-br from-sky-blue/20 via-green/20 to-orange/20 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-sky-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-12 h-12 text-sky-blue" />
                    </div>
                    <p className="text-dark/60 text-lg">Interactive Demo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sky-blue to-sky-blue/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Training?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join Game Plan today and experience the future of sports coaching and training.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <ClarityButton variant="orange" size="lg" className="w-full sm:w-auto">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </ClarityButton>
            </Link>
            <ClarityButton variant="ghost" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
              Learn More
            </ClarityButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-dark">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Image
                src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758004832/0cfb867d-daad-453a-bce5-7f861c04e1c1_i0k0z8.png"
                alt="Game Plan"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-cream">
                GAME PLAN
              </span>
            </div>

            <div className="flex items-center gap-6 text-cream/70">
              <Link href="/privacy" className="hover:text-cream transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-cream transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-cream transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="border-t border-cream/20 mt-8 pt-8 text-center">
            <p className="text-cream/70">
              © 2025 Game Plan. All rights reserved. Built for athletes, by athletes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}