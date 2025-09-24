import React from 'react'

interface PlayIconProps {
  className?: string
  style?: React.CSSProperties
}

export function PlayIcon({ className = "w-6 h-6", style }: PlayIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 32 40"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0,-1020.3622)">
        {/* Play button circle */}
        <circle cx="16" cy="1036.3622" r="12" fill="currentColor"/>
        <circle cx="16" cy="1036.3622" r="10" fill="white"/>

        {/* Play triangle */}
        <path d="M13 1030.3622l8 6-8 6v-12z" fill="currentColor"/>
      </g>
    </svg>
  )
}