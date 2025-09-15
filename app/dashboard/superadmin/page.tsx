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
    if (role !== 'superadmin') router.replace('/dashboard')
  }, [role, loading, router])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900">Superadmin</h1>
          <p className="text-gray-600 mt-2">Full platform controls.</p>

          <section className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900">Assign role</h3>
            <RoleForm />
          </section>

          <section className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900">Manage creator admins</h3>
            <CreatorAdminForm />
          </section>
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
        <option value="user">user (athlete)</option>
        <option value="creator">creator (contributor)</option>
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


