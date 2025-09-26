'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import CoachApplicationForm from '@/components/coach/CoachApplicationForm'
import { 
  Star, 
  Users, 
  DollarSign, 
  Calendar, 
  Award, 
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Globe,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function BecomeCoachPage() {
  const { user } = useAuth()
  const [showApplication, setShowApplication] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Money',
      description: 'Set your own rates and earn money sharing your expertise with athletes worldwide.'
    },
    {
      icon: Users,
      title: 'Impact Lives',
      description: 'Help athletes achieve their goals and make a meaningful difference in their journey.'
    },
    {
      icon: Calendar,
      title: 'Flexible Schedule',
      description: 'Work on your own schedule with complete control over your availability.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with athletes from around the world and build your coaching brand.'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Brand',
      description: 'Build your reputation and expand your coaching business with our platform.'
    },
    {
      icon: Award,
      title: 'Recognition',
      description: 'Get recognized for your expertise and build credibility in your sport.'
    }
  ]

  const requirements = [
    'Proven experience in your sport (competitive or coaching background)',
    'Strong communication skills and passion for teaching',
    'Ability to provide clear, constructive feedback',
    'Commitment to helping athletes improve and reach their goals',
    'Professional attitude and reliability',
    'Basic technology skills for online coaching sessions'
  ]

  const process = [
    {
      step: 1,
      title: 'Submit Application',
      description: 'Fill out our comprehensive application form with your background and expertise.'
    },
    {
      step: 2,
      title: 'Review Process',
      description: 'Our team reviews your application and credentials (typically 3-5 business days).'
    },
    {
      step: 3,
      title: 'Approval & Setup',
      description: 'Once approved, set up your profile and start connecting with athletes.'
    },
    {
      step: 4,
      title: 'Start Coaching',
      description: 'Begin accepting coaching requests and building your reputation on the platform.'
    }
  ]

  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a coach. We'll review your application and get back to you within 3-5 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard/overview"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (showApplication) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <CoachApplicationForm
          onSuccess={() => setApplicationSubmitted(true)}
          onCancel={() => setShowApplication(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Become a Coach
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Share your expertise, inspire athletes, and build your coaching career on our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <button
                  onClick={() => setShowApplication(true)}
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Apply Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  Sign In to Apply
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                href="#learn-more"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="learn-more" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Coach With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join a community of elite coaches and make a meaningful impact while building your career
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Coach Requirements
            </h2>
            <p className="text-xl text-gray-600">
              We're looking for passionate, experienced coaches who want to make a difference
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-4">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">{requirement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Process
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to join our coaching community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-8 h-0.5 bg-gray-300 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Active Athletes</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Expert Coaches</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Start Coaching?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our community of elite coaches and start making an impact today
          </p>
          
          {user ? (
            <button
              onClick={() => setShowApplication(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Sign In to Apply
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-gray-600">
                Don't have an account? Sign up when you click above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How much can I earn as a coach?
              </h3>
              <p className="text-gray-600">
                Coaches set their own hourly rates, typically ranging from $30-150+ per hour depending on experience and specialization. Top coaches on our platform earn $2,000+ per month.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What sports can I coach?
              </h3>
              <p className="text-gray-600">
                We support a wide range of sports including martial arts (BJJ, MMA, Boxing), team sports (Soccer, Basketball), individual sports (Tennis, Golf), and more. If you have expertise in any sport, we'd love to have you apply.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long does the application process take?
              </h3>
              <p className="text-gray-600">
                Our review process typically takes 3-5 business days. We carefully review each application to ensure we maintain the highest quality coaching standards on our platform.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do I need any special equipment?
              </h3>
              <p className="text-gray-600">
                You'll need a reliable internet connection, a computer or tablet with a camera, and a quiet space for coaching sessions. For sport-specific coaching, having relevant equipment for demonstrations can be helpful but isn't required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
