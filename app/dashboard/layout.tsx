'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AuthGate from '@/components/auth/AuthGate'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { DashboardBreadcrumb } from '@/components/DashboardBreadcrumb'
import SuperAdminTabs from '@/components/ui/SuperAdminTabs'
import { UserIdentity } from '@/components/user-identity'
import UploadManager from '@/components/UploadManager'

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
 const pathname = usePathname()

 // Pages that handle their own auth and layout (no sidebar)
 const isMainDashboard = pathname === '/dashboard'
 const isOverviewPage = pathname === '/dashboard/overview'
 const isProgressPage = pathname === '/dashboard/progress'
 const isCreatorPage = false // Legacy creator page removed
 const isProfilePage = pathname === '/dashboard/profile'
 const isCoachPage = pathname?.startsWith('/dashboard/coach')
 const isCoachingPage = pathname === '/dashboard/coaching'
 const isAdminPage = pathname?.startsWith('/dashboard/admin')
 const isAthletePage = pathname === '/dashboard/athlete'
 const isAthleteLessonsPage = pathname === '/dashboard/athlete-lessons'
 const isGearPage = pathname === '/dashboard/gear'

 if (isMainDashboard || isOverviewPage || isProgressPage || isCreatorPage || isProfilePage || isCoachPage || isCoachingPage || isAdminPage || isAthletePage || isAthleteLessonsPage || isGearPage) {
  // These pages handle their own auth and layout
  return (
   <>
    {children}
    <UploadManager />
   </>
  )
 }

 // Protected dashboard sub-routes use AuthGate
 return (
  <AuthGate>
   <SuperAdminTabs>
    <div className="min-h-screen bg-clarity-background">
     <DashboardSidebar />
     <div className="xl:pl-56">
      <div className="pt-6 px-6 pb-6">
       <div className="flex items-center justify-between mb-4">
        <DashboardBreadcrumb />
        <UserIdentity />
       </div>
       <div className="clarity-container">
        {children}
       </div>
      </div>
     </div>
    </div>
    <UploadManager />
   </SuperAdminTabs>
  </AuthGate>
 )
}


