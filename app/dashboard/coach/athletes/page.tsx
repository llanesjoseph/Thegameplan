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
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  UserPlus,
  RefreshCw
} from 'lucide-react'

interface AthleteInvitation {
  id: string
  slug?: string
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
        slug: athlete.slug || athlete.id, // Use slug if available, fallback to ID
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
          creatorUid: user?.uid,
          sport: bulkForm.sport,
          customMessage: bulkForm.customMessage,
          athletes: validAthletes
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Invitation response:', result)

        // Always close the form and reload data first
        setShowBulkInvite(false)
        setBulkForm({
          sport: 'Soccer',
          customMessage: '',
          athletes: [{ email: '', name: '' }]
        })

        // Force immediate reload
        await loadAthleteData()

        if (result.successCount === 0 && result.failCount > 0) {
          const failedDetails = result.results
            ?.filter((r: any) => r.status === 'failed')
            .map((r: any) => `${r.email}: ${r.error}`)
            .join('\n')
          alert(`Failed to send ${result.failCount} invitation(s):\n\n${failedDetails || 'Email service error. Please check your email configuration.'}`)
        } else if (result.successCount > 0) {
          alert(`Successfully sent ${result.successCount} invitation(s)!${result.failCount > 0 ? `\n${result.failCount} failed.` : ''}\n\nRefreshing athlete list...`)
        } else {
          // Handle case where successCount is 0 but no failures
          alert(`Processed ${result.duplicateCount || 0} invitations (duplicates skipped)`)
        }
      } else {
        const errorResult = await response.json()
        console.error('API Error:', errorResult)
        throw new Error(`Failed to send invitations: ${errorResult.error || 'Unknown error'}`)
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
    if (!confirm('Revoke this invitation? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      if (!user) { 
        console.error('No user found')
        return
      }

      const token = await user.getIdToken()

      const response = await fetch(`/api/coach/invitations/${invitationId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        alert('Invitation revoked successfully!')
        // Reload athlete data to show updated status
        loadAthleteData()
      } else {
        const errorResult = await response.json()
        alert(`Failed to revoke invitation: ${errorResult.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error revoking invitation:', error)
      alert('Failed to revoke invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-black text-white" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            <CheckCircle className="w-3.5 h-3.5" />
            Accepted
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border-2 border-gray-300 text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        )
      case 'expired':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border-2 border-gray-400 text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            <AlertCircle className="w-3.5 h-3.5" />
            Expired
          </span>
        )
      case 'revoked':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border-2 border-gray-400 text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            <X className="w-3.5 h-3.5" />
            Revoked
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-gray-300 text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
              My Athletes
            </h1>
            <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
              Track the status of your athlete invitations
            </p>
          </div>
        )}


        {/* Bulk Invite Form */}
        {showBulkInvite && (
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="p-6 border-b-2 border-gray-200">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
                Invite Athletes
              </h2>
              <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
                Send bulk invitations to athletes
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sport and Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>
                    Sport
                  </label>
                  <select
                    value={bulkForm.sport}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
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
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={bulkForm.customMessage}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  />
                </div>
              </div>

              {/* Athletes List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>
                    Athletes
                  </label>
                  <button
                    type="button"
                    onClick={addAthleteRow}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5 bg-black text-white"
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
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
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          style={{ fontFamily: 'Open Sans, sans-serif' }}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={athlete.name}
                          onChange={(e) => updateAthlete(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          style={{ fontFamily: 'Open Sans, sans-serif' }}
                        />
                      </div>
                      {bulkForm.athletes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAthleteRow(index)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" style={{ color: '#000' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="pt-6 border-t-2 border-gray-200 mt-6">
                <button
                  onClick={handleBulkInvite}
                  disabled={isLoading}
                  className="w-full px-8 py-4 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3 font-bold"
                  style={{
                    backgroundColor: isLoading ? '#9CA3AF' : '#FC0105',
                    color: '#FFFFFF',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 700
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#D00104'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#FC0105'
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Sending Invitations...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>
                        Send {bulkForm.athletes.filter(a => a.email.trim()).length} Invitation(s)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Athletes Button */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
                  Invite Athletes
                </h2>
                <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
                  Send bulk invitations to athletes
                </p>
              </div>
              <button
                onClick={() => setShowBulkInvite(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-bold"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}
              >
                <UserPlus className="w-5 h-5" />
                <span>Invite Athletes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invitations List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
                  Athlete Roster & Invitations
                </h2>
                <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
                  Track the status of your athlete invitations
                </p>
              </div>
              <button
                onClick={loadAthleteData}
                disabled={dataLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}
                title="Refresh athlete list"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {dataLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>Loading athletes...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#666', opacity: 0.3 }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>
                  No invitations yet
                </h3>
                <p className="text-sm" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
                  Click "Invite Athletes" above to send your first invitations
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="text-left w-full">
                    <div
                      className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1 relative cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        // Don't trigger if clicking on action buttons
                        if (!(e.target as HTMLElement).closest('button')) {
                          console.log('Athlete clicked:', invitation.name)
                          // Use slug if available, otherwise fall back to ID
                          const athleteIdentifier = invitation.slug || invitation.id
                          const targetUrl = embedded
                            ? `/dashboard/coach/athletes/${athleteIdentifier}?embedded=true`
                            : `/dashboard/coach/athletes/${athleteIdentifier}`
                          router.push(targetUrl)
                        }
                      }}
                    >
                      {/* Profile Image Placeholder */}
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                        <User className="w-1/3 h-1/3 text-white opacity-90" />
                      </div>

                      {/* Status Badge Overlay */}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(invitation.status)}
                      </div>

                      {/* Action Buttons Overlay (bottom) */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResendInvitation(invitation.id)
                          }}
                          disabled={isLoading}
                          className="flex-1 p-2 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-black/80 backdrop-blur-sm"
                          title="Resend invitation"
                        >
                          <Mail className="w-4 h-4 mx-auto text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveInvitation(invitation.id)
                          }}
                          disabled={isLoading}
                          className="flex-1 p-2 rounded-lg border-2 border-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 backdrop-blur-sm"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-4 h-4 mx-auto text-gray-800" />
                        </button>
                      </div>
                    </div>

                    {/* Athlete Info Below */}
                    <p className="text-sm font-semibold truncate" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif' }}>
                      {invitation.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#666', fontFamily: 'Open Sans, sans-serif' }}>
                      {invitation.email}
                    </p>
                    <p className="text-xs" style={{ color: '#999', fontFamily: 'Open Sans, sans-serif' }}>
                      {invitation.sport} • {invitation.sentAt}
                    </p>
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
