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
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h3>
                <p className="text-gray-600 mb-4">
                  Profile information editing coming soon
                </p>
                <p className="text-sm text-gray-500">
                  Currently, profile information is managed through the coach application process.
                </p>
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