'use client'
import { useState } from 'react'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useRouter } from 'next/navigation'

export default function SeedDatabasePage() {
  const { role } = useEnhancedRole()
  const router = useRouter()
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState('')

  if (role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only superadmins can access database seeding.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const seedDatabase = async () => {
    setSeeding(true)
    setResult('')

    try {
      const response = await fetch('/api/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ SUCCESS! Database seeded with:
• ${data.data.users} Users
• ${data.data.profiles} Profiles
• ${data.data.content} Lessons
• ${data.data.requests} Coaching Requests
• ${data.data.applications} Applications

🔍 Check Firebase Console: https://console.firebase.google.com/project/gameplan-787a2/firestore`)
      } else {
        setResult(`❌ ERROR: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ NETWORK ERROR: ${error}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 DATABASE SEEDING</h1>
          <p className="text-xl text-gray-600">Aggressive solution to populate your database with sample data</p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                This will add sample data to your database
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>• Creates users, profiles, content, and interactions</p>
                <p>• Safe to run multiple times (won't duplicate data)</p>
                <p>• Uses Firebase Admin SDK for direct database access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className={`px-12 py-6 text-2xl font-bold rounded-lg shadow-lg transform transition-all duration-200 ${
              seeding
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95'
            }`}
          >
            {seeding ? '⏳ SEEDING DATABASE...' : '💥 SEED DATABASE NOW'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
              {result}
            </pre>
          </div>
        )}

        {/* What Gets Created */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">👥 Users & Profiles</h3>
            <ul className="text-sm space-y-2">
              <li>• Alex Johnson (Soccer Athlete)</li>
              <li>• Sarah Martinez (Basketball Athlete)</li>
              <li>• Maria Rodriguez (Soccer Creator)</li>
              <li>• James Thompson (Basketball Creator)</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-green-600">🎬 Content & Interactions</h3>
            <ul className="text-sm space-y-2">
              <li>• Soccer: First Touch Fundamentals</li>
              <li>• Basketball: Elite Shooting Form</li>
              <li>• Coaching requests and responses</li>
              <li>• Creator applications</li>
            </ul>
          </div>
        </div>

        {/* Direct Links */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <a
              href="https://console.firebase.google.com/project/gameplan-787a2/firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔍 View Firebase Console
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              📊 Back to Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}