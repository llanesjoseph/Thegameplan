import { Suspense } from 'react'
import LessonContent from './LessonContent'

// Generate static params for static export
export async function generateStaticParams() {
 // For static export, we'll generate a few common lesson IDs
 // In a real app, you might fetch these from your database
 return [
  { id: '1' },
  { id: '2' },
  { id: '3' },
  { id: '4' },
  { id: '5' }
 ]
}

export default function LessonPage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen bg-white pt-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
     <div className="text-center py-20">
      <div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading lesson...</p>
     </div>
    </div>
   </div>
  }>
   <LessonContent />
  </Suspense>
 )
}
