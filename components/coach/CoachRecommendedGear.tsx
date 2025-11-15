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
      <div className="mb-2 flex items-center gap-2">
        <h2
          className="text-xl font-bold"
          style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
        >
          Recommended Gear
        </h2>

        {/* Brand-red + with sliding "add gear" label */}
        <button
          onClick={() => setShowAdd(true)}
          aria-label="Add gear"
          className="group h-9 rounded-full flex items-center justify-center shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:pr-3"
          style={{ backgroundColor: '#FC0105', color: '#FFFFFF', width: '36px' }}
          onMouseEnter={(e) => { e.currentTarget.style.width = 'auto' }}
          onMouseLeave={(e) => { e.currentTarget.style.width = '36px' }}
        >
          <span className="text-xl leading-none px-2">+</span>
          <span className="whitespace-nowrap text-sm font-semibold opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[100px] transition-all duration-300 ease-in-out overflow-hidden" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            add gear
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }) : items).map((g: any, idx: number) => (
          <div key={g?.id || idx} className="w-full">
            <div className="w-full aspect-square rounded-lg mb-1 overflow-hidden">
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : g?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                  <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
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
            <div className="px-4 py-3 border-b" style={{ background: '#FC0105' }}>
              <h3 className="text-white font-bold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>Add Recommended Gear</h3>
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
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#000000' }}
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


