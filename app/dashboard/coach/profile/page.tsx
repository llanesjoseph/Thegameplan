'use client'

import { useState } from 'react'
import { User, Image as ImageIcon, Settings, ArrowLeft } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import CoachImageManager from '@/components/coach/CoachImageManager'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CoachProfilePage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [activeTab, setActiveTab] = useState('images')

  // Only allow coaches to access this page
  if (role !== 'coach' && role !== 'admin' && role !== 'superadmin') {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
        {!embedded && <AppHeader title="Coach Profile" subtitle="Manage your coaching profile" />}

        <div className={`w-full ${embedded ? 'p-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, rgba(255, 107, 53, 0.8) 100%)' }}>
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>
              Access Restricted
            </h2>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Only approved coaches can access profile management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Coach Profile" subtitle="Manage your coaching profile and presentation" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8" style={{ color: '#FF6B35' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>My Profile</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Manage your coaching profile images, videos, and presentation
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-t-xl shadow-lg border border-white/50 border-b-0">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'images'
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ color: activeTab === 'images' ? '#000000' : 'rgba(0, 0, 0, 0.5)' }}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images & Videos
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ color: activeTab === 'profile' ? '#000000' : 'rgba(0, 0, 0, 0.5)' }}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Info
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ color: activeTab === 'settings' ? '#000000' : 'rgba(0, 0, 0, 0.5)' }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-b-xl shadow-lg border border-white/50">
          {activeTab === 'images' && (
            <div className="p-8">
              <CoachImageManager
                onProfileUpdate={(profile) => {
                  console.log('Profile updated:', profile)
                }}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="text-lg font-heading mb-6" style={{ color: '#000000' }}>
                  Profile Information
                </h3>

                {/* Current Profile */}
                <div className="rounded-xl p-6 border-2" style={{ backgroundColor: 'rgba(145, 166, 235, 0.05)', borderColor: 'rgba(145, 166, 235, 0.2)' }}>
                  <h4 className="font-semibold mb-4" style={{ color: '#000000' }}>
                    Current Profile
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      <span className="font-medium" style={{ color: '#000000' }}>Name:</span> {user?.displayName || 'Not set'}
                    </p>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      <span className="font-medium" style={{ color: '#000000' }}>Email:</span> {user?.email || 'Not set'}
                    </p>
                    <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      <span className="font-medium" style={{ color: '#000000' }}>Role:</span> Coach
                    </p>
                  </div>
                </div>

                {/* LinkedIn Profile */}
                <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(135deg, rgba(145, 166, 235, 0.1) 0%, rgba(145, 166, 235, 0.05) 100%)', borderColor: 'rgba(145, 166, 235, 0.3)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <h4 className="font-semibold" style={{ color: '#000000' }}>
                      LinkedIn Profile
                    </h4>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                    Add your LinkedIn profile to showcase your professional background and connect with athletes.
                  </p>
                  <a
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #91A6EB 0%, rgba(145, 166, 235, 0.9) 100%)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Edit LinkedIn & Social Profiles
                  </a>
                </div>

                {/* Full Profile Management */}
                <div className="rounded-xl p-6 border-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                  <h4 className="font-semibold mb-4" style={{ color: '#000000' }}>
                    Complete Profile Management
                  </h4>
                  <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                    For comprehensive profile editing including bio, specialties, achievements, and social links, visit your main profile page.
                  </p>
                  <a
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Go to Full Profile Editor
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(145, 166, 235, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
                  <Settings className="w-8 h-8" style={{ color: '#000000', opacity: 0.4 }} />
                </div>
                <h3 className="text-lg font-heading mb-2" style={{ color: '#000000' }}>
                  Profile Settings
                </h3>
                <p className="mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                  Advanced profile settings coming soon
                </p>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.5 }}>
                  This will include privacy settings, notification preferences, and visibility controls.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(135deg, rgba(145, 166, 235, 0.1) 0%, rgba(145, 166, 235, 0.05) 100%)', borderColor: 'rgba(145, 166, 235, 0.3)' }}>
          <h3 className="text-lg font-heading mb-3" style={{ color: '#000000' }}>
            Tips for Great Profile Images
          </h3>
          <ul className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
            <li>• Use high-quality, professional photos that represent your coaching style</li>
            <li>• Include action shots of you coaching or playing your sport</li>
            <li>• Keep your hero banner image relevant to your sport and coaching philosophy</li>
            <li>• Upload a highlight video to showcase your expertise and personality</li>
            <li>• Ensure all images are appropriate and professional</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
