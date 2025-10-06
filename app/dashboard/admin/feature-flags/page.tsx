'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { getAuth } from 'firebase/auth'
import {
  Settings,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

interface FeatureFlag {
  enabled: boolean
  enabledAt?: { _seconds: number }
  enabledBy?: string
  disabledAt?: { _seconds: number }
  disabledBy?: string
  description?: string
}

interface FeatureFlags {
  direct_messaging: FeatureFlag
}

export default function FeatureFlagsPage() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const router = useRouter()
  const [flags, setFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && role !== 'admin' && role !== 'superadmin') {
      router.replace('/dashboard')
    }
  }, [role, roleLoading, router])

  // Load feature flags
  useEffect(() => {
    const loadFlags = async () => {
      if (!user) return

      try {
        const auth = getAuth()
        const token = await auth.currentUser?.getIdToken()

        const response = await fetch('/api/admin/feature-flags', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) throw new Error('Failed to load feature flags')

        const data = await response.json()
        setFlags(data)
      } catch (error) {
        console.error('Error loading feature flags:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFlags()
  }, [user])

  const toggleFeature = async (featureName: keyof FeatureFlags, currentState: boolean) => {
    if (!user) return

    setUpdating(featureName)

    try {
      const auth = getAuth()
      const token = await auth.currentUser?.getIdToken()

      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          featureName,
          enabled: !currentState
        })
      })

      if (!response.ok) throw new Error('Failed to update feature flag')

      // Reload flags
      const flagsResponse = await fetch('/api/admin/feature-flags', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const updatedFlags = await flagsResponse.json()
      setFlags(updatedFlags)
    } catch (error) {
      console.error('Error updating feature flag:', error)
      alert('Failed to update feature flag')
    } finally {
      setUpdating(null)
    }
  }

  const formatTimestamp = (timestamp?: { _seconds: number }) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp._seconds * 1000).toLocaleString()
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#91A6EB' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader />

      {/* Header */}
      <div className="text-center py-12 px-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Settings className="w-8 h-8" style={{ color: '#000000' }} />
          <h1 className="text-3xl font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
            Feature Flags
          </h1>
        </div>
        <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>
          Enable or disable platform features in real-time
        </p>
      </div>

      {/* Feature Flags Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid gap-6">
          {/* Direct Messaging Feature */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#91A6EB' }}
                  >
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                      Direct Messaging
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                      {flags?.direct_messaging?.description ||
                        'Direct messaging between athletes and coaches'}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-4">
                      {flags?.direct_messaging?.enabled ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-600">ENABLED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">DISABLED</span>
                        </>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      {flags?.direct_messaging?.enabled && flags.direct_messaging.enabledAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Enabled: {formatTimestamp(flags.direct_messaging.enabledAt)}
                          </span>
                        </div>
                      )}
                      {!flags?.direct_messaging?.enabled && flags?.direct_messaging?.disabledAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Disabled: {formatTimestamp(flags.direct_messaging.disabledAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() =>
                    toggleFeature('direct_messaging', flags?.direct_messaging?.enabled || false)
                  }
                  disabled={updating === 'direct_messaging'}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    flags?.direct_messaging?.enabled
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'text-white hover:opacity-90'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                  style={
                    !flags?.direct_messaging?.enabled
                      ? { backgroundColor: '#20B2AA' }
                      : undefined
                  }
                >
                  {updating === 'direct_messaging' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : flags?.direct_messaging?.enabled ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </button>
              </div>
            </div>

            {/* Safety Notice */}
            {flags?.direct_messaging?.enabled && (
              <div className="bg-blue-50 border-t border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Safety Systems Active
                    </p>
                    <p className="text-xs text-blue-800">
                      All messages are monitored, logged, and moderated. Phone number exchanges
                      trigger critical alerts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!flags?.direct_messaging?.enabled && (
              <div className="bg-yellow-50 border-t border-yellow-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Athletes see "Coming Soon"
                    </p>
                    <p className="text-xs text-yellow-800">
                      Athletes can use AI Coach chat in the meantime. Backend safety systems remain
                      active.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/80 rounded-xl p-6 border-l-4 border-sky-blue">
          <h4 className="font-heading text-lg mb-2" style={{ color: '#000000' }}>
            About Feature Flags
          </h4>
          <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.7 }}>
            Feature flags allow you to enable or disable platform features in real-time without
            deploying code changes. This is useful for:
          </p>
          <ul className="text-sm space-y-2" style={{ color: '#000000', opacity: 0.7 }}>
            <li>• Gradual feature rollouts</li>
            <li>• A/B testing</li>
            <li>• Emergency feature disabling</li>
            <li>• Testing features with select users</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
