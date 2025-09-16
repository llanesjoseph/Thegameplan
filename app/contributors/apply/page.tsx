'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type ApplicationStep = 'basic' | 'credentials' | 'content' | 'media' | 'review'

type ContributorApplication = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth: string
  location: string
  timezone: string
  primarySport: string
  secondarySports: string[]
  experience: 'college' | 'pro' | 'olympic' | 'coach' | 'analyst' | 'other'
  experienceDetails: string
  yearsActive: number
  achievements: string[]
  certifications: string[]
  education: string
  currentRole?: string
  specialties: string[]
  contentTypes: string[]
  targetAudience: string[]
  contentDescription: string
  headshotUrl?: string
  actionImageUrl?: string
  portfolioUrl?: string
  socialMedia: { instagram?: string; twitter?: string; linkedin?: string; youtube?: string }
  motivation: string
  availability: string
  references: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: any
  reviewedAt?: any
  reviewerNotes?: string
}

const SPORTS = ['soccer','basketball','football','baseball','tennis','volleyball','hockey','lacrosse','rugby','cricket','golf','swimming','track','cross-country','wrestling','boxing','mma','other']
const EXPERIENCES = ['college','pro','olympic','coach','analyst','other']
const SPECIALTIES = ['technical','tactical','mental','physical','recovery','leadership','goalkeeping','defense','midfield','attack','conditioning','nutrition','strategy','game-analysis','injury-prevention','mental-toughness']
const CONTENT_TYPES = ['video-lessons','written-content','live-sessions','analysis','drills','mindset-coaching','tactical-breakdowns','recovery-tips']
const TARGET_AUDIENCES = ['youth','high-school','college','amateur','professional','coaches','parents','all-levels']

