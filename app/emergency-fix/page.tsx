'use client'

import { useState } from 'react'

export default function EmergencyFixPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const fixRole = async () => {
    setStatus('loading')
    setMessage('Fixing role...')

    try {
      const response = await fetch('/api/emergency-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: 'temp-secret-12345',
          userEmail: 'llanes.joseph.m@gmail.com'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(`✅ Success! ${data.message}\n\nPlease refresh your browser to see the changes.`)
      } else {
        setStatus('error')
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Emergency Superadmin Fix</h1>
        <p className="text-gray-600 mb-6">Click the button below to set your role to superadmin:</p>

        <button
          onClick={fixRole}
          disabled={status === 'loading'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Fixing...' : 'Fix My Role'}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded-lg whitespace-pre-wrap ${
            status === 'success' ? 'bg-green-100 text-green-800' :
            status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}