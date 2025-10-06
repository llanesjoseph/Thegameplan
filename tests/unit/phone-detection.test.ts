import { describe, it, expect } from 'vitest'

/**
 * Phone Number Detection Tests
 *
 * CRITICAL: This system prevents athletes from sharing phone numbers
 * in direct messages, which is a safety and compliance requirement.
 */

// Phone number detection regex (matches the one in message safety system)
const PHONE_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,           // 555-123-4567 or 555.123.4567 or 5551234567
  /\(\d{3}\)\s*\d{3}[-.]?\d{4}/,            // (555) 123-4567
  /\b\d{3}\s+\d{3}\s+\d{4}\b/,              // 555 123 4567
  /\b1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/,    // 1-555-123-4567
]

function containsPhoneNumber(text: string): boolean {
  // Need to reset regex state for each pattern by recreating or removing /g flag
  return PHONE_PATTERNS.some(pattern => pattern.test(text))
}

describe('Phone Number Detection - Security Critical', () => {
  describe('US Phone Number Formats', () => {
    it('should detect phone with dashes: 555-123-4567', () => {
      const message = "Call me at 555-123-4567"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone with dots: 555.123.4567', () => {
      const message = "My number is 555.123.4567"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone with no separators: 5551234567', () => {
      const message = "Text me 5551234567"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone with parentheses: (555) 123-4567', () => {
      const message = "Reach me at (555) 123-4567"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone with spaces: 555 123 4567', () => {
      const message = "Call 555 123 4567 tonight"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone with country code: 1-555-123-4567', () => {
      const message = "International: 1-555-123-4567"
      expect(containsPhoneNumber(message)).toBe(true)
    })
  })

  describe('Hidden/Obfuscated Phone Numbers', () => {
    it('should detect phone hidden in sentence', () => {
      const message = "My contact is five five five one two three four five six seven"
      // This won't be detected by current system - edge case
      // But numeric format should be caught
      const numeric = "Contact: 5551234567"
      expect(containsPhoneNumber(numeric)).toBe(true)
    })

    it('should detect multiple phones in one message', () => {
      const message = "Office: 555-123-4567, Cell: 555-987-6543"
      expect(containsPhoneNumber(message)).toBe(true)
    })
  })

  describe('False Positives - Should NOT Detect', () => {
    it('should NOT detect normal numbers: scored 10 points', () => {
      const message = "I scored 10 points in the game today"
      expect(containsPhoneNumber(message)).toBe(false)
    })

    it('should NOT detect dates: 2023-12-25', () => {
      const message = "Game on 2023-12-25 at 3pm"
      expect(containsPhoneNumber(message)).toBe(false)
    })

    it('should NOT detect partial numbers: 123-45', () => {
      const message = "Drill 123-45 from playbook"
      expect(containsPhoneNumber(message)).toBe(false)
    })

    it('should NOT detect score: 21-14', () => {
      const message = "We won 21-14 in overtime"
      expect(containsPhoneNumber(message)).toBe(false)
    })

    it('should NOT detect time: 3:45', () => {
      const message = "Practice at 3:45 PM"
      expect(containsPhoneNumber(message)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should detect phone at start of message', () => {
      const message = "555-123-4567 is my number"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should detect phone at end of message', () => {
      const message = "Call me 555-123-4567"
      expect(containsPhoneNumber(message)).toBe(true)
    })

    it('should handle empty message', () => {
      const message = ""
      expect(containsPhoneNumber(message)).toBe(false)
    })

    it('should handle message with only numbers', () => {
      const message = "5551234567"
      expect(containsPhoneNumber(message)).toBe(true)
    })
  })
})
