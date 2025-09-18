'use client'

import React from 'react'

interface CircularBadgeProps {
  text?: string
  userRole?: 'user' | 'creator' | 'admin' | 'superadmin' | 'assistant_coach' | 'guest'
  className?: string
  size?: 'small' | 'normal'
}

export default function CircularBadge({ text, userRole, className = '', size = 'normal' }: CircularBadgeProps) {
  // Determine text based on role if not explicitly provided
  const displayText = text || (() => {
    switch (userRole) {
      case 'creator': return 'Coach'
      case 'user': return 'Athlete'
      case 'admin': return 'Admin'
      case 'superadmin': return 'Super Admin'
      case 'assistant_coach': return 'Assistant'
      default: return 'Coach'
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
          width: ${size === 'small' ? '100px' : '340px'};
          height: ${size === 'small' ? '50px' : '170px'};
        }

        .space-label {
          width: ${size === 'small' ? '100px' : '340px'};
          margin: 0 auto;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .top,
        .bottom {
          height: ${size === 'small' ? '25px' : '60px'};
          overflow: hidden;
          position: relative;
          width: ${size === 'small' ? '50px' : '170px'};
          margin: 0 auto;
        }

        .ring {
          border-radius: 100%;
          position: absolute;
          width: ${size === 'small' ? '50px' : '170px'};
          height: ${size === 'small' ? '50px' : '170px'};
          border: 3px solid #B91C1C;
          border-width: ${size === 'small' ? '2px' : '8px'};
        }

        .ring.ring-2 {
          border-width: ${size === 'small' ? '1px' : '4px'};
          width: ${size === 'small' ? '45px' : '154px'};
        }

        .ring.ring-2::after {
          content: '';
          width: ${size === 'small' ? '5px' : '18px'};
          position: absolute;
          border-top: 1px solid #B91C1C;
          left: 50%;
          margin-left: ${size === 'small' ? '-2.5px' : '-9px'};
        }

        .ring.ring-2::before {
          content: '';
          width: ${size === 'small' ? '8px' : '32px'};
          position: absolute;
          border-top: 1px solid #B91C1C;
          margin-left: ${size === 'small' ? '-4px' : '-16px'};
          left: 50%;
        }

        .ring.ring-3 {
          border-width: ${size === 'small' ? '1px' : '2px'};
          width: ${size === 'small' ? '40px' : '139px'};
        }

        .top .ring.ring-1 {
          top: 0;
          left: 0;
        }

        .top .ring.ring-2 {
          top: ${size === 'small' ? '2.5px' : '10px'};
          left: ${size === 'small' ? '2.5px' : '8px'};
        }

        .top .ring.ring-2::after {
          top: ${size === 'small' ? '4px' : '17px'};
        }

        .top .ring.ring-2::before {
          top: ${size === 'small' ? '6px' : '22px'};
        }

        .top .ring.ring-3 {
          top: ${size === 'small' ? '5px' : '20px'};
          left: ${size === 'small' ? '5px' : '16px'};
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
          font-size: ${size === 'small' ? '7px' : '24px'};
          font-weight: 900;
          color: #B91C1C;
          height: ${size === 'small' ? '24px' : '55px'};
          vertical-align: middle;
          display: table-cell;
          width: ${size === 'small' ? '100px' : '340px'};
          position: relative;
          left: ${size === 'small' ? '0px' : '7px'};
          letter-spacing: ${size === 'small' ? '0.5px' : '4px'};
          line-height: ${size === 'small' ? '24px' : '55px'};
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