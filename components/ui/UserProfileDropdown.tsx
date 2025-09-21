'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { UserRole, useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import {
  Settings,
  CreditCard,
  LogOut,
  User,
  ChevronDown,
  Crown,
  Star,
  Shield,
  UserCheck,
  MoreHorizontal,
  LayoutDashboard
} from 'lucide-react'
import CircularBadge from './CircularBadge'

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
    guest: { icon: User, label: 'Guest' },
    user: { icon: UserCheck, label: 'Athlete' },
    creator: { icon: Star, label: 'Coach' },
    assistant_coach: { icon: Shield, label: 'Asst Coach' },
    admin: { icon: Settings, label: 'Admin' },
    superadmin: { icon: Crown, label: 'Super' }
  }

  return (
    <div className="space-y-2">
      {/* Current Role - Minimal */}
      <div className="flex items-center justify-between text-caption">
        <span className="text-clarity-text-secondary">View:</span>
        <div className="flex items-center gap-1">
          {React.createElement(roleConfig[effectiveRole].icon, { 
            className: "w-3 h-3 text-clarity-accent" 
          })}
          <span className="font-medium text-clarity-text-primary">
            {roleConfig[effectiveRole].label}
          </span>
          {isTestingMode && (
            <span className="text-clarity-warning">(Test)</span>
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
                  ? 'bg-clarity-accent text-white cursor-not-allowed' 
                  : 'bg-clarity-surface border border-clarity-text-secondary/20 hover:bg-clarity-accent/5'
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
          className="w-full text-xs text-clarity-error hover:bg-clarity-error/5 p-1.5 rounded transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get role directly from user to avoid circular dependency with useEnhancedRole
  const role = user?.role || 'guest'
  const canSwitchRoles = user?.role === 'superadmin'

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth)
      router.push('/')
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-clarity-text-secondary/20 animate-pulse"></div>
    )
  }

  if (!user) {
    return null // Navigation component handles auth state
  }

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button with Circular Badge */}
      <div className="flex items-center gap-3">
        {/* Dynamic Role Badge - Updated */}
        <div className="hidden sm:block">
          <CircularBadge userRole={role} size="small" />
        </div>

        {/* Super Admin Dashboard Link */}
        {role === 'superadmin' && (
          <Link
            href="/dashboard/admin"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200 group"
            title="Admin Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Link>
        )}

        {/* Profile Button - Clean and Modern */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-clarity-accent/5 transition-colors focus:outline-none focus:ring-2 focus:ring-clarity-accent/50 focus:ring-offset-1"
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          <div className="w-9 h-9 rounded-full bg-clarity-accent flex items-center justify-center text-white text-sm font-semibold shadow-clarity-sm">
            {initials}
          </div>
          <span className="hidden lg:block text-sm font-medium text-clarity-text-primary max-w-24 truncate">
            {user.displayName?.split(' ')[0] || 'User'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-clarity-text-secondary ${isOpen ? 'rotate-180' : ''} hidden lg:block`} />
        </button>
      </div>

      {/* Dropdown Menu - Clarity OS Design */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-clarity-surface backdrop-blur-xl rounded-lg shadow-clarity-xl border border-clarity-text-secondary/10 py-1 z-50 animate-fade-in">
            
            {/* Compact User Info - Just email as header */}
            <div className="px-3 py-2 border-b border-clarity-text-secondary/10">
              <p className="text-caption text-clarity-text-secondary truncate">
                {user.email}
              </p>
            </div>

            {/* Navigation Links - Compact */}
            <div className="py-1">
              <Link 
                href="/dashboard/profile" 
                className="flex items-center gap-2 px-3 py-2 text-clarity-text-primary hover:bg-clarity-accent/5 hover:text-clarity-accent transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4 text-clarity-text-secondary group-hover:text-clarity-accent" />
                <span className="text-sm">Profile</span>
              </Link>
              
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 px-3 py-2 text-clarity-text-primary hover:bg-clarity-accent/5 hover:text-clarity-accent transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 text-clarity-text-secondary group-hover:text-clarity-accent" />
                <span className="text-sm">Settings</span>
              </Link>
              
              <Link 
                href="/subscribe" 
                className="flex items-center gap-2 px-3 py-2 text-clarity-text-primary hover:bg-clarity-accent/5 hover:text-clarity-accent transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4 text-clarity-text-secondary group-hover:text-clarity-accent" />
                <span className="text-sm">Billing</span>
              </Link>
            </div>

            {/* Role Switcher (Only for Super Admins in Development) - Compact */}
            {canSwitchRoles && process.env.NODE_ENV === 'development' && (
              <div className="px-3 py-2 border-t border-clarity-text-secondary/10 bg-clarity-error/5">
                <div className="text-caption font-medium text-clarity-error mb-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-clarity-error rounded-full"></div>
                  Admin Tools
                </div>
                <CompactRoleSwitcher />
              </div>
            )}

            {/* Sign Out - Compact */}
            <div className="py-1 border-t border-clarity-text-secondary/10">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 w-full text-clarity-error hover:bg-clarity-error/5 transition-colors group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}