'use client'
import { useAuth } from '@/hooks/use-auth'
import AuthProvider from '@/components/auth/AuthProvider'
import ProgressiveOnboarding from '@/components/onboarding/ProgressiveOnboarding'

export default function Onboarding() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-clarity-background flex items-center justify-center">
        <div className="clarity-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clarity-accent"></div>
            <p className="ml-4 text-clarity-text-secondary">Loading your profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-clarity-background flex items-center justify-center">
        <div className="clarity-container">
          <div className="w-full max-w-md mx-auto">
            <AuthProvider 
              title="Complete Your Profile"
              subtitle="Sign in to finish setting up your personalized training experience"
              showBenefits={true}
            />
          </div>
        </div>
      </main>
    )
  }

  return <ProgressiveOnboarding />
}
