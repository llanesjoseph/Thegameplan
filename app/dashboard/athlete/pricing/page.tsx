'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
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

// For initial testing we run a single "Athleap Basic" tier that maps to the BASIC Stripe price.
// The backend still supports "elite", but the UI only offers this one plan for now.
const PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Athleap Basic',
    price: 0,
    description: 'Test drive the full athlete experience while we finalize pricing.',
    features: [
      'Access to your coach’s published lessons',
      'Video submissions and feedback (testing mode)',
      'Progress tracking dashboard',
      'Access to new AI and training features as we roll them out',
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
    <div className="min-h-screen bg-[#4B0102] py-10 px-4 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Athleap Athlete Subscription
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#F4D7CE' }}
          >
            One simple plan while we finalize pricing. Start your trial to unlock coaching tools,
            training content, and the full athlete dashboard experience.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Single Plan Card */}
        <div className="max-w-xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-none bg-white text-black px-8 py-10 shadow-lg"
            >
              {/* Plan Header */}
              <div className="mb-6">
                <h3
                  className="text-3xl font-bold mb-1 tracking-tight"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#F62004' }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-sm"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl font-bold"
                    style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
                  >
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p
                  className="text-sm mt-2"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
                >
                  First 7 days free, then ${plan.price}/month (test pricing)
                </p>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className="w-full py-3 px-6 rounded-full font-semibold flex items-center justify-center gap-2 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  backgroundColor: '#C40000',
                }}
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
              <div className="mt-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#FC0105] flex-shrink-0 mt-0.5" />
                    <span
                      className="text-sm"
                      style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
