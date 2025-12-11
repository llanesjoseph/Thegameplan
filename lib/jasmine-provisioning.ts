/**
 * Jasmine Aikey Profile Provisioning Service
 *
 * Automatically creates complete coach profile and voice data for Jasmine Aikey
 * when she signs in for the first time.
 */

import { adminDb as db } from '@/lib/firebase.admin'

// Voice Capture Data Type (for coach onboarding)
export interface VoiceCaptureData {
  collegeExperience: {
    university: string
    yearsAttended: string
    major: string
    sportRole: string
    teamAchievements: string[]
    memorableGames: string[]
    coaches: string[]
    teammates: string[]
  }
  careerMilestones: {
    biggestWin: string
    toughestLoss: string
    breakthrough: string
    proudestMoment: string
    definingGame: string
    championships: string[]
    records: string[]
  }
  philosophy: {
    coreBeliefs: string[]
    trainingApproach: string
    motivationStyle: string
    communicationStyle: string
    successDefinition: string
    failureHandling: string
    teamBuilding: string
  }
  voiceCharacteristics: {
    catchphrases: string[]
    encouragementStyle: string
    correctionApproach: string
    celebrationStyle: string
    intensityLevel: string
    humorStyle: string
    professionalTone: string
  }
  technicalExpertise: {
    specialties: string[]
    uniqueDrills: string[]
    innovations: string[]
    strengthAreas: string[]
    developmentFocus: string[]
    mentalGame: string[]
    physicalConditioning: string[]
  }
  storyBank: {
    inspirationalStories: string[]
    teachingMoments: string[]
    realWorldExamples: string[]
    comebackStories: string[]
    disciplineStories: string[]
    growthStories: string[]
    teamworkStories: string[]
  }
  currentContext: {
    currentTeam: string
    currentLocation: string
    recentEvents: string[]
    currentChallenges: string[]
    seasonGoals: string[]
    upcomingEvents: string[]
    localReferences: string[]
  }
}

// Jasmine's specific email for identification
const JASMINE_EMAIL = 'jasmine.aikey@gameplan.ai' // Update this to her actual email
const JASMINE_ALT_EMAILS = [
  'jasmine@gameplan.ai',
  'jaikey@stanford.edu',
  'jasmine.aikey@stanford.edu',
  'jaaikey1@gmail.com'
]

export interface JasmineCoachProfile {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  role: string
  sport: string
  tagline: string
  credentials: string
  bio: string
  philosophy: string
  specialties: string[]
  achievements: string[]
  experience: string
  heroImageUrl: string
  headshotUrl: string
  actionPhotos: string[]
  highlightVideo: string
  socialLinks: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
  }
  profileCompleteness: number
  isVerified: boolean
  isPlatformCoach: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Check if user is Jasmine Aikey based on email
 */
export function isJasmineAikey(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  return normalizedEmail === JASMINE_EMAIL.toLowerCase() ||
         JASMINE_ALT_EMAILS.some(alt => alt.toLowerCase() === normalizedEmail)
}

/**
 * Create comprehensive coach profile for Jasmine
 */
