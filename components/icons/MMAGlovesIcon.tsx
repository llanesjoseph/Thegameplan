import React from 'react'

interface MMAGlovesIconProps {
 className?: string
 style?: React.CSSProperties
}

export function MMAGlovesIcon({ className = "w-6 h-6", style }: MMAGlovesIconProps) {
 return (
  <svg
   className={className}
   style={style}
   viewBox="0 0 100 100"
   fill="currentColor"
   xmlns="http://www.w3.org/2000/svg"
  >
   {/* Left glove */}
   <path
    d="M20 30 Q15 25 15 35 L15 55 Q15 65 25 65 L35 65 Q40 60 40 50 L40 35 Q35 25 25 30 Z"
    fill="currentColor"
   />

   {/* Right glove */}
   <path
    d="M80 30 Q85 25 85 35 L85 55 Q85 65 75 65 L65 65 Q60 60 60 50 L60 35 Q65 25 75 30 Z"
    fill="currentColor"
   />

   {/* Knuckle details */}
   <circle cx="25" cy="40" r="3" fill="white"/>
   <circle cx="30" cy="38" r="3" fill="white"/>
   <circle cx="35" cy="40" r="3" fill="white"/>

   <circle cx="75" cy="40" r="3" fill="white"/>
   <circle cx="70" cy="38" r="3" fill="white"/>
   <circle cx="65" cy="40" r="3" fill="white"/>

   {/* Wrist straps */}
   <rect x="15" y="60" width="25" height="8" rx="4" fill="currentColor" opacity="0.7"/>
   <rect x="60" y="60" width="25" height="8" rx="4" fill="currentColor" opacity="0.7"/>
  </svg>
 )
}