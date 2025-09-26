'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import AppHeader from '@/components/ui/AppHeader'
import { Bell, Shield, User, Palette, Database, Save } from 'lucide-react'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    profileVisible: boolean
    showEmail: boolean
    showProgress: boolean
  }
  preferences: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showProgress: true
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserSettings()
  }, [user])

  const loadUserSettings = async () => {
    if (!user?.uid) return

    try {
      const settingsDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'))
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user?.uid) return

    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
        ...settings,
        updatedAt: new Date()
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateNotification = (key: keyof UserSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  const updatePrivacy = (key: keyof UserSettings['privacy']) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }))
  }

  const updatePreference = (key: keyof UserSettings['preferences'], value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-4"></div>
            <p className="text-dark">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl text-dark mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-sky-blue" />
              <h2 className="text-xl text-dark">Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Email notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={() => updateNotification('email')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Push notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={() => updateNotification('push')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Marketing emails</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.marketing}
                  onChange={() => updateNotification('marketing')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-sky-blue" />
              <h2 className="text-xl text-dark">Privacy</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Make profile visible to others</span>
                <input
                  type="checkbox"
                  checked={settings.privacy.profileVisible}
                  onChange={() => updatePrivacy('profileVisible')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Show email on profile</span>
                <input
                  type="checkbox"
                  checked={settings.privacy.showEmail}
                  onChange={() => updatePrivacy('showEmail')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Show progress to others</span>
                <input
                  type="checkbox"
                  checked={settings.privacy.showProgress}
                  onChange={() => updatePrivacy('showProgress')}
                  className="w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                />
              </label>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-sky-blue" />
              <h2 className="text-xl text-dark">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Theme</label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => updatePreference('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Language</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => updatePreference('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => updatePreference('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role-Specific Settings */}
          {(role === 'admin' || role === 'superadmin') && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-sky-blue" />
                <h2 className="text-xl text-dark">Admin Settings</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Advanced admin settings are available in the{' '}
                <a href="/dashboard/admin/settings" className="text-sky-blue hover:underline">
                  admin dashboard
                </a>
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors ${
                saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-sky-blue hover:opacity-90'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}