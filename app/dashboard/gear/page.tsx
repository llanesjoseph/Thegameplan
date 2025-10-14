'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore'
import { ShoppingBag, ExternalLink, Star, Tag, Filter, Search, Image as ImageIcon } from 'lucide-react'

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
  ratingCount?: number
  status: string
  createdAt: any
}

export default function AthleteGearBrowsePage({ searchParams }: { searchParams: { embedded?: string } }) {
  const embedded = searchParams?.embedded === 'true'
  const { user } = useAuth()
  const [gearItems, setGearItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['All Categories', 'Cleats', 'Shoes', 'Apparel', 'Protective Gear', 'Equipment', 'Accessories', 'Training Aids', 'Recovery', 'Nutrition', 'Technology']
  const levels = ['All Levels', 'beginner', 'intermediate', 'advanced', 'all']

  useEffect(() => {
    loadCoachId()
  }, [user])

  useEffect(() => {
    if (user) {
      loadGearItems()
    }
  }, [coachId, user])

  const loadCoachId = async () => {
    if (!user?.uid) return

    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)))
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data()
        setCoachId(userData?.coachId || userData?.assignedCoachId || null)
      }
    } catch (error) {
      console.error('Error loading coach ID:', error)
    }
  }

  const loadGearItems = async () => {
    try {
      setLoading(true)
      const gearQuery = query(
        collection(db, 'gear'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(gearQuery)

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as GearItem[]

      setGearItems(items)
    } catch (error) {
      console.error('Error loading gear items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter gear items
  const filteredGear = gearItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'All Categories' || item.category === selectedCategory
    const matchesLevel = selectedLevel === 'all' || selectedLevel === 'All Levels' || item.level === selectedLevel || item.level === 'all'
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    // Prioritize gear from the athlete's coach
    return matchesCategory && matchesLevel && matchesSearch
  }).sort((a, b) => {
    // Sort: Coach's gear first, then by date
    if (coachId) {
      if (a.createdBy === coachId && b.createdBy !== coachId) return -1
      if (a.createdBy !== coachId && b.createdBy === coachId) return 1
    }
    return 0
  })

  const content = (
    <div className="space-y-6">
      {/* Header - Only show when NOT embedded */}
      {!embedded && (
        <div className="mb-2">
          <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Recommended Gear</h2>
          <p className="text-sm mt-1" style={{ color: '#000000', opacity: 0.7 }}>Equipment and gear recommended by coaches</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: '#000000' }}>
          Search & Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#000000', opacity: 0.4 }} />
            <input
              type="text"
              placeholder="Search gear..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {levels.map((level) => (
              <option key={level} value={level}>{level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7B92C4' }}>
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: '#000000' }}>{filteredGear.length}</div>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>Available Gear Items</div>
          </div>
        </div>
      </div>

      {/* Gear Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      ) : filteredGear.length === 0 ? (
        <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12">
          <ShoppingBag className="w-20 h-20 mx-auto mb-4" style={{ color: '#7B92C4', opacity: 0.3 }} />
          <h3 className="text-2xl font-semibold mb-3" style={{ color: '#000000' }}>No gear found</h3>
          <p className="text-base" style={{ color: '#000000', opacity: 0.6 }}>
            {searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all'
              ? 'Try adjusting your filters'
              : 'Your coaches haven\'t recommended any gear yet'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGear.map((item) => {
            const isFromCoach = coachId && item.createdBy === coachId

            return (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02]">
                <div className="relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-52 object-cover" />
                  ) : (
                    <div className="w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {isFromCoach && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      ⭐ Your Coach
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                    {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg" style={{ color: '#000000' }}>{item.name}</h3>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: '#FF6B35', fill: '#FF6B35' }} />
                        <span className="text-sm font-semibold" style={{ color: '#000000' }}>{item.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: '#000000', opacity: 0.7 }}>{item.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4" style={{ color: '#5A9B9B' }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B9B' }}>
                      {item.category} · {item.sport}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>
                    {item.price}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs mb-4 pb-4 border-b border-gray-200" style={{ color: '#000000', opacity: 0.6 }}>
                    Recommended by <span className="font-semibold">{item.creatorName}</span>
                  </div>
                  <a
                    href={item.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View & Buy
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'white' }}>
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Gear Shop" subtitle="Equipment and gear recommended by coaches" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {content}
      </main>
    </div>
  )
}
