import React from 'react'

interface SoccerIconProps {
 className?: string
 style?: React.CSSProperties
}

export function SoccerIcon({ className = "w-6 h-6", style }: SoccerIconProps) {
 return (
  <svg
   className={className}
   style={style}
   viewBox="0 0 100 100"
   fill="currentColor"
   xmlns="http://www.w3.org/2000/svg"
  >
   <circle cx="50" cy="50" r="45" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
   <path
    d="M50 15 L35 35 L15 35 L25 55 L15 75 L35 65 L50 85 L65 65 L85 75 L75 55 L85 35 L65 35 Z"
    fill="none"
    stroke="white"
    strokeWidth="2"
   />
   <polygon
    points="50,25 42,35 58,35"
    fill="white"
   />
   <polygon
    points="35,42 25,52 35,62"
    fill="white"
   />
   <polygon
    points="65,42 75,52 65,62"
    fill="white"
   />
   <polygon
    points="42,65 50,75 58,65"
    fill="white"
   />
  </svg>
 )
}