'use client'

import React from 'react'

interface CircularBadgeProps {
  text?: string
  userRole?: 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach' | 'guest'
  className?: string
}

export default function CircularBadge({ text, userRole, className = '' }: CircularBadgeProps) {
  // Determine text based on role if not explicitly provided
  const displayText = text || (() => {
    switch (userRole) {
      case 'creator': return 'Coach Portal'
      case 'user': return 'Athlete Zone'
      case 'admin': return 'Admin Hub'
      case 'superadmin': return 'Super Admin'
      case 'assistant_coach': return 'Assistant Coach'
      default: return 'Athletic Coach'
    }
  })()
  return (
    <div className={`circular-badge-container ${className}`}>
      <div className="space-label">
        <div className="top">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
          <div className="ring ring-3"></div>
        </div>
        <div className="text">
          {displayText}
        </div>
        <div className="bottom">
          <div className="ring ring-1"></div>
          <div className="ring ring-2"></div>
          <div className="ring ring-3"></div>
        </div>
      </div>

      <style jsx>{`
        .circular-badge-container {
          position: relative;
          margin: 0 auto;
          width: 340px;
          height: 170px;
        }

        .space-label {
          width: 340px;
          margin: 0 auto;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .top,
        .bottom {
          height: 60px;
          overflow: hidden;
          position: relative;
          width: 170px;
          margin: 0 auto;
        }

        .ring {
          border-radius: 100%;
          position: absolute;
          width: 170px;
          height: 170px;
          border: 3px solid #B91C1C;
          border-width: 8px;
        }

        .ring.ring-2 {
          border-width: 4px;
          width: 154px;
        }

        .ring.ring-2::after {
          content: '';
          width: 18px;
          position: absolute;
          border-top: 1px solid #B91C1C;
          left: 50%;
          margin-left: -9px;
        }

        .ring.ring-2::before {
          content: '';
          width: 32px;
          position: absolute;
          border-top: 1px solid #B91C1C;
          margin-left: -16px;
          left: 50%;
        }

        .ring.ring-3 {
          border-width: 2px;
          width: 139px;
        }

        .top .ring.ring-1 {
          top: 0;
          left: 0;
        }

        .top .ring.ring-2 {
          top: 10px;
          left: 8px;
        }

        .top .ring.ring-2::after {
          top: 17px;
        }

        .top .ring.ring-2::before {
          top: 22px;
        }

        .top .ring.ring-3 {
          top: 20px;
          left: 16px;
        }

        .top .ring.ring-3::after {
          top: 17px;
        }

        .top .ring.ring-3::before {
          top: 22px;
        }

        .bottom .ring.ring-1 {
          bottom: 0;
          left: 0;
        }

        .bottom .ring.ring-2 {
          bottom: 10px;
          left: 8px;
        }

        .bottom .ring.ring-2::after {
          bottom: 17px;
        }

        .bottom .ring.ring-2::before {
          bottom: 22px;
        }

        .bottom .ring.ring-3 {
          bottom: 20px;
          left: 16px;
        }

        .bottom .ring.ring-3::after {
          bottom: 17px;
        }

        .bottom .ring.ring-3::before {
          bottom: 22px;
        }

        .text {
          text-align: center;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #B91C1C;
          height: 55px;
          vertical-align: middle;
          display: table-cell;
          width: 340px;
          position: relative;
          left: 7px;
          letter-spacing: 4px;
          line-height: 55px;
        }

        @media (max-width: 768px) {
          .circular-badge-container {
            width: 280px;
            height: 140px;
          }

          .space-label {
            width: 280px;
          }

          .top, .bottom {
            width: 140px;
          }

          .ring {
            width: 140px;
            height: 140px;
          }

          .ring.ring-2 {
            width: 126px;
          }

          .ring.ring-3 {
            width: 114px;
          }

          .text {
            font-size: 18px;
            width: 280px;
            letter-spacing: 2px;
          }
        }
      `}</style>
    </div>
  )
}