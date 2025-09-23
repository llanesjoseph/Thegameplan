'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import ClarityButton from './ui/NexusButton'
import { UserIdentity } from './user-identity'
import { useAuth } from '@/hooks/use-auth'


const Navigation = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        backdrop-blur-xl bg-white/95 border-b border-gray-200
        ${scrolled ? 'shadow-card-md bg-white/98' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section - Simplified */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="relative">
                  <Image
                    src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758004832/0cfb867d-daad-453a-bce5-7f861c04e1c1_i0k0z8.png"
                    alt="Game Plan"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-xl font-bold text-gray-800 tracking-tight">
                  GAME PLAN
                </span>
              </Link>
            </div>

            {/* Center Navigation - Simplified */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Navigation items removed for cleaner header */}
            </div>

            {/* Right Section - Adaptive based on auth state */}
            <div className="flex items-center gap-3">
              {loading ? (
                // Loading state
                <div className="w-9 h-9 rounded-full bg-gray-400/20 animate-pulse"></div>
              ) : user ? (
                // Authenticated user - Show profile dropdown
                <>
                  <UserIdentity />
                  {/* Mobile Menu Toggle */}
                  <button 
                    className="md:hidden flex items-center justify-center w-9 h-9 text-gray-600 hover:text-cardinal hover:bg-cardinal/5 transition-colors rounded-lg ml-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                // Unauthenticated - Show only sign in button
                <>
                  <Link href="/dashboard">
                    <ClarityButton
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Sign In
                    </ClarityButton>
                  </Link>

                  {/* Mobile Menu Toggle */}
                  <button
                    className="md:hidden flex items-center justify-center w-9 h-9 text-gray-600 hover:text-cardinal hover:bg-cardinal/5 transition-colors rounded-lg ml-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`
        md:hidden fixed inset-0 z-40 transition-all duration-300
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Content */}
        <div className={`
          absolute top-16 left-0 right-0 backdrop-blur-xl bg-white/98 border-b border-gray-200 shadow-card-md
          transform transition-transform duration-300
          ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
        `}>
          <div className="p-6 space-y-1">
            {/* Mobile Navigation Links - Removed for cleaner header */}

            {/* Mobile CTA Section - Conditional */}
            {!user && (
              <div className="space-y-3">
                <Link href="/dashboard">
                  <ClarityButton
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </ClarityButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation