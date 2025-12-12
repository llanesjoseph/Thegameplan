'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import AppHeader from '@/components/ui/AppHeader'
import { Bell, Shield, User, Palette, Database, Save, CreditCard, AlertTriangle, XCircle } from 'lucide-react'

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadUserSettings()
    if (user && role === 'athlete') {
      loadSubscriptionStatus()
    }
  }, [user, role])

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

  const loadSubscriptionStatus = async () => {
    if (!user?.uid) return

    try {
      setLoadingSubscription(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/subscriptions/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Error loading subscription status:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user?.uid) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.'
    )

    if (!confirmed) return

    setCanceling(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Your subscription has been scheduled for cancellation. You will continue to have access until the end of your current billing period.')
        await loadSubscriptionStatus()
      } else {
        alert(data.error || 'Failed to cancel subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setCanceling(false)
    }
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

          {/* Subscription Management Section - For Athletes */}
          {role === 'athlete' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-sky-blue" />
                <h2 className="text-xl text-dark">Subscription</h2>
              </div>

              {loadingSubscription ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-blue"></div>
                </div>
              ) : subscriptionStatus?.tier && subscriptionStatus.tier !== 'none' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Current Plan</span>
                      <span className="px-3 py-1 bg-sky-blue text-white rounded-full text-sm font-semibold">
                        {subscriptionStatus.tier === 'basic' ? 'Tier 2' : subscriptionStatus.tier === 'elite' ? 'Tier 3' : subscriptionStatus.tier}
                      </span>
                    </div>
                    {subscriptionStatus.isActive && !subscriptionStatus.billing?.cancelAtPeriodEnd && (
                      <p className="text-sm text-gray-600 mt-2">
                        Your subscription is active and will renew automatically.
                      </p>
                    )}
                    {subscriptionStatus.billing?.cancelAtPeriodEnd && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              Subscription scheduled for cancellation
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Your subscription will end on {subscriptionStatus.billing?.currentPeriodEnd ? new Date(subscriptionStatus.billing.currentPeriodEnd).toLocaleDateString() : 'the end of your billing period'}. You will continue to have access until then.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!subscriptionStatus.billing?.cancelAtPeriodEnd && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={canceling}
                        className={`flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg transition-colors ${
                          canceling
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-red-50 hover:border-red-400'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        {canceling ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Your subscription will remain active until the end of your current billing period.
                      </p>
                    </div>
                  )}

                  {subscriptionStatus.billing?.currentPeriodEnd && (
                    <div className="text-xs text-gray-500">
                      Next billing date: {new Date(subscriptionStatus.billing.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 mb-4">You are currently on the free plan.</p>
                  <a
                    href="/dashboard/athlete/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-blue text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    View Pricing Plans
                  </a>
                </div>
              )}
            </div>
          )}

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