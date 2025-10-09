'use client'
import { useState, useRef, useEffect } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import AdminInvitationManager from '@/components/admin/AdminInvitationManager'
import InvitationsApprovalsUnified from './invitations-approvals/page'
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

// Responsive iframe component with dynamic height based on content
function DynamicIframe({ src, title }: { src: string; title: string }) {
 const iframeRef = useRef<HTMLIFrameElement>(null)
 const [height, setHeight] = useState<string>('60vh')

 useEffect(() => {
  const iframe = iframeRef.current
  if (!iframe) return

  const measureHeight = () => {
   try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDocument) {
     const contentHeight = iframeDocument.documentElement.scrollHeight
     const maxHeight = window.innerHeight * 0.6 // 60% of viewport (moved up from 75%)
     const calculatedHeight = Math.min(contentHeight + 40, maxHeight)
     setHeight(`${calculatedHeight}px`)
    }
   } catch (e) {
    // Cross-origin or access denied - fallback to 60vh
    setHeight('60vh')
   }
  }

  // Multiple measurement attempts for reliability
  iframe.addEventListener('load', () => {
   setTimeout(measureHeight, 100)
   setTimeout(measureHeight, 300)
   setTimeout(measureHeight, 500)
   setTimeout(measureHeight, 1000)
  })

  return () => {
   iframe.removeEventListener('load', measureHeight)
  }
 }, [src])

 return (
  <div className="rounded-xl overflow-hidden shadow-lg w-full" style={{
    height,
    maxHeight: '60vh',
    transition: 'height 0.3s ease'
  }}>
   <iframe
    ref={iframeRef}
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
   id: 'invitations-approvals',
   title: 'Invitations & Approvals',
   description: 'Manage all invitations, applications, and approval workflows',
   icon: UserCheck,
   color: '#20B2AA',
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
   'locker-room': '/dashboard/admin/coaches-locker-room?embedded=true',
   'athletes': '/dashboard/admin/athletes?embedded=true',
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

  // Invitations & Approvals - render directly without iframe
  if (activeSection === 'invitations-approvals') {
   return <InvitationsApprovalsUnified />
  }

  // Admin Invitations uses the component directly
  if (activeSection === 'admin-invites') {
   return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto" style={{
      height: 'auto',
      maxHeight: '60vh'
    }}>
     <h2 className="text-2xl sm:text-3xl font-heading mb-4 sm:mb-6" style={{ color: '#000000' }}>{title}</h2>
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

   <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
    {/* Inline Content Display */}
    {activeSection && (
     <div className="bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
      <button
       onClick={() => setActiveSection(null)}
       className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-50 shadow-lg"
       title="Close"
      >
       <X className="w-5 h-5" style={{ color: '#000000' }} />
      </button>
      {renderInlineContent()}
     </div>
    )}

    {/* Admin Tools Grid */}
    <div>
     <h2 className="text-xl sm:text-2xl font-heading mb-4 sm:mb-6 uppercase tracking-wide" style={{ color: '#000000' }}>
      Admin Tools
     </h2>
     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {adminCards.map((card, index) => {
       const Icon = card.icon
       const isActive = activeSection === card.id

       return (
        <button
         key={index}
         onClick={() => setActiveSection(card.id)}
         className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
        >
         <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-white/50 p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
          <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
           {/* Icon */}
           <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
            style={{ backgroundColor: card.color }}
           >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
           </div>

           {/* Title */}
           <h3 className="text-xs sm:text-sm font-heading mb-1 line-clamp-2" style={{ color: '#000000' }}>
            {card.title}
           </h3>

           {/* Description */}
           <p className="text-[10px] sm:text-xs flex-grow line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
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


