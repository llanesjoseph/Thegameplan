'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';

interface InviteRow {
  id: string;
  name: string;
  email: string;
  role: 'COACH' | 'ATHLETE';
  sport: string;
}

export default function BulkInvitesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InviteRow[]>([
    { id: '1', name: '', email: '', role: 'COACH', sport: '' }
  ]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'COACH',
      sport: ''
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
      if (selectedPreviewIndex >= rows.length - 1) {
        setSelectedPreviewIndex(Math.max(0, rows.length - 2));
      }
    }
  };

  const updateRow = (id: string, field: keyof InviteRow, value: string) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSendInvites = async () => {
    const validRows = rows.filter(row => row.name && row.email && row.sport);

    if (validRows.length === 0) {
      alert('Please add at least one invite with name, email, and sport');
      return;
    }

    if (!user) {
      alert('You must be signed in to send invitations');
      return;
    }

    if (!confirm(`Send ${validRows.length} invite(s)?`)) {
      return;
    }

    setSending(true);

    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();

      const results = await Promise.allSettled(
        validRows.map(async (row) => {
          const response = await fetch('/api/admin/send-bulk-invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              email: row.email,
              name: row.name,
              sport: row.sport,
              role: row.role
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to send invite to ${row.email}`);
          }

          return response.json();
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      alert(`Sent ${successful} invite(s) successfully${failed > 0 ? `, ${failed} failed` : ''}`);

      // Clear successful rows
      if (successful > 0) {
        setRows([{ id: Date.now().toString(), name: '', email: '', role: 'COACH', sport: '' }]);
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      alert('Error sending invites. Check console for details.');
    } finally {
      setSending(false);
    }
  };

  const previewRow = rows[selectedPreviewIndex] || rows[0];

  // Generate the personalized HTML preview - Updated 2025 Brand Design
  const getPreviewHTML = () => {
    const greeting = previewRow.name ? `Hi ${previewRow.name.split(' ')[0]}` : 'Hi there';
    const isCoach = previewRow.role === 'COACH';
    const ctaText = isCoach ? 'Join Our Community' : 'Accept Invite';
    const messageContent = isCoach
      ? `We are the founding team at Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes. Our mission is simple: to help unlock athletic potential.</p>
        <p style="margin: 0 0 24px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">We are inviting a select group of elite athletes to join our early access community as coaches, shaping the tools that redefine how athletes train and compete.`
      : `<strong>The Athleap Team</strong> has invited you to join their team on Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes.`;
    const closingMessage = isCoach
      ? `You've earned your place at the top – this is your chance to help define what comes next.`
      : `Join now and be a part of a company changing the future of sports. Once you are in, you can begin to train and follow other elite coaches.`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>You're Invited to ATHLEAP</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Open Sans', sans-serif; background-color: #f5f5f5; margin: 0; padding: 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
    <!-- Logo Banner -->
    <div style="width: 100%; height: 160px; background-color: #440102; display: flex; align-items: center; justify-content: center;">
      <img src="https://athleap.crucibleanalytics.dev/brand/athleap-logo-colored.png" alt="ATHLEAP" style="height: 100px; width: auto;" />
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px 0; color: #000000; font-size: 18px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
        ${greeting} –
      </p>
      <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
        ${messageContent}
      </p>

      <!-- CTA Button -->
      <div style="margin: 28px 0; text-align: center;">
        <a href="#" style="background-color: #FC0105; color: #FFFFFF; font-weight: 700; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; display: inline-block; font-family: 'Open Sans', sans-serif;">
          ${ctaText}
        </a>
      </div>

      <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
        ${closingMessage}
      </p>

      <p style="margin: 16px 0 0 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
        We can't wait to have you on board!
      </p>

      <p style="margin: 16px 0 0 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
        See you inside,<br/>
        The Athleap Team
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px 0; color: #666; font-size: 14px;">
    © Athleap
  </div>
</body>
</html>`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Invite Manager</h1>
        <Button
          onClick={handleSendInvites}
          disabled={sending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending...' : 'Send All Invites'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Invite List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Invites to Send</h2>
            <Button onClick={addRow} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={`border rounded-lg p-4 space-y-3 cursor-pointer transition-colors ${
                  selectedPreviewIndex === index
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedPreviewIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </span>
                  {rows.length > 1 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(row.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Name"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Input
                    placeholder="Sport (e.g., Basketball, Soccer)"
                    value={row.sport}
                    onChange={(e) => updateRow(row.id, 'sport', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <select
                    value={row.role}
                    onChange={(e) => updateRow(row.id, 'role', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="COACH">COACH</option>
                    <option value="ATHLETE">ATHLETE</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Live Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div className="text-sm text-gray-600 mb-4">
            Previewing invite for: <strong>{previewRow.name || '(No name)'}</strong> • {previewRow.role}
          </div>

          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '700px' }}>
            <iframe
              srcDoc={getPreviewHTML()}
              className="w-full h-full border-0"
              title="Email Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
