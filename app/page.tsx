'use client'

import React from 'react'
import Link from 'next/link'
import ClarityButton from '@/components/ui/NexusButton'
import SimpleAuth from '@/components/auth/SimpleAuth'

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
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

      {/* Full Width Banner Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: 'url("https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758664964/2022_09_santa_clara_rain_1_x2i1os.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Top Login Section - Horizontal Layout */}
      <div className="relative z-20 w-full">
        <div className="flex justify-center p-6">
          <div className="bg-deep-plum/20 backdrop-blur-md rounded-2xl px-8 py-4 shadow-lg border border-deep-plum/30">
            <div className="flex items-center gap-6 min-w-[600px]">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-1">Join PLAYBOOKD</h3>
                <p className="text-cream/90 text-sm">Access elite sports training</p>
              </div>

              <div className="flex items-center gap-4 flex-1">
                <SimpleAuth />

                <div className="flex items-center">
                  <div className="w-8 border-t border-deep-plum/50"></div>
                  <span className="px-3 text-cream/80 text-sm">or</span>
                  <div className="w-8 border-t border-deep-plum/50"></div>
                </div>

                <Link href="/dashboard">
                  <ClarityButton variant="plum" size="md" className="bg-deep-plum text-white hover:bg-deep-plum/90 border-deep-plum font-semibold">
                    Subscribe Now
                  </ClarityButton>
                </Link>
              </div>

              <div className="text-right">
                <p className="text-cream/80 text-sm">
                  Elite training • AI coaching • Pro insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - PLAYBOOKD Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">

        {/* Large PLAYBOOKD Logo */}
        <div className="text-center">
          <h1
            className="text-8xl md:text-9xl lg:text-[12rem] xl:text-[14rem] font-normal tracking-[0.2em] mb-8"
            style={{
              fontFamily: 'Sports World, Impact, Arial Black, sans-serif',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              backgroundImage: 'linear-gradient(45deg, #91A6EB 0%, #E8E6D8 30%, #91A6EB 60%, #E8E6D8 100%)',
              WebkitTextStroke: '2px rgba(145, 166, 235, 0.8)',
              textShadow: '4px 4px 8px rgba(0,0,0,0.7)',
              filter: 'drop-shadow(0 0 20px rgba(145, 166, 235, 0.4))',
              lineHeight: '0.85'
            }}
          >
            PLAYBOOKD
          </h1>

          <div
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-widest text-cream mt-8"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.3em'
            }}
          >
            Intelligence for Sports
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-8 text-cream/90 text-lg font-semibold">
            <Link href="/contributors" className="hover:text-cream transition-colors hover:scale-105 transform">
              Contributors
            </Link>
            <span className="text-cream/50">•</span>
            <Link href="/lessons" className="hover:text-cream transition-colors hover:scale-105 transform">
              Lessons
            </Link>
            <span className="text-cream/50">•</span>
            <Link href="/gear" className="hover:text-cream transition-colors hover:scale-105 transform">
              Gear
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Animated Background Effects */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-sky-blue to-transparent animate-pulse"></div>
          <div className="absolute top-2/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange to-transparent animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green to-transparent animate-pulse delay-2000"></div>
        </div>
      </div>
    </div>
  )
}