'use client'

import React from 'react'

interface PlayBookdCardProps {
  children: React.ReactNode
  variant?: 'white' | 'cream' | 'transparent'
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const PlayBookdCard: React.FC<PlayBookdCardProps> = ({ 
  children, 
  variant = 'white', 
  className = '',
  padding = 'md'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'white':
        return 'bg-white border border-gray-200 shadow-sm'
      case 'cream':
        return 'bg-playbookd-cream/20 border border-playbookd-cream/30'
      case 'transparent':
        return 'bg-transparent'
      default:
        return 'bg-white border border-gray-200 shadow-sm'
    }
  }

  const getPaddingClasses = () => {
    switch (padding) {
      case 'sm':
        return 'p-4'
      case 'md':
        return 'p-6'
      case 'lg':
        return 'p-8'
      default:
        return 'p-6'
    }
  }

  return (
    <div className={`rounded-xl ${getVariantClasses()} ${getPaddingClasses()} ${className}`}>
      {children}
    </div>
  )
}

export default PlayBookdCard
