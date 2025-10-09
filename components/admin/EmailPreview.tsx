'use client'

interface EmailPreviewProps {
  type: 'coach' | 'athlete'
  data: {
    name: string
    email: string
    sport: string
    customMessage: string
    expiresInDays: number
    coachName?: string // For athlete invites
  }
  inviterName?: string
}

export default function EmailPreview({ type, data, inviterName = 'Admin' }: EmailPreviewProps) {
  const defaultMessage = type === 'coach'
    ? `Join PLAYBOOKD as a ${data.sport || '[Sport]'} coach and help athletes reach their full potential!`
    : `Welcome to PLAYBOOKD! You've been assigned to ${data.coachName || '[Coach Name]'} for ${data.sport || '[Sport]'} training.`

  const message = data.customMessage || defaultMessage

  if (type === 'coach') {
    return (
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
        {/* Preview Label */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-semibold" style={{ color: '#000000' }}>Email Preview</p>
          <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
            This is what {data.name || 'the coach'} will see
          </p>
        </div>

        {/* Email Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #20B2AA 0%, #91A6EB 100%)', padding: '30px', borderRadius: '10px 10px 0 0', textAlign: 'center' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>🏆 PLAYBOOKD Coach Invitation</h1>
          </div>

          {/* Body */}
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '0 0 10px 10px' }}>
            <h2 style={{ color: '#20B2AA', marginTop: 0 }}>Hello {data.name || '[Coach Name]'}!</h2>

            <p style={{ fontSize: '16px' }}>
              You've been invited to join PLAYBOOKD as a <strong>{data.sport || '[Sport]'}</strong> coach!
            </p>

            {message && (
              <div style={{ background: 'white', borderLeft: '4px solid #20B2AA', padding: '15px', margin: '20px 0', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>{message}</p>
              </div>
            )}

            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '2px solid #20B2AA' }}>
              <h3 style={{ color: '#20B2AA', marginTop: 0 }}>What You Can Do as a Coach</h3>
              <ul style={{ color: '#555', paddingLeft: '20px' }}>
                <li>Invite and manage your athletes</li>
                <li>Create custom playbooks and training content</li>
                <li>Track athlete progress and performance</li>
                <li>Communicate with your team through announcements</li>
                <li>Access comprehensive analytics and insights</li>
              </ul>
            </div>

            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <a href="#" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #20B2AA 0%, #91A6EB 100%)', color: 'white', padding: '15px 40px', textDecoration: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '16px' }}>
                Accept Invitation & Setup Account
              </a>
            </div>

            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                <strong>⏰ Important:</strong> This invitation link will expire in {data.expiresInDays} days. Please complete your account setup before then.
              </p>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginTop: '30px' }}>
              Invited by: <strong>{inviterName}</strong>
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '30px 0' }} />

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              If you didn't expect this invitation or have questions, please contact the PLAYBOOKD team.<br />
              This invitation is personal and should not be shared.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Athlete Preview
  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Preview Label */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <p className="text-sm font-semibold" style={{ color: '#000000' }}>Email Preview</p>
        <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
          This is what {data.name || 'the athlete'} will see
        </p>
      </div>

      {/* Email Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #20B2AA 100%)', padding: '30px', borderRadius: '10px 10px 0 0', textAlign: 'center' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>⚡ Welcome to PLAYBOOKD!</h1>
        </div>

        {/* Body */}
        <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '0 0 10px 10px' }}>
          <h2 style={{ color: '#91A6EB', marginTop: 0 }}>Hello {data.name || '[Athlete Name]'}!</h2>

          <p style={{ fontSize: '16px' }}>
            You've been invited to join PLAYBOOKD for <strong>{data.sport || '[Sport]'}</strong> training!
          </p>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '2px solid #91A6EB' }}>
            <h3 style={{ color: '#91A6EB', marginTop: 0 }}>Your Coach</h3>
            <p style={{ fontSize: '16px', margin: '10px 0' }}>
              <strong>{data.coachName || '[Coach Name]'}</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              {data.sport || '[Sport]'} Specialist
            </p>
          </div>

          {message && (
            <div style={{ background: 'white', borderLeft: '4px solid #91A6EB', padding: '15px', margin: '20px 0', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>{message}</p>
            </div>
          )}

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '2px solid #20B2AA' }}>
            <h3 style={{ color: '#20B2AA', marginTop: 0 }}>What's Waiting For You</h3>
            <ul style={{ color: '#555', paddingLeft: '20px' }}>
              <li>Personalized training programs from your coach</li>
              <li>Video demonstrations and technique breakdowns</li>
              <li>Track your progress and improvements</li>
              <li>Direct communication with your coach</li>
              <li>Access training resources anytime, anywhere</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href="#" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #91A6EB 0%, #20B2AA 100%)', color: 'white', padding: '15px 40px', textDecoration: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '16px' }}>
              Get Started Now
            </a>
          </div>

          <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
              <strong>📱 Mobile Friendly:</strong> Scan the QR code in your welcome email to access training on your phone!
            </p>
          </div>

          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
              <strong>⏰ Important:</strong> This invitation link will expire in {data.expiresInDays} days. Please create your account before then.
            </p>
          </div>

          <p style={{ fontSize: '14px', color: '#666', marginTop: '30px' }}>
              Invited by: <strong>{inviterName}</strong>
            </p>

          <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '30px 0' }} />

          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            Questions? Reach out to your coach or contact PLAYBOOKD support.<br />
            This invitation is personal to you and should not be shared.
          </p>
        </div>
      </div>
    </div>
  )
}
