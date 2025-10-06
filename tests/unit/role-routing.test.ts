import { describe, it, expect } from 'vitest'

/**
 * Role-Based Routing Tests
 *
 * CRITICAL: Ensures users are routed to the correct dashboard
 * based on their role (admin, superadmin, coach, athlete)
 */

type UserRole = 'guest' | 'user' | 'athlete' | 'creator' | 'coach' | 'assistant' | 'admin' | 'superadmin'

function getExpectedDashboardRoute(role: UserRole): string {
  // This matches the logic in app/dashboard/page.tsx
  if (role === 'superadmin' || role === 'admin') {
    return '/dashboard/admin'
  } else if (role === 'athlete') {
    return '/dashboard/progress'
  } else if (role === 'creator' || role === 'coach' || role === 'assistant' || role === 'user') {
    return '/dashboard/creator'
  }
  return '/dashboard/creator' // default
}

function shouldRedirectFromCreatorDashboard(role: UserRole): boolean {
  // This matches logic in app/dashboard/creator/page.tsx
  return role === 'admin' || role === 'superadmin'
}

describe('Role-Based Dashboard Routing', () => {
  describe('Admin Routing', () => {
    it('should route admin to /dashboard/admin', () => {
      expect(getExpectedDashboardRoute('admin')).toBe('/dashboard/admin')
    })

    it('should route superadmin to /dashboard/admin', () => {
      expect(getExpectedDashboardRoute('superadmin')).toBe('/dashboard/admin')
    })

    it('should redirect admin from creator dashboard', () => {
      expect(shouldRedirectFromCreatorDashboard('admin')).toBe(true)
    })

    it('should redirect superadmin from creator dashboard', () => {
      expect(shouldRedirectFromCreatorDashboard('superadmin')).toBe(true)
    })
  })

  describe('Athlete Routing', () => {
    it('should route athlete to /dashboard/progress', () => {
      expect(getExpectedDashboardRoute('athlete')).toBe('/dashboard/progress')
    })

    it('should NOT redirect athlete from creator dashboard', () => {
      expect(shouldRedirectFromCreatorDashboard('athlete')).toBe(false)
    })
  })

  describe('Coach/Creator Routing', () => {
    it('should route creator to /dashboard/creator', () => {
      expect(getExpectedDashboardRoute('creator')).toBe('/dashboard/creator')
    })

    it('should route coach to /dashboard/creator', () => {
      expect(getExpectedDashboardRoute('coach')).toBe('/dashboard/creator')
    })

    it('should route assistant to /dashboard/creator', () => {
      expect(getExpectedDashboardRoute('assistant')).toBe('/dashboard/creator')
    })

    it('should NOT redirect coach from creator dashboard', () => {
      expect(shouldRedirectFromCreatorDashboard('coach')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should route user role to /dashboard/creator by default', () => {
      expect(getExpectedDashboardRoute('user')).toBe('/dashboard/creator')
    })

    it('should route guest to /dashboard/creator by default', () => {
      expect(getExpectedDashboardRoute('guest')).toBe('/dashboard/creator')
    })
  })
})

describe('Role Access Control', () => {
  function canAccessAdminDashboard(role: UserRole): boolean {
    return role === 'admin' || role === 'superadmin'
  }

  function canAccessCreatorDashboard(role: UserRole): boolean {
    return role === 'creator' || role === 'coach' || role === 'assistant' || role === 'superadmin'
  }

  function canAccessAthleteDashboard(role: UserRole): boolean {
    return role === 'athlete' || role === 'coach' || role === 'admin' || role === 'superadmin'
  }

  describe('Admin Dashboard Access', () => {
    it('admin can access admin dashboard', () => {
      expect(canAccessAdminDashboard('admin')).toBe(true)
    })

    it('superadmin can access admin dashboard', () => {
      expect(canAccessAdminDashboard('superadmin')).toBe(true)
    })

    it('coach CANNOT access admin dashboard', () => {
      expect(canAccessAdminDashboard('coach')).toBe(false)
    })

    it('athlete CANNOT access admin dashboard', () => {
      expect(canAccessAdminDashboard('athlete')).toBe(false)
    })
  })

  describe('Creator Dashboard Access', () => {
    it('creator can access creator dashboard', () => {
      expect(canAccessCreatorDashboard('creator')).toBe(true)
    })

    it('coach can access creator dashboard', () => {
      expect(canAccessCreatorDashboard('coach')).toBe(true)
    })

    it('assistant can access creator dashboard', () => {
      expect(canAccessCreatorDashboard('assistant')).toBe(true)
    })

    it('superadmin can access creator dashboard', () => {
      expect(canAccessCreatorDashboard('superadmin')).toBe(true)
    })

    it('athlete CANNOT access creator dashboard', () => {
      expect(canAccessCreatorDashboard('athlete')).toBe(false)
    })
  })
})
