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
  'Basketball', 'Soccer', 'Football', 'Baseball', 'Tennis', 'Swimming',
  'Track & Field', 'Wrestling', 'Volleyball', 'Golf', 'Hockey', 'Softball'
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coach Ingestion Links</h2>
        <p className="text-gray-600">Create and manage invitation links for coach onboarding</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick">Quick Test</TabsTrigger>
          <TabsTrigger value="create">Create Link</TabsTrigger>
          <TabsTrigger value="results">Generated Link</TabsTrigger>
          <TabsTrigger value="manage">Manage Links</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Test Invitations</CardTitle>
              <CardDescription>
                Send test invitations quickly for testing purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          organizationName: 'GamePlan Demo',
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
                          organizationName: 'GamePlan Platform',
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

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Test URLs Available:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div><strong>Regular Test:</strong> /coach-onboard/test-{Date.now()}</div>
                  <div><strong>Jasmine Special:</strong> /coach-onboard/jasmine-special-{Date.now()}</div>
                  <div className="mt-2 text-blue-600">
                    <strong>Note:</strong> These create mock invitation data for testing the onboarding flow.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Coach Invitation Link</CardTitle>
              <CardDescription>
                Generate a shareable link and QR code for coach onboarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generatedLink ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Invitation Link Generated!
                  </CardTitle>
                  <CardDescription>
                    Your coach invitation link and QR code are ready to share
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Email Sent Successfully!</span>
                      </div>
                      <p className="text-green-700 mt-1">
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
                          className="border rounded-lg"
                        />
                      )}
                      <Button variant="outline" onClick={downloadQRCode}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <LinkIcon className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No invitation link generated yet</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('create')}
                  className="mt-4"
                >
                  Create New Link
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Invitation Links</CardTitle>
              <CardDescription>
                View and manage all coach invitation links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading links...</span>
                </div>
              ) : ingestionLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No invitation links created yet</p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ingestionLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{link.organizationName}</h3>
                          <p className="text-sm text-gray-600">{link.sport} • {link.description}</p>
                        </div>
                        {getStatusBadge(link)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}