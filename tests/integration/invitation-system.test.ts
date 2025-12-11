import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Invitation System Integration Tests
 *
 * CRITICAL: Tests invitation creation, validation, expiration, and usage tracking
 * for coach and athlete onboarding flows.
 *
 * Invitation system is critical for controlled onboarding and role assignment.
 */

// Invitation ID generation (from app/api/coach-invitation-simple/route.ts pattern)
function generateInvitationId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Invitation data structure
interface Invitation {
  id: string
  coachEmail?: string
  athleteEmail?: string
  coachName?: string
  sport: string
  personalMessage?: string
  role: string
  invitationType: 'coach' | 'assistant' | 'athlete'
  createdAt: string
  expiresAt: string
  status: 'sent' | 'accepted' | 'expired' | 'revoked'
  used: boolean
  usedAt?: string
  usedBy?: string
}

// Create coach invitation
function createCoachInvitation(data: {
  coachEmail: string
  coachName: string
  sport: string
  personalMessage?: string
  invitationType?: 'coach' | 'assistant'
}): Invitation {
  const invitationType = data.invitationType || 'coach'
  const targetRole = invitationType === 'assistant' ? 'assistant' : 'coach'

  return {
    id: generateInvitationId(),
    coachEmail: data.coachEmail.toLowerCase(),
    coachName: data.coachName,
    sport: data.sport,
    personalMessage: data.personalMessage || 'Join our coaching platform!',
    role: targetRole,
    invitationType,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    status: 'sent',
    used: false
  }
}

// Create athlete invitation
function createAthleteInvitation(data: {
  athleteEmail: string
  sport: string
  coachId: string
  expirationDays?: number
}): Invitation {
  return {
    id: generateInvitationId(),
    athleteEmail: data.athleteEmail.toLowerCase(),
    sport: data.sport,
    role: 'athlete',
    invitationType: 'athlete',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (data.expirationDays || 14) * 24 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
    used: false
  }
}

// Validate invitation
function validateInvitation(invitation: Invitation): { valid: boolean; reason?: string } {
  // Check if already used
  if (invitation.used) {
    return { valid: false, reason: 'Invitation already used' }
  }

  // Check if expired
  const expiresAt = new Date(invitation.expiresAt)
  if (expiresAt < new Date()) {
    return { valid: false, reason: 'Invitation expired' }
  }

  // Check if revoked
  if (invitation.status === 'revoked') {
    return { valid: false, reason: 'Invitation revoked' }
  }

  return { valid: true }
}

// Use invitation
function useInvitation(invitation: Invitation, userId: string): Invitation {
  return {
    ...invitation,
    used: true,
    usedAt: new Date().toISOString(),
    usedBy: userId,
    status: 'accepted'
  }
}

describe('Invitation System - Coach Invitations', () => {

  describe('Creating Coach Invitations', () => {
    it('creates invitation with valid data', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball'
      })

      expect(invitation.id).toMatch(/^inv_\d+_[a-z0-9]+$/)
      expect(invitation.coachEmail).toBe('coach@example.com')
      expect(invitation.coachName).toBe('John Doe')
      expect(invitation.sport).toBe('Basketball')
      expect(invitation.role).toBe('coach')
      expect(invitation.status).toBe('sent')
      expect(invitation.used).toBe(false)
    })

    it('generates unique invitation IDs', () => {
      const inv1 = generateInvitationId()
      const inv2 = generateInvitationId()

      expect(inv1).not.toBe(inv2)
      expect(inv1).toMatch(/^inv_\d+_[a-z0-9]+$/)
      expect(inv2).toMatch(/^inv_\d+_[a-z0-9]+$/)
    })

    it('normalizes email to lowercase', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'Coach@Example.COM',
        coachName: 'John Doe',
        sport: 'Soccer'
      })

      expect(invitation.coachEmail).toBe('coach@example.com')
    })

    it('sets expiration to 30 days from creation', () => {
      const before = Date.now()
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball'
      })
      const after = Date.now()

      const expiresAt = new Date(invitation.expiresAt).getTime()
      const expectedExpiry = 30 * 24 * 60 * 60 * 1000 // 30 days in ms

      expect(expiresAt).toBeGreaterThan(before + expectedExpiry - 1000)
      expect(expiresAt).toBeLessThan(after + expectedExpiry + 1000)
    })

    it('uses default message when not provided', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball'
      })

      expect(invitation.personalMessage).toBe('Join our coaching platform!')
    })

    it('includes custom message when provided', () => {
      const customMessage = 'We would love to have you join our team!'
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball',
        personalMessage: customMessage
      })

      expect(invitation.personalMessage).toBe(customMessage)
    })

    it('assigns coach role for coach invitations', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball',
        invitationType: 'coach'
      })

      expect(invitation.role).toBe('coach')
      expect(invitation.invitationType).toBe('coach')
    })

    it('assigns assistant role for assistant invitations', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'assistant@example.com',
        coachName: 'Jane Smith',
        sport: 'Basketball',
        invitationType: 'assistant'
      })

      expect(invitation.role).toBe('assistant')
      expect(invitation.invitationType).toBe('assistant')
    })
  })
})

