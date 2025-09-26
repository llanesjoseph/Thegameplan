'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore'
import Image from 'next/image'

type ContributorApplication = {
 id: string
 firstName: string
 lastName: string
 email: string
 primarySport: string
 experience: string
 specialties: string[]
 contentTypes: string[]
 status: 'pending' | 'approved' | 'rejected'
 submittedAt: any
 reviewedAt?: any
 reviewerNotes?: string
 headshotUrl?: string
 actionImageUrl?: string
}

export default function AdminContributorsPage() {
 const [applications, setApplications] = useState<ContributorApplication[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedApp, setSelectedApp] = useState<ContributorApplication | null>(null)
 const [reviewNotes, setReviewNotes] = useState('')
 const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

 useEffect(() => { loadApplications() }, [filterStatus])

 const loadApplications = async () => {
  setLoading(true)
  try {
   let qref = query(collection(db, 'contributorApplications'), orderBy('submittedAt', 'desc'))
   if (filterStatus !== 'all') qref = query(qref, where('status', '==', filterStatus))
   const snapshot = await getDocs(qref)
   setApplications(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
  } catch (e) {
   setApplications([])
  } finally { setLoading(false) }
 }

 const updateStatus = async (appId: string, status: 'approved' | 'rejected') => {
  await updateDoc(doc(db, 'contributorApplications', appId), { status, reviewedAt: serverTimestamp(), reviewerNotes: reviewNotes })
  await loadApplications(); setSelectedApp(null); setReviewNotes('')
 }

 const approveAndCreateProfile = async (app: ContributorApplication) => {
  await updateStatus(app.id, 'approved')
  const profile = {
   name: `${app.firstName} ${app.lastName}`,
   firstName: app.firstName,
   sport: app.primarySport,
   tagline: `Elite ${app.experience} contributor specializing in ${(app.specialties||[]).slice(0,3).join(', ')}`,
   heroImageUrl: app.actionImageUrl || app.headshotUrl,
   headshotUrl: app.headshotUrl,
   actionImageUrl: app.actionImageUrl,
   badges: [app.experience],
   lessons: [],
   lessonCount: 0,
   specialties: app.specialties || [],
   experience: app.experience,
   verified: true,
   featured: false,
   createdAt: serverTimestamp()
  }
  await addDoc(collection(db, 'creatorPublic'), profile)
  await loadApplications()
  alert('Contributor profile created')
 }

 const badgeClass = (s: string) => ({ approved: 'bg-green-500/20 text-green-400 border-green-500/30', rejected: 'bg-red-500/20 text-red-400 border-red-500/30', pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' } as any)[s] || 'bg-black/20 text-white/70 border-white/10'

 return (
  <main className="max-w-7xl mx-auto px-6 py-10">
   <div className="mb-8">
    <h1 className="text-3xl sm:text-4xl text-clarity-text-primary mb-2">Contributor Applications</h1>
    <p className="text-clarity-text-secondary">Review and manage contributor applications.</p>
   </div>

   <div className="flex gap-4 mb-6">
    {(['all','pending','approved','rejected'] as const).map(s => (
     <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl border ${filterStatus===s?'border-clarity-accent text-clarity-accent':'border-clarity-text-secondary/20 text-clarity-text-secondary hover:border-clarity-text-secondary/40'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
    ))}
   </div>

   <div className="grid lg:grid-cols-2 gap-6">
    <div className="space-y-4">
     <h2 className="text-xl font-semibold text-clarity-text-primary">Applications</h2>
     {loading ? (
      <div className="text-center py-8 text-clarity-text-secondary">Loading…</div>
     ) : applications.length === 0 ? (
      <div className="text-center py-8 text-clarity-text-secondary">No applications</div>
     ) : (
      applications.map(app => (
       <div key={app.id} onClick={() => setSelectedApp(app)} className={`bg-clarity-surface border rounded-2xl p-4 cursor-pointer transition-all ${selectedApp?.id===app.id?'border-clarity-accent':'border-clarity-text-secondary/10 hover:border-clarity-accent/30'}`}>
        <div className="flex items-center gap-4">
         <div className="w-16 h-16 rounded-full overflow-hidden bg-clarity-background">
          {app.headshotUrl ? <Image src={app.headshotUrl} alt="" width={64} height={64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-clarity-text-secondary">{app.firstName?.[0]}{app.lastName?.[0]}</div>}
         </div>
         <div className="flex-1">
          <h3 className="font-semibold text-clarity-text-primary">{app.firstName} {app.lastName}</h3>
          <p className="text-sm text-clarity-text-secondary capitalize">{app.primarySport} • {app.experience}</p>
         </div>
         <div className={`px-3 py-1 rounded-full text-xs border ${badgeClass(app.status)}`}>{app.status}</div>
        </div>
       </div>
      ))
     )}
    </div>

    <div className="space-y-4">
     <h2 className="text-xl font-semibold text-clarity-text-primary">Application Details</h2>
     {selectedApp ? (
      <div className="bg-clarity-surface border border-clarity-text-secondary/10 rounded-2xl p-6 space-y-6">
       <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-clarity-background">
         {selectedApp.headshotUrl ? <Image src={selectedApp.headshotUrl} alt="" width={80} height={80} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-clarity-text-secondary text-xl">{selectedApp.firstName?.[0]}{selectedApp.lastName?.[0]}</div>}
        </div>
        <div>
         <h3 className="text-xl font-semibold text-clarity-text-primary">{selectedApp.firstName} {selectedApp.lastName}</h3>
         <p className="text-clarity-text-secondary">{selectedApp.email}</p>
         <div className={`inline-block px-3 py-1 rounded-full text-sm border mt-2 ${badgeClass(selectedApp.status)}`}>{selectedApp.status}</div>
        </div>
       </div>

       <div className="grid sm:grid-cols-2 gap-4 text-clarity-text-secondary">
        <div><span className="block text-sm">Primary Sport</span><p className="text-clarity-text-primary">{selectedApp.primarySport}</p></div>
        <div><span className="block text-sm">Experience</span><p className="capitalize text-clarity-text-primary">{selectedApp.experience}</p></div>
        <div><span className="block text-sm">Content Types</span><div className="flex flex-wrap gap-1 mt-1">{selectedApp.contentTypes.map((t,i)=>(<span key={i} className="text-xs px-2 py-1 bg-clarity-background rounded-full border border-clarity-text-secondary/20">{t.replace('-', ' ')}</span>))}</div></div>
        <div><span className="block text-sm">Specialties</span><div className="flex flex-wrap gap-1 mt-1">{selectedApp.specialties.map((s,i)=>(<span key={i} className="text-xs px-2 py-1 bg-clarity-background rounded-full border border-clarity-text-secondary/20">{s}</span>))}</div></div>
       </div>

       {(selectedApp.headshotUrl || selectedApp.actionImageUrl) && (
        <div>
         <span className="block text-sm text-clarity-text-secondary mb-2">Media</span>
         <div className="grid grid-cols-2 gap-4">
          {selectedApp.headshotUrl && (<Image src={selectedApp.headshotUrl} alt="Headshot" width={200} height={200} className="w-full h-32 object-cover rounded-lg" />)}
          {selectedApp.actionImageUrl && (<Image src={selectedApp.actionImageUrl} alt="Action" width={200} height={200} className="w-full h-32 object-cover rounded-lg" />)}
         </div>
        </div>
       )}

       <div>
        <label className="block text-sm mb-2 text-clarity-text-secondary">Review Notes</label>
        <textarea value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} rows={3} className="w-full bg-clarity-background p-3 rounded-xl border border-clarity-text-secondary/20" />
       </div>

       {selectedApp.status === 'pending' && (
        <div className="flex gap-3">
         <button onClick={()=>approveAndCreateProfile(selectedApp)} className="px-4 py-2 rounded-lg bg-clarity-accent text-white flex-1">Approve & Create Profile</button>
         <button onClick={()=>updateStatus(selectedApp.id,'rejected')} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 flex-1">Reject</button>
        </div>
       )}
      </div>
     ) : (
      <div className="bg-clarity-surface border border-clarity-text-secondary/10 rounded-2xl p-8 text-center text-clarity-text-secondary">Select an application to view details</div>
     )}
    </div>
   </div>
  </main>
 )
}


