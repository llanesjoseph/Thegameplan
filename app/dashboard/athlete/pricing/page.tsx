'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
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
      { name: 'Gear store access', tier1: true, tier2: true, tier3: true },
      { name: 'Exclusive gear recommendations', tier1: false, tier2: true, tier3: true },
    ],
  },
];

const TIERS = [
  { id: 'free', name: 'Tier 1', price: 'Free', priceNum: 0, subtitle: '' },
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

  return (
    <div className="min-h-screen bg-[#4B0102] py-10 px-4 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Choose Your Plan
          </h1>
          <p className="text-base max-w-2xl mx-auto text-[#F4D7CE]">
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
        <div className="bg-white rounded-lg shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Tier Headers */}
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="p-4 bg-gray-50 text-left w-1/4"></th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    className={`p-4 text-center w-1/4 ${
                      tier.popular ? 'bg-[#4B0102]' : 'bg-gray-50'
                    }`}
                  >
                    {tier.popular && (
                      <span className="inline-block bg-[#C40000] text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase">
                        Most Popular
                      </span>
                    )}
                    <div className={`text-lg font-bold ${tier.popular ? 'text-white' : 'text-gray-800'}`}>
                      {tier.name}
                    </div>
                    <div className="mt-1">
                      <span className={`text-2xl font-bold ${tier.popular ? 'text-white' : 'text-[#C40000]'}`}>
                        {tier.price}
                      </span>
                      {tier.subtitle && (
                        <span className={`text-xs ml-1 ${tier.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                          {tier.subtitle}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={loading !== null}
                      className={`mt-3 w-full py-2 px-3 rounded-full font-semibold text-sm transition-all disabled:opacity-50 ${
                        tier.popular
                          ? 'bg-white text-[#4B0102] hover:bg-gray-100'
                          : tier.id === 'free'
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-[#C40000] text-white hover:bg-[#a00000]'
                      }`}
                    >
                      {loading === tier.id ? 'Loading...' : tier.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Feature Categories */}
              {FEATURE_CATEGORIES.map((category, catIndex) => (
                <React.Fragment key={catIndex}>
                  {/* Category Header */}
                  <tr className="bg-[#FDF2F2]">
                    <td colSpan={4} className="p-3">
                      <span className="font-bold text-[#4B0102] text-sm">
                        {category.category}
                      </span>
                    </td>
                  </tr>

                  {/* Features */}
                  {category.features.map((feature, featIndex) => (
                    <tr
                      key={featIndex}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-sm text-gray-700">
                        {feature.name}
                      </td>
                      <td className="p-3 text-center">
                        {feature.tier1 ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {feature.tier2 ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center bg-[#FFFAFA]">
                        {feature.tier3 ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Bottom CTA Row */}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="p-4"></td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className="p-4 text-center">
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={loading !== null}
                      className={`w-full py-2 px-3 rounded-full font-semibold text-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
                        tier.popular
                          ? 'bg-[#C40000] text-white hover:bg-[#a00000]'
                          : tier.id === 'free'
                          ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                          : 'bg-[#4B0102] text-white hover:bg-[#3a0102]'
                      }`}
                    >
                      {loading === tier.id ? 'Loading...' : (
                        <>
                          {tier.id === 'free' ? 'Get Started' : 'Choose Plan'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#F4D7CE]">
            All paid plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
