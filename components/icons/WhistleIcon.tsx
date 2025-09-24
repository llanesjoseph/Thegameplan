import React from 'react'

interface WhistleIconProps {
  className?: string
  style?: React.CSSProperties
}

export function WhistleIcon({ className = "w-6 h-6", style }: WhistleIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 32 40"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0,-1020.3622)">
        {/* Whistle body */}
        <path d="M16 1024c-4.4 0-8 3.6-8 8s3.6 8 8 8c1.8 0 3.5-0.6 4.9-1.6l4.1 4.1c0.4 0.4 1 0.4 1.4 0s0.4-1 0-1.4l-4.1-4.1c1-1.4 1.6-3.1 1.6-4.9 0-4.4-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z" fill="currentColor"/>

        {/* Whistle hole */}
        <circle cx="16" cy="1032" r="1.5" fill="white"/>

        {/* Whistle chain attachment */}
        <path d="M12 1026c-0.6 0-1 0.4-1 1s0.4 1 1 1h1c0.6 0 1-0.4 1-1s-0.4-1-1-1h-1z" fill="currentColor"/>

        {/* Sound waves */}
        <path d="M6 1030c-0.3 0-0.5 0.1-0.7 0.3s-0.3 0.4-0.3 0.7c0 0.3 0.1 0.5 0.3 0.7l1 1c0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3 0.3-0.4 0.3-0.7c0-0.3-0.1-0.5-0.3-0.7l-1-1c-0.2-0.2-0.4-0.3-0.7-0.3z" fill="currentColor"/>
        <path d="M4 1028c-0.3 0-0.5 0.1-0.7 0.3s-0.3 0.4-0.3 0.7c0 0.3 0.1 0.5 0.3 0.7l2 2c0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3 0.3-0.4 0.3-0.7c0-0.3-0.1-0.5-0.3-0.7l-2-2c-0.2-0.2-0.4-0.3-0.7-0.3z" fill="currentColor"/>
      </g>
    </svg>
  )
}