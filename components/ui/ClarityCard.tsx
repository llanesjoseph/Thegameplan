'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ClarityCardProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: 'default' | 'elevated' | 'outline'
 padding?: 'none' | 'sm' | 'md' | 'lg'
 children: React.ReactNode
}

export function ClarityCard({ 
 variant = 'default', 
 padding = 'md', 
 className, 
 children, 
 ...props 
}: ClarityCardProps) {
 const baseStyles = 'rounded-lg transition-all duration-200'
 
 const variants = {
  default: 'bg-white border border-gray-200 shadow-card',
  elevated: 'bg-white shadow-card-md border border-gray-200',
  outline: 'bg-transparent border border-gray-200'
 }
 
 const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
 }
 
 return (
  <div
   className={cn(
    baseStyles,
    variants[variant],
    paddings[padding],
    className
   )}
   {...props}
  >
   {children}
  </div>
 )
}

export { ClarityCard as default }