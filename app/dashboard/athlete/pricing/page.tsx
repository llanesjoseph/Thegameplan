'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

// Feature categories with tier availability
const FEATURE_CATEGORIES = [
  {
    category: 'Coach Experience',
    features: [
      { name: 'Access to 1 coach', tier1: true, tier2: false, tier3: false },
      { name: 'Access to 3 coaches', tier1: false, tier2: true, tier3: false },
      { name: 'Unlimited coach access', tier1: false, tier2: false, tier3: true },
    ],
  },
  {
    category: 'Training Experience',
    features: [
      { name: 'Training library access', tier1: true, tier2: true, tier3: true },
      { name: 'Video training feedback', tier1: false, tier2: true, tier3: true },
      { name: 'Ask Me Anything Access', tier1: false, tier2: true, tier3: true },
      { name: '1:1 training sessions', tier1: false, tier2: false, tier3: true },
      { name: 'Exclusive athlete content', tier1: false, tier2: false, tier3: true },
    ],
  },
  {
    category: 'Gear Experience',
    features: [
      { name: 'Gear store access', tier1: true, tier2: false, tier3: false },
      { name: 'Exclusive gear recommendations', tier1: false, tier2: true, tier3: true },
    ],
  },
];

const TIERS = [
  { id: 'free', name: 'Tier 1', price: 'Free', priceNum: 0, subtitle: 'Get Started' },
  { id: 'basic', name: 'Tier 2', price: '$9.99', priceNum: 9.99, subtitle: 'per month' },
  { id: 'elite', name: 'Tier 3', price: '$19.99', priceNum: 19.99, subtitle: 'per month', popular: true },
];

export default function AthletePricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free') {
      // Free tier - just redirect to dashboard
      router.push('/dashboard/athlete');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    const tier = tierId as 'basic' | 'elite';
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

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  const FeatureCheck = ({ available }: { available: boolean }) => (
    available ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-gray-300" />
    )
  );

  return (
    <div className="min-h-screen bg-[#4B0102] py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Choose Your Plan
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#F4D7CE' }}
          >
            Unlock your full potential with the right training experience.
            Start free or upgrade for premium features.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Pricing Table */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Tier Headers */}
          <div className="grid grid-cols-4 border-b border-gray-200">
            <div className="p-6 bg-gray-50"></div>
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`p-6 text-center ${
                  tier.popular ? 'bg-[#4B0102] text-white' : 'bg-gray-50'
                }`}
              >
                {tier.popular && (
                  <span className="inline-block bg-[#C40000] text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase">
                    Most Popular
                  </span>
                )}
                <h3
                  className={`text-lg font-bold ${tier.popular ? 'text-white' : 'text-gray-800'}`}
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {tier.name}
                </h3>
                <div className="mt-2">
                  <span
                    className={`text-3xl font-bold ${tier.popular ? 'text-white' : 'text-[#C40000]'}`}
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {tier.price}
                  </span>
                  {tier.subtitle !== 'Get Started' && (
                    <span className={`text-sm ml-1 ${tier.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                      {tier.subtitle}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading !== null}
                  className={`mt-4 w-full py-2 px-4 rounded-full font-semibold text-sm transition-all disabled:opacity-50 ${
                    tier.popular
                      ? 'bg-white text-[#4B0102] hover:bg-gray-100'
                      : tier.id === 'free'
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-[#C40000] text-white hover:bg-[#a00000]'
                  }`}
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {loading === tier.id ? 'Loading...' : tier.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>

          {/* Feature Categories */}
          {FEATURE_CATEGORIES.map((category, catIndex) => (
            <div key={catIndex}>
              {/* Category Header */}
              <div className="grid grid-cols-4 bg-[#FFF5F5] border-b border-gray-200">
                <div className="p-4">
                  <h4
                    className="font-bold text-[#4B0102]"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {category.category}
                  </h4>
                </div>
                <div className="p-4"></div>
                <div className="p-4"></div>
                <div className="p-4"></div>
              </div>

              {/* Features */}
              {category.features.map((feature, featIndex) => (
                <div
                  key={featIndex}
                  className="grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4">
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {feature.name}
                    </span>
                  </div>
                  <div className="p-4 flex justify-center items-center">
                    <FeatureCheck available={feature.tier1} />
                  </div>
                  <div className="p-4 flex justify-center items-center">
                    <FeatureCheck available={feature.tier2} />
                  </div>
                  <div className="p-4 flex justify-center items-center bg-[#FFF9F9]">
                    <FeatureCheck available={feature.tier3} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom CTA Row */}
          <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-200">
            <div className="p-6"></div>
            {TIERS.map((tier) => (
              <div key={tier.id} className="p-6 text-center">
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 px-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                    tier.popular
                      ? 'bg-[#C40000] text-white hover:bg-[#a00000]'
                      : tier.id === 'free'
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-[#4B0102] text-white hover:bg-[#3a0102]'
                  }`}
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {loading === tier.id ? (
                    'Loading...'
                  ) : (
                    <>
                      {tier.id === 'free' ? 'Get Started' : 'Choose Plan'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p
            className="text-sm"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#F4D7CE' }}
          >
            All paid plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
