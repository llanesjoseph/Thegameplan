'use client'
import { useState } from 'react'

interface SocialMedia { platform: string; url: string; handle?: string }
interface ContactInfo { email?: string; phone?: string; location?: string; website?: string }
interface ContentStats { totalLessons: number; totalViews: number; totalSubscribers: number; averageRating: number; totalDuration: number }

interface EnhancedProfileProps {
  profile: {
    name: string
    tagline: string
    bio: string
    about: string
    sport: string
    level: string
    badges: string[]
    headshotUrl: string
    heroImageUrl: string
    stadiumBgUrl?: string
    socialMedia: SocialMedia[]
    contactInfo: ContactInfo
    contentStats: ContentStats
    specialties: string[]
    experience: string
    education: string
  }
  isEditable?: boolean
  onSave?: (updatedProfile: any) => void
}

export default function EnhancedProfile({ profile, isEditable = false, onSave }: EnhancedProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [edited, setEdited] = useState(profile)

  const updateField = (k: string, v: any) => setEdited(prev => ({ ...prev, [k]: v }))

  const current = isEditing ? edited : profile

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
        {current.stadiumBgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.stadiumBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20">
                  {current.level} • {current.sport}
                </span>
                {isEditable && (
                  <button onClick={() => setIsEditing(!isEditing)} className="text-sm px-3 py-1 rounded-full border border-white/20 hover:bg-white/10">{isEditing ? 'Cancel' : 'Edit Profile'}</button>
                )}
              </div>
              {isEditing ? (
                <input value={current.name} onChange={e => updateField('name', e.target.value)} className="text-4xl font-bold bg-black/20 p-2 rounded-lg border border-white/20 w-full mb-3" />
              ) : (
                <h1 className="text-4xl font-bold">{current.name}</h1>
              )}
              {isEditing ? (
                <textarea value={current.tagline} onChange={e => updateField('tagline', e.target.value)} className="text-lg text-white/70 bg-black/20 p-2 rounded-lg border border-white/20 w-full mb-6" rows={2} />
              ) : (
                <p className="mt-3 text-lg text-white/70">{current.tagline}</p>
              )}
              <div className="mt-6 flex gap-3">
                <a href="#lessons" className="btn btn-accent">Watch lessons</a>
                <a href="#subscribe" className="btn btn-outline">Subscribe</a>
              </div>
              <div className="mt-8">
                <h3 className="text-sm font-medium text-white/70 mb-3">Badges & Achievements</h3>
                <div className="flex flex-wrap gap-3">
                  {current.badges.map((b, i) => (
                    <span key={i} className="text-sm text-white/80 border border-white/10 rounded-xl px-3 py-2">{b}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 bg-clarity-accent/10 blur-2xl rounded-3xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.headshotUrl || current.heroImageUrl} alt={current.name} className="w-full object-cover aspect-square" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Content Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{current.contentStats.totalLessons}</div>
            <div className="text-sm text-white/70">Total Lessons</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{current.contentStats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-white/70">Total Views</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{current.contentStats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-white/70">Avg Rating</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{Math.round(current.contentStats.totalDuration / 60)}h</div>
            <div className="text-sm text-white/70">Total Content</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Bio</h2>
            {isEditing ? (
              <textarea value={current.bio} onChange={e => updateField('bio', e.target.value)} className="w-full bg-black/20 p-4 rounded-xl border border-white/10 min-h-[120px]" />
            ) : (
              <p className="text-white/80 leading-relaxed">{current.bio}</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">About</h2>
            {isEditing ? (
              <textarea value={current.about} onChange={e => updateField('about', e.target.value)} className="w-full bg-black/20 p-4 rounded-xl border border-white/10 min-h-[120px]" />
            ) : (
              <p className="text-white/80 leading-relaxed">{current.about}</p>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-4">Specialties</h2>
        <div className="flex flex-wrap gap-3">
          {current.specialties.map((s, i) => (
            <span key={i} className="px-4 py-2 bg-clarity-accent/20 border border-clarity-accent/30 rounded-full text-sm">{s}</span>
          ))}
        </div>
      </section>

      {isEditing && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex gap-4">
            <button onClick={() => { onSave?.(edited); setIsEditing(false) }} className="btn btn-accent">Save Changes</button>
            <button onClick={() => { setIsEditing(false); setEdited(profile) }} className="btn btn-outline">Cancel</button>
          </div>
        </section>
      )}
    </div>
  )
}


