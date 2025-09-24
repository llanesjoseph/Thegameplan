import React from 'react'

interface BasketballIconProps {
  className?: string
  style?: React.CSSProperties
}

export function BasketballIcon({ className = "w-6 h-6", style }: BasketballIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="currentColor"/>

      {/* Basketball lines */}
      <path
        d="M50 5 Q25 25 25 50 Q25 75 50 95"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M50 5 Q75 25 75 50 Q75 75 50 95"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      <line
        x1="5" y1="50"
        x2="95" y2="50"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  )
}