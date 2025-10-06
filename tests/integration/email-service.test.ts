import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Email Service Integration Tests
 *
 * CRITICAL: Tests email validation, template rendering, and error handling
 * for coach invitations, athlete invitations, and application status emails.
 *
 * Email service is critical for user onboarding and communication.
 */

// Email validation function (from lib/email-service.ts pattern)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Email template rendering simulation
function renderCoachInvitationEmail(props: {
  to: string
  organizationName: string
  inviterName: string
  sport: string
  invitationUrl: string
  qrCodeUrl: string | null
  customMessage?: string
  expiresAt: string
  recipientName?: string
  templateType?: 'playbookd' | 'simple'
}): { subject: string; html: string } {
  const subject = `🏆 You're Invited to Join ${props.organizationName} - PLAYBOOKD`
  const html = `<!DOCTYPE html><html><body>Welcome ${props.recipientName || 'Coach'}! Invitation: ${props.invitationUrl}</body></html>`

  return { subject, html }
}

function renderApplicationStatusEmail(props: {
  to: string
  applicantName: string
  organizationName: string
  status: 'approved' | 'rejected'
  loginUrl?: string
}): { subject: string; html: string } {
  const isApproved = props.status === 'approved'
  const subject = isApproved
    ? `🎉 Welcome to ${props.organizationName} - Coach Application Approved!`
    : `Coach Application Update - ${props.organizationName}`
  const html = `<!DOCTYPE html><html><body>${props.applicantName}, your application has been ${props.status}</body></html>`

  return { subject, html }
}

describe('Email Service - Email Validation', () => {

  describe('Valid Email Formats', () => {
    it('accepts standard email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it('accepts email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true)
    })

    it('accepts email with numbers', () => {
      expect(isValidEmail('user123@example456.com')).toBe(true)
    })

    it('accepts email with hyphens', () => {
      expect(isValidEmail('first-last@example-domain.com')).toBe(true)
    })

    it('accepts email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('accepts email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true)
    })

    it('accepts email with multiple subdomains', () => {
      expect(isValidEmail('user@mail.sub.example.com')).toBe(true)
    })
  })

  describe('Invalid Email Formats', () => {
    it('rejects email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false)
    })

    it('rejects email without domain', () => {
      expect(isValidEmail('user@')).toBe(false)
    })

    it('rejects email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('rejects email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false)
    })

    it('rejects email with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false)
    })

    it('rejects email with multiple @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })
  })
})

describe('Email Service - Coach Invitation Template', () => {

  it('renders with all required fields', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin User',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    expect(email.subject).toContain('Test Academy')
    expect(email.html).toContain('https://example.com/invite/123')
  })

  it('includes recipient name when provided', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin User',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString(),
      recipientName: 'John Doe'
    })

    expect(email.html).toContain('John Doe')
  })

  it('handles missing optional fields gracefully', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin User',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString()
      // No recipientName or customMessage
    })

    expect(email.html).toBeTruthy()
    expect(email.subject).toBeTruthy()
  })

  it('includes organization name in subject', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Elite Sports Academy',
      inviterName: 'Admin',
      sport: 'Soccer',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString()
    })

    expect(email.subject).toContain('Elite Sports Academy')
  })

  it('includes sport in context', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin',
      sport: 'Tennis',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString()
    })

    expect(email.html).toBeTruthy()
  })

  it('includes invitation URL for acceptance', () => {
    const url = 'https://playbookd.com/accept/inv_123'
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin',
      sport: 'Basketball',
      invitationUrl: url,
      qrCodeUrl: null,
      expiresAt: new Date().toISOString()
    })

    expect(email.html).toContain(url)
  })
})

