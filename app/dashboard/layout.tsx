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

 // The main /dashboard page handles its own authentication
 // Only apply AuthGate to protected dashboard sub-routes
 const isMainDashboard = pathname === '/dashboard'
 const isOverviewPage = pathname === '/dashboard/overview'

 if (isMainDashboard || isOverviewPage) {
  // Main dashboard and overview page handle their own auth and layout
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


