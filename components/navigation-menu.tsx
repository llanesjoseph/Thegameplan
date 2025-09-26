'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export function NavigationMenu() {
 const { user } = useAuth()

 return (
  <div className="flex items-center gap-8">
   <Link href="/contributors" className="nexus-nav-link">
    Coaches
   </Link>
   <Link href="/gear" className="nexus-nav-link">
    Gear 
   </Link>
   {!user && (
    <Link href="/subscribe" className="nexus-nav-link">
     Subscribe
    </Link>
   )}
   <Link href="/dashboard" className="nexus-nav-link">
    Dashboard
   </Link>
  </div>
 )
}