'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { Plus, Video, Image, FileText, Loader2, ArrowLeft, Eye, Users, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import type { Team, Play } from '@/types/set-plays'

export default function TeamPlaysPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const teamId = params.teamId as string

  const [team, setTeam] = useState<Team | null>(null)
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && teamId) {
      fetchTeamAndPlays()
    }
  }, [user, teamId])

  const fetchTeamAndPlays = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await user?.getIdToken()
      if (!token) {
        throw new Error('No auth token available')
      }

      // Fetch team details
      const teamResponse = await fetch(`/api/set-plays/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const teamData = await teamResponse.json()

      if (!teamData.success) {
        throw new Error(teamData.error || 'Failed to fetch team')
      }

      setTeam(teamData.data)

      // Fetch plays for this team
      const playsResponse = await fetch(`/api/set-plays/teams/${teamId}/plays`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const playsData = await playsResponse.json()

      if (playsData.success) {
        setPlays(playsData.data.plays)
      } else {
        throw new Error(playsData.error || 'Failed to fetch plays')
      }
    } catch (err: any) {
      console.error('Error fetching team and plays:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMediaIcon = (play: Play) => {
    if (!play.media || play.media.length === 0) return <FileText className="w-6 h-6" />

    const firstMedia = play.media[0]
    if (firstMedia.type === 'video') return <Video className="w-6 h-6" />
    if (firstMedia.type === 'image' || firstMedia.type === 'diagram') return <Image className="w-6 h-6" />
    return <FileText className="w-6 h-6" />
  }

  const getVisibilityIcon = (visibility: string) => {
    if (visibility === 'coach') return <Lock className="w-4 h-4" />
    if (visibility === 'assistant') return <Unlock className="w-4 h-4" />
    return <Users className="w-4 h-4" />
  }

  const getVisibilityLabel = (visibility: string) => {
    if (visibility === 'coach') return 'Coach Only'
    if (visibility === 'assistant') return 'Coaches & Assistants'
    return 'Whole Team'
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader
        title={team?.name || 'Loading...'}
        subtitle={team ? `${team.sport} • Play Library` : 'Loading team details...'}
      />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Back Button and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/dashboard/set-plays">
            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Teams</span>
            </button>
          </Link>

          <div className="flex gap-3">
            <Link href={`/dashboard/set-plays/teams/${teamId}/upload`}>
              <button className="flex items-center gap-2 bg-[#20B2AA] hover:bg-[#1a9891] text-white px-4 py-2 rounded-lg transition-colors shadow-md">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Upload Play</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#20B2AA' }} />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading plays</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchTeamAndPlays}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && plays.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 text-center">
            <div className="w-16 h-16 bg-[#20B2AA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#000000' }}>
              No Plays Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first play to start building your playbook
            </p>
            <Link href={`/dashboard/set-plays/teams/${teamId}/upload`}>
              <button className="flex items-center gap-2 bg-[#20B2AA] hover:bg-[#1a9891] text-white px-6 py-3 rounded-lg transition-colors shadow-md mx-auto">
                <Plus className="w-5 h-5" />
                Upload Your First Play
              </button>
            </Link>
          </div>
        )}

        {/* Plays Grid */}
        {!loading && !error && plays.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl uppercase tracking-wide" style={{ color: '#000000' }}>
                Plays ({plays.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {plays.map((play) => (
                <Link key={play.id} href={`/dashboard/set-plays/plays/${play.id}`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden h-full transition-all hover:shadow-2xl hover:scale-105 cursor-pointer group">
                    {/* Media Preview */}
                    {play.media && play.media.length > 0 && play.media[0].thumbnailUrl ? (
                      <div className="w-full h-48 overflow-hidden bg-gray-200">
                        <img
                          src={play.media[0].thumbnailUrl}
                          alt={play.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-[#20B2AA] to-[#91A6EB] flex items-center justify-center">
                        {getMediaIcon(play)}
                      </div>
                    )}

                    {/* Play Info */}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-[#20B2AA] transition-colors" style={{ color: '#000000' }}>
                        {play.title}
                      </h3>

                      {/* Description */}
                      {play.description && (
                        <p className="text-sm line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                          {play.description}
                        </p>
                      )}

                      {/* Tags */}
                      {play.tags && play.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {play.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded-full bg-[#20B2AA]/10 text-[#20B2AA] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {play.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              +{play.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                          <Eye className="w-4 h-4" />
                          <span>{play.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#000000', opacity: 0.5 }}>
                          {getVisibilityIcon(play.visibility)}
                          <span>{getVisibilityLabel(play.visibility)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
