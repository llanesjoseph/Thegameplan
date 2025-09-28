'use client'

import { useState } from 'react'
import { User, Image as ImageIcon, Settings, Save } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import CoachImageManager from '@/components/coach/CoachImageManager'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'

export default function CoachProfilePage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [activeTab, setActiveTab] = useState('images')

  // Only allow coaches to access this page
  if (role !== 'coach' && role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only approved coaches can access profile management.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach Profile Management</h1>
          <p className="text-gray-600">
            Manage your coaching profile images, videos, and presentation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>

                <div className="space-y-6">
                  {/* Quick Profile Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Current Profile</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {user?.displayName || 'Not set'}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {user?.email || 'Not set'}</p>
                      <p className="text-sm"><span className="font-medium">Role:</span> Coach</p>
                    </div>
                  </div>

                  {/* LinkedIn Profile Section */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900">LinkedIn Profile</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Add your LinkedIn profile to showcase your professional background and connect with athletes.
                    </p>
                    <a
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Edit LinkedIn & Social Profiles
                    </a>
                  </div>

                  {/* Full Profile Management */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Complete Profile Management</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      For comprehensive profile editing including bio, specialties, achievements, and social links, visit your main profile page.
                    </p>
                    <a
                      href="/dashboard/profile"
                      className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
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
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Settings</h3>
                <p className="text-gray-600 mb-4">
                  Advanced profile settings coming soon
                </p>
                <p className="text-sm text-gray-500">
                  This will include privacy settings, notification preferences, and visibility controls.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Tips for Great Profile Images</h3>
          <ul className="text-sm text-blue-800 space-y-1">
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