import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'
import type { UserProfile } from '@/types/user'

interface AuthState {
  firebaseUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  setFirebaseUser: (user: FirebaseUser | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading })
}))


