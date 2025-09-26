import React from 'react'

interface TeachingIconProps {
 className?: string
 style?: React.CSSProperties
}

export function TeachingIcon({ className = "w-6 h-6", style }: TeachingIconProps) {
 return (
  <svg
   className={className}
   style={style}
   viewBox="0 0 32 40"
   fill="currentColor"
   xmlns="http://www.w3.org/2000/svg"
  >
   <g transform="translate(0,-1020.3622)">
    {/* Person figure */}
    <circle cx="10" cy="1028" r="3" fill="currentColor"/>
    <path d="M10 1033c-2.2 0-4 1.8-4 4v6h8v-6c0-2.2-1.8-4-4-4z" fill="currentColor"/>

    {/* Pointing arm/hand */}
    <path d="M14 1036l6-2c0.5-0.2 1.1 0.1 1.3 0.6l1 3c0.2 0.5-0.1 1.1-0.6 1.3l-6 2c-0.5 0.2-1.1-0.1-1.3-0.6l-1-3c-0.2-0.5 0.1-1.1 0.6-1.3z" fill="currentColor"/>

    {/* Teaching board/screen */}
    <rect x="20" y="1024" width="8" height="6" rx="1" fill="currentColor"/>
    <rect x="21" y="1025" width="6" height="4" rx="0.5" fill="white"/>

    {/* Board content lines */}
    <line x1="22" y1="1026" x2="26" y2="1026" stroke="currentColor" strokeWidth="0.5"/>
    <line x1="22" y1="1027" x2="25" y2="1027" stroke="currentColor" strokeWidth="0.5"/>
    <line x1="22" y1="1028" x2="26" y2="1028" stroke="currentColor" strokeWidth="0.5"/>

    {/* Board stand */}
    <line x1="24" y1="1030" x2="24" y2="1035" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="22" y1="1035" x2="26" y2="1035" stroke="currentColor" strokeWidth="1"/>
   </g>
  </svg>
 )
}