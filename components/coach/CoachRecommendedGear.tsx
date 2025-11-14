'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

type GearItem = { id: string; name: string; price?: string; description?: string; imageUrl?: string; link?: string }

export default function CoachRecommendedGear() {
  const { user } = useAuth()
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const res = await fetch(`/api/gear/coach?uid=${user.uid}`, { cache: 'no-store' })
        const data = await res.json()
        if (data?.success) setItems(data.gearItems || [])
      } catch (e) {
        console.warn('Failed to load coach gear', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const addItem = async () => {
    if (!url.trim() || !user) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/gear/add-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (data?.success) {
        setItems(prev => [{ id: data.id, ...data.data }, ...prev])
        setShowAdd(false)
        setUrl('')
      }
    } catch (e) {
      console.error('Failed to add gear', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2
          className="text-xl font-bold"
          style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
        >
          Recommended Gear
        </h2>
        <div className="relative group">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
            aria-label="Add gear from URL"
            title="Add gear from URL — paste a product link and we’ll fetch details"
          >
            <span className="text-lg leading-none">＋</span>
            <span className="hidden sm:inline">Add Gear from URL</span>
          </button>
          <span className="absolute -top-8 right-0 hidden sm:block whitespace-nowrap text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            Paste a product link — details auto-filled
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }) : items).map((g: any, idx: number) => (
          <div key={g?.id || idx} className="w-full">
            <div className="w-full aspect-square bg-gray-100 rounded-lg mb-1 overflow-hidden">
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : g?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-60" />
                </div>
              )}
            </div>
            <p className="font-bold mb-0.5 text-xs" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              {loading ? 'Product' : g?.name}
            </p>
            {!loading && g?.price && (
              <p className="text-xs mb-0.5" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                {g.price}
              </p>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false)
          }}
        >
          <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[92vw] sm:w-[560px] max-w-[600px] rounded-2xl shadow-2xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: '#FC0105' }}>
              <h3 className="text-white font-bold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>Add Recommended Gear</h3>
              <button onClick={() => setShowAdd(false)} className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste product URL (e.g., https://example.com/item)"
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end">
                <button
                  onClick={addItem}
                  disabled={saving || !url.trim()}
                  className="px-4 py-2 rounded-lg text-white bg-black hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


