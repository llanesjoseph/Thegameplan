'use client'

import { useAuth } from '@/hooks/use-auth'

export default function CoachOverview() {
  const { user } = useAuth()
  const first = user?.displayName?.split(' ')[0] || 'Coach'

  return (
    <div className="mb-3">
      <h1
        className="text-2xl sm:text-3xl font-bold mb-1"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Welcome to your coaching hub, {first}!
      </h1>
      <p className="text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
        Manage your athletes, lessons, and sessions in one clean, frameless page.
      </p>
    </div>
  )
}


