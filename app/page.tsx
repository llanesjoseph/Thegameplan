import SimpleHero from '../components/SimpleHero'
import AbstractBackground from '@/components/AbstractBackground'

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative">
      <AbstractBackground />
      <div className="relative z-10">
        <SimpleHero />
      </div>
    </div>
  )
}