'use client'

import React from 'react'
import Link from 'next/link'
import { Linkedin, Facebook, Twitter, Instagram } from 'lucide-react'

const SimpleHero = () => {
  return (
    <div className="pt-16">
      {/* Hero Section with Sports Background */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865662/shutterstock_2637651145_ldakmx.jpg')`
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <h1 className="text-7xl md:text-9xl font-brand font-bold tracking-wider mb-4 text-white">
            PLAYBOOKD
          </h1>
          <p className="text-lg md:text-xl font-primary font-medium tracking-wide text-playbookd-cream">
            FOR THE FUTURE OF SPORTS
          </p>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-playbookd-cream py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-base text-playbookd-dark mb-6 leading-relaxed">
            PlayBookd is blending the power of AI with the thrill of sports, creating unforgettable fan experiences and 
            coaching next-generation athletes. Whether you're in the stands or on the field, this is the future of the game.
          </p>
          
          <Link href="/onboarding">
            <button className="btn-playbookd-secondary">
              JOIN US
            </button>
          </Link>
        </div>
      </div>

      {/* Blue Section - Simple steps to a stronger game */}
      <div className="bg-playbookd-deep-sea py-16 px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple steps to a stronger game...</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-4">Share Your Goals</h3>
              <p className="text-white/90 leading-relaxed">
                Create your athletic profile and share what's important to you. Set clear goals for your training and development journey.
              </p>
            </div>
            
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-4">Find Your Coach</h3>
              <p className="text-white/90 leading-relaxed">
                Our coaches have been carefully curated to provide top tier training experiences and elevate your athletic journey.
              </p>
            </div>
            
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-4">Enhance Performance</h3>
              <p className="text-white/90 leading-relaxed">
                Ask questions, engage with our community and track your progress with personalized performance insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Icons Bottom Right */}
      <div className="fixed bottom-4 right-4 flex space-x-4 text-white">
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Linkedin size={24} />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <Facebook size={24} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <Twitter size={24} />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <Instagram size={24} />
        </a>
      </div>
    </div>
  )
}

export default SimpleHero
