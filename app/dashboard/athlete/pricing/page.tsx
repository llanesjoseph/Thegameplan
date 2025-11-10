'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface PricingPlan {
  id: 'basic' | 'elite';
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
  description: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19.99,
    description: 'Perfect for athletes starting their journey',
    features: [
      'Access to all assigned lessons',
      '2 video submissions per month',
      'Progress tracking and analytics',
      'Direct messaging with coach',
      'Video review feedback',
      'Training history',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 29.99,
    popular: true,
    description: 'For serious athletes who want it all',
    features: [
      'Everything in Basic',
      'Unlimited video submissions',
      'AI-powered Ask Joseph assistant',
      "Access to coach's feed and content",
      'Priority review queue',
      'Advanced analytics',
      'Early access to new features',
    ],
  },
];

export default function AthletePricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'elite') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/athlete/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Start your 7-day free trial. Cancel anytime.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">
              No credit card required for trial
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50'
                  : 'bg-[#151B2E] border border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full flex items-center gap-2">
                    <Crown className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">
                      MOST POPULAR
                    </span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  First 7 days free, then ${plan.price}/month
                </p>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Features List */}
              <div className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-[#151B2E] rounded-2xl p-8 border border-gray-700 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                    Basic
                  </th>
                  <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Access to lessons', basic: true, elite: true },
                  { name: 'Video submissions', basic: '2/month', elite: 'Unlimited' },
                  { name: 'Coach messaging', basic: true, elite: true },
                  { name: 'Video review feedback', basic: true, elite: true },
                  { name: 'Progress tracking', basic: true, elite: true },
                  { name: 'AI Assistant (Ask Joseph)', basic: false, elite: true },
                  { name: "Coach's feed access", basic: false, elite: true },
                  { name: 'Priority review queue', basic: false, elite: true },
                  { name: 'Advanced analytics', basic: false, elite: true },
                  { name: 'Early feature access', basic: false, elite: true },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-4 px-4 text-white">{row.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )
                      ) : (
                        <span className="text-gray-300">{row.basic}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )
                      ) : (
                        <span className="text-gray-300">{row.elite}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#151B2E] rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How does the free trial work?',
                a: 'Your 7-day free trial starts immediately. You won\'t be charged until the trial ends. Cancel anytime during the trial with no charge.',
              },
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at the next billing cycle.',
              },
              {
                q: 'What happens if I cancel?',
                a: 'You\'ll retain access until the end of your current billing period. After that, you\'ll lose access to premium features but can resubscribe anytime.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards through Stripe, our secure payment processor.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No! All subscriptions are month-to-month with no long-term commitment. Cancel anytime.',
              },
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
