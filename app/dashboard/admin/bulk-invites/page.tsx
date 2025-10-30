'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Send } from 'lucide-react';

interface InviteRow {
  id: string;
  name: string;
  email: string;
  role: 'COACH' | 'ATHLETE';
}

export default function BulkInvitesPage() {
  const [rows, setRows] = useState<InviteRow[]>([
    { id: '1', name: '', email: '', role: 'COACH' }
  ]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'COACH'
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
    const validRows = rows.filter(row => row.name && row.email);

    if (validRows.length === 0) {
      alert('Please add at least one invite with name and email');
      return;
    }

    if (!confirm(`Send ${validRows.length} invite(s)?`)) {
      return;
    }

    setSending(true);

    try {
      const results = await Promise.allSettled(
        validRows.map(async (row) => {
          const endpoint = row.role === 'COACH'
            ? '/api/admin/create-coach-invitation'
            : '/api/admin/create-athlete-invitation';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: row.email,
              name: row.name,
              // Add any additional fields needed
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to send invite to ${row.email}`);
          }

          return response.json();
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      alert(`Sent ${successful} invite(s) successfully${failed > 0 ? `, ${failed} failed` : ''}`);

      // Clear successful rows
      if (successful > 0) {
        setRows([{ id: Date.now().toString(), name: '', email: '', role: 'COACH' }]);
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      alert('Error sending invites. Check console for details.');
    } finally {
      setSending(false);
    }
  };

  const previewRow = rows[selectedPreviewIndex] || rows[0];

  // Generate the personalized HTML preview
  const getPreviewHTML = () => {
    const greeting = previewRow.name ? `Hi ${previewRow.name}` : 'Hi there';
    const roleText = previewRow.role === 'COACH' ? 'Coach' : 'Athlete';

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
  .img { position:absolute; inset:-4%; width:108%; height:108%; object-fit:cover; filter: saturate(1.04) contrast(1.02); opacity:0; transition: opacity 900ms ease; }
  .img.active { opacity:1; }
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
  p.sub { color:var(--muted); font-size: clamp(14px, 2.4vw, 18px); margin:10px 0 16px; }
  .cta { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .btn { background:#fff; color:#111; padding:12px 18px; border-radius:12px; font-weight:800; }
  .btn.secondary { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.35); }

  .container { width:min(1100px,92vw); margin:0 auto; }
  .card { background:var(--card); border:1px solid var(--stroke); border-radius:16px; padding: clamp(16px, 3vw, 28px); margin: 28px auto; }
  .card h3 { margin-top:0; font-size: clamp(20px, 3.4vw, 28px); }
  .steps ol { padding-left:18px; }
  .muted { color:var(--muted); }

  .inline { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
  .inline input { flex:1; min-width:260px; padding:12px 14px; border-radius:12px; border:1px solid #2b2c35; background:#1a1b22; color:#fff; }
  .inline button { padding:12px 16px; border-radius:12px; border:1px solid #30313a; background:#fff; color:#111; font-weight:800; cursor:pointer; }

  footer { text-align:center; color:var(--muted); padding:34px 0 48px; font-size:14px; }
</style>
</head>
<body>
  <header class="hero">
    <div class="grid" id="grid"></div>
    <div class="overlay"></div>
    <div class="content">
      <h1 class="headline">Athleap Early Access</h1>
      <p class="sub">Train smarter. Play harder. Grow together.</p>
      <div class="cta">
        <a id="cta" class="btn" href="#" target="_blank" rel="noopener">Accept Your Invitation</a>
        <a class="btn secondary" href="#details">See details</a>
      </div>
    </div>
  </header>

  <main class="container" id="details">
    <section class="card">
      <h3>${greeting} –</h3>
      <p>We are excited to get you involved in the early testing of Athleap!</p>
      <p>
        We hope to get your perspective on the Athleap concept – an AI driven platform for fan engagement and the future of sports.
        Through the platform, elite athletes can engage in coaching, gear recommendations, and training the next generation.
      </p>
      <p style="color: var(--muted); font-size: 14px;">
        <strong>Your role:</strong> ${roleText}
        ${previewRow.email ? `<br/><strong>Email:</strong> ${previewRow.email}` : ''}
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

<script>
  const sources = ['https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801110/2023_11_ha6dth.jpg', 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801108/2022_09_santa_clara_rain_uavpsb.jpg', 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801108/2022_08_2_h0rspg.jpg', 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761801118/2023_11_2_oqbego.jpg'];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const grid = document.getElementById('grid');
  const tiles = [];
  for (let i = 0; i < 4; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    const a = document.createElement('img');
    a.className = 'img ken active';
    a.src = sources[i % sources.length];
    const b = document.createElement('img');
    b.className = 'img ken';
    b.src = sources[(i+1) % sources.length];
    const vig = document.createElement('div');
    vig.className = 'vignette';
    tile.appendChild(a); tile.appendChild(b); tile.appendChild(vig);
    grid.appendChild(tile);
    tiles.push({root: tile, a, b, usingA: true});
  }

  let offset = 0;
  setInterval(() => {
    const base = sources.slice(offset).concat(sources.slice(0, offset));
    const nextSet = shuffle(base);
    offset = (offset + 1) % sources.length;

    tiles.forEach((t, idx) => {
      const nextSrc = nextSet[idx % nextSet.length];
      if (t.usingA) {
        t.b.src = nextSrc;
        t.b.classList.add('active');
        t.a.classList.remove('active');
      } else {
        t.a.src = nextSrc;
        t.a.classList.add('active');
        t.b.classList.remove('active');
      }
      t.usingA = !t.usingA;
    });
  }, 4800);
</script>
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