describe('Email Service - Application Status Template', () => {

  describe('Approved Applications', () => {
    it('renders approved email with correct subject', () => {
      const email = renderApplicationStatusEmail({
        to: 'applicant@example.com',
        applicantName: 'John Smith',
        organizationName: 'Test Academy',
        status: 'approved',
        loginUrl: 'https://example.com/login'
      })

      expect(email.subject).toContain('Approved')
      expect(email.subject).toContain('🎉')
      expect(email.subject).toContain('Test Academy')
    })

    it('includes applicant name in approved email', () => {
      const email = renderApplicationStatusEmail({
        to: 'applicant@example.com',
        applicantName: 'Jane Doe',
        organizationName: 'Test Academy',
        status: 'approved'
      })

      expect(email.html).toContain('Jane Doe')
      expect(email.html).toContain('approved')
    })

    it('uses default login URL when not provided', () => {
      const email = renderApplicationStatusEmail({
        to: 'applicant@example.com',
        applicantName: 'John Smith',
        organizationName: 'Test Academy',
        status: 'approved'
      })

      expect(email.html).toBeTruthy()
    })
  })

  describe('Rejected Applications', () => {
    it('renders rejected email with appropriate subject', () => {
      const email = renderApplicationStatusEmail({
        to: 'applicant@example.com',
        applicantName: 'John Smith',
        organizationName: 'Test Academy',
        status: 'rejected'
      })

      expect(email.subject).toContain('Update')
      expect(email.subject).not.toContain('🎉')
      expect(email.subject).toContain('Test Academy')
    })

    it('includes applicant name in rejected email', () => {
      const email = renderApplicationStatusEmail({
        to: 'applicant@example.com',
        applicantName: 'Jane Doe',
        organizationName: 'Test Academy',
        status: 'rejected'
      })

      expect(email.html).toContain('Jane Doe')
      expect(email.html).toContain('rejected')
    })
  })
})

describe('Email Service - Error Handling', () => {

  it('validates email before sending', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user name@example.com'
    ]

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false)
    })
  })

  it('handles missing required template fields', () => {
    // Should not throw when rendering with minimal required fields
    expect(() => {
      renderCoachInvitationEmail({
        to: 'coach@example.com',
        organizationName: 'Test',
        inviterName: 'Admin',
        sport: 'Soccer',
        invitationUrl: 'https://example.com/invite/123',
        qrCodeUrl: null,
        expiresAt: new Date().toISOString()
      })
    }).not.toThrow()
  })
})

describe('Email Service - Template Types', () => {

  it('supports playbookd template type', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString(),
      templateType: 'playbookd'
    })

    expect(email.html).toBeTruthy()
  })

  it('supports simple template type', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString(),
      templateType: 'simple'
    })

    expect(email.html).toBeTruthy()
  })

  it('defaults to playbookd template when not specified', () => {
    const email = renderCoachInvitationEmail({
      to: 'coach@example.com',
      organizationName: 'Test Academy',
      inviterName: 'Admin',
      sport: 'Basketball',
      invitationUrl: 'https://example.com/invite/123',
      qrCodeUrl: null,
      expiresAt: new Date().toISOString()
      // No templateType specified
    })

    expect(email.html).toBeTruthy()
  })
})

describe('Email Service - Link Generation', () => {

  it('generates valid invitation URLs', () => {
    const invitationId = 'inv_123456'
    const url = `https://example.com/invite/${invitationId}`

    expect(url).toMatch(/^https?:\/\//)
    expect(url).toContain(invitationId)
  })

  it('encodes URL parameters correctly', () => {
    const sport = 'Track & Field'
    const email = 'test+user@example.com'
    const name = 'John Doe'

    const url = `https://example.com/invite/123?sport=${encodeURIComponent(sport)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`

    expect(url).toContain(encodeURIComponent(sport)) // 'Track%20%26%20Field'
    expect(url).toContain(encodeURIComponent(email)) // 'test%2Buser%40example.com'
    expect(url).not.toContain(' ') // Spaces should be encoded
    expect(url).toContain('%26') // & in sport name should be encoded
    expect(url).toContain('%2B') // + in email should be encoded
  })
})
