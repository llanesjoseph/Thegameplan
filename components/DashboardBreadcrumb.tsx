'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const pathMappings: Record<string, string> = {
 '/dashboard': 'Dashboard',
 '/dashboard/overview': 'Overview',
 '/dashboard/creator': 'Lesson Studio',
 '/dashboard/creator/requests': 'Coaching Requests',
 '/dashboard/creator/schedule': 'My Schedule',
 '/dashboard/creator/analytics': 'Analytics',
 '/dashboard/admin': 'Admin Panel',
 '/dashboard/admin/users': 'User Management',
 '/dashboard/admin/content': 'Content Review',
 '/dashboard/admin/analytics': 'Analytics',
 '/dashboard/admin/settings': 'Settings',
 '/dashboard/superadmin': 'Role Management',
 '/dashboard/superadmin/analytics': 'System Analytics',
 '/dashboard/progress': 'My Progress',
 '/dashboard/coaching': 'Request Coaching',
 '/dashboard/schedule': 'My Schedule',
 '/dashboard/profile': 'Profile'
}

export function DashboardBreadcrumb() {
 const pathname = usePathname()
 
 // Skip breadcrumbs for the overview page to keep it clean
 if (pathname === '/dashboard/overview') {
  return null
 }

 if (!pathname) {
  return null
 }

 const pathSegments = pathname.split('/').filter(Boolean)
 const breadcrumbs = []
 
 // Build breadcrumb path
 let currentPath = ''
 for (const segment of pathSegments) {
  currentPath += `/${segment}`
  const title = pathMappings[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
  breadcrumbs.push({
   path: currentPath,
   title,
   isLast: currentPath === pathname
  })
 }

 return (
  <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
   {breadcrumbs.map((crumb, index) => (
    <div key={crumb.path} className="flex items-center gap-2">
     {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
     {crumb.isLast ? (
      <span className=" text-gray-900">{crumb.title}</span>
     ) : (
      <Link 
       href={crumb.path} 
       className="hover:text-gray-700 transition-colors"
      >
       {crumb.title}
      </Link>
     )}
    </div>
   ))}
  </nav>
 )
}