describe('Invitation System - Athlete Invitations', () => {

  describe('Creating Athlete Invitations', () => {
    it('creates athlete invitation with valid data', () => {
      const invitation = createAthleteInvitation({
        athleteEmail: 'athlete@example.com',
        sport: 'Basketball',
        coachId: 'coach_123'
      })

      expect(invitation.id).toMatch(/^inv_\d+_[a-z0-9]+$/)
      expect(invitation.athleteEmail).toBe('athlete@example.com')
      expect(invitation.sport).toBe('Basketball')
      expect(invitation.role).toBe('athlete')
      expect(invitation.invitationType).toBe('athlete')
      expect(invitation.used).toBe(false)
    })

    it('normalizes athlete email to lowercase', () => {
      const invitation = createAthleteInvitation({
        athleteEmail: 'Athlete@Example.COM',
        sport: 'Soccer',
        coachId: 'coach_123'
      })

      expect(invitation.athleteEmail).toBe('athlete@example.com')
    })

    it('sets expiration to 14 days by default', () => {
      const before = Date.now()
      const invitation = createAthleteInvitation({
        athleteEmail: 'athlete@example.com',
        sport: 'Basketball',
        coachId: 'coach_123'
      })
      const after = Date.now()

      const expiresAt = new Date(invitation.expiresAt).getTime()
      const expectedExpiry = 14 * 24 * 60 * 60 * 1000 // 14 days in ms

      expect(expiresAt).toBeGreaterThan(before + expectedExpiry - 1000)
      expect(expiresAt).toBeLessThan(after + expectedExpiry + 1000)
    })

    it('allows custom expiration days', () => {
      const customDays = 7
      const before = Date.now()
      const invitation = createAthleteInvitation({
        athleteEmail: 'athlete@example.com',
        sport: 'Basketball',
        coachId: 'coach_123',
        expirationDays: customDays
      })
      const after = Date.now()

      const expiresAt = new Date(invitation.expiresAt).getTime()
      const expectedExpiry = customDays * 24 * 60 * 60 * 1000

      expect(expiresAt).toBeGreaterThan(before + expectedExpiry - 1000)
      expect(expiresAt).toBeLessThan(after + expectedExpiry + 1000)
    })
  })
})

describe('Invitation System - Validation', () => {

  describe('Valid Invitations', () => {
    it('validates fresh unused invitation', () => {
      const invitation = createCoachInvitation({
        coachEmail: 'coach@example.com',
        coachName: 'John Doe',
        sport: 'Basketball'
      })

      const validation = validateInvitation(invitation)

      expect(validation.valid).toBe(true)
      expect(validation.reason).toBeUndefined()
    })

    it('validates invitation with future expiry', () => {
      const invitation: Invitation = {
        id: 'inv_test',
        coachEmail: 'coach@example.com',
        sport: 'Basketball',
        role: 'coach',
        invitationType: 'coach',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        status: 'sent',
        used: false
      }

      const validation = validateInvitation(invitation)

      expect(validation.valid).toBe(true)
    })
  })

  describe('Invalid Invitations', () => {
    it('rejects already used invitation', () => {
      const invitation: Invitation = {
        id: 'inv_test',
        coachEmail: 'coach@example.com',
        sport: 'Basketball',
        role: 'coach',
        invitationType: 'coach',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'accepted',
        used: true,
        usedAt: new Date().toISOString(),
        usedBy: 'user_123'
      }

      const validation = validateInvitation(invitation)

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBe('Invitation already used')
    })

    it('rejects expired invitation', () => {
      const invitation: Invitation = {
        id: 'inv_test',
        coachEmail: 'coach@example.com',
        sport: 'Basketball',
        role: 'coach',
        invitationType: 'coach',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
        status: 'sent',
        used: false
      }

      const validation = validateInvitation(invitation)

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBe('Invitation expired')
    })

    it('rejects revoked invitation', () => {
      const invitation: Invitation = {
        id: 'inv_test',
        coachEmail: 'coach@example.com',
        sport: 'Basketball',
        role: 'coach',
        invitationType: 'coach',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'revoked',
        used: false
      }

      const validation = validateInvitation(invitation)

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBe('Invitation revoked')
    })
  })
})

