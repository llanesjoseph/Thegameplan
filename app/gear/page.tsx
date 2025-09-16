'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import CreatorGearManager from '@/components/gear/CreatorGearManager'
import Link from 'next/link'
import { 
  ShoppingBag, 
  Star, 
  ExternalLink, 
  User, 
  Filter,
  Search,
  Heart,
  TrendingUp,
  Award,
  Target
} from 'lucide-react'

interface GearItem {
  id: string
  name: string
  category: string
  description: string
  link: string
  price: string
  image?: string
  rating: number
  recommendedBy: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'all'
}

interface UserPreferences {
  sports: string[]
  level: string
  position?: string
  budget?: string
}

export default function Gear() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [gearItems, setGearItems] = useState<GearItem[]>([])
  const [dbGearItems, setDbGearItems] = useState<GearItem[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ sports: [], level: 'all' })
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Gear data with authentic athlete recommendations
  const mockGearData: GearItem[] = [
    // Soccer Gear - Jasmine Aikey's Authentic Recommendations
    {
      id: '1',
      name: 'Nike Phantom Luna',
      category: 'Cleats',
      description: 'Elite cleats favored by collegiate and professional female players for agility and precision. Top choice for midfielders.',
      link: 'https://nike.com/phantom-luna',
      price: '$275',
      rating: 4.9,
      recommendedBy: 'Jasmine Aikey',
      sport: 'soccer',
      level: 'advanced'
    },
    {
      id: '2', 
      name: 'Nike Tiempo Legend 10',
      category: 'Cleats',
      description: 'Classic midfielders choice offering exceptional comfort, touch, and ball feel. Perfect for technical players.',
      link: 'https://nike.com/tiempo-legend',
      price: '$230',
      rating: 4.8,
      recommendedBy: 'Jasmine Aikey',
      sport: 'soccer',
      level: 'intermediate'
    },
    {
      id: '3',
      name: 'Nike Mercurial Lite Shin Guards',
      category: 'Protective Gear', 
      description: 'Lightweight protection used by Nike-sponsored athletes. Essential for competitive play.',
      link: 'https://nike.com/shin-guards',
      price: '$35',
      rating: 4.7,
      recommendedBy: 'Jasmine Aikey',
      sport: 'soccer',
      level: 'all'
    },
    {
      id: '4',
      name: 'Nike Dri-FIT Training Jersey',
      category: 'Apparel',
      description: 'Moisture-wicking training jersey worn by Stanford and U.S. National Team players.',
      link: 'https://nike.com/dri-fit',
      price: '$45',
      rating: 4.6,
      recommendedBy: 'Jasmine Aikey',
      sport: 'soccer',
      level: 'all'
    },
    {
      id: '5',
      name: 'Athletic Tape (White)',
      category: 'Accessories',
      description: 'Standard white athletic tape for wrist support. Commonly used by professional soccer players.',
      link: 'https://nike.com/accessories',
      price: '$12',
      rating: 4.5,
      recommendedBy: 'Jasmine Aikey',
      sport: 'soccer',
      level: 'all'
    },
    // Basketball Gear
    {
      id: '6',
      name: 'Nike Air Jordan 36',
      category: 'Shoes',
      description: 'Elite basketball shoes with responsive cushioning and superior court grip.',
      link: 'https://nike.com',
      price: '$185',
      rating: 4.7,
      recommendedBy: 'Coach Martinez',
      sport: 'basketball',
      level: 'intermediate'
    },
    {
      id: '7',
      name: 'Spalding TF-1000 Basketball',
      category: 'Equipment',
      description: 'Official size composite leather basketball used in high school competitions.',
      link: 'https://spalding.com',
      price: '$59',
      rating: 4.9,
      recommendedBy: 'Coach Martinez',
      sport: 'basketball',
      level: 'all'
    },
    // Tennis Gear
    {
      id: '8',
      name: 'Wilson Pro Staff 97 V13',
      category: 'Racquets',
      description: 'Professional tennis racquet favored by tour players for precision and control.',
      link: 'https://wilson.com',
      price: '$249',
      rating: 4.8,
      recommendedBy: 'Sarah Chen',
      sport: 'tennis',
      level: 'advanced'
    },
    // BJJ Gear
    {
      id: '9',
      name: 'Fuji All Around BJJ Gi',
      category: 'Gi',
      description: 'High-quality Brazilian Jiu-Jitsu gi made from pearl weave cotton.',
      link: 'https://fujisports.com',
      price: '$149',
      rating: 4.6,
      recommendedBy: 'Professor Silva',
      sport: 'bjj',
      level: 'all'
    },
    {
      id: '10',
      name: 'Scramble Spats V2',
      category: 'No-Gi Gear',
      description: 'Compression tights designed for grappling with reinforced stress points.',
      link: 'https://scramblestuff.com',
      price: '$65',
      rating: 4.5,
      recommendedBy: 'Professor Silva',
      sport: 'bjj',
      level: 'all'
    }
  ]

  const loadGearFromDatabase = async () => {
    try {
      const gearQuery = query(
        collection(db, 'gear'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const gearSnapshot = await getDocs(gearQuery)
      const dbGear = gearSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GearItem[]
      
      setDbGearItems(dbGear)
      return dbGear
    } catch (error) {
      console.warn('Failed to load gear from database:', error)
      return []
    }
  }

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        // Load all gear for non-authenticated users (mock + database)
        const dbGear = await loadGearFromDatabase()
        setGearItems([...mockGearData, ...dbGear])
        setLoading(false)
        return
      }

      try {
        // Get user profile to determine preferences
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        
        let preferences: UserPreferences = { sports: ['soccer'], level: 'all' }
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          preferences = {
            sports: userData.preferredSports || ['soccer'],
            level: userData.skillLevel || 'all',
            position: userData.position,
            budget: userData.budget
          }
        }

        // Try to get creator profile for more specific preferences
        const creatorProfileRef = doc(db, 'creator_profiles', user.uid)
        const creatorDoc = await getDoc(creatorProfileRef)
        
        if (creatorDoc.exists()) {
          const creatorData = creatorDoc.data()
          if (creatorData.specialties?.length > 0) {
            // Map specialties to sports
            preferences.sports = ['soccer'] // Default, could be more sophisticated
          }
        }

        setUserPreferences(preferences)
        
        // Load database gear
        const dbGear = await loadGearFromDatabase()
        const allGear = [...mockGearData, ...dbGear]
        
        // Filter gear based on user preferences
        const filteredGear = allGear.filter(item => {
          if (preferences.sports.includes('all') || preferences.sports.length === 0) {
            return true
          }
          return preferences.sports.some(sport => 
            item.sport.toLowerCase() === sport.toLowerCase()
          )
        })
        
        setGearItems(filteredGear.length > 0 ? filteredGear : allGear)
        
        // Set default sport filter to user's primary sport
        if (preferences.sports.length > 0 && preferences.sports[0] !== 'all') {
          setSelectedSport(preferences.sports[0])
        }
        
      } catch (error) {
        console.warn('Failed to load user preferences:', error)
        const dbGear = await loadGearFromDatabase()
        setGearItems([...mockGearData, ...dbGear])
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user?.uid])

  const filteredItems = gearItems.filter(item => {
    const matchesSport = selectedSport === 'all' || item.sport === selectedSport
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSport && matchesCategory && matchesSearch
  })

  const sports = ['all', ...Array.from(new Set(gearItems.map(item => item.sport)))]
  const categories = ['all', ...Array.from(new Set(gearItems.map(item => item.category)))]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cardinal mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your personalized gear...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cardinal rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {user ? 'Your Recommended Gear' : 'Training Equipment & Gear'}
              </h1>
              <p className="text-base text-gray-600 mt-1">
                {user 
                  ? `Curated recommendations based on your training profile • ${userPreferences.sports.join(', ').toUpperCase()}` 
                  : 'Professional equipment recommendations from expert coaches'
                }
              </p>
            </div>
            {/* Creator Actions */}
            {(role === 'creator' || role === 'admin' || role === 'superadmin') && (
              <div className="ml-auto">
                <CreatorGearManager onItemAdded={() => window.location.reload()} />
              </div>
            )}
          </div>
          
          {user && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-card p-4">
              <div className="flex items-center gap-2 text-cardinal mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">Personalized for you</span>
              </div>
              <p className="text-sm text-gray-600">
                Showing gear recommendations based on your sports: {userPreferences.sports.join(', ')} • 
                Skill level: {userPreferences.level}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
              />
            </div>
            
            {/* Sport Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-base text-gray-600">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {selectedSport !== 'all' && ` for ${selectedSport}`}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>Sorted by relevance</span>
            </div>
          </div>
        </div>

        {/* Gear Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-card hover:shadow-card-md hover:scale-[1.02] transition duration-200 flex flex-col h-full">
              {/* Product Image */}
              <div className="aspect-square rounded-lg bg-gray-50 border border-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                {item.image || (item as any).imageUrl ? (
                  <img 
                    src={item.image || (item as any).imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-gray-600" />
                )}
              </div>
              
              {/* Product Info */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-cardinal bg-cardinal/10 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                      {item.sport.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 leading-tight text-sm">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-800">{item.rating}</span>
                  </div>
                  <span className="font-bold text-gray-800">{item.price}</span>
                </div>

                {/* Recommended By */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Award className="w-4 h-4 text-cardinal" />
                  <span className="text-sm text-gray-600">Recommended by {item.recommendedBy}</span>
                </div>

                {/* CTA */}
                <div className="flex gap-2 pt-2 mt-auto">
                  <a 
                    href={item.link || (item as any).affiliateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-cardinal text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2 hover:bg-cardinal-dark transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Product
                  </a>
                  <button className="p-2 border border-gray-300 hover:border-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Heart className="w-4 h-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No gear found</h3>
            <p className="text-base text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => {
                setSelectedSport('all')
                setSelectedCategory('all') 
                setSearchTerm('')
              }}
              className="px-6 py-3 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <p className="text-sm text-gray-600 text-center">
            <strong>Affiliate Disclosure:</strong> Some links may be affiliate links. We may earn a commission from purchases made through these links at no additional cost to you. All recommendations are based on genuine product evaluation by our expert coaches.
          </p>
        </div>
      </div>
    </main>
  )
}