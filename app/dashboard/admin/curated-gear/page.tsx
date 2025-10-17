'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  DollarSign,
  Package,
  Image as ImageIcon,
  Tag
} from 'lucide-react'

interface GearItem {
  id: string
  name: string
  description: string
  category: string
  price: number | string
  imageUrl: string
  affiliateUrl: string
  rating?: number
  featured?: boolean
  createdAt?: any
}

const gearCategories = [
  'Training Equipment',
  'Footwear',
  'Apparel',
  'Accessories',
  'Recovery',
  'Nutrition',
  'Technology'
]

export default function CuratedGear() {
  const [gearItems, setGearItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GearItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Training Equipment',
    price: 0,
    imageUrl: '',
    affiliateUrl: '',
    rating: 5,
    featured: false
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    loadGearItems()
  }, [user, role])

  const loadGearItems = async () => {
    try {
      setLoading(true)
      const gearQuery = query(collection(db, 'gear'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(gearQuery)

      const items = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price?.toString() || '0')
        }
      }) as GearItem[]

      setGearItems(items)
    } catch (error) {
      console.error('Error loading gear items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingItem) {
        // Update existing item
        await updateDoc(doc(db, 'gear', editingItem.id), {
          ...formData,
          updatedAt: new Date()
        })
      } else {
        // Add new item
        await addDoc(collection(db, 'gear'), {
          ...formData,
          createdAt: new Date(),
          createdBy: user?.uid,
          creatorName: user?.displayName || user?.email || 'Admin',
          status: 'active'
        })
      }

      // Reset form and reload
      setFormData({
        name: '',
        description: '',
        category: 'Training Equipment',
        price: 0,
        imageUrl: '',
        affiliateUrl: '',
        rating: 5,
        featured: false
      })
      setShowAddModal(false)
      setEditingItem(null)
      loadGearItems()
    } catch (error) {
      console.error('Error saving gear item:', error)
      alert('Failed to save gear item')
    }
  }

  const handleEdit = (item: GearItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0'),
      imageUrl: item.imageUrl,
      affiliateUrl: item.affiliateUrl,
      rating: item.rating || 5,
      featured: item.featured || false
    })
    setShowAddModal(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this gear item?')) return

    try {
      await deleteDoc(doc(db, 'gear', itemId))
      loadGearItems()
    } catch (error) {
      console.error('Error deleting gear item:', error)
      alert('Failed to delete gear item')
    }
  }

  if (role !== 'superadmin' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
          <p style={{ color: '#000000', opacity: 0.7 }}>This page is only available to administrators.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading curated gear...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Curated Gear" subtitle="Manage recommended gear and equipment" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 px-6 py-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6" style={{ color: '#91A6EB' }} />
              <div>
                <div className="text-2xl" style={{ color: '#000000' }}>
                  {gearItems.length}
                </div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Items</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingItem(null)
              setFormData({
                name: '',
                description: '',
                category: 'Training Equipment',
                price: 0,
                imageUrl: '',
                affiliateUrl: '',
                rating: 5,
                featured: false
              })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Gear Item
          </button>
        </div>

        {/* Gear Grid */}
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
                {item.featured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading text-lg" style={{ color: '#000000' }}>{item.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ color: '#FF6B35', fill: '#FF6B35' }} />
                    <span className="text-sm" style={{ color: '#000000' }}>{item.rating || 5}</span>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: '#000000', opacity: 0.7 }}>{item.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4" style={{ color: '#20B2AA' }} />
                  <span className="text-sm" style={{ color: '#20B2AA' }}>{item.category}</span>
                </div>
                <div className="text-2xl mb-4" style={{ color: '#000000' }}>
                  ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price?.toString() || '0').toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
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

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl mb-6" style={{ color: '#000000' }}>
                {editingItem ? 'Edit Gear Item' : 'Add Gear Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {gearCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                    Affiliate URL
                  </label>
                  <input
                    type="url"
                    value={formData.affiliateUrl}
                    onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      Rating (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm" style={{ color: '#000000' }}>Featured Item</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingItem(null)
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
