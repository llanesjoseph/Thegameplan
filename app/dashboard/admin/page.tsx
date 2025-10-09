'use client'
import { useState } from 'react'
import AppHeader from '@/components/ui/AppHeader'
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

// Simple iframe component with fixed responsive height
function DynamicIframe({ src, title }: { src: string; title: string }) {
 return (
  <div className="rounded-xl overflow-hidden shadow-lg" style={{ height: '70vh', maxHeight: '75vh' }}>
   <iframe
    src={src}
    className="w-full h-full border-0"
    title={title}
   />
  </div>
 )
}

export default function AdminDashboard() {
 // Authorization is handled by the layout's AuthGate component
 // No need for additional redirect logic here
 const [activeSection, setActiveSection] = useState<string | null>(null)

 const adminCards = [
  {
   id: 'users',
   title: 'All Users',
   description: 'View and manage all user accounts',
   icon: Users,
   color: '#91A6EB',
   inline: true
  },
  {
   id: 'roles',
   title: 'Role Management',
   description: 'Assign and modify user roles',
   icon: UserCog,
   color: '#20B2AA',
   inline: true
  },
  {
   id: 'analytics',
   title: 'System Analytics',
   description: 'View comprehensive platform analytics',
   icon: BarChart3,
   color: '#FF6B35',
   inline: true
  },
  {
   id: 'invitations',
   title: 'All Invitations',
   description: 'Manage all platform invitations',
   icon: Mail,
   color: '#91A6EB',
   inline: true
  },
  {
   id: 'admin-invites',
   title: 'Admin Invitations',
   description: 'Invite and manage admin team members',
   icon: UserCheck,
   color: '#20B2AA',
   inline: true
  },
  {
   id: 'coach-applications',
   title: 'Coach Applications',
   description: 'Review and approve coach applications',
   icon: FileText,
   color: '#FF6B35',
   inline: true
  },
  {
   id: 'locker-room',
   title: 'Coaches Locker Room',
   description: 'Manage coach resources and tools',
   icon: Target,
   color: '#000000',
   inline: true
  },
  {
   id: 'athletes',
   title: 'Athletes',
   description: 'Manage athlete accounts and progress',
   icon: Trophy,
   color: '#91A6EB',
   inline: true
  },
  {
   id: 'requests',
   title: 'Coach Requests',
   description: 'Handle coaching session requests',
   icon: MessageSquare,
   color: '#20B2AA',
   inline: true
  },
  {
   id: 'assistant-coaches',
   title: 'Assistant Coaches',
   description: 'Manage assistant coach accounts',
   icon: Shield,
   color: '#FF6B35',
   inline: true
  },
  {
   id: 'content',
   title: 'Content Management',
   description: 'Review and moderate platform content',
   icon: Calendar,
   color: '#000000',
   inline: true
  },
  {
   id: 'gear',
   title: 'Curated Gear',
   description: 'Manage recommended gear and equipment',
   icon: ShoppingBag,
   color: '#91A6EB',
   inline: true
  },
  {
   id: 'sync',
   title: 'Sync Coaches',
   description: 'Sync coach profiles to public browse page',
   icon: Dumbbell,
   color: '#20B2AA',
   inline: true
  },
  {
   id: 'settings',
   title: 'System Settings',
   description: 'Configure platform-wide settings',
   icon: Settings,
   color: '#000000',
   inline: true
  }
 ]

 const getSectionPath = (sectionId: string) => {
  const pathMap: Record<string, string> = {
   'users': '/dashboard/admin/users?embedded=true',
   'roles': '/dashboard/admin/roles?embedded=true',
   'analytics': '/dashboard/admin/analytics?embedded=true',
   'invitations': '/dashboard/admin/invitations?embedded=true',
   'coach-applications': '/dashboard/admin/coach-applications?embedded=true',
   'locker-room': '/dashboard/admin/coaches-locker-room?embedded=true',
   'athletes': '/dashboard/admin/athletes?embedded=true',
   'requests': '/dashboard/admin/requests?embedded=true',
   'assistant-coaches': '/dashboard/admin/assistant-coaches?embedded=true',
   'content': '/dashboard/admin/content?embedded=true',
   'gear': '/dashboard/admin/curated-gear?embedded=true',
   'sync': '/dashboard/admin/sync-coaches?embedded=true',
   'settings': '/dashboard/admin/settings?embedded=true'
  }
  return pathMap[sectionId]
 }

 const renderInlineContent = () => {
  if (!activeSection) return null

  const activeCard = adminCards.find(card => card.id === activeSection)
  const title = activeCard?.title || 'Section'

  // Admin Invitations uses the component directly
  if (activeSection === 'admin-invites') {
   return (
    <div className="p-8 overflow-y-auto" style={{ maxHeight: '75vh', minHeight: '400px' }}>
     <h2 className="text-3xl font-heading mb-6" style={{ color: '#000000' }}>{title}</h2>
     <AdminInvitationManager />
    </div>
   )
  }

  // All other sections load via iframe
  const sectionPath = getSectionPath(activeSection)
  if (sectionPath) {
   return <DynamicIframe src={sectionPath} title={title} />
  }

  return null
 }

 return (
  <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
   <AppHeader title="Admin Dashboard" subtitle="Full platform control" />

   <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    {/* Inline Content Display */}
    {activeSection && (
     <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
      <button
       onClick={() => setActiveSection(null)}
       className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-50 shadow-lg"
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

       return (
        <button
         key={index}
         onClick={() => setActiveSection(card.id)}
         className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
        >
         <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
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
      })}
     </div>
    </div>
   </main>
  </div>
 )
}


