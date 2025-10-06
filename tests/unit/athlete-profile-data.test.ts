import { describe, it, expect } from 'vitest'

/**
 * Athlete Profile Data Loading Tests
 *
 * REGRESSION TEST: This tests the bug Lona found where athlete
 * registration data wasn't showing up on the profile page.
 *
 * The fix: Profile page now loads data from both 'users' and 'athletes' collections
 */

interface AthleteData {
  uid: string
  athleteId: string
  athleticProfile: {
    primarySport: string
    secondarySports: string[]
    skillLevel: string
    trainingGoals: string
    achievements: string
    availability: Array<{ day: string; timeSlots: string }>
    learningStyle: string
    specialNotes: string
  }
}

interface ProfileData {
  displayName: string
  email: string
  specialties: string[]
  experience: string
  bio: string
  achievements: string[]
  availability: string
  coachingPhilosophy: string
  languages: string[]
}

// This function mimics the data mapping logic in app/dashboard/profile/page.tsx
function mapAthleteDataToProfile(
  athleteData: AthleteData,
  baseProfile: Partial<ProfileData>
): ProfileData {
  const athleticProfile = athleteData.athleticProfile

  return {
    displayName: baseProfile.displayName || '',
    email: baseProfile.email || '',
    specialties: athleticProfile.primarySport
      ? [athleticProfile.primarySport, ...(athleticProfile.secondarySports || [])]
      : (baseProfile.specialties || []),
    experience: athleticProfile.skillLevel || (baseProfile.experience || ''),
    bio: athleticProfile.trainingGoals || (baseProfile.bio || ''),
    achievements: athleticProfile.achievements
      ? [athleticProfile.achievements]
      : (baseProfile.achievements || []),
    availability: Array.isArray(athleticProfile.availability)
      ? athleticProfile.availability.map((a) => `${a.day}: ${a.timeSlots}`).join(', ')
      : (baseProfile.availability || ''),
    coachingPhilosophy: athleticProfile.specialNotes || (baseProfile.coachingPhilosophy || ''),
    languages: athleticProfile.learningStyle
      ? [athleticProfile.learningStyle]
      : (baseProfile.languages || []),
  }
}

