'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { Plus, Users, BarChart3, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Team } from '@/types/set-plays'

export default function SetPlaysPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchTeams()
    }
  }, [user])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await user?.getIdToken()
      if (!token) {
        throw new Error('No auth token available')
      }

      const response = await fetch('/api/set-plays/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setTeams(data.data.teams)
      } else {
        throw new Error(data.error || 'Failed to fetch teams')
      }
    } catch (err: any) {
      console.error('Error fetching teams:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Set Plays" subtitle="Manage teams, playbooks, and tactical training" />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Create Team Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl uppercase tracking-wide" style={{ color: '#000000' }}>
            My Teams
          </h2>
          <Link href="/dashboard/set-plays/teams/new">
            <button className="flex items-center gap-2 bg-[#20B2AA] hover:bg-[#1a9891] text-white px-4 py-2 rounded-lg transition-colors shadow-md">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Team</span>
            </button>
          </Link>
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
            <p className="font-medium">Error loading teams</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchTeams}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && teams.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 text-center">
            <div className="w-16 h-16 bg-[#20B2AA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#000000' }}>
              No Teams Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first team to start building playbooks and organizing set plays
            </p>
            <Link href="/dashboard/set-plays/teams/new">
              <button className="flex items-center gap-2 bg-[#20B2AA] hover:bg-[#1a9891] text-white px-6 py-3 rounded-lg transition-colors shadow-md mx-auto">
                <Plus className="w-5 h-5" />
                Create Your First Team
              </button>
            </Link>
          </div>
        )}

        {/* Teams Grid */}
        {!loading && !error && teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {teams.map((team) => (
              <Link key={team.id} href={`/dashboard/set-plays/teams/${team.id}`}>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105 cursor-pointer group">
                  <div className="flex flex-col h-full">
                    {/* Team Icon/Logo */}
                    <div className="w-16 h-16 rounded-lg mb-4 flex items-center justify-center shadow-md bg-gradient-to-br from-[#20B2AA] to-[#91A6EB]">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <Users className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-[#20B2AA] transition-colors" style={{ color: '#000000' }}>
                      {team.name}
                    </h3>

                    {/* Sport */}
                    <p className="text-sm mb-3" style={{ color: '#000000', opacity: 0.6 }}>
                      {team.sport}
                    </p>

                    {/* Description */}
                    {team.description && (
                      <p className="text-sm mb-4 line-clamp-2 flex-grow" style={{ color: '#000000', opacity: 0.5 }}>
                        {team.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                        <Users className="w-4 h-4" />
                        <span>{team.athleteIds?.length || 0} athletes</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                        <BarChart3 className="w-4 h-4" />
                        <span>0 plays</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
