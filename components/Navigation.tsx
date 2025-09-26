'use client'

import React from 'react'
import Link from 'next/link'

const Navigation = () => {
  return (
    <nav className="bg-white fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-lg font-brand font-bold text-black tracking-wide">
              PLAYBOOKD
            </Link>
          </div>

          {/* Right Side - Red Sign In button */}
          <div className="flex items-center">
            <Link href="/dashboard" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
