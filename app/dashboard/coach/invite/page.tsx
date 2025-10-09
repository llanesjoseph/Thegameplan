'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import EmailPreview from '@/components/admin/EmailPreview'
import { SPORTS } from '@/lib/constants/sports'
import {
  UserPlus,
  Mail,
  Upload,
  Send,
  Plus,
  X,
  CheckCircle
,
  AlertCircle
} from 'lucide-react'

interface AthleteInviteForm {
  athleteName: string
  athleteEmail: string
  sport: string
  customMessage: string
  expiresInDays: number
}

interface BulkAthlete {
  email: string
  name: string
}

function InviteAthletesPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single')
  const [sending, setSending] = useState(false)

  // Single invite form
  const [singleInvite, setSingleInvite] = useState<AthleteInviteForm>({
    athleteName: '',
    athleteEmail: '',
    sport: 'Soccer',
    customMessage: '',
    expiresInDays: 7
  })

  // Bulk invite form
  const [bulkSport, setBulkSport] = useState('Soccer')
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkAthletes, setBulkAthletes] = useState<BulkAthlete[]>([
    { email: '', name: '' }
  ])

  const addBulkRow = () => {
    setBulkAthletes([...bulkAthletes, { email: '', name: '' }])
  }

  const removeBulkRow = (index: number) => {
    setBulkAthletes(bulkAthletes.filter((_, i) => i !== index))
  }

  const updateBulkRow = (index: number, field: 'email' | 'name', value: string) => {
    const updated = [...bulkAthletes]
    updated[index][field] = value
    setBulkAthletes(updated)
  }

  const importFromCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          const lines = text.split('\n').slice(1) // Skip header
          const athletes = lines
            .filter(line => line.trim())
            .map(line => {
              const [email, name] = line.split(',').map(s => s.trim().replace(/"/g, ''))
              return { email, name }
            })

          setBulkAthletes(athletes.length > 0 ? athletes : [{ email: '', name: '' }])
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleSingleInvite = async () => {
    if (!singleInvite.athleteName || !singleInvite.athleteEmail) {
      alert('Please fill in athlete name and email')
      return
    }

    if (!user) {
      alert('Please log in to send invitations')
      return
    }

    setSending(true)
    try {
      // Get Firebase ID token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coachId: user.uid,
          coachName: user.displayName || 'Coach',
          sport: singleInvite.sport,
          customMessage: singleInvite.customMessage,
          expiresInDays: singleInvite.expiresInDays,
          athletes: [{
            email: singleInvite.athleteEmail,
            name: singleInvite.athleteName
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      alert('Invitation sent successfully!')

      // Reset form
      setSingleInvite({
        athleteName: '',
        athleteEmail: '',
        sport: 'Soccer',
        customMessage: '',
        expiresInDays: 7
      })
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert(error instanceof Error ? error.message : 'Failed to send invitation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleBulkInvite = async () => {
    const validAthletes = bulkAthletes.filter(a => a.email.trim() && a.name.trim())

    if (validAthletes.length === 0) {
      alert('Please add at least one athlete with email and name')
      return
    }

    if (!user) {
      alert('Please log in to send invitations')
      return
    }

    setSending(true)
    try {
      // Get Firebase ID token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coachId: user.uid,
          coachName: user.displayName || 'Coach',
          sport: bulkSport,
          customMessage: bulkMessage,
          expiresInDays: 7,
          athletes: validAthletes
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send invitations')
      }

      const result = await response.json()
      alert(`Successfully sent ${result.successCount || validAthletes.length} invitation(s)!`)

      // Reset form
      setBulkSport('Soccer')
      setBulkMessage('')
      setBulkAthletes([{ email: '', name: '' }])
    } catch (error) {
      console.error('Error sending invitations:', error)
      alert(error instanceof Error ? error.message : 'Failed to send invitations. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[InviteAthletes] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Invite Athletes" subtitle="Send personalized invitations to join your team" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-8 h-8" style={{ color: '#000000' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Invite Athletes</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Send personalized invitations to join your team
            </p>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-3">
          <button
            onClick={() => setInviteMode('single')}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              inviteMode === 'single'
                ? 'bg-black text-white'
                : 'bg-white/90 backdrop-blur-sm border border-gray-300/50 hover:bg-white'
            }`}
            style={{ color: inviteMode === 'single' ? '#FFFFFF' : '#000000' }}
          >
            <Mail className="w-5 h-5" />
            Single Invite
          </button>
          <button
            onClick={() => setInviteMode('bulk')}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              inviteMode === 'bulk'
                ? 'bg-black text-white'
                : 'bg-white/90 backdrop-blur-sm border border-gray-300/50 hover:bg-white'
            }`}
            style={{ color: inviteMode === 'bulk' ? '#FFFFFF' : '#000000' }}
          >
            <UserPlus className="w-5 h-5" />
            Bulk Invite
          </button>
        </div>

        {/* Single Invite */}
        {inviteMode === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Column */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 space-y-4">
              <h2 className="text-xl font-heading mb-4" style={{ color: '#000000' }}>
                Athlete Information
              </h2>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Athlete Name *
                </label>
                <input
                  type="text"
                  value={singleInvite.athleteName}
                  onChange={(e) => setSingleInvite({ ...singleInvite, athleteName: e.target.value })}
                  placeholder="John Smith"
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={singleInvite.athleteEmail}
                  onChange={(e) => setSingleInvite({ ...singleInvite, athleteEmail: e.target.value })}
                  placeholder="athlete@example.com"
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Sport
                </label>
                <select
                  value={singleInvite.sport}
                  onChange={(e) => setSingleInvite({ ...singleInvite, sport: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Custom Message (Optional)
                </label>
                <textarea
                  value={singleInvite.customMessage}
                  onChange={(e) => setSingleInvite({ ...singleInvite, customMessage: e.target.value })}
                  placeholder="Add a personal message to your invitation..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Invitation Expires In
                </label>
                <select
                  value={singleInvite.expiresInDays}
                  onChange={(e) => setSingleInvite({ ...singleInvite, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              {/* Send Button - Prominent placement */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSingleInvite}
                  disabled={sending || !singleInvite.athleteName || !singleInvite.athleteEmail}
                  className="w-full px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  style={{
                    minHeight: '56px',
                    backgroundColor: (sending || !singleInvite.athleteName || !singleInvite.athleteEmail) ? '#9CA3AF' : '#16A34A',
                    color: '#FFFFFF',
                    opacity: (sending || !singleInvite.athleteName || !singleInvite.athleteEmail) ? 0.7 : 1,
                    cursor: (sending || !singleInvite.athleteName || !singleInvite.athleteEmail) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!sending && singleInvite.athleteName && singleInvite.athleteEmail) {
                      e.currentTarget.style.backgroundColor = '#15803D'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!sending && singleInvite.athleteName && singleInvite.athleteEmail) {
                      e.currentTarget.style.backgroundColor = '#16A34A'
                    }
                  }}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
                {!singleInvite.athleteName || !singleInvite.athleteEmail ? (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Fill in athlete name and email to send
                  </p>
                ) : null}
              </div>
            </div>

            {/* Preview Column */}
            <div className="hidden lg:block">
              <EmailPreview
                type="athlete"
                data={{
                  name: singleInvite.athleteName || 'Athlete Name',
                  email: singleInvite.athleteEmail || 'athlete@example.com',
                  sport: singleInvite.sport,
                  customMessage: singleInvite.customMessage,
                  expiresInDays: singleInvite.expiresInDays,
                  coachName: user?.displayName || 'Coach'
                }}
                inviterName={user?.displayName || 'Coach'}
              />
            </div>
          </div>
        )}

        {/* Bulk Invite */}
        {inviteMode === 'bulk' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
                Bulk Invitation
              </h2>
              <button
                onClick={importFromCSV}
                className="px-4 py-2 bg-white border border-gray-300/50 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                style={{ color: '#000000' }}
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Sport
                </label>
                <select
                  value={bulkSport}
                  onChange={(e) => setBulkSport(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Custom Message (Optional)
                </label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold" style={{ color: '#000000' }}>
                  Athletes
                </label>
                <button
                  onClick={addBulkRow}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(145, 166, 235, 0.2)', color: '#91A6EB' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bulkAthletes.map((athlete, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="email"
                      value={athlete.email}
                      onChange={(e) => updateBulkRow(index, 'email', e.target.value)}
                      placeholder="athlete@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="text"
                      value={athlete.name}
                      onChange={(e) => updateBulkRow(index, 'name', e.target.value)}
                      placeholder="Athlete Name"
                      className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    {bulkAthletes.length > 1 && (
                      <button
                        onClick={() => removeBulkRow(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" style={{ color: '#FF6B35' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleBulkInvite}
                disabled={sending}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send {bulkAthletes.filter(a => a.email.trim()).length} Invitation(s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="rounded-xl p-6 border-2" style={{ background: 'linear-gradient(135deg, rgba(145, 166, 235, 0.1) 0%, rgba(145, 166, 235, 0.05) 100%)', borderColor: 'rgba(145, 166, 235, 0.3)' }}>
          <h3 className="text-lg font-heading mb-3" style={{ color: '#000000' }}>
            💡 Invitation Tips
          </h3>
          <ul className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
            <li>• Personalize your message to increase acceptance rates</li>
            <li>• Include clear expectations and what athletes will receive</li>
            <li>• For bulk invites, use CSV format: email,name (one per line)</li>
            <li>• Invitations expire after the selected time period</li>
            <li>• Athletes will receive a branded email with your custom message</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default function InviteAthletesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <InviteAthletesPageContent />
    </Suspense>
  )
}

