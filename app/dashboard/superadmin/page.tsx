'use client'
import { useEffect, useState } from 'react'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useRouter } from 'next/navigation'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from '@/lib/firebase.client'
import { SetRoleResponse, FirebaseFunctionError } from '@/lib/types'

export default function SuperAdminDashboard() {
 const { role, loading } = useEnhancedRole()
 const router = useRouter()
 useEffect(() => {
  if (loading) return
  if (role !== 'superadmin') {
   router.replace('/dashboard')
  }
 }, [role, loading, router])

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
     <p className="mt-4 text-gray-600">Loading...</p>
    </div>
   </div>
  )
 }

 if (role !== 'superadmin') {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Access Denied</h1>
     <p className="text-gray-600">This page is only available to superadmins.</p>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen bg-gray-50">
   <div className="max-w-7xl mx-auto px-6 py-10">
    <div className="mb-8">
     <h1 className="text-3xl text-gray-900">Superadmin Dashboard</h1>
     <p className="text-gray-600 mt-2">Complete platform administration and control center.</p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
     {/* User Role Management */}
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
       <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
        <span className="text-red-600 font-semibold">👑</span>
       </div>
       <div>
        <h3 className="font-semibold text-gray-900">User Role Management</h3>
        <p className="text-sm text-gray-600">Assign and modify user permissions</p>
       </div>
      </div>
      <RoleForm />
     </div>

     {/* Creator Admin Management */}
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
       <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
        <span className="text-purple-600 font-semibold">🎯</span>
       </div>
       <div>
        <h3 className="font-semibold text-gray-900">Creator Admin Access</h3>
        <p className="text-sm text-gray-600">Grant/revoke admin access to creators</p>
       </div>
      </div>
      <CreatorAdminForm />
     </div>

     {/* Quick Access Links */}
     <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Access</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
       <a href="/dashboard/admin/users" className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
        <div className="text-blue-600 mb-2">👥</div>
        <div className="font-medium text-gray-900 group-hover:text-blue-700">All Users</div>
        <div className="text-sm text-gray-600">Manage user accounts</div>
       </a>
       <a href="/dashboard/admin/creator-applications" className="group p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
        <div className="text-green-600 mb-2">📝</div>
        <div className="font-medium text-gray-900 group-hover:text-green-700">Applications</div>
        <div className="text-sm text-gray-600">Review creator requests</div>
       </a>
       <a href="/dashboard/admin/content" className="group p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
        <div className="text-orange-600 mb-2">🎬</div>
        <div className="font-medium text-gray-900 group-hover:text-orange-700">Content</div>
        <div className="text-sm text-gray-600">Manage all content</div>
       </a>
       <a href="/dashboard/admin/analytics" className="group p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
        <div className="text-purple-600 mb-2">📊</div>
        <div className="font-medium text-gray-900 group-hover:text-purple-700">Analytics</div>
        <div className="text-sm text-gray-600">Platform insights</div>
       </a>
      </div>
     </div>
    </div>
   </div>
  </main>
 )
}

function RoleForm() {
 const [email, setEmail] = useState('')
 const [uid, setUid] = useState('')
 const [role, setRole] = useState<'user'|'creator'|'admin'|'superadmin'>('user')
 const [status, setStatus] = useState('')

 const submit = async () => {
  setStatus('')
  try {
   if (!auth.currentUser) { setStatus('Sign in required'); return }
   const fn = httpsCallable(getFunctions(), 'set_role')
   const { data } = await fn({ email: email || undefined, uid: uid || undefined, role }) as { data: SetRoleResponse }
   setStatus(`Updated ${data.uid} → ${data.role}`)
  } catch (e: unknown) {
   const error = e as FirebaseFunctionError
   setStatus(error.message || 'Failed to set role')
  }
 }

 return (
  <div className="grid md:grid-cols-4 gap-3 mt-4">
   <input className="rounded-xl border border-gray-300 bg-white p-3 text-gray-900" placeholder="Email (or leave blank and use UID)" value={email} onChange={e => setEmail(e.target.value)} />
   <input className="rounded-xl border border-gray-300 bg-white p-3 text-gray-900" placeholder="UID (optional if email provided)" value={uid} onChange={e => setUid(e.target.value)} />
   <select className="rounded-xl border border-gray-300 bg-white p-3 text-gray-900" value={role} onChange={e => setRole(e.target.value as 'user'|'creator'|'admin'|'superadmin')}>
    <option value="user">athlete (user)</option>
    <option value="creator">coach (creator)</option>
    <option value="admin">admin</option>
    <option value="superadmin">superadmin</option>
   </select>
   <button className="btn btn-accent" onClick={submit}>Set role</button>
   {status && <div className="md:col-span-4 text-sm text-gray-600">{status}</div>}
  </div>
 )
}

function CreatorAdminForm() {
 const [creatorUid, setCreatorUid] = useState('')
 const [adminUid, setAdminUid] = useState('')
 const [status, setStatus] = useState('')

 const call = async (action: 'grant'|'revoke') => {
  setStatus('')
  try {
   if (!auth.currentUser) { setStatus('Sign in required'); return }
   const fn = httpsCallable(getFunctions(), 'set_creator_admin')
   await fn({ creatorUid, adminUid, action })
   setStatus(`${action} OK`)
  } catch (e: unknown) {
   const error = e as FirebaseFunctionError
   setStatus(error.message || 'Failed')
  }
 }

 return (
  <div className="grid md:grid-cols-4 gap-3 mt-4">
   <input className="rounded-xl border border-gray-300 bg-white p-3 text-gray-900" placeholder="Creator UID" value={creatorUid} onChange={e => setCreatorUid(e.target.value)} />
   <input className="rounded-xl border border-gray-300 bg-white p-3 text-gray-900" placeholder="Admin UID" value={adminUid} onChange={e => setAdminUid(e.target.value)} />
   <button className="btn btn-outline" onClick={() => call('grant')}>Grant</button>
   <button className="btn btn-outline" onClick={() => call('revoke')}>Revoke</button>
   {status && <div className="md:col-span-4 text-sm text-gray-600">{status}</div>}
  </div>
 )
}


