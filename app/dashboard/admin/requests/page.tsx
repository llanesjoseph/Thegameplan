'use client'

import { useState, useEffect } from 'react'
import { collection, query, getDocs, updateDoc, doc, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
 MessageSquare,
 Clock,
 CheckCircle2,
 AlertCircle,
 Send,
 User,
 Calendar,
 Filter,
 Search
} from 'lucide-react'

interface AdminRequest {
 id: string
 userId: string
 userEmail: string
 userName: string
 type: 'technical' | 'content' | 'account' | 'billing' | 'feature' | 'other'
 priority: 'low' | 'medium' | 'high' | 'urgent'
 subject: string
 description: string
 status: 'open' | 'in_progress' | 'resolved' | 'closed'
 createdAt: Date
 updatedAt: Date
 adminResponse?: string
 adminId?: string
 resolvedAt?: Date
}

const requestTypes = [
 { value: 'technical', label: 'Technical Support' },
 { value: 'content', label: 'Content Issue' },
 { value: 'account', label: 'Account Help' },
 { value: 'billing', label: 'Billing Question' },
 { value: 'feature', label: 'Feature Request' },
 { value: 'other', label: 'Other' }
]

const priorities = [
 { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
 { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
 { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
 { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const statusOptions = [
 { value: 'open', label: 'Open', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
 { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'bg-blue-100 text-blue-800' },
 { value: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
 { value: 'closed', label: 'Closed', icon: CheckCircle2, color: 'bg-gray-100 text-gray-800' }
]

export default function AdminRequestsPage() {
 const { user } = useAuth()
 const { role } = useEnhancedRole()
 const [requests, setRequests] = useState<AdminRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
 const [adminResponse, setAdminResponse] = useState('')
 const [newStatus, setNewStatus] = useState('')
 const [submitting, setSubmitting] = useState(false)
 const [filterType, setFilterType] = useState('all')
 const [filterPriority, setFilterPriority] = useState('all')

 useEffect(() => {
  if (user && (role === 'superadmin' || role === 'admin')) {
   fetchAllRequests()
  }
 }, [user, role])

 const fetchAllRequests = async () => {
  try {
   const requestsQuery = query(
    collection(db, 'requests'),
    orderBy('createdAt', 'desc')
   )

   const snapshot = await getDocs(requestsQuery)
   const allRequests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    resolvedAt: doc.data().resolvedAt?.toDate() || null
   })) as AdminRequest[]

   setRequests(allRequests)
  } catch (error) {
   console.error('Error fetching requests:', error)
  } finally {
   setLoading(false)
  }
 }

 const updateRequest = async (requestId: string, updates: any) => {
  try {
   setSubmitting(true)
   const requestRef = doc(db, 'requests', requestId)

   const updateData = {
    ...updates,
    adminId: user?.uid,
    updatedAt: new Date()
   }

   if (updates.status === 'resolved' || updates.status === 'closed') {
    updateData.resolvedAt = new Date()
   }

   await updateDoc(requestRef, updateData)
   await fetchAllRequests()
   setSelectedRequest(null)
   setAdminResponse('')
   setNewStatus('')
  } catch (error) {
   console.error('Error updating request:', error)
  } finally {
   setSubmitting(false)
  }
 }

 const getStatusColor = (status: string) => {
  const statusOption = statusOptions.find(s => s.value === status)
  return statusOption?.color || 'bg-gray-100 text-gray-800'
 }

 const getPriorityColor = (priority: string) => {
  const priorityOption = priorities.find(p => p.value === priority)
  return priorityOption?.color || 'bg-gray-100 text-gray-800'
 }

 const filteredRequests = requests.filter(request => {
  if (filterType !== 'all' && request.type !== filterType) return false
  if (filterPriority !== 'all' && request.priority !== filterPriority) return false
  return true
 })

 const getRequestCounts = () => {
  return {
   total: requests.length,
   open: requests.filter(r => r.status === 'open').length,
   inProgress: requests.filter(r => r.status === 'in_progress').length,
   resolved: requests.filter(r => r.status === 'resolved').length,
   urgent: requests.filter(r => r.priority === 'urgent').length
  }
 }

 if (role !== 'superadmin' && role !== 'admin') {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
     <h1 className="text-2xl mb-4 font-heading" style={{ color: '#000000' }}>Access Denied</h1>
     <p style={{ color: '#000000', opacity: 0.7 }}>This page is only available to administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading requests...</p>
    </div>
   </div>
  )
 }

 const counts = getRequestCounts()

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="Request Management" subtitle="Manage and respond to user support requests" />
   <main className="max-w-7xl mx-auto px-6 py-8">
    <div className="space-y-6">

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>{counts.total}</div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Requests</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>{counts.open}</div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Open</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#91A6EB' }}>{counts.inProgress}</div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>In Progress</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#20B2AA' }}>{counts.resolved}</div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Resolved</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl font-heading mb-2" style={{ color: '#FF6B35' }}>{counts.urgent}</div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Urgent</div>
     </div>
    </div>

    {/* Filters */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
     <div className="flex gap-4 items-center">
      <div className="flex items-center gap-2">
       <Filter className="h-4 w-4" style={{ color: '#000000', opacity: 0.7 }} />
       <span className="text-sm font-semibold" style={{ color: '#000000' }}>Filters:</span>
      </div>
      <select
       value={filterType}
       onChange={(e) => setFilterType(e.target.value)}
       className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
       style={{ color: '#000000' }}
      >
       <option value="all">All Types</option>
       {requestTypes.map(type => (
        <option key={type.value} value={type.value}>
         {type.label}
        </option>
       ))}
      </select>
      <select
       value={filterPriority}
       onChange={(e) => setFilterPriority(e.target.value)}
       className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
       style={{ color: '#000000' }}
      >
       <option value="all">All Priorities</option>
       {priorities.map(priority => (
        <option key={priority.value} value={priority.value}>
         {priority.label}
        </option>
       ))}
      </select>
     </div>
    </div>

    {/* Requests List */}
    <Tabs defaultValue="all" className="space-y-4">
     <TabsList>
      <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
      <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
      <TabsTrigger value="in_progress">In Progress ({counts.inProgress})</TabsTrigger>
      <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
     </TabsList>

     <TabsContent value="all" className="space-y-4">
      {filteredRequests.length === 0 ? (
       <Card>
        <CardContent className="py-12 text-center">
         <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
         <h3 className="text-lg  mb-2">No Requests</h3>
         <p className="text-gray-600">No support requests match your current filters.</p>
        </CardContent>
       </Card>
      ) : (
       filteredRequests.map(request => (
        <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
         <CardHeader onClick={() => setSelectedRequest(request)}>
          <div className="flex justify-between items-start">
           <div>
            <CardTitle className="text-lg flex items-center gap-2">
             <User className="h-4 w-4" />
             {request.subject}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
             <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {request.createdAt.toLocaleDateString()}
             </span>
             <span>{request.userName} ({request.userEmail})</span>
             <span>{requestTypes.find(t => t.value === request.type)?.label}</span>
            </CardDescription>
           </div>
           <div className="flex gap-2">
            <Badge className={getPriorityColor(request.priority)}>
             {priorities.find(p => p.value === request.priority)?.label}
            </Badge>
            <Badge className={getStatusColor(request.status)}>
             {statusOptions.find(s => s.value === request.status)?.label}
            </Badge>
           </div>
          </div>
         </CardHeader>

         {selectedRequest?.id === request.id && (
          <CardContent className="border-t">
           <div className="space-y-4">
            <div>
             <h4 className=" mb-2">Description</h4>
             <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{request.description}</p>
            </div>

            {request.adminResponse && (
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className=" mb-2 text-blue-900">Previous Admin Response</h4>
              <p className="text-blue-800 text-sm">{request.adminResponse}</p>
             </div>
            )}

            <div className="space-y-4">
             <div>
              <label className="block text-sm  mb-2">Admin Response</label>
              <Textarea
               value={adminResponse}
               onChange={(e) => setAdminResponse(e.target.value)}
               placeholder="Enter your response to the user..."
               rows={3}
              />
             </div>

             <div>
              <label className="block text-sm  mb-2">Update Status</label>
              <select
               value={newStatus}
               onChange={(e) => setNewStatus(e.target.value)}
               className="flex h-10 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
               <option value="">Change status</option>
               {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                 {status.label}
                </option>
               ))}
              </select>
             </div>

             <div className="flex gap-2">
              <Button
               onClick={() => updateRequest(request.id, {
                adminResponse: adminResponse || request.adminResponse,
                status: newStatus || request.status
               })}
               disabled={submitting || (!adminResponse && !newStatus)}
               className="flex items-center gap-2"
              >
               <Send className="h-4 w-4" />
               {submitting ? 'Updating...' : 'Update Request'}
              </Button>
              <Button
               variant="outline"
               onClick={() => {
                setSelectedRequest(null)
                setAdminResponse('')
                setNewStatus('')
               }}
              >
               Cancel
              </Button>
             </div>
            </div>
           </div>
          </CardContent>
         )}
        </Card>
       ))
      )}
     </TabsContent>

     {/* Filter tabs for different statuses */}
     {['open', 'in_progress', 'resolved'].map(status => (
      <TabsContent key={status} value={status} className="space-y-4">
       {filteredRequests.filter(r => r.status === status).map(request => (
        <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
         <CardHeader onClick={() => setSelectedRequest(request)}>
          <div className="flex justify-between items-start">
           <div>
            <CardTitle className="text-lg flex items-center gap-2">
             <User className="h-4 w-4" />
             {request.subject}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
             <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {request.createdAt.toLocaleDateString()}
             </span>
             <span>{request.userName} ({request.userEmail})</span>
             <span>{requestTypes.find(t => t.value === request.type)?.label}</span>
            </CardDescription>
           </div>
           <div className="flex gap-2">
            <Badge className={getPriorityColor(request.priority)}>
             {priorities.find(p => p.value === request.priority)?.label}
            </Badge>
            <Badge className={getStatusColor(request.status)}>
             {statusOptions.find(s => s.value === request.status)?.label}
            </Badge>
           </div>
          </div>
         </CardHeader>

         {selectedRequest?.id === request.id && (
          <CardContent className="border-t">
           <div className="space-y-4">
            <div>
             <h4 className=" mb-2">Description</h4>
             <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{request.description}</p>
            </div>

            {request.adminResponse && (
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className=" mb-2 text-blue-900">Previous Admin Response</h4>
              <p className="text-blue-800 text-sm">{request.adminResponse}</p>
             </div>
            )}

            <div className="space-y-4">
             <div>
              <label className="block text-sm  mb-2">Admin Response</label>
              <Textarea
               value={adminResponse}
               onChange={(e) => setAdminResponse(e.target.value)}
               placeholder="Enter your response to the user..."
               rows={3}
              />
             </div>

             <div>
              <label className="block text-sm  mb-2">Update Status</label>
              <select
               value={newStatus}
               onChange={(e) => setNewStatus(e.target.value)}
               className="flex h-10 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
               <option value="">Change status</option>
               {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                 {status.label}
                </option>
               ))}
              </select>
             </div>

             <div className="flex gap-2">
              <Button
               onClick={() => updateRequest(request.id, {
                adminResponse: adminResponse || request.adminResponse,
                status: newStatus || request.status
               })}
               disabled={submitting || (!adminResponse && !newStatus)}
               className="flex items-center gap-2"
              >
               <Send className="h-4 w-4" />
               {submitting ? 'Updating...' : 'Update Request'}
              </Button>
              <Button
               variant="outline"
               onClick={() => {
                setSelectedRequest(null)
                setAdminResponse('')
                setNewStatus('')
               }}
              >
               Cancel
              </Button>
             </div>
            </div>
           </div>
          </CardContent>
         )}
        </Card>
       ))}
      </TabsContent>
     ))}
    </Tabs>
    </div>
   </div>
  </div>
 )
}