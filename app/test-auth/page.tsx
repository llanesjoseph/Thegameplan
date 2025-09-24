'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

export default function TestAuth() {
  const [status, setStatus] = useState('Ready to test')
  const [error, setError] = useState('')

  const testGoogleAuth = async () => {
    setStatus('Testing Google auth...')
    setError('')

    try {
      console.log('🔥 Firebase auth object:', auth)
      console.log('🔧 Auth config:', {
        apiKey: auth.app.options.apiKey ? 'Present' : 'Missing',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      })

      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      setStatus(`Success! Signed in as: ${result.user.displayName || result.user.email}`)
      console.log('✅ Auth success:', result.user)
    } catch (error: any) {
      console.error('❌ Auth error:', error)
      setError(`Error: ${error.code || error.message}`)
      setStatus('Authentication failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Auth Test Page</h1>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border">
            <p className="font-medium">Status:</p>
            <p className="text-sm">{status}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded border border-red-200">
              <p className="font-medium text-red-700">Error:</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={testGoogleAuth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Test Google Sign In
          </button>

          <div className="text-center mt-4">
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}