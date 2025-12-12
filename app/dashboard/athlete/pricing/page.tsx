'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, AlertCircle, Sparkles, Users, BookOpen, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/ui/AppHeader';

// Feature categories with tier availability
const FEATURE_CATEGORIES = [
  {
    category: 'Coach Experience',
    icon: Users,
    features: [
      { name: 'Access to 1 coach', tier1: true, tier2: false, tier3: false },
      { name: 'Access to 3 coaches', tier1: false, tier2: true, tier3: false },
      { name: 'Unlimited coach access', tier1: false, tier2: false, tier3: true },
    ],
  },
  {
    category: 'Training Experience',
    icon: BookOpen,
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
    icon: ShoppingBag,
    features: [
      { name: 'Gear store access', tier1: true, tier2: true, tier3: true },
      { name: 'Exclusive gear recommendations', tier1: false, tier2: true, tier3: true },
    ],
  },
];

const TIERS = [
  { 
    id: 'free', 
    name: 'Tier 1', 
    price: 'Free', 
    priceNum: 0, 
    subtitle: 'Perfect for getting started',
    color: '#892F1A',
    bgColor: '#FDF6F3'
  },
  { 
    id: 'basic', 
    name: 'Tier 2', 
    price: '$9.99', 
    priceNum: 9.99, 
    subtitle: 'per month',
    color: '#892F1A',
    bgColor: '#FDF6F3'
  },
  { 
    id: 'elite', 
    name: 'Tier 3', 
    price: '$19.99', 
    priceNum: 19.99, 
    subtitle: 'per month',
    popular: true,
    color: '#892F1A',
    bgColor: '#FDF6F3'
  },
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#EDEDED' }}>
      {/* Header with AppHeader */}
      <div className="sticky top-0 z-40 shadow-sm">
        <div className="w-full bg-white">
          <AppHeader hideNavigation={true} hideRoleBadge={true} />
        </div>
        {/* Red bar section - matching Browse Coaches */}
        <section aria-label="Pricing banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3 flex justify-end">
            <p
              className="text-[15px] leading-none font-bold text-white"
              style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
            >
              Choose Your Plan
            </p>
          </div>
        </section>
      </div>

      {/* Hero banner – dark red section with centered logo + title (matching Browse Coaches) */}
      <section className="w-full bg-[#4B0102]">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-10 text-center">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/athleap-logo-transparent.png"
              alt="Athleap mark"
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.05em', color: '#FFFFFF' }}
          >
            Choose Your Athleap Plan
          </h1>
          <p
            className="text-lg text-white/90 max-w-2xl mx-auto"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Unlock your full potential with the right training experience. Start free or upgrade for premium features. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Main Content - Pricing Cards */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Pricing Cards Grid */}
          <div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {TIERS.map((tier) => {
              const isPopular = tier.popular;
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    isPopular 
                      ? 'border-[#892F1A] scale-105' 
                      : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor: isPopular ? tier.bgColor : '#FFFFFF'
                  }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-[#892F1A] text-white text-xs font-bold px-5 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Sparkles className="w-3.5 h-3.5" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`p-6 border-b border-gray-200 ${isPopular ? 'pt-8' : ''}`}>
                    <h3 
                      className="text-2xl font-bold mb-2"
                      style={{ color: tier.color }}
                    >
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span 
                        className="text-4xl font-bold"
                        style={{ color: tier.color }}
                      >
                        {tier.price}
                      </span>
                      {tier.subtitle && tier.priceNum > 0 && (
                        <span className="text-sm" style={{ color: '#666666' }}>
                          {tier.subtitle}
                        </span>
                      )}
                    </div>
                    {tier.priceNum === 0 && (
                      <p className="text-sm" style={{ color: '#666666' }}>
                        {tier.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="p-6 space-y-4">
                    {FEATURE_CATEGORIES.map((category, catIndex) => {
                      const CategoryIcon = category.icon;
                      return (
                        <div key={catIndex} className="mb-6 last:mb-0">
                          <div className="flex items-center gap-2 mb-3">
                            <CategoryIcon className="w-4 h-4" style={{ color: '#624A41' }} />
                            <h4 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#624A41' }}>
                              {category.category}
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {category.features.map((feature, featIndex) => {
                              const hasFeature = 
                                (tier.id === 'free' && feature.tier1) ||
                                (tier.id === 'basic' && feature.tier2) ||
                                (tier.id === 'elite' && feature.tier3);
                              
                              return (
                                <li key={featIndex} className="flex items-start gap-2">
                                  {hasFeature ? (
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <span className="w-5 h-5 flex-shrink-0 text-gray-300">—</span>
                                  )}
                                  <span 
                                    className={`text-sm ${hasFeature ? '' : 'text-gray-400'}`}
                                    style={hasFeature ? { color: '#624A41' } : {}}
                                  >
                                    {feature.name}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={loading !== null}
                      className="w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[#892F1A] text-white hover:bg-[#7a2717] shadow-md"
                    >
                      {loading === tier.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          {tier.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Footer Note */}
            <div className="text-center mt-8">
              <p className="text-sm" style={{ color: '#666666', fontFamily: '"Open Sans", sans-serif' }}>
                All paid plans include a 7-day free trial. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
