'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db, storage } from '@/lib/firebase.client'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileQuickSetupModal({ isOpen, onClose }: Props) {
  const { user } = useAuth()
  const [bio, setBio] = useState('')
  const [goals, setGoals] = useState('')
  const [saving, setSaving] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !isOpen) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data() as any
          setBio(d?.bio || d?.about || '')
          setGoals(Array.isArray(d?.trainingGoals) ? d.trainingGoals.join(', ') : (d?.trainingGoals || ''))
        }
      } catch (e) {
        console.error('Failed to load profile for quick setup:', e)
      }
    }
    load()
  }, [user, isOpen])

  const uploadIfNeeded = async (path: string, file: File | null) => {
    if (!file) return null
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  const handleSave = async () => {
    if (!user?.uid) return
    setSaving(true)
    try {
      const updates: any = {}
      if (bio) updates.bio = bio
      if (goals) {
        // store as string; downstream can parse or split
        updates.trainingGoals = goals
      }

      const bannerUrl = await uploadIfNeeded(`users/${user.uid}/banner-${Date.now()}.jpg`, bannerFile)
      if (bannerUrl) updates.bannerUrl = bannerUrl
      const profileUrl = await uploadIfNeeded(`users/${user.uid}/profile-${Date.now()}.jpg`, profileFile)
      if (profileUrl) updates.profileImageUrl = profileUrl

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), updates)
      }

      try { localStorage.removeItem('athleap_show_quick_profile_setup') } catch {}
      onClose()
    } catch (e) {
      console.error('Failed to save quick profile:', e)
      alert('Could not save your updates. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-6 bottom-6 w-[520px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-black text-white flex items-center justify-between">
          <h3 className="font-bold text-sm">Complete your profile (optional)</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-sm">Dismiss</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Tell coaches a little about you…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Training goals</label>
            <input
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g., Improve speed, prepare for tournament…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Update banner photo</label>
              <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Update profile photo</label>
              <input type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">You can always edit these later in Settings.</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border">Skip</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg text-white bg-black disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


