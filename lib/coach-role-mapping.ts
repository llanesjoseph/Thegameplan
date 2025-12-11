/**
 * Known Coach Email to Role Mapping
 * For coaches who should have 'coach' role but might be incorrectly set as 'creator'
 */

import { UserRole } from '../types'

export const KNOWN_COACHES: Record<string, {
  email: string
  name: string
  sport: string
  credentials: string[]
  shouldBeRole: UserRole
}> = {
  'llanes.joseph.m@gmail.com': {
    email: 'llanes.joseph.m@gmail.com',
    name: 'Joseph Llanes',
    sport: 'Multi-Sport',
    credentials: ['Professional Coach'],
    shouldBeRole: 'coach'
  },
  // Support both email variations
  'llanes.joseph.w@gmail.com': {
    email: 'llanes.joseph.w@gmail.com',
    name: 'Joseph Llanes',
    sport: 'Multi-Sport',
    credentials: ['Professional Coach'],
    shouldBeRole: 'coach'
  }
}

/**
 * Check if an email belongs to a known coach
 */
export function isKnownCoach(email: string): boolean {
  return email.toLowerCase() in KNOWN_COACHES
}

/**
 * Get the correct role for a known coach
 */
export function getKnownCoachRole(email: string): UserRole | null {
  const coach = KNOWN_COACHES[email.toLowerCase()]
  return coach?.shouldBeRole || null
}

/**
 * Get coach information for known coaches
 */
export function getKnownCoachInfo(email: string) {
  return KNOWN_COACHES[email.toLowerCase()] || null
}