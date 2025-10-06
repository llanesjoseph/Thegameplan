'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/hooks/use-auth'
import { applyForCreatorRole } from '@/lib/role-management'

type ApplicationStep = 'basic' | 'credentials' | 'content' | 'media' | 'schedule' | 'review'

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
 // Schedule & Availability
 weeklySchedule: {
  [day: string]: {
   available: boolean
   timeSlots: Array<{
    startTime: string
    endTime: string
    sessionTypes: string[]
   }>
  }
 }
 preferredSessionLength: string[]
 maxStudentsPerGroup: number
 sessionTypes: string[]
 status: 'pending' | 'approved' | 'rejected'
 submittedAt: any
 reviewedAt?: any
 reviewerNotes?: string
}

const SPORTS = ['Soccer','Basketball','Baseball','Tennis','Brazilian Jiu-Jitsu','Running','Volleyball','Swimming','American Football','Golf','Boxing','Track & Field']
const EXPERIENCES = ['college','pro','olympic','coach','analyst','other']

// Schedule & Availability Options
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const SESSION_TYPES = ['1-on-1 Coaching', 'Small Group (2-4)', 'Team Sessions (5+)', 'Video Analysis', 'Q&A Sessions', 'Masterclasses']
const SESSION_LENGTHS = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '90 minutes', '2 hours']
const TIME_SLOTS = [
 '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
 '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
 '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
]

