'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

export default function MigrateSlugsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      if (!user) {
        setError('You must be logged in to run this migration')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch('/api/admin/migrate-athlete-slugs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Migration error:', err)
      setError(err.message || 'Failed to run migration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Migrate Athlete Slugs
            </h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-blue-900 mb-2">What does this do?</h2>
            <p className="text-blue-800 text-sm mb-4">
              This migration generates clean, human-readable slugs for all existing athletes that don't have one.
              Instead of showing database IDs in URLs (like <code className="bg-blue-100 px-1 rounded">abc123def456</code>),
              athletes will have URLs like <code className="bg-blue-100 px-1 rounded">john-smith-abc123</code>.
            </p>
            <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
              <li>Safe to run multiple times (skips athletes that already have slugs)</li>
              <li>New athletes automatically get slugs on signup</li>
              <li>This is a one-time backfill for existing athletes</li>
            </ul>
          </div>

          <button
            onClick={runMigration}
            disabled={loading || !user}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Run Slug Migration
              </>
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-green-900 text-lg">
                  {result.message}
                </h3>
              </div>

              {result.results && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Athletes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.results.total}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Slugs Created</p>
                      <p className="text-2xl font-bold text-green-600">
                        {result.results.created}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Skipped (already had slugs)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {result.results.skipped}
                      </p>
                    </div>
                  </div>

                  {result.results.errors && result.results.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">
                        Errors ({result.results.errors.length})
                      </h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {result.results.errors.map((err: string, idx: number) => (
                          <li key={idx} className="truncate">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
