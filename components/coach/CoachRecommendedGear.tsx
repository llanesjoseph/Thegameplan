'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'

type GearItem = { id: string; name: string; price?: string; description?: string; imageUrl?: string; link?: string }

export default function CoachRecommendedGear() {
  const { user } = useAuth()
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [gearPage, setGearPage] = useState(0)
  const gearPageSize = 4

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

  const deleteItem = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this gear item?')) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/gear/delete?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.success) {
        setItems(prev => prev.filter(item => item.id !== id))
        setFlippedCard(null)
      } else {
        alert('Failed to delete gear item')
      }
    } catch (e) {
      console.error('Failed to delete gear', e)
      alert('Failed to delete gear item')
    }
  }

  const updateItem = async (id: string) => {
    if (!editUrl.trim() || !user) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/gear/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, url: editUrl })
      })
      const data = await res.json()
      if (data?.success) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...data.data } : item))
        setEditingCard(null)
        setFlippedCard(null)
        setEditUrl('')
      } else {
        alert('Failed to update gear item')
      }
    } catch (e) {
      console.error('Failed to update gear', e)
      alert('Failed to update gear item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h2
          className="text-xl font-bold"
          style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
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

      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(loading ? Array.from({ length: 4 }) : items.slice(gearPage * gearPageSize, (gearPage + 1) * gearPageSize)).map((g: any, idx: number) => (
            <div key={g?.id || idx} className="w-full perspective-1000">
              <div
                className={`relative w-full transition-transform duration-500 transform-style-3d ${flippedCard === g?.id ? 'rotate-y-180' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front of card */}
                <button
                  onClick={() => !loading && setFlippedCard(flippedCard === g?.id ? null : g?.id)}
                  className="w-full backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                  disabled={loading}
                >
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
                  <p className="font-bold mb-0.5 text-xs text-left" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    {loading ? 'Product' : g?.name}
                  </p>
                  {!loading && g?.price && (
                    <p className="text-xs mb-0.5 text-left" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                      {g.price}
                    </p>
                  )}
                </button>

                {/* Back of card */}
                {!loading && (
                  <div
                    className="absolute inset-0 w-full backface-hidden rotate-y-180"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="w-full h-full bg-white border-2 border-black rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                      {editingCard === g?.id ? (
                        <div className="w-full space-y-2">
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="New product URL"
                            className="w-full border rounded px-2 py-1 text-xs"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateItem(g.id)}
                              disabled={saving || !editUrl.trim()}
                              className="flex-1 px-3 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                              style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCard(null)
                                setEditUrl('')
                              }}
                              className="flex-1 px-3 py-2 rounded-lg text-black text-xs font-bold border border-black"
                              style={{ fontFamily: '"Open Sans", sans-serif' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingCard(g.id)
                              setEditUrl(g.link || '')
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-bold"
                            style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit URL
                          </button>
                          <button
                            onClick={() => deleteItem(g.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-bold"
                            style={{ backgroundColor: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                          <button
                            onClick={() => setFlippedCard(null)}
                            className="text-xs text-gray-600 hover:text-black"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          >
                            Back
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500">No gear items yet.</div>
          )}
        </div>

        {/* Pagination arrows - only show if MORE than 4 items */}
        {items.length > 4 && (
          <>
            <button
              aria-label="Previous gear"
              disabled={gearPage === 0}
              onClick={() => setGearPage((p) => Math.max(0, p - 1))}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                gearPage > 0
                  ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                  : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              aria-label="Next gear"
              disabled={gearPage >= Math.ceil(items.length / gearPageSize) - 1}
              onClick={() => setGearPage((p) => Math.min(Math.ceil(items.length / gearPageSize) - 1, p + 1))}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                gearPage < Math.ceil(items.length / gearPageSize) - 1
                  ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                  : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
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
              <h3 className="text-white font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>Add Recommended Gear</h3>
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
