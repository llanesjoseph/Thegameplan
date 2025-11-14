'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AthleteInviteLanding() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [athleteName, setAthleteName] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function validate() {
      if (!id) return
      try {
        const res = await fetch(`/api/validate-invitation?id=${id}&type=athlete`, { cache: 'no-store' })
        const data = await res.json()
        if (isMounted) {
          if (res.ok && data.success && data.invitation) {
            setValid(true)
            setAthleteName(data.invitation.athleteName || null)
            // Try to resolve a friendly coach/organization name
            setCoachName(data.invitation.coachName || data.invitation.organizationName || null)
          } else {
            setValid(false)
          }
        }
      } catch {
        if (isMounted) setValid(false)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    validate()
    return () => { isMounted = false }
  }, [id])

  const acceptInvite = () => {
    if (!id) return
    router.push(`/athlete-onboard/${id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Brand banner with logo + tagline */}
      <header className="w-full" style={{ backgroundColor: '#440102' }}>
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <img
            src="/brand/athleap-logo-colored.png"
            alt="AthLeap"
            className="w-28 h-auto"
          />
          <div className="text-white/80 tracking-widest text-xs sm:text-sm">
            THE WORK BEFORE THE WIN
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-600">Validating your invite…</div>
        ) : !valid ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">This invite link isn’t valid</h1>
            <p className="text-gray-600">Please contact your coach for a new invitation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold" style={{ color: '#000', fontFamily: '\"Open Sans\", sans-serif' }}>
              Athlete Invite
            </h1>

            <div className="bg-white">
              <p className="text-gray-800 mb-5">
                {athleteName ? `Hi ${athleteName.split(' ')[0]} – ` : 'Hi – '}
                {coachName ? `${coachName} has invited you to join their team on AthLeap.` : 'You’ve been invited to join AthLeap.'}
              </p>

              <button
                onClick={acceptInvite}
                className="inline-block px-6 py-3 rounded-lg text-white font-semibold shadow-md"
                style={{ backgroundColor: '#000000' }}
              >
                Accept Invite
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


