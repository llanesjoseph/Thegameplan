'use client'
import { useState } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import UserSignupTracker from '@/components/admin/UserSignupTracker'
import CoachIngestionManager from '@/components/admin/CoachIngestionManager'
import AdminInvitationManager from '@/components/admin/AdminInvitationManager'
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
  Trophy,
  X
} from 'lucide-react'

export default function AdminDashboard() {
 // Authorization is handled by the layout's AuthGate component
 // No need for additional redirect logic here
 const [activeSection, setActiveSection] = useState<string | null>(null)

 const adminCards = [
  {
   id: 'users',
   title: 'All Users',
   description: 'View and manage all user accounts',
   href: '/dashboard/admin/users',
   icon: Users,
   color: '#91A6EB'
  },
  {
   id: 'roles',
   title: 'Role Management',
   description: 'Assign and modify user roles',
   href: '/dashboard/admin/roles',
   icon: UserCog,
   color: '#20B2AA'
  },
  {
   id: 'analytics',
   title: 'System Analytics',
   description: 'View comprehensive platform analytics',
   href: '/dashboard/admin/analytics',
   icon: BarChart3,
   color: '#FF6B35'
  },
  {
   id: 'invitations',
   title: 'All Invitations',
   description: 'Manage all platform invitations',
   href: '/dashboard/admin/invitations',
   icon: Mail,
   color: '#91A6EB'
  },
  {
   id: 'admin-invites',
   title: 'Admin Invitations',
   description: 'Invite and manage admin team members',
   inline: true,
   icon: UserCheck,
   color: '#20B2AA'
  },
  {
   id: 'coach-applications',
   title: 'Coach Applications',
   description: 'Review and approve coach applications',
   href: '/dashboard/admin/coach-applications',
   icon: FileText,
   color: '#FF6B35'
  },
  {
   id: 'locker-room',
   title: 'Coaches Locker Room',
   description: 'Manage coach resources and tools',
   href: '/dashboard/admin/coaches-locker-room',
   icon: Target,
   color: '#000000'
  },
  {
   id: 'athletes',
   title: 'Athletes',
   description: 'Manage athlete accounts and progress',
   href: '/dashboard/admin/athletes',
   icon: Trophy,
   color: '#91A6EB'
  },
  {
   id: 'requests',
   title: 'Coach Requests',
   description: 'Handle coaching session requests',
   href: '/dashboard/admin/requests',
   icon: MessageSquare,
   color: '#20B2AA'
  },
  {
   id: 'assistant-coaches',
   title: 'Assistant Coaches',
   description: 'Manage assistant coach accounts',
   href: '/dashboard/admin/assistant-coaches',
   icon: Shield,
   color: '#FF6B35'
  },
  {
   id: 'content',
   title: 'Content Management',
   description: 'Review and moderate platform content',
   href: '/dashboard/admin/content',
   icon: Calendar,
   color: '#000000'
  },
  {
   id: 'gear',
   title: 'Curated Gear',
   description: 'Manage recommended gear and equipment',
   href: '/dashboard/admin/curated-gear',
   icon: ShoppingBag,
   color: '#91A6EB'
  },
  {
   id: 'sync',
   title: 'Sync Coaches',
   description: 'Sync coach profiles to public browse page',
   href: '/dashboard/admin/sync-coaches',
   icon: Dumbbell,
   color: '#20B2AA'
  },
  {
   id: 'settings',
   title: 'System Settings',
   description: 'Configure platform-wide settings',
   href: '/dashboard/admin/settings',
   icon: Settings,
   color: '#000000'
  }
 ]

 const renderInlineContent = () => {
  switch (activeSection) {
   case 'admin-invites':
    return <AdminInvitationManager />
   default:
    return null
  }
 }

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   <AppHeader title="Admin Dashboard" subtitle="Full platform control" />

   <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    {/* User Signup Tracker */}
    <UserSignupTracker />

    {/* Coach Ingestion Manager */}
    <CoachIngestionManager />

    {/* Inline Content Display */}
    {activeSection && (
     <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 relative">
      <button
       onClick={() => setActiveSection(null)}
       className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
       title="Close"
      >
       <X className="w-5 h-5" style={{ color: '#000000' }} />
      </button>
      {renderInlineContent()}
     </div>
    )}

    {/* Admin Tools Grid */}
    <div>
     <h2 className="text-2xl font-heading mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
      Admin Tools
     </h2>
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {adminCards.map((card, index) => {
       const Icon = card.icon
       const isActive = activeSection === card.id

       if (card.inline) {
        return (
         <button
          key={index}
          onClick={() => setActiveSection(card.id)}
          className={`block group cursor-pointer text-left ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
         >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 h-full transition-all hover:shadow-2xl hover:scale-105">
           <div className="flex flex-col h-full">
            {/* Icon */}
            <div
             className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center shadow-md"
             style={{ backgroundColor: card.color }}
            >
             <Icon className="w-5 h-5 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-sm font-heading mb-1" style={{ color: '#000000' }}>
             {card.title}
            </h3>

            {/* Description */}
            <p className="text-xs flex-grow" style={{ color: '#000000', opacity: 0.6 }}>
             {card.description}
            </p>
           </div>
          </div>
         </button>
        )
       }

       return (
        <a key={index} href={card.href} className="block group cursor-pointer">
         <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 h-full transition-all hover:shadow-2xl hover:scale-105">
          <div className="flex flex-col h-full">
           {/* Icon */}
           <div
            className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center shadow-md"
            style={{ backgroundColor: card.color }}
           >
            <Icon className="w-5 h-5 text-white" />
           </div>

           {/* Title */}
           <h3 className="text-sm font-heading mb-1" style={{ color: '#000000' }}>
            {card.title}
           </h3>

           {/* Description */}
           <p className="text-xs flex-grow" style={{ color: '#000000', opacity: 0.6 }}>
            {card.description}
           </p>
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


