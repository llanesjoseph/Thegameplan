'use client'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from '@/lib/firebase.client'
import { StripeCheckoutResponse } from '@/lib/types'

interface CheckoutButtonProps {
 priceId: string
 tier: string
 className?: string
}

export default function CheckoutButton({ priceId, tier, className }: CheckoutButtonProps) {
 const startCheckout = async () => {
  const user = auth.currentUser
  if (!user) {
   alert('Please sign in first.')
   return
  }
  
  try {
   const fn = httpsCallable(getFunctions(), 'stripe_checkout')
   const { data } = await fn({
    priceId,
    tier,
    successUrl: window.location.origin + '/dashboard',
    cancelUrl: window.location.origin + '/subscribe'
   }) as { data: StripeCheckoutResponse }
   window.location.href = data.url
  } catch (error) {
   console.error('Checkout error:', error)
   alert('Something went wrong. Please try again.')
  }
 }

 const buttonText = tier === 'basic' || tier === 'free' ? 'Get Started Free' : `Choose ${tier.charAt(0).toUpperCase() + tier.slice(1)}`

 return (
  <button 
   className={className || "nexus-btn nexus-btn-primary nexus-ripple w-full"} 
   onClick={startCheckout}
  >
   {buttonText}
  </button>
 )
}
