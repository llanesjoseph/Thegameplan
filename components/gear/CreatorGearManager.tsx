'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db, storage } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Plus, Upload, X, Save, Trash2, ExternalLink, Image as ImageIcon, Link2, Sparkles, Loader2 } from 'lucide-react'

interface GearFormData {
 name: string
 category: string
 sport: string
 description: string
 price: string
 affiliateLink: string
 level: 'beginner' | 'intermediate' | 'advanced' | 'all'
 tags: string[]
}

interface CreatorGearManagerProps {
 onItemAdded?: () => void
}

export default function CreatorGearManager({ onItemAdded }: CreatorGearManagerProps) {
 const { user } = useAuth()
 const [isOpen, setIsOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const [imageFile, setImageFile] = useState<File | null>(null)
 const [imagePreview, setImagePreview] = useState<string | null>(null)
 const [parsedImageUrl, setParsedImageUrl] = useState<string | null>(null)
 const [productUrl, setProductUrl] = useState('')
 const [parsing, setParsing] = useState(false)
 const [parseError, setParseError] = useState('')

 const [formData, setFormData] = useState<GearFormData>({
  name: '',
  category: '',
  sport: '',
  description: '',
  price: '',
  affiliateLink: '',
  level: 'all',
  tags: []
 })

 const categories = [
  'Cleats', 'Shoes', 'Apparel', 'Protective Gear', 'Equipment', 
  'Accessories', 'Training Aids', 'Recovery', 'Nutrition', 'Technology'
 ]

 const sports = [
  'soccer', 'basketball', 'tennis', 'baseball', 'football', 
  'volleyball', 'track', 'swimming', 'golf', 'bjj', 'boxing', 'other'
 ]

 const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
   setImageFile(file)
   setParsedImageUrl(null) // Clear parsed URL when manually uploading
   const reader = new FileReader()
   reader.onload = (e) => {
    setImagePreview(e.target?.result as string)
   }
   reader.readAsDataURL(file)
  }
 }

 const uploadImage = async (): Promise<string | null> => {
  if (!imageFile || !user) return null
  
  try {
   const imageRef = ref(storage, `gear/${user.uid}/${Date.now()}-${imageFile.name}`)
   const snapshot = await uploadBytes(imageRef, imageFile)
   return await getDownloadURL(snapshot.ref)
  } catch (error) {
   console.error('Image upload failed:', error)
   return null
  }
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!user) return

  setLoading(true)
  try {
   // Upload image if provided, otherwise use parsed image URL
   let imageUrl = null
   if (imageFile) {
    imageUrl = await uploadImage()
   } else if (parsedImageUrl) {
    imageUrl = parsedImageUrl
   }

   // Create gear item
   const gearData = {
    ...formData,
    imageUrl,
    createdBy: user.uid,
    creatorName: user.displayName || user.email,
    createdAt: serverTimestamp(),
    rating: 0,
    ratingCount: 0,
    status: 'active',
    tags: formData.tags.filter(tag => tag.trim() !== '')
   }

   await addDoc(collection(db, 'gear'), gearData)

   // Reset form
   setFormData({
    name: '',
    category: '',
    sport: '',
    description: '',
    price: '',
    affiliateLink: '',
    level: 'all',
    tags: []
   })
   setImageFile(null)
   setImagePreview(null)
   setParsedImageUrl(null)
   setIsOpen(false)

   onItemAdded?.()

  } catch (error) {
   console.error('Failed to add gear item:', error)
  } finally {
   setLoading(false)
  }
 }

 const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' || e.key === ',') {
   e.preventDefault()
   const input = e.target as HTMLInputElement
   const tag = input.value.trim()
   if (tag && !formData.tags.includes(tag)) {
    setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    input.value = ''
   }
  }
 }

 const removeTag = (tagToRemove: string) => {
  setFormData(prev => ({
   ...prev,
   tags: prev.tags.filter(tag => tag !== tagToRemove)
  }))
 }

 const handleParseLink = async () => {
  if (!productUrl.trim()) {
   setParseError('Please enter a product URL')
   return
  }

  setParsing(true)
  setParseError('')

  try {
   const response = await fetch('/api/parse-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productUrl: productUrl.trim() })
   })

   const data = await response.json()

   if (!data.success) {
    setParseError(data.error || 'Failed to parse product link')
    return
   }

   // Auto-fill the form with parsed data
   const product = data.product
   setFormData({
    name: product.name || '',
    category: product.category || '',
    sport: formData.sport, // Keep current sport selection
    description: product.description || '',
    price: product.price || '',
    affiliateLink: product.affiliateLink || productUrl,
    level: 'all',
    tags: product.tags || []
   })

   // Set image preview and URL from parsed image URL
   if (product.imageUrl) {
    setImagePreview(product.imageUrl)
    setParsedImageUrl(product.imageUrl)
   }

   console.log('✅ Product parsed successfully:', product.name)
   setProductUrl('') // Clear the input

  } catch (error) {
   console.error('Error parsing product link:', error)
   setParseError('Failed to parse product link. Please try again.')
  } finally {
   setParsing(false)
  }
 }

 if (!isOpen) {
  return (
   <button
    onClick={() => setIsOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark transition-colors"
   >
    <Plus className="w-4 h-4" />
    Add Gear Recommendation
   </button>
  )
 }

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
   <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
     <h2 className="text-xl  text-gray-800">Add Gear Recommendation</h2>
     <button
      onClick={() => setIsOpen(false)}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
     >
      <X className="w-5 h-5 text-gray-600" />
     </button>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
     {/* AI Link Parser */}
     <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
       <Sparkles className="w-5 h-5 text-blue-600" />
       <h3 className="font-semibold text-gray-800">Quick Add from Product Link</h3>
      </div>
      <p className="text-sm text-gray-600">
       Paste any product URL and our AI will automatically extract the details for you
      </p>
      <div className="flex gap-2">
       <div className="flex-1">
        <input
         type="url"
         value={productUrl}
         onChange={(e) => {
          setProductUrl(e.target.value)
          setParseError('')
         }}
         placeholder="https://amazon.com/product-name or https://nike.com/shoes..."
         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
         disabled={parsing}
        />
       </div>
       <button
        type="button"
        onClick={handleParseLink}
        disabled={parsing || !productUrl.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
       >
        {parsing ? (
         <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Parsing...
         </>
        ) : (
         <>
          <Link2 className="w-4 h-4" />
          Parse Link
         </>
        )}
       </button>
      </div>
      {parseError && (
       <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
        {parseError}
       </div>
      )}
     </div>

     {/* Divider */}
     <div className="relative">
      <div className="absolute inset-0 flex items-center">
       <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
       <span className="px-2 bg-white text-gray-500">Or enter manually</span>
      </div>
     </div>

     {/* Image Upload */}
     <div className="space-y-2">
      <label className="block text-sm  text-gray-700">Product Image</label>
      <div className="flex items-center gap-4">
       <div className="flex-1">
        <input
         type="file"
         accept="image/*"
         onChange={handleImageSelect}
         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file: file:bg-cardinal file:text-white hover:file:bg-cardinal-dark"
        />
       </div>
       {imagePreview && (
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
         <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        </div>
       )}
      </div>
     </div>

     {/* Basic Info */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <label className="block text-sm  text-gray-700 mb-1">Product Name*</label>
       <input
        type="text"
        required
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
        placeholder="Nike Air Jordan 36"
       />
      </div>
      <div>
       <label className="block text-sm  text-gray-700 mb-1">Price*</label>
       <input
        type="text"
        required
        value={formData.price}
        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
        placeholder="$185"
       />
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
       <label className="block text-sm  text-gray-700 mb-1">Category</label>
       <select
        value={formData.category}
        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       >
        <option value="">Select category</option>
        {categories.map(cat => (
         <option key={cat} value={cat}>{cat}</option>
        ))}
       </select>
      </div>
      <div>
       <label className="block text-sm  text-gray-700 mb-1">Sport</label>
       <select
        value={formData.sport}
        onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       >
        <option value="">Select sport</option>
        {sports.map(sport => (
         <option key={sport} value={sport}>
          {sport.charAt(0).toUpperCase() + sport.slice(1)}
         </option>
        ))}
       </select>
      </div>
      <div>
       <label className="block text-sm  text-gray-700 mb-1">Level</label>
       <select
        value={formData.level}
        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       >
        <option value="all">All Levels</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
       </select>
      </div>
     </div>

     {/* Description */}
     <div>
      <label className="block text-sm  text-gray-700 mb-1">Description*</label>
      <textarea
       required
       rows={3}
       value={formData.description}
       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       placeholder="Describe why you recommend this product, its key features, and who it's best for..."
      />
     </div>

     {/* Affiliate Link */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Purchase Link (Your Affiliate Link)*
      </label>
      <input
       type="url"
       required
       value={formData.affiliateLink}
       onChange={(e) => setFormData(prev => ({ ...prev, affiliateLink: e.target.value }))}
       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       placeholder="https://your-affiliate-link.com/product"
      />
      <p className="text-xs text-gray-500 mt-1">
        💡 Tip: Use your affiliate link here to earn commission when athletes purchase through your recommendation
      </p>
     </div>

     {/* Tags */}
     <div>
      <label className="block text-sm  text-gray-700 mb-1">Tags</label>
      <input
       type="text"
       onKeyDown={handleTagInput}
       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cardinal focus:border-cardinal"
       placeholder="Type tags and press Enter (e.g., lightweight, professional, durable)"
      />
      {formData.tags.length > 0 && (
       <div className="flex flex-wrap gap-2 mt-2">
        {formData.tags.map(tag => (
         <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 bg-cardinal/10 text-cardinal rounded-full text-sm"
         >
          {tag}
          <button
           type="button"
           onClick={() => removeTag(tag)}
           className="hover:bg-cardinal/20 rounded-full p-0.5"
          >
           <X className="w-3 h-3" />
          </button>
         </span>
        ))}
       </div>
      )}
     </div>

     {/* Actions */}
     <div className="flex gap-3 pt-4 border-t border-gray-200">
      <button
       type="button"
       onClick={() => setIsOpen(false)}
       className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
       Cancel
      </button>
      <button
       type="submit"
       disabled={loading}
       className="flex-1 px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
       {loading ? (
        <>
         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
         Adding...
        </>
       ) : (
        <>
         <Save className="w-4 h-4" />
         Add Recommendation
        </>
       )}
      </button>
     </div>
    </form>
   </div>
  </div>
 )
}
