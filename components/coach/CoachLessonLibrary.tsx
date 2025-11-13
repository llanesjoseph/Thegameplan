'use client'

import { useRouter } from 'next/navigation'

export default function CoachLessonLibrary() {
  const router = useRouter()
  const lessons = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }]

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Your Lesson Library
      </h2>

      <div className="flex flex-wrap gap-4">
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => router.push('/dashboard/coach/lessons/library')}
            className="text-left w-44 md:w-48 lg:w-56"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
              <div className="w-full h-full bg-gray-300" />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              Title
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
              Tap to open
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}


