'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'
import { UserRole } from '@/hooks/use-url-role-switcher'
import React from 'react'
import {
  Settings,
  User as UserIcon,
  Crown,
  Star,
  Shield,
  UserCheck
} from 'lucide-react'

interface AppHeaderProps {
  className?: string
  title?: string
  subtitle?: string
}

// Ultra-compact role switcher
function CompactRoleSwitcher() {
  const {
    effectiveRole,
    isTestingMode,
    switchToRole,
    resetToOriginalRole,
    getAvailableRoles
  } = useUrlEnhancedRole()

  const availableRoles = getAvailableRoles()

  const roleConfig: Record<UserRole, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
    guest: { icon: UserIcon, label: 'Guest' },
    user: { icon: UserCheck, label: 'Athlete' },
    creator: { icon: Star, label: 'Creator' },
    coach: { icon: Star, label: 'Coach' },
    assistant: { icon: Shield, label: 'Assistant' },
    admin: { icon: Settings, label: 'Admin' },
    superadmin: { icon: Crown, label: 'Super Admin' }
  }

  return (
    <div className="space-y-2">
      {/* Current Role - Minimal */}
      <div className="flex items-center justify-between text-caption">
        <span className="text-gray-600">View:</span>
        <div className="flex items-center gap-1">
          {React.createElement(roleConfig[effectiveRole].icon, {
            className: "w-3 h-3 text-blue-600"
          })}
          <span className="text-gray-900">
            {roleConfig[effectiveRole].label}
          </span>
          {isTestingMode && (
            <span className="text-orange-600">(Test)</span>
          )}
        </div>
      </div>

      {/* Compact Role Grid */}
      <div className="grid grid-cols-2 gap-1">
        {availableRoles.map((role) => {
          const config = roleConfig[role.value]
          const isCurrent = effectiveRole === role.value

          return (
            <button
              key={role.value}
              onClick={() => switchToRole(role.value)}
              disabled={isCurrent}
              className={`flex items-center gap-1 p-1.5 text-xs rounded transition-all ${
                isCurrent
                  ? 'bg-blue-600 text-white cursor-not-allowed'
                  : 'bg-gray-50 border border-gray-300 hover:bg-blue-50'
              }`}
            >
              <config.icon className="w-3 h-3" />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Reset Button - Minimal */}
      {isTestingMode && (
        <button
          onClick={resetToOriginalRole}
          className="w-full text-xs text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}

export default function AppHeader({ className = '', title, subtitle }: AppHeaderProps) {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string>('')
  const [profileDisplayName, setProfileDisplayName] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get role directly from user to avoid circular dependency
  const canSwitchRoles = user?.role === 'superadmin'

  // Load profile data from Firestore
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.uid) return

      try {
        // Try coach_profiles first, then creator_profiles
        let profileDoc = await getDoc(doc(db, 'coach_profiles', user.uid))

        if (!profileDoc.exists()) {
          profileDoc = await getDoc(doc(db, 'creator_profiles', user.uid))
        }

        if (!profileDoc.exists()) {
          profileDoc = await getDoc(doc(db, 'profiles', user.uid))
        }

        if (profileDoc.exists()) {
          const data = profileDoc.data()
          setProfileImageUrl(data.profileImageUrl || data.headshotUrl || '')
          setProfileDisplayName(data.displayName || '')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfileData()
  }, [user?.uid])

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
        router.push('/dashboard/creator')
        break
      case 'coach':
        router.push('/dashboard/coaching')
        break
      case 'creator':
        router.push('/dashboard/creator')
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
        return { label: 'Coach', color: 'bg-purple-600' }
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
    // Use profile displayName if available, otherwise fall back to auth
    if (profileDisplayName) {
      return profileDisplayName.split(' ')[0] // First name only
    }
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
        {/* Left Side - Logo and optional title */}
        <div className="flex items-center gap-6">
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

          {title && (
            <div className="border-l border-gray-300 pl-6">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-4">
          {/* Browse Coaches Link */}
          <Link href="/contributors" className="text-black hover:text-blue-600">
            Browse Coaches
          </Link>

          {/* Role Badge */}
          {user && (
            <div className={`px-4 py-2 text-white rounded-lg ${getRoleDisplay().color}`}>
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
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={getUserName()}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    {getUserInitials()}
                  </div>
                )}
                <span className="text-black">{getUserName()}</span>
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* User Info - Name and Email */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      View Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Settings
                    </Link>
                  </div>

                  {/* Role Switcher - For superadmins only */}
                  {canSwitchRoles && (
                    <div className="px-3 py-2 border-t border-gray-200 bg-red-50">
                      <div className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        Admin Tools
                      </div>
                      <CompactRoleSwitcher />
                    </div>
                  )}

                  {/* Sign Out */}
                  <div className="py-1 border-t border-gray-200">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/" className="bg-cardinal text-white px-4 py-2 rounded text-sm hover:bg-cardinal-dark transition-colors">
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}