// Sport-specific specialties
const SPORT_SPECIALTIES = {
 soccer: ['technical-skills', 'tactical-awareness', 'goalkeeping', 'defense', 'midfield', 'attack', 'set-pieces', 'crossing', 'finishing', 'passing', 'dribbling', 'first-touch', 'shooting', 'positioning', 'mental-toughness', 'penalty-kicks', 'free-kicks', 'corner-kicks', 'throw-ins', 'offside-trap', 'pressing', 'counter-attacking', 'possession-play', 'wing-play', 'central-play', 'defensive-shape', 'attacking-shape', 'transitions', 'game-management', 'leadership', 'communication', 'fitness-conditioning', 'injury-prevention', 'youth-development', 'formations', '1v1-defending', '1v1-attacking', 'aerial-duels', 'ball-striking', 'volleys', 'headers', 'weak-foot-development'],
 basketball: ['shooting', 'ball-handling', 'defense', 'rebounding', 'passing', 'post-play', 'pick-and-roll', 'fast-break', 'zone-defense', 'man-to-man', 'free-throws', 'three-point-shooting', 'court-vision', 'leadership', 'footwork', 'screening', 'cutting', 'transition-offense', 'transition-defense', 'half-court-offense', 'press-break', 'inbounds-plays', 'shot-blocking', 'steal-techniques', 'help-defense', 'closeouts', 'boxing-out', 'offensive-rebounding', 'defensive-rebounding', 'point-guard-skills', 'shooting-guard-skills', 'small-forward-skills', 'power-forward-skills', 'center-skills', 'clutch-performance', 'game-management', 'conditioning', 'agility-training', 'vertical-jump', 'lateral-quickness', 'mental-toughness', 'team-chemistry', 'communication'],
 football: ['quarterback-play', 'offensive-line', 'defensive-line', 'linebacker', 'secondary', 'special-teams', 'route-running', 'pass-coverage', 'run-blocking', 'pass-rushing', 'kicking', 'punting', 'return-game', 'red-zone', 'running-back-skills', 'wide-receiver-skills', 'tight-end-skills', 'center-skills', 'guard-skills', 'tackle-skills', 'defensive-end-skills', 'defensive-tackle-skills', 'outside-linebacker', 'inside-linebacker', 'cornerback-skills', 'safety-skills', 'blitz-packages', 'coverage-schemes', 'run-defense', 'pass-rush-techniques', 'blocking-schemes', 'play-action', 'screen-passes', 'goal-line-offense', 'goal-line-defense', 'two-minute-offense', 'clock-management', 'audibles', 'hot-routes', 'formation-recognition', 'film-study', 'leadership', 'communication', 'conditioning', 'strength-training', 'injury-prevention', 'mental-toughness'],
 baseball: ['hitting', 'pitching', 'fielding', 'base-running', 'catching', 'infield-defense', 'outfield-defense', 'bunting', 'situational-hitting', 'relief-pitching', 'starting-pitching', 'mental-approach', 'game-calling', 'batting-stance', 'swing-mechanics', 'plate-discipline', 'two-strike-hitting', 'clutch-hitting', 'power-hitting', 'contact-hitting', 'switch-hitting', 'fastball-command', 'breaking-balls', 'changeup', 'pitch-sequencing', 'pickoff-moves', 'fielding-position', 'double-plays', 'cutoffs-relays', 'bunt-defense', 'stealing-bases', 'reading-pitchers', 'sliding-techniques', 'first-base-skills', 'second-base-skills', 'shortstop-skills', 'third-base-skills', 'catcher-framing', 'catcher-blocking', 'throwing-runners-out', 'pitch-calling', 'mound-visits', 'bullpen-management', 'lineup-construction', 'in-game-strategy', 'situational-awareness', 'pressure-situations', 'playoff-mentality'],
 tennis: ['forehand', 'backhand', 'serve', 'volley', 'return', 'movement', 'singles-strategy', 'doubles-strategy', 'mental-toughness', 'fitness', 'court-positioning', 'shot-selection', 'match-tactics', 'topspin', 'slice', 'drop-shots', 'lobs', 'passing-shots', 'approach-shots', 'overhead-smash', 'kick-serve', 'flat-serve', 'slice-serve', 'return-of-serve', 'net-play', 'baseline-play', 'all-court-game', 'clay-court-tactics', 'grass-court-tactics', 'hard-court-tactics', 'indoor-tennis', 'wind-conditions', 'pressure-points', 'tiebreak-strategy', 'set-strategy', 'match-strategy', 'recovery-between-points', 'footwork-patterns', 'split-step', 'first-step-quickness', 'lateral-movement', 'forward-backward-movement', 'balance-recovery', 'racquet-preparation', 'follow-through', 'grip-variations', 'string-tension', 'equipment-selection', 'injury-prevention', 'match-preparation', 'tournament-scheduling'],
 volleyball: ['serving', 'passing', 'setting', 'attacking', 'blocking', 'digging', 'libero-play', 'middle-blocking', 'outside-hitting', 'opposite-hitting', 'team-defense', 'rotation', 'communication', 'jump-serve', 'float-serve', 'topspin-serve', 'serve-receive', 'platform-passing', 'overhead-passing', 'quick-sets', 'back-sets', 'shoot-sets', 'dump-sets', 'approach-footwork', 'spiking-technique', 'tool-use', 'cross-court-hitting', 'line-hitting', 'roll-shots', 'tip-attacks', 'block-timing', 'block-positioning', 'soft-blocking', 'swing-blocking', 'dig-positioning', 'emergency-digs', 'pancake-digs', 'libero-positioning', 'substitution-patterns', 'front-row-defense', 'back-row-defense', 'transition-offense', 'out-of-system-play', 'timeout-strategy', 'match-momentum', 'pressure-serving', 'clutch-performance', 'team-chemistry', 'leadership-skills', 'court-awareness', 'anticipation-skills'],
 wrestling: ['takedowns', 'escapes', 'reversals', 'pins', 'top-position', 'bottom-position', 'neutral-position', 'conditioning', 'weight-cutting', 'mental-preparation', 'technique-drilling', 'match-strategy', 'single-leg-takedowns', 'double-leg-takedowns', 'high-crotch', 'duck-under', 'arm-drag', 'throw-by', 'sprawling', 'crossface', 'half-nelson', 'cradle', 'tilt', 'leg-rides', 'arm-bar-series', 'wrist-control', 'underhooks', 'overhooks', 'tie-ups', 'hand-fighting', 'level-changes', 'penetration-steps', 'finishing-takedowns', 'scrambling', 'funk-wrestling', 'chain-wrestling', 'mat-wrestling', 'neutral-stance', 'motion-offense', 'pressure-wrestling', 'defensive-wrestling', 'match-management', 'overtime-strategy', 'tournament-preparation', 'dual-meet-strategy', 'injury-prevention', 'flexibility-training', 'strength-training', 'cutting-weight-safely', 'mental-toughness', 'visualization', 'competition-nerves'],
 boxing: ['jab', 'cross', 'hook', 'uppercut', 'footwork', 'defense', 'head-movement', 'body-work', 'combinations', 'ring-generalship', 'conditioning', 'sparring', 'mental-preparation', 'weight-management', 'straight-left', 'straight-right', 'lead-hook', 'rear-hook', 'lead-uppercut', 'rear-uppercut', 'overhand-right', 'check-hook', 'pivot-punching', 'counter-punching', 'slip-and-counter', 'bob-and-weave', 'parrying', 'blocking', 'shoulder-roll', 'philly-shell', 'high-guard', 'long-guard', 'infighting', 'clinch-work', 'dirty-boxing', 'body-punching', 'liver-shots', 'solar-plexus', 'rhythm-boxing', 'timing', 'distance-management', 'ring-cutting', 'lateral-movement', 'forward-pressure', 'backward-movement', 'feinting', 'setup-punches', 'power-generation', 'hand-speed', 'punch-accuracy', 'punch-selection', 'round-strategy', 'fight-planning', 'opponent-analysis', 'amateur-boxing', 'professional-boxing'],
 mma: ['striking', 'grappling', 'wrestling', 'jiu-jitsu', 'muay-thai', 'boxing', 'takedown-defense', 'ground-and-pound', 'submissions', 'cage-work', 'cardio', 'weight-cutting', 'fight-IQ', 'mental-preparation', 'kickboxing', 'karate', 'taekwondo', 'dirty-boxing', 'clinch-striking', 'elbow-strikes', 'knee-strikes', 'leg-kicks', 'body-kicks', 'head-kicks', 'spinning-techniques', 'superman-punch', 'flying-knee', 'sprawl-and-brawl', 'lay-and-pray', 'submission-grappling', 'ground-control', 'guard-work', 'mount-attacks', 'side-control-attacks', 'back-control-attacks', 'scrambles', 'wall-work', 'cage-wrestling', 'dirty-boxing-clinch', 'thai-clinch', 'underhooks-clinch', 'collar-tie', 'takedown-setups', 'takedown-defense-sprawl', 'stuffing-takedowns', 'counter-wrestling', 'getting-back-up', 'wall-walking', 'fight-preparation', 'camp-planning', 'sparring-strategy', 'injury-management', 'recovery-protocols', 'nutrition-planning', 'mental-game', 'visualization-techniques', 'pressure-management'],
 jujitsu: ['guard-play', 'passing-guard', 'submissions', 'escapes', 'takedowns', 'sweeps', 'mount-position', 'side-control', 'back-control', 'half-guard', 'closed-guard', 'open-guard', 'spider-guard', 'de-la-riva', 'x-guard', 'butterfly-guard', 'triangle-chokes', 'armbars', 'kimuras', 'omoplatas', 'heel-hooks', 'knee-bars', 'chokes', 'guillotines', 'rear-naked-chokes', 'gi-techniques', 'no-gi-techniques', 'berimbolo', 'leg-locks', 'pressure-passing', 'flow-rolling', 'competition-strategy', 'self-defense', 'mental-game'],
 swimming: ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'starts', 'turns', 'breathing', 'stroke-technique', 'race-strategy', 'training-sets', 'dryland-training', 'nutrition', 'recovery', 'catch-technique', 'pull-phase', 'push-phase', 'body-position', 'streamlining', 'kick-technique', 'two-beat-kick', 'six-beat-kick', 'dolphin-kick', 'underwater-swimming', 'flip-turns', 'open-turns', 'dive-starts', 'relay-starts', 'backstroke-start', 'distance-per-stroke', 'stroke-rate', 'bilateral-breathing', 'hypoxic-training', 'pace-work', 'sprint-training', 'distance-training', 'im-training', 'taper-training', 'altitude-training', 'pool-training', 'open-water-swimming', 'sighting-technique', 'drafting', 'race-tactics', 'mental-preparation', 'visualization', 'goal-setting', 'competition-nerves', 'time-management', 'stroke-counting', 'negative-split', 'even-split', 'positive-split'],
 golf: ['driving', 'iron-play', 'short-game', 'putting', 'course-management', 'mental-game', 'swing-mechanics', 'club-selection', 'weather-play', 'pressure-situations', 'practice-routines', 'fitness', 'setup-fundamentals', 'grip-technique', 'stance-alignment', 'posture', 'ball-position', 'takeaway', 'backswing', 'downswing', 'impact-position', 'follow-through', 'tempo-rhythm', 'swing-plane', 'weight-transfer', 'hip-rotation', 'shoulder-turn', 'wrist-action', 'release-point', 'chipping', 'pitching', 'bunker-play', 'flop-shots', 'bump-and-run', 'putting-stroke', 'reading-greens', 'distance-control', 'lag-putting', 'short-putting', 'pre-shot-routine', 'course-strategy', 'risk-management', 'pin-hunting', 'playing-percentages', 'wind-play', 'rain-conditions', 'altitude-adjustments', 'uphill-downhill', 'sidehill-lies', 'rough-play', 'tree-trouble', 'water-hazards', 'sand-saves', 'scrambling', 'tournament-preparation', 'practice-planning', 'equipment-fitting', 'club-maintenance'],
 track: ['sprints', 'distance', 'hurdles', 'jumps', 'throws', 'starts', 'pacing', 'form', 'strength-training', 'mental-preparation', 'race-tactics', 'recovery', 'nutrition', '100m-technique', '200m-technique', '400m-technique', '800m-technique', '1500m-technique', '5000m-technique', '10000m-technique', 'marathon-technique', 'hurdle-technique', 'steeplechase', 'high-jump', 'pole-vault', 'long-jump', 'triple-jump', 'shot-put', 'discus', 'hammer-throw', 'javelin', 'decathlon', 'heptathlon', 'block-starts', 'acceleration-phase', 'drive-phase', 'maximum-velocity', 'speed-endurance', 'lactate-threshold', 'vo2-max', 'aerobic-base', 'anaerobic-power', 'running-economy', 'biomechanics', 'cadence', 'stride-length', 'ground-contact-time', 'vertical-oscillation', 'arm-swing', 'breathing-technique', 'race-strategy', 'kick-timing', 'negative-splits', 'even-pacing', 'surge-tactics', 'drafting', 'positioning', 'track-positioning', 'lane-discipline', 'relay-handoffs', 'baton-passing'],
 other: []
}

