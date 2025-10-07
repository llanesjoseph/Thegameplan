'use client'
import AppHeader from '@/components/ui/AppHeader'
import UserSignupTracker from '@/components/admin/UserSignupTracker'
import CoachIngestionManager from '@/components/admin/CoachIngestionManager'
import { Users, Mail, Calendar, BarChart3, UserCheck, Target } from 'lucide-react'

export default function AdminDashboard() {
 // Authorization is handled by the layout's AuthGate component
 // No need for additional redirect logic here

 const adminCards = [
  {
   title: 'User Management',
   description: 'Manage user accounts and permissions',
   href: '/dashboard/admin/users',
   icon: Users,
   color: '#91A6EB'
  },
  {
   title: 'Admin Invitations',
   description: 'Invite and manage admin team members',
   href: '/dashboard/admin/admin-invites',
   icon: UserCheck,
   color: '#20B2AA'
  },
  {
   title: 'Athlete Invitations',
   description: 'View all athlete invitations across coaches',
   href: '/dashboard/admin/invitations',
   icon: Mail,
   color: '#FF6B35'
  },
  {
   title: 'Sync Coaches',
   description: 'Sync coach profiles to public browse page',
   href: '/dashboard/admin/sync-coaches',
   icon: Target,
   color: '#20B2AA'
  },
  {
   title: 'Content Review',
   description: 'Review and moderate content',
   href: '/dashboard/admin/content',
   icon: Calendar,
   color: '#000000'
  },
  {
   title: 'Analytics',
   description: 'View platform analytics and insights',
   href: '/dashboard/admin/analytics',
   icon: BarChart3,
   color: '#91A6EB'
  }
 ]

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   <AppHeader />

   {/* Header Section */}
   <div className="text-center py-12 px-6">
    <h1 className="text-4xl mb-4 font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
     Admin Dashboard
    </h1>
    <p className="text-lg" style={{ color: '#000000' }}>
     Manage creators, content, sponsors, and reviews
    </p>
   </div>

   <main className="max-w-7xl mx-auto px-6 pb-12 space-y-8">
    {/* User Signup Tracker */}
    <UserSignupTracker />

    {/* Coach Ingestion Manager */}
    <CoachIngestionManager />

    {/* Admin Tools Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {adminCards.map((card, index) => {
      const Icon = card.icon
      return (
       <a key={index} href={card.href} className="block group cursor-pointer">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 h-full transition-all hover:shadow-2xl hover:scale-105">
         <div className="flex flex-col h-full">
          {/* Icon */}
          <div
           className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg"
           style={{ backgroundColor: card.color }}
          >
           <Icon className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
           {card.title}
          </h3>

          {/* Description */}
          <p className="text-sm flex-grow" style={{ color: '#000000', opacity: 0.7 }}>
           {card.description}
          </p>

          {/* Arrow Indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: card.color }}>
           <span>Open</span>
           <span className="text-lg">→</span>
          </div>
         </div>
        </div>
       </a>
      )
     })}
    </div>
   </main>
  </div>
 )
}


