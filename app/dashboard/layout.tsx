'use client'

import { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { DashboardBreadcrumb } from '@/components/DashboardBreadcrumb'
import SuperAdminTabs from '@/components/ui/SuperAdminTabs'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <SuperAdminTabs>
        <div className="min-h-screen bg-clarity-background">
          <DashboardSidebar />
          <div className="lg:pl-64">
            <div className="pt-16 lg:pt-6 px-6 pb-6">
              <DashboardBreadcrumb />
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


