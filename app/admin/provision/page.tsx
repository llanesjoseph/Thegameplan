'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'

export default function ProvisionPage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const superadminEmails = [
    'joseph@crucibleanalytics.dev',
    'LonaLorraine.Vincent@gmail.com',
    'merlinesaintil@gmail.com'
  ]

  const manualProvision = async (email: string) => {
    if (!user) return

    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/provision-superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid: user.uid })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  if (role !== 'superadmin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">This page is only accessible to superadmins.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Superadmin Auto-Provisioning</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">🤖 Automatic Provisioning</h2>
        <p className="text-blue-700 mb-4">
          When any of these users sign in, they will automatically be provisioned as superadmins:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          {superadminEmails.map(email => (
            <li key={email} className="font-mono">{email}</li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-blue-100 rounded border">
          <strong>How it works:</strong> The system detects when these specific emails sign in and automatically:
          <ul className="mt-2 list-disc list-inside text-sm">
            <li>Creates superadmin user record with all permissions</li>
            <li>Sets up complete user profile</li>
            <li>Creates pre-approved contributor application</li>
            <li>Enables role switching capabilities</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 Manual Provisioning</h2>
        <p className="text-gray-600 mb-4">
          If automatic provisioning fails, you can manually trigger it:
        </p>

        <div className="space-y-4">
          {superadminEmails.map(email => (
            <div key={email} className="flex items-center justify-between p-3 border rounded">
              <span className="font-mono">{email}</span>
              <button
                onClick={() => manualProvision(email)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Provisioning...' : 'Provision'}
              </button>
            </div>
          ))}
        </div>

        {result && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Current Status</h2>
        <div className="text-sm text-gray-600">
          <p><strong>Your Email:</strong> {user?.email}</p>
          <p><strong>Your Role:</strong> {role}</p>
          <p><strong>Auto-Provisioning:</strong> Active</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}