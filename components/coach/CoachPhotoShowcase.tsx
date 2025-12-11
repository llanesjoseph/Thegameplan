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
  const [photo3, setPhoto3] = useState<string>('')
  const [photo4, setPhoto4] = useState<string>('')
  const [uploading1, setUploading1] = useState(false)
  const [uploading2, setUploading2] = useState(false)
  const [uploading3, setUploading3] = useState(false)
  const [uploading4, setUploading4] = useState(false)
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
          setPhoto3(data?.showcasePhoto3 || '')
          setPhoto4(data?.showcasePhoto4 || '')
        }
      } catch (e) {
        console.warn('Failed to load showcase photos:', e)
      }
    }
    load()
  }, [user])

  type PhotoSlot = 1 | 2 | 3 | 4

  const uploadPhoto = async (file: File, photoNumber: PhotoSlot) => {
    if (!user?.uid) return

    const setUploading =
      photoNumber === 1 ? setUploading1 : photoNumber === 2 ? setUploading2 : photoNumber === 3 ? setUploading3 : setUploading4
    const setPhoto =
      photoNumber === 1 ? setPhoto1 : photoNumber === 2 ? setPhoto2 : photoNumber === 3 ? setPhoto3 : setPhoto4

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

  const deletePhoto = async (photoNumber: PhotoSlot) => {
    if (!user?.uid || !confirm('Remove this photo?')) return
    const setPhoto =
      photoNumber === 1 ? setPhoto1 : photoNumber === 2 ? setPhoto2 : photoNumber === 3 ? setPhoto3 : setPhoto4

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, photoNumber: PhotoSlot) => {
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { slot: 1 as PhotoSlot, photo: photo1, uploading: uploading1 },
          { slot: 2 as PhotoSlot, photo: photo2, uploading: uploading2 },
          { slot: 3 as PhotoSlot, photo: photo3, uploading: uploading3 },
          { slot: 4 as PhotoSlot, photo: photo4, uploading: uploading4 }
        ].map(({ slot, photo, uploading }) => (
          <div key={slot} className="relative group">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
              {uploading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
                </div>
              ) : photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Showcase ${slot}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deletePhoto(slot)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    aria-label={`Delete photo ${slot}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                  <Camera className="w-12 h-12 mb-2" style={{ color: '#8B7D7B' }} />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Add Photo
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, slot)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
