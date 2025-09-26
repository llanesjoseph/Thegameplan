'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase.client'
import { doc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const schema = z.object({
  sports: z.array(z.string()).min(1, 'Select at least one sport'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.string().min(10, 'Tell us a bit more about your goals'),
  experienceYears: z.number().min(0).max(50),
  availabilityPerWeekHours: z.number().min(1).max(40),
  preferredCoachStyle: z.enum(['technical', 'tactical', 'mindset', 'balanced'])
})
type FormValues = z.infer<typeof schema>

const steps = [
  {
    id: 1,
    title: "What's Your Sport?",
    subtitle: "Tell us what you love to play",
    fields: ['sports', 'level']
  },
  {
    id: 2,
    title: "Your Goals & Experience",
    subtitle: "Help us understand your journey",
    fields: ['goals', 'experienceYears']
  },
  {
    id: 3,
    title: "Training Preferences",
    subtitle: "Let's personalize your experience",
    fields: ['availabilityPerWeekHours', 'preferredCoachStyle']
  }
]

export default function ProgressiveOnboarding() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<FormValues>({
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

  const currentStepData = steps.find(step => step.id === currentStep)!

  const validateCurrentStep = async () => {
    const fieldsToValidate = currentStepData.fields as (keyof FormValues)[]
    const isValid = await trigger(fieldsToValidate)
    return isValid
  }

  const nextStep = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      alert('Please sign in to continue')
      return
    }

    setIsSubmitting(true)
    try {
      const uid = user.uid
      
      await setDoc(doc(db, 'users', uid), {
        sports: values.sports,
        skillLevel: values.level,
        goals: [values.goals],
        experienceYears: values.experienceYears,
        availabilityPerWeekHours: values.availabilityPerWeekHours,
        preferredCoachStyle: values.preferredCoachStyle,
        role: 'user',
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true })

      // Optional analytics logging
      try {
        const fn = httpsCallable(getFunctions(), 'log_event')
        await fn({ type: 'onboarding_completed', payload: { sports: values.sports, level: values.level } })
      } catch (analyticsError) {
        console.warn('Analytics logging failed:', analyticsError)
      }

      router.push('/dashboard?welcome=true')

    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Error saving your profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-clarity-background">
      <div className="clarity-container py-10">
        <div className="max-w-2xl mx-auto">
          
          {/* Progress Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                    ${currentStep > step.id 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.id 
                        ? 'bg-clarity-accent text-white' 
                        : 'bg-clarity-text-secondary/20 text-clarity-text-secondary'
                    }
                  `}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-1 mx-3 rounded-full transition-all
                      ${currentStep > step.id ? 'bg-green-500' : 'bg-clarity-text-secondary/20'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            
            <h1 className="text-h1 font-bold text-clarity-text-primary mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-body-lg text-clarity-text-secondary">
              {currentStepData.subtitle}
            </p>
            <p className="text-sm text-clarity-text-secondary mt-2">
              Step {currentStep} of {steps.length}
            </p>
          </div>

          <div className="clarity-glass-card p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              
              {/* Step 1: Sports & Level */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="clarity-label">Sports you play</label>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['soccer','basketball','baseball','football','tennis','volleyball','jiu-jitsu'].map(sport => (
                        <label key={sport} className="flex items-center gap-2 px-4 py-3 bg-clarity-surface border border-clarity-text-secondary/20 rounded-lg hover:border-clarity-accent/50 transition-colors cursor-pointer">
                          <input 
                            type="checkbox" 
                            value={sport} 
                            className="text-clarity-accent focus:ring-clarity-accent/50"
                            onChange={e => {
                              const currentSports = watch('sports') || []
                              const set = new Set(currentSports)
                              if (e.target.checked) set.add(sport); else set.delete(sport)
                              setValue('sports', Array.from(set), { shouldValidate: true })
                            }} 
                            defaultChecked={sport === 'soccer'}
                          />
                          <span className="text-sm capitalize text-clarity-text-primary">{sport}</span>
                        </label>
                      ))}
                    </div>
                    {errors.sports && <div className="clarity-input-error mt-2">{errors.sports.message as string}</div>}
                  </div>

                  <div>
                    <label className="clarity-label">Current skill level</label>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[
                        { value: 'beginner', label: 'Beginner', desc: 'Just starting out' },
                        { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                        { value: 'advanced', label: 'Advanced', desc: 'Highly skilled' }
                      ].map(level => (
                        <label key={level.value} className="cursor-pointer">
                          <input 
                            type="radio" 
                            value={level.value} 
                            {...register('level')}
                            className="sr-only"
                            defaultChecked={level.value === 'intermediate'}
                          />
                          <div className={`
                            p-4 border rounded-lg text-center transition-all
                            ${watch('level') === level.value 
                              ? 'border-clarity-accent bg-clarity-accent/10 text-clarity-accent' 
                              : 'border-clarity-text-secondary/20 hover:border-clarity-accent/50'
                            }
                          `}>
                            <div className="font-semibold text-sm">{level.label}</div>
                            <div className="text-xs text-clarity-text-secondary mt-1">{level.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Experience */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="clarity-label">What are your goals?</label>
                    <textarea 
                      className="clarity-input mt-2" 
                      rows={4} 
                      placeholder="Tell us what you want to achieve. Be specific about skills you want to improve..."
                      {...register('goals')} 
                    />
                    {errors.goals && <div className="clarity-input-error mt-2">{errors.goals.message as string}</div>}
                  </div>

                  <div>
                    <label className="clarity-label">Years of experience</label>
                    <div className="mt-2 grid grid-cols-4 gap-3">
                      {[
                        { value: 0, label: '< 1 year' },
                        { value: 2, label: '1-3 years' },
                        { value: 5, label: '3-7 years' },
                        { value: 10, label: '7+ years' }
                      ].map(exp => (
                        <label key={exp.value} className="cursor-pointer">
                          <input 
                            type="radio" 
                            value={exp.value} 
                            {...register('experienceYears', { valueAsNumber: true })}
                            className="sr-only"
                            defaultChecked={exp.value === 2}
                          />
                          <div className={`
                            p-3 border rounded-lg text-center text-sm transition-all
                            ${watch('experienceYears') === exp.value 
                              ? 'border-clarity-accent bg-clarity-accent/10 text-clarity-accent' 
                              : 'border-clarity-text-secondary/20 hover:border-clarity-accent/50'
                            }
                          `}>
                            {exp.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="clarity-label">Hours available per week</label>
                    <div className="mt-2 grid grid-cols-4 gap-3">
                      {[
                        { value: 2, label: '1-3 hours' },
                        { value: 5, label: '3-7 hours' },
                        { value: 10, label: '7-12 hours' },
                        { value: 15, label: '12+ hours' }
                      ].map(hours => (
                        <label key={hours.value} className="cursor-pointer">
                          <input 
                            type="radio" 
                            value={hours.value} 
                            {...register('availabilityPerWeekHours', { valueAsNumber: true })}
                            className="sr-only"
                            defaultChecked={hours.value === 5}
                          />
                          <div className={`
                            p-3 border rounded-lg text-center text-sm transition-all
                            ${watch('availabilityPerWeekHours') === hours.value 
                              ? 'border-clarity-accent bg-clarity-accent/10 text-clarity-accent' 
                              : 'border-clarity-text-secondary/20 hover:border-clarity-accent/50'
                            }
                          `}>
                            {hours.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="clarity-label">Preferred coaching style</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {[
                        { value: 'technical', label: 'Technical', desc: 'Focus on mechanics & form' },
                        { value: 'tactical', label: 'Tactical', desc: 'Game strategy & IQ' },
                        { value: 'mindset', label: 'Mindset', desc: 'Mental performance' },
                        { value: 'balanced', label: 'Balanced', desc: 'Mix of all approaches' }
                      ].map(style => (
                        <label key={style.value} className="cursor-pointer">
                          <input 
                            type="radio" 
                            value={style.value} 
                            {...register('preferredCoachStyle')}
                            className="sr-only"
                            defaultChecked={style.value === 'balanced'}
                          />
                          <div className={`
                            p-4 border rounded-lg transition-all
                            ${watch('preferredCoachStyle') === style.value 
                              ? 'border-clarity-accent bg-clarity-accent/10 text-clarity-accent' 
                              : 'border-clarity-text-secondary/20 hover:border-clarity-accent/50'
                            }
                          `}>
                            <div className="font-semibold text-sm">{style.label}</div>
                            <div className="text-xs text-clarity-text-secondary mt-1">{style.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                    ${currentStep === 1 
                      ? 'opacity-50 cursor-not-allowed text-clarity-text-secondary' 
                      : 'text-clarity-text-primary hover:bg-clarity-surface border border-clarity-text-secondary/20'
                    }
                  `}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 clarity-btn-primary px-6 py-3"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 clarity-btn-primary px-6 py-3 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Complete Setup'}
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
