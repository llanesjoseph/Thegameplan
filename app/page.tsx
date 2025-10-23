'use client'

import React from 'react'
import Link from 'next/link'
import ClarityButton from '@/components/ui/NexusButton'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export default function LandingPage() {
 return (
  <div className="min-h-screen">
   {/* Add Sports World Font */}
   <style jsx global>{`
    @font-face {
     font-family: 'Sports World';
     src: url('/fonts/sports-world-regular.ttf') format('truetype');
     font-weight: normal;
     font-style: normal;
     font-display: swap;
    }
   `}</style>

   {/* Header with Navigation */}
   <header className="relative z-50 bg-white shadow-sm" role="banner">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center">
       <div className="flex-shrink-0">
        <p
         className="text-2xl tracking-wider uppercase font-bold"
         style={{
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          color: '#624A41' // Dark color from palette
         }}
        >
         ATHLEAP
        </p>
       </div>
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-4">
       <Link href="/login">
        <ClarityButton variant="ghost" size="sm" className="text-dark hover:text-sky-blue">
         Sign In
        </ClarityButton>
       </Link>
       <Link href="/login">
        <ClarityButton
         size="sm"
         className="bg-orange text-white hover:bg-orange/90 "
        >
         Sign Up
        </ClarityButton>
       </Link>
      </div>
     </div>
    </div>
   </header>

   {/* Hero Section */}
   <section className="relative min-h-[70vh] flex items-center justify-center">
    {/* Background Image */}
    <div
     className="absolute inset-0 bg-cover bg-center bg-no-repeat"
     style={{
      backgroundImage: 'url("/hero-background.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
     }}
    >
     {/* Dark overlay */}
     <div className="absolute inset-0 bg-black/60"></div>
    </div>

    {/* Hero Content */}
    <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
     <h1
      className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wider mb-6"
      style={{
       fontFamily: 'Sports World, Impact, Arial Black, sans-serif',
       color: 'white',
       textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
       lineHeight: '0.9'
      }}
     >
      ATHLEAP
     </h1>

     <p
      className="text-xl sm:text-2xl md:text-3xl tracking-[0.3em] text-white mb-8"
      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
     >
      FOR THE FUTURE OF SPORTS
     </p>

    <Link
     href="/login"
     className="inline-block"
     aria-label="Sign in or sign up"
    >
     <ClarityButton
      size="lg"
      className="bg-orange text-white hover:bg-orange/90 text-lg px-8 py-4 rounded-lg shadow-lg"
     >
      JOIN US
     </ClarityButton>
    </Link>
    </div>
   </section>

   {/* Description Section */}
   <section className="py-16 bg-cream">
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
     <p className="text-lg sm:text-xl text-dark leading-relaxed">
      AthLeap is blending the power of AI with the thrill of sports,
      creating unforgettable fan experiences and coaching next-generation athletes.
      Whether you're in the stands or on the field, this is the future of sports.
     </p>
    </div>
   </section>

   {/* Features Section */}
   <section className="py-16 bg-primary-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl text-white mb-4">
       Simple steps to a stronger game...
      </h2>
     </div>

     <div className="grid md:grid-cols-3 gap-8">
      {/* Share Your Goals */}
      <div className="text-center text-white">
       <h3 className="text-xl mb-4">Share Your Goals</h3>
       <p className="text-white/90 leading-relaxed">
        Create your athletic profile and share what's important to
        you. Set clear goals for your training and development journey.
       </p>
      </div>

      {/* Find Your Coach */}
      <div className="text-center text-white">
       <h3 className="text-xl mb-4">Find Your Coach</h3>
       <p className="text-white/90 leading-relaxed">
        Our coaches have been carefully curated to provide top
        tier training experiences and elevate your athletic journey.
       </p>
      </div>

      {/* Enhance Performance */}
      <div className="text-center text-white">
       <h3 className="text-xl mb-4">Enhance Performance</h3>
       <p className="text-white/90 leading-relaxed">
        Ask questions, engage with our community and track your
        progress with personalized performance insights.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="bg-white py-8" role="contentinfo">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex items-center justify-between">
      {/* Left side - can be expanded with links */}
      <div className="flex items-center gap-6">
       <Link href="/coaches" className="text-dark hover:text-sky-blue ">
        Coaches
       </Link>
       <Link href="/lessons" className="text-dark hover:text-sky-blue ">
        Lessons
       </Link>
       <Link href="/gear" className="text-dark hover:text-sky-blue ">
        Gear
       </Link>
      </div>

      {/* Right side - Social Links */}
      <div className="flex items-center gap-4">
       <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-dark hover:text-sky-blue" aria-label="AthLeap on Facebook">
        <Facebook className="w-5 h-5" />
       </a>
       <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-dark hover:text-sky-blue" aria-label="AthLeap on Instagram">
        <Instagram className="w-5 h-5" />
       </a>
       <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-dark hover:text-sky-blue" aria-label="AthLeap on Twitter">
        <Twitter className="w-5 h-5" />
       </a>
      </div>
     </div>
    </div>
   </footer>
  </div>
 )
}