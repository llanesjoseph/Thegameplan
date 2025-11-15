'use client'

import { useState } from 'react'
import VideoManagementModal from './VideoManagementModal'
import { Plus } from 'lucide-react'

export default function AthleteVideoReviews() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
          Your Video Submissions
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          <Plus className="w-4 h-4" />
          Manage Videos
        </button>
      </div>

      <div className="border-2 border-black rounded-lg p-8 text-center">
        <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
          Submit videos for coach feedback and review previous submissions
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          Open Video Manager
        </button>
      </div>

      {/* Video Management Modal */}
      {showModal && (
        <VideoManagementModal
          onClose={() => setShowModal(false)}
          initialTab="review"
        />
      )}
    </div>
  )
}
