'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import CreatorGearManager from '@/components/gear/CreatorGearManager'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, where, deleteDoc, doc } from 'firebase/firestore'
import { ShoppingBag, Trash2, Edit, ExternalLink, Image as ImageIcon, Star, Tag } from 'lucide-react'

interface GearItem {
  id: string
  name: string
  description: string
  category: string
  sport: string
  price: string
  affiliateLink: string
  level: string
  imageUrl?: string
  tags: string[]
  createdBy: string
  creatorName: string
  rating?: number
  status: string
  createdAt: any
}

export default function CoachGearPage({ searchParams }: { searchParams: { embedded?: string } }) {
  const embedded = searchParams?.embedded === 'true'
  const { user } = useAuth()
  const [gearItems, setGearItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGearItems()
  }, [user])

  const loadGearItems = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const gearQuery = query(
        collection(db, 'gear'),
        where('createdBy', '==', user.uid)
      )
      const snapshot = await getDocs(gearQuery)

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as GearItem[]

      // Sort by createdAt in JavaScript to avoid needing a composite index
      items.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime // desc order
      })

      setGearItems(items)
    } catch (error) {
      console.error('Error loading gear items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this gear recommendation?')) return

    try {
      await deleteDoc(doc(db, 'gear', itemId))
      loadGearItems()
    } catch (error) {
      console.error('Error deleting gear item:', error)
      alert('Failed to delete gear item')
    }
  }

  if (embedded) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Gear Recommendations</h2>
            <p className="text-sm" style={{ color: '#666' }}>Recommend equipment and gear to your athletes</p>
          </div>
          <CreatorGearManager onItemAdded={loadGearItems} />
        </div>

        {/* Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" style={{ color: '#91A6EB' }} />
            <div>
              <div className="text-3xl font-bold" style={{ color: '#000000' }}>{gearItems.length}</div>
              <div className="text-sm" style={{ color: '#666' }}>Your Recommendations</div>
            </div>
          </div>
        </div>

        {/* Gear Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          </div>
        ) : gearItems.length === 0 ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: '#91A6EB', opacity: 0.3 }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>No gear recommendations yet</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              Start recommending equipment and gear that will help your athletes improve
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gearItems.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
                <div className="relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {item.level}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base" style={{ color: '#000000' }}>{item.name}</h3>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: '#FF6B35', fill: '#FF6B35' }} />
                        <span className="text-sm" style={{ color: '#000000' }}>{item.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#666' }}>{item.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" style={{ color: '#20B2AA' }} />
                    <span className="text-xs" style={{ color: '#20B2AA' }}>{item.category} · {item.sport}</span>
                  </div>
                  <div className="text-xl font-bold mb-3" style={{ color: '#000000' }}>
                    {item.price}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={item.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Product
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="py-2 px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Gear Recommendations" subtitle="Recommend equipment and gear to your athletes" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Same content as embedded */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Your Gear Recommendations</h2>
              <p className="text-sm" style={{ color: '#666' }}>Recommend equipment that will help your athletes improve</p>
            </div>
            <CreatorGearManager onItemAdded={loadGearItems} />
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8" style={{ color: '#91A6EB' }} />
              <div>
                <div className="text-3xl font-bold" style={{ color: '#000000' }}>{gearItems.length}</div>
                <div className="text-sm" style={{ color: '#666' }}>Your Recommendations</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            </div>
          ) : gearItems.length === 0 ? (
            <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: '#91A6EB', opacity: 0.3 }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>No gear recommendations yet</h3>
              <p className="text-sm mb-4" style={{ color: '#666' }}>
                Start recommending equipment and gear that will help your athletes improve
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gearItems.map((item) => (
                <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
                  <div className="relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {item.level}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-base" style={{ color: '#000000' }}>{item.name}</h3>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" style={{ color: '#FF6B35', fill: '#FF6B35' }} />
                          <span className="text-sm" style={{ color: '#000000' }}>{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: '#666' }}>{item.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4" style={{ color: '#20B2AA' }} />
                      <span className="text-xs" style={{ color: '#20B2AA' }}>{item.category} · {item.sport}</span>
                    </div>
                    <div className="text-xl font-bold mb-3" style={{ color: '#000000' }}>
                      {item.price}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <a
                        href={item.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Product
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="py-2 px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