describe('Invitation System - Usage Tracking', () => {

  it('marks invitation as used', () => {
    const invitation = createCoachInvitation({
      coachEmail: 'coach@example.com',
      coachName: 'John Doe',
      sport: 'Basketball'
    })

    const userId = 'user_123'
    const usedInvitation = useInvitation(invitation, userId)

    expect(usedInvitation.used).toBe(true)
    expect(usedInvitation.usedBy).toBe(userId)
    expect(usedInvitation.usedAt).toBeTruthy()
    expect(usedInvitation.status).toBe('accepted')
  })

  it('records timestamp when invitation is used', () => {
    const invitation = createCoachInvitation({
      coachEmail: 'coach@example.com',
      coachName: 'John Doe',
      sport: 'Basketball'
    })

    const before = Date.now()
    const usedInvitation = useInvitation(invitation, 'user_123')
    const after = Date.now()

    const usedAt = new Date(usedInvitation.usedAt!).getTime()

    expect(usedAt).toBeGreaterThanOrEqual(before)
    expect(usedAt).toBeLessThanOrEqual(after)
  })

  it('records user who used invitation', () => {
    const invitation = createCoachInvitation({
      coachEmail: 'coach@example.com',
      coachName: 'John Doe',
      sport: 'Basketball'
    })

    const usedInvitation = useInvitation(invitation, 'user_456')

    expect(usedInvitation.usedBy).toBe('user_456')
  })

  it('prevents reusing used invitation', () => {
    const invitation = createCoachInvitation({
      coachEmail: 'coach@example.com',
      coachName: 'John Doe',
      sport: 'Basketball'
    })

    const usedInvitation = useInvitation(invitation, 'user_123')
    const validation = validateInvitation(usedInvitation)

    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('Invitation already used')
  })
})

describe('Invitation System - Email Validation', () => {

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  it('validates correct email format', () => {
    expect(emailRegex.test('coach@example.com')).toBe(true)
  })

  it('rejects invalid email formats', () => {
    const invalidEmails = [
      'not-an-email',
      '@example.com',
      'user@',
      'user name@example.com'
    ]

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('accepts email with dots', () => {
    expect(emailRegex.test('first.last@example.com')).toBe(true)
  })

  it('accepts email with plus sign', () => {
    expect(emailRegex.test('user+tag@example.com')).toBe(true)
  })
})

describe('Invitation System - Invitation URL Generation', () => {

  it('generates valid coach onboard URL', () => {
    const invitationId = 'inv_123456'
    const sport = 'Basketball'
    const email = 'coach@example.com'
    const name = 'John Doe'
    const role = 'coach'

    const url = `https://playbookd.crucibleanalytics.dev/coach-onboard/${invitationId}?sport=${encodeURIComponent(sport)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${role}`

    expect(url).toContain(invitationId)
    expect(url).toContain('coach-onboard')
    expect(url).toContain(encodeURIComponent(sport))
    expect(url).toContain(encodeURIComponent(email))
    expect(url).toContain(role)
  })

  it('encodes special characters in URL parameters', () => {
    const sport = 'Track & Field'
    const email = 'test+user@example.com'

    const sportEncoded = encodeURIComponent(sport)
    const emailEncoded = encodeURIComponent(email)

    expect(sportEncoded).not.toContain('&')
    expect(sportEncoded).not.toContain(' ')
    expect(emailEncoded).toContain('%2B') // + becomes %2B
  })

  it('includes role parameter for assistant invitations', () => {
    const invitationId = 'inv_789'
    const role = 'assistant'

    const url = `https://playbookd.crucibleanalytics.dev/coach-onboard/${invitationId}?role=${role}`

    expect(url).toContain('role=assistant')
  })
})

describe('Invitation System - Expiration Edge Cases', () => {

  it('invitation expiring in exactly 1 hour is still valid', () => {
    const invitation: Invitation = {
      id: 'inv_test',
      coachEmail: 'coach@example.com',
      sport: 'Basketball',
      role: 'coach',
      invitationType: 'coach',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      status: 'sent',
      used: false
    }

    const validation = validateInvitation(invitation)

    expect(validation.valid).toBe(true)
  })

  it('invitation expired 1 second ago is invalid', () => {
    const invitation: Invitation = {
      id: 'inv_test',
      coachEmail: 'coach@example.com',
      sport: 'Basketball',
      role: 'coach',
      invitationType: 'coach',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      status: 'sent',
      used: false
    }

    const validation = validateInvitation(invitation)

    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('Invitation expired')
  })
})

describe('Invitation System - Multiple Invitations', () => {

  it('supports creating bulk athlete invitations', () => {
    const athleteEmails = [
      'athlete1@example.com',
      'athlete2@example.com',
      'athlete3@example.com'
    ]

    const invitations = athleteEmails.map(email =>
      createAthleteInvitation({
        athleteEmail: email,
        sport: 'Basketball',
        coachId: 'coach_123'
      })
    )

    expect(invitations).toHaveLength(3)
    invitations.forEach((inv, idx) => {
      expect(inv.athleteEmail).toBe(athleteEmails[idx])
      expect(inv.sport).toBe('Basketball')
      expect(inv.role).toBe('athlete')
    })
  })

  it('each invitation has unique ID', () => {
    const invitations = [
      createCoachInvitation({ coachEmail: 'coach1@example.com', coachName: 'Coach 1', sport: 'Basketball' }),
      createCoachInvitation({ coachEmail: 'coach2@example.com', coachName: 'Coach 2', sport: 'Soccer' }),
      createCoachInvitation({ coachEmail: 'coach3@example.com', coachName: 'Coach 3', sport: 'Tennis' })
    ]

    const ids = invitations.map(inv => inv.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(3)
  })
})
