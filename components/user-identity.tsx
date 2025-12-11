'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import UserProfileDropdown from '@/components/ui/UserProfileDropdown'

export function UserIdentity() {
 const { user, loading } = useAuth()
 
 if (loading) {
  return <div className="w-20 h-9 bg-slate-200 rounded animate-pulse"></div>
 }
 
 if (!user) {
  return (
   <Link 
    href="/dashboard" 
    className="nexus-btn nexus-btn-primary nexus-ripple"
   >
    Sign In
   </Link>
  )
 }
 
 return <UserProfileDropdown />
}
