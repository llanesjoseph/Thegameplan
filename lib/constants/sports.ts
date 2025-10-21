/**
 * Global Sports Constants
 *
 * This file contains the centralized list of sports supported across the Athleap platform.
 * All components should import from this file to ensure consistency.
 */

export const SPORTS = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Tennis',
  'Brazilian Jiu-Jitsu',
  'Running',
  'Volleyball',
  'Swimming',
  'American Football',
  'Golf',
  'Boxing',
  'Track & Field',
  'Wrestling',
  'Softball',
  'Other'
] as const

export type Sport = typeof SPORTS[number]

/**
 * Formatted sports list for display in dropdowns
 * Maintains the display names exactly as they should appear in the UI
 */
export const getSportsOptions = () => SPORTS.map(sport => ({
  value: sport,
  label: sport
}))

/**
 * Check if a given string is a valid sport
 */
export const isValidSport = (sport: string): sport is Sport => {
  return SPORTS.includes(sport as Sport)
}

/**
 * Normalize sport name to match our canonical list
 * Handles common variations
 */
export const normalizeSportName = (sport: string): Sport => {
  const normalized = sport.trim()

  // Handle common variations
  const variations: Record<string, Sport> = {
    'BJJ': 'Brazilian Jiu-Jitsu',
    'jiu-jitsu': 'Brazilian Jiu-Jitsu',
    'Football': 'American Football',
    'Track': 'Track & Field',
    'Track and Field': 'Track & Field'
  }

  if (variations[normalized]) {
    return variations[normalized]
  }

  // Check if it's already in our list
  const found = SPORTS.find(s => s.toLowerCase() === normalized.toLowerCase())
  if (found) {
    return found
  }

  return 'Other'
}
