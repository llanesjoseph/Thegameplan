'use client'
import { db } from '@/lib/firebase.client'
import { doc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import AuthProvider from '@/components/auth/AuthProvider'

const schema = z.object({
  sports: z.array(z.string()).min(1, 'Select at least one sport'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.string().min(10, 'Tell us a bit more about your goals'),
  experienceYears: z.number().min(0).max(50),
  availabilityPerWeekHours: z.number().min(1).max(40),
  preferredCoachStyle: z.enum(['technical', 'tactical', 'mindset', 'balanced'])
})
type FormValues = z.infer<typeof schema>

export default function Onboarding() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sports: ['soccer'],
      level: 'intermediate',
      goals: 'Improve decision speed and first-touch under pressure.',
      experienceYears: 2,
      availabilityPerWeekHours: 5,
      preferredCoachStyle: 'balanced'
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      alert('Please sign in to continue')
      return
    }

    try {
      const uid = user.uid
      
      // Create user profile with comprehensive error handling
      await setDoc(doc(db, 'users', uid), {
        sports: values.sports,
        skillLevel: values.level,
        goals: [values.goals],
        experienceYears: values.experienceYears,
        availabilityPerWeekHours: values.availabilityPerWeekHours,
        preferredCoachStyle: values.preferredCoachStyle,
        role: 'user', // Ensure role is assigned
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true })

      // Optional analytics logging - don't let this block the user flow
      try {
        const fn = httpsCallable(getFunctions(), 'log_event')
        await fn({ type: 'onboarding_completed', payload: { sports: values.sports, level: values.level } })
      } catch (analyticsError) {
        console.warn('Analytics logging failed:', analyticsError)
      }

      console.log('User onboarding completed successfully')
      alert('Profile saved successfully! Redirecting to dashboard...')
      router.push('/dashboard')

    } catch (error) {
      console.error('Error completing onboarding:', error)
      
      // User-friendly error handling
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string }
        switch (firebaseError.code) {
          case 'permission-denied':
            alert('Permission denied. Please try signing in again.')
            break
          case 'unavailable':
            alert('Service temporarily unavailable. Please try again in a moment.')
            break
          default:
            alert('Error saving your profile. Please try again.')
        }
      } else {
        alert('Error saving your profile. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-clarity-background flex items-center justify-center">
        <div className="clarity-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clarity-accent"></div>
            <p className="ml-4 text-clarity-text-secondary">Loading your profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-clarity-background flex items-center justify-center">
        <div className="clarity-container">
          <div className="w-full max-w-md mx-auto">
            <AuthProvider 
              title="Complete Your Profile"
              subtitle="Sign in to finish setting up your personalized training experience"
              showBenefits={true}
            />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-clarity-background">
      <div className="clarity-container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-h1 font-bold text-clarity-text-primary mb-4">Build Your Blueprint</h1>
            <p className="text-body-lg text-clarity-text-secondary">
              Tell us about your athletic journey to get personalized training recommendations
            </p>
          </div>

          <div className="clarity-glass-card p-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="clarity-label">Sports you play</label>
                <div className="mt-3 flex flex-wrap gap-3">
                  {['soccer','basketball','baseball','football','tennis','volleyball','jiu-jitsu'].map(s => (
                    <label key={s} className="flex items-center gap-2 px-4 py-2 bg-clarity-surface border border-clarity-text-secondary/20 rounded-lg hover:border-clarity-accent/50 transition-colors cursor-pointer">
                      <input 
                        type="checkbox" 
                        value={s} 
                        className="text-clarity-accent focus:ring-clarity-accent/50"
                        onChange={e => {
                          const currentSports = watch('sports') || []
                          const set = new Set(currentSports)
                          if (e.target.checked) set.add(s); else set.delete(s)
                          setValue('sports', Array.from(set), { shouldValidate: true })
                        }} 
                      />
                      <span className="text-caption capitalize text-clarity-text-primary">{s}</span>
                    </label>
                  ))}
                </div>
                {errors.sports && <div className="clarity-input-error">{errors.sports.message as string}</div>}
              </div>

              <div>
                <label className="clarity-label">Current level</label>
                <select className="clarity-input" {...register('level')}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="clarity-label">Years of experience</label>
                  <input 
                    type="number" 
                    className="clarity-input" 
                    {...register('experienceYears', { valueAsNumber: true })} 
                  />
                </div>
                <div>
                  <label className="clarity-label">Hours available per week</label>
                  <input 
                    type="number" 
                    className="clarity-input" 
                    {...register('availabilityPerWeekHours', { valueAsNumber: true })} 
                  />
                </div>
              </div>

              <div>
                <label className="clarity-label">Preferred coaching style</label>
                <select className="clarity-input" {...register('preferredCoachStyle')}>
                  <option value="technical">Technical (mechanics)</option>
                  <option value="tactical">Tactical (game IQ)</option>
                  <option value="mindset">Mindset (psychology)</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>

              <div>
                <label className="clarity-label">Your goals</label>
                <textarea 
                  className="clarity-input" 
                  rows={4} 
                  placeholder="Tell us about your specific goals and what you want to improve..."
                  {...register('goals')} 
                />
                {errors.goals && <div className="clarity-input-error">{errors.goals.message as string}</div>}
              </div>

              <div className="pt-4">
                <button className="clarity-btn-primary w-full" type="submit">
                  Save and Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
