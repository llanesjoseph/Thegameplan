'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'

const ATHLETE_GOALS = [
  'Support elite athlete as a fan',
  'Learn new technical skills',
  'Practice mental agility',
  'Train for next level of the game'
]

export default function AthleteOnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [primarySport, setPrimarySport] = useState('')
  const [secondarySport, setSecondarySport] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.displayName) {
      const parts = user.displayName.split(' ')
      setFirstName((prev) => prev || parts[0] || '')
      setLastName((prev) => prev || parts.slice(1).join(' ') || '')
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Sign in to complete onboarding.</p>
      </div>
    )
  }

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  const canSubmit = firstName.trim() && lastName.trim() && primarySport.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || saving) return

    setSaving(true)
    try {
      const uid = user.uid
      const now = serverTimestamp()

      // Read existing user doc to avoid overwriting higher roles
      const userRef = doc(db, 'users', uid)
      const existingUserSnap = await getDoc(userRef)
      const existingRole = existingUserSnap.exists() ? (existingUserSnap.data() as any).role : null
      const finalRole =
        existingRole && ['coach', 'creator', 'assistant', 'admin', 'superadmin'].includes(existingRole)
          ? existingRole
          : 'athlete'

      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()

      await setDoc(
        userRef,
        {
          uid,
          email: user.email?.toLowerCase() || '',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          displayName,
          role: finalRole,
          onboardingComplete: true,
          updatedAt: now
        },
        { merge: true }
      )

      const athleteRef = doc(db, 'athletes', uid)
      await setDoc(
        athleteRef,
        {
          id: uid,
          uid,
          email: user.email?.toLowerCase() || '',
          displayName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          status: 'active',
          updatedAt: now,
          athleticProfile: {
            primarySport: primarySport.trim(),
            secondarySports: secondarySport.trim() ? [secondarySport.trim()] : [],
            trainingGoals: goals
          }
        },
        { merge: true }
      )

      router.replace('/dashboard?welcome=athlete')
    } catch (error) {
      console.error('Error saving athlete onboarding:', error)
      alert('Unable to save your profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Athlete Onboarding
          </h1>
          <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Just a few details so we can tailor your training feed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                First name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Last name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Primary sport <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
                placeholder="e.g. Basketball, BJJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Secondary sport</label>
              <input
                type="text"
                value={secondarySport}
                onChange={(e) => setSecondarySport(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Goals <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ATHLETE_GOALS.map((goal) => {
                const active = goals.includes(goal)
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm ${
                      active ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {goal}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="w-full py-3 rounded-xl bg-black text-white font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Create My Athlete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


