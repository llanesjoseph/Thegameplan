'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getAuth } from 'firebase/auth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function FixJosephRole() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const fixRole = async () => {
    if (!user) {
      setResult({ success: false, message: 'You must be signed in' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const auth = getAuth()
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        throw new Error('Failed to get authentication token')
      }

      const response = await fetch('/api/admin/fix-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: 'llanes.joseph.m@gmail.com',
          newRole: 'creator',
          reason: 'Setting up Joseph Llanes as BJJ coach/creator'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `✅ Role updated successfully! ${data.message}\n\nPlease sign out and sign back in for changes to take effect.`
        })
      } else {
        setResult({
          success: false,
          message: `❌ Failed: ${data.error || 'Unknown error'}`
        })
      }
    } catch (error) {
      console.error('Error fixing role:', error)
      setResult({
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Fix Joseph's Role
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            This will update <strong>llanes.joseph.m@gmail.com</strong> role from <strong>user</strong> to <strong>creator</strong> (coach).
          </p>
        </div>

        {user ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✅ Signed in as: <strong>{user.email}</strong>
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              ❌ Not signed in. Please sign in as admin/superadmin first.
            </p>
          </div>
        )}

        <button
          onClick={fixRole}
          disabled={loading || !user}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating Role...
            </>
          ) : (
            'Fix Joseph\'s Role'
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm whitespace-pre-wrap ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