// Sport-specific content types
const SPORT_CONTENT_TYPES = {
 soccer: ['skill-tutorials', 'tactical-analysis', 'match-breakdowns', 'training-drills', 'goalkeeper-training', 'fitness-routines', 'mental-preparation', 'youth-development'],
 basketball: ['shooting-form', 'game-film-study', 'skill-development', 'team-concepts', 'individual-workouts', 'strength-training', 'mental-toughness', 'coaching-tips'],
 football: ['position-specific-training', 'scheme-breakdowns', 'technique-videos', 'conditioning-programs', 'film-study', 'recruiting-advice', 'injury-prevention', 'leadership-development'],
 baseball: ['hitting-mechanics', 'pitching-development', 'fielding-fundamentals', 'game-situations', 'mental-approach', 'strength-training', 'injury-prevention', 'parent-education'],
 tennis: ['stroke-technique', 'match-strategy', 'fitness-training', 'mental-game', 'practice-drills', 'equipment-advice', 'tournament-preparation', 'junior-development'],
 volleyball: ['skill-training', 'team-systems', 'position-play', 'conditioning', 'mental-training', 'coaching-education', 'recruiting-guidance', 'injury-prevention'],
 wrestling: ['technique-instruction', 'conditioning-programs', 'mental-preparation', 'weight-management', 'competition-strategy', 'strength-training', 'injury-prevention', 'coaching-development'],
 boxing: ['technique-training', 'pad-work', 'conditioning', 'mental-preparation', 'sparring-tips', 'nutrition-guidance', 'injury-prevention', 'amateur-development'],
 mma: ['technique-breakdowns', 'training-methods', 'fight-analysis', 'conditioning-programs', 'mental-preparation', 'nutrition-guidance', 'injury-prevention', 'career-guidance'],
 jujitsu: ['technique-tutorials', 'position-breakdowns', 'submission-chains', 'guard-passing-systems', 'escape-sequences', 'competition-preparation', 'rolling-sessions', 'drilling-routines', 'conceptual-lessons', 'flow-training', 'self-defense-applications', 'gi-vs-no-gi-differences', 'beginner-fundamentals', 'advanced-concepts', 'mental-game-development', 'injury-prevention', 'strength-conditioning', 'flexibility-mobility'],
 swimming: ['stroke-technique', 'training-sets', 'race-strategy', 'dryland-exercises', 'mental-preparation', 'nutrition-advice', 'injury-prevention', 'parent-guidance'],
 golf: ['swing-instruction', 'short-game-tips', 'course-strategy', 'mental-game', 'equipment-fitting', 'practice-routines', 'junior-development', 'fitness-training'],
 track: ['event-specific-training', 'technique-analysis', 'workout-design', 'mental-preparation', 'nutrition-guidance', 'injury-prevention', 'competition-strategy', 'coaching-education'],
 other: []
}

