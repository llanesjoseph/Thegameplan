/**
 * API endpoint for sending bulk invitations with custom Athleap Early Access template
 * Admin/SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST - Send bulk invitation with Athleap Early Access template
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { email, name, role, sport } = await request.json()

    // Validate required fields
    if (!email || !name || !role || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role, sport' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserQuery = await adminDb
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Generate unique invitation code
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const rolePrefix = role.toLowerCase()
    const invitationCode = `${rolePrefix}-${timestamp}-${randomSuffix}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14) // 14 days

    // Create invitation URL based on role
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playbook.crucibleanalytics.dev'
    const onboardPath = role === 'COACH' ? 'coach-onboard' : 'athlete-onboard'
    const invitationUrl = `${baseUrl}/${onboardPath}/${invitationCode}`

    // Create invitation document
    const invitationData = {
      id: invitationCode,
      type: `${rolePrefix}_invitation`,
      role: rolePrefix,
      email: email.toLowerCase(),
      name,
      sport,
      invitationUrl,
      status: 'pending',
      createdBy: decodedToken.uid,
      createdByName: userData.displayName || userData.email,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      usedAt: null,
      usedBy: null
    }

    await adminDb.collection('invitations').doc(invitationCode).set(invitationData)

    // Send email with Athleap Early Access template
    let emailSent = false
    let emailError = null

    try {
      const emailResult = await resend.emails.send({
        from: 'Athleap Team <noreply@mail.crucibleanalytics.dev>',
        to: email,
        subject: 'Athleap Early Access Invitation',
        html: generateAthleapEarlyAccessEmail(name, role, invitationUrl)
      })

      if (emailResult.data?.id) {
        emailSent = true
        console.log(`✅ Athleap invitation email sent to ${email} (${emailResult.data.id})`)
      }
    } catch (error: any) {
      console.error('Error sending invitation email:', error)
      emailError = error.message
    }

    // Update invitation with email status
    await adminDb.collection('invitations').doc(invitationCode).update({
      emailSent,
      emailError
    })

    console.log(`✅ Athleap invitation created for ${email} (${role}) by ${userData.email}`)

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitationCode,
        url: invitationUrl,
        emailSent,
        emailError
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate Athleap Early Access HTML email
 */
function generateAthleapEarlyAccessEmail(
  name: string,
  role: string,
  invitationUrl: string
): string {
  const greeting = name ? `Hi ${name}` : 'Hi there';
  const roleText = role === 'COACH' ? 'Coach' : 'Athlete';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Athleap Invite — Coordinated Montage</title>
<style>
  :root {
    --bg: #0e0f12; --fg:#fff; --muted:#c7c8cc; --card:#14151a; --stroke:#272833;
  }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; background:var(--bg); color:var(--fg); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
  a { color: inherit; text-decoration: none; }

  .hero { position:relative; min-height:76vh; display:grid; place-items:center; overflow:hidden; }
  .grid { position:absolute; inset:0; display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:8px; padding:8px; }
  .tile { position:relative; overflow:hidden; border-radius:14px; }
  .tile::after { content:''; position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,.0), rgba(0,0,0,.35) 60%, rgba(0,0,0,.6)); }
  .img { position:absolute; inset:-4%; width:108%; height:108%; object-fit:cover; filter: saturate(1.04) contrast(1.02); opacity:1; }
  .ken { animation: ken 14s ease-in-out infinite; transform: scale(1.08); }
  @keyframes ken {
    0% { transform: scale(1.08); }
    50% { transform: scale(1.14); }
    100% { transform: scale(1.08); }
  }
  .vignette { position:absolute; inset:0; pointer-events:none; box-shadow: inset 0 0 120px rgba(0,0,0,.55); border-radius:16px; }

  .overlay { position:absolute; inset:0; background: radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,.0), rgba(0,0,0,.55)); }
  .content { position:relative; z-index:2; text-align:center; padding:18px; }

  .headline {
    font-size: clamp(34px, 7vw, 74px);
    line-height: 1.02;
    margin: 6px 0 8px;
    letter-spacing: 0.5px;
    background: linear-gradient(180deg, #ffffff, #e4e4e6 60%, #cfcfd6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow:
      0 2px 18px rgba(0,0,0,.45),
      0 1px 0 rgba(0,0,0,.35);
    position: relative;
    display: inline-block;
    padding: 0 10px;
  }
  .headline::after {
    content:'';
    position:absolute;
    left: 8px; right: 8px; bottom: -8px;
    height: 4px;
    border-radius: 3px;
    background: linear-gradient(90deg, #ff3d3d, #ff7a7a);
    box-shadow: 0 0 18px rgba(255,61,61,.6);
  }
  p.sub { color:#e8e8ea; font-size: clamp(18px, 3vw, 24px); margin:10px 0 16px; font-weight: 500; letter-spacing: 0.3px; }
  .cta { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .btn { background:#fff; color:#111; padding:12px 18px; border-radius:12px; font-weight:800; }
  .btn.secondary { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.35); }

  .container { width:min(1100px,92vw); margin:0 auto; }
  .card { background:var(--card); border:1px solid var(--stroke); border-radius:16px; padding: clamp(16px, 3vw, 28px); margin: 28px auto; }
  .card h3 { margin-top:0; font-size: clamp(20px, 3.4vw, 28px); }
  .steps ol { padding-left:18px; }
  .muted { color:var(--muted); }

  footer { text-align:center; color:var(--muted); padding:34px 0 48px; font-size:14px; }
</style>
</head>
<body>
  <header class="hero">
    <div class="grid">
      <div class="tile">
        <img class="img ken" src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801110/2023_11_ha6dth.jpg" alt="">
        <div class="vignette"></div>
      </div>
      <div class="tile">
        <img class="img ken" src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801108/2022_09_santa_clara_rain_uavpsb.jpg" alt="">
        <div class="vignette"></div>
      </div>
      <div class="tile">
        <img class="img ken" src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801108/2022_08_2_h0rspg.jpg" alt="">
        <div class="vignette"></div>
      </div>
      <div class="tile">
        <img class="img ken" src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801118/2023_11_2_oqbego.jpg" alt="">
        <div class="vignette"></div>
      </div>
    </div>
    <div class="overlay"></div>
    <div class="content">
      <h1 class="headline">Athleap Early Access</h1>
      <p class="sub">Train smarter. Play harder. Grow together.</p>
      <div class="cta">
        <a class="btn" href="${invitationUrl}" target="_blank" rel="noopener">Accept Your Invitation</a>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="card">
      <h3>${greeting} –</h3>
      <p>We are excited to get you involved in the early testing of Athleap!</p>
      <p>
        We hope to get your perspective on the Athleap concept – an AI driven platform for fan engagement and the future of sports.
        Through the platform, elite athletes can engage in coaching, gear recommendations, and training the next generation.
      </p>
      <p style="color: var(--muted); font-size: 14px;">
        <strong>Your role:</strong> ${roleText}
      </p>

      <div class="steps">
        <h3>What we ask</h3>
        <ol>
          <li>Set up a profile.</li>
          <li>Complete a lesson.</li>
          <li>Submit a video.</li>
          <li>Schedule a meeting.</li>
          <li>Visit the site store.</li>
        </ol>
        <p class="muted">Use the bug icon at the bottom of any page to report issues. The research remains open for 2 weeks; we'll follow up for feedback. Thank you!</p>
        <p>Best,<br/>Athleap Team</p>
      </div>
    </section>
  </main>

  <footer>© Athleap</footer>
</body>
</html>`;
}
