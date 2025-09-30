'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
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

export default function CoachAthletesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [invitations, setInvitations] = useState<AthleteInvitation[]>([])
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bulkForm, setBulkForm] = useState<BulkInviteForm>({
    sport: 'Soccer',
    customMessage: '',
    athletes: [{ email: '', name: '' }]
  })

  // Sample data for demonstration
  useEffect(() => {
    setInvitations([
      {
        id: '1',
        email: 'athlete1@example.com',
        name: 'John Smith',
        sport: 'Soccer',
        status: 'accepted',
        sentAt: '2025-09-25',
        customMessage: 'Welcome to our team!'
      },
      {
        id: '2',
        email: 'athlete2@example.com',
        name: 'Sarah Johnson',
        sport: 'Soccer',
        status: 'pending',
        sentAt: '2025-09-27',
        expiresAt: '2025-10-04'
      }
    ])
  }, [])

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

      // Send invitations
      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: {
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
        alert(`Successfully sent ${result.successCount} invitations!`)
        setShowBulkInvite(false)
        setBulkForm({
          sport: 'Soccer',
          customMessage: '',
          athletes: [{ email: '', name: '' }]
        })
        // Refresh invitations list
        // fetchInvitations()
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
          <span className="px-4 py-2 bg-green/20 text-green rounded-full text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        )
      case 'pending':
        return (
          <span className="px-4 py-2 bg-orange/20 text-orange rounded-full text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        )
      case 'expired':
        return (
          <span className="px-4 py-2 bg-cardinal/20 text-cardinal rounded-full text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expired
          </span>
        )
      default:
        return (
          <span className="px-4 py-2 bg-dark/20 text-dark rounded-full text-sm font-medium">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl text-dark font-heading mb-2">Athlete Management</h1>
          <p className="text-dark/60">Invite and manage your athletes</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowBulkInvite(!showBulkInvite)}
            className="px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {showBulkInvite ? 'Cancel Invite' : 'Invite Athletes'}
          </button>

          <button
            onClick={importFromCSV}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm text-dark border border-sky-blue/20 rounded-xl hover:bg-white transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>

          <button className="px-6 py-3 bg-white/80 backdrop-blur-sm text-dark border border-sky-blue/20 rounded-xl hover:bg-white transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export List
          </button>
        </div>

        {/* Bulk Invite Form */}
        {showBulkInvite && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 mb-8 overflow-hidden">
            <div className="p-6 border-b border-dark/10">
              <h2 className="text-2xl text-dark font-heading mb-2">Invite Multiple Athletes</h2>
              <p className="text-dark/60">
                Send personalized invitations to multiple athletes at once
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Sport and Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark/70 mb-2">Sport</label>
                  <select
                    value={bulkForm.sport}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
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
                  <label className="block text-sm font-medium text-dark/70 mb-2">Custom Message (Optional)</label>
                  <textarea
                    value={bulkForm.customMessage}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Athletes List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-dark/70">Athletes</label>
                  <button
                    type="button"
                    onClick={addAthleteRow}
                    className="px-4 py-2 bg-sky-blue/20 text-sky-blue rounded-lg hover:bg-sky-blue/30 transition-colors flex items-center gap-2"
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
                          className="w-full px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Athlete Name"
                          value={athlete.name}
                          onChange={(e) => updateAthlete(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                        />
                      </div>
                      {bulkForm.athletes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAthleteRow(index)}
                          className="p-3 text-orange hover:bg-orange/10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleBulkInvite}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green to-green/90 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Invitations ({bulkForm.athletes.filter(a => a.email.trim()).length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invitations List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-dark/10">
            <h2 className="text-2xl text-dark font-heading flex items-center gap-3 mb-2">
              <Users className="w-6 h-6" />
              Athlete Invitations
            </h2>
            <p className="text-dark/60">
              Track the status of your athlete invitations
            </p>
          </div>
          <div className="p-6">
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-dark/30 mb-4" />
                <h3 className="text-xl text-dark mb-2">No invitations yet</h3>
                <p className="text-dark/60 mb-6">Start by inviting your first athletes</p>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
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
                    className="flex items-center justify-between p-5 border-2 border-sky-blue/20 rounded-xl hover:bg-sky-blue/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-blue to-black rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-dark text-lg">{invitation.name}</h4>
                        <p className="text-sm text-dark/60">{invitation.email}</p>
                        <p className="text-xs text-dark/50">
                          {invitation.sport} • Sent {invitation.sentAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(invitation.status)}

                      <div className="flex gap-2">
                        <button className="p-2 text-sky-blue hover:bg-sky-blue/10 rounded-lg transition-colors">
                          <Mail className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-orange hover:bg-orange/10 rounded-lg transition-colors">
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
      </div>
    </div>
  )
}