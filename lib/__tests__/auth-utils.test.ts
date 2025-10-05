/**
 * Auth Utils Tests
 * Basic security tests for authentication utilities
 */

import { hasRole } from '../auth-utils'

describe('auth-utils', () => {
  describe('hasRole', () => {
    it('should return true when user has required role', async () => {
      const result = await hasRole('user123', 'admin', 'admin')
      expect(result).toBe(true)
    })

    it('should return true when user role is in required roles array', async () => {
      const result = await hasRole('user123', ['admin', 'superadmin'], 'admin')
      expect(result).toBe(true)
    })

    it('should return false when user does not have required role', async () => {
      const result = await hasRole('user123', 'admin', 'user')
      expect(result).toBe(false)
    })

    it('should return false when user role is not in required roles array', async () => {
      const result = await hasRole('user123', ['admin', 'superadmin'], 'user')
      expect(result).toBe(false)
    })
  })
})
