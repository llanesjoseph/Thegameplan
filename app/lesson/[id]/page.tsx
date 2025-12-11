import { Suspense } from 'react'
import LessonContent from './LessonContent'
import AppHeader from '@/components/ui/AppHeader'

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
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-4xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark/60 text-lg">Loading lesson...</p>
     </div>
    </div>
   </div>
  }>
   <LessonContent />
  </Suspense>
 )
}
