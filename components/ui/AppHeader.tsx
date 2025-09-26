'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

interface AppHeaderProps {
  className?: string
}

export default function AppHeader({ className = '' }: AppHeaderProps) {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleLogoClick = () => {
    if (!user) {
      router.push('/')
      return
    }

    // Role-based navigation
    switch (role) {
      case 'superadmin':
      case 'admin':
        router.push('/dashboard/overview')
        break
      case 'coach':
        router.push('/dashboard/coaching')
        break
      case 'creator':
        router.push('/dashboard/overview')
        break
      case 'assistant':
        router.push('/dashboard/coaching')
        break
      case 'user':
        router.push('/dashboard')
        break
      default:
        router.push('/dashboard')
        break
    }
  }

  const getRoleDisplay = () => {
    switch (role) {
      case 'superadmin':
        return { label: 'Super Admin', color: 'bg-red-600' }
      case 'admin':
        return { label: 'Admin', color: 'bg-orange-600' }
      case 'creator':
        return { label: 'Creator', color: 'bg-blue-600' }
      case 'coach':
        return { label: 'Coach', color: 'bg-purple-600' }
      case 'assistant':
        return { label: 'Assistant', color: 'bg-green-600' }
      default:
        return { label: 'User', color: 'bg-gray-600' }
    }
  }

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(name => name[0]).join('').toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getUserName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0] // First name only
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  return (
    <header className={`bg-white px-4 py-4 shadow-sm ${className}`}>
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

      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* PLAYBOOKD Logo */}
        <button
          onClick={handleLogoClick}
          className="text-2xl tracking-wider hover:opacity-80 transition-opacity"
          style={{
            fontFamily: 'Sports World, Impact, Arial Black, sans-serif',
            color: '#624A41'
          }}
        >
          PLAYBOOKD
        </button>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-4">
          {/* Browse Coaches Link */}
          <Link href="/contributors" className="text-black hover:text-blue-600 font-medium">
            Browse Coaches
          </Link>

          {/* Role Badge */}
          {user && (
            <div className={`px-4 py-2 text-white rounded-lg font-medium ${getRoleDisplay().color}`}>
              {getRoleDisplay().label}
            </div>
          )}

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <span className="font-medium text-black">{getUserName()}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth" className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium">
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}