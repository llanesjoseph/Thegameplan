'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AuthGate from '@/components/auth/AuthGate'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { DashboardBreadcrumb } from '@/components/DashboardBreadcrumb'
import SuperAdminTabs from '@/components/ui/SuperAdminTabs'
import { UserIdentity } from '@/components/user-identity'

export default function DashboardLayout({ children }: { children: ReactNode }) {
 const pathname = usePathname()

 // Pages that handle their own auth and layout (no sidebar)
 const isMainDashboard = pathname === '/dashboard'
 const isOverviewPage = pathname === '/dashboard/overview'
 const isCreatorPage = pathname === '/dashboard/creator'
 const isProfilePage = pathname === '/dashboard/profile'
 const isCoachProfilePage = pathname === '/dashboard/coach/profile'
 const isCoachAthletesPage = pathname === '/dashboard/coach/athletes'
 const isAdminApplicationsPage = pathname?.startsWith('/dashboard/admin/creator-applications') ||
                                  pathname?.startsWith('/dashboard/admin/coach-applications') ||
                                  pathname?.startsWith('/dashboard/admin/coach-intake')

 if (isMainDashboard || isOverviewPage || isCreatorPage || isProfilePage || isCoachProfilePage || isCoachAthletesPage || isAdminApplicationsPage) {
  // These pages handle their own auth and layout
  return <>{children}</>
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
   </SuperAdminTabs>
  </AuthGate>
 )
}


