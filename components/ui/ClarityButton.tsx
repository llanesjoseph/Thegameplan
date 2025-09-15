'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ClarityButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function ClarityButton({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  icon,
  className, 
  children, 
  ...props 
}: ClarityButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-clarity-primary text-white hover:bg-clarity-primary/90 focus:ring-clarity-primary/50',
    secondary: 'bg-clarity-secondary text-white hover:bg-clarity-secondary/90 focus:ring-clarity-secondary/50',
    ghost: 'bg-transparent text-clarity-text hover:bg-clarity-surface focus:ring-clarity-primary/50',
    outline: 'border border-clarity-border text-clarity-text hover:bg-clarity-surface focus:ring-clarity-primary/50'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}

export { ClarityButton as default }