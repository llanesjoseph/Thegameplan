'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase.client'
import { collection, getDocs } from 'firebase/firestore'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { Progress } from '@/lib/types'

export default function ProgressDashboard() {
  const [items, setItems] = useState<(Progress & { id: string })[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) await signInAnonymously(auth)
      const uid = auth.currentUser!.uid
      const snap = await getDocs(collection(db, 'progress', uid, 'items'))
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Progress & { id: string })))
    })
    return () => unsub()
  }, [])

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold">Your Progress</h1>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(i => (
          <div key={i.id} className="card">
            <h3 className="font-semibold">Lesson {i.id}</h3>
            <div className="text-sm text-brand-grey mt-2">{(i.percent ?? 0)}% complete</div>
            <Link className="btn btn-outline mt-3" href={`/content/${i.id}`}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  )
}


