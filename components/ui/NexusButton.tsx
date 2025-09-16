import React from 'react'
import { cn } from '@/lib/utils'

interface ClarityButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  icon?: React.ReactNode
  loading?: boolean
}

const ClarityButton: React.FC<ClarityButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  icon,
  loading = false
}) => {
  const baseClasses = 'clarity-btn focus-visible'
  
  const variantClasses = {
    primary: 'clarity-btn-primary',
    secondary: 'clarity-btn-secondary',
    ghost: 'bg-transparent text-clarity-text-secondary hover:text-clarity-accent hover:bg-clarity-accent/5 border-transparent'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-button gap-2',
    lg: 'px-8 py-4 text-lg gap-3'
  }
  
  const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed hover:transform-none hover:scale-100 pointer-events-none' : ''
  
  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className
  )
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : icon}
      {children}
    </button>
  )
}

// Legacy export for backward compatibility
export const NexusButton = ClarityButton
export default ClarityButton
