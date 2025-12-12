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
  UserCheck,
  Home
} from 'lucide-react'

interface AppHeaderProps {
  className?: string
  title?: string
  subtitle?: string
  hideNavigation?: boolean
  hideRoleBadge?: boolean
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
    user: { icon: UserCheck, label: 'User' },
    athlete: { icon: UserCheck, label: 'Athlete' },
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

export default function AppHeader({ className = '', title, subtitle, hideNavigation = false, hideRoleBadge = false }: AppHeaderProps) {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string>('')
  const [profileDisplayName, setProfileDisplayName] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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
        router.push('/dashboard/admin')
        break
      case 'coach':
      case 'creator':
        router.push('/dashboard/coach/welcome')
        break
      case 'assistant':
        router.push('/dashboard/coaching')
        break
      case 'athlete':
        router.push('/dashboard/athlete/welcome')
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
      case 'athlete':
        return { label: 'Athlete', color: 'bg-blue-600' }
      case 'user':
        return { label: 'User', color: 'bg-gray-600' }
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
    <>
      <header className={`bg-white px-4 py-3 sm:py-4 shadow-sm ${className} sticky top-0 z-40`} role="banner">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Logo + ATHLEAP wordmark + Title */}
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Go to home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/athleap-logo-transparent.png"
                alt="Athleap logo"
                className="h-8 w-auto"
              />
              <span
                className="text-xl font-semibold tracking-[0.02em]"
                style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
              >
                ATHLEAP
              </span>
            </button>

            {/* Title and Subtitle */}
            {title && (
              <div className="hidden md:block flex-1">
                <h1 
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Navigation Links + Role Badge + User */}
          <div className="flex items-center gap-6">
            {/* Browse Coaches Link */}
            {!hideNavigation && (
              <Link
                href="/coaches"
                className="hidden md:block text-black hover:text-blue-600 transition-colors"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px' }}
                aria-label="Browse Coaches - View all available coaches"
              >
                Browse Coaches
              </Link>
            )}

            {/* Gear Store Link */}
            {!hideNavigation && (
              <Link
                href="/gear"
                className="hidden md:block text-black hover:text-blue-600 transition-colors"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px' }}
                aria-label="Gear Store - Browse recommended gear"
              >
                Gear Store
              </Link>
            )}

            {/* Role Badge */}
            {user && !hideRoleBadge && (
              <div className={`px-3 py-1.5 text-white rounded-lg text-xs font-semibold ${getRoleDisplay().color}`}>
                {getRoleDisplay().label}
              </div>
            )}

            {/* User Greeting - Match /coaches page design */}
            {user ? (
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                aria-label="Account"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ref={buttonRef}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    profileImageUrl ||
                    user.photoURL ||
                    'https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png'
                  }
                  alt={getUserName()}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span
                  className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Hello
                </span>
                <span
                  className="text-sm"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {getUserName()}
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span
                  className="text-xs text-gray-700 underline"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSignOut()
                  }}
                >
                  Sign out
                </span>
              </button>
            ) : (
              <Link 
                href="/onboarding/auth"
                className="text-xs sm:text-sm text-gray-700 underline"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Dropdown Menu (for additional options) */}
        {user && isDropdownOpen && (
          <div className="absolute right-6 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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
          </div>
        )}
      </header>
    </>
  )
}