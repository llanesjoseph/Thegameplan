'use client'
import AppHeader from '@/components/ui/AppHeader'
import UserSignupTracker from '@/components/admin/UserSignupTracker'
import CoachIngestionManager from '@/components/admin/CoachIngestionManager'
import {
  Users,
  Mail,
  Calendar,
  BarChart3,
  UserCheck,
  Target,
  Shield,
  Dumbbell,
  UserCog,
  MessageSquare,
  ShoppingBag,
  Settings,
  FileText,
  Trophy
} from 'lucide-react'

export default function AdminDashboard() {
 // Authorization is handled by the layout's AuthGate component
 // No need for additional redirect logic here

 const adminCards = [
  {
   title: 'All Users',
   description: 'View and manage all user accounts',
   href: '/dashboard/admin/users',
   icon: Users,
   color: '#91A6EB'
  },
  {
   title: 'Role Management',
   description: 'Assign and modify user roles',
   href: '/dashboard/admin/role-management',
   icon: UserCog,
   color: '#20B2AA'
  },
  {
   title: 'System Analytics',
   description: 'View comprehensive platform analytics',
   href: '/dashboard/admin/analytics',
   icon: BarChart3,
   color: '#FF6B35'
  },
  {
   title: 'All Invitations',
   description: 'Manage all platform invitations',
   href: '/dashboard/admin/invitations',
   icon: Mail,
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
   title: 'Coach Applications',
   description: 'Review and approve coach applications',
   href: '/dashboard/admin/coach-applications',
   icon: FileText,
   color: '#FF6B35'
  },
  {
   title: 'Coaches Locker Room',
   description: 'Manage coach resources and tools',
   href: '/dashboard/admin/coaches-locker-room',
   icon: Target,
   color: '#000000'
  },
  {
   title: 'Athletes',
   description: 'Manage athlete accounts and progress',
   href: '/dashboard/admin/athletes',
   icon: Trophy,
   color: '#91A6EB'
  },
  {
   title: 'Coach Requests',
   description: 'Handle coaching session requests',
   href: '/dashboard/admin/coach-requests',
   icon: MessageSquare,
   color: '#20B2AA'
  },
  {
   title: 'Assistant Coaches',
   description: 'Manage assistant coach accounts',
   href: '/dashboard/admin/assistant-coaches',
   icon: Shield,
   color: '#FF6B35'
  },
  {
   title: 'Content Management',
   description: 'Review and moderate platform content',
   href: '/dashboard/admin/content',
   icon: Calendar,
   color: '#000000'
  },
  {
   title: 'Curated Gear',
   description: 'Manage recommended gear and equipment',
   href: '/dashboard/admin/curated-gear',
   icon: ShoppingBag,
   color: '#91A6EB'
  },
  {
   title: 'Sync Coaches',
   description: 'Sync coach profiles to public browse page',
   href: '/dashboard/admin/sync-coaches',
   icon: Dumbbell,
   color: '#20B2AA'
  },
  {
   title: 'System Settings',
   description: 'Configure platform-wide settings',
   href: '/dashboard/admin/settings',
   icon: Settings,
   color: '#000000'
  }
 ]

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   <AppHeader title="Admin Dashboard" subtitle="Full platform control" />

   <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    {/* User Signup Tracker */}
    <UserSignupTracker />

    {/* Coach Ingestion Manager */}
    <CoachIngestionManager />

    {/* Admin Tools Grid */}
    <div>
     <h2 className="text-2xl font-heading mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
      Admin Tools
     </h2>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
           <h3 className="text-lg font-heading mb-2" style={{ color: '#000000' }}>
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
    </div>
   </main>
  </div>
 )
}


