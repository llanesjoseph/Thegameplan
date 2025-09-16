import PricingPlans from '@/components/pricing/PricingPlans'
import { Sparkles, Target, Crown, Shield } from 'lucide-react'

export default function Subscribe() {
  return (
    <main className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cardinal/10 border border-cardinal/20 text-cardinal text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              Premium Training Platform
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-gray-800 tracking-tight">
              Choose Your Training Pathway
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Unlock premium lessons, AI-powered coaching, and exclusive live sessions with world-class instructors. 
              Take your skills to the next level.
            </p>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-cardinal/20 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white"></div>
                </div>
                <span className="text-sm font-medium">5,000+ Active Students</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-500">
                  <span>★★★★★</span>
                </div>
                <span className="text-sm font-medium">4.9/5 Average Rating</span>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="mb-16">
            <PricingPlans />
          </div>

          {/* Features Comparison */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">What's Included</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-card">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Basic Plan</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access to free lessons</li>
                    <li>• Basic skill tutorials</li>
                    <li>• Community access</li>
                    <li>• Mobile app access</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Pro Plan</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Everything in Basic</li>
                    <li>• Premium lesson library</li>
                    <li>• AI coaching assistant</li>
                    <li>• Progress tracking</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-cardinal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-cardinal" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Elite Plan</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Everything in Pro</li>
                    <li>• Live coaching sessions</li>
                    <li>• 1-on-1 mentorship</li>
                    <li>• Exclusive masterclasses</li>
                    <li>• Advanced analytics</li>
                    <li>• Early access to new content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-6">Trusted by athletes and coaches worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-80">
              <div className="text-xs font-semibold text-gray-600 px-3 py-1 border border-gray-200 rounded">
                30-DAY GUARANTEE
              </div>
              <div className="text-xs font-semibold text-gray-600 px-3 py-1 border border-gray-200 rounded">
                CANCEL ANYTIME
              </div>
              <div className="text-xs font-semibold text-gray-600 px-3 py-1 border border-gray-200 rounded">
                SECURE PAYMENTS
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}