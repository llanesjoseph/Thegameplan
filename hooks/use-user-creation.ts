import { useState } from 'react'
import { useErrorHandler } from '@/lib/error-handling'
import { useAuth } from './use-auth'
import { db } from '@/lib/firebase.client'
import { doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore'

interface UserCreationState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useUserCreation() {
  const [state, setState] = useState<UserCreationState>({
    loading: false,
    error: null,
    success: false
  })
  
  const { user } = useAuth()
  const { handleError, logUserAction } = useErrorHandler()

  const completeOnboarding = async (profileData: any) => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        role: 'user',
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        onboardingCompleted: true,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      await logUserAction('onboarding_completed', true, { 
        sports: profileData.sports,
        level: profileData.skillLevel 
      })

      setState(prev => ({ ...prev, loading: false, success: true }))
      return true

    } catch (error) {
      const appError = handleError(error, user.uid)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: appError.message 
      }))

      await logUserAction('onboarding_completed', false, { 
        error: appError.code,
        userId: user.uid 
      })

      return false
    }
  }

  const createCreatorProfile = async (creatorData: any, files?: { headshot?: File, action?: File }) => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // TODO: Handle file uploads if provided
      let headshotUrl = ''
      let actionImageUrl = ''

      const batch = writeBatch(db)
      const contributorData = {
        ...creatorData,
        uid: user.uid,
        email: user.email,
        headshotUrl,
        actionImageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Add creator profile
      batch.set(doc(db, 'creators', user.uid), contributorData)
      
      // Add public creator profile with slug
      const slug = creatorData.displayName.toLowerCase().replace(/\s+/g, '-')
      batch.set(doc(db, 'creatorPublic', slug), {
        ...contributorData,
        slug
      })
      
      // Update user role to creator
      batch.set(doc(db, 'users', user.uid), {
        role: 'creator',
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      // Execute all writes atomically
      await batch.commit()

      await logUserAction('creator_profile_created', true, { 
        sport: creatorData.sport,
        userId: user.uid 
      })

      setState(prev => ({ ...prev, loading: false, success: true }))
      return true

    } catch (error) {
      const appError = handleError(error, user.uid)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: appError.message 
      }))

      await logUserAction('creator_profile_created', false, { 
        error: appError.code,
        userId: user.uid 
      })

      return false
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const reset = () => {
    setState({
      loading: false,
      error: null,
      success: false
    })
  }

  return {
    ...state,
    completeOnboarding,
    createCreatorProfile,
    clearError,
    reset
  }
}
