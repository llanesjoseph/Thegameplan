/**
 * API Validation Tests
 * Tests for input validation utilities
 */

import { validateEmail, validateRole } from '../api-validation'

describe('api-validation', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
    })
  })

  describe('validateRole', () => {
    it('should accept valid roles', () => {
      expect(validateRole('user')).toBe(true)
      expect(validateRole('admin')).toBe(true)
      expect(validateRole('superadmin')).toBe(true)
      expect(validateRole('creator')).toBe(true)
    })

    it('should reject invalid roles', () => {
      expect(validateRole('hacker')).toBe(false)
      expect(validateRole('root')).toBe(false)
      expect(validateRole('')).toBe(false)
    })
  })
})
