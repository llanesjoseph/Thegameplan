'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Camera, Trash2 } from 'lucide-react'

export default function CoachPhotoShowcase() {
  const { user } = useAuth()
  const [photo1, setPhoto1] = useState<string>('')
  const [photo2, setPhoto2] = useState<string>('')
  const [uploading1, setUploading1] = useState(false)
  const [uploading2, setUploading2] = useState(false)
  const first = user?.displayName?.split(' ')[0] || 'Your'

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setPhoto1(data?.showcasePhoto1 || '')
          setPhoto2(data?.showcasePhoto2 || '')
        }
      } catch (e) {
        console.warn('Failed to load showcase photos:', e)
      }
    }
    load()
  }, [user])

  const uploadPhoto = async (file: File, photoNumber: 1 | 2) => {
    if (!user?.uid) return
    const setUploading = photoNumber === 1 ? setUploading1 : setUploading2
    const setPhoto = photoNumber === 1 ? setPhoto1 : setPhoto2

    setUploading(true)
    try {
      const storageRef = ref(storage, `users/${user.uid}/showcase/photo${photoNumber}_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await updateDoc(doc(db, 'users', user.uid), {
        [`showcasePhoto${photoNumber}`]: url
      })

      setPhoto(url)
    } catch (e) {
      console.error('Failed to upload photo:', e)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (photoNumber: 1 | 2) => {
    if (!user?.uid || !confirm('Remove this photo?')) return
    const setPhoto = photoNumber === 1 ? setPhoto1 : setPhoto2

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`showcasePhoto${photoNumber}`]: ''
      })
      setPhoto('')
    } catch (e) {
      console.error('Failed to delete photo:', e)
      alert('Failed to remove photo.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, photoNumber: 1 | 2) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      uploadPhoto(file, photoNumber)
    }
  }

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
      >
        {first}'s Photo Showcase
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Photo 1 */}
        <div className="relative group">
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
            {uploading1 ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
              </div>
            ) : photo1 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo1} alt="Showcase 1" className="w-full h-full object-cover" />
                <button
                  onClick={() => deletePhoto(1)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  aria-label="Delete photo 1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <Camera className="w-12 h-12 mb-2" style={{ color: '#8B7D7B' }} />
                <p className="text-sm font-semibold" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Add Photo
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 1)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Photo 2 */}
        <div className="relative group">
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
            {uploading2 ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
              </div>
            ) : photo2 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo2} alt="Showcase 2" className="w-full h-full object-cover" />
                <button
                  onClick={() => deletePhoto(2)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  aria-label="Delete photo 2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <Camera className="w-12 h-12 mb-2" style={{ color: '#8B7D7B' }} />
                <p className="text-sm font-semibold" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Add Photo
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 2)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
