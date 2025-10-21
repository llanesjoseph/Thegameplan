'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { Users, Wrench, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminFixAthleteCoachesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runCoachAssignmentFix = async () => {
    if (!confirm('This will assign coaches to all athletes who are missing a coach assignment based on their invitation data. Continue?')) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await user?.getIdToken()

      const response = await fetch('/api/admin/fix-athlete-coach-assignment', {
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
      <AppHeader title="Fix Athlete Coach Assignments" subtitle="Assign coaches to athletes based on invitations" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Athlete Coach Assignment Fix</h2>
              <p className="text-sm" style={{ color: '#666' }}>Assign coaches to athletes who are missing the assignment</p>
            </div>
          </div>

          {/* Fix: Assign Coaches to Athletes */}
          <div className="border border-gray-300/50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#91A6EB' }}>
                <Users className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
                  Auto-Assign Coaches to Athletes
                </h3>
                <p className="text-sm mb-4" style={{ color: '#666' }}>
                  This fix will:
                  <ul className="list-disc list-inside mt-2 ml-2">
                    <li>Find all athletes missing coach assignments (coachId / assignedCoachId)</li>
                    <li>Look up their invitation to identify the coach who invited them</li>
                    <li>Update both their athlete document and user document with the coach assignment</li>
                    <li>Skip athletes who already have a coach assigned</li>
                  </ul>
                </p>

                <button
                  onClick={runCoachAssignmentFix}
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
                        <span className="font-medium text-gray-700">Total Athletes:</span>
                        <span className="font-bold text-gray-900">{result.data?.totalAthletes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Fixed:</span>
                        <span className="font-bold text-green-600">{result.data?.fixedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Skipped (already assigned):</span>
                        <span className="font-bold text-blue-600">{result.data?.skippedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Errors:</span>
                        <span className="font-bold text-red-600">{result.data?.errorCount}</span>
                      </div>
                      {result.data?.results && result.data.results.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="font-medium text-gray-700 mb-2">Details:</div>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {result.data.results.map((r: any, idx: number) => (
                              <div key={idx} className="text-xs p-2 rounded" style={{
                                backgroundColor: r.status === 'fixed' ? '#d1fae5' : r.status === 'skipped' ? '#dbeafe' : '#fee2e2'
                              }}>
                                <div className="font-semibold">{r.athleteEmail || 'Unknown'}</div>
                                <div className="text-gray-600">
                                  Status: {r.status}
                                  {r.coachUid && ` • Coach: ${r.coachUid.substring(0, 8)}...`}
                                  {r.reason && ` • ${r.reason}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    ✅ All athletes should now be assigned to their coaches. Athletes can now see their coach in their dashboard.
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
              <li>Click "Run Fix Now" to scan all athletes in the database</li>
              <li>The system will find athletes without coachId or assignedCoachId fields</li>
              <li>For each athlete, it will look up their invitation document</li>
              <li>It will extract the coach UID from the invitation's creatorUid field</li>
              <li>It will update both the athlete and user documents with the coach assignment</li>
              <li>You'll see a summary with counts of fixed, skipped, and error cases</li>
            </ol>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This fix is safe to run multiple times. Athletes who already have a coach assigned will be skipped.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
