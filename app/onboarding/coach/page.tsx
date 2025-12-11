'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'

export default function CoachOnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sport, setSport] = useState('')
  const [yearsInGame, setYearsInGame] = useState('')
  const [shortBio, setShortBio] = useState('')
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

  const canSubmit =
    firstName.trim() && lastName.trim() && sport.trim() && yearsInGame.trim() && shortBio.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || saving) return

    setSaving(true)
    try {
      const uid = user.uid
      const now = serverTimestamp()

      const userRef = doc(db, 'users', uid)
      const existingUserSnap = await getDoc(userRef)
      const existingUserData = existingUserSnap.exists() ? (existingUserSnap.data() as any) : null

      const existingRole = existingUserData?.role
      const finalRole =
        existingRole && ['admin', 'superadmin'].includes(existingRole) ? existingRole : 'coach'

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
          sport: sport.trim(),
          onboardingComplete: true,
          updatedAt: now
        },
        { merge: true }
      )

      // Minimal creator profile
      const creatorRef = doc(db, 'creator_profiles', uid)
      await setDoc(
        creatorRef,
        {
          uid,
          email: user.email?.toLowerCase() || '',
          displayName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          sport: sport.trim(),
          sports: [sport.trim()],
          experience: `${yearsInGame.trim()} years`,
          bio: shortBio.trim(),
          isActive: true,
          status: 'approved',
          updatedAt: now
        },
        { merge: true }
      )

      router.replace('/dashboard?welcome=coach')
    } catch (error) {
      console.error('Error saving coach onboarding:', error)
      alert('Unable to save your profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Coach Onboarding
          </h1>
          <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Share just enough to launch your Athleap coach profile.
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
                Sport <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                placeholder="e.g. Basketball, BJJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Years in the game <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={80}
                value={yearsInGame}
                onChange={(e) => setYearsInGame(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Short bio <span className="text-red-600">*</span>
            </label>
            <textarea
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
              rows={4}
              placeholder="One or two sentences on who you coach, where you’ve played or coached, and what athletes can expect from you."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="w-full py-3 rounded-xl bg-black text-white font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Create My Coach Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


