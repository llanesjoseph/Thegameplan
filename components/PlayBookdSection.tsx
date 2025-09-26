'use client'

import React from 'react'

interface PlayBookdSectionProps {
  children: React.ReactNode
  variant?: 'blue' | 'red' | 'cream' | 'white'
  className?: string
}

const PlayBookdSection: React.FC<PlayBookdSectionProps> = ({ 
  children, 
  variant = 'blue', 
  className = '' 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'blue':
        return 'bg-playbookd-deep-sea text-white'
      case 'red':
        return 'bg-playbookd-red text-white'
      case 'cream':
        return 'bg-playbookd-cream text-playbookd-dark'
      case 'white':
        return 'bg-white text-playbookd-dark'
      default:
        return 'bg-playbookd-deep-sea text-white'
    }
  }

  return (
    <section className={`py-12 px-6 ${getVariantClasses()} ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  )
}

export default PlayBookdSection