export default function ContributorApplicationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('basic')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [application, setApplication] = useState<ContributorApplication>({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', location: '', timezone: '',
    primarySport: '', secondarySports: [], experience: 'college', experienceDetails: '', yearsActive: 0,
    achievements: [''], certifications: [''], education: '', currentRole: '',
    specialties: [], contentTypes: [], targetAudience: [], contentDescription: '',
    headshotUrl: '', actionImageUrl: '', portfolioUrl: '', socialMedia: {},
    motivation: '', availability: '', references: [''], status: 'pending', submittedAt: null
  })

  const updateField = (k: keyof ContributorApplication, v: any) => setApplication(prev => ({ ...prev, [k]: v }))

  const validateStep = (step: ApplicationStep) => {
    switch (step) {
      case 'basic': return !!(application.firstName && application.lastName && application.email && application.dateOfBirth && application.location)
      case 'credentials': return !!(application.primarySport && application.experience && application.experienceDetails && application.achievements[0])
      case 'content': return !!(application.specialties.length && application.contentTypes.length && application.contentDescription)
      case 'media': return true
      default: return true
    }
  }

  const nextStep = () => { if (validateStep(currentStep)) { const steps: ApplicationStep[] = ['basic','credentials','content','media','review']; const i = steps.indexOf(currentStep); if (i < steps.length - 1) setCurrentStep(steps[i+1]) } }
  const prevStep = () => { const steps: ApplicationStep[] = ['basic','credentials','content','media','review']; const i = steps.indexOf(currentStep); if (i > 0) setCurrentStep(steps[i-1]) }

  const handleFileUpload = async (file: File, type: 'headshot' | 'action') => {
    if (!file) return
    setLoading(true); setUploadProgress(0)
    try {
      const storageRef = ref(storage, `contributor-applications/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      if (type === 'headshot') updateField('headshotUrl', url); else updateField('actionImageUrl', url)
      setUploadProgress(100); setTimeout(() => setUploadProgress(0), 800)
    } catch {
      alert('Failed to upload. Please try again.')
    } finally { setLoading(false) }
  }

  const submitApplication = async () => {
    if (!validateStep('review')) { alert('Please complete required fields.'); return }
    setLoading(true)
    try {
      const ref = await addDoc(collection(db, 'contributorApplications'), { ...application, submittedAt: serverTimestamp(), status: 'pending' })
      alert(`Application submitted! Ref: ${ref.id}`)
      router.push('/contributors')
    } catch {
      alert('Failed to submit. Try again later.')
    } finally { setLoading(false) }
  }

  const stepPct = () => { const steps: ApplicationStep[] = ['basic','credentials','content','media','review']; const i = steps.indexOf(currentStep); return ((i+1)/steps.length)*100 }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Become a Contributor</h1>
        <p className="text-gray-600">Share your expertise with the next generation of athletes.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2 text-gray-600 text-sm"><span>Application Progress</span><span>{Math.round(stepPct())}%</span></div>
        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-cardinal h-2 rounded-full transition-all" style={{ width: `${stepPct()}%` }} /></div>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {['basic','credentials','content','media','review'].map((s, i) => (
          <button key={s} onClick={() => setCurrentStep(s as ApplicationStep)} className={`w-8 h-8 rounded-full text-sm ${currentStep===s?'bg-cardinal text-white':'bg-white text-gray-600 border border-gray-300'}`}>{i+1}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-card">
        {currentStep === 'basic' && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div><label className="block text-sm mb-2 text-gray-800">First Name *</label><input value={application.firstName} onChange={e=>updateField('firstName',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div><label className="block text-sm mb-2 text-gray-800">Last Name *</label><input value={application.lastName} onChange={e=>updateField('lastName',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div><label className="block text-sm mb-2 text-gray-800">Email *</label><input type="email" value={application.email} onChange={e=>updateField('email',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div><label className="block text-sm mb-2 text-gray-800">Phone</label><input value={application.phone} onChange={e=>updateField('phone',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div><label className="block text-sm mb-2 text-gray-800">Date of Birth *</label><input type="date" value={application.dateOfBirth} onChange={e=>updateField('dateOfBirth',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div><label className="block text-sm mb-2 text-gray-800">Location *</label><input value={application.location} onChange={e=>updateField('location',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            <div className="sm:col-span-2"><label className="block text-sm mb-2 text-gray-800">Timezone *</label><input value={application.timezone} onChange={e=>updateField('timezone',e.target.value)} placeholder="e.g., UTC-5" className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
          </div>
        )}

        {currentStep === 'credentials' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div><label className="block text-sm mb-2 text-gray-800">Primary Sport *</label><select value={application.primarySport} onChange={e=>updateField('primarySport',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"><option value="">Select</option>{SPORTS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm mb-2 text-gray-800">Experience Level *</label><select value={application.experience} onChange={e=>updateField('experience',e.target.value as any)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal">{EXPERIENCES.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-2 text-gray-800">Experience Details *</label><textarea value={application.experienceDetails} onChange={e=>updateField('experienceDetails',e.target.value)} rows={4} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
              <div><label className="block text-sm mb-2 text-gray-800">Years Active</label><input type="number" value={application.yearsActive} onChange={e=>updateField('yearsActive',parseInt(e.target.value)||0)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
              <div><label className="block text-sm mb-2 text-gray-800">Education</label><input value={application.education} onChange={e=>updateField('education',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-2 text-gray-800">Current Role</label><input value={application.currentRole} onChange={e=>updateField('currentRole',e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /></div>
            </div>
            <div>
              <label className="block text-sm mb-2">Key Achievements *</label>
              {application.achievements.map((a,i)=>(<div key={i} className="flex gap-2 mb-2"><input value={a} onChange={e=>{const v=[...application.achievements];v[i]=e.target.value;updateField('achievements',v)}} className="flex-1 bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /><button type="button" onClick={()=>updateField('achievements',application.achievements.filter((_,x)=>x!==i))} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-600">Remove</button></div>))}
              <button type="button" onClick={()=>updateField('achievements',[...application.achievements,''])} className="text-sm text-cardinal">+ Add Achievement</button>
            </div>
            <div>
              <label className="block text-sm mb-2">Certifications</label>
              {application.certifications.map((c,i)=>(<div key={i} className="flex gap-2 mb-2"><input value={c} onChange={e=>{const v=[...application.certifications];v[i]=e.target.value;updateField('certifications',v)}} className="flex-1 bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" /><button type="button" onClick={()=>updateField('certifications',application.certifications.filter((_,x)=>x!==i))} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-600">Remove</button></div>))}
              <button type="button" onClick={()=>updateField('certifications',[...application.certifications,''])} className="text-sm text-cardinal">+ Add Certification</button>
            </div>
          </div>
        )}

        {currentStep === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Areas of Expertise *</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {SPECIALTIES.map(s => (
                  <label key={s} className="flex items-center gap-2"><input type="checkbox" checked={application.specialties.includes(s)} onChange={(e)=>updateField('specialties', e.target.checked ? [...application.specialties,s] : application.specialties.filter(x=>x!==s))} className="text-cardinal focus:ring-cardinal" /><span className="text-sm capitalize">{s.replace('-', ' ')}</span></label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Content Types *</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {CONTENT_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2"><input type="checkbox" checked={application.contentTypes.includes(t)} onChange={(e)=>updateField('contentTypes', e.target.checked ? [...application.contentTypes,t] : application.contentTypes.filter(x=>x!==t))} className="text-cardinal focus:ring-cardinal" /><span className="text-sm capitalize">{t.replace('-', ' ')}</span></label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Target Audience *</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {TARGET_AUDIENCES.map(a => (
                  <label key={a} className="flex items-center gap-2"><input type="checkbox" checked={application.targetAudience.includes(a)} onChange={(e)=>updateField('targetAudience', e.target.checked ? [...application.targetAudience,a] : application.targetAudience.filter(x=>x!==a))} className="text-cardinal focus:ring-cardinal" /><span className="text-sm capitalize">{a.replace('-', ' ')}</span></label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Content Description *</label>
              <textarea value={application.contentDescription} onChange={e=>updateField('contentDescription',e.target.value)} rows={4} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal" />
            </div>
          </div>
        )}

        {currentStep === 'media' && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">Headshot</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {application.headshotUrl ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={application.headshotUrl} alt="Headshot" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                    <button onClick={()=>updateField('headshotUrl','')} className="text-sm text-red-400">Remove</button>
                  </div>
                ) : (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e)=> e.target.files?.[0] && handleFileUpload(e.target.files[0],'headshot')} className="hidden" />
                    <button onClick={()=>fileInputRef.current?.click()} className="text-cardinal">Upload Headshot</button>
                    <p className="text-xs text-gray-600 mt-2">Square format recommended</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Action Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {application.actionImageUrl ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={application.actionImageUrl} alt="Action" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                    <button onClick={()=>updateField('actionImageUrl','')} className="text-sm text-red-400">Remove</button>
                  </div>
                ) : (
                  <div>
                    <input type="file" accept="image/*" onChange={(e)=> e.target.files?.[0] && handleFileUpload(e.target.files[0],'action')} className="hidden" />
                    <button onClick={()=>fileInputRef.current?.click()} className="text-cardinal">Upload Action Image</button>
                    <p className="text-xs text-gray-600 mt-2">You in action or performing your sport</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6 text-gray-600">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium mb-2 text-gray-800">Personal</h3>
                <p>Name: {application.firstName} {application.lastName}</p>
                <p>Email: {application.email}</p>
                <p>Location: {application.location}</p>
                <p>Timezone: {application.timezone}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium mb-2 text-gray-800">Sport</h3>
                <p>Primary Sport: {application.primarySport}</p>
                <p>Experience: {application.experience}</p>
                <p>Years Active: {application.yearsActive}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium mb-2 text-gray-800">Specialties & Content</h3>
              <p>Specialties: {application.specialties.join(', ') || '—'}</p>
              <p>Content Types: {application.contentTypes.join(', ') || '—'}</p>
              <p>Audience: {application.targetAudience.join(', ') || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium mb-2 text-gray-800">Additional</h3>
              <p>Motivation: {application.motivation || '—'}</p>
              <p>Availability: {application.availability || '—'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} disabled={currentStep==='basic'} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50">Previous</button>
        <div className="flex gap-3">
          {currentStep !== 'review' ? (
            <button onClick={nextStep} disabled={!validateStep(currentStep)} className="px-4 py-2 rounded-lg bg-cardinal text-white hover:bg-cardinal-dark disabled:opacity-50">Next Step</button>
          ) : (
            <button onClick={submitApplication} disabled={loading || !validateStep('review')} className="px-4 py-2 rounded-lg bg-cardinal text-white hover:bg-cardinal-dark disabled:opacity-50">{loading ? 'Submitting…' : 'Submit Application'}</button>
          )}
        </div>
      </div>

      {uploadProgress > 0 && (
        <div className="fixed bottom-4 right-4 bg-black/80 rounded-lg p-4 border border-white/20 text-white text-sm">Uploading… {uploadProgress}%</div>
      )}
    </main>
  )
}


