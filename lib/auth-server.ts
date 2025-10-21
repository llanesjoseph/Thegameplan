import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase.admin';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  teamIds?: string[];
}

/**
 * Get the currently authenticated user from session cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      photoURL: decodedToken.picture,
      role: decodedToken.role,
      teamIds: decodedToken.teamIds || [],
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require a specific role - throws if user doesn't have role
 */
export async function requireRole(role: string): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== role) {
    throw new Error(`Forbidden - requires ${role} role`);
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user is part of a team
 */
export async function isTeamMember(teamId: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.teamIds?.includes(teamId) || false;
}
