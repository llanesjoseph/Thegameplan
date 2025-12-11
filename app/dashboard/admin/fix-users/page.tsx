'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { Shield, Wrench, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminFixUsersPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runCreatedAtFix = async () => {
    if (!confirm('This will add createdAt field to all users who are missing it. Continue?')) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await user?.getIdToken()

      const response = await fetch('/api/admin/fix-missing-createdAt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run fix')
      }

      setResult(data)
      console.log('✅ Fix completed:', data)
    } catch (err: any) {
      setError(err.message)
      console.error('❌ Fix failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Admin Fix Tools" subtitle="One-time database fixes" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Database Fix Tools</h2>
              <p className="text-sm" style={{ color: '#666' }}>One-time fixes for database issues</p>
            </div>
          </div>

          {/* Fix: Add createdAt to users */}
          <div className="border border-gray-300/50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#91A6EB' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
                  Fix Missing createdAt Field
                </h3>
                <p className="text-sm mb-4" style={{ color: '#666' }}>
                  Some users are missing the <code className="bg-gray-100 px-2 py-0.5 rounded">createdAt</code> field,
                  which prevents them from appearing in the admin panel. This fix will add the field to all users who don't have it.
                </p>

                <button
                  onClick={runCreatedAtFix}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg text-white transition-all disabled:opacity-50 hover:shadow-lg"
                  style={{ backgroundColor: '#20B2AA' }}
                >
                  {loading ? 'Running Fix...' : 'Run Fix Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Fix Completed Successfully!</h4>
                  <p className="text-sm text-green-800 mb-3">{result.message}</p>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Users Fixed:</span>
                        <span className="font-bold text-green-600">{result.usersFixed}</span>
                      </div>
                      {result.userIds && result.userIds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="font-medium text-gray-700 mb-2">Updated User IDs:</div>
                          <div className="max-h-32 overflow-y-auto">
                            {result.userIds.map((id: string) => (
                              <div key={id} className="text-xs text-gray-600 font-mono">{id}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    ✅ All users should now appear in the admin panel. Refresh the User Management page to see them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Fix Failed</h4>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-gray-300/30">
            <h4 className="font-semibold mb-3" style={{ color: '#000000' }}>How to use this tool:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: '#666' }}>
              <li>Click "Run Fix Now" to scan all users in the database</li>
              <li>The system will find users without a <code className="bg-gray-100 px-1 rounded">createdAt</code> field</li>
              <li>It will add the field using their <code className="bg-gray-100 px-1 rounded">lastLoginAt</code> date (or current date)</li>
              <li>You'll see a success message with the number of users fixed</li>
              <li>Go to User & Role Management and refresh - all users should now appear</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
