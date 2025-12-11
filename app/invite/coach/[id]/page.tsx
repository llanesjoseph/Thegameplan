'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CoachInviteLanding() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [coachName, setCoachName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function validate() {
      if (!id) return
      try {
        const res = await fetch(`/api/coach-ingestion/validate?id=${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (isMounted) {
          if (res.ok && data.success && data.ingestion) {
            setValid(true)
            setCoachName(data.ingestion.coachName || null)
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
    router.push(`/coach-onboard/${id}`)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      {loading ? (
        <div className="text-center text-gray-600">Validating your invite…</div>
      ) : !valid ? (
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">This invite link isn't valid</h1>
          <p className="text-gray-600">Please contact the Athleap team for assistance.</p>
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
              Hi {coachName ? coachName.split(' ')[0] : 'there'} –
            </p>

            <p className="text-base leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              We are the founding team at Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes. Our mission is simple: to help unlock athletic potential.
            </p>

            <p className="text-base leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              We are inviting a select group of elite athletes to join our early access community as coaches, shaping the tools that redefine how athletes train and compete.
            </p>

            {/* Join Our Community Button - ONLY call to action */}
            <div className="flex justify-center pt-2">
              <button
                onClick={acceptInvite}
                className="px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
              >
                Join Our Community
              </button>
            </div>

            <p className="text-base leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              You've earned your place at the top – this is your change to help define what comes next.
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
