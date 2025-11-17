'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, ChevronRight, X, Video, BookOpen, Clock, TrendingUp, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'

interface Athlete {
  uid: string
  displayName: string
  email: string
  profileImageUrl?: string
  slug?: string
}

interface AthleteMetrics {
  submissions: number
  videosAwaiting: number
  lessonsCompleted: number
  lessonsUnfinished: number
  lastActivity?: string
  upcomingSessions?: number
  messagesUnread?: number
}

interface EnhancedAthleteRosterModalProps {
  isOpen: boolean
  onClose: () => void
}

type ViewState = 'list' | 'profile' | 'videos' | 'invite'

interface InviteForm {
  sport: string
  customMessage: string
  athletes: Array<{
    email: string
    name: string
  }>
}

export default function EnhancedAthleteRosterModal({ isOpen, onClose }: EnhancedAthleteRosterModalProps) {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [metricsMap, setMetricsMap] = useState<Record<string, AthleteMetrics>>({})
  const [selectedAthleteIndex, setSelectedAthleteIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewState, setViewState] = useState<ViewState>('list')
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    sport: 'Soccer',
    customMessage: '',
    athletes: [{ email: '', name: '' }]
  })
  const [sendingInvites, setSendingInvites] = useState(false)
  const [aiChatSummary, setAiChatSummary] = useState<string>('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    const loadAthletes = async () => {
      if (!user?.uid || !isOpen) return

      try {
        setLoading(true)
        const token = await user.getIdToken()

        const res = await fetch('/api/coach/athletes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await res.json()

        if (data.success) {
          setAthletes(data.athletes || [])

          // Load metrics for each athlete
          const metrics: Record<string, AthleteMetrics> = {}
          for (const athlete of data.athletes || []) {
            try {
              const metricsRes = await fetch(`/api/coach/athletes/${athlete.slug || athlete.uid}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              const metricsData = await metricsRes.json()

              if (metricsData.success) {
                const pendingVideos = metricsData.submissions?.pending || metricsData.submissions?.awaitingReview || 0
                metrics[athlete.uid] = {
                  submissions: metricsData.submissions?.total || 0,
                  videosAwaiting: pendingVideos,
                  lessonsCompleted: metricsData.progress?.completed || 0,
                  lessonsUnfinished: metricsData.progress?.inProgress || 0,
                  lastActivity: metricsData.lastActivity,
                  upcomingSessions: 0,
                  messagesUnread: 0
                }
              }
            } catch (e) {
              console.warn(`Failed to load metrics for ${athlete.displayName}:`, e)
            }
          }
          setMetricsMap(metrics)
        }
      } catch (error) {
        console.error('Failed to load athletes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAthletes()
  }, [user, isOpen])

  // Fetch AI Chat Summary when athlete changes
  useEffect(() => {
    const fetchAiChatSummary = async () => {
      const currentAthlete = athletes[selectedAthleteIndex]
      if (!currentAthlete || !user) return

      try {
        setLoadingSummary(true)
        const token = await user.getIdToken()
        const response = await fetch(`/api/coach/athletes/${currentAthlete.uid}/ai-chat-summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()

        if (data.success) {
          setAiChatSummary(data.summary || 'No recent conversations')
        } else {
          setAiChatSummary('No recent conversations')
        }
      } catch (error) {
        console.error('Error fetching AI chat summary:', error)
        setAiChatSummary('Unable to load chat summary')
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchAiChatSummary()
  }, [selectedAthleteIndex, athletes, user])

  const handlePrevAthlete = () => {
    setSelectedAthleteIndex((prev) => (prev === 0 ? athletes.length - 1 : prev - 1))
  }

  const handleNextAthlete = () => {
    setSelectedAthleteIndex((prev) => (prev === athletes.length - 1 ? 0 : prev + 1))
  }

  const handleViewProfile = () => {
    setViewState('profile')
  }

  const handleViewVideos = () => {
    setViewState('videos')
  }

  const handleBackToList = () => {
    setViewState('list')
  }

  const handleInviteAthlete = () => {
    setViewState('invite')
  }

  const addAthleteRow = () => {
    setInviteForm(prev => ({
      ...prev,
      athletes: [...prev.athletes, { email: '', name: '' }]
    }))
  }

  const removeAthleteRow = (index: number) => {
    setInviteForm(prev => ({
      ...prev,
      athletes: prev.athletes.filter((_, i) => i !== index)
    }))
  }

  const updateAthlete = (index: number, field: 'email' | 'name', value: string) => {
    setInviteForm(prev => ({
      ...prev,
      athletes: prev.athletes.map((athlete, i) =>
        i === index ? { ...athlete, [field]: value } : athlete
      )
    }))
  }

  const handleSendInvites = async () => {
    setSendingInvites(true)
    try {
      const validAthletes = inviteForm.athletes.filter(a => a.email.trim() && a.name.trim())

      if (validAthletes.length === 0) {
        alert('Please add at least one athlete with email and name')
        return
      }

      const token = await user!.getIdToken()

      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorUid: user?.uid,
          sport: inviteForm.sport,
          customMessage: inviteForm.customMessage,
          athletes: validAthletes
        }),
      })

      if (response.ok) {
        setInviteForm({
          sport: 'Soccer',
          customMessage: '',
          athletes: [{ email: '', name: '' }]
        })
        setViewState('list')
        alert(`Successfully sent ${validAthletes.length} invitation(s)!`)
      } else {
        const error = await response.json()
        alert(`Failed to send invitations: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending invites:', error)
      alert('Failed to send invitations')
    } finally {
      setSendingInvites(false)
    }
  }

  if (!isOpen) return null

  const selectedAthlete = athletes[selectedAthleteIndex]
  const selectedMetrics = selectedAthlete ? metricsMap[selectedAthlete.uid] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[75vw] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {viewState !== 'list' && (
              <button
                onClick={handleBackToList}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6" style={{ color: '#000000' }} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {viewState === 'list' && 'Athlete Roster & Invitations'}
                {viewState === 'profile' && selectedAthlete && `${selectedAthlete.displayName} - Full Profile`}
                {viewState === 'videos' && selectedAthlete && `${selectedAthlete.displayName} - Video Reviews`}
                {viewState === 'invite' && 'Invite New Athletes'}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {viewState === 'list' && 'Track athlete status and engagement'}
                {viewState === 'profile' && 'Complete athlete profile and training history'}
                {viewState === 'videos' && 'Review submitted videos and provide feedback'}
                {viewState === 'invite' && 'Send invitations to athletes to join your roster'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" style={{ color: '#000000' }} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full border-4 border-black border-t-transparent animate-spin mx-auto mb-4" />
                <p style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Loading athletes...</p>
              </div>
            </div>
          ) : athletes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                No athletes yet
              </p>
            </div>
          ) : (
            <>
              {viewState === 'list' && (
                <>
                  {/* Athlete Carousel */}
                  <div className="mb-8">
                    <div className="flex items-center gap-6">
                      {/* Previous Button */}
                      <button
                        onClick={handlePrevAthlete}
                        className="flex-shrink-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                        aria-label="Previous Athlete"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Carousel Container */}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-center gap-4">
                          {/* Show current athlete centered */}
                          {athletes.length > 0 && (
                            <div className="flex items-center justify-center gap-6">
                              {/* Show 2 athletes before if available */}
                              {athletes.length > 1 && (
                                <>
                                  <button
                                    onClick={() => setSelectedAthleteIndex((selectedAthleteIndex - 2 + athletes.length) % athletes.length)}
                                    className="w-16 h-16 opacity-30 hover:opacity-50 transition-all duration-300"
                                  >
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                      {athletes[(selectedAthleteIndex - 2 + athletes.length) % athletes.length].profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={athletes[(selectedAthleteIndex - 2 + athletes.length) % athletes.length].profileImageUrl}
                                          alt={athletes[(selectedAthleteIndex - 2 + athletes.length) % athletes.length].displayName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center text-xl font-bold"
                                          style={{ backgroundColor: '#8B7D7B', color: '#fff' }}
                                        >
                                          {athletes[(selectedAthleteIndex - 2 + athletes.length) % athletes.length].displayName.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => setSelectedAthleteIndex((selectedAthleteIndex - 1 + athletes.length) % athletes.length)}
                                    className="w-20 h-20 opacity-50 hover:opacity-75 transition-all duration-300"
                                  >
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                      {athletes[(selectedAthleteIndex - 1 + athletes.length) % athletes.length].profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={athletes[(selectedAthleteIndex - 1 + athletes.length) % athletes.length].profileImageUrl}
                                          alt={athletes[(selectedAthleteIndex - 1 + athletes.length) % athletes.length].displayName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center text-xl font-bold"
                                          style={{ backgroundColor: '#8B7D7B', color: '#fff' }}
                                        >
                                          {athletes[(selectedAthleteIndex - 1 + athletes.length) % athletes.length].displayName.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </>
                              )}

                              {/* Current athlete - centered and highlighted */}
                              <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 ring-4 ring-black">
                                  {selectedAthlete.profileImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={selectedAthlete.profileImageUrl}
                                      alt={selectedAthlete.displayName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full flex items-center justify-center text-3xl font-bold"
                                      style={{ backgroundColor: '#8B7D7B', color: '#fff' }}
                                    >
                                      {selectedAthlete.displayName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <p
                                  className="mt-3 text-base font-bold text-center"
                                  style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                                >
                                  {selectedAthlete.displayName}
                                </p>
                              </div>

                              {/* Show 2 athletes after if available */}
                              {athletes.length > 1 && (
                                <>
                                  <button
                                    onClick={() => setSelectedAthleteIndex((selectedAthleteIndex + 1) % athletes.length)}
                                    className="w-20 h-20 opacity-50 hover:opacity-75 transition-all duration-300"
                                  >
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                      {athletes[(selectedAthleteIndex + 1) % athletes.length].profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={athletes[(selectedAthleteIndex + 1) % athletes.length].profileImageUrl}
                                          alt={athletes[(selectedAthleteIndex + 1) % athletes.length].displayName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center text-xl font-bold"
                                          style={{ backgroundColor: '#8B7D7B', color: '#fff' }}
                                        >
                                          {athletes[(selectedAthleteIndex + 1) % athletes.length].displayName.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => setSelectedAthleteIndex((selectedAthleteIndex + 2) % athletes.length)}
                                    className="w-16 h-16 opacity-30 hover:opacity-50 transition-all duration-300"
                                  >
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                      {athletes[(selectedAthleteIndex + 2) % athletes.length].profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={athletes[(selectedAthleteIndex + 2) % athletes.length].profileImageUrl}
                                          alt={athletes[(selectedAthleteIndex + 2) % athletes.length].displayName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-full h-full flex items-center justify-center text-xl font-bold"
                                          style={{ backgroundColor: '#8B7D7B', color: '#fff' }}
                                        >
                                          {athletes[(selectedAthleteIndex + 2) % athletes.length].displayName.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={handleNextAthlete}
                        className="flex-shrink-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                        aria-label="Next Athlete"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  {selectedAthlete && selectedMetrics && (
                    <div className="space-y-6">
                      {/* Metrics Cards */}
                      <div className="grid grid-cols-3 gap-6">
                        {/* Video Submissions */}
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE' }}>
                              <Video className="w-6 h-6" style={{ color: '#FC0105' }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                              Video Submissions
                            </h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                Awaiting Review
                              </span>
                              <span className="text-3xl font-bold" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
                                {selectedMetrics.videosAwaiting}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                              <span className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                Total Submissions
                              </span>
                              <span className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                                {selectedMetrics.submissions}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Training Progress */}
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                              <TrendingUp className="w-6 h-6" style={{ color: '#00A651' }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                              Training Progress
                            </h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                Completed
                              </span>
                              <span className="text-3xl font-bold" style={{ color: '#00A651', fontFamily: '"Open Sans", sans-serif' }}>
                                {selectedMetrics.lessonsCompleted}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                              <span className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                In Progress
                              </span>
                              <span className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                                {selectedMetrics.lessonsUnfinished}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                              <Clock className="w-6 h-6" style={{ color: '#666' }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                              Last Activity
                            </h3>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                              {selectedMetrics.lastActivity
                                ? new Date(selectedMetrics.lastActivity).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'No recent activity'}
                            </p>
                            {selectedMetrics.lastActivity && (
                              <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                {Math.floor((Date.now() - new Date(selectedMetrics.lastActivity).getTime()) / (1000 * 60 * 60 * 24))} days ago
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Panel */}
                      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mb-8">
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          Quick Actions
                        </h3>
                        <div className="flex gap-4 mb-6">
                          <button
                            onClick={handleViewProfile}
                            className="flex-1 px-6 py-4 rounded-lg bg-black text-white font-bold text-center hover:bg-gray-800 transition-colors"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          >
                            <BookOpen className="w-5 h-5 inline-block mr-2" />
                            View Full Profile
                          </button>
                          {selectedMetrics.videosAwaiting > 0 && (
                            <button
                              onClick={handleViewVideos}
                              className="flex-1 px-6 py-4 rounded-lg border-2 border-black text-black font-bold text-center hover:bg-gray-50 transition-colors"
                              style={{ fontFamily: '"Open Sans", sans-serif' }}
                            >
                              <Video className="w-5 h-5 inline-block mr-2" />
                              Review Videos ({selectedMetrics.videosAwaiting})
                            </button>
                          )}
                        </div>

                        {/* AI Chat Summary */}
                        <div className="bg-white rounded-lg p-5 border border-gray-200">
                          <h4 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                            <Sparkles className="w-5 h-5" style={{ color: '#9B59B6' }} />
                            AI Chat Summary
                          </h4>
                          {loadingSummary ? (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                                <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                                  Loading summary...
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-sm leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                                {typeof aiChatSummary === 'string' ? aiChatSummary : 'No recent conversations'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pending Invitations */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          <svg className="w-6 h-6" style={{ color: '#FC0105' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Pending Invitations
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                          <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                            No pending invitations at this time
                          </p>
                          <button
                            className="mt-4 px-6 py-3 rounded-lg bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                            onClick={handleInviteAthlete}
                          >
                            Invite New Athlete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {viewState === 'profile' && selectedAthlete && (
                <div className="h-[calc(90vh-12rem)]">
                  <iframe
                    src={`/dashboard/coach/athletes/${selectedAthlete.slug || selectedAthlete.uid}?embedded=true`}
                    className="w-full h-full border-0 rounded-lg"
                    title="Athlete Profile"
                  />
                </div>
              )}

              {viewState === 'videos' && (
                <div className="h-[calc(90vh-12rem)]">
                  <iframe
                    src="/dashboard/coach/queue?embedded=true"
                    className="w-full h-full border-0 rounded-lg"
                    title="Video Review Queue"
                  />
                </div>
              )}

              {viewState === 'invite' && (
                <div className="space-y-6">
                  {/* Sport Selection */}
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      Sport
                    </label>
                    <select
                      value={inviteForm.sport}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, sport: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      <option>Soccer</option>
                      <option>Basketball</option>
                      <option>Football</option>
                      <option>Baseball</option>
                      <option>Volleyball</option>
                      <option>Track & Field</option>
                      <option>Swimming</option>
                      <option>Tennis</option>
                      <option>Golf</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      Custom Message (Optional)
                    </label>
                    <textarea
                      value={inviteForm.customMessage}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, customMessage: e.target.value }))}
                      placeholder="Add a personal message to your invitation..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    />
                  </div>

                  {/* Athletes List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                        Athletes
                      </label>
                      <button
                        onClick={addAthleteRow}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                        style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Athlete
                      </button>
                    </div>

                    <div className="space-y-3">
                      {inviteForm.athletes.map((athlete, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Athlete Name"
                            value={athlete.name}
                            onChange={(e) => updateAthlete(index, 'name', e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          />
                          <input
                            type="email"
                            placeholder="athlete@email.com"
                            value={athlete.email}
                            onChange={(e) => updateAthlete(index, 'email', e.target.value)}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          />
                          {inviteForm.athletes.length > 1 && (
                            <button
                              onClick={() => removeAthleteRow(index)}
                              className="px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" style={{ color: '#FC0105' }} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSendInvites}
                      disabled={sendingInvites}
                      className="flex-1 px-6 py-4 rounded-lg bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {sendingInvites ? 'Sending...' : `Send ${inviteForm.athletes.filter(a => a.email && a.name).length} Invitation(s)`}
                    </button>
                    <button
                      onClick={handleBackToList}
                      className="px-6 py-4 rounded-lg border-2 border-gray-200 font-bold hover:bg-gray-50 transition-colors"
                      style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