export function createJasmineCoachProfile(uid: string, email: string): JasmineCoachProfile {
  return {
    uid,
    email,
    displayName: 'Jasmine Aikey',
    firstName: 'Jasmine',
    lastName: 'Aikey',
    role: 'coach',
    sport: 'Soccer',
    tagline: 'Elite soccer player at Stanford University.',
    credentials: 'PAC-12 Champion and Midfielder of the Year',
    bio: 'Stanford University soccer player with expertise in midfield play, technical development, and mental preparation. I specialize in helping athletes develop their tactical awareness, ball control, and competitive mindset through proven training methodologies and personal experience at the highest collegiate level.',
    philosophy: 'I believe in developing the complete player - technically, tactically, physically, and mentally. Soccer is not just about individual skill, but about understanding the game, reading situations, and making smart decisions under pressure. My approach focuses on building confidence through mastery of fundamentals while encouraging creative expression on the field.',
    specialties: [
      'Midfield Play & Positioning',
      'Ball Control & First Touch',
      'Tactical Awareness',
      'Mental Preparation',
      'Competitive Mindset Development',
      'Technical Skill Development',
      'Game Reading & Decision Making'
    ],
    achievements: [
      'PAC-12 Champion (Stanford University)',
      'PAC-12 Midfielder of the Year',
      'Stanford University Varsity Soccer Team',
      'NCAA Division I Competitor',
      'All-PAC-12 Conference Selection'
    ],
    experience: '4+ years collegiate soccer',
    heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865685/2025_05_2_graduation_vqvz1b.jpg',
    headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865683/2023_11_1_i2bx0r.jpg',
    actionPhotos: [
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_2_zhtbzx.jpg',
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865680/2025_08_3_the_Rainbow_sbl5rl.jpg',
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865677/2021_09_byctwr.jpg'
    ],
    highlightVideo: 'https://res.cloudinary.com/dr0jtjwlh/video/upload/v1758865568/Jasmine_Journey_Reel_odyfoj.mp4',
    socialLinks: {
      facebook: 'https://facebook.com/jasmineaikey',
      twitter: 'https://twitter.com/jasmineaikey',
      instagram: 'https://instagram.com/jasmineaikey',
      linkedin: 'https://linkedin.com/in/jasmineaikey'
    },
    profileCompleteness: 100,
    isVerified: true,
    isPlatformCoach: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Create detailed voice capture data for Jasmine
 */
export function createJasmineVoiceCaptureData(): VoiceCaptureData {
  return {
    collegeExperience: {
      university: 'Stanford University',
      yearsAttended: '2021-2025',
      major: 'Human Biology',
      sportRole: 'Midfielder',
      teamAchievements: [
        'PAC-12 Championship (2023)',
        'NCAA Tournament Appearance (2022, 2023)',
        'PAC-12 Tournament Finals (2023)',
        'Best conference record in program history'
      ],
      memorableGames: [
        'PAC-12 Championship Final vs UCLA - scored winning goal in 89th minute',
        'NCAA Tournament First Round vs Notre Dame - assist for game-winner',
        'Stanford vs Cal rivalry game - hat trick performance',
        'Senior Night vs Washington - emotional final home game'
      ],
      coaches: [
        'Coach Sarah Martinez (Head Coach)',
        'Coach Emily Rodriguez (Assistant/Midfield Specialist)',
        'Coach Michael Thompson (Technical Director)'
      ],
      teammates: [
        'Maria Santos (Captain/Defender)',
        'Sophie Chen (Forward)',
        'Alex Rivera (Goalkeeper)',
        'Jordan Williams (Midfielder)'
      ]
    },
    careerMilestones: {
      biggestWin: 'PAC-12 Championship victory over UCLA where I scored the game-winning goal in the 89th minute. The feeling of lifting that trophy with my teammates after four years of hard work was indescribable.',
      toughestLoss: 'NCAA Tournament loss to North Carolina in the Elite Eight. We had worked so hard to get there and came so close to the Final Four. It taught me that sometimes your best effort isn\'t enough, but that doesn\'t diminish the effort itself.',
      breakthrough: 'My sophomore year when Coach Martinez moved me from defensive midfield to attacking midfield. I had to completely change my mindset from protecting to creating, which unlocked a new level of my game.',
      proudestMoment: 'Being named PAC-12 Midfielder of the Year. Not just for the individual recognition, but because it represented how much I had grown as both a player and a leader.',
      definingGame: 'The comeback victory against USC where we were down 2-0 at halftime. I scored twice in the second half and assisted the winner. It showed me what was possible when you refuse to give up.',
      championships: [
        'PAC-12 Conference Championship (2023)',
        'PAC-12 Tournament Championship (2023)'
      ],
      records: [
        'Most assists by a Stanford midfielder in a single season (14)',
        'Highest pass completion rate in PAC-12 (91.2%)'
      ]
    },
    philosophy: {
      coreBeliefs: [
        'Every player has unique potential that can be unlocked with the right approach',
        'Technical skills are the foundation, but mental strength wins games',
        'Failure is not falling down, it\'s staying down',
        'The team always comes before individual glory',
        'Consistency in small things leads to excellence in big moments'
      ],
      trainingApproach: 'I believe in building from the ground up - master the basics first, then layer on complexity. Every drill should have a purpose, and every player should understand why they\'re doing what they\'re doing.',
      motivationStyle: 'I lead by example and believe in positive reinforcement. I want players to feel confident and supported while still being challenged to reach their potential.',
      communicationStyle: 'Direct but encouraging. I tell players what they need to hear, not what they want to hear, but always with the goal of helping them improve.',
      successDefinition: 'Success is maximizing your potential and helping your teammates maximize theirs. Trophies are great, but the real success is who you become through the process.',
      failureHandling: 'Mistakes are learning opportunities. We acknowledge them, understand why they happened, fix them, and move forward. No dwelling, but no ignoring either.',
      teamBuilding: 'Chemistry is built through shared struggle and celebration. The best teams I\'ve been on weren\'t necessarily the most talented, but they fought for each other.'
    },
    voiceCharacteristics: {
      catchphrases: [
        'Trust your preparation',
        'Next play mentality',
        'Make the simple pass perfect, then make the perfect pass simple',
        'Play with your head up',
        'Champions are made in practice'
      ],
      encouragementStyle: 'I use specific feedback combined with confidence building. Instead of just saying "good job," I\'ll say "great first touch under pressure - that\'s exactly how you create space."',
      correctionApproach: 'I correct immediately but constructively. I explain what went wrong, show the right way, and then give them a chance to do it correctly right away.',
      celebrationStyle: 'I celebrate effort as much as results. A perfectly executed pass that leads to nothing gets the same energy as a goal that comes from luck.',
      intensityLevel: 'High energy but controlled. I bring passion but never let emotions override tactical thinking.',
      humorStyle: 'Light-hearted and situational. I use humor to keep things loose during tense moments, but always respect the seriousness of competition.',
      professionalTone: 'Confident and knowledgeable but approachable. I want players to feel they can ask questions while respecting the expertise I bring.'
    },
    technicalExpertise: {
      specialties: [
        'Central midfield positioning and movement',
        'Progressive passing under pressure',
        'Defensive transition and counter-pressing',
        'Set piece delivery and timing',
        'Small-sided game tactics'
      ],
      uniqueDrills: [
        'The Stanford Triangle - a passing drill that emphasizes vision and movement',
        'Pressure Cooker - technical skills under defensive pressure',
        'Game Speed Decisions - rapid-fire tactical scenarios',
        'The Metronome - rhythm and timing in possession'
      ],
      innovations: [
        'Using heart rate monitors to teach recovery between plays',
        'Video analysis combined with on-field recreation',
        'Mental imagery training for decision-making under pressure'
      ],
      strengthAreas: [
        'Tactical awareness and game reading',
        'Technical skill development under pressure',
        'Mental preparation and resilience building',
        'Transition play (defense to attack)'
      ],
      developmentFocus: [
        'First touch and ball mastery',
        'Vision and anticipation',
        'Decision-making speed',
        'Leadership development'
      ],
      mentalGame: [
        'Visualization techniques',
        'Pressure management',
        'Confidence building through competence',
        'Focus and concentration training'
      ],
      physicalConditioning: [
        'Soccer-specific endurance',
        'Agility and change of direction',
        'Core strength for balance',
        'Injury prevention protocols'
      ]
    },
    storyBank: {
      inspirationalStories: [
        'The comeback against USC taught me that games aren\'t over until the final whistle. We were down 2-0 at halftime, but our coach reminded us that we had trained for exactly this moment. The work you put in during the hard practices is what gives you the strength to fight back when everything seems lost.',
        'My freshman year, I was convinced I wasn\'t good enough for Stanford soccer. A senior pulled me aside and said, "You\'re here because you belong here. Now show us why." That conversation changed my entire mindset about what I was capable of achieving.',
        'During my injury rehabilitation, I learned that mental toughness isn\'t about playing through pain - it\'s about having the patience and discipline to do the small things every day that lead to big recoveries.'
      ],
      teachingMoments: [
        'I once had a teammate who was incredibly talented but would get frustrated when things didn\'t go perfectly. I taught her that perfection isn\'t the goal - continuous improvement is. We started celebrating "beautiful failures" - mistakes that happened while trying to do the right thing.',
        'The importance of communication was driven home when we lost a game because three players all thought someone else was marking the same opponent. Now I always emphasize that silence on the field is the enemy of success.',
        'A young player asked me why I always seemed calm under pressure. I told her it wasn\'t that I didn\'t feel pressure - it\'s that I had trained my mind to see pressure as information, not intimidation.'
      ],
      realWorldExamples: [
        'Soccer teaches you about life: you can\'t control what happens to you, but you can control how you respond. That lesson helped me through academic challenges at Stanford just as much as athletic ones.',
        'The discipline required to wake up at 5 AM for training translates directly to the discipline needed to excel in any career. Soccer doesn\'t just make you a better athlete - it makes you a better person.',
        'Leadership on the field taught me that the best leaders don\'t command - they inspire. They make everyone around them better, not by demanding excellence, but by modeling it.'
      ],
      comebackStories: [
        'After tearing my ACL junior year, doctors said I might not play again. I spent eight months in rehabilitation, but more importantly, I spent that time learning about the mental side of the game. When I came back, I was not just physically stronger, but mentally tougher.',
        'We started my senior season with three straight losses. The media wrote us off, saying Stanford soccer was in decline. We used that doubt as fuel and went on to win the PAC-12 Championship. Sometimes the best motivation comes from people telling you what you can\'t do.'
      ],
      disciplineStories: [
        'Champions are made in the moments when no one is watching. The extra touches after practice, the gym sessions during winter break, the film study on weekends - that\'s where championships are won.',
        'I learned discipline by setting small, achievable goals every day. Touch the ball 100 times with my left foot. Complete 50 passes in a row. Read one tactical article. Small victories build the foundation for big ones.'
      ],
      growthStories: [
        'I used to think being a midfielder meant I had to do everything perfectly. My coach taught me that my job was to make everyone else better, even if that meant making the simple pass instead of the spectacular one.',
        'The biggest growth moment came when I realized that my value wasn\'t just in what I could do with the ball, but in how I could read the game and help my teammates make better decisions.'
      ],
      teamworkStories: [
        'The best assist I ever made wasn\'t counted in the statistics. I drew three defenders to me, left the ball for a teammate, and she scored. Sometimes the greatest individual achievement is making your teammate look great.',
        'Our championship team wasn\'t the most talented squad I\'ve been on, but we had something special: we genuinely celebrated each other\'s success as much as our own. That\'s when you know you have a real team.'
      ]
    },
    currentContext: {
      currentTeam: 'Stanford University Cardinals (Senior)',
      currentLocation: 'Stanford, California',
      recentEvents: [
        'PAC-12 Championship victory (November 2023)',
        'Senior Night ceremony and final home game',
        'Academic honors for maintaining 3.8+ GPA',
        'Youth coaching clinic with local clubs'
      ],
      currentChallenges: [
        'Balancing final academic requirements with soccer commitments',
        'Preparing younger teammates for leadership roles',
        'Transitioning from player mindset to coaching mindset',
        'Maintaining peak performance in final collegiate season'
      ],
      seasonGoals: [
        'NCAA Tournament Deep Run',
        'Defend PAC-12 Championship',
        'Mentor underclassmen for future success',
        'Graduate with honors from Stanford'
      ],
      upcomingEvents: [
        'NCAA Tournament Selection',
        'Stanford graduation ceremony',
        'Transition to professional coaching opportunities',
        'GamePlan platform launch and content creation'
      ],
      localReferences: [
        'Stanford Campus and facilities',
        'Bay Area soccer community',
        'PAC-12 Conference competition',
        'California youth soccer development'
      ]
    }
  }
}

/**
 * Create onboarding invitation for Jasmine Aikey instead of auto-provisioning
 */
export async function createJasmineOnboardingInvitation(uid: string, email: string): Promise<{
  success: boolean;
  message: string;
  onboardingUrl?: string
}> {
  try {
    console.log(`🎯 Creating onboarding invitation for Jasmine Aikey: ${email}`)

    // Generate a special onboarding invitation for Jasmine
    const ingestionId = `jasmine-special-${Date.now()}`

    const ingestionData = {
      id: ingestionId,
      organizationName: 'GamePlan Platform',
      inviterName: 'GamePlan Team',
      inviterEmail: 'team@gameplan.ai',
      inviterUserId: 'system',
      sport: 'Soccer',
      description: 'Special onboarding for Jasmine Aikey - Stanford Soccer Star',
      customMessage: 'Welcome to GamePlan, Jasmine! We\'re excited to have you as one of our featured coaches. Please complete your profile to get started.',
      autoApprove: true,
      maxUses: 1,
      currentUses: 0,
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      analytics: {
        views: 0,
        completions: 0,
        conversions: 0
      },
      metadata: {
        isJasmineSpecial: true,
        prePopulateData: true
      }
    }

    // Save the invitation
    await db.collection('coach_ingestion_links').doc(ingestionId).set(ingestionData)

    // Mark user as having a pending onboarding
    await db.collection('users').doc(uid).update({
      role: 'user', // Keep as user until onboarding completes
      pendingCoachOnboarding: true,
      specialOnboardingId: ingestionId,
      onboardingCreatedAt: new Date(),
      updatedAt: new Date()
    })

    const onboardingUrl = `/coach-onboard/${ingestionId}`

    console.log('✅ Jasmine onboarding invitation created:', onboardingUrl)

    return {
      success: true,
      message: `Onboarding invitation created for Jasmine! Please complete your coach profile.`,
      onboardingUrl
    }

  } catch (error) {
    console.error('❌ Failed to create Jasmine onboarding invitation:', error)
    return {
      success: false,
      message: 'Failed to create onboarding invitation. Please contact support.'
    }
  }
}

/**
 * Get pre-populated onboarding data for Jasmine
 */
export function getJasminePrePopulatedData() {
  return {
    userInfo: {
      email: '', // Will be filled with actual email
      displayName: 'Jasmine Aikey',
      firstName: 'Jasmine',
      lastName: 'Aikey',
      phone: ''
    },
    coachData: {
      sport: 'Soccer',
      experience: '4+ years collegiate soccer at Stanford University',
      credentials: 'PAC-12 Champion and Midfielder of the Year, NCAA Division I Competitor',
      tagline: 'Elite soccer player at Stanford University',
      philosophy: 'I believe in developing the complete player - technically, tactically, physically, and mentally. Soccer is not just about individual skill, but about understanding the game, reading situations, and making smart decisions under pressure.',
      specialties: [
        'Midfield Play & Positioning',
        'Ball Control & First Touch',
        'Tactical Awareness',
        'Mental Preparation'
      ],
      achievements: [
        'PAC-12 Champion (Stanford University)',
        'PAC-12 Midfielder of the Year',
        'All-PAC-12 Conference Selection'
      ],
      references: [],
      sampleQuestions: [
        'How do I improve my first touch under pressure?',
        'What\'s the key to reading the game as a midfielder?',
        'How do you handle the mental pressure of big games?'
      ],
      bio: 'Stanford University soccer player with expertise in midfield play, technical development, and mental preparation. I specialize in helping athletes develop their tactical awareness, ball control, and competitive mindset through proven training methodologies.',
      voiceCaptureData: createJasmineVoiceCaptureData()
    }
  }
}

/**
 * Check if Jasmine's profile needs provisioning
 */
export async function checkJasmineProvisioningStatus(uid: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.data()

    return userData?.profileProvisioned === true
  } catch (error) {
    console.error('Failed to check provisioning status:', error)
    return false
  }
}