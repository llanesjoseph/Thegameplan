'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'

export default function EmergencyFixPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [currentRole, setCurrentRole] = useState<string>('')

  useEffect(() => {
    if (user?.uid) {
      loadCurrentRole()
    }
  }, [user])

  const loadCurrentRole = async () => {
    if (!user?.uid) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        setCurrentRole(userDoc.data().role || 'unknown')
      }
    } catch (error) {
      console.error('Error loading role:', error)
    }
  }

  const fixRole = async () => {
    if (!user?.uid) {
      setStatus('error')
      setMessage('❌ Error: You must be signed in to fix your role')
      return
    }

    setStatus('loading')
    setMessage('Fixing role...')

    try {
      const userRef = doc(db, 'users', user.uid)

      // Update role directly in Firestore
      await updateDoc(userRef, {
        role: 'superadmin',
        roleUpdatedAt: Timestamp.now(),
        roleUpdateReason: 'Emergency client-side fix',
        lastRoleUpdate: new Date().toISOString()
      })

      setStatus('success')
      setMessage(`✅ Success! Your role has been updated from ${currentRole} to superadmin.\n\nPlease refresh your browser to see the changes.`)

      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard/creator'
      }, 2000)

    } catch (error) {
      setStatus('error')
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Emergency Superadmin Fix</h1>

        {!user ? (
          <p className="text-gray-600">Please sign in to fix your role.</p>
        ) : (
          <>
            {currentRole && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Current Role:</p>
                <p className="text-lg font-semibold text-gray-900">{currentRole}</p>
                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              </div>
            )}

            <p className="text-gray-600 mb-6">Click the button below to set your role to superadmin:</p>

            <button
              onClick={fixRole}
              disabled={status === 'loading' || !user}
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
          </>
        )}
      </div>
    </div>
  )
}