// Sport-specific target audiences
const SPORT_TARGET_AUDIENCES = {
 soccer: ['youth-players', 'high-school-players', 'college-players', 'adult-recreational', 'coaches', 'parents', 'goalkeepers', 'referees'],
 basketball: ['youth-players', 'high-school-players', 'college-players', 'adult-recreational', 'coaches', 'parents', 'officials', 'trainers'],
 football: ['youth-players', 'high-school-players', 'college-players', 'coaches', 'parents', 'officials', 'strength-coaches', 'athletic-directors'],
 baseball: ['little-league', 'high-school-players', 'college-players', 'adult-recreational', 'coaches', 'parents', 'umpires', 'travel-teams'],
 tennis: ['junior-players', 'high-school-players', 'college-players', 'adult-recreational', 'coaches', 'parents', 'tournament-players', 'teaching-pros'],
 volleyball: ['youth-players', 'high-school-players', 'college-players', 'adult-recreational', 'coaches', 'parents', 'club-players', 'officials'],
 wrestling: ['youth-wrestlers', 'high-school-wrestlers', 'college-wrestlers', 'coaches', 'parents', 'officials', 'strength-coaches', 'club-programs'],
 boxing: ['amateur-boxers', 'youth-boxers', 'adult-beginners', 'competitive-boxers', 'trainers', 'coaches', 'fitness-enthusiasts', 'parents'],
 mma: ['amateur-fighters', 'professional-fighters', 'beginners', 'coaches', 'trainers', 'fitness-enthusiasts', 'martial-artists', 'combat-sports-fans'],
 jujitsu: ['white-belts', 'blue-belts', 'purple-belts', 'brown-belts', 'black-belts', 'beginners', 'intermediate-practitioners', 'advanced-practitioners', 'competitors', 'hobbyists', 'instructors', 'gym-owners', 'parents-of-kids', 'women-practitioners', 'masters-athletes', 'self-defense-students', 'gi-players', 'no-gi-players', 'mma-crossovers'],
 swimming: ['age-group-swimmers', 'high-school-swimmers', 'college-swimmers', 'masters-swimmers', 'coaches', 'parents', 'fitness-swimmers', 'triathletes'],
 golf: ['junior-golfers', 'high-school-golfers', 'college-golfers', 'amateur-golfers', 'recreational-golfers', 'teaching-professionals', 'parents', 'golf-coaches'],
 track: ['youth-athletes', 'high-school-athletes', 'college-athletes', 'masters-athletes', 'coaches', 'parents', 'officials', 'distance-runners'],
 other: []
}

