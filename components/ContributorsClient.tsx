'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { NexusCard } from '@/components/ui/NexusCard'
import { contributors as fallbackContributors } from '@/lib/contributors'

type PublicCreator = {
 name: string
 slug?: string
 sport?: string
 avatarUrl?: string
 headshotUrl?: string
 actionImageUrl?: string
 heroImageUrl?: string
 tagline?: string
 badges?: string[]
}

export default function ContributorsClient() {
 const [items, setItems] = useState<PublicCreator[] | null>(null)
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [sport, setSport] = useState('')

 useEffect(() => {
  const fetchCreators = async () => {
   try {
    if (!db) throw new Error('Firestore not initialized')
    const base = collection(db, 'creatorPublic')
    const constraints: any[] = []
    if (sport) constraints.push(where('sport', '>=', sport), where('sport', '<=', sport + '\uf8ff'))
    constraints.push(orderBy('name'))
    constraints.push(limit(24))
    const qs = await getDocs(query(base, ...constraints))
    const docs: PublicCreator[] = []
    qs.forEach(d => docs.push({ slug: d.id, ...d.data() } as PublicCreator))
    setItems(docs)
   } catch {
    // fallback to static contributors (at least Jasmine)
    const mapped = fallbackContributors.map(c => ({
     name: c.name,
     slug: c.name.toLowerCase().replace(/\s+/g, '-'),
     sport: c.role,
     heroImageUrl: c.heroImageUrl,
     avatarUrl: c.avatarUrl,
     tagline: c.tagline,
     badges: c.badges,
    }))
    setItems(mapped)
   } finally {
    setLoading(false)
   }
  }
  fetchCreators()
 }, [sport])

 const filtered = useMemo(() => {
  if (!items) return []
  const s = search.trim().toLowerCase()
  if (!s) return items
  return items.filter(i =>
   i.name?.toLowerCase().includes(s) ||
   i.sport?.toLowerCase().includes(s) ||
   i.tagline?.toLowerCase().includes(s)
  )
 }, [items, search])

 // Choose featured if present (Jasmine), else first
 const featured = useMemo(() => {
  if (!items || items.length === 0) return null
  return items.find(i => i.name?.toLowerCase().includes('jasmine')) || items[0]
 }, [items])

 const rest = useMemo(() => {
  if (!filtered) return []
  const fid = featured?.slug || featured?.name
  return filtered.filter(i => (i.slug || i.name) !== fid)
 }, [filtered, featured])

 return (
  <div>
   <div className="max-w-6xl mx-auto">
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
     <div className="flex-1">
      <input
       value={search}
       onChange={e => setSearch(e.target.value)}
       placeholder="Search by name, sport, achievements..."
       className="w-full rounded-md border border-clarity-text-secondary/20 bg-clarity-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-clarity-accent/40"
      />
     </div>
     <div>
      <select
       value={sport}
       onChange={e => setSport(e.target.value)}
       className="rounded-md border border-clarity-text-secondary/20 bg-clarity-surface px-3 py-2 text-sm"
      >
       <option value="">All sports</option>
       <option value="soccer">Soccer</option>
       <option value="bjj">Brazilian Jiu-Jitsu</option>
      </select>
     </div>
    </div>
   </div>

   <div className="max-w-6xl mx-auto mt-6">
    {loading ? (
     <div className="text-clarity-text-secondary text-sm">Loading contributors…</div>
    ) : featured ? (
     <NexusCard variant="elevated" className="p-0 overflow-hidden">
      {featured.heroImageUrl && (
       <div className="relative h-56 sm:h-64 md:h-72 w-full">
        <Image src={featured.heroImageUrl} alt={featured.name} fill className="object-cover" />
       </div>
      )}
      <div className="p-6 sm:p-8 flex items-start gap-5">
       <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
        <Image
         src={featured.headshotUrl || featured.avatarUrl || '/logo-gp.svg'}
         alt={`${featured.name} avatar`}
         fill
         sizes="80px"
         className="rounded-full object-cover border border-clarity-text-secondary/10"
        />
       </div>
       <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl  text-clarity-text-primary">{featured.name}</h2>
        {featured.sport && (<p className="text-sm text-clarity-text-secondary mt-1">{featured.sport}</p>)}
        {featured.tagline && (<p className="text-sm text-clarity-text-secondary/90 mt-2">{featured.tagline}</p>)}
        {featured.badges && featured.badges.length > 0 && (
         <div className="mt-3 flex flex-wrap gap-2">
          {featured.badges.map(b => (
           <span key={b} className="text-xs px-2 py-1 rounded-full bg-clarity-accent/10 text-clarity-accent border border-clarity-accent/20">{b}</span>
          ))}
         </div>
        )}
        <div className="mt-4">
         <Link href={`/contributors/${featured.slug || (featured.name || '').toLowerCase().replace(/\s+/g, '-')}`} className="text-clarity-accent hover:underline text-sm">View profile</Link>
        </div>
       </div>
      </div>
     </NexusCard>
    ) : (
     <div className="text-clarity-text-secondary text-sm">No contributors found.</div>
    )}
   </div>

   <section className="px-0 mt-8">
    <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
     {rest.map(c => (
      <NexusCard key={c.slug || c.name} variant="surface" className="flex items-center gap-4">
       <div className="relative w-14 h-14 flex-shrink-0">
        <Image src={c.headshotUrl || c.avatarUrl || '/logo-gp.svg'} alt={`${c.name} avatar`} fill sizes="56px" className="rounded-full object-cover" />
       </div>
       <div className="min-w-0">
        <h3 className="text-clarity-text-primary  truncate">{c.name}</h3>
        {c.sport && (<p className="text-sm text-clarity-text-secondary truncate">{c.sport}</p>)}
        <div className="mt-2 text-sm">
         <Link href={`/contributors/${c.slug || (c.name || '').toLowerCase().replace(/\s+/g, '-')}`} className="text-clarity-accent hover:underline">View profile</Link>
        </div>
       </div>
      </NexusCard>
     ))}
    </div>
   </section>
  </div>
 )
}


