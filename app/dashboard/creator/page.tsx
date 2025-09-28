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
 X,
 BookOpen,
 UserPlus,
 Send,
 AlertCircle,
 Loader2,
 Mail
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

// Simple content ideas function (client-safe replacement)
function getSimpleContentIdeas(sport: string): string[] {
  const sportIdeas: Record<string, string[]> = {
    basketball: [
      'Perfect Your Free Throw Technique',
      'Defensive Footwork Fundamentals',
      'Shooting Form and Follow-Through',
      'Dribbling Drills for Better Ball Control',
      'Post-Up Moves and Positioning',
      'Fast Break Execution',
      'Rebounding Techniques and Positioning',
      'Court Vision and Passing Skills'
    ],
    soccer: [
      'First Touch and Ball Control',
      'Shooting Accuracy Training',
      'Defensive Positioning and Tackling',
      'Passing Accuracy Under Pressure',
      'Crossing and Finishing',
      'Set Piece Strategies',
      'Goalkeeper Distribution',
      'Small-Sided Game Tactics'
    ],
    tennis: [
      'Serve Technique and Power',
      'Forehand Consistency',
      'Backhand Development',
      'Net Play and Volleys',
      'Return of Serve',
      'Court Positioning',
      'Mental Toughness Training',
      'Footwork and Movement'
    ],
    baseball: [
      'Batting Stance and Swing',
      'Pitching Mechanics',
      'Fielding Ground Balls',
      'Base Running Techniques',
      'Catching and Throwing',
      'Situational Hitting',
      'Defensive Positioning',
      'Mental Game Focus'
    ]
  }

  return sportIdeas[sport.toLowerCase()] || [
    'Fundamental Skills Development',
    'Physical Conditioning',
    'Mental Preparation',
    'Team Strategy',
    'Individual Technique',
    'Game Situation Practice',
    'Strength and Agility',
    'Video Analysis'
  ]
}

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
 
 const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'invitations'>('create')

 // Handle URL parameters for tab switching
 useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const tabParam = urlParams.get('tab')
  if (tabParam === 'invitations' || tabParam === 'manage' || tabParam === 'create') {
   setActiveTab(tabParam)
  }
 }, [])

 // Coach invitation form state
 const [invitationForm, setInvitationForm] = useState({
  email: '',
  name: '',
  sport: 'Soccer',
  customMessage: ''
 })
 const [invitationLoading, setInvitationLoading] = useState(false)
 const [invitationStatus, setInvitationStatus] = useState<{
  type: 'success' | 'error' | null
  message: string
 }>({ type: null, message: '' })
 
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

 // Handle coach invitation submission
 const handleCoachInvitation = async (e: React.FormEvent) => {
  e.preventDefault()
  setInvitationLoading(true)
  setInvitationStatus({ type: null, message: '' })

  try {
   // Validate form
   if (!invitationForm.email || !invitationForm.name || !invitationForm.sport) {
    setInvitationStatus({
     type: 'error',
     message: 'Please fill in all required fields (email, name, and sport)'
    })
    return
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   if (!emailRegex.test(invitationForm.email)) {
    setInvitationStatus({
     type: 'error',
     message: 'Please enter a valid email address'
    })
    return
   }

   // Send invitation
   const response = await fetch('/api/coach-ingestion/generate-link', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     organizationName: `${authUser?.displayName || 'GamePlan'} Coaching Network`,
     sport: invitationForm.sport,
     description: `Join as a ${invitationForm.sport} coach`,
     customMessage: invitationForm.customMessage || `Hi ${invitationForm.name}, I'd like to invite you to join our coaching platform!`,
     sendEmail: true,
     recipientEmail: invitationForm.email,
     recipientName: invitationForm.name,
     expiresInDays: 30,
     maxUses: 1,
     autoApprove: false
    })
   })

   const data = await response.json()

   if (response.ok && data.success) {
    setInvitationStatus({
     type: 'success',
     message: `Invitation sent successfully to ${invitationForm.name}! They will receive an email with onboarding instructions.`
    })

    // Reset form
    setInvitationForm({
     email: '',
     name: '',
     sport: 'Soccer',
     customMessage: ''
    })
   } else {
    throw new Error(data.error || 'Failed to send invitation')
   }

  } catch (error) {
   console.error('Error sending coach invitation:', error)
   setInvitationStatus({
    type: 'error',
    message: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.'
   })
  } finally {
   setInvitationLoading(false)
  }
 }
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

 // Enhanced Lesson Builder State
 const [lessonBuilderMode, setLessonBuilderMode] = useState<'basic' | 'advanced'>('basic')
 const [showLessonTemplates, setShowLessonTemplates] = useState(false)
 const [showMarkdownGuide, setShowMarkdownGuide] = useState(false)

 // Lesson Structure State
 const [lessonSections, setLessonSections] = useState<Array<{
   title: string
   type: string
   content: string
   duration?: string
   equipment?: string
 }>>([])

 const [learningObjectives, setLearningObjectives] = useState<string[]>([''])
 const [prerequisites, setPrerequisites] = useState('')

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

 // Enhanced Lesson Builder Helper Functions
 const addLessonSection = () => {
  setLessonSections([...lessonSections, {
   title: '',
   type: 'introduction',
   content: ''
  }])
 }

 const updateLessonSection = (index: number, field: string, value: string) => {
  const updated = [...lessonSections]
  updated[index] = { ...updated[index], [field]: value }
  setLessonSections(updated)
 }

 const removeLessonSection = (index: number) => {
  setLessonSections(lessonSections.filter((_, i) => i !== index))
 }

 const addLearningObjective = () => {
  setLearningObjectives([...learningObjectives, ''])
 }

 const updateLearningObjective = (index: number, value: string) => {
  const updated = [...learningObjectives]
  updated[index] = value
  setLearningObjectives(updated)
 }

 const removeLearningObjective = (index: number) => {
  setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
 }

 const applyLessonTemplate = (templateType: string) => {
  switch (templateType) {
   case 'comprehensive':
    setLessonSections([
     { title: 'Introduction', type: 'introduction', content: 'Brief overview of what we\'ll cover in this lesson...' },
     { title: 'Learning Objectives', type: 'theory', content: 'By the end of this lesson, students will be able to...' },
     { title: 'Prerequisites', type: 'theory', content: 'Students should be familiar with...' },
     { title: 'Main Theory', type: 'theory', content: 'Explain the key concepts and principles...' },
     { title: 'Demonstration', type: 'demonstration', content: 'Show the techniques step by step...' },
     { title: 'Guided Practice', type: 'practice', content: 'Students practice with instructor guidance...', duration: '20 minutes' },
     { title: 'Independent Practice', type: 'practice', content: 'Students practice independently...', duration: '15 minutes' },
     { title: 'Application', type: 'application', content: 'Apply skills in game-like situations...' },
     { title: 'Review & Assessment', type: 'review', content: 'Review key points and assess understanding...' },
     { title: 'Next Steps', type: 'homework', content: 'What students should practice before the next lesson...' }
    ])
    setLearningObjectives([
     'Understand the key concepts and principles',
     'Demonstrate proper technique execution',
     'Apply skills in practice scenarios',
     'Identify areas for continued improvement'
    ])
    break
   case 'skill-focused':
    setLessonSections([
     { title: 'Skill Introduction', type: 'introduction', content: 'Introduction to the specific skill we\'re developing...' },
     { title: 'Technique Breakdown', type: 'theory', content: 'Step-by-step breakdown of the technique...' },
     { title: 'Demonstration', type: 'demonstration', content: 'Instructor demonstrates the skill...' },
     { title: 'Drill 1: Basic Practice', type: 'practice', content: 'Basic repetition of the skill...', duration: '10 minutes' },
     { title: 'Drill 2: Progressive Difficulty', type: 'practice', content: 'Increase complexity or pressure...', duration: '15 minutes' },
     { title: 'Drill 3: Game Application', type: 'application', content: 'Use the skill in game-like situations...', duration: '10 minutes' },
     { title: 'Cool Down & Review', type: 'review', content: 'Review performance and key teaching points...' }
    ])
    setLearningObjectives([
     'Execute the specific skill with proper technique',
     'Apply the skill under varying levels of pressure',
     'Understand when and how to use the skill in games'
    ])
    break
   case 'game-analysis':
    setLessonSections([
     { title: 'Video Introduction', type: 'introduction', content: 'Overview of what we\'ll analyze in the footage...' },
     { title: 'Context & Setup', type: 'theory', content: 'Game situation and tactical context...' },
     { title: 'Video Analysis', type: 'demonstration', content: 'Break down the video clip by clip...' },
     { title: 'Key Learning Points', type: 'theory', content: 'Extract the main tactical or technical lessons...' },
     { title: 'Discussion', type: 'application', content: 'Students discuss what they observed...', duration: '10 minutes' },
     { title: 'Practice Application', type: 'practice', content: 'Practice the concepts from the video...', duration: '20 minutes' },
     { title: 'Reflection', type: 'review', content: 'How can we apply these lessons to our own game?' }
    ])
    setLearningObjectives([
     'Analyze game situations effectively',
     'Identify key tactical and technical elements',
     'Apply video insights to personal performance'
    ])
    break
  }
 }

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
    const uploadPath = `creators/${authUser.uid}/content/${Date.now()}_${videoFile.name}`

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
    const thumbRef = ref(storage, `creators/${authUser.uid}/content/thumb_${Date.now()}_${thumbFile.name}`)
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
   // Use simple content ideas (removed server-side imports to fix build)
   const simpleIdeas = getSimpleContentIdeas(selectedSport)
   const shuffled = simpleIdeas.sort(() => 0.5 - Math.random())
   setAISuggestions(shuffled.slice(0, 8))
  } catch (error) {
   console.error('Error generating ideas:', error)
   // Fallback to basic suggestions
   setAISuggestions(['Fundamental Skills', 'Advanced Techniques', 'Training Drills', 'Game Strategy'])
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
  <CreatorAccessGate>
   <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
    <AppHeader />
    <div className="max-w-6xl mx-auto px-4 py-6">
     <div className="mb-8">
      <h1 className="text-3xl  text-gray-900 mb-2">Creator Studio</h1>
      <p className="text-gray-600">Create and manage your training content</p>
     </div>

     {/* Stats Cards */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-sm">
       <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
         <Video className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
         <p className="text-sm  text-gray-600">Published Lessons</p>
         <p className="text-2xl  text-gray-900">{lessonCount}</p>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
       <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
         <Eye className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4">
         <p className="text-sm  text-gray-600">Total Views</p>
         <p className="text-2xl  text-gray-900">0</p>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
       <div className="flex items-center">
        <div className="p-2 bg-purple-100 rounded-lg">
         <Users className="h-6 w-6 text-purple-600" />
        </div>
        <div className="ml-4">
         <p className="text-sm  text-gray-600">Subscribers</p>
         <p className="text-2xl  text-gray-900">0</p>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
       <div className="flex items-center">
        <div className="p-2 bg-orange-100 rounded-lg">
         <TrendingUp className="h-6 w-6 text-orange-600" />
        </div>
        <div className="ml-4">
         <p className="text-sm  text-gray-600">Engagement</p>
         <p className="text-2xl  text-gray-900">0%</p>
        </div>
       </div>
      </div>
     </div>

     {/* Tab Navigation */}
     <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
      <button
       onClick={() => setActiveTab('create')}
       className={`flex-1 px-4 py-2 rounded-md text-sm  transition-colors ${
        activeTab === 'create'
         ? 'bg-white text-gray-900 shadow-sm'
         : 'text-gray-600 hover:text-gray-900'
       }`}
      >
       <Plus className="h-4 w-4 inline mr-2" />
       Create Content
      </button>
      <button
       onClick={() => setActiveTab('manage')}
       className={`flex-1 px-4 py-2 rounded-md text-sm  transition-colors ${
        activeTab === 'manage'
         ? 'bg-white text-gray-900 shadow-sm'
         : 'text-gray-600 hover:text-gray-900'
       }`}
      >
       <FileVideo className="h-4 w-4 inline mr-2" />
       Manage Content
      </button>
      <button
       onClick={() => setActiveTab('invitations')}
       className={`flex-1 px-4 py-2 rounded-md text-sm  transition-colors ${
        activeTab === 'invitations'
         ? 'bg-white text-gray-900 shadow-sm'
         : 'text-gray-600 hover:text-gray-900'
       }`}
      >
       <UserPlus className="h-4 w-4 inline mr-2" />
       Coach Invitations
      </button>
     </div>

     {uploadSuccess && (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
       <div className="flex">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <div className="ml-3">
         <p className="text-sm  text-green-800">
          Success! Your lesson has been published.
         </p>
         <button
          onClick={() => setUploadSuccess(false)}
          className="mt-2 text-sm text-green-600 hover:text-green-500"
         >
          Dismiss
         </button>
        </div>
       </div>
      </div>
     )}

     {/* Content Area */}
     {activeTab === 'create' ? (
      <div className="bg-white rounded-lg shadow-sm">
       <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
         <h2 className="text-lg  text-gray-900">Create New Lesson</h2>
         <button
          onClick={() => setShowAIFeatures(!showAIFeatures)}
          className="flex items-center px-3 py-2 text-sm  text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
         >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Assistant
         </button>
        </div>
       </div>

       {/* AI Features Panel */}
       {showAIFeatures && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
         <div className="max-w-4xl">
          <h3 className="text-lg  text-gray-900 mb-4 flex items-center">
           <Bot className="h-5 w-5 mr-2 text-purple-600" />
           AI Content Assistant
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Lesson Idea Generator */}
           <div className="space-y-4">
            <h4 className=" text-gray-900 flex items-center">
             <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
             Lesson Ideas Generator
            </h4>

            <div className="space-y-3">
             <div>
              <label className="block text-sm  text-gray-700 mb-1">
               Select Sport:
              </label>
              <select
               value={selectedSport}
               onChange={(e) => setSelectedSport(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
               <option value="BJJ">Brazilian Jiu-Jitsu</option>
               <option value="MMA">Mixed Martial Arts</option>
               <option value="boxing">Boxing</option>
               <option value="wrestling">Wrestling</option>
               <option value="soccer">Soccer</option>
               <option value="football">American Football</option>
               <option value="basketball">Basketball</option>
               <option value="tennis">Tennis</option>
               <option value="golf">Golf</option>
               <option value="swimming">Swimming</option>
               <option value="track">Track & Field</option>
               <option value="volleyball">Volleyball</option>
               <option value="baseball">Baseball</option>
               <option value="hockey">Hockey</option>
               <option value="gymnastics">Gymnastics</option>
              </select>
             </div>

             <button
              onClick={generateLessonIdeas}
              disabled={generatingIdeas}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm  rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
              {generatingIdeas ? (
               <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Ideas...
               </>
              ) : (
               <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Lesson Ideas
               </>
              )}
             </button>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
             <div className="mt-4 space-y-2">
              <h5 className="text-sm  text-gray-700">AI Suggestions:</h5>
              <div className="max-h-48 overflow-y-auto space-y-2">
               {aiSuggestions.map((suggestion, index) => (
                <button
                 key={index}
                 onClick={() => applySuggestion(suggestion)}
                 className="w-full text-left p-3 text-sm bg-white border border-gray-200 rounded-md hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                 {suggestion}
                </button>
               ))}
              </div>
              <button
               onClick={() => setAISuggestions([])}
               className="text-xs text-gray-500 hover:text-gray-700"
              >
               Clear suggestions
              </button>
             </div>
            )}
           </div>

           {/* Content Enhancer */}
           <div className="space-y-4">
            <h4 className=" text-gray-900 flex items-center">
             <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
             Content Enhancer
            </h4>
            <p className="text-sm text-gray-600">
             Add your lesson title and description, then click enhance to get detailed, professional content.
            </p>
            <button
             onClick={enhanceDescription}
             disabled={enhancingContent}
             className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm  rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
             {enhancingContent ? (
              <>
               <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
               Enhancing Content...
              </>
             ) : (
              <>
               <Wand2 className="h-4 w-4 mr-2" />
               Enhance Description
              </>
             )}
            </button>
           </div>
          </div>
         </div>
        </div>
       )}

       <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Title Field */}
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Lesson Title *
         </label>
         <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your lesson title..."
         />
         {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
         )}
        </div>

        {/* Description Field */}
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Description *
         </label>
         <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what students will learn in this lesson..."
         />
         {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
         )}
        </div>

        {/* Enhanced Lesson Builder Section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
         <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
           <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
           Full-Length Lesson Builder
          </h3>
          <div className="flex gap-2">
           <button
            type="button"
            onClick={() => setShowLessonTemplates(!showLessonTemplates)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded-full hover:bg-blue-200 transition-colors"
           >
            📋 Templates
           </button>
           <button
            type="button"
            onClick={() => setLessonBuilderMode(lessonBuilderMode === 'basic' ? 'advanced' : 'basic')}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 border border-purple-300 rounded-full hover:bg-purple-200 transition-colors"
           >
            {lessonBuilderMode === 'basic' ? '⚡ Advanced Mode' : '📝 Basic Mode'}
           </button>
          </div>
         </div>

         {/* Lesson Templates */}
         {showLessonTemplates && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
           <h4 className="font-medium text-gray-900 mb-3">Lesson Structure Templates</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
             type="button"
             onClick={() => applyLessonTemplate('comprehensive')}
             className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
             <div className="font-medium text-sm text-gray-900">Comprehensive Training</div>
             <div className="text-xs text-gray-600">Full lesson with theory, practice, and application</div>
            </button>
            <button
             type="button"
             onClick={() => applyLessonTemplate('skill-focused')}
             className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
             <div className="font-medium text-sm text-gray-900">Skill-Focused</div>
             <div className="text-xs text-gray-600">Targeted skill development with drills</div>
            </button>
            <button
             type="button"
             onClick={() => applyLessonTemplate('game-analysis')}
             className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
             <div className="font-medium text-sm text-gray-900">Game Analysis</div>
             <div className="text-xs text-gray-600">Video breakdown and tactical analysis</div>
            </button>
           </div>
          </div>
         )}

         {/* Advanced Lesson Builder */}
         {lessonBuilderMode === 'advanced' ? (
          <div className="space-y-6">
           {/* Lesson Sections */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
             Lesson Structure & Content
            </label>

            {lessonSections.map((section, index) => (
             <div key={index} className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
               <input
                type="text"
                value={section.title}
                onChange={(e) => updateLessonSection(index, 'title', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="Section title..."
               />
               <div className="flex items-center gap-2 ml-3">
                <select
                 value={section.type}
                 onChange={(e) => updateLessonSection(index, 'type', e.target.value)}
                 className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                 <option value="introduction">Introduction</option>
                 <option value="theory">Theory</option>
                 <option value="demonstration">Demonstration</option>
                 <option value="practice">Practice</option>
                 <option value="application">Application</option>
                 <option value="review">Review</option>
                 <option value="homework">Homework</option>
                </select>
                <button
                 type="button"
                 onClick={() => removeLessonSection(index)}
                 className="p-1 text-red-600 hover:text-red-800"
                >
                 <X className="h-4 w-4" />
                </button>
               </div>
              </div>

              <textarea
               value={section.content}
               onChange={(e) => updateLessonSection(index, 'content', e.target.value)}
               rows={6}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
               placeholder="Enter detailed content for this section. Supports markdown formatting..."
              />

              {section.type === 'practice' && (
               <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <label className="block text-xs font-medium text-blue-900 mb-2">Practice Details</label>
                <div className="grid grid-cols-2 gap-3">
                 <input
                  type="text"
                  value={section.duration || ''}
                  onChange={(e) => updateLessonSection(index, 'duration', e.target.value)}
                  className="px-2 py-1 text-xs border border-blue-300 rounded"
                  placeholder="Duration (e.g., 15 minutes)"
                 />
                 <input
                  type="text"
                  value={section.equipment || ''}
                  onChange={(e) => updateLessonSection(index, 'equipment', e.target.value)}
                  className="px-2 py-1 text-xs border border-blue-300 rounded"
                  placeholder="Equipment needed"
                 />
                </div>
               </div>
              )}
             </div>
            ))}

            <button
             type="button"
             onClick={addLessonSection}
             className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
            >
             <Plus className="h-5 w-5 mx-auto mb-1" />
             Add Section
            </button>
           </div>

           {/* Learning Objectives */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             Learning Objectives
            </label>
            <div className="space-y-2">
             {learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
               <input
                type="text"
                value={objective}
                onChange={(e) => updateLearningObjective(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="What will students learn or be able to do?"
               />
               <button
                type="button"
                onClick={() => removeLearningObjective(index)}
                className="p-2 text-red-600 hover:text-red-800"
               >
                <X className="h-4 w-4" />
               </button>
              </div>
             ))}
             <button
              type="button"
              onClick={addLearningObjective}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
             >
              <Plus className="h-4 w-4" />
              Add Learning Objective
             </button>
            </div>
           </div>

           {/* Prerequisites */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             Prerequisites & Required Knowledge
            </label>
            <textarea
             value={prerequisites}
             onChange={(e) => setPrerequisites(e.target.value)}
             rows={3}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
             placeholder="What should students know before taking this lesson? List any required skills or previous lessons..."
            />
           </div>
          </div>
         ) : (
          // Basic Mode - Enhanced textarea
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Lesson Content
            <span className="text-gray-500 text-xs ml-2">(Enhanced content from AI or manual entry)</span>
           </label>
           <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
             <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>📝 Rich Text Editor</span>
              <span>|</span>
              <span>Supports Markdown</span>
             </div>
             <button
              type="button"
              onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
              className="text-xs text-blue-600 hover:text-blue-800"
             >
              Formatting Guide
             </button>
            </div>

            {showMarkdownGuide && (
             <div className="bg-blue-50 p-3 text-xs border-b border-gray-300">
              <div className="grid grid-cols-2 gap-4">
               <div>
                <strong>Headers:</strong> # ## ###<br/>
                <strong>Bold:</strong> **text**<br/>
                <strong>Italic:</strong> *text*
               </div>
               <div>
                <strong>Lists:</strong> - item<br/>
                <strong>Links:</strong> [text](url)<br/>
                <strong>Code:</strong> `code`
               </div>
              </div>
             </div>
            )}

            <textarea
             value={detailedWriteup}
             onChange={(e) => setDetailedWriteup(e.target.value)}
             rows={20}
             className="w-full px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
             placeholder="Create your comprehensive lesson content here...

Example structure:
# Lesson Introduction
Brief overview of what we'll cover...

## Learning Objectives
- Students will be able to...
- Students will understand...

## Prerequisites
What students should know before this lesson...

## Main Content
### Section 1: Theory
Explain the concepts...

### Section 2: Demonstration
Show the techniques...

### Section 3: Practice
Guided practice activities...

## Review & Next Steps
Summary and what comes next..."
            />
           </div>
           <p className="mt-2 text-xs text-gray-500">
            💡 Pro tip: Use the AI Content Enhancer above to automatically generate comprehensive lesson content, then customize it here.
           </p>
          </div>
         )}
        </div>

        {/* Level Field */}
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Skill Level *
         </label>
         <select
          {...register('level')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
          <option value="All Levels">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
         </select>
        </div>

        {/* Video Upload */}
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Video File
          <span className="text-gray-500 text-xs ml-2">(Optional)</span>
         </label>

         {/* Upload Options */}
         <div className="mb-4 flex flex-wrap gap-2">
          <button
           type="button"
           onClick={() => setUseEnterpriseUpload(!useEnterpriseUpload)}
           className={`px-3 py-1 text-xs rounded-full transition-colors ${
            useEnterpriseUpload
             ? 'bg-blue-100 text-blue-700 border border-blue-300'
             : 'bg-gray-100 text-gray-600 border border-gray-300'
           }`}
          >
           {useEnterpriseUpload ? '✓' : ''} Enterprise Upload (Large Files)
          </button>

          <button
           type="button"
           onClick={() => setShowCompressionHelper(!showCompressionHelper)}
           className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors"
          >
           🗜️ Compression Helper
          </button>

          <button
           type="button"
           onClick={() => setShowInAppCompressor(!showInAppCompressor)}
           className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-colors"
          >
           📹 In-App Compressor
          </button>

          <button
           type="button"
           onClick={() => setShowGcsUploader(!showGcsUploader)}
           className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 transition-colors"
          >
           ☁️ Cloud Upload
          </button>
         </div>

         <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         />

         {videoFile && (
          <div className="mt-2 p-3 bg-gray-50 rounded border">
           <p className="text-sm text-gray-600">
            Selected: <span className="">{videoFile.name}</span>
           </p>
           <p className="text-xs text-gray-500">
            Size: {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
            {videoFile.size > 100 * 1024 * 1024 && (
             <span className="text-orange-600 ml-2">
              (Large file - consider using Enterprise Upload)
             </span>
            )}
           </p>

           {/* Upload Progress */}
           {uploadProgress.video > 0 && uploadProgress.video < 100 && (
            <div className="mt-2">
             <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Video Upload Progress</span>
              <span className="text-xs text-gray-600">{uploadProgress.video}%</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
              <div
               className="bg-blue-600 h-2 rounded-full transition-all duration-300"
               style={{ width: `${uploadProgress.video}%` }}
              />
             </div>

             {/* Upload Controls */}
             {uploadTasks.video && (
              <div className="flex gap-2 mt-2">
               {uploadPaused.video ? (
                <button
                 type="button"
                 onClick={() => resumeUpload('video')}
                 className="text-xs text-green-600 hover:text-green-700 flex items-center"
                >
                 <PlayCircle className="h-3 w-3 mr-1" />
                 Resume
                </button>
               ) : (
                <button
                 type="button"
                 onClick={() => pauseUpload('video')}
                 className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center"
                >
                 <Pause className="h-3 w-3 mr-1" />
                 Pause
                </button>
               )}
               <button
                type="button"
                onClick={() => cancelUpload('video')}
                className="text-xs text-red-600 hover:text-red-700 flex items-center"
               >
                <X className="h-3 w-3 mr-1" />
                Cancel
               </button>
              </div>
             )}
            </div>
           )}
          </div>
         )}
        </div>

        {/* Thumbnail Upload */}
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Thumbnail Image
          <span className="text-gray-500 text-xs ml-2">(Optional)</span>
         </label>
         <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         />

         {thumbFile && (
          <div className="mt-2 p-3 bg-gray-50 rounded border">
           <p className="text-sm text-gray-600">
            Selected: <span className="">{thumbFile.name}</span>
           </p>

           {/* Thumbnail Upload Progress */}
           {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
            <div className="mt-2">
             <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Thumbnail Upload Progress</span>
              <span className="text-xs text-gray-600">{uploadProgress.thumbnail}%</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
              <div
               className="bg-green-600 h-2 rounded-full transition-all duration-300"
               style={{ width: `${uploadProgress.thumbnail}%` }}
              />
             </div>
            </div>
           )}
          </div>
         )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
         <button
          type="submit"
          disabled={creating || (uploadProgress.video > 0 && uploadProgress.video < 100)}
          className="px-6 py-2 bg-blue-600 text-white  rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
         >
          {creating ? (
           <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Creating Lesson...
           </>
          ) : (
           <>
            <Upload className="h-4 w-4 mr-2" />
            Publish Lesson
           </>
          )}
         </button>
        </div>
       </form>
      </div>
     ) : activeTab === 'manage' ? (
      // Manage Content Tab
      <div className="bg-white rounded-lg shadow-sm">
       <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg  text-gray-900">Manage Content</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage your published lessons</p>
       </div>

       <div className="p-6">
        {loadingLessons ? (
         <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading lessons...</p>
         </div>
        ) : publishedLessons.length === 0 ? (
         <div className="text-center py-8">
          <FileVideo className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No lessons published yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first lesson to get started</p>
         </div>
        ) : (
         <div className="space-y-4">
          {publishedLessons.map((lesson) => (
           <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
             <div className="flex-1">
              <h3 className=" text-gray-900">{lesson.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lesson.description}</p>
              <div className="flex items-center mt-3 space-x-4 text-xs text-gray-500">
               <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {lesson.views || 0} views
               </span>
               <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {lesson.createdAt?.toDate ? lesson.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
               </span>
               <span className={`px-2 py-1 rounded-full text-xs ${
                lesson.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                lesson.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                lesson.level === 'Advanced' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
               }`}>
                {lesson.level}
               </span>
              </div>
             </div>
             <div className="flex items-center space-x-2 ml-4">
              <button
               onClick={() => window.open(`/lessons/${lesson.id}`, '_blank')}
               className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
               title="View lesson"
              >
               <ExternalLink className="h-4 w-4" />
              </button>
              <button
               onClick={() => deleteLesson(lesson.id)}
               className="p-2 text-gray-400 hover:text-red-600 transition-colors"
               title="Delete lesson"
              >
               <Trash2 className="h-4 w-4" />
              </button>
             </div>
            </div>
           </div>
          ))}
         </div>
        )}
       </div>
      </div>
     ) : (
      // Coach Invitations Tab
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       {/* Invitation Form */}
       <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">Invite Other Coaches</h2>
         <p className="text-sm text-gray-600 mt-1">Send personalized invitations to join your coaching network</p>
        </div>
        <div className="p-6">
         <form onSubmit={handleCoachInvitation} className="space-y-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Coach Email Address *</label>
           <input
            type="email"
            placeholder="coach@example.com"
            value={invitationForm.email}
            onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={invitationLoading}
           />
          </div>

          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Coach Name *</label>
           <input
            type="text"
            placeholder="John Smith"
            value={invitationForm.name}
            onChange={(e) => setInvitationForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={invitationLoading}
           />
          </div>

          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Sport *</label>
           <select
            value={invitationForm.sport}
            onChange={(e) => setInvitationForm(prev => ({ ...prev, sport: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={invitationLoading}
           >
            <option value="Brazilian Jiu-Jitsu">Brazilian Jiu-Jitsu</option>
            <option value="Mixed Martial Arts">Mixed Martial Arts</option>
            <option value="Boxing">Boxing</option>
            <option value="Wrestling">Wrestling</option>
            <option value="Soccer">Soccer</option>
            <option value="American Football">American Football</option>
            <option value="Basketball">Basketball</option>
            <option value="Tennis">Tennis</option>
            <option value="Golf">Golf</option>
            <option value="Swimming">Swimming</option>
            <option value="Track & Field">Track & Field</option>
            <option value="Volleyball">Volleyball</option>
            <option value="Baseball">Baseball</option>
            <option value="Hockey">Hockey</option>
            <option value="Gymnastics">Gymnastics</option>
           </select>
          </div>

          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
           <textarea
            placeholder="Hi [Coach Name], I'd love to have you join our coaching platform..."
            value={invitationForm.customMessage}
            onChange={(e) => setInvitationForm(prev => ({ ...prev, customMessage: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={invitationLoading}
           />
          </div>

          {/* Status Messages */}
          {invitationStatus.type && (
           <div className={`p-3 rounded-md text-sm ${
            invitationStatus.type === 'success'
             ? 'bg-green-50 text-green-800 border border-green-200'
             : 'bg-red-50 text-red-800 border border-red-200'
           }`}>
            <div className="flex items-center gap-2">
             {invitationStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
             ) : (
              <AlertCircle className="w-4 h-4" />
             )}
             {invitationStatus.message}
            </div>
           </div>
          )}

          <button
           type="submit"
           disabled={invitationLoading}
           className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
           {invitationLoading ? (
            <>
             <Loader2 className="w-4 h-4 animate-spin" />
             Sending Invitation...
            </>
           ) : (
            <>
             <Send className="w-4 h-4" />
             Send Invitation
            </>
           )}
          </button>
         </form>
        </div>
       </div>

       {/* Live Email Preview */}
       <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
         <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
         <p className="text-sm text-gray-600 mt-1">Live preview of the invitation email</p>
        </div>
        <div className="p-6">
         <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          {/* Email Header */}
          <div className="border-b border-gray-300 pb-4 mb-4">
           <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">GamePlan Coach Invitation</span>
           </div>
           <div className="text-xs text-gray-500">
            <p><strong>To:</strong> {invitationForm.email || 'coach@example.com'}</p>
            <p><strong>From:</strong> {authUser?.displayName || 'Coach'} via GamePlan</p>
            <p><strong>Subject:</strong> Join {authUser?.displayName || 'GamePlan'} Coaching Network</p>
           </div>
          </div>

          {/* Email Body */}
          <div className="space-y-4 text-sm">
           <div>
            <p className="font-medium text-gray-900">
             Hi {invitationForm.name || '[Coach Name]'},
            </p>
           </div>

           <div className="space-y-2">
            <p className="text-gray-700">
             {authUser?.displayName || 'A fellow coach'} has invited you to join the GamePlan coaching platform as a <strong>{invitationForm.sport || '[Sport]'}</strong> coach.
            </p>

            {invitationForm.customMessage && (
             <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <p className="text-blue-800 italic">"{invitationForm.customMessage}"</p>
             </div>
            )}

            <p className="text-gray-700">
             GamePlan is the premier platform for coaches to create training content, manage athletes, and build their coaching brand.
            </p>
           </div>

           <div className="bg-white border border-gray-300 rounded p-4">
            <p className="font-medium text-gray-900 mb-2">What you'll get:</p>
            <ul className="space-y-1 text-xs text-gray-600">
             <li>• Create and publish training lessons</li>
             <li>• Build your coaching profile and brand</li>
             <li>• Connect with athletes and other coaches</li>
             <li>• Access analytics and insights</li>
             <li>• Grow your coaching business</li>
            </ul>
           </div>

           <div className="text-center">
            <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
             Accept Invitation & Get Started
            </div>
            <p className="text-xs text-gray-500 mt-2">This invitation expires in 30 days</p>
           </div>

           <div className="text-xs text-gray-500 border-t border-gray-300 pt-3">
            <p>This invitation was sent by {authUser?.displayName || 'a coach'} through GamePlan.</p>
            <p>If you have any questions, you can reply to this email.</p>
           </div>
          </div>
         </div>
        </div>
       </div>
      </div>
     )}
    </div>

    {/* Compression Helper Modal */}
    {showCompressionHelper && videoFile && (
     <VideoCompressionHelper
      file={videoFile}
      onCompressed={(compressedFile) => {
       setVideoFile(compressedFile)
       setShowCompressionHelper(false)
      }}
     />
    )}

    {/* In-App Compressor Modal */}
    {showInAppCompressor && videoFile && (
     <InAppVideoCompressor
      file={videoFile}
      onCompressed={(compressedFile) => {
       setVideoFile(compressedFile)
       setShowInAppCompressor(false)
      }}
      onCancel={() => setShowInAppCompressor(false)}
     />
    )}

    {/* GCS Uploader Modal */}
    {showGcsUploader && (
     <GcsVideoUploader
      onUploadComplete={(videoUrl) => {
       // Handle the uploaded video URL
       console.log('GCS Upload completed:', videoUrl)
       setShowGcsUploader(false)
      }}
     />
    )}

    {/* Upload Manager */}
    <UploadManager />
   </div>
  </CreatorAccessGate>
 )
}
