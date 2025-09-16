'use client'

import { useState } from 'react'
import { User } from 'firebase/auth'

interface UserAvatarProps {
  user: User | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showOnlineStatus?: boolean
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const getInitials = (user: User | null): string => {
    if (!user) return 'G'
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    
    return 'U'
  }

  const getAvatarColors = (user: User | null): { bg: string; text: string } => {
    if (!user) return { bg: 'bg-gray-500', text: 'text-white' }
    
    const colors = [
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-green-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-orange-500', text: 'text-white' },
      { bg: 'bg-red-500', text: 'text-white' },
      { bg: 'bg-indigo-500', text: 'text-white' },
      { bg: 'bg-pink-500', text: 'text-white' },
      { bg: 'bg-teal-500', text: 'text-white' }
    ]
    
    // Use email or uid to consistently assign colors
    const identifier = user.email || user.uid || 'default'
    const hash = identifier.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  const initials = getInitials(user)
  const colors = getAvatarColors(user)
  const hasProfileImage = user?.photoURL && !imageError

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {hasProfileImage ? (
        <img
          src={user.photoURL}
          alt={user.displayName || user.email || 'User avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white/20`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium border-2 border-white/20 ${colors.bg} ${colors.text}`}
        >
          {initials}
        </div>
      )}
      
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  )
}