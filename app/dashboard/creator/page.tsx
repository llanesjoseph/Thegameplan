'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { auth, db, storage } from '@/lib/firebase.client'
import { useUrlEnhancedRole } from "@/hooks/use-url-role-switcher"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from 'next/navigation'
import CreatorAccessGate from '@/components/CreatorAccessGate'
import { collection, addDoc, query, where, getCountFromServer, serverTimestamp, getDoc, doc, getDocs, orderBy, deleteDoc } from 'firebase/firestore'
import { saveLessonData } from '@/lib/user-tracking-service'
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage'
// import { uploadService } from '@/lib/upload-service' // TEMPORARILY DISABLED TO FIX SSR ISSUES
import UploadManager from '@/components/UploadManager'
import VideoCompressionHelper from '@/components/VideoCompressionHelper'
import InAppVideoCompressor from '@/components/InAppVideoCompressor'
import GcsVideoUploader from '@/components/GcsVideoUploader'
import { 
 Play, 
 Upload, 
 Calendar, 
 Eye,
 Users,
 TrendingUp,
 Video,
 Image,
 Clock,
 CheckCircle,
 Plus,
 FileVideo,
 ArrowLeft,
 ExternalLink,
 Edit3,
 Trash2,
 MoreVertical,
 Bot,
 Sparkles,
 Lightbulb,
 Wand2,
 RefreshCw,
 ChevronDown,
 ChevronUp,
 FileText,
 RotateCcw,
 Pause,
 PlayCircle,
 X
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

// Title analysis function (same as in content-generation-service)
function analyzeLessonTitle(title: string, sport: string): {
 primaryFocus: string
 keySkills: string[]
 trainingType: string
 techniques: string[]
} {
 const lowerTitle = title.toLowerCase()

 // Determine primary focus based on keywords
 let primaryFocus = 'General Skill Development'
 if (lowerTitle.includes('drill') || lowerTitle.includes('practice methods')) {
  primaryFocus = 'Effective Practice Methods'
 } else if (lowerTitle.includes('progressive') || lowerTitle.includes('development')) {
  primaryFocus = 'Progressive Skill Building'
 } else if (lowerTitle.includes('advanced') || lowerTitle.includes('elite')) {
  primaryFocus = 'Advanced Technique Mastery'
 } else if (lowerTitle.includes('fundamental') || lowerTitle.includes('basic')) {
  primaryFocus = 'Fundamental Technique'
 } else if (lowerTitle.includes('conditioning') || lowerTitle.includes('fitness')) {
  primaryFocus = 'Physical Conditioning'
 } else if (lowerTitle.includes('mental') || lowerTitle.includes('psychology')) {
  primaryFocus = 'Mental Preparation'
 } else if (lowerTitle.includes('speed') || lowerTitle.includes('agility')) {
  primaryFocus = 'Athletic Performance Development'
 } else if (lowerTitle.includes('contact') || lowerTitle.includes('tackling')) {
  primaryFocus = 'Contact Technique Mastery'
 }

 // Extract key skills based on sport and title
 const keySkills: string[] = []
 const techniques: string[] = []

 if (sport.toLowerCase() === 'football' || sport.toLowerCase() === 'american football') {
  // American Football skill extraction
  if (lowerTitle.includes('blocking')) keySkills.push('Blocking Technique')
  if (lowerTitle.includes('tackling')) keySkills.push('Tackling Form')
  if (lowerTitle.includes('route') || lowerTitle.includes('receiving')) keySkills.push('Route Running')
  if (lowerTitle.includes('quarterback') || lowerTitle.includes('qb')) keySkills.push('Quarterback Mechanics')
  if (lowerTitle.includes('coverage') || lowerTitle.includes('defense')) keySkills.push('Defensive Coverage')
  if (lowerTitle.includes('rush') || lowerTitle.includes('running')) keySkills.push('Rush Technique')
  if (lowerTitle.includes('line') || lowerTitle.includes('lineman')) keySkills.push('Line Play')
  if (lowerTitle.includes('special teams')) keySkills.push('Special Teams')

  // For "football Skill Development: Progressive Training" - add general football skills
  if (lowerTitle.includes('skill development') || lowerTitle.includes('training')) {
   keySkills.push('Fundamental Stance and Alignment', 'Leverage and Pad Level', 'Footwork Mechanics', 'Hand Placement Technique')
  }

  // For "football Drills: Effective Practice Methods" - add drill-specific skills
  if (lowerTitle.includes('drill') || lowerTitle.includes('practice')) {
   keySkills.push('Agility and Speed Development', 'Conditioning and Endurance', 'Position-Specific Techniques', 'Team Coordination')
  }

  // Add more specific football drill types
  if (lowerTitle.includes('speed')) keySkills.push('Sprint Mechanics', 'Acceleration Training')
  if (lowerTitle.includes('agility')) keySkills.push('Change of Direction', 'Footwork Patterns')
  if (lowerTitle.includes('conditioning')) keySkills.push('Cardio Endurance', 'Strength Building')
  if (lowerTitle.includes('contact')) keySkills.push('Tackling Fundamentals', 'Contact Safety')

  // Extract specific techniques
  if (lowerTitle.includes('stance')) techniques.push('Proper Stance')
  if (lowerTitle.includes('footwork')) techniques.push('Footwork Mechanics')
  if (lowerTitle.includes('hand placement')) techniques.push('Hand Positioning')
  if (lowerTitle.includes('leverage')) techniques.push('Leverage Technique')
  if (lowerTitle.includes('pass protection')) techniques.push('Pass Protection')
  if (lowerTitle.includes('run fit')) techniques.push('Run Fit Assignment')
  if (lowerTitle.includes('progressive')) techniques.push('Progressive Skill Building', 'Systematic Development')
  if (lowerTitle.includes('drill')) techniques.push('Drill Progression', 'Practice Organization', 'Skill Repetition')
  if (lowerTitle.includes('effective') || lowerTitle.includes('method')) techniques.push('Training Efficiency', 'Skill Transfer')
  if (lowerTitle.includes('speed drill')) techniques.push('Sprint Start Technique', 'Running Form')
 } else if (sport.toLowerCase() === 'soccer') {
  // Soccer skill extraction - comprehensive
  if (lowerTitle.includes('passing')) keySkills.push('Passing Accuracy and Weight', 'Short and Long Distribution')
  if (lowerTitle.includes('shooting')) keySkills.push('Shooting Technique', 'Power and Placement Balance')
  if (lowerTitle.includes('dribbling')) keySkills.push('Ball Control', '1v1 Attacking Skills')
  if (lowerTitle.includes('defending')) keySkills.push('Defensive Positioning', 'Marking and Tackling')
  if (lowerTitle.includes('crossing')) keySkills.push('Wing Play', 'Delivery Quality and Timing')
  if (lowerTitle.includes('heading')) keySkills.push('Aerial Ability', 'Timing and Direction')
  if (lowerTitle.includes('goalkeeping')) keySkills.push('Shot Stopping', 'Distribution and Command')
  if (lowerTitle.includes('set piece')) keySkills.push('Set Piece Execution', 'Dead Ball Technique')
  if (lowerTitle.includes('tactical')) keySkills.push('Tactical Awareness', 'Game Reading')
  if (lowerTitle.includes('possession')) keySkills.push('Ball Retention', 'Pressure Resistance')
  if (lowerTitle.includes('counter attack')) keySkills.push('Transition Speed', 'Clinical Finishing')

  // Soccer drill-specific skills
  if (lowerTitle.includes('drill') || lowerTitle.includes('practice')) {
   keySkills.push('Technical Repetition', 'Match Simulation', 'Pressure Training', 'Small-Sided Games')
  }

  // Extract specific techniques
  if (lowerTitle.includes('first touch')) techniques.push('First Touch Control', 'Receiving Under Pressure')
  if (lowerTitle.includes('vision')) techniques.push('Field Vision', 'Scanning Technique')
  if (lowerTitle.includes('positioning')) techniques.push('Tactical Positioning', 'Space Creation')
  if (lowerTitle.includes('finishing')) techniques.push('Clinical Finishing', 'Composure in Box')
  if (lowerTitle.includes('free kick')) techniques.push('Dead Ball Striking', 'Wall Technique')
  if (lowerTitle.includes('corner')) techniques.push('Corner Delivery', 'Near/Far Post Runs')
 } else if (sport.toLowerCase() === 'bjj' || sport.toLowerCase() === 'brazilian jiu-jitsu') {
  // BJJ skill extraction
  if (lowerTitle.includes('guard')) keySkills.push('Guard Retention', 'Guard Passing', 'Sweep Timing')
  if (lowerTitle.includes('submission')) keySkills.push('Submission Chains', 'Control Before Attack')
  if (lowerTitle.includes('position')) keySkills.push('Positional Control', 'Transition Timing')
  if (lowerTitle.includes('escape')) keySkills.push('Hip Movement', 'Frame Creation', 'Defensive Concepts')
  if (lowerTitle.includes('takedown')) keySkills.push('Wrestling Fundamentals', 'Level Changes')
  if (lowerTitle.includes('sparring') || lowerTitle.includes('rolling')) keySkills.push('Live Training', 'Pressure Testing')

  // BJJ techniques
  if (lowerTitle.includes('armbar')) techniques.push('Arm Isolation', 'Hip Positioning')
  if (lowerTitle.includes('triangle')) techniques.push('Angle Creation', 'Leg Positioning')
  if (lowerTitle.includes('choke')) techniques.push('Collar Control', 'Finishing Mechanics')
  if (lowerTitle.includes('sweep')) techniques.push('Off-Balancing', 'Leverage Points')
  if (lowerTitle.includes('kimura')) {
   keySkills.push('Shoulder Control', 'Grip Fighting')
   techniques.push('Figure-Four Grip', 'Shoulder Isolation', 'Lock Mechanics')
  }
 } else if (sport.toLowerCase() === 'mma' || sport.toLowerCase() === 'mixed martial arts') {
  // MMA skill extraction
  if (lowerTitle.includes('striking')) keySkills.push('Stand-up Technique', 'Range Management')
  if (lowerTitle.includes('grappling')) keySkills.push('Takedowns', 'Ground Control')
  if (lowerTitle.includes('clinch')) keySkills.push('Dirty Boxing', 'Pummeling')
  if (lowerTitle.includes('conditioning')) keySkills.push('Fight Conditioning', 'Cardio Under Pressure')
  if (lowerTitle.includes('sparring')) keySkills.push('Live Training', 'Multiple Ranges')

  // MMA techniques
  if (lowerTitle.includes('jab')) techniques.push('Boxing Fundamentals', 'Distance Management')
  if (lowerTitle.includes('kick')) techniques.push('Muay Thai Technique', 'Balance and Recovery')
  if (lowerTitle.includes('takedown')) techniques.push('Wrestling Entries', 'Chain Wrestling')
 }

 // Default skills if none detected - make sport-specific
 if (keySkills.length === 0) {
  if (sport.toLowerCase() === 'football' || sport.toLowerCase() === 'american football') {
   keySkills.push('Fundamentals and Form', 'Team Coordination', 'Situational Awareness')
  } else if (sport.toLowerCase() === 'soccer') {
   keySkills.push('Ball Control and Technique', 'Field Vision and Decision Making', 'Team Tactical Understanding')
  } else if (sport.toLowerCase() === 'bjj' || sport.toLowerCase() === 'brazilian jiu-jitsu') {
   keySkills.push('Technical Precision', 'Positional Control', 'Systematic Problem Solving')
  } else if (sport.toLowerCase() === 'mma' || sport.toLowerCase() === 'mixed martial arts') {
   keySkills.push('Multi-Range Combat', 'Adaptability and Strategy', 'Pressure Performance')
  } else {
   keySkills.push('Technical Development', 'Tactical Understanding', 'Performance Optimization')
  }
 }

 // Determine training type
 let trainingType = 'Technical Training'
 if (lowerTitle.includes('drill') || lowerTitle.includes('practice')) {
  trainingType = 'Drill-Based Practice'
 } else if (lowerTitle.includes('conditioning') || lowerTitle.includes('fitness')) {
  trainingType = 'Physical Conditioning'
 } else if (lowerTitle.includes('tactical') || lowerTitle.includes('strategy')) {
  trainingType = 'Tactical Development'
 } else if (lowerTitle.includes('game') || lowerTitle.includes('match')) {
  trainingType = 'Game Application'
 }

 return {
  primaryFocus,
  keySkills,
  trainingType,
  techniques
 }
}

// Enhanced fallback content generator with sport-specific knowledge and title analysis
function generateSportSpecificFallback(title: string, sport: string): string {
 // Use the same title analysis system as the main content generator
 const titleAnalysis = analyzeLessonTitle(title, sport)
 const sportLowercase = sport.toLowerCase()


 // Default coach context for fallback
 const coachingContext = { coachName: 'Coach Johnson', voiceCharacteristics: { catchphrases: ['Perfect practice makes perfect!'] } }
 const skillLevel = 'intermediate'

 // Soccer specific content
 if (sportLowercase === 'soccer' || sportLowercase === 'futbol' || sportLowercase === 'association football') {
  return `# ${title}

## Lesson Overview
This comprehensive soccer lesson specifically focuses on "${title}" and covers ${titleAnalysis.primaryFocus}. This ${titleAnalysis.trainingType} session will develop the key skills identified in this lesson: ${titleAnalysis.keySkills.join(', ')}.

**What You'll Master in This Lesson:**
${titleAnalysis.keySkills.map(skill => `• ${skill}`).join('\n')}
${titleAnalysis.techniques.length > 0 ? '\n**Specific Techniques You\'ll Learn:**\n' + titleAnalysis.techniques.map(technique => `• ${technique}`).join('\n') : ''}

## Technical Breakdown
${titleAnalysis.keySkills.includes('Technical Repetition') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`**Soccer-Specific Training Methods:**
• **Progressive Overload**: Increase difficulty while maintaining technical quality
• **Small-Sided Games**: 3v3, 4v4 formats for realistic pressure situations
• **Possession-Based Drills**: Maintain ball control under varying pressure levels
• **Transition Training**: Switch between attack and defense quickly and efficiently` :
`**Soccer Core Mechanics:**
• **Body Shape**: Open stance to receive, scan field before ball arrives
• **First Touch Control**: Cushion ball with inside foot, direct away from pressure
• **Field Scanning**: Look over shoulder 3-4 times before receiving pass
• **Ball Manipulation**: Use all surfaces of foot for close control and direction changes`}

## Key Fundamentals
• **Technique Over Strength**: Master proper mechanics before adding power or speed
• **Consistency**: Develop muscle memory through deliberate, repetitive practice
• **Game Intelligence**: Read situations 2-3 seconds ahead of play development
• **Mental Preparation**: Visualize successful execution before attempting

## Practice Drills
${titleAnalysis.keySkills.includes('Technical Repetition') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`1. **Cone Weaving with Ball Control**: Develop close control and change of direction
2. **1v1 Box Battles**: Small space attacking and defending for pressure training
3. **Passing Triangle Circuits**: Quick passing with movement and communication
4. **Shooting Gallery**: Varied finish types from different angles and distances
5. **Small-Sided Possession**: 4v2 keep-away in 15x15 yard boxes` :
`1. **Juggling Progression**: Start with hands, progress to feet-only ball control
2. **Wall Pass Accuracy**: Use wall or rebounder for passing technique refinement
3. **Cone Dribbling**: Develop close control through slalom and figure-8 patterns
4. **Shooting Technique**: Focus on inside foot placement and follow-through`}

## Game Application
**Match Situations:**
• Recognize when to apply this technique during live play
• Understand positioning and timing within team tactical structure
• Adapt execution based on opponent pressure and field conditions
• Communicate effectively with teammates during application

## Common Mistakes & Corrections
• **Mistake**: Looking down at ball instead of scanning field → **Correction**: Practice peripheral vision training
• **Mistake**: Rushing execution under pressure → **Correction**: Develop composure through repeated pressure training
• **Mistake**: Using only dominant foot → **Correction**: Dedicate specific time to weak foot development
• **Mistake**: Poor body positioning → **Correction**: Focus on stance and balance fundamentals

## Progression Tips
• Master basics before advancing to complex variations
• Train both feet equally to become unpredictable
• Practice under game-speed conditions
• Seek feedback from experienced coaches and players
• Video analysis for technical refinement

## Safety Considerations
• Always warm up with dynamic stretching and ball work
• Use proper shin guards during contact training
• Stay hydrated throughout session
• Progress intensity gradually to prevent injury
• Train on appropriate surfaces for technique development

## Pro Insights
**Elite-Level Secrets:**
• Your first touch determines the quality of your next move
• Great players make decisions before receiving the ball
• Consistency under pressure separates good from great
• Mental preparation is as important as physical training

**Remember**: Champions are made in practice, revealed in games. Trust your preparation and execute with confidence!

*This lesson plan provides structured development for players serious about elevating their game to the next level.*`
 }

 // American Football specific content
 if (sportLowercase === 'football' || sportLowercase === 'american football' || sportLowercase === 'gridiron') {
  return `# ${title}

## Lesson Overview
This comprehensive American Football lesson specifically focuses on "${title}" and covers ${titleAnalysis.primaryFocus}. This ${titleAnalysis.trainingType} session will develop the key skills identified in this lesson: ${titleAnalysis.keySkills.join(', ')}.

**What You'll Master in This Lesson:**
${titleAnalysis.keySkills.map(skill => `• ${skill}`).join('\n')}
${titleAnalysis.techniques.length > 0 ? '\n**Specific Techniques You\'ll Learn:**\n' + titleAnalysis.techniques.map(technique => `• ${technique}`).join('\n') : ''}

## Technical Breakdown
${titleAnalysis.primaryFocus === 'Effective Practice Methods' || titleAnalysis.keySkills.includes('Agility and Speed Development') ?
`**Practice Methods & Drill Organization:**
• **Drill Structure**: Systematic progression from basic skills to game application
• **Practice Efficiency**: Maximize repetitions while maintaining quality execution
• **Skill Transfer**: Design drills that directly translate to game performance
• **Progressive Development**: Build complexity gradually with proper foundation

**Drill-Specific Focus Areas:**
• **Speed and Agility**: Develop explosive first-step quickness and directional changes
• **Conditioning**: Build game-specific endurance and stamina through targeted drills
• **Position Techniques**: Master role-specific movements and responsibilities
• **Team Coordination**: Synchronize movements with teammates for maximum effectiveness` :
`**Core Fundamentals:**
• **Stance and Alignment**: Master proper pre-snap positioning for maximum effectiveness
• **Leverage and Pad Level**: Win battles by getting lower than your opponent
• **Footwork and Movement**: Develop precise steps for every position and situation
• **Hand Placement**: Control opponents through proper hand positioning and technique`}

## Key Fundamentals
• **Preparation and Film Study**: Mental preparation creates competitive advantages
• **Communication**: Clear signals and calls prevent breakdowns and big plays
• **Execution Under Pressure**: Perform fundamentals automatically in high-pressure situations
• **Team Chemistry**: Trust and accountability enable complex schemes to succeed

## Practice Drills
${titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`1. **Foundational Movement Drills**: Master basic stance, starts, and footwork patterns
2. **Progressive Skill Building**: Layer complexity while maintaining fundamental quality
3. **Position-Specific Drills**: Target skills required for individual playing positions
4. **Team Integration Drills**: Combine individual skills into coordinated team execution
5. **Competition Simulation**: Practice under game-like pressure and time constraints
6. **Conditioning Integration**: Build fitness through football-specific movement patterns` :
`1. **Stance and Start Drill**: Perfect pre-snap positioning and first-step mechanics
2. **Leverage and Pad Level**: Practice winning battles through proper body positioning
3. **Communication Practice**: Work signals and calls under pressure situations
4. **Situational Execution**: Apply skills in game-like scenarios with time constraints`}

## Game Application
${titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`**Training-to-Competition Transfer:**
• Structure drills to mirror actual game situations and pressures
• Practice decision-making under time constraints and physical stress
• Develop muscle memory through high-quality repetitions
• Create competitive environments that simulate game intensity
• Build confidence through systematic skill progression from simple to complex` :
`**Match Situations:**
• Recognize pre-snap keys and make appropriate adjustments
• Execute assignments within team scheme and strategy
• Communicate effectively with teammates during high-pressure moments
• Adapt to opponent adjustments and changing game situations`}

## Common Mistakes & Corrections
• **Mistake**: Poor stance leading to slow starts → **Correction**: Focus on weight distribution and ready position
• **Mistake**: Playing too high losing leverage → **Correction**: Emphasize pad level and getting low first
• **Mistake**: Mental errors and missed assignments → **Correction**: Increase film study and communication practice
• **Mistake**: Inadequate preparation for game situations → **Correction**: Practice situational drills regularly

## Progression Tips
• Master your stance and alignment before advancing to complex techniques
• Study film extensively to understand schemes and opponent tendencies
• Develop both physical skills and mental understanding of the game
• Practice communication and leadership skills alongside technical development
• Focus on consistency in fundamentals under all conditions

## Safety Considerations
• Always use properly fitted helmet and protective equipment
• Learn and practice proper tackling technique with head up
• Understand concussion protocols and report any symptoms immediately
• Maintain proper hydration especially in hot weather conditions
• Follow proper warm-up and conditioning protocols to prevent injury

## Pro Insights
**Championship-Level Secrets:**
• Preparation and film study separate good players from great players
• Physical and mental toughness are both developed through disciplined training
• Master your assignment first, then help teammates with theirs
• Communication and trust enable complex schemes to function effectively

**Remember**: Perfect practice makes perfect. Train at game speed with game intensity, and your fundamentals will be automatic when it matters most!

*This lesson emphasizes the systematic approach that builds championship-level football players and teams.*`
 }

 // BJJ specific content
 if (sportLowercase === 'bjj' || sportLowercase === 'brazilian jiu-jitsu') {
  return `# ${title}

## Lesson Overview
This systematic Brazilian Jiu-Jitsu lesson on "${title}" emphasizes technical precision over strength. As an IBJJF World Champion approach, this training develops conceptual understanding alongside practical application.

## Technical Breakdown
${titleAnalysis.keySkills.includes('Live Training') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`**BJJ Training Methodology:**
• **Positional Sparring**: Start from specific positions, work problem-solving
• **Flow Rolling**: Light resistance to develop timing and transitions
• **Technical Drilling**: High repetition with progressive resistance
• **Situational Training**: Escape bad positions, maintain good positions` :
`**BJJ Core Principles:**
• **Position Before Submission**: Control hierarchy - mount, back, side control
• **Leverage Over Strength**: Use hip movement and body mechanics efficiently
• **Base and Posture**: Maintain structural integrity in all positions
• **Systematic Approach**: Connect techniques in logical sequences and chains`}

## Key Fundamentals
• **Systematic Development**: Build techniques on solid foundational principles
• **Conceptual Understanding**: Learn the why behind each movement
• **Technical Precision**: Perfect execution over forceful application
• **Mental Chess**: Think 2-3 moves ahead during rolling

## Practice Drills
${titleAnalysis.keySkills.includes('Live Training') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`1. **Position-Specific Drilling**: Mount escapes, guard retention, side control recovery
2. **Flow Rolling (30% resistance)**: Develop timing and transition recognition
3. **Submission Hunting**: Start from dominant position, work to finish
4. **Defensive Drilling**: Escape bad positions with proper hip movement
5. **Positional Sparring**: 3-minute rounds from specific starting positions` :
`1. **Solo Movement**: Hip escapes, bridges, technical stand-ups
2. **Partner Drilling**: Static position work with progressive resistance
3. **Submission Chains**: Connect related attacks with smooth transitions
4. **Live Training**: Situational sparring from specific positions`}

## Game Application
**Competition Strategy:**
• Identify optimal times to attempt techniques during live rolling
• Develop backup options when primary attacks are defended
• Control pace and create opportunities through patience
• Use opponent's reactions to set up subsequent techniques

## Common Mistakes & Corrections
• **Mistake**: Using strength instead of technique → **Correction**: Focus on leverage and timing
• **Mistake**: Rushing submissions → **Correction**: Secure position first, then attack
• **Mistake**: Poor hip movement → **Correction**: Drill fundamental movement patterns daily
• **Mistake**: Holding breath during rolling → **Correction**: Practice controlled breathing

## Progression Tips
• Master basic positions before learning advanced techniques
• Develop systematic approach to each position
• Train consistently rather than intensely
• Study high-level competition footage
• Keep training journal for technique notes

## Safety Considerations
• Tap early and often to prevent injury
• Warm up thoroughly, especially neck and shoulders
• Communicate with training partners about injuries
• Learn proper breakfalling techniques
• Progress gradually through skill levels

## Pro Insights
**Championship Mindset:**
• Technique conquers strength in all situations
• Small daily improvements compound over time
• Position before submission - always secure control first
• Train your mind like you train your body

**Remember**: It's not about being the strongest, it's about being the most technical. Trust the process and develop systematically!

*This lesson emphasizes the methodical approach that creates champions at the highest levels of competition.*`
 }

 // MMA specific content
 if (sportLowercase === 'mma' || sportLowercase === 'mixed martial arts') {
  return `# ${title}

## Lesson Overview
This comprehensive MMA lesson on "${title}" integrates multiple martial arts disciplines. Designed for serious competitors, this training develops skills across all ranges of combat while building fight IQ.

## Technical Breakdown
${titleAnalysis.keySkills.includes('Live Training') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`**MMA Training Integration:**
• **Range-Specific Sparring**: Boxing, kickboxing, wrestling, grappling sessions
• **MMA Sparring**: All ranges combined with proper protective gear
• **Drilling Chains**: Strike to takedown, ground to stand transitions
• **Conditioning Integration**: Build cardio through technical work` :
`**MMA Multi-Range Combat:**
• **Striking Range**: Jab, cross, hook, uppercut, kicks, knees, elbows
• **Clinch Range**: Dirty boxing, pummeling, trips, throws
• **Ground Range**: Top control, guard work, submission defense
• **Transition Mastery**: Seamless movement between all combat ranges`}

## Key Fundamentals
• **Adaptability**: Adjust strategy based on opponent's strengths and weaknesses
• **Systematic Training**: Develop all aspects while specializing in core strengths
• **Mental Toughness**: Build confidence through pressure testing
• **Match Planning**: Prepare specific strategies for different opponent types

## Practice Drills
${titleAnalysis.keySkills.includes('Live Training') || titleAnalysis.primaryFocus === 'Effective Practice Methods' ?
`1. **Boxing/Kickboxing Rounds**: 3-minute rounds with specific technique focus
2. **Wrestling Rounds**: Takedown attempts and sprawl defense practice
3. **Grappling Rounds**: Ground position work and submission attempts
4. **MMA Rounds**: All ranges combined with protective equipment
5. **Cardio Circuits**: Pad work, heavy bag, and conditioning drills` :
`1. **Shadow Boxing**: Work combinations and footwork without partner
2. **Pad Work**: Focus mitt training for timing and accuracy
3. **Heavy Bag Training**: Power development and technique refinement
4. **Grappling Dummy Work**: Practice takedowns and ground techniques`}

## Game Application
**Fight Strategy:**
• Identify optimal ranges for your skill set against specific opponents
• Develop entries and exits for each combat range
• Create and capitalize on opportunities during transitions
• Maintain composure under pressure and adversity

## Common Mistakes & Corrections
• **Mistake**: Neglecting one aspect of MMA → **Correction**: Train all ranges consistently
• **Mistake**: Poor cardio conditioning → **Correction**: Fight-specific conditioning protocols
• **Mistake**: Emotional fighting → **Correction**: Develop mental discipline and strategy
• **Mistake**: Inadequate defense → **Correction**: Emphasize defensive fundamentals

## Progression Tips
• Master fundamentals in each discipline before advanced techniques
• Spar regularly with different skill levels and styles
• Study fight footage to develop strategic thinking
• Cross-train with specialists in each martial art
• Compete regularly to test skills under pressure

## Safety Considerations
• Always use proper protective gear during sparring
• Start with light contact and gradually increase intensity
• Never train through head injuries or concussions
• Hydrate properly and monitor weight cutting
• Allow adequate recovery between intense sessions

## Pro Insights
**Elite Competition Secrets:**
• Master your defensive fundamentals before focusing on offense
• Develop multiple game plans for different opponent styles
• Mental preparation is as important as physical training
• Consistency in training beats sporadic intense sessions

**Remember**: The best fighters are problem solvers. Stay calm under pressure and adapt to any situation!

*This training approach develops complete mixed martial artists ready for high-level competition.*`
 }

 // Generic fallback for other sports
 return `# ${title}

## Lesson Overview
This comprehensive lesson on "${title}" provides systematic skill development through expert coaching methodology. Designed for serious athletes, this training combines technical proficiency with tactical understanding.

## Technical Breakdown
**Core Principles:**
• Master fundamental mechanics before advancing complexity
• Develop consistent execution through deliberate practice
• Understand when and how to apply skills in competition
• Build mental resilience alongside physical capabilities

## Key Fundamentals
• **Technical Precision**: Focus on proper form and execution
• **Progressive Development**: Build skills systematically over time
• **Mental Preparation**: Develop confidence through preparation
• **Competitive Application**: Practice skills under pressure

## Practice Drills
1. **Foundation Building**: Master basic movements and positions
2. **Skill Integration**: Combine techniques into flowing sequences
3. **Pressure Testing**: Apply skills under realistic conditions
4. **Competition Simulation**: Practice in game-like scenarios

## Safety Considerations
• Always warm up properly before training
• Use appropriate protective equipment
• Progress intensity gradually
• Listen to your body and rest when needed
• Train with qualified supervision

## Expert Tips
• Consistency beats perfection in skill development
• Mental preparation equals physical preparation
• Learn from both success and failure
• Trust your training when competing

*This lesson provides structured development for athletes committed to excellence.*`
}

export default function CreatorDashboard() {
 const { role, loading: loadingRole } = useUrlEnhancedRole()
 const { user: authUser, loading: authLoading } = useAuth()
 const router = useRouter()
 
 const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
 
 const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  level: z.enum(['All Levels', 'Beginner', 'Intermediate', 'Advanced']),
 })
 
 type FormValues = z.infer<typeof schema>
 const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { title: '', description: '', level: 'All Levels' }
 })
 
 const [videoFile, setVideoFile] = useState<File | null>(null)
 const [thumbFile, setThumbFile] = useState<File | null>(null)
 const [creating, setCreating] = useState(false)
 const [lessonCount, setLessonCount] = useState<number>(0)
 const [uploadSuccess, setUploadSuccess] = useState(false)
 const [publishedLessons, setPublishedLessons] = useState<any[]>([])
 const [loadingLessons, setLoadingLessons] = useState(false)
 const [uploadProgress, setUploadProgress] = useState<{video: number, thumbnail: number}>({video: 0, thumbnail: 0})
 const [uploadTasks, setUploadTasks] = useState<{video: any, thumbnail: any}>({video: null, thumbnail: null})
 const [uploadPaused, setUploadPaused] = useState<{video: boolean, thumbnail: boolean}>({video: false, thumbnail: false})
 const [useEnterpriseUpload, setUseEnterpriseUpload] = useState(false)
 const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)
 const [showCompressionHelper, setShowCompressionHelper] = useState(false)
 const [showInAppCompressor, setShowInAppCompressor] = useState(false)
 const [useGcsUpload, setUseGcsUpload] = useState(false)
 const [showGcsUploader, setShowGcsUploader] = useState(false)
 
 // AI Features State
 const [showAIFeatures, setShowAIFeatures] = useState(false)
 const [detailedWriteup, setDetailedWriteup] = useState('')

 const [generatingIdeas, setGeneratingIdeas] = useState(false)
 const [enhancingContent, setEnhancingContent] = useState(false)
 const [aiSuggestions, setAISuggestions] = useState<string[]>([])
 const [selectedSport, setSelectedSport] = useState('BJJ')

 // Load lesson count
 useEffect(() => {
  const loadLessonCount = async () => {
   if (!authUser) return
   try {
    const q = query(collection(db, 'content'), where('creatorUid', '==', authUser.uid))
    const snapshot = await getCountFromServer(q)
    setLessonCount(snapshot.data().count)
   } catch (error) {
    console.error('Error loading lesson count:', error)
   }
  }
  loadLessonCount()
 }, [authUser])

 const loadPublishedLessons = async () => {
  if (!authUser?.uid) return
  setLoadingLessons(true)
  try {
   // Simplified query without orderBy to avoid index issues
   const q = query(
    collection(db, 'content'),
    where('creatorUid', '==', authUser.uid)
   )
   const snapshot = await getDocs(q)
   const lessons = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   }))
   // Sort locally by createdAt if available
   lessons.sort((a: any, b: any) => {
    const aDate = a.createdAt?.toDate?.() || new Date(0)
    const bDate = b.createdAt?.toDate?.() || new Date(0)
    return bDate.getTime() - aDate.getTime()
   })
   setPublishedLessons(lessons)
  } catch (error) {
   console.error('Error loading lessons:', error)
   setPublishedLessons([]) // Set empty array on error
  } finally {
   setLoadingLessons(false)
  }
 }

 // Load published lessons for manage tab
 useEffect(() => {
  if (activeTab === 'manage' && authUser?.uid) {
   loadPublishedLessons()
  }
 }, [activeTab, authUser?.uid])

 // Debug compression helper state
 useEffect(() => {
  console.log('🗜️ Compression state:', {
   showCompressionHelper,
   showInAppCompressor,
   hasVideoFile: !!videoFile,
   videoFileName: videoFile?.name,
   shouldShowHelper: showCompressionHelper && videoFile,
   shouldShowInApp: showInAppCompressor && videoFile
  })
 }, [showCompressionHelper, showInAppCompressor, videoFile])

 const onSubmit = async (data: FormValues) => {
  if (!authUser) return

  console.log('🚀 Starting lesson creation:', {
   title: data.title,
   hasVideo: !!videoFile,
   videoSize: videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A',
   hasThumbnail: !!thumbFile,
   userUid: authUser.uid
  })

  setCreating(true)
  try {
   let videoUrl = ''
   let thumbnailUrl = ''

   // Upload video if provided - use enterprise upload for large files
   if (videoFile) {
    const uploadPath = `content/${authUser.uid}/${Date.now()}_${videoFile.name}`

    console.log('📹 Starting video upload:', {
     filename: videoFile.name,
     size: videoFile.size,
     path: uploadPath,
     useEnterprise: useEnterpriseUpload
    })

    if (useEnterpriseUpload) {
     // TEMPORARILY DISABLED - Use basic Firebase upload instead to fix SSR issues
     // const uploadId = await uploadService.startUpload({
     //  file: videoFile,
     //  path: uploadPath,
     //  onProgress: (progress, bytesTransferred, totalBytes) => {
     //   setUploadProgress(prev => ({ ...prev, video: Math.round(progress) }))
     //  },
     //  onSuccess: (downloadURL) => {
     //   videoUrl = downloadURL
     //   console.log('✅ Enterprise video upload completed:', downloadURL)
     //  },
     //  maxRetries: 5
     // })

     // setCurrentUploadId(uploadId)

     // Use basic Firebase upload instead
     console.log('📁 Using basic Firebase upload (enterprise temporarily disabled)')
     const storageRef = ref(storage, uploadPath)
     const uploadTask = uploadBytesResumable(storageRef, videoFile)

     await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed',
       (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(prev => ({ ...prev, video: Math.round(progress) }))
       },
       (error) => reject(error),
       async () => {
        videoUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve()
       }
      )
     })

     // Wait for upload completion
     // const checkUpload = () => {
     //  return new Promise<void>((resolve, reject) => {
     //   const interval = setInterval(() => {
     //    const uploadState = uploadService.getUploadState(uploadId)
     //    if (uploadState?.state === 'completed' && uploadState.downloadURL) {
     //     videoUrl = uploadState.downloadURL
     //     clearInterval(interval)
     //     resolve()
     //    } else if (uploadState?.state === 'error') {
     //     clearInterval(interval)
     //     reject(new Error(uploadState.error || 'Upload failed'))
     //    }
     //   }, 1000)
     //  })
     // }

     // await checkUpload() // Disabled - using direct Firebase upload above
    } else {
     // Use standard upload for smaller files
     const videoRef = ref(storage, uploadPath)
     const uploadTask = uploadBytesResumable(videoRef, videoFile)
     setUploadTasks(prev => ({ ...prev, video: uploadTask }))

     await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
       (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(prev => ({ ...prev, video: Math.round(progress) }))

        // Log upload status for large files
        if (videoFile.size > 100 * 1024 * 1024) {
         const mbTransferred = (snapshot.bytesTransferred / (1024 * 1024)).toFixed(1)
         const mbTotal = (snapshot.totalBytes / (1024 * 1024)).toFixed(1)
         console.log(`Video upload: ${mbTransferred}MB / ${mbTotal}MB (${Math.round(progress)}%)`)
        }
       },
       (error) => {
        console.error('Video upload error:', error)
        setUploadTasks(prev => ({ ...prev, video: null }))
        reject(error)
       },
       async () => {
        videoUrl = await getDownloadURL(uploadTask.snapshot.ref)
        console.log('✅ Standard video upload completed:', videoUrl)
        setUploadProgress(prev => ({ ...prev, video: 100 }))
        setUploadTasks(prev => ({ ...prev, video: null }))
        resolve(videoUrl)
       }
      )
     })
    }
   }

   // Upload thumbnail if provided with progress tracking
   if (thumbFile) {
    const thumbRef = ref(storage, `content/${authUser.uid}/thumb_${Date.now()}_${thumbFile.name}`)
    const uploadTask = uploadBytesResumable(thumbRef, thumbFile)

    await new Promise((resolve, reject) => {
     uploadTask.on('state_changed',
      (snapshot) => {
       const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
       setUploadProgress(prev => ({ ...prev, thumbnail: Math.round(progress) }))
      },
      (error) => {
       console.error('Thumbnail upload error:', error)
       reject(error)
      },
      async () => {
       thumbnailUrl = await getDownloadURL(uploadTask.snapshot.ref)
       setUploadProgress(prev => ({ ...prev, thumbnail: 100 }))
       resolve(thumbnailUrl)
      }
     )
    })
   }

   // Create lesson document
   const lessonData = {
    title: data.title,
    description: data.description,
    detailedWriteup: detailedWriteup,
    level: data.level,
    creatorUid: authUser.uid,
    videoUrl,
    thumbnail: thumbnailUrl,
    views: 0,
    status: 'published',
    visibility: 'public',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
   }

   // Save to content collection (existing)
   const contentRef = await addDoc(collection(db, 'content'), lessonData)
   console.log('✅ Lesson saved to content collection:', contentRef.id)

   // Also save using our tracking service for analytics and user stats
   const trackingLessonData = {
    userId: authUser.uid,
    title: data.title,
    sport: 'general', // You might want to add sport selection to the form
    difficulty: data.level as 'beginner' | 'intermediate' | 'advanced',
    content: {
     description: data.description,
     detailedWriteup: detailedWriteup,
     videoUrl,
     thumbnailUrl
    },
    isPublic: true,
    tags: [] // You might want to add tags to the form
   }

   const lessonId = await saveLessonData(trackingLessonData)
   if (lessonId) {
    console.log('✅ Lesson tracked in analytics:', lessonId)
   }
   
   // Reset form and show success
   reset()
   setVideoFile(null)
   setThumbFile(null)
   setDetailedWriteup('')
   setUploadProgress({video: 0, thumbnail: 0})
   setUploadTasks({video: null, thumbnail: null})
   setUploadPaused({video: false, thumbnail: false})
   setUploadSuccess(true)
   setLessonCount(prev => prev + 1)
   
  } catch (error) {
   console.error('Error creating lesson:', error)
  } finally {
   setCreating(false)
  }
 }

 const deleteLesson = async (lessonId: string) => {
  if (!confirm('Are you sure you want to delete this lesson?')) return

  try {
   await deleteDoc(doc(db, 'content', lessonId))
   setPublishedLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
   setLessonCount(prev => prev - 1)
  } catch (error) {
   console.error('Error deleting lesson:', error)
  }
 }

 const pauseUpload = (type: 'video' | 'thumbnail') => {
  const task = uploadTasks[type]
  if (task) {
   task.pause()
   setUploadPaused(prev => ({ ...prev, [type]: true }))
  }
 }

 const resumeUpload = (type: 'video' | 'thumbnail') => {
  const task = uploadTasks[type]
  if (task) {
   task.resume()
   setUploadPaused(prev => ({ ...prev, [type]: false }))
  }
 }

 const cancelUpload = (type: 'video' | 'thumbnail') => {
  const task = uploadTasks[type]
  if (task) {
   task.cancel()
   setUploadTasks(prev => ({ ...prev, [type]: null }))
   setUploadProgress(prev => ({ ...prev, [type]: 0 }))
   setUploadPaused(prev => ({ ...prev, [type]: false }))

   if (type === 'video') {
    setVideoFile(null)
   } else {
    setThumbFile(null)
   }
  }
 }

 // AI Helper Functions
 const generateLessonIdeas = async () => {
  setGeneratingIdeas(true)
  try {
   // Use our enhanced content generation service for professional lesson ideas
   const { generateContentIdeas } = await import('@/lib/content-generation-service')

   try {
    // Try to get professional sport-specific ideas from our service
    const enhancedIdeas = generateContentIdeas(selectedSport, 12)
    if (enhancedIdeas && enhancedIdeas.length > 0) {
     const shuffled = enhancedIdeas.sort(() => 0.5 - Math.random())
     setAISuggestions(shuffled.slice(0, 8))
     return
    }
   } catch (serviceError) {
    console.log('Using comprehensive local ideas for:', selectedSport)
   }

   // Comprehensive sport-specific fallback ideas
   let allIdeas = []

   if (selectedSport.toLowerCase() === 'football' || selectedSport.toLowerCase() === 'american football') {
    allIdeas = [
     // Fundamental Skills
     'Football Fundamentals: Stance, Starts, and Basic Footwork',
     'Blocking Techniques: Leverage, Pad Level, and Hand Placement',
     'Tackling Form: Safety, Technique, and Power',
     'Ball Security: Protecting the Football in All Situations',
     'Communication: On-Field Leadership and Signal Calling',

     // Position-Specific Training
     'Quarterback Mechanics: Footwork, Throwing, and Decision Making',
     'Receiver Route Running: Precision, Timing, and Separation',
     'Offensive Line Play: Pass Protection and Run Blocking Schemes',
     'Defensive Back Coverage: Man, Zone, and Press Techniques',
     'Linebacker Skills: Reading Keys and Filling Gaps',
     'Defensive Line Techniques: Rushing the Passer and Stopping the Run',
     'Running Back Vision: Reading Blocks and Finding Holes',

     // Team Concepts
     'Special Teams Excellence: Coverage, Returns, and Kicking Game',
     'Red Zone Efficiency: Scoring in Tight Spaces',
     'Third Down Conversions: Situational Football Mastery',
     'Two-Minute Drill: Clock Management and Execution',
     'Goal Line Defense: Stopping Short-Yardage Situations',
     'Screen Game: Timing, Execution, and Blocking',

     // Advanced Strategy
     'Film Study: Breaking Down Opponents and Self-Evaluation',
     'Match Planning: Preparing for Different Opponent Styles',
     'Audibles and Hot Routes: Adjusting at the Line',
     'Blitz Recognition and Protection: Reading Defensive Pressure',
     'Run Fits and Gap Responsibility: Defensive Assignment Football',
     'Coverage Concepts: Zone, Man, and Combination Coverages',

     // Training and Development
     'Football Conditioning: Sport-Specific Strength and Cardio',
     'Injury Prevention: Proper Tackling and Contact Techniques',
     'Mental Toughness: Overcoming Adversity in Competition',
     'Leadership Development: Being a Team Captain',
     'Football IQ: Understanding the Chess Match',
     'Practice Planning: Organizing Effective Team Sessions'
    ]
   } else if (selectedSport.toLowerCase() === 'soccer') {
    allIdeas = [
     // Technical Skills
     'Soccer First Touch: Controlling the Ball Under Pressure',
     'Passing Accuracy: Short, Medium, and Long Distribution',
     'Shooting Technique: Power, Placement, and Finishing',
     'Dribbling Skills: 1v1 Moves and Close Ball Control',
     'Heading Technique: Attacking and Defensive Headers',
     'Ball Control: Using All Surfaces of the Foot',

     // Tactical Understanding
     'Tactical Positioning: Understanding Space and Movement',
     'Pressing and Counter-Pressing: Winning the Ball Back',
     'Set Piece Mastery: Free Kicks, Corners, and Throw-ins',
     'Small-Sided Games: 3v3, 4v4 Training for Decision Making',
     'Transition Play: Defense to Attack and Attack to Defense',
     'Formation Play: Understanding 4-3-3, 4-4-2, and Modern Systems',

     // Position-Specific Training
     'Goalkeeping Fundamentals: Shot Stopping and Distribution',
     'Defender Skills: Marking, Tackling, and Positioning',
     'Midfielder Play: Box-to-Box and Specialist Roles',
     'Wing Play: Crossing, Cutting Inside, and Defensive Duties',
     'Striker Movement: Finding Space and Clinical Finishing',
     'Full-Back Play: Defending and Attacking Responsibilities',

     // Physical and Mental
     'Soccer Fitness: Endurance, Speed, and Agility Training',
     'Injury Prevention: Proper Warm-up and Recovery Methods',
     'Mental Game: Confidence, Focus, and Pressure Management',
     'Match Preparation: Pre-Game Routines and Visualization',
     'Team Chemistry: Communication and Understanding',

     // Advanced Concepts
     'Video Analysis: Learning from Professional Matches',
     'Youth Development: Building Skills from Early Age',
     'Nutrition for Soccer: Fueling Performance and Recovery',
     'Leadership on the Pitch: Captain Qualities and Communication',
     'Game Reading: Anticipation and Decision Making',
     'Soccer Psychology: Mental Preparation for Competition'
    ]
   } else if (selectedSport.toLowerCase() === 'bjj' || selectedSport.toLowerCase() === 'brazilian jiu-jitsu') {
    allIdeas = [
     // Guard Fundamentals
     'BJJ Guard Fundamentals: Closed Guard Control and Attacks',
     'Open Guard Mastery: Spider Guard and De La Riva',
     'Half Guard Essentials: Sweeps and Submissions',
     'Butterfly Guard: Hooks and Elevation Techniques',
     'X-Guard System: Entry and Sweep Mechanics',
     'Rubber Guard: Flexibility and Control',
     
     // Submissions
     'Advanced Triangle Chokes: Setup and Finishing Techniques',
     'Kimura Lock System: From Setup to Submission',
     'Armbar Mastery: Multiple Entry Points and Variations',
     'Rear Naked Choke: Perfect Technique and Timing',
     'Guillotine Choke Variations: High Elbow and Arm-in',
     'Omoplata System: Shoulder Lock and Transitions',
     'Heel Hooks: Entry, Control, and Finishing',
     'Americana/Keylock: Pressure and Positioning',
     'Ezekiel Choke: From Mount and Guard',
     'Loop Choke: Gi-Based Strangulation',
     
     // Escapes and Defense
     'Escaping Side Control: Hip Movement and Frame Techniques',
     'Mount Escape Fundamentals: Bridge and Roll Mechanics',
     'Back Escape: Hand Fighting and Hip Movement',
     'Turtle Position Defense: Protecting and Recovering',
     'Submission Defense: Posture and Hand Placement',
     'Guard Retention: Keeping Guard Under Pressure',
     
     // Positions and Control
     'Back Control Excellence: Securing and Finishing',
     'Mount Attacks: Submissions and Transitions',
     'Side Control Mastery: Pressure and Submissions',
     'Knee on Belly: Control and Attack Options',
     'North-South Position: Chokes and Transitions',
     'Scarf Hold: Old School Control and Attacks',
     
     // Transitions and Flow
     'Guard Passing Fundamentals: Pressure and Movement',
     'Transition Chains: Flowing Between Positions',
     'Takedown to Guard Pass: Standing to Ground',
     'Scrambling: Chaos Management and Recovery',
     'Berimbolo: Modern Guard Transition',
     
     // Gi vs No-Gi
     'Gi vs No-Gi Differences: Adapting Your Game',
     'Gi Grips: Collar and Sleeve Control',
     'No-Gi Fundamentals: Underhooks and Overhooks',
     'Lapel Guards: Worm Guard and Squid Guard',
     
     // Competition and Mental
     'Competition Strategy: Mental Preparation and Match Planning',
     'Rolling Intensity: Training Smart vs Training Hard',
     'Building Your A-Game: Developing Signature Moves',
     'Pressure vs Speed: Finding Your Style',
     'Recovery and Injury Prevention for BJJ Athletes',
     
     // Advanced Concepts
     'Leg Lock System: Modern Leg Attack Fundamentals',
     'Wrestling for BJJ: Takedowns and Top Control',
     'Judo Throws: Entries and Setups for BJJ',
     'Flow Rolling: Developing Smooth Transitions',
     'Countering Common Guard Passes',
     'Creating Angles: Off-Balancing and Control'
    ]
   } else if (selectedSport === 'MMA') {
    allIdeas = [
     'MMA Takedown Defense: Sprawling and Counter-Attacks',
     'Ground and Pound: Maintaining Position and Striking',
     'Cage Wrestling: Using the Fence to Your Advantage',
     'Submission Defense: Escaping Common Holds',
     'Stand-up Game: Striking to Grappling Transitions',
     'Mental Toughness: Preparing for Competition',
     'Weight Cutting: Safe and Effective Methods',
     'Match Planning: Studying Opponents and Strategy',
     'Clinch Work: Controlling and Striking in Close Range',
     'Dirty Boxing: Inside Fighting Techniques',
     'Leg Kick Defense: Checking and Countering',
     'Transition Training: Blending Disciplines Seamlessly',
     'Recovery Methods: Between Rounds and Training',
     'Cardio for MMA: Specific Energy System Development',
     'Fight IQ: Reading Situations and Adapting',
     'Pre-Fight Routine: Mental and Physical Preparation',
     'Post-Fight Analysis: Learning from Performance',
     'Sparring Safety: Training Hard While Staying Healthy',
     'Nutrition for Fighters: Fueling Performance',
     'Injury Prevention: Staying Healthy Long-term',
     'Video Study: Breaking Down Opponents',
     'Pressure Fighting: Moving Forward Effectively',
     'Counter-Fighting: Timing and Distance Management',
     'Championship Mindset: Developing Elite Mental Toughness'
    ]
   } else if (selectedSport === 'boxing') {
    allIdeas = [
     'Boxing Footwork: Angles and Distance Management',
     'Power Punching: Generating Force and Accuracy',
     'Defensive Boxing: Head Movement and Blocking',
     'Combination Striking: Flowing Punch Sequences',
     'Counter-Punching: Reading and Responding',
     'Ring Generalship: Controlling Space and Pace',
     'Conditioning: Boxing-Specific Fitness Training',
     'Mental Game: Confidence and Focus in the Ring',
     'Jab Mastery: The Most Important Punch in Boxing',
     'Body Work: Targeting and Effectiveness',
     'Slip and Counter: Defensive Offense Techniques',
     'Infighting: Close-Range Boxing Skills',
     'Southpaw vs Orthodox: Style Matchup Strategies',
     'Ring Cutting: Trapping Your Opponent',
     'Hand Speed Development: Training for Quickness',
     'Punch Selection: Choosing the Right Tool',
     'Rhythm and Timing: Finding Your Boxing Flow',
     'Pressure Boxing: Walking Down Opponents',
     'Boxing Psychology: Mental Warfare in the Ring',
     'Amateur vs Pro Boxing: Key Differences',
     'Sparring Etiquette: Training Partner Respect',
     'Weight Management: Making Weight Safely',
     'Equipment Selection: Gloves, Wraps, and Gear',
     'Recovery and Injury Prevention: Longevity in Boxing'
    ]
   } else if (selectedSport === 'wrestling') {
    allIdeas = [
     'Wrestling Takedowns: Double Leg and Single Leg Mastery',
     'Sprawl Defense: Stopping Takedown Attempts',
     'Top Position Control: Rides and Breakdowns',
     'Escapes from Bottom: Hip Heists and Stand-ups',
     'Pinning Combinations: Securing the Fall',
     'Conditioning: Wrestling-Specific Strength and Cardio',
     'Mental Toughness: Grinding Through Adversity',
     'Competition Preparation: Cutting Weight and Strategy',
     'Chain Wrestling: Flowing Between Attacks',
     'Neutral Position: Ties and Hand Fighting',
     'Mat Wrestling: Ground Control and Positioning',
     'Scrambling: Chaos Wrestling and Recovery',
     'Cradles and Tilts: Securing Back Points',
     'Funk Wrestling: Unorthodox Techniques',
     'Greco-Roman Techniques: Upper Body Wrestling',
     'Freestyle Wrestling: Leg Attacks and Defense',
     'Folkstyle Wrestling: American Collegiate Style',
     'Wrestling Psychology: Mental Edge on the Mat',
     'Technique Drilling: Perfect Practice Methods',
     'Strength Training: Wrestling-Specific Power',
     'Flexibility: Mobility for Wrestling Performance',
     'Tournament Strategy: Peaking at the Right Time',
     'Coaching Wrestling: Teaching Techniques Effectively',
     'Wrestling History: Learning from the Legends'
    ]
   } else {
    // Professional comprehensive ideas for any sport
    allIdeas = [
     // Fundamental Skills
     `${selectedSport} Fundamentals: Mastering Core Techniques`,
     `Basic ${selectedSport} Skills: Building a Strong Foundation`,
     `Advanced ${selectedSport} Techniques for Elite Performance`,
     `${selectedSport} Form and Technique: Perfecting Execution`,
     `Coordination and Timing in ${selectedSport}`,

     // Strategic and Tactical
     `${selectedSport} Strategy: Reading and Reacting to Competition`,
     `Match Planning in ${selectedSport}: Preparation for Success`,
     `Tactical Awareness: Understanding ${selectedSport} Situations`,
     `Decision Making Under Pressure in ${selectedSport}`,
     `Competition Analysis: Breaking Down ${selectedSport} Performance`,

     // Physical Development
     `${selectedSport} Conditioning: Sport-Specific Fitness Training`,
     `Strength Training for ${selectedSport} Athletes`,
     `Speed and Agility Development in ${selectedSport}`,
     `Flexibility and Mobility for ${selectedSport} Performance`,
     `Endurance Training: Building ${selectedSport} Stamina`,

     // Mental Performance
     `Mental Game in ${selectedSport}: Building Confidence and Focus`,
     `Competition Psychology: Performing Under Pressure in ${selectedSport}`,
     `Goal Setting and Motivation in ${selectedSport}`,
     `Visualization Techniques for ${selectedSport} Success`,
     `Overcoming Adversity in ${selectedSport}`,

     // Training and Development
     `${selectedSport} Drills: Effective Practice Methods`,
     `Progressive Training: Skill Development in ${selectedSport}`,
     `Practice Organization: Maximizing ${selectedSport} Training Time`,
     `Skill Transfer: From Practice to Competition in ${selectedSport}`,
     `Youth Development: Teaching ${selectedSport} to Young Athletes`,

     // Support and Recovery
     `Injury Prevention in ${selectedSport}: Smart Training Methods`,
     `Recovery and Regeneration for ${selectedSport} Athletes`,
     `Nutrition for ${selectedSport}: Fueling Peak Performance`,
     `Equipment Selection and Maintenance in ${selectedSport}`,
     `${selectedSport} Safety: Protocols and Best Practices`,

     // Leadership and Team
     `Leadership in ${selectedSport}: Captain Qualities and Communication`,
     `Team Chemistry: Building Unity in ${selectedSport}`,
     `Coaching ${selectedSport}: Teaching and Mentoring Athletes`,
     `${selectedSport} Culture: Building Winning Traditions`,
     `Communication Skills for ${selectedSport} Teams`
    ]
   }
   
   // Add realistic delay for professional content generation
   await new Promise(resolve => setTimeout(resolve, 1500))

   // Randomize and select 8 different suggestions from the larger pool
   const shuffled = allIdeas.sort(() => 0.5 - Math.random())
   setAISuggestions(shuffled.slice(0, 8))
  } catch (error) {
   console.error('Error generating ideas:', error)
  } finally {
   setGeneratingIdeas(false)
  }
 }

 const enhanceDescription = async () => {
  const currentTitle = watch('title')
  const currentDescription = watch('description')

  if (!currentTitle && !currentDescription) {
   alert('Please enter a lesson title and description first')
   return
  }

  if (!selectedSport) {
   alert('Please select a sport first')
   return
  }

  setEnhancingContent(true)
  try {
   // Use title analysis to create enhanced, relevant description
   const titleAnalysis = analyzeLessonTitle(currentTitle, selectedSport)

   // Enhanced fallback using title analysis and sport context
   let enhanced = currentDescription

   if (currentDescription.length < 100) {
    enhanced = `${currentDescription}

## Lesson Overview
This comprehensive ${selectedSport} lesson on "${currentTitle}" focuses on ${titleAnalysis.primaryFocus} through ${titleAnalysis.trainingType}. Drawing from elite-level coaching experience, this session will develop the specific skills needed to excel in this area.

### Key Skills You'll Master:
${titleAnalysis.keySkills.slice(0, 4).map(skill => `• **${skill}**: Focus on precise execution and consistent application`).join('\n')}

${titleAnalysis.techniques.length > 0 ? `### Specific Techniques You'll Learn:
${titleAnalysis.techniques.slice(0, 3).map(technique => `• **${technique}**: Master the fundamental mechanics and timing`).join('\n')}

` : ''}### What's Included:
• **Technical Breakdown**: Step-by-step instruction specifically for "${currentTitle}"
• **Common Mistakes**: Identify and correct errors in ${titleAnalysis.keySkills[0] || 'these skills'}
• **Practice Drills**: Progressive exercises designed for ${titleAnalysis.trainingType.toLowerCase()}
• **Game Application**: Real-world scenarios for ${selectedSport} competition
• **Safety & Tips**: Injury prevention and performance optimization

### Prerequisites:
• Basic understanding of ${selectedSport} fundamentals
• Appropriate fitness level for ${watch('level')?.toLowerCase() || 'your skill level'}
• Required equipment and proper training environment

Perfect for ${watch('level')?.toLowerCase() || 'all skill levels'}, this lesson combines theoretical understanding with practical application to ensure lasting improvement and technical mastery in ${titleAnalysis.primaryFocus.toLowerCase()}.

*This detailed content helps athletes understand exactly what they'll learn and coaches can use it for reference.*`
   } else {
    enhanced = `${currentDescription}

## Enhanced Training Focus: ${currentTitle}

### Additional Key Skills Development:
${titleAnalysis.keySkills.slice(0, 3).map(skill => `• **${skill}**: Advanced progression and refinement techniques`).join('\n')}

${titleAnalysis.techniques.length > 0 ? `### Advanced Techniques:
${titleAnalysis.techniques.slice(0, 2).map(technique => `• **${technique}**: Elite-level execution and application`).join('\n')}

` : ''}### Enhanced Content Includes:
• **Detailed Explanations**: In-depth analysis of technique mechanics
• **Progressive Skill-Building**: Systematic exercises for continuous improvement
• **Sport-Specific Applications**: Direct application to ${selectedSport} competition
• **Performance Optimization**: Methods designed for ${titleAnalysis.primaryFocus.toLowerCase()}
• **Expert Guidance**: Championship-level coaching insights and methodology

This ${titleAnalysis.trainingType.toLowerCase()} maximizes learning outcomes through systematic, expert-guided instruction tailored specifically for "${currentTitle}" mastery.

*Enhanced with professional coaching methodology and proven training principles.*`
   }

   reset({
    ...watch(),
    description: enhanced
   })
  } catch (error) {
   console.error('Error enhancing content:', error)
  } finally {
   setEnhancingContent(false)
  }
 }

 const applySuggestion = (suggestion: string) => {
  reset({
   ...watch(),
   title: suggestion
  })
  setAISuggestions([])
 }

 if (loadingRole || authLoading) {
  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cardinal mx-auto"></div>
     <p className="mt-2 text-gray-600">Loading...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader />
   <div className="max-w-6xl mx-auto px-4 py-6">
    <h1>Creator Dashboard</h1>
    <p>Coming soon...</p>
   </div>
  </div>
 )
}