export default function ContributorApplicationPage() {
 const { user } = useAuth()
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
  motivation: '', availability: '', references: [''],
  // Schedule & Availability defaults
  weeklySchedule: {
   monday: { available: false, timeSlots: [] },
   tuesday: { available: false, timeSlots: [] },
   wednesday: { available: false, timeSlots: [] },
   thursday: { available: false, timeSlots: [] },
   friday: { available: false, timeSlots: [] },
   saturday: { available: false, timeSlots: [] },
   sunday: { available: false, timeSlots: [] }
  },
  preferredSessionLength: [],
  maxStudentsPerGroup: 4,
  sessionTypes: [],
  status: 'pending', submittedAt: null
 })

 const updateField = (k: keyof ContributorApplication, v: any) => setApplication(prev => ({ ...prev, [k]: v }))

 // Helper functions to get sport-specific options
 const getSportSpecialties = (sport: string) => {
  return SPORT_SPECIALTIES[sport as keyof typeof SPORT_SPECIALTIES] || []
 }

 const getSportContentTypes = (sport: string) => {
  return SPORT_CONTENT_TYPES[sport as keyof typeof SPORT_CONTENT_TYPES] || []
 }

 const getSportTargetAudiences = (sport: string) => {
  return SPORT_TARGET_AUDIENCES[sport as keyof typeof SPORT_TARGET_AUDIENCES] || []
 }

 // Reset related fields when sport changes
 const handleSportChange = (sport: string) => {
  updateField('primarySport', sport)
  // Clear existing selections since they may not be valid for the new sport
  updateField('specialties', [])
  updateField('contentTypes', [])
  updateField('targetAudience', [])
 }

 const validateStep = (step: ApplicationStep) => {
  switch (step) {
   case 'basic': return !!(application.firstName && application.lastName && application.email && application.dateOfBirth && application.location)
   case 'credentials': return !!(application.primarySport && application.experience && application.experienceDetails && application.achievements[0])
   case 'content': return !!(application.specialties.length && application.contentTypes.length && application.contentDescription)
   case 'media': return true
   case 'schedule': return !!(application.sessionTypes.length && application.preferredSessionLength.length && Object.values(application.weeklySchedule).some(day => day.available))
   default: return true
  }
 }

 const nextStep = () => { if (validateStep(currentStep)) { const steps: ApplicationStep[] = ['basic','credentials','content','media','schedule','review']; const i = steps.indexOf(currentStep); if (i < steps.length - 1) setCurrentStep(steps[i+1]) } }
 const prevStep = () => { const steps: ApplicationStep[] = ['basic','credentials','content','media','schedule','review']; const i = steps.indexOf(currentStep); if (i > 0) setCurrentStep(steps[i-1]) }

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
  if (!user?.uid) { alert('Please sign in to submit your application.'); return }
  
  setLoading(true)
  try {
   // Submit application to Firestore
   const applicationData = {
    ...application,
    userId: user.uid,
    userEmail: user.email,
    submittedAt: serverTimestamp(),
    status: 'pending'
   }
   
   const ref = await addDoc(collection(db, 'contributorApplications'), applicationData)
   
   // Update user role to indicate pending creator application
   await applyForCreatorRole(user.uid, { id: ref.id, ...applicationData })
   
   alert(`Application submitted successfully! Reference: ${ref.id}`)
   router.push('/dashboard/creator')
  } catch (error) {
   console.error('Error submitting application:', error)
   alert('Failed to submit application. Please try again.')
  } finally { 
   setLoading(false) 
  }
 }

 const stepPct = () => { const steps: ApplicationStep[] = ['basic','credentials','content','media','schedule','review']; const i = steps.indexOf(currentStep); return ((i+1)/steps.length)*100 }

 return (
  <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
   <div className="text-center mb-10">
    <h1 className="text-3xl sm:text-4xl text-gray-800 mb-3">Become a Coach</h1>
    <p className="text-gray-600">Share your expertise with the next generation of athletes.</p>
   </div>

   <div className="mb-8">
    <div className="flex justify-between items-center mb-2 text-gray-600 text-sm"><span>Application Progress</span><span>{Math.round(stepPct())}%</span></div>
    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-cardinal h-2 rounded-full transition-all" style={{ width: `${stepPct()}%` }} /></div>
   </div>

   <div className="flex justify-center gap-2 mb-8">
    {['basic','credentials','content','media','schedule','review'].map((s, i) => (
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
       <div><label className="block text-sm mb-2 text-gray-800">Primary Sport *</label><select value={application.primarySport} onChange={e=>handleSportChange(e.target.value)} className="w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"><option value="">Select</option>{SPORTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
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
      {application.primarySport ? (
       <>
        <div>
         <label className="block text-sm mb-2">Areas of Expertise for {application.primarySport.charAt(0).toUpperCase() + application.primarySport.slice(1)} *</label>
         {getSportSpecialties(application.primarySport).length > 0 ? (
          <div className="grid sm:grid-cols-3 gap-3">
           {getSportSpecialties(application.primarySport).map(s => (
            <label key={s} className="flex items-center gap-2">
             <input 
              type="checkbox" 
              checked={application.specialties.includes(s)} 
              onChange={(e)=>updateField('specialties', e.target.checked ? [...application.specialties,s] : application.specialties.filter(x=>x!==s))} 
              className="text-cardinal focus:ring-cardinal" 
             />
             <span className="text-sm capitalize">{s.replace(/-/g, ' ')}</span>
            </label>
           ))}
          </div>
         ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
           <p className="text-yellow-800 text-sm">Please add your own specialties for {application.primarySport}:</p>
           <input 
            type="text" 
            placeholder="Enter your specialties separated by commas"
            className="mt-2 w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"
            onBlur={(e) => {
             const customSpecialties = e.target.value.split(',').map(s => s.trim()).filter(s => s)
             updateField('specialties', customSpecialties)
            }}
           />
          </div>
         )}
        </div>
        <div>
         <label className="block text-sm mb-2">Content Types for {application.primarySport.charAt(0).toUpperCase() + application.primarySport.slice(1)} *</label>
         {getSportContentTypes(application.primarySport).length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
           {getSportContentTypes(application.primarySport).map(t => (
            <label key={t} className="flex items-center gap-2">
             <input 
              type="checkbox" 
              checked={application.contentTypes.includes(t)} 
              onChange={(e)=>updateField('contentTypes', e.target.checked ? [...application.contentTypes,t] : application.contentTypes.filter(x=>x!==t))} 
              className="text-cardinal focus:ring-cardinal" 
             />
             <span className="text-sm capitalize">{t.replace(/-/g, ' ')}</span>
            </label>
           ))}
          </div>
         ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
           <p className="text-yellow-800 text-sm">Please add your content types for {application.primarySport}:</p>
           <input 
            type="text" 
            placeholder="Enter content types separated by commas"
            className="mt-2 w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"
            onBlur={(e) => {
             const customContentTypes = e.target.value.split(',').map(s => s.trim()).filter(s => s)
             updateField('contentTypes', customContentTypes)
            }}
           />
          </div>
         )}
        </div>
        <div>
         <label className="block text-sm mb-2">Target Audience for {application.primarySport.charAt(0).toUpperCase() + application.primarySport.slice(1)} *</label>
         {getSportTargetAudiences(application.primarySport).length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
           {getSportTargetAudiences(application.primarySport).map(a => (
            <label key={a} className="flex items-center gap-2">
             <input 
              type="checkbox" 
              checked={application.targetAudience.includes(a)} 
              onChange={(e)=>updateField('targetAudience', e.target.checked ? [...application.targetAudience,a] : application.targetAudience.filter(x=>x!==a))} 
              className="text-cardinal focus:ring-cardinal" 
             />
             <span className="text-sm capitalize">{a.replace(/-/g, ' ')}</span>
            </label>
           ))}
          </div>
         ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
           <p className="text-yellow-800 text-sm">Please add your target audiences for {application.primarySport}:</p>
           <input 
            type="text" 
            placeholder="Enter target audiences separated by commas"
            className="mt-2 w-full bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"
            onBlur={(e) => {
             const customAudiences = e.target.value.split(',').map(s => s.trim()).filter(s => s)
             updateField('targetAudience', customAudiences)
            }}
           />
          </div>
         )}
        </div>
       </>
      ) : (
       <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">Please select a primary sport in the previous step to see relevant content options.</p>
       </div>
      )}
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

    {currentStep === 'schedule' && (
     <div className="space-y-6">
      <div className="text-center mb-8">
       <div className="w-16 h-16 bg-cardinal/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-cardinal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
       </div>
       <h2 className="text-2xl text-dark mb-2">Schedule & Availability</h2>
       <p className="text-gray-600">Let students know when you're available for coaching sessions</p>
      </div>

      {/* Session Types */}
      <div>
       <label className="block text-sm  text-gray-700 mb-3">Session Types You Offer *</label>
       <div className="grid md:grid-cols-2 gap-3">
        {SESSION_TYPES.map(type => (
         <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-cardinal/50 transition-colors cursor-pointer">
          <input
           type="checkbox"
           checked={application.sessionTypes.includes(type)}
           onChange={(e) => {
            const newTypes = e.target.checked
             ? [...application.sessionTypes, type]
             : application.sessionTypes.filter(t => t !== type)
            updateField('sessionTypes', newTypes)
           }}
           className="text-cardinal focus:ring-cardinal rounded"
          />
          <span className="text-sm ">{type}</span>
         </label>
        ))}
       </div>
      </div>

      {/* Preferred Session Lengths */}
      <div>
       <label className="block text-sm  text-gray-700 mb-3">Preferred Session Lengths *</label>
       <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {SESSION_LENGTHS.map(length => (
         <label key={length} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:border-cardinal/50 transition-colors cursor-pointer text-center">
          <input
           type="checkbox"
           checked={application.preferredSessionLength.includes(length)}
           onChange={(e) => {
            const newLengths = e.target.checked
             ? [...application.preferredSessionLength, length]
             : application.preferredSessionLength.filter(l => l !== length)
            updateField('preferredSessionLength', newLengths)
           }}
           className="text-cardinal focus:ring-cardinal rounded"
          />
          <span className="text-xs ">{length}</span>
         </label>
        ))}
       </div>
      </div>

      {/* Max Students for Group Sessions */}
      <div>
       <label className="block text-sm  text-gray-700 mb-2">Maximum Students per Group Session</label>
       <select
        value={application.maxStudentsPerGroup}
        onChange={(e) => updateField('maxStudentsPerGroup', parseInt(e.target.value))}
        className="w-full max-w-xs bg-white p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cardinal"
       >
        {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(num => (
         <option key={num} value={num}>{num} students</option>
        ))}
       </select>
      </div>

      {/* Weekly Schedule */}
      <div>
       <label className="block text-sm  text-gray-700 mb-4">Weekly Availability *</label>
       <p className="text-sm text-gray-600 mb-4">Select the days and times when you're available for coaching sessions (in your timezone: {application.timezone || 'Not set'})</p>

       <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => (
         <div key={day} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
           <input
            type="checkbox"
            checked={application.weeklySchedule[day]?.available || false}
            onChange={(e) => {
             const newSchedule = { ...application.weeklySchedule }
             newSchedule[day] = {
              available: e.target.checked,
              timeSlots: e.target.checked ? [] : []
             }
             updateField('weeklySchedule', newSchedule)
            }}
            className="text-cardinal focus:ring-cardinal rounded"
           />
           <h4 className=" text-gray-800 capitalize">{day}</h4>
          </div>

          {application.weeklySchedule[day]?.available && (
           <div className="ml-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {TIME_SLOTS.map(time => {
              const daySchedule = application.weeklySchedule[day]
              const isSelected = daySchedule?.timeSlots?.some(slot => slot.startTime === time)

              return (
               <button
                key={time}
                type="button"
                onClick={() => {
                 const newSchedule = { ...application.weeklySchedule }
                 const daySlots = newSchedule[day].timeSlots || []

                 if (isSelected) {
                  // Remove time slot
                  newSchedule[day].timeSlots = daySlots.filter(slot => slot.startTime !== time)
                 } else {
                  // Add time slot with 60-minute duration by default
                  const endTime = TIME_SLOTS[TIME_SLOTS.indexOf(time) + 2] || '23:00' // 1 hour later
                  newSchedule[day].timeSlots = [...daySlots, {
                   startTime: time,
                   endTime: endTime,
                   sessionTypes: [...application.sessionTypes] // Copy selected session types
                  }]
                 }

                 updateField('weeklySchedule', newSchedule)
                }}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                 isSelected
                  ? 'bg-cardinal text-white border-cardinal'
                  : 'bg-gray-50 border-gray-200 hover:border-cardinal/50'
                }`}
               >
                {time}
               </button>
              )
             })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
             Selected times: {application.weeklySchedule[day]?.timeSlots?.length || 0} slots
            </p>
           </div>
          )}
         </div>
        ))}
       </div>
      </div>
     </div>
    )}

    {currentStep === 'review' && (
     <div className="space-y-6 text-gray-600">
      <div className="grid sm:grid-cols-2 gap-4">
       <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className=" mb-2 text-gray-800">Personal</h3>
        <p>Name: {application.firstName} {application.lastName}</p>
        <p>Email: {application.email}</p>
        <p>Location: {application.location}</p>
        <p>Timezone: {application.timezone}</p>
       </div>
       <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className=" mb-2 text-gray-800">Sport</h3>
        <p>Primary Sport: {application.primarySport}</p>
        <p>Experience: {application.experience}</p>
        <p>Years Active: {application.yearsActive}</p>
       </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
       <h3 className=" mb-2 text-gray-800">Specialties & Content</h3>
       <p>Specialties: {application.specialties.join(', ') || '—'}</p>
       <p>Content Types: {application.contentTypes.join(', ') || '—'}</p>
       <p>Audience: {application.targetAudience.join(', ') || '—'}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
       <h3 className=" mb-2 text-gray-800">Schedule & Availability</h3>
       <p>Session Types: {application.sessionTypes.join(', ') || '—'}</p>
       <p>Preferred Lengths: {application.preferredSessionLength.join(', ') || '—'}</p>
       <p>Max Group Size: {application.maxStudentsPerGroup} students</p>
       <p>Available Days: {Object.entries(application.weeklySchedule)
        .filter(([_, day]) => day.available)
        .map(([dayName, day]) => `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${day.timeSlots.length} slots)`)
        .join(', ') || '—'}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
       <h3 className=" mb-2 text-gray-800">Additional</h3>
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


