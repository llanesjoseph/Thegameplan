'use client'

/**
 * Athlete Profile Page - Single Point of Truth
 * Clean, frameless design matching the new vision
 * No sidebar, no iframe - direct content rendering
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react'
import AthleteOverview from '@/components/athlete/AthleteOverview'
import AthleteProfile from '@/components/athlete/AthleteProfile'
import AthleteProgress from '@/components/athlete/AthleteProgress'
import AthleteCoaches from '@/components/athlete/AthleteCoaches'
import AthleteTrainingLibrary from '@/components/athlete/AthleteTrainingLibrary'
import AthleteRecommendedGear from '@/components/athlete/AthleteRecommendedGear'
import AthleteAssistant from '@/components/athlete/AthleteAssistant'
import ProfileQuickSetupModal from '@/components/athlete/ProfileQuickSetupModal'
import WelcomePopup from '@/components/athlete/WelcomePopup'

export default function AthleteDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [athleteName, setAthleteName] = useState<string>('')
  const [coachName, setCoachName] = useState<string>('')

  // Redirect non-athletes
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/user/role', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const userRole = data.data.role
            // Redirect non-athletes to their correct dashboard
            if (userRole && ['coach', 'admin', 'superadmin', 'assistant_coach'].includes(userRole)) {
              router.push(userRole === 'admin' || userRole === 'superadmin' ? '/dashboard/admin' : '/dashboard/coach-unified')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkRole()
  }, [user, router])

  useEffect(() => {
    const loadWelcomeData = async () => {
      try {
        const welcomeFlag = localStorage.getItem('athleap_show_welcome_popup')
        if (welcomeFlag === '1') {
          setShowWelcome(true)
          localStorage.removeItem('athleap_show_welcome_popup')
          // Get athlete name and coach name from user data
          if (user) {
            const token = await user.getIdToken()
            fetch('/api/user/role', {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(data => {
              if (data.success && data.data) {
                setAthleteName(data.data.displayName || '')
                setCoachName(data.data.coachName || '')
              }
            }).catch(() => {})
          }
        }

        const quickSetupFlag = localStorage.getItem('athleap_show_quick_profile_setup')
        if (quickSetupFlag === '1' && !welcomeFlag) {
          setShowQuickSetup(true)
        }
      } catch {}
    }
    loadWelcomeData()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean and Simple */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              ATHLEAP
            </span>
          </Link>

          {/* Right Navigation */}
          <nav className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                try {
                  // Smooth-scroll to the inline profile section
                  const el = document.getElementById('athlete-profile-section')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  // Broadcast an event so AthleteProfile can enter edit mode
                  window.dispatchEvent(new CustomEvent('athlete-edit-profile'))
                } catch {
                  // Fallback: just fire the event
                  window.dispatchEvent(new CustomEvent('athlete-edit-profile'))
                }
              }}
              className="hidden md:inline-flex items-center px-4 py-2 rounded-lg border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
            >
              Edit Profile
            </button>
            <Link
              href="/coaches"
              className="hidden md:block text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}
            >
              Browse Coaches
            </Link>
            <button
              onClick={async () => {
                if (isSigningOut) return
                setIsSigningOut(true)
                // brief farewell then sign out
                setTimeout(async () => {
                  try {
                    await signOut(auth)
                  } catch (e) {
                    console.error('Sign out failed:', e)
                  } finally {
                    window.location.href = '/'
                  }
                }, 900)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isSigningOut ? 'bg-gray-800 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              aria-live="polite"
            >
              {isSigningOut ? 'Goodbye…' : 'Sign Out'}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Clean and Frameless */}
      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full max-w-5xl mx-auto space-y-5">
            {/* Welcome Header */}
            <AthleteOverview />

            {/* Athlete Profile Section */}
            <AthleteProfile />
            {/* Your Progress Section */}
            <AthleteProgress />
            {/* Your Coaches Section */}
            <AthleteCoaches />
            {/* Your Training Library Section */}
            <AthleteTrainingLibrary />
            {/* Recommended Gear Section */}
            <AthleteRecommendedGear />

            {/* Social Media Icons */}
            <div className="flex items-center gap-4 pt-4">
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            {/* Floating chat launcher (no inline container) */}
            <AthleteAssistant />
          </div>
        </div>
      </main>

      {/* Welcome popup - shows after first onboarding */}
      {showWelcome && (
        <WelcomePopup
          athleteName={athleteName}
          coachName={coachName}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Optional profile quick-setup modal, stays on this page */}
      <ProfileQuickSetupModal
        isOpen={showQuickSetup && !showWelcome}
        onClose={() => setShowQuickSetup(false)}
      />
    </div>
  )
}
