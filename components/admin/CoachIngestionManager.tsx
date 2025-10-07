'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  QrCode,
  Link as LinkIcon,
  Copy,
  Calendar,
  Users,
  Eye,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface IngestionLink {
  id: string
  organizationName: string
  inviterName: string
  sport: string
  description: string
  expiresAt: string
  maxUses: number
  currentUses: number
  autoApprove: boolean
  status: 'active' | 'expired' | 'inactive'
  createdAt: string
  analytics: {
    views: number
    completions: number
    conversions: number
  }
}

interface CreateLinkForm {
  organizationName: string
  sport: string
  description: string
  expiresInDays: number
  maxUses: number
  autoApprove: boolean
  customMessage: string
  sendEmail: boolean
  recipientEmail: string
  recipientName: string
}

const sports = [
  'Soccer', 'Basketball', 'Baseball', 'Tennis', 'Brazilian Jiu-Jitsu',
  'Running', 'Volleyball', 'Swimming', 'American Football', 'Golf',
  'Boxing', 'Track & Field'
]

export default function CoachIngestionManager() {
  const [activeTab, setActiveTab] = useState('quick')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ingestionLinks, setIngestionLinks] = useState<IngestionLink[]>([])
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const [recipientInfo, setRecipientInfo] = useState<{email: string, name: string}>({email: '', name: ''})

  const [form, setForm] = useState<CreateLinkForm>({
    organizationName: '',
    sport: '',
    description: '',
    expiresInDays: 30,
    maxUses: 1,
    autoApprove: false,
    customMessage: '',
    sendEmail: false,
    recipientEmail: '',
    recipientName: ''
  })

  useEffect(() => {
    if (activeTab === 'manage') {
      loadIngestionLinks()
    }
  }, [activeTab])

  const loadIngestionLinks = async () => {
    setLoading(true)
    try {
      // Note: This would need an API endpoint to list ingestion links
      // For now, we'll mock some data
      const mockLinks: IngestionLink[] = []
      setIngestionLinks(mockLinks)
    } catch (error) {
      console.error('Failed to load ingestion links:', error)
    } finally {
      setLoading(false)
    }
  }

  const createIngestionLink = async () => {
    if (!form.organizationName || !form.sport) {
      alert('Organization name and sport are required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/coach-ingestion/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || 'Failed to create ingestion link')
        return
      }

      setGeneratedLink(result.data.url)
      setQrCodeUrl(result.data.qrCodeUrl)
      setEmailSent(result.data.emailSent || false)
      setRecipientInfo({
        email: form.recipientEmail,
        name: form.recipientName
      })

      // Show email status if email was sent
      if (form.sendEmail) {
        if (result.data.emailSent) {
          alert(`✅ Invitation link created and email sent successfully to ${form.recipientEmail}!`)
        } else {
          alert(`⚠️ Invitation link created but email failed to send: ${result.data.emailError || 'Unknown error'}`)
        }
      }

      // Reset form
      setForm({
        organizationName: '',
        sport: '',
        description: '',
        expiresInDays: 30,
        maxUses: 1,
        autoApprove: false,
        customMessage: '',
        sendEmail: false,
        recipientEmail: '',
        recipientName: ''
      })

      // Switch to results tab
      setActiveTab('results')
    } catch (error) {
      console.error('Failed to create ingestion link:', error)
      alert('Failed to create ingestion link')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = 'coach-invite-qr-code.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (link: IngestionLink) => {
    if (link.status === 'expired' || new Date() > new Date(link.expiresAt)) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (link.currentUses >= link.maxUses) {
      return <Badge variant="secondary">Used Up</Badge>
    }
    if (link.status === 'active') {
      return <Badge variant="default">Active</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>Coach Ingestion Links</h2>
        <p style={{ color: '#000000', opacity: 0.7 }}>Create and manage invitation links for coach onboarding</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-300/50 mb-6">
          <nav className="flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('quick')}
              className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === 'quick'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              Quick Test
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === 'create'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              Create Link
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === 'results'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              Generated Link
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === 'manage'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              Manage Links
            </button>
          </nav>
        </div>

        <TabsContent value="quick" className="space-y-6">
          <div>
            <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>Quick Test Invitations</h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              Send test invitations quickly for testing purposes
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/send-test-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: 'test@example.com',
                          name: 'Test Coach',
                          type: 'regular',
                          organizationName: 'PLAYBOOKD Demo',
                          sport: 'Soccer'
                        })
                      })
                      const result = await response.json()
                      if (result.success) {
                        alert(`Test invitation created! URL: ${result.data.invitationUrl}`)
                      } else {
                        alert('Error: ' + result.error)
                      }
                    } catch (error) {
                      console.error('Test invitation error:', error)
                      alert('Failed to create test invitation')
                    }
                  }}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Users className="w-6 h-6 mb-2" />
                  Create Regular Test Invitation
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/send-test-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: 'jasmine@example.com',
                          name: 'Jasmine Aikey',
                          type: 'jasmine',
                          organizationName: 'PLAYBOOKD Platform',
                          sport: 'Soccer'
                        })
                      })
                      const result = await response.json()
                      if (result.success) {
                        alert(`Jasmine test invitation created! URL: ${result.data.invitationUrl}`)
                      } else {
                        alert('Error: ' + result.error)
                      }
                    } catch (error) {
                      console.error('Jasmine test invitation error:', error)
                      alert('Failed to create Jasmine test invitation')
                    }
                  }}
                  variant="secondary"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <CheckCircle className="w-6 h-6 mb-2" />
                  Create Jasmine Special Invitation
                </Button>
              </div>

              <div className="bg-white/60 p-4 rounded-xl border border-gray-300/50">
                <h4 className="font-semibold mb-2" style={{ color: '#000000' }}>Test URLs Available:</h4>
                <div className="space-y-2 text-sm" style={{ color: '#000000', opacity: 0.8 }}>
                  <div><strong>Regular Test:</strong> /coach-onboard/test-{Date.now()}</div>
                  <div><strong>Jasmine Special:</strong> /coach-onboard/jasmine-special-{Date.now()}</div>
                  <div className="mt-2" style={{ opacity: 0.7 }}>
                    <strong>Note:</strong> These create mock invitation data for testing the onboarding flow.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div>
            <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>Create Coach Invitation Link</h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              Generate a shareable link and QR code for coach onboarding
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={form.organizationName}
                    onChange={(e) => setForm(prev => ({ ...prev, organizationName: e.target.value }))}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="sport">Sport *</Label>
                  <select
                    id="sport"
                    value={form.sport}
                    onChange={(e) => setForm(prev => ({ ...prev, sport: e.target.value }))}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select sport</option>
                    {sports.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the opportunity"
                />
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Message</Label>
                <Textarea
                  id="customMessage"
                  value={form.customMessage}
                  onChange={(e) => setForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Add a personal message for invited coaches"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    min="1"
                    max="365"
                    value={form.expiresInDays}
                    onChange={(e) => setForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    max="100"
                    value={form.maxUses}
                    onChange={(e) => setForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.autoApprove}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, autoApprove: checked }))}
                />
                <Label>Auto-approve applications</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.sendEmail}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, sendEmail: checked }))}
                />
                <Label>Send invitation email</Label>
              </div>

              {form.sendEmail && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/60 rounded-xl border border-gray-300/50">
                  <div>
                    <Label htmlFor="recipientEmail">Recipient Email *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={form.recipientEmail}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="coach@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={form.recipientName}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={createIngestionLink}
                disabled={creating || (form.sendEmail && !form.recipientEmail)}
                className="w-full"
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.sendEmail ? 'Generate Link & Send Email' : 'Generate Invitation Link'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generatedLink ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6" style={{ color: '#20B2AA' }} />
                  <h3 className="text-xl font-heading" style={{ color: '#000000' }}>Invitation Link Generated!</h3>
                </div>
                <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                  Your coach invitation link and QR code are ready to share
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Invitation Link</Label>
                    <div className="flex gap-2">
                      <Input value={generatedLink} readOnly className="font-mono text-sm" />
                      <Button variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {emailSent && recipientInfo.email && (
                    <div className="mb-4 p-4 bg-white/60 border border-gray-300/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2" style={{ color: '#20B2AA' }}>
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Email Sent Successfully!</span>
                      </div>
                      <p className="mt-1" style={{ color: '#000000', opacity: 0.8 }}>
                        Invitation email delivered to <strong>{recipientInfo.email}</strong>
                        {recipientInfo.name && ` (${recipientInfo.name})`}
                      </p>
                    </div>
                  )}

                  <div className="text-center">
                    <Label>QR Code</Label>
                    <div className="mt-2 flex flex-col items-center space-y-2">
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt="Coach Invitation QR Code"
                          className="border border-gray-300/50 rounded-xl"
                        />
                      )}
                      <Button variant="outline" onClick={downloadQRCode}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <LinkIcon className="h-12 w-12 mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <p className="mb-4" style={{ color: '#000000', opacity: 0.6 }}>No invitation link generated yet</p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('create')}
              >
                Create New Link
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div>
            <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>Manage Invitation Links</h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              View and manage all coach invitation links
            </p>
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2" style={{ color: '#000000', opacity: 0.7 }}>Loading links...</span>
                </div>
              ) : ingestionLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                  <p className="mb-4" style={{ color: '#000000', opacity: 0.6 }}>No invitation links created yet</p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ingestionLinks.map((link) => (
                    <div key={link.id} className="border border-gray-300/50 rounded-xl p-4 bg-white/50 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold" style={{ color: '#000000' }}>{link.organizationName}</h3>
                          <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{link.sport} • {link.description}</p>
                        </div>
                        {getStatusBadge(link)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3" style={{ color: '#000000', opacity: 0.7 }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires: {formatDate(link.expiresAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Uses: {link.currentUses}/{link.maxUses}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Views: {link.analytics.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Conversions: {link.analytics.conversions}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`${window.location.origin}/coach-onboard/${link.id}`)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/coach-ingestion/qr/${link.id}`, '_blank')}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          View QR
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}