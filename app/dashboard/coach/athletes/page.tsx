'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import {
  Users,
  User,
  Plus,
  Mail,
  Trash2,
  Send,
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Download,
  Upload
} from 'lucide-react'

interface AthleteInvitation {
  id: string
  email: string
  name: string
  sport: string
  customMessage?: string
  status: 'pending' | 'sent' | 'accepted' | 'expired'
  sentAt?: string
  expiresAt?: string
}

interface BulkInviteForm {
  sport: string
  customMessage: string
  athletes: Array<{
    email: string
    name: string
  }>
}

function CoachAthletesContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [invitations, setInvitations] = useState<AthleteInvitation[]>([])
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[CoachAthletes] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])

  const [bulkForm, setBulkForm] = useState<BulkInviteForm>({
    sport: 'Soccer',
    customMessage: '',
    athletes: [{ email: '', name: '' }]
  })

  // Load real athlete data from API
  useEffect(() => {
    if (user) {
      loadAthleteData()
    }
  }, [user])

  const loadAthleteData = async () => {
    setDataLoading(true)
    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      // Fetch athletes from the API
      const response = await fetch('/api/coach/athletes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load athletes')
      }

      const data = await response.json()

      // Transform athletes data into invitation format
      const athleteInvitations = (data.athletes || []).map((athlete: any) => ({
        id: athlete.id,
        email: athlete.email || athlete.athleteEmail || '',
        name: athlete.displayName || athlete.name || athlete.athleteName || 'Unknown',
        sport: athlete.sport || athlete.preferredSports?.[0] || 'Unknown',
        status: athlete.status || 'accepted',
        sentAt: athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString() : 'Unknown',
        expiresAt: athlete.expiresAt ? new Date(athlete.expiresAt).toLocaleDateString() : undefined,
        customMessage: athlete.customMessage
      }))

      setInvitations(athleteInvitations)
    } catch (error) {
      console.error('Error loading athlete data:', error)
      // Don't show alert for empty state, just log the error
      setInvitations([])
    } finally {
      setDataLoading(false)
    }
  }

  const addAthleteRow = () => {
    setBulkForm(prev => ({
      ...prev,
      athletes: [...prev.athletes, { email: '', name: '' }]
    }))
  }

  const removeAthleteRow = (index: number) => {
    setBulkForm(prev => ({
      ...prev,
      athletes: prev.athletes.filter((_, i) => i !== index)
    }))
  }

  const updateAthlete = (index: number, field: 'email' | 'name', value: string) => {
    setBulkForm(prev => ({
      ...prev,
      athletes: prev.athletes.map((athlete, i) =>
        i === index ? { ...athlete, [field]: value } : athlete
      )
    }))
  }

  const handleBulkInvite = async () => {
    setIsLoading(true)
    try {
      // Filter out empty rows
      const validAthletes = bulkForm.athletes.filter(a => a.email.trim() && a.name.trim())

      if (validAthletes.length === 0) {
        alert('Please add at least one athlete with email and name')
        return
      }

      // Get auth token
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      // Send invitations
      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachId: user?.uid,
          sport: bulkForm.sport,
          customMessage: bulkForm.customMessage,
          athletes: validAthletes
        }),
      })

      if (response.ok) {
        const result = await response.json()

        if (result.successCount === 0 && result.failCount > 0) {
          const failedDetails = result.results
            ?.filter((r: any) => r.status === 'failed')
            .map((r: any) => `${r.email}: ${r.error}`)
            .join('\n')
          alert(`Failed to send ${result.failCount} invitation(s):\n\n${failedDetails || 'Email service error. Please check your email configuration.'}`)
        } else if (result.successCount > 0) {
          alert(`Successfully sent ${result.successCount} invitation(s)!${result.failCount > 0 ? `\n${result.failCount} failed.` : ''}`)
          setShowBulkInvite(false)
          setBulkForm({
            sport: 'Soccer',
            customMessage: '',
            athletes: [{ email: '', name: '' }]
          })
          // Reload athlete data to show new invitations
          loadAthleteData()
        }
      } else {
        throw new Error('Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      alert('Failed to send invitations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    if (!confirm('Resend this invitation? The athlete will receive another email.')) {
      return
    }

    setIsLoading(true)
    try {
      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/resend-invitation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.data?.emailSent) {
          alert(`✅ Invitation resent successfully!\n\nEmail sent to: ${result.data.athleteEmail}\nResend count: ${result.data.resendCount}`)
        } else {
          alert(`⚠️ Invitation was processed but email failed to send:\n${result.data?.emailError || 'Unknown error'}`)
        }
        // Reload athlete data to show updated resend count
        loadAthleteData()
      } else if (response.status === 429) {
        alert(`⏱️ Too many resend attempts!\n\nPlease wait ${result.retryAfter || 60} seconds before trying again.`)
      } else {
        throw new Error(result.error || 'Failed to resend invitation')
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      alert(`Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!confirm('Remove this invitation? This action cannot be undone.')) {
      return
    }

    alert('Remove invitation feature coming soon!')
    // TODO: Implement remove invitation API endpoint
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

          setBulkForm(prev => ({
            ...prev,
            athletes: athletes.length > 0 ? athletes : [{ email: '', name: '' }]
          }))
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35' }}>
            <Clock className="w-4 h-4" />
            Pending
          </span>
        )
      case 'expired':
        return (
          <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Expired
          </span>
        )
      default:
        return (
          <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {status}
          </span>
        )
    }
  }

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
          <h2 className="text-2xl mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
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
        <AppHeader title="My Athletes" subtitle="Manage your athlete roster and invitations" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8" style={{ color: '#91A6EB' }} />
              <h1 className="text-3xl" style={{ color: '#000000' }}>My Athletes</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Manage your athlete roster and invitations
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowBulkInvite(!showBulkInvite)}
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {showBulkInvite ? 'Cancel Invite' : 'Invite Athletes'}
          </button>

          <button
            onClick={importFromCSV}
            className="px-5 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
            style={{ color: '#000000' }}
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>

          <button className="px-5 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
            style={{ color: '#000000' }}
          >
            <Download className="w-5 h-5" />
            Export List
          </button>
        </div>

        {/* Bulk Invite Form */}
        {showBulkInvite && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl mb-2" style={{ color: '#000000' }}>
                Invite Multiple Athletes
              </h2>
              <p style={{ color: '#000000', opacity: 0.7 }}>
                Send personalized invitations to multiple athletes at once
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sport and Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Sport
                  </label>
                  <select
                    value={bulkForm.sport}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Brazilian Jiu-Jitsu">Brazilian Jiu-Jitsu</option>
                    <option value="Mixed Martial Arts">Mixed Martial Arts</option>
                    <option value="Boxing">Boxing</option>
                    <option value="Wrestling">Wrestling</option>
                    <option value="Soccer">Soccer</option>
                    <option value="American Football">American Football</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Golf">Golf</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Track & Field">Track & Field</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Hockey">Hockey</option>
                    <option value="Gymnastics">Gymnastics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={bulkForm.customMessage}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>
              </div>

              {/* Athletes List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm" style={{ color: '#000000' }}>
                    Athletes
                  </label>
                  <button
                    type="button"
                    onClick={addAthleteRow}
                    className="px-3 py-1.5 rounded-lg text-sm hover:opacity-80 transition-opacity flex items-center gap-1.5"
                    style={{ backgroundColor: 'rgba(145, 166, 235, 0.2)', color: '#91A6EB' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bulkForm.athletes.map((athlete, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="athlete@example.com"
                          value={athlete.email}
                          onChange={(e) => updateAthlete(index, 'email', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={athlete.name}
                          onChange={(e) => updateAthlete(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      {bulkForm.athletes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAthleteRow(index)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" style={{ color: '#FF6B35' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Button - SUPER PROMINENT */}
              <div className="pt-6 border-t-2 border-gray-200 mt-6">
                <button
                  onClick={handleBulkInvite}
                  disabled={isLoading}
                  className="w-full px-8 py-5 rounded-xl transition-all shadow-2xl hover:shadow-3xl disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl"
                  style={{
                    minHeight: '70px',
                    backgroundColor: isLoading ? '#9CA3AF' : '#16A34A',
                    color: '#FFFFFF',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    border: '3px solid #15803D'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#15803D'
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#16A34A'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-white"></div>
                      <span className="text-xl">Sending Invitations...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-8 h-8" />
                      <span className="text-xl">
                        Send {bulkForm.athletes.filter(a => a.email.trim()).length} Invitation(s)
                      </span>
                    </>
                  )}
                </button>
                <p className="text-center text-sm mt-3" style={{ color: '#000000', opacity: 0.6 }}>
                  Click the big green button above to send invitations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invitations List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl flex items-center gap-3 mb-2" style={{ color: '#000000' }}>
              <Users className="w-6 h-6" />
              Athlete Roster & Invitations
            </h2>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Track the status of your athlete invitations
            </p>
          </div>

          <div className="p-6">
            {dataLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p style={{ color: '#000000', opacity: 0.7 }}>Loading athletes...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                <h3 className="text-xl mb-2" style={{ color: '#000000' }}>
                  No invitations yet
                </h3>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  Start by inviting your first athletes
                </p>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
                >
                  <UserPlus className="w-5 h-5" />
                  Invite Athletes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg" style={{ color: '#000000' }}>
                          {invitation.name}
                        </h4>
                        <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                          {invitation.email}
                        </p>
                        <p className="text-xs" style={{ color: '#000000', opacity: 0.5 }}>
                          {invitation.sport} • Sent {invitation.sentAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(invitation.status)}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={isLoading}
                          className="p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'rgba(145, 166, 235, 0.1)', color: '#91A6EB' }}
                          title="Resend invitation"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveInvitation(invitation.id)}
                          disabled={isLoading}
                          className="p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35' }}
                          title="Remove invitation"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CoachAthletesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br" style={{ backgroundColor: '#E8E6D8' }}><div className="flex items-center justify-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div></div>}>
      <CoachAthletesContent />
    </Suspense>
  )
}
