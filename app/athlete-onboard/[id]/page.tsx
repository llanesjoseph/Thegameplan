'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import { auth } from '@/lib/firebase.client'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

interface InvitationData {
  id: string
  creatorUid: string
  coachId: string
  athleteEmail: string
  athleteName: string
  sport: string
}

export default function AthleteOnboardingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const invitationId = id as string

  useEffect(() => {
    const load = async () => {
      if (!invitationId) return
      try {
        const res = await fetch(`/api/validate-invitation?id=${invitationId}&type=athlete`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data.success && data.invitation) {
          setInvitation(data.invitation)
        } else if (data.alreadyUsed && data.shouldRedirect) {
          window.location.replace('/login?mode=signin')
          return
        } else {
          setError('Invalid or expired invitation.')
        }
      } catch {
        setError('Failed to load invitation.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [invitationId])

  const continueWithGoogle = async () => {
    if (!invitation) return
    try {
      const provider = new GoogleAuthProvider()
      if (invitation.athleteEmail) {
        provider.setCustomParameters({ login_hint: invitation.athleteEmail, prompt: 'select_account' })
      }
      const result = await signInWithPopup(auth, provider)
      const email = result.user.email || invitation.athleteEmail

      // Link the invitation to the account
      await fetch('/api/complete-athlete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          email,
          coachId: invitation.coachId || invitation.creatorUid
        })
      })

      // Sign out to ensure clean dashboard load, then hard redirect
      await signOut(auth)
      window.location.replace('/dashboard/athlete')
    } catch (e: any) {
      alert(e?.message || 'Google sign-in failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading…</div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Invitation Error</h1>
          <p className="text-gray-600">{error || 'Invalid invitation link.'}</p>
        </div>
      </div>
    )
  }

  const firstName = (invitation.athleteName || '').split(' ')[0] || 'Athlete'

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-md p-8 text-center" style={{ backgroundColor: '#440102' }}>
          <h1 className="text-white text-3xl font-extrabold mb-4">Welcome to Athleap, {firstName}!</h1>
          <p className="text-white mb-3">
            We are so glad you are here. You are now a part of the Athleap community,
            and we hope to help you with your game. Here’s what to do next:
          </p>
          <ol className="text-white text-left list-decimal list-inside max-w-md mx-auto space-y-1">
            <li>Personalize your profile</li>
            <li>Find a coach to support your journey</li>
            <li>Start training</li>
          </ol>
          <div className="mt-6">
            <button
              onClick={continueWithGoogle}
              className="px-6 py-3 bg-white text-black rounded-lg font-semibold shadow hover:shadow-md"
            >
              Continue with Google
            </button>
          </div>
          <p className="text-white/80 text-xs mt-4">You can complete your profile later; we’ll remind you.</p>
        </div>
      </div>
    </div>
  )
}