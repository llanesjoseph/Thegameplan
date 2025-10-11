'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase.client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Users,
  Copy,
  Calendar,
  CheckCircle,
  Loader2,
  Crown,
  AlertCircle
} from 'lucide-react'

interface CreateAdminInviteForm {
  recipientEmail: string
  recipientName: string
  role: 'admin' | 'superadmin'
  customMessage: string
  expiresInDays: number
}

export default function AdminInvitationManager() {
  const [activeTab, setActiveTab] = useState('create')
  const [creating, setCreating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const [recipientInfo, setRecipientInfo] = useState<{email: string, name: string, role: string}>({
    email: '',
    name: '',
    role: ''
  })

  const [form, setForm] = useState<CreateAdminInviteForm>({
    recipientEmail: '',
    recipientName: '',
    role: 'admin',
    customMessage: '',
    expiresInDays: 7
  })

  const createAdminInvitation = async () => {
    // Get current Firebase user
    const currentUser = auth.currentUser

    if (!currentUser) {
      alert('You must be logged in to create admin invitations')
      return
    }

    if (!form.recipientEmail || !form.recipientName) {
      alert('Recipient email and name are required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.recipientEmail)) {
      alert('Please enter a valid email address')
      return
    }

    setCreating(true)
    try {
      // Get Firebase ID token from current user
      const token = await currentUser.getIdToken()

      const response = await fetch('/api/admin/create-admin-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || 'Failed to create admin invitation')
        return
      }

      setGeneratedLink(result.data.url)
      setEmailSent(result.data.emailSent || false)
      setRecipientInfo({
        email: form.recipientEmail,
        name: form.recipientName,
        role: form.role
      })

      if (result.data.emailSent) {
        alert(`✅ Admin invitation created and email sent successfully to ${form.recipientEmail}!`)
      } else {
        alert(`⚠️ Admin invitation created but email failed to send: ${result.data.emailError || 'Unknown error'}. You can still share the link manually.`)
      }

      // Reset form
      setForm({
        recipientEmail: '',
        recipientName: '',
        role: 'admin',
        customMessage: '',
        expiresInDays: 7
      })

      // Switch to results tab
      setActiveTab('results')
    } catch (error) {
      console.error('Failed to create admin invitation:', error)
      alert('Failed to create admin invitation')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl text-gray-900">Admin Invitations</h2>
        </div>
        <p className="text-gray-700">
          Invite trusted individuals to help manage and operate the AthLeap platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Invitation</TabsTrigger>
          <TabsTrigger value="results">Generated Link</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Create Admin Invitation
              </CardTitle>
              <CardDescription>
                Grant administrative access to run the platform. All invitations are auto-approved and invitation-only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Important: Admin Access
                    </p>
                    <p className="text-xs text-amber-800">
                      Admins have full access to manage users, content, safety systems, and platform settings.
                      Only invite individuals you trust completely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientEmail">Admin Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => setForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientName">Admin Name *</Label>
                  <Input
                    id="recipientName"
                    value={form.recipientName}
                    onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Access Level *</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'superadmin' }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="admin">Admin - Full platform management</option>
                  <option value="superadmin">Super Admin - Platform owner with all privileges</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {form.role === 'admin'
                    ? 'Can manage users, content, safety, and most platform settings'
                    : 'Full unrestricted access including system configuration and other admins'}
                </p>
              </div>

              <div>
                <Label htmlFor="expiresInDays">Link Expires In (Days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="30"
                  value={form.expiresInDays}
                  onChange={(e) => setForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 7 }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 7 days for security. Link becomes invalid after expiration.
                </p>
              </div>

              <div>
                <Label htmlFor="customMessage">Welcome Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  value={form.customMessage}
                  onChange={(e) => setForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Welcome to the PLAYBOOKD admin team! We're excited to have you help us build the future of youth sports coaching..."
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What Happens Next
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Invitation link is generated and emailed to the recipient</li>
                  <li>Recipient clicks link and completes account setup</li>
                  <li>Account is automatically approved with {form.role === 'admin' ? 'admin' : 'super admin'} privileges</li>
                  <li>New admin can immediately access the platform</li>
                </ol>
              </div>

              <Button
                onClick={createAdminInvitation}
                disabled={creating}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Admin Invitation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generatedLink ? (
            <div className="space-y-4">
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Admin Invitation Sent!
                  </CardTitle>
                  <CardDescription>
                    The invitation has been created and sent to the recipient
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {emailSent && recipientInfo.email && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Email Delivered Successfully</span>
                      </div>
                      <div className="text-green-700 space-y-1">
                        <p><strong>Recipient:</strong> {recipientInfo.name} ({recipientInfo.email})</p>
                        <p><strong>Role:</strong> {recipientInfo.role === 'admin' ? 'Admin' : 'Super Admin'}</p>
                        <p className="text-sm text-green-600 mt-2">
                          The recipient will receive an email with instructions to accept the invitation and set up their account.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Invitation Link (Backup)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input value={generatedLink} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(generatedLink)}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Save this link as a backup. You can share it manually if the email doesn't arrive.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Recipient will receive email with invitation link</li>
                      <li>They'll set up their account with {recipientInfo.role === 'admin' ? 'admin' : 'super admin'} access</li>
                      <li>Account is auto-approved upon completion</li>
                      <li>You'll see them in the Users management section</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      setActiveTab('create')
                      setGeneratedLink('')
                      setEmailSent(false)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another Invitation
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No invitation created yet</p>
                <p className="text-sm text-gray-400 mb-4">Create an admin invitation to get started</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('create')}
                >
                  Create Admin Invitation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
