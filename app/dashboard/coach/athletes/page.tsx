'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AppHeader from '@/components/ui/AppHeader'
import {
  Users,
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
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Athlete Management</h1>
          <p className="text-gray-600">Invite and manage your athletes</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setShowBulkInvite(!showBulkInvite)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {showBulkInvite ? 'Cancel Invite' : 'Invite Athletes'}
          </Button>

          <Button
            variant="outline"
            onClick={importFromCSV}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
        </div>

        {/* Bulk Invite Form */}
        {showBulkInvite && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Invite Multiple Athletes</CardTitle>
              <CardDescription>
                Send personalized invitations to multiple athletes at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sport and Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={bulkForm.sport}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Soccer">Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Football">Football</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Track & Field">Track & Field</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                  <Textarea
                    value={bulkForm.customMessage}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Athletes List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium">Athletes</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAthleteRow}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Row
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bulkForm.athletes.map((athlete, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder="athlete@example.com"
                          value={athlete.email}
                          onChange={(e) => updateAthlete(index, 'email', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Athlete Name"
                          value={athlete.name}
                          onChange={(e) => updateAthlete(index, 'name', e.target.value)}
                        />
                      </div>
                      {bulkForm.athletes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAthleteRow(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleBulkInvite}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitations ({bulkForm.athletes.filter(a => a.email.trim()).length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Athlete Invitations
            </CardTitle>
            <CardDescription>
              Track the status of your athlete invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations yet</h3>
                <p className="text-gray-500 mb-4">Start by inviting your first athletes</p>
                <Button onClick={() => setShowBulkInvite(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Athletes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{invitation.name}</h4>
                        <p className="text-sm text-gray-500">{invitation.email}</p>
                        <p className="text-xs text-gray-400">
                          {invitation.sport} • Sent {invitation.sentAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(invitation.status)}

                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}