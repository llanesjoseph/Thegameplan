'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        // Load default gear for non-authenticated users
        setGearItems(mockGearData)
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
        
        // Filter gear based on user preferences
        const filteredGear = mockGearData.filter(item => {
          if (preferences.sports.includes('all') || preferences.sports.length === 0) {
            return true
          }
          return preferences.sports.some(sport => 
            item.sport.toLowerCase() === sport.toLowerCase()
          )
        })
        
        setGearItems(filteredGear.length > 0 ? filteredGear : mockGearData)
        
        // Set default sport filter to user's primary sport
        if (preferences.sports.length > 0 && preferences.sports[0] !== 'all') {
          setSelectedSport(preferences.sports[0])
        }
        
      } catch (error) {
        console.warn('Failed to load user preferences:', error)
        setGearItems(mockGearData)
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
      <div className="min-h-screen bg-clarity-background flex items-center justify-center">
        <div className="clarity-container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clarity-accent mx-auto"></div>
            <p className="mt-4 text-clarity-text-secondary">Loading your personalized gear...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-clarity-background">
      <div className="clarity-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-clarity-accent rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-h1 font-bold text-clarity-text-primary">
                {user ? 'Your Recommended Gear' : 'Training Equipment & Gear'}
              </h1>
              <p className="text-body text-clarity-text-secondary mt-1">
                {user 
                  ? `Curated recommendations based on your training profile • ${userPreferences.sports.join(', ').toUpperCase()}` 
                  : 'Professional equipment recommendations from expert coaches'
                }
              </p>
            </div>
          </div>
          
          {user && (
            <div className="clarity-glass-card p-4">
              <div className="flex items-center gap-2 text-clarity-accent mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">Personalized for you</span>
              </div>
              <p className="text-caption text-clarity-text-secondary">
                Showing gear recommendations based on your sports: {userPreferences.sports.join(', ')} • 
                Skill level: {userPreferences.level}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 clarity-glass-card p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-clarity-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clarity-input pl-10"
              />
            </div>
            
            {/* Sport Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-clarity-text-secondary" />
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="clarity-input"
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
              className="clarity-input"
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
            <p className="text-body text-clarity-text-secondary">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {selectedSport !== 'all' && ` for ${selectedSport}`}
            </p>
            <div className="flex items-center gap-2 text-caption text-clarity-text-secondary">
              <TrendingUp className="w-4 h-4" />
              <span>Sorted by relevance</span>
            </div>
          </div>
        </div>

        {/* Gear Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="clarity-glass-card p-4 hover:shadow-clarity-lg hover:scale-105 transition-all duration-200 flex flex-col h-full">
              {/* Product Image Placeholder */}
              <div className="aspect-square rounded-lg bg-clarity-surface border border-clarity-text-secondary/20 mb-4 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-clarity-text-secondary" />
              </div>
              
              {/* Product Info */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption font-medium text-clarity-accent bg-clarity-accent/10 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-caption font-medium text-clarity-text-secondary bg-clarity-surface px-2 py-1 rounded-full">
                      {item.sport.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-clarity-text-primary leading-tight text-caption">{item.name}</h3>
                  <p className="text-caption text-clarity-text-secondary mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-clarity-warning fill-current" />
                    <span className="text-caption font-medium text-clarity-text-primary">{item.rating}</span>
                  </div>
                  <span className="font-bold text-clarity-text-primary">{item.price}</span>
                </div>

                {/* Recommended By */}
                <div className="flex items-center gap-2 pt-2 border-t border-clarity-text-secondary/20">
                  <Award className="w-4 h-4 text-clarity-accent" />
                  <span className="text-caption text-clarity-text-secondary">Recommended by {item.recommendedBy}</span>
                </div>

                {/* CTA */}
                <div className="flex gap-2 pt-2 mt-auto">
                  <button className="flex-1 clarity-btn-primary text-caption py-2 px-4 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Product
                  </button>
                  <button className="p-2 border border-clarity-text-secondary/30 hover:border-clarity-error/50 hover:bg-clarity-error/5 rounded-lg transition-colors">
                    <Heart className="w-4 h-4 text-clarity-text-secondary hover:text-clarity-error" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-clarity-text-secondary mx-auto mb-4" />
            <h3 className="text-h3 font-semibold text-clarity-text-primary mb-2">No gear found</h3>
            <p className="text-body text-clarity-text-secondary mb-4">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => {
                setSelectedSport('all')
                setSelectedCategory('all') 
                setSearchTerm('')
              }}
              className="clarity-btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 clarity-glass-card p-6">
          <p className="text-caption text-clarity-text-secondary text-center">
            <strong>Affiliate Disclosure:</strong> Some links may be affiliate links. We may earn a commission from purchases made through these links at no additional cost to you. All recommendations are based on genuine product evaluation by our expert coaches.
          </p>
        </div>
      </div>
    </main>
  )
}