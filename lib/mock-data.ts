'use client'

// 🎯 MOCK DATA SERVICE - TEMPORARY FOR TESTING
// This file provides mock data for development and testing purposes
// TODO: Remove this entire file when real data is ready

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase.client'

// Environment flag to enable/disable mock data
export const MOCK_DATA_ENABLED = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Mock data cache to avoid repeated Firebase calls
const mockDataCache: Record<string, any[]> = {}

// 🚧 MOCK: Fetch mock lessons from Firestore
export async function getMockLessons(sport?: string, limit_count: number = 12) {
  if (!MOCK_DATA_ENABLED) return []

  const cacheKey = `lessons-${sport || 'all'}-${limit_count}`
  if (mockDataCache[cacheKey]) {
    return mockDataCache[cacheKey]
  }

  try {
    const contentRef = collection(db, 'content')
    let q = query(contentRef, orderBy('createdAt', 'desc'), limit(limit_count))

    if (sport) {
      q = query(contentRef, where('sport', '==', sport), orderBy('createdAt', 'desc'), limit(limit_count))
    }

    const snapshot = await getDocs(q)
    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Add mock indicator
      _isMockData: true
    }))

    mockDataCache[cacheKey] = lessons
    return lessons
  } catch (error) {
    console.error('🚧 Mock data fetch error:', error)
    return []
  }
}

// 🚧 MOCK: Fetch mock creators
export async function getMockCreators(sport?: string) {
  if (!MOCK_DATA_ENABLED) return []

  const cacheKey = `creators-${sport || 'all'}`
  if (mockDataCache[cacheKey]) {
    return mockDataCache[cacheKey]
  }

  try {
    const creatorsRef = collection(db, 'creatorPublic')
    let q = query(creatorsRef, orderBy('name', 'asc'))

    if (sport) {
      q = query(creatorsRef, where('sports', 'array-contains', sport), orderBy('name', 'asc'))
    }

    const snapshot = await getDocs(q)
    const creators = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _isMockData: true
    }))

    mockDataCache[cacheKey] = creators
    return creators
  } catch (error) {
    console.error('🚧 Mock data fetch error:', error)
    return []
  }
}

// 🚧 MOCK: Fetch mock coaching requests
export async function getMockCoachingRequests(userId?: string) {
  if (!MOCK_DATA_ENABLED) return []

  const cacheKey = `requests-${userId || 'all'}`
  if (mockDataCache[cacheKey]) {
    return mockDataCache[cacheKey]
  }

  try {
    const requestsRef = collection(db, 'coaching_requests')
    let q = query(requestsRef, orderBy('createdAt', 'desc'), limit(20))

    if (userId) {
      q = query(requestsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20))
    }

    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _isMockData: true
    }))

    mockDataCache[cacheKey] = requests
    return requests
  } catch (error) {
    console.error('🚧 Mock data fetch error:', error)
    return []
  }
}

// 🚧 MOCK: Get mock sports list
export function getMockSports() {
  if (!MOCK_DATA_ENABLED) return []

  return [
    'soccer', 'basketball', 'tennis', 'swimming', 'running', 'cycling',
    'volleyball', 'baseball', 'golf', 'gymnastics', 'wrestling', 'track_and_field'
  ].map(sport => ({
    id: sport,
    name: sport.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    _isMockData: true
  }))
}

// 🚧 MOCK: Check if mock data is available
export async function hasMockData(): Promise<boolean> {
  if (!MOCK_DATA_ENABLED) return false

  try {
    const contentRef = collection(db, 'content')
    const snapshot = await getDocs(query(contentRef, limit(1)))
    return !snapshot.empty
  } catch (error) {
    return false
  }
}

// 🚧 MOCK: Clear all mock data cache
export function clearMockDataCache() {
  Object.keys(mockDataCache).forEach(key => delete mockDataCache[key])
  console.log('🧹 Mock data cache cleared')
}

// 🚧 MOCK: Get mock data status for debugging
export function getMockDataStatus() {
  return {
    enabled: MOCK_DATA_ENABLED,
    cacheSize: Object.keys(mockDataCache).length,
    cachedCollections: Object.keys(mockDataCache),
    environment: process.env.NODE_ENV,
    mockFlag: process.env.NEXT_PUBLIC_USE_MOCK_DATA
  }
}