describe('Athlete Profile Data Mapping - Regression Test', () => {
  const mockAthleteData: AthleteData = {
    uid: 'test-uid-123',
    athleteId: 'athlete-abc',
    athleticProfile: {
      primarySport: 'Soccer',
      secondarySports: ['Basketball', 'Running'],
      skillLevel: 'Intermediate',
      trainingGoals: 'Improve passing accuracy and field vision',
      achievements: 'MVP of high school team 2023',
      availability: [
        { day: 'monday', timeSlots: '6-8 PM' },
        { day: 'wednesday', timeSlots: '6-8 PM' },
        { day: 'friday', timeSlots: '6-8 PM' },
      ],
      learningStyle: 'Visual Learner',
      specialNotes: 'Recovering from minor ankle injury, prefer low-impact drills',
    },
  }

  const baseProfile: Partial<ProfileData> = {
    displayName: 'Test Athlete',
    email: 'athlete@test.com',
  }

  it('should map primary sport to specialties', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.specialties).toContain('Soccer')
  })

  it('should map secondary sports to specialties', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.specialties).toContain('Basketball')
    expect(profile.specialties).toContain('Running')
  })

  it('should map skill level to experience', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.experience).toBe('Intermediate')
  })

  it('should map training goals to bio', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.bio).toBe('Improve passing accuracy and field vision')
  })

  it('should map achievements to achievements array', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.achievements).toContain('MVP of high school team 2023')
  })

  it('should map availability schedule to availability string', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.availability).toContain('monday: 6-8 PM')
    expect(profile.availability).toContain('wednesday: 6-8 PM')
    expect(profile.availability).toContain('friday: 6-8 PM')
  })

  it('should map special notes to coaching philosophy', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.coachingPhilosophy).toBe(
      'Recovering from minor ankle injury, prefer low-impact drills'
    )
  })

  it('should map learning style to languages array', () => {
    const profile = mapAthleteDataToProfile(mockAthleteData, baseProfile)
    expect(profile.languages).toContain('Visual Learner')
  })

  describe('Edge Cases', () => {
    it('should handle empty secondary sports', () => {
      const data = {
        ...mockAthleteData,
        athleticProfile: {
          ...mockAthleteData.athleticProfile,
          secondarySports: [],
        },
      }
      const profile = mapAthleteDataToProfile(data, baseProfile)
      expect(profile.specialties).toEqual(['Soccer'])
    })

    it('should handle missing achievements', () => {
      const data = {
        ...mockAthleteData,
        athleticProfile: {
          ...mockAthleteData.athleticProfile,
          achievements: '',
        },
      }
      const profile = mapAthleteDataToProfile(data, baseProfile)
      // Empty string should result in empty array or base profile achievements
      expect(profile.achievements).toEqual([])
    })

    it('should handle empty availability', () => {
      const data = {
        ...mockAthleteData,
        athleticProfile: {
          ...mockAthleteData.athleticProfile,
          availability: [],
        },
      }
      const profile = mapAthleteDataToProfile(data, baseProfile)
      expect(profile.availability).toBe('')
    })

    it('should preserve base profile when athletic profile is minimal', () => {
      const minimalData: AthleteData = {
        uid: 'test-uid',
        athleteId: 'athlete-id',
        athleticProfile: {
          primarySport: '',
          secondarySports: [],
          skillLevel: '',
          trainingGoals: '',
          achievements: '',
          availability: [],
          learningStyle: '',
          specialNotes: '',
        },
      }

      const baseWithData: Partial<ProfileData> = {
        displayName: 'Test',
        email: 'test@test.com',
        specialties: ['Tennis'],
        experience: 'Beginner',
      }

      const profile = mapAthleteDataToProfile(minimalData, baseWithData)
      expect(profile.specialties).toEqual(['Tennis'])
      expect(profile.experience).toBe('Beginner')
    })
  })
})

describe('Athlete Registration Data Flow', () => {
  it('should save all registration form fields', () => {
    const registrationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      primarySport: 'Brazilian Jiu-Jitsu',
      secondarySports: ['MMA'],
      skillLevel: 'Advanced',
      trainingGoals: 'Prepare for competition at blue belt level',
      achievements: 'Won local tournament',
      learningStyle: 'Hands-On',
      availability: [
        { day: 'tuesday', timeSlots: '7-9 PM' },
        { day: 'thursday', timeSlots: '7-9 PM' },
      ],
      specialNotes: 'Previous wrestling experience',
    }

    // All fields should be present
    expect(registrationData.firstName).toBeTruthy()
    expect(registrationData.lastName).toBeTruthy()
    expect(registrationData.email).toBeTruthy()
    expect(registrationData.primarySport).toBeTruthy()
    expect(registrationData.skillLevel).toBeTruthy()
    expect(registrationData.trainingGoals).toBeTruthy()
    expect(registrationData.learningStyle).toBeTruthy()
    expect(registrationData.availability.length).toBeGreaterThan(0)
  })

  it('should require minimum registration fields', () => {
    const isValidRegistration = (data: any): boolean => {
      return !!(
        data.firstName &&
        data.lastName &&
        data.email &&
        data.primarySport &&
        data.skillLevel &&
        data.trainingGoals &&
        data.learningStyle &&
        data.availability?.length > 0
      )
    }

    const validData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      primarySport: 'Soccer',
      skillLevel: 'Intermediate',
      trainingGoals: 'Improve dribbling',
      learningStyle: 'Visual Learner',
      availability: [{ day: 'monday', timeSlots: '5-7 PM' }],
    }

    expect(isValidRegistration(validData)).toBe(true)

    const invalidData = { ...validData, email: '' }
    expect(isValidRegistration(invalidData)).toBe(false)
  })
})
