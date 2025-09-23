'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ClarityButton from './ui/NexusButton'
import { UserIdentity } from './user-identity'
import { useAuth } from '@/hooks/use-auth'


const Navigation = () => {
  const [scrolled, setScrolled] = useState(false)
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
        backdrop-blur-xl bg-cream/95 border-b border-sky-blue/20
        ${scrolled ? 'shadow-card-md bg-cream/98' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">

            {/* Simplified header - only user authentication */}
            <div className="flex items-center gap-3">
              {loading ? (
                // Loading state
                <div className="w-9 h-9 rounded-full bg-gray-400/20 animate-pulse"></div>
              ) : user ? (
                // Authenticated user - Show profile dropdown only
                <UserIdentity />
              ) : (
                // Unauthenticated - Show only sign in button
                <Link href="/dashboard">
                  <ClarityButton
                    variant="ghost"
                    size="sm"
                    className="text-dark hover:text-sky-blue"
                  >
                    Sign In
                  </ClarityButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navigation