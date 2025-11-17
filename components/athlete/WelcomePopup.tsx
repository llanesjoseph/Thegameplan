'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface WelcomePopupProps {
  athleteName?: string
  coachName?: string
  onClose: () => void
}

export default function WelcomePopup({ athleteName, coachName, onClose }: WelcomePopupProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setShow(true), 100)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        opacity: show ? 1 : 0
      }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300"
        style={{
          transform: show ? 'scale(1)' : 'scale(0.9)',
          opacity: show ? 1 : 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="relative px-8 pt-8">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" style={{ color: '#000000' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-4">
          {/* Logo Banner with Tagline */}
          <div className="w-full h-40 rounded-lg flex flex-col items-center justify-center mb-8" style={{ backgroundColor: '#440102' }}>
            <img
              src="/brand/athleap-logo-colored.png"
              alt="ATHLEAP"
              className="h-24 w-auto mb-2"
            />
            <p className="text-white text-xs tracking-widest" style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.15em' }}>
              THE WORK BEFORE THE WIN
            </p>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Welcome to Athleap, {athleteName || 'Athlete'}!
            </h1>

            <p className="text-lg leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              We are so glad you are here. You are now a part of the Athleap community,
              and we hope to help you with your game. Here's what to do next:
            </p>

            {/* Next Steps - Simplified per design spec */}
            <div className="bg-gray-50 rounded-lg p-8 text-left space-y-4 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  1
                </div>
                <p className="font-semibold pt-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Personalize your profile
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  2
                </div>
                <p className="font-semibold pt-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  {coachName ? `Connect with ${coachName}` : 'Find a coach to support your journey'}
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  3
                </div>
                <p className="font-semibold pt-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Start training
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="w-full py-4 px-6 rounded-lg text-lg font-bold transition-colors"
              style={{
                backgroundColor: '#000000',
                color: '#FFFFFF',
                fontFamily: '"Open Sans", sans-serif'
              }}
            >
              Let's Get Started!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
