'use client'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import { Check, Star, Crown, Shield, Zap } from 'lucide-react'

const plans = [
 { 
  name: 'Basic', 
  price: 'Free',
  period: '',
  priceId: process.env.NEXT_PUBLIC_PRICE_BASIC || 'price_basic', 
  blurb: 'Perfect for getting started',
  description: 'Access to essential training content and community features.',
  icon: Shield,
  gradient: 'from-blue-500 to-cyan-500',
  features: [
   'Access to free lessons',
   'Basic skill tutorials', 
   'Community access',
   'Mobile app access',
   'Progress tracking'
  ],
  popular: false
 },
 { 
  name: 'Pro', 
  price: '$19',
  period: '/month',
  priceId: process.env.NEXT_PUBLIC_PRICE_PRO || 'price_pro', 
  blurb: 'Most popular choice',
  description: 'Premium content and AI-powered coaching assistance included in subscription.',
  icon: Star,
  gradient: 'from-purple-500 to-pink-500',
  features: [
   'Everything in Basic',
   'Premium lesson library',
   'AI coaching assistant',
   'Advanced progress tracking',
   'Priority support',
   'Offline content download',
   'Coaching sessions included'
  ],
  popular: true
 },
 { 
  name: 'Elite', 
  price: '$49',
  period: '/month',
  priceId: process.env.NEXT_PUBLIC_PRICE_ELITE || 'price_elite', 
  blurb: 'For serious athletes',
  description: 'Complete training experience with unlimited coaching and exclusive content.',
  icon: Crown,
  gradient: 'from-purple-600 to-pink-600',
  features: [
   'Everything in Pro',
   'Unlimited live coaching sessions',
   'Unlimited 1-on-1 mentorship calls',
   'Exclusive masterclasses',
   'Advanced analytics dashboard',
   'Early access to new content',
   'Custom training plans'
  ],
  popular: false
 }
]

export default function PricingPlans() {
 return (
  <div className="max-w-6xl mx-auto">
   <div className="grid lg:grid-cols-3 gap-8">
    {plans.map((plan, index) => {
     const IconComponent = plan.icon
     return (
      <div
       key={plan.name}
       className={`relative bg-white border rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-card-md ${
        plan.popular
         ? 'border-cardinal/30 shadow-2xl shadow-cardinal/10 ring-2 ring-cardinal/20'
         : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
       }`}
      >
       {/* Popular Badge */}
       {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
         <div className="bg-cardinal text-white text-xs px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-1">
           <Zap className="w-3 h-3" />
           MOST POPULAR
          </div>
         </div>
        </div>
       )}

       {/* Plan Header */}
       <div className="text-center mb-8">
        <div className={`w-16 h-16 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
         <IconComponent className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-2xl text-gray-800 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.blurb}</p>

        {/* Price */}
        <div className="mb-4">
         <div className="flex items-baseline justify-center">
          <span className="text-4xl text-gray-800">{plan.price}</span>
          {plan.period && <span className="text-gray-600 ml-1">{plan.period}</span>}
         </div>
         {plan.price !== 'Free' && (
          <p className="text-xs text-gray-500 mt-1">Billed monthly, cancel anytime</p>
         )}
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
       </div>

       {/* Features List */}
       <div className="mb-8">
        <ul className="space-y-3">
         {plan.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-start gap-3">
           <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Check className="w-3 h-3 text-white" />
           </div>
           <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
          </li>
         ))}
        </ul>
       </div>

       {/* CTA Button */}
       <div className="mt-auto">
        <CheckoutButton
         priceId={plan.priceId}
         tier={plan.name.toLowerCase()}
         className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
          plan.popular
           ? 'bg-cardinal hover:bg-cardinal-dark text-white shadow-lg shadow-cardinal/25 transform hover:scale-105'
           : plan.price === 'Free'
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            : 'bg-gray-800 hover:bg-gray-700 text-white'
         }`}
        />
       </div>

       {/* Bottom Badge for Free Plan */}
       {plan.price === 'Free' && (
        <div className="text-center mt-4">
         <span className="inline-block px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full">
          No Credit Card Required
         </span>
        </div>
       )}
      </div>
     )
    })}
   </div>

   {/* Money Back Guarantee */}
   <div className="text-center mt-12">
    <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm">
     <Shield className="w-4 h-4 text-green-600" />
     <span className="text-sm font-medium text-gray-700">30-day money-back guarantee on all paid plans</span>
    </div>
   </div>
  </div>
 )
}