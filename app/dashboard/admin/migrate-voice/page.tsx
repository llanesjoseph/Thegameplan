'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface MigrationResult {
  uid: string
  email: string
  status: 'migrated' | 'skipped' | 'error'
  reason?: string
}

interface MigrationResponse {
  success: boolean
  summary: {
    total: number
    migrated: number
    skipped: number
    errors: number
  }
  details: MigrationResult[]
}

export default function MigrateVoicePage() {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<MigrationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    if (!confirm('Are you sure you want to run the voice data migration? This will copy voiceCaptureData from creator_profiles to users collection for all coaches.')) {
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/migrate-voice-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to run migration')
    } finally {
      setIsRunning(false)
    }
  }

  if (!user) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>You must be logged in to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Data Migration</h1>
        <p className="text-gray-600">
          One-time migration to copy voice capture data from creator_profiles to users collection
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>About This Migration</CardTitle>
          <CardDescription>
            This script fixes coaches who completed voice capture before the bug fix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What this does:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Finds all coaches with voiceCaptureData in creator_profiles</li>
              <li>Copies their voice data to the users collection</li>
              <li>Skips coaches who already have voice data in users collection</li>
              <li>Provides detailed report of what was migrated</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Important:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>This is safe to run multiple times (idempotent)</li>
              <li>Only admin users can run this migration</li>
              <li>After running, coach AI responses will have their personality</li>
            </ul>
          </div>

          <Button
            onClick={runMigration}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Migration...
              </>
            ) : (
              'Run Migration'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Migration Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                  <div className="text-sm text-gray-600">Total Profiles</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{result.summary.migrated}</div>
                  <div className="text-sm text-green-700">Migrated</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</div>
                  <div className="text-sm text-yellow-700">Skipped</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Migration Details</CardTitle>
              <CardDescription>
                Individual results for each coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      detail.status === 'migrated'
                        ? 'bg-green-50 border-green-200'
                        : detail.status === 'skipped'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {detail.status === 'migrated' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {detail.status === 'skipped' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                      {detail.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                      <div>
                        <div className="font-medium">{detail.email}</div>
                        {detail.reason && (
                          <div className="text-sm text-gray-600">{detail.reason}</div>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-medium capitalize ${
                      detail.status === 'migrated' ? 'text-green-600' :
                      detail.status === 'skipped' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {detail.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
