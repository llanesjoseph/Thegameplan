'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { Crown, ArrowRight } from 'lucide-react'

export default function ApplyCoachButton() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()

  // Don't show for coaches or if not authenticated
  if (!user || role === 'creator' || role === 'admin' || role === 'superadmin') {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-black to-sky-blue rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Crown className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Ready to Become a Coach?</h3>
          <p className="text-white/80 mb-4">
            Share your expertise and help athletes reach their potential. Apply to join our coaching community.
          </p>
          <Link
            href="/dashboard/apply-coach"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/30"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}