'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { UserCog, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function FixSingleAthletePage() {
  const { user } = useAuth()
  const [athleteEmail, setAthleteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFix = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!athleteEmail.trim()) {
      setError('Please enter an athlete email')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await user?.getIdToken()

      const response = await fetch('/api/admin/fix-single-athlete-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ athleteEmail: athleteEmail.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix athlete coach assignment')
      }

      setResult(data)
      setAthleteEmail('') // Clear form on success
    } catch (err: any) {
      console.error('Error fixing athlete:', err)
      setError(err.message || 'Failed to fix athlete coach assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Fix Single Athlete Coach Assignment" subtitle="Fix coach assignment for a specific athlete by email" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          {/* Form */}
          <div className="border border-gray-300/50 rounded-lg p-6 mb-6">
            <form onSubmit={handleFix} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Athlete Email Address
                </label>
                <input
                  type="email"
                  value={athleteEmail}
                  onChange={(e) => setAthleteEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !athleteEmail.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Fixing Coach Assignment...
                  </>
                ) : (
                  <>
                    <UserCog className="w-5 h-5" />
                    Fix Coach Assignment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 mb-1">Success!</h3>
                  <p className="text-green-700">{result.message}</p>
                </div>
              </div>

              {/* Details */}
              {result.data && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Assignment Details:</h4>
                  <div className="space-y-2 text-sm">
                    {result.data.alreadyAssigned ? (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-blue-900">
                          <span className="font-medium">Note:</span> Athlete already had coach assigned
                        </p>
                        <p className="text-blue-700 mt-1">
                          <span className="font-medium">Coach ID:</span> {result.data.coachId}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Athlete Email:</span>
                          <span className="font-medium text-gray-900">{result.data.athleteEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Athlete ID:</span>
                          <span className="font-mono text-xs text-gray-900">{result.data.athleteId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">User UID:</span>
                          <span className="font-mono text-xs text-gray-900">{result.data.userUid || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned Coach:</span>
                          <span className="font-medium text-gray-900">{result.data.coachName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coach UID:</span>
                          <span className="font-mono text-xs text-gray-900">{result.data.coachUid}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                  <li>Ask the athlete to refresh their dashboard page</li>
                  <li>The coach should now appear in the top left sidebar</li>
                  <li>If the issue persists, ask the athlete to sign out and sign back in</li>
                </ol>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-bold text-blue-900 mb-3">How This Works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Enter the athlete's email address</li>
              <li>System finds the athlete in Firestore</li>
              <li>Retrieves the invitation to extract the coach UID</li>
              <li>Updates both the athlete document and user document with the coach assignment</li>
              <li>Returns the coach details for verification</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
