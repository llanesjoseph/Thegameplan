'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import dynamic from 'next/dynamic'

// Lazy-load the assistant to keep initial render light
const AskCoachAI = dynamic(() => import('./AskCoachAI'), { ssr: false })

export default function AthleteAssistant() {
  const { user } = useAuth()
  const [coachId, setCoachId] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string>('')
  const [sport, setSport] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (userSnap.exists()) {
          const data: any = userSnap.data()
          const cId = data?.coachId || data?.assignedCoachId || null
          setCoachId(cId)
          if (cId) {
            const coachSnap = await getDoc(doc(db, 'users', cId))
            if (coachSnap.exists()) {
              const c = coachSnap.data() as any
              setCoachName(c?.displayName || 'Coach')
              setSport(c?.sport || '')
            }
          }
        }
      } catch (e) {
        console.error('Error loading assistant coach info:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading || !coachId) return null

  return (
    <section id="ai-assistant" className="scroll-mt-20">
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Ask Your Coach
      </h2>
      <div className="rounded-lg overflow-hidden">
        <AskCoachAI coachId={coachId || undefined} coachName={coachName} sport={sport} defaultOpen={true} hideLauncher={true} />
      </div>
    </section>
  )
}


