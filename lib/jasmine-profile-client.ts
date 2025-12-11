/**
 * Client-side Jasmine Aikey Profile Data
 * Safe for use in client components
 */

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
}

// Jasmine's email patterns for identification
const JASMINE_EMAILS = [
  'jasmine.aikey@stanford.edu',
  'jasmine.aikey@gmail.com',
  'jasmine@aikey.com'
]

const JASMINE_ALT_EMAILS = [
  'jasmine.aikey@stanford.edu',
  'jasmine.aikey@gmail.com',
  'jasmine@aikey.com'
]

/**
 * Check if an email belongs to Jasmine Aikey
 */
export function isJasmineAikey(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  return JASMINE_EMAILS.some(jasmineEmail => 
    jasmineEmail.toLowerCase() === normalizedEmail
  ) || JASMINE_ALT_EMAILS.some(alt => alt.toLowerCase() === normalizedEmail)
}

/**
 * Create comprehensive coach profile for Jasmine (client-safe)
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
    headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
    actionPhotos: [
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
      'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg'
    ]
  }
}
