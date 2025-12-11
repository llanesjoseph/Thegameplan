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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      {loading ? (
        <div className="text-center text-gray-600">Validating your invite…</div>
      ) : !valid ? (
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">This invite link isn't valid</h1>
          <p className="text-gray-600">Please contact your coach for a new invitation.</p>
        </div>
      ) : (
        <div className="max-w-lg w-full space-y-8">
          {/* ATHLEAP Logo Banner */}
          <div className="w-full h-48 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#440102' }}>
            <img
              src="/brand/athleap-logo-colored.png"
              alt="ATHLEAP"
              className="h-28 w-auto"
            />
          </div>

          {/* Invitation Message */}
          <div className="space-y-6 px-4">
            <p className="text-lg" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Hi {athleteName ? athleteName.split(' ')[0] : 'there'} –
            </p>

            <p className="text-base leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              <strong>{coachName || 'Your coach'}</strong> has invited you to join their team on
              Athleap, a new platform blending the power of AI with the thrill of sports,
              creating unforgettable fan experiences and coaching next-generation athletes.
            </p>

            {/* Accept Invite Button - ONLY call to action */}
            <div className="flex justify-center pt-2">
              <button
                onClick={acceptInvite}
                className="px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
              >
                Accept Invite
              </button>
            </div>

            <p className="text-base leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Join now and be a part of a company changing the future of sports.
              Once you are in, you can begin to train with {coachName?.split(' ')[0] || 'your coach'} and follow other elite coaches.
            </p>

            <p className="text-base" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              We can't wait to have you on board!
            </p>

            <p className="text-base" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              See you inside,<br/>
              The Athleap Team
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
