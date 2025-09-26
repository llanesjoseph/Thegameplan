'use client'

import React from 'react'

interface PlayBookdLayoutProps {
  children: React.ReactNode
  className?: string
}

const PlayBookdLayout: React.FC<PlayBookdLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* PlayBookd Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-playbookd-dark tracking-wide">
                PLAYBOOKD
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-playbookd-sky-blue rounded-full"></div>
              <div className="w-3 h-3 bg-playbookd-red rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  )
}

export default PlayBookdLayout
