'use client'

import React from 'react'

interface CircularBadgeProps {
 text?: string
 userRole?: 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach' | 'guest'
 className?: string
 size?: 'small' | 'normal'
}

export default function CircularBadge({ text, userRole, className = '', size = 'normal' }: CircularBadgeProps) {
 // Determine text based on role
 const displayText = text || (() => {
  switch (userRole) {
   case 'creator': return 'Coach'
   case 'user': return 'Athlete'
   case 'admin': return 'Admin'
   case 'superadmin': return 'Super Admin'
   case 'assistant_coach': return 'Assistant'
   default: return 'Coach'
  }
 })()

 // Determine colors based on role
 const getRoleColors = () => {
  switch (userRole) {
   case 'creator':
    return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' }
   case 'user':
    return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' }
   case 'admin':
    return { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' }
   case 'superadmin':
    return { bg: 'bg-yellow-500', text: 'text-gray-900', border: 'border-yellow-600' }
   case 'assistant_coach':
    return { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' }
   default:
    return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' }
  }
 }

 const colors = getRoleColors()
 const isSmall = size === 'small'

 return (
  <div className={`role-badge ${className}`}>
   <div className={`
    inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
    ${colors.bg} ${colors.text} border ${colors.border}
    font-medium text-sm shadow-sm transition-all duration-200
    hover:shadow-md hover:-translate-y-0.5
    ${isSmall ? 'px-2 py-1 text-xs' : ''}
   `}>
    <div className={`
     flex items-center justify-center rounded-full bg-white/20
     ${isSmall ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'}
    `}>
     {displayText.charAt(0)}
    </div>
    <span className="font-medium">
     {displayText}
    </span>
   </div>
  </div>
 )
}