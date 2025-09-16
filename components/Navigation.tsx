'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import ClarityButton from './ui/NexusButton'
import { UserIdentity } from './user-identity'
import { useAuth } from '@/hooks/use-auth'

// Navigation Link Component
const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link 
    href={href}
    className="relative px-3 py-2 text-sm font-medium text-gray-800 hover:text-cardinal transition-colors group rounded-lg hover:bg-cardinal/5"
  >
    {label}
    <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-cardinal transition-all duration-300 group-hover:w-6 group-hover:left-1/2 group-hover:-translate-x-1/2 rounded-full" />
  </Link>
)

// Mobile Navigation Link Component  
const MobileNavLink = ({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => (
  <Link 
    href={href}
    className="block px-4 py-3 text-base font-medium text-gray-800 hover:text-cardinal hover:bg-cardinal/5 transition-colors rounded-lg"
    onClick={onClick}
  >
    {label}
  </Link>
)

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
              <NavLink href="/contributors" label="Contributors" />
              <NavLink href="/gear" label="Gear" />
              {/* Only show Subscribe for non-authenticated users */}
              {!user && <NavLink href="/subscribe" label="Subscribe" />}
              <NavLink href="/dashboard" label="Dashboard" />
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
                // Unauthenticated - Show sign in/up buttons
                <>
                  <Link href="/dashboard">
                    <ClarityButton 
                      variant="ghost" 
                      size="sm"
                      className="hidden lg:flex text-gray-600 hover:text-gray-800"
                    >
                      Sign In
                    </ClarityButton>
                  </Link>
                  
                  <Link href="/onboarding">
                    <ClarityButton 
                      variant="primary" 
                      size="sm"
                      className="px-4 py-2"
                    >
                      Get Started
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
            {/* Mobile Navigation Links */}
            <MobileNavLink href="/contributors" label="Contributors" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink href="/gear" label="Gear" onClick={() => setMobileMenuOpen(false)} />
            {/* Only show Subscribe for non-authenticated users */}
            {!user && <MobileNavLink href="/subscribe" label="Subscribe" onClick={() => setMobileMenuOpen(false)} />}
            <MobileNavLink href="/dashboard" label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
            
            {/* Mobile CTA Section - Conditional */}
            {!user && (
              <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                <Link href="/dashboard">
                  <ClarityButton 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </ClarityButton>
                </Link>
                <Link href="/onboarding">
                  <ClarityButton 
                    variant="primary" 
                    className="w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
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