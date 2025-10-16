'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'
import { Mic, Edit, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface VoiceTraitsDisplayProps {
  onRequestEdit?: () => void
}

export default function VoiceTraitsDisplay({ onRequestEdit }: VoiceTraitsDisplayProps) {
  const { user } = useAuth()
  const [voiceTraits, setVoiceTraits] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVoiceTraits() {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setVoiceTraits(userData.voiceTraits || [])
        }
      } catch (err) {
        console.error('Error fetching voice traits:', err)
        setError('Failed to load voice traits')
      } finally {
        setLoading(false)
      }
    }

    fetchVoiceTraits()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#000000', opacity: 0.4 }} />
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading your voice profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto" style={{ color: '#FF6B35' }} />
          <p style={{ color: '#FF6B35' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (voiceTraits.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(145, 166, 235, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
          <Mic className="w-8 h-8" style={{ color: '#000000', opacity: 0.4 }} />
        </div>
        <h3 className="text-xl" style={{ color: '#000000' }}>
          No Voice Profile Yet
        </h3>
        <p className="max-w-md mx-auto" style={{ color: '#000000', opacity: 0.7 }}>
          Complete voice capture to train your AI coaching assistant to sound authentically like you.
        </p>
        <button
          onClick={onRequestEdit}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Mic className="w-4 h-4" />
          Start Voice Capture
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl" style={{ color: '#000000' }}>
              Your AI Voice Profile
            </h3>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
              {voiceTraits.length} voice traits captured
            </p>
          </div>
        </div>
        <button
          onClick={onRequestEdit}
          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors"
        >
          <Edit className="w-4 h-4" />
          Update Voice
        </button>
      </div>

      {/* Status Badge */}
      <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" style={{ color: '#22C55E' }} />
          <span className="font-semibold" style={{ color: '#22C55E' }}>
            Voice Profile Active
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: '#000000', opacity: 0.7 }}>
          Your AI coaching assistant is using these traits to respond authentically in your voice
        </p>
      </div>

      {/* Voice Traits List */}
      <div className="rounded-xl border-2 p-6" style={{ backgroundColor: 'rgba(145, 166, 235, 0.05)', borderColor: 'rgba(145, 166, 235, 0.2)' }}>
        <h4 className="font-semibold mb-4" style={{ color: '#000000' }}>
          Voice Characteristics
        </h4>
        <div className="space-y-3">
          {voiceTraits.map((trait, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border"
              style={{ backgroundColor: 'white', borderColor: 'rgba(0, 0, 0, 0.1)' }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(145, 166, 235, 0.2)' }}>
                <span className="text-sm font-semibold" style={{ color: '#000000' }}>
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#000000' }}>
                  {trait}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgba(145, 166, 235, 0.05)', borderColor: 'rgba(145, 166, 235, 0.2)' }}>
        <h4 className="font-semibold mb-2" style={{ color: '#000000' }}>
          💡 How This Works
        </h4>
        <ul className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
          <li>• Your AI assistant reads these traits before responding to athletes</li>
          <li>• The more specific your voice traits, the more authentic the responses</li>
          <li>• You can update your voice profile anytime to improve AI responses</li>
          <li>• Changes take effect immediately for all future conversations</li>
        </ul>
      </div>

      {/* Firebase Console Link */}
      <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', borderColor: 'rgba(0, 0, 0, 0.1)' }}>
        <h4 className="font-semibold mb-2 text-sm" style={{ color: '#000000' }}>
          🔧 Technical Details
        </h4>
        <p className="text-xs mb-2" style={{ color: '#000000', opacity: 0.6 }}>
          Stored in Firebase: <code className="px-2 py-1 bg-gray-100 rounded">users/{user?.uid}/voiceTraits</code>
        </p>
        <a
          href={`https://console.firebase.google.com/u/0/project/gameplan-787a2/firestore/databases/-default-/data/~2Fusers~2F${user?.uid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline hover:no-underline"
          style={{ color: '#91A6EB' }}
        >
          View in Firebase Console →
        </a>
      </div>
    </div>
  )
}
