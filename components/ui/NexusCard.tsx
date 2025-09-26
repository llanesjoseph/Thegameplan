import React from 'react'
import { cn } from '@/lib/utils'

interface ClarityCardProps {
 children: React.ReactNode
 className?: string
 variant?: 'glass' | 'surface' | 'elevated'
 size?: 'sm' | 'md' | 'lg'
 hover?: boolean
 interactive?: boolean
}

const ClarityCard: React.FC<ClarityCardProps> = ({
 children,
 className,
 variant = 'glass',
 size = 'md',
 hover = true,
 interactive = false
}) => {
 const baseClasses = 'clarity-card'
 
 const variantClasses = {
  glass: 'clarity-glass-card',
  surface: 'bg-clarity-surface border border-clarity-text-secondary/10 rounded-lg shadow-clarity-sm',
  elevated: 'bg-clarity-surface rounded-lg shadow-clarity-md hover:shadow-clarity-lg'
 }
 
 const sizeClasses = {
  sm: 'p-4',
  md: 'p-6', 
  lg: 'p-8'
 }
 
 const interactiveClasses = interactive ? 'cursor-pointer' : ''
 const noHoverClasses = !hover ? 'hover:transform-none hover:shadow-none' : ''
 
 const cardClasses = cn(
  baseClasses,
  variantClasses[variant],
  sizeClasses[size],
  interactiveClasses,
  noHoverClasses,
  className
 )
 
 return (
  <div className={cardClasses}>
   {children}
  </div>
 )
}

// Legacy export for backward compatibility
export const NexusCard = ClarityCard
export default ClarityCard
