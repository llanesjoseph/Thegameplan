'use client'

// 🚧 DEV ONLY: Mock Data Panel - REMOVE FOR PRODUCTION
// This component provides mock data controls for development testing

import React, { useState, useEffect } from 'react'
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import {
 MOCK_DATA_ENABLED,
 getMockDataStatus,
 clearMockDataCache,
 hasMockData,
 getMockLessons,
 getMockCreators
} from '@/lib/mock-data'

export default function MockDataPanel() {
 const [status, setStatus] = useState(getMockDataStatus())
 const [hasData, setHasData] = useState(false)
 const [sampleCounts, setSampleCounts] = useState({ lessons: 0, creators: 0 })
 const [loading, setLoading] = useState(false)

 // Only show in development
 if (process.env.NODE_ENV !== 'development') {
  return null
 }

 const refreshStatus = async () => {
  setLoading(true)
  try {
   const [dataExists, lessons, creators] = await Promise.all([
    hasMockData(),
    getMockLessons(),
    getMockCreators()
   ])

   setHasData(dataExists)
   setSampleCounts({
    lessons: lessons.length,
    creators: creators.length
   })
   setStatus(getMockDataStatus())
  } catch (error) {
   console.error('Error refreshing mock data status:', error)
  } finally {
   setLoading(false)
  }
 }

 const handleClearCache = () => {
  clearMockDataCache()
  setStatus(getMockDataStatus())
 }

 useEffect(() => {
  refreshStatus()
 }, [])

 return (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
   <div className="flex items-center gap-2 mb-3">
    <Database className="w-5 h-5 text-amber-600" />
    <h3 className=" text-amber-800">🚧 Mock Data Panel (Dev Only)</h3>
    {MOCK_DATA_ENABLED && (
     <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
      ENABLED
     </span>
    )}
   </div>

   <div className="space-y-3">
    {/* Status Overview */}
    <div className="grid grid-cols-2 gap-4 text-sm">
     <div>
      <span className="text-gray-600">Environment:</span>
      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
       {status.environment}
      </span>
     </div>
     <div>
      <span className="text-gray-600">Mock Flag:</span>
      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
       {status.mockFlag || 'unset'}
      </span>
     </div>
    </div>

    {/* Data Status */}
    <div className="flex items-center gap-2 text-sm">
     {hasData ? (
      <div className="flex items-center gap-2 text-green-700">
       <CheckCircle className="w-4 h-4" />
       <span>Mock data detected in Firestore</span>
      </div>
     ) : (
      <div className="flex items-center gap-2 text-red-700">
       <AlertTriangle className="w-4 h-4" />
       <span>No mock data found in Firestore</span>
      </div>
     )}
    </div>

    {/* Sample Counts */}
    {hasData && (
     <div className="text-sm text-gray-600">
      <span>Sample data: {sampleCounts.lessons} lessons, {sampleCounts.creators} creators</span>
     </div>
    )}

    {/* Cache Info */}
    <div className="text-sm text-gray-600">
     <span>Cache: {status.cacheSize} collections cached</span>
     {status.cacheSize > 0 && (
      <span className="ml-2 text-xs">({status.cachedCollections.join(', ')})</span>
     )}
    </div>

    {/* Controls */}
    <div className="flex gap-2 pt-2">
     <button
      onClick={refreshStatus}
      disabled={loading}
      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
     >
      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      Refresh
     </button>

     {status.cacheSize > 0 && (
      <button
       onClick={handleClearCache}
       className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
      >
       <Trash2 className="w-3 h-3" />
       Clear Cache
      </button>
     )}
    </div>

    {/* Instructions */}
    {!MOCK_DATA_ENABLED && (
     <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
      <p className="text-blue-800  mb-1">To enable mock data:</p>
      <ol className="text-blue-700 list-decimal list-inside space-y-1">
       <li>Set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_USE_MOCK_DATA=true</code> in your .env.local</li>
       <li>Seed the database using the datamock folder</li>
       <li>Restart the development server</li>
      </ol>
     </div>
    )}

    {/* Seeding Instructions */}
    {MOCK_DATA_ENABLED && !hasData && (
     <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
      <p className="text-orange-800  mb-1">To seed mock data:</p>
      <ol className="text-orange-700 list-decimal list-inside space-y-1">
       <li>Navigate to the datamock folder</li>
       <li>Copy .env.example to .env and configure Firebase credentials</li>
       <li>Run: <code className="bg-orange-100 px-1 rounded">npm install && npm run seed</code></li>
      </ol>
     </div>
    )}
   </div>
  </div>
 )
}