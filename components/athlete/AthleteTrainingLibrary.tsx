'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { BookOpen } from 'lucide-react'

export default function AthleteTrainingLibrary() {
  const { user } = useAuth()
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTrainingLibrary = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Get athlete's coach ID
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const coachId = userData?.coachId || userData?.assignedCoachId

          if (coachId) {
            // Fetch coach's published lessons
            const lessonsQuery = query(
              collection(db, 'content'),
              where('creatorUid', '==', coachId),
              where('status', '==', 'published')
            )
            const lessonsSnap = await getDocs(lessonsQuery)
            const lessonsData = lessonsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              title: doc.data().title || 'Title',
              author: doc.data().creatorName || 'Author'
            }))
            setLessons(lessonsData.slice(0, 4)) // Show first 4
          }
        }
      } catch (error) {
        console.error('Error loading training library:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrainingLibrary()
  }, [user])

  const handleViewLesson = (lessonId: string) => {
    router.push(`/dashboard/athlete-lessons?lesson=${lessonId}`)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Your Training Library
      </h2>
      
      {loading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '1/1' }}></div>
          ))}
        </div>
      ) : lessons.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleViewLesson(lesson.id)}
              className="text-left group w-44 md:w-48 lg:w-56"
            >
              <div className="w-full rounded-lg overflow-hidden bg-gray-100 mb-1" style={{ aspectRatio: '1/1' }}>
                {lesson.thumbnailUrl ? (
                  <img
                    src={lesson.thumbnailUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: '#E5E5E5' }}>
                    {/* Placeholder for training library image */}
                    <div className="w-full h-full bg-gray-300"></div>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {lesson.title}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {lesson.author}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No training content available yet</p>
      )}
    </div>
  )
}

