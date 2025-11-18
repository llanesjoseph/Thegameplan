'use client'

import AthleteShowcaseCard from '@/components/athlete/AthleteShowcaseCard'

export default function AthleteShowcaseDemoPage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-6xl w-full">
        <AthleteShowcaseCard
          displayName="Joseph Llanes"
          email="joseph@crucibleanalytics.dev"
          sport="Basketball"
          level="Intermediate"
          location="Silicon Valley, California"
          bio="A software engineer turned Silicon Valley COO who has taken multiple companies public and is an active investor in businesses shaping the future of work, technology, and sports. Joseph brings a product-first mindset to every training session, focusing on clarity, feedback, and tangible progress."
          trainingGoals="Sharpen court vision, improve conditioning, and build a highlight-ready offensive toolkit with repeatable game situations."
          profileImageUrl={undefined}
        />
      </div>
    </main>
  )
}


