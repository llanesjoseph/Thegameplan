import PricingPlans from '@/components/pricing/PricingPlans'
import { Sparkles, Target, Crown, Shield } from 'lucide-react'

export default function Subscribe() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
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
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              Premium Training Platform
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Choose Your Training
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pathway
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Unlock premium lessons, AI-powered coaching, and exclusive live sessions with world-class instructors. 
              Take your skills to the next level.
            </p>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-slate-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 border-2 border-slate-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 border-2 border-slate-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 border-2 border-slate-900"></div>
                </div>
                <span className="text-sm font-medium">5,000+ Active Students</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
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
            <h2 className="text-2xl font-bold text-center text-white mb-8">What's Included</h2>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Basic Plan</h3>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Access to free lessons</li>
                    <li>• Basic skill tutorials</li>
                    <li>• Community access</li>
                    <li>• Mobile app access</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Pro Plan</h3>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Everything in Basic</li>
                    <li>• Premium lesson library</li>
                    <li>• AI coaching assistant</li>
                    <li>• Progress tracking</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Elite Plan</h3>
                  <ul className="text-sm text-slate-300 space-y-1">
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
            <p className="text-slate-400 mb-6">Trusted by athletes and coaches worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-xs font-semibold text-slate-500 px-3 py-1 border border-slate-700 rounded">
                30-DAY GUARANTEE
              </div>
              <div className="text-xs font-semibold text-slate-500 px-3 py-1 border border-slate-700 rounded">
                CANCEL ANYTIME
              </div>
              <div className="text-xs font-semibold text-slate-500 px-3 py-1 border border-slate-700 rounded">
                SECURE PAYMENTS
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}