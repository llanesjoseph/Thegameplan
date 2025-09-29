'use client'

import { useState } from 'react'
import { User, Image as ImageIcon, Settings, ArrowLeft } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import CoachImageManager from '@/components/coach/CoachImageManager'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import Link from 'next/link'

export default function CoachProfilePage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [activeTab, setActiveTab] = useState('images')

  // Only allow coaches to access this page
  if (role !== 'coach' && role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-orange to-orange/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl text-dark mb-2">Access Restricted</h2>
            <p className="text-dark/60">Only approved coaches can access profile management.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      <AppHeader />

      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <div>
            <h1 className="text-4xl text-dark font-heading">Coach Profile Management</h1>
            <p className="text-dark/60">
              Manage your coaching profile images, videos, and presentation
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-lg border border-white/50 border-b-0">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'images'
                  ? 'border-sky-blue text-sky-blue'
                  : 'border-transparent text-dark/50 hover:text-dark hover:border-dark/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images & Videos
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-sky-blue text-sky-blue'
                  : 'border-transparent text-dark/50 hover:text-dark hover:border-dark/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Info
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-sky-blue text-sky-blue'
                  : 'border-transparent text-dark/50 hover:text-dark hover:border-dark/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl shadow-lg border border-white/50">
          {activeTab === 'images' && (
            <div className="p-8">
              <CoachImageManager
                onProfileUpdate={(profile) => {
                  console.log('Profile updated:', profile)
                  // You can add additional handling here
                }}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg text-dark mb-6">Profile Information</h3>

                <div className="space-y-6">
                  {/* Quick Profile Info */}
                  <div className="bg-sky-blue/5 rounded-xl p-6 border border-sky-blue/20">
                    <h4 className="font-medium text-dark mb-4">Current Profile</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-dark/70"><span className="font-medium text-dark">Name:</span> {user?.displayName || 'Not set'}</p>
                      <p className="text-sm text-dark/70"><span className="font-medium text-dark">Email:</span> {user?.email || 'Not set'}</p>
                      <p className="text-sm text-dark/70"><span className="font-medium text-dark">Role:</span> Coach</p>
                    </div>
                  </div>

                  {/* LinkedIn Profile Section */}
                  <div className="bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 rounded-xl p-6 border border-sky-blue/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-sky-blue to-black rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </div>
                      <h4 className="font-medium text-dark">LinkedIn Profile</h4>
                    </div>
                    <p className="text-sm text-dark/70 mb-4">
                      Add your LinkedIn profile to showcase your professional background and connect with athletes.
                    </p>
                    <a
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Edit LinkedIn & Social Profiles
                    </a>
                  </div>

                  {/* Full Profile Management */}
                  <div className="bg-dark/5 rounded-xl p-6 border border-dark/10">
                    <h4 className="font-medium text-dark mb-4">Complete Profile Management</h4>
                    <p className="text-sm text-dark/70 mb-4">
                      For comprehensive profile editing including bio, specialties, achievements, and social links, visit your main profile page.
                    </p>
                    <a
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-black to-dark text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all text-sm font-medium"
                    >
                      <User className="w-4 h-4" />
                      Go to Full Profile Editor
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-blue/20 to-black/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-dark/40" />
                </div>
                <h3 className="text-lg text-dark mb-2">Profile Settings</h3>
                <p className="text-dark/60 mb-4">
                  Advanced profile settings coming soon
                </p>
                <p className="text-sm text-dark/50">
                  This will include privacy settings, notification preferences, and visibility controls.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-br from-sky-blue/10 to-sky-blue/5 border border-sky-blue/30 rounded-2xl p-6">
          <h3 className="text-lg text-dark mb-2">Tips for Great Profile Images</h3>
          <ul className="text-sm text-dark/70 space-y-1">
            <li>• Use high-quality, professional photos that represent your coaching style</li>
            <li>• Include action shots of you coaching or playing your sport</li>
            <li>• Keep your hero banner image relevant to your sport and coaching philosophy</li>
            <li>• Upload a highlight video to showcase your expertise and personality</li>
            <li>• Ensure all images are appropriate and professional</li>
          </ul>
        </div>
      </div>
    </div>
  )
}