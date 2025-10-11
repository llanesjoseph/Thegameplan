'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams } from 'next/navigation'
import { UserCheck, Mail, Briefcase, MessageSquare, Send, CheckCircle2 } from 'lucide-react'

function RecruitCoachContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [formData, setFormData] = useState({
    coachName: '',
    coachEmail: '',
    sport: 'baseball',
    personalMessage: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!user) throw new Error('Not authenticated')

      const token = await user.getIdToken()
      const response = await fetch('/api/coach-invitation-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          invitationType: 'coach'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      // Reset form
      setFormData({
        coachName: '',
        coachEmail: '',
        sport: 'baseball',
        personalMessage: ''
      })

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)

    } catch (error) {
      console.error('Error sending coach invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>Recruit Fellow Coach</h1>
            <p style={{ color: '#000000', opacity: 0.7 }}>Invite other coaches to join the platform</p>
          </div>
        </div>
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {/* Header */}
        {embedded && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>Recruit Fellow Coach</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Invite other coaches to join the AthLeap platform
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 mb-1">Invitation Sent Successfully!</h3>
              <p className="text-green-700 text-sm">
                The coach will receive an email invitation to join the platform.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Invitation Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Coach Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <UserCheck className="w-4 h-4" />
                Coach Name *
              </label>
              <input
                type="text"
                value={formData.coachName}
                onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="e.g., John Smith"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <Mail className="w-4 h-4" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.coachEmail}
                onChange={(e) => setFormData({ ...formData, coachEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="coach@example.com"
                required
              />
            </div>

            {/* Sport */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <Briefcase className="w-4 h-4" />
                Primary Sport *
              </label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                required
              >
                <option value="baseball">Baseball</option>
                <option value="basketball">Basketball</option>
                <option value="football">Football</option>
                <option value="soccer">Soccer</option>
                <option value="softball">Softball</option>
                <option value="volleyball">Volleyball</option>
                <option value="track">Track & Field</option>
                <option value="swimming">Swimming</option>
                <option value="tennis">Tennis</option>
                <option value="lacrosse">Lacrosse</option>
                <option value="hockey">Hockey</option>
                <option value="wrestling">Wrestling</option>
                <option value="golf">Golf</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Personal Message */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <MessageSquare className="w-4 h-4" />
                Personal Message (Optional)
              </label>
              <textarea
                value={formData.personalMessage}
                onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="Add a personal message to your invitation..."
                rows={4}
              />
              <p className="text-xs mt-2" style={{ color: '#000000', opacity: 0.6 }}>
                This message will be included in the invitation email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: 'linear-gradient(to right, #20B2AA, #91A6EB)',
                color: '#FFFFFF'
              }}
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Invitation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-r from-sky-blue/10 to-teal/10 rounded-xl p-6 border-2" style={{ borderColor: '#20B2AA' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#000000' }}>
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: '#000000', opacity: 0.8 }}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#20B2AA' }} />
              <span>The coach will receive an email invitation to join AthLeap</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#20B2AA' }} />
              <span>They'll create their account and complete their coach profile</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#20B2AA' }} />
              <span>Once approved, they can start creating content and training athletes</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default function RecruitCoachPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <RecruitCoachContent />
    </Suspense>
  )
}
