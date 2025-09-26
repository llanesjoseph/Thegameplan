'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Send, Plus } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

interface UserRequest {
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

export default function UserRequestsPage() {
 const { user } = useAuth()
 const [requests, setRequests] = useState<UserRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [showNewRequest, setShowNewRequest] = useState(false)
 const [newRequest, setNewRequest] = useState({
  type: '',
  priority: 'medium',
  subject: '',
  description: ''
 })
 const [submitting, setSubmitting] = useState(false)

 useEffect(() => {
  if (user) {
   fetchUserRequests()
  }
 }, [user])

 const fetchUserRequests = async () => {
  if (!user) return

  try {
   const requestsQuery = query(
    collection(db, 'requests'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
   )

   const snapshot = await getDocs(requestsQuery)
   const userRequests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    resolvedAt: doc.data().resolvedAt?.toDate() || null
   })) as UserRequest[]

   setRequests(userRequests)
  } catch (error) {
   console.error('Error fetching requests:', error)
  } finally {
   setLoading(false)
  }
 }

 const submitRequest = async () => {
  if (!user || !newRequest.type || !newRequest.subject || !newRequest.description) return

  try {
   setSubmitting(true)

   const requestData = {
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName || user.email || 'Anonymous',
    type: newRequest.type,
    priority: newRequest.priority,
    subject: newRequest.subject,
    description: newRequest.description,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
   }

   await addDoc(collection(db, 'requests'), requestData)

   // Reset form
   setNewRequest({
    type: '',
    priority: 'medium',
    subject: '',
    description: ''
   })
   setShowNewRequest(false)

   // Refresh requests
   await fetchUserRequests()
  } catch (error) {
   console.error('Error submitting request:', error)
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

 if (loading) {
  return (
   <div>
    <AppHeader />
    <div className="container mx-auto py-8">
     <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-4">
       {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded"></div>
       ))}
      </div>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div>
   <AppHeader />
   <div className="container mx-auto py-8">
    <div className="space-y-6">
    <div className="flex justify-between items-center">
     <div>
      <h1 className="text-3xl ">Support Requests</h1>
      <p className="text-gray-600">Manage your support tickets and requests</p>
     </div>
     <Button
      onClick={() => setShowNewRequest(true)}
      className="flex items-center gap-2"
     >
      <Plus className="h-4 w-4" />
      New Request
     </Button>
    </div>

    {/* New Request Form */}
    {showNewRequest && (
     <Card>
      <CardHeader>
       <CardTitle>Submit New Request</CardTitle>
       <CardDescription>Describe your issue or question in detail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium mb-2">Request Type</label>
         <select
          value={newRequest.type}
          onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
         >
          <option value="">Select request type</option>
          {requestTypes.map(type => (
           <option key={type.value} value={type.value}>
            {type.label}
           </option>
          ))}
         </select>
        </div>
        <div>
         <label className="block text-sm font-medium mb-2">Priority</label>
         <select
          value={newRequest.priority}
          onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
         >
          <option value="">Select priority</option>
          {priorities.map(priority => (
           <option key={priority.value} value={priority.value}>
            {priority.label}
           </option>
          ))}
         </select>
        </div>
       </div>

       <div>
        <label className="block text-sm font-medium mb-2">Subject</label>
        <Input
         value={newRequest.subject}
         onChange={(e) => setNewRequest({...newRequest, subject: e.target.value})}
         placeholder="Brief description of your issue"
        />
       </div>

       <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
         value={newRequest.description}
         onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
         placeholder="Provide detailed information about your request..."
         rows={4}
        />
       </div>

       <div className="flex gap-2">
        <Button
         onClick={submitRequest}
         disabled={submitting || !newRequest.type || !newRequest.subject || !newRequest.description}
         className="flex items-center gap-2"
        >
         <Send className="h-4 w-4" />
         {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
        <Button
         variant="outline"
         onClick={() => setShowNewRequest(false)}
        >
         Cancel
        </Button>
       </div>
      </CardContent>
     </Card>
    )}

    {/* Requests List */}
    <Tabs defaultValue="all" className="space-y-4">
     <TabsList>
      <TabsTrigger value="all">All Requests</TabsTrigger>
      <TabsTrigger value="open">Open</TabsTrigger>
      <TabsTrigger value="in_progress">In Progress</TabsTrigger>
      <TabsTrigger value="resolved">Resolved</TabsTrigger>
     </TabsList>

     <TabsContent value="all" className="space-y-4">
      {requests.length === 0 ? (
       <Card>
        <CardContent className="py-12 text-center">
         <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
         <h3 className="text-lg font-medium mb-2">No Requests Yet</h3>
         <p className="text-gray-600">Submit your first support request to get help with any issues.</p>
        </CardContent>
       </Card>
      ) : (
       requests.map(request => (
        <Card key={request.id}>
         <CardHeader>
          <div className="flex justify-between items-start">
           <div>
            <CardTitle className="text-lg">{request.subject}</CardTitle>
            <CardDescription>
             {requestTypes.find(t => t.value === request.type)?.label} •
             Created {request.createdAt.toLocaleDateString()}
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
         <CardContent>
          <div className="space-y-4">
           <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-600 text-sm">{request.description}</p>
           </div>

           {request.adminResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
             <h4 className="font-medium mb-2 text-blue-900">Admin Response</h4>
             <p className="text-blue-800 text-sm">{request.adminResponse}</p>
             {request.resolvedAt && (
              <p className="text-xs text-blue-600 mt-2">
               Resolved on {request.resolvedAt.toLocaleDateString()}
              </p>
             )}
            </div>
           )}

           <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Request #{request.id.slice(-8)}</span>
            <span>Last updated {request.updatedAt.toLocaleDateString()}</span>
           </div>
          </div>
         </CardContent>
        </Card>
       ))
      )}
     </TabsContent>

     {/* Filter tabs for different statuses */}
     {['open', 'in_progress', 'resolved'].map(status => (
      <TabsContent key={status} value={status} className="space-y-4">
       {requests.filter(r => r.status === status).map(request => (
        <Card key={request.id}>
         <CardHeader>
          <div className="flex justify-between items-start">
           <div>
            <CardTitle className="text-lg">{request.subject}</CardTitle>
            <CardDescription>
             {requestTypes.find(t => t.value === request.type)?.label} •
             Created {request.createdAt.toLocaleDateString()}
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
         <CardContent>
          <div className="space-y-4">
           <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-600 text-sm">{request.description}</p>
           </div>

           {request.adminResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
             <h4 className="font-medium mb-2 text-blue-900">Admin Response</h4>
             <p className="text-blue-800 text-sm">{request.adminResponse}</p>
             {request.resolvedAt && (
              <p className="text-xs text-blue-600 mt-2">
               Resolved on {request.resolvedAt.toLocaleDateString()}
              </p>
             )}
            </div>
           )}

           <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Request #{request.id.slice(-8)}</span>
            <span>Last updated {request.updatedAt.toLocaleDateString()}</span>
           </div>
          </div>
         </CardContent>
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