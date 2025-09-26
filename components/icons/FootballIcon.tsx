import React from 'react'

interface FootballIconProps {
 className?: string
 style?: React.CSSProperties
}

export function FootballIcon({ className = "w-6 h-6", style }: FootballIconProps) {
 return (
  <svg
   className={className}
   style={style}
   viewBox="0 0 100 100"
   fill="currentColor"
   xmlns="http://www.w3.org/2000/svg"
  >
   <ellipse cx="50" cy="50" rx="35" ry="45" fill="currentColor"/>

   {/* Football laces */}
   <line
    x1="50" y1="25"
    x2="50" y2="75"
    stroke="white"
    strokeWidth="2"
   />
   <line
    x1="45" y1="35"
    x2="55" y2="35"
    stroke="white"
    strokeWidth="2"
   />
   <line
    x1="45" y1="45"
    x2="55" y2="45"
    stroke="white"
    strokeWidth="2"
   />
   <line
    x1="45" y1="55"
    x2="55" y2="55"
    stroke="white"
    strokeWidth="2"
   />
   <line
    x1="45" y1="65"
    x2="55" y2="65"
    stroke="white"
    strokeWidth="2"
   />
  </svg>
